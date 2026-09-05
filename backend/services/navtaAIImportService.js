const path = require("path");

const {
  processNavtaDocument,
} = require("./navtaDocumentService");

const {
  renderPdfPages,
} = require("./navtaPdfVisualService");

const {
  analyseRenderedPages,
  analyseTextQuestions,
} = require("./navtaAIQuestionService");

const {
  createQuestionDiagram,
} = require("./navtaDiagramCropService");

const {
  uploadQuestionImage,
} = require("./navtaImageService");

// =====================================================
// VALID VALUES
// =====================================================

const VALID_SUBJECTS = new Set([
  "Physics",
  "Chemistry",
  "Maths",
  "Biology",
]);

const VALID_EXAMS = new Set([
  "NEET",
  "JEE",
  "Boards",
]);

const VALID_CLASSES = new Set([
  "Class 11",
  "Class 12",
]);

const VALID_DIFFICULTIES = new Set([
  "Easy",
  "Medium",
  "Hard",
]);

const VALID_QUESTION_TYPES = new Set([
  "mcq",
  "short",
  "long",
]);

// =====================================================
// SETTINGS
// =====================================================
//
// Keep this small while using Gemini free tier.
//
// 5-page PDF
// + NAVTA_AI_PAGES_PER_REQUEST=5
//
// should normally require about one Gemini detection call.
//
// =====================================================

const MAX_PDF_PAGES_PER_IMPORT = Math.max(
  1,
  Number(
    process.env.NAVTA_AI_MAX_PDF_PAGES || 5
  ) || 5
);

// This controls local crop + Cloudinary work.
//
// It does NOT make extra Gemini calls.

const QUESTION_PROCESS_CONCURRENCY = Math.max(
  1,
  Math.min(
    6,
    Number(
      process.env.NAVTA_AI_QUESTION_CONCURRENCY || 4
    ) || 4
  )
);

// =====================================================
// BASIC HELPERS
// =====================================================

const cleanString = (
  value = ""
) => {
  return String(
    value ?? ""
  ).trim();
};

const safeArray = (
  value
) => {
  return Array.isArray(
    value
  )
    ? value
    : [];
};

const getFileType = (
  fileName = ""
) => {
  return path
    .extname(
      fileName
    )
    .toLowerCase()
    .replace(
      ".",
      ""
    );
};

// =====================================================
// NORMALIZE SUBJECT
// =====================================================

const normalizeSubject = (
  value
) => {
  const text =
    cleanString(
      value
    ).toLowerCase();

  if (
    text === "physics"
  ) {
    return "Physics";
  }

  if (
    text === "chemistry"
  ) {
    return "Chemistry";
  }

  if (
    [
      "math",
      "maths",
      "mathematics",
    ].includes(
      text
    )
  ) {
    return "Maths";
  }

  if (
    text === "biology"
  ) {
    return "Biology";
  }

  return "";
};

// =====================================================
// NORMALIZE EXAM
// =====================================================

const normalizeExam = (
  value
) => {
  const text =
    cleanString(
      value
    ).toLowerCase();

  if (
    text.includes(
      "neet"
    )
  ) {
    return "NEET";
  }

  if (
    text.includes(
      "jee"
    )
  ) {
    return "JEE";
  }

  if (
    text.includes(
      "board"
    ) ||
    text.includes(
      "cbse"
    )
  ) {
    return "Boards";
  }

  return "";
};

// =====================================================
// NORMALIZE CLASS
// =====================================================

const normalizeClassLevel = (
  value
) => {
  const text =
    cleanString(
      value
    ).toLowerCase();

  if (
    text.includes(
      "11"
    ) ||
    text === "xi"
  ) {
    return "Class 11";
  }

  if (
    text.includes(
      "12"
    ) ||
    text === "xii"
  ) {
    return "Class 12";
  }

  return "";
};

// =====================================================
// VALIDATE DETECTED QUESTION
// =====================================================
//
// IMPORTANT:
//
// Missing MCQ correctAnswer does NOT drop the question.
//
// Instead:
//
// needsReview = true
//
// This avoids another Gemini request for every
// unanswered MCQ.
//
// =====================================================

const validateDetectedQuestion = (
  rawQuestion,
  {
    requireScreenshot = false,
  } = {}
) => {
  const question = {
    ...rawQuestion,

    question:
      cleanString(
        rawQuestion?.question
      ),

    subject:
      normalizeSubject(
        rawQuestion?.subject
      ),

    exam:
      normalizeExam(
        rawQuestion?.exam
      ),

    classLevel:
      normalizeClassLevel(
        rawQuestion?.classLevel
      ),

    chapter:
      cleanString(
        rawQuestion?.chapter
      ),

    difficulty:
      cleanString(
        rawQuestion?.difficulty
      ),

    questionType:
      cleanString(
        rawQuestion?.questionType
      ).toLowerCase(),

    options:
      safeArray(
        rawQuestion?.options
      )
        .map(
          (option) =>
            cleanString(
              option
            )
        )
        .filter(
          Boolean
        ),

    explanation:
      cleanString(
        rawQuestion?.explanation
      ),

    modelAnswer:
      cleanString(
        rawQuestion?.modelAnswer
      ),

    keyPoints:
      safeArray(
        rawQuestion?.keyPoints
      )
        .map(
          (point) =>
            cleanString(
              point
            )
        )
        .filter(
          Boolean
        ),

    needsReview:
      Boolean(
        rawQuestion?.needsReview
      ),
  };

  const reasons = [];

  // =========================================
  // AI DROP
  // =========================================

  if (
    question.drop
  ) {
    reasons.push(
      cleanString(
        question.dropReason
      ) ||
        "NAVTA AI marked this question as unusable."
    );
  }

  // =========================================
  // QUESTION TEXT
  // =========================================

  if (
    !question.question
  ) {
    reasons.push(
      "Question text is missing."
    );
  }

  // =========================================
  // SUBJECT
  // =========================================

  if (
    !VALID_SUBJECTS.has(
      question.subject
    )
  ) {
    reasons.push(
      "Subject could not be identified."
    );
  }

  // =========================================
  // EXAM
  // =========================================

  if (
    !VALID_EXAMS.has(
      question.exam
    )
  ) {
    reasons.push(
      "Exam type could not be identified."
    );
  }

  // =========================================
  // CLASS
  // =========================================

  if (
    !VALID_CLASSES.has(
      question.classLevel
    )
  ) {
    reasons.push(
      "Class level could not be identified."
    );
  }

  // =========================================
  // CHAPTER
  // =========================================
  //
  // Do not throw away a good question merely
  // because chapter detection is uncertain.
  //
  // Admin can review it later.
  //

  if (
    !question.chapter
  ) {
    question.chapter =
      "Needs Review";

    question.needsReview =
      true;
  }

  // =========================================
  // DIFFICULTY
  // =========================================

  if (
    !VALID_DIFFICULTIES.has(
      question.difficulty
    )
  ) {
    question.difficulty =
      "Medium";

    question.needsReview =
      true;
  }

  // =========================================
  // QUESTION TYPE
  // =========================================

  if (
    !VALID_QUESTION_TYPES.has(
      question.questionType
    )
  ) {
    reasons.push(
      "Question type could not be identified."
    );
  }

  // =========================================
  // JEE / NEET
  // =========================================

  if (
    [
      "JEE",
      "NEET",
    ].includes(
      question.exam
    ) &&
    question.questionType !==
      "mcq"
  ) {
    reasons.push(
      `${question.exam} questions must be MCQ.`
    );
  }

  // =========================================
  // MCQ
  // =========================================

  if (
    question.questionType ===
    "mcq"
  ) {
    if (
      question.options.length !==
      4
    ) {
      reasons.push(
        "MCQ must contain exactly 4 options."
      );
    }

    const hasCorrectAnswer =
      Number.isInteger(
        rawQuestion?.correctAnswer
      ) &&
      rawQuestion.correctAnswer >=
        0 &&
      rawQuestion.correctAnswer <=
        3;

    if (
      hasCorrectAnswer
    ) {
      question.correctAnswer =
        rawQuestion.correctAnswer;
    } else {
      // =====================================
      // VERY IMPORTANT
      // =====================================
      //
      // Do not call Gemini again.
      //
      // Keep question for Admin review.
      //

      question.correctAnswer =
        null;

      question.needsReview =
        true;

      question.answerReviewReason =
        "NAVTA AI could not determine the MCQ answer confidently during the PDF analysis.";
    }
  }

  // =========================================
  // SCREENSHOT BOUNDARY
  // =========================================

  if (
    requireScreenshot &&
    !question.questionBoundingBox
  ) {
    reasons.push(
      "Complete question screenshot boundary is missing."
    );
  }

  return {
    valid:
      reasons.length === 0,

    reasons,

    question,
  };
};

// =====================================================
// CREATE + UPLOAD COMPLETE QUESTION SCREENSHOT
// =====================================================

const processCompleteQuestionScreenshot = async ({
  question,
  renderedPage,
  sourceFileName,
}) => {
  if (
    !question?.questionBoundingBox
  ) {
    return {
      questionImage:
        null,

      screenshotWarning:
        "Complete question screenshot boundary is missing.",
    };
  }

  if (
    !renderedPage
  ) {
    return {
      questionImage:
        null,

      screenshotWarning:
        "Source PDF page could not be located.",
    };
  }

  try {
    // =========================================
    // REUSE EXISTING CROP SERVICE
    // =========================================
    //
    // navtaDiagramCropService works using
    // visualBoundingBox.
    //
    // We temporarily map full question box to
    // visualBoundingBox.
    //

    const cropQuestion = {
      ...question,

      hasVisual:
        true,

      visualBoundingBox:
        question.questionBoundingBox,

      visualDescription:
        question.question ||
        `Question ${
          question.questionNumber ||
          ""
        }`.trim(),
    };

    const cropped =
      await createQuestionDiagram({
        question:
          cropQuestion,

        pageBuffer:
          renderedPage.buffer,
      });

    if (
      !cropped ||
      !Buffer.isBuffer(
        cropped.buffer
      ) ||
      cropped.buffer.length ===
        0
    ) {
      return {
        questionImage:
          null,

        screenshotWarning:
          "Could not create the complete question screenshot.",
      };
    }

    // =========================================
    // SAFE FILE NAME
    // =========================================

    const safeFileName =
      cleanString(
        sourceFileName
      )
        .replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        )
        .slice(
          0,
          80
        ) ||
      "navta-question";

    const questionNumber =
      cleanString(
        question.questionNumber
      )
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "-"
        )
        .slice(
          0,
          30
        ) ||
      "question";

    // =========================================
    // CLOUDINARY
    // =========================================

    const upload =
      await uploadQuestionImage({
        buffer:
          cropped.buffer,

        fileName:
          `${safeFileName}-page-${question.sourcePage}-${questionNumber}`,

        folder:
          "navta/ai-imports/pending",
      });

    if (
      !upload?.url
    ) {
      return {
        questionImage:
          null,

        screenshotWarning:
          "Question screenshot was created but could not be uploaded.",
      };
    }

    return {
      questionImage: {
        url:
          upload.url,

        publicId:
          upload.publicId ||
          "",

        altText:
          question.question ||
          `Question ${
            question.questionNumber ||
            ""
          }`.trim() ||
          "NAVTA question",

        sourcePage:
          question.sourcePage,

        width:
          upload.width ||
          cropped.width,

        height:
          upload.height ||
          cropped.height,

        bbox:
          question.questionBoundingBox,
      },
    };
  } catch (
    error
  ) {
    console.error(
      "NAVTA QUESTION SCREENSHOT ERROR:",
      error
    );

    return {
      questionImage:
        null,

      screenshotWarning:
        error?.message ||
        "NAVTA could not process the question screenshot.",
    };
  }
};

// =====================================================
// BUILD QUESTION FOR ADMIN REVIEW
// =====================================================

const buildImportQuestion = ({
  question,
  questionImage = null,
  sourceFileName,
  fileType,
}) => {
  const result = {
    question:
      question.question,

    subject:
      question.subject,

    exam:
      question.exam,

    classLevel:
      question.classLevel,

    chapter:
      question.chapter,

    difficulty:
      question.difficulty,

    questionType:
      question.questionType,

    explanation:
      question.explanation ||
      "",

    needsReview:
      Boolean(
        question.needsReview
      ),

    sourceDocument: {
      fileName:
        sourceFileName,

      fileType,

      pageNumber:
        question.sourcePage ||
        null,

      importedByAI:
        true,
    },
  };

  // =========================================
  // MCQ
  // =========================================

  if (
    question.questionType ===
    "mcq"
  ) {
    result.options =
      question.options;

    result.correctAnswer =
      Number.isInteger(
        question.correctAnswer
      )
        ? question.correctAnswer
        : null;

    if (
      result.correctAnswer ===
      null
    ) {
      result.needsReview =
        true;

      result.answerReviewReason =
        question.answerReviewReason ||
        "Correct answer needs admin review.";
    }
  }

  // =========================================
  // SHORT / LONG
  // =========================================

  if (
    [
      "short",
      "long",
    ].includes(
      question.questionType
    )
  ) {
    result.modelAnswer =
      question.modelAnswer ||
      "";

    result.keyPoints =
      question.keyPoints ||
      [];

    const marks =
      Number(
        question.maxMarks
      );

    if (
      Number.isFinite(
        marks
      ) &&
      marks > 0
    ) {
      result.maxMarks =
        marks;
    }
  }

  // =========================================
  // QUESTION IMAGE
  // =========================================

  if (
    questionImage?.url
  ) {
    result.questionImage =
      questionImage;

    result.questionImages =
      [
        questionImage,
      ];
  } else {
    result.questionImages =
      [];
  }

  return result;
};

// =====================================================
// LIMITED CONCURRENCY HELPER
// =====================================================
//
// We do not want to upload 50 Cloudinary images
// one-by-one.
//
// But we also should not upload all 50 simultaneously.
//
// Default = 4.
//
// =====================================================

const mapWithConcurrency = async (
  items,
  limit,
  worker
) => {
  const source =
    Array.isArray(
      items
    )
      ? items
      : [];

  const results =
    new Array(
      source.length
    );

  let nextIndex =
    0;

  const runner =
    async () => {
      while (
        true
      ) {
        const current =
          nextIndex;

        nextIndex +=
          1;

        if (
          current >=
          source.length
        ) {
          return;
        }

        results[
          current
        ] =
          await worker(
            source[
              current
            ],
            current
          );
      }
    };

  const runnerCount =
    Math.min(
      limit,
      source.length
    );

  if (
    runnerCount ===
    0
  ) {
    return [];
  }

  await Promise.all(
    Array.from(
      {
        length:
          runnerCount,
      },
      () =>
        runner()
    )
  );

  return results;
};

// =====================================================
// PROCESS PDF IMPORT
// =====================================================

const processPdfImport = async ({
  file,
  documentResult,
  hints,
}) => {
  // =========================================
  // RENDER PDF
  // =========================================

  const rendered =
    await renderPdfPages({
      buffer:
        file.buffer,

      // Lower than old 1.8 to reduce:
      //
      // - memory
      // - PNG size
      // - Gemini request payload
      // - Cloudinary upload time
      //
      // Still generally clear enough for
      // printed exam papers.

      scale:
        1.6,

      maxPages:
        MAX_PDF_PAGES_PER_IMPORT,
    });

  if (
    !rendered?.pages?.length
  ) {
    throw new Error(
      "NAVTA could not render any pages from this PDF."
    );
  }

  console.log(
    `NAVTA rendered ${rendered.pages.length} PDF page(s).`
  );

  // =========================================
  // ONE / FEW GEMINI BATCH REQUESTS
  // =========================================

  const detectedQuestions =
    await analyseRenderedPages({
      pages:
        rendered.pages,

      text:
        documentResult?.text ||
        "",

      hints,
    });

  console.log(
    `NAVTA AI detected ${detectedQuestions.length} question(s) before validation.`
  );

  // =========================================
  // PAGE LOOKUP
  // =========================================

  const pageMap =
    new Map(
      rendered.pages.map(
        (page) => [
          Number(
            page.pageNumber
          ),

          page,
        ]
      )
    );

  const preliminaryAccepted =
    [];

  const droppedQuestions =
    [];

  // =========================================
  // FIRST VALIDATION
  // =========================================

  for (
    const rawQuestion of
    detectedQuestions
  ) {
    const validation =
      validateDetectedQuestion(
        rawQuestion,
        {
          requireScreenshot:
            true,
        }
      );

    if (
      !validation.valid
    ) {
      const reason =
        validation.reasons.join(
          " "
        );

      droppedQuestions.push({
        ...validation.question,

        reason,

        dropReason:
          reason,
      });

      continue;
    }

    preliminaryAccepted.push(
      validation.question
    );
  }

  console.log(
    `NAVTA preliminary accepted: ${preliminaryAccepted.length}`
  );

  console.log(
    `NAVTA preliminary dropped: ${droppedQuestions.length}`
  );

  // =========================================
  // CROP + CLOUDINARY
  // =========================================
  //
  // IMPORTANT:
  //
  // NO GEMINI CALLS HERE.
  //
  // This section only:
  //
  // 1. crops locally
  // 2. uploads image to Cloudinary
  //
  // =========================================

  const processed =
    await mapWithConcurrency(
      preliminaryAccepted,

      QUESTION_PROCESS_CONCURRENCY,

      async (
        question
      ) => {
        const renderedPage =
          pageMap.get(
            Number(
              question.sourcePage
            )
          );

        const screenshot =
          await processCompleteQuestionScreenshot({
            question,

            renderedPage,

            sourceFileName:
              file.originalname,
          });

        if (
          !screenshot.questionImage
        ) {
          return {
            accepted:
              false,

            question,

            reason:
              screenshot.screenshotWarning ||
              "NAVTA could not preserve the complete question screenshot.",
          };
        }

        const importQuestion =
          buildImportQuestion({
            question,

            questionImage:
              screenshot.questionImage,

            sourceFileName:
              file.originalname,

            fileType:
              "pdf",
          });

        return {
          accepted:
            true,

          question:
            importQuestion,
        };
      }
    );

  // =========================================
  // FINAL LISTS
  // =========================================

  const acceptedQuestions =
    [];

  for (
    const item of
    processed
  ) {
    if (
      !item
    ) {
      continue;
    }

    if (
      item.accepted
    ) {
      acceptedQuestions.push(
        item.question
      );

      continue;
    }

    droppedQuestions.push({
      ...item.question,

      reason:
        item.reason,

      dropReason:
        item.reason,
    });
  }

  // =========================================
  // RESULT
  // =========================================

  return {
    acceptedQuestions,

    droppedQuestions,

    documentInfo: {
      fileType:
        "pdf",

      fileName:
        file.originalname,

      totalPages:
        rendered.totalPages,

      renderedPages:
        rendered.renderedPages,

      truncated:
        Boolean(
          rendered.truncated
        ),
    },
  };
};

// =====================================================
// PROCESS TXT / DOCX
// =====================================================

const processTextImport = async ({
  file,
  documentResult,
  hints,
  fileType,
}) => {
  const detectedQuestions =
    await analyseTextQuestions({
      text:
        documentResult?.text ||
        "",

      hints,
    });

  const acceptedQuestions =
    [];

  const droppedQuestions =
    [];

  for (
    const rawQuestion of
    detectedQuestions
  ) {
    const validation =
      validateDetectedQuestion(
        rawQuestion,
        {
          requireScreenshot:
            false,
        }
      );

    if (
      !validation.valid
    ) {
      const reason =
        validation.reasons.join(
          " "
        );

      droppedQuestions.push({
        ...validation.question,

        reason,

        dropReason:
          reason,
      });

      continue;
    }

    acceptedQuestions.push(
      buildImportQuestion({
        question:
          validation.question,

        questionImage:
          null,

        sourceFileName:
          file.originalname,

        fileType,
      })
    );
  }

  return {
    acceptedQuestions,

    droppedQuestions,

    documentInfo: {
      fileType,

      fileName:
        file.originalname,

      totalPages:
        null,

      renderedPages:
        0,

      truncated:
        false,
    },
  };
};

// =====================================================
// MAIN NAVTA IMPORT
// =====================================================

const analyseNavtaImport = async ({
  file,
  subject,
  exam,
  classLevel,
}) => {
  // =========================================
  // FILE VALIDATION
  // =========================================

  if (
    !file
  ) {
    throw new Error(
      "Please upload a PDF, DOCX or TXT file."
    );
  }

  if (
    !Buffer.isBuffer(
      file.buffer
    ) ||
    file.buffer.length ===
      0
  ) {
    throw new Error(
      "Uploaded file buffer is missing."
    );
  }

  // =========================================
  // FILE TYPE
  // =========================================

  const fileType =
    getFileType(
      file.originalname
    );

  if (
    ![
      "pdf",
      "docx",
      "txt",
    ].includes(
      fileType
    )
  ) {
    throw new Error(
      "Unsupported file type. Please upload PDF, DOCX or TXT."
    );
  }

  // =========================================
  // DOCUMENT EXTRACTION
  // =========================================

  const documentResult =
    await processNavtaDocument(
      file
    );

  // =========================================
  // ADMIN HINTS
  // =========================================

  const hints = {
    subject:
      normalizeSubject(
        subject
      ),

    exam:
      normalizeExam(
        exam
      ),

    classLevel:
      normalizeClassLevel(
        classLevel
      ),
  };

  // =========================================
  // PROCESS
  // =========================================

  const result =
    fileType ===
    "pdf"
      ? await processPdfImport({
          file,

          documentResult,

          hints,
        })
      : await processTextImport({
          file,

          documentResult,

          hints,

          fileType,
        });

  // =========================================
  // SUMMARY
  // =========================================

  const needsReview =
    result.acceptedQuestions.filter(
      (question) =>
        question.needsReview
    ).length;

  return {
    ...result,

    summary: {
      detected:
        result.acceptedQuestions.length +
        result.droppedQuestions.length,

      accepted:
        result.acceptedQuestions.length,

      dropped:
        result.droppedQuestions.length,

      needsReview,
    },
  };
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  analyseNavtaImport,
  validateDetectedQuestion,
};
