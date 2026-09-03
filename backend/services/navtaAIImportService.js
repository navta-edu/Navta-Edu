const path = require("path");

const {
  processNavtaDocument,
} = require("./navtaDocumentService");

const {
  renderPdfPages,
} = require("./navtaPdfVisualService");

const {
  analyseRenderedPages,
  solveQuestionFromImage,
} = require("./navtaAIQuestionService");

const {
  createQuestionDiagram,
} = require("./navtaDiagramCropService");

const {
  uploadQuestionImage,
} = require("./navtaImageService");

// =====================================================
// CONSTANTS
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
// COMPLETE PDF PROCESSING
// =====================================================
//
// OLD:
//
// const MAX_PDF_PAGES_PER_IMPORT = 20;
//
// NEW:
//
// Render the complete PDF.
//
// navtaAIQuestionService.js processes the resulting
// pages sequentially, one rendered page at a time,
// until the final page.
//
// =====================================================

const MAX_PDF_PAGES_PER_IMPORT =
  Number.MAX_SAFE_INTEGER;

// =====================================================
// HELPERS
// =====================================================

const cleanString = (value = "") => {
  return String(value || "").trim();
};

const safeArray = (value) => {
  return Array.isArray(value)
    ? value
    : [];
};

const getFileType = (fileName = "") => {
  return path
    .extname(fileName)
    .toLowerCase()
    .replace(".", "");
};

// =====================================================
// SUBJECT NORMALIZATION
// =====================================================

const normalizeSubject = (value) => {
  const text =
    cleanString(value).toLowerCase();

  const map = {
    physics: "Physics",
    chemistry: "Chemistry",
    maths: "Maths",
    math: "Maths",
    mathematics: "Maths",
    biology: "Biology",
  };

  return (
    map[text] ||
    cleanString(value)
  );
};

// =====================================================
// EXAM NORMALIZATION
// =====================================================

const normalizeExam = (value) => {
  const text =
    cleanString(value).toLowerCase();

  if (text === "neet") {
    return "NEET";
  }

  if (
    text === "jee" ||
    text === "jee main" ||
    text === "jee mains" ||
    text === "jee advanced"
  ) {
    return "JEE";
  }

  if (
    text === "boards" ||
    text === "board" ||
    text === "cbse"
  ) {
    return "Boards";
  }

  return cleanString(value);
};

// =====================================================
// CLASS NORMALIZATION
// =====================================================

const normalizeClassLevel = (value) => {
  const text =
    cleanString(value).toLowerCase();

  if (
    text === "class 11" ||
    text === "11" ||
    text === "xi"
  ) {
    return "Class 11";
  }

  if (
    text === "class 12" ||
    text === "12" ||
    text === "xii"
  ) {
    return "Class 12";
  }

  return cleanString(value);
};

// =====================================================
// QUESTION VALIDATION
// =====================================================

const validateDetectedQuestion = (
  rawQuestion,
  {
    requireCorrectAnswer = true,
  } = {}
) => {
  const question = {
    ...rawQuestion,

    question:
      cleanString(
        rawQuestion.question
      ),

    subject:
      normalizeSubject(
        rawQuestion.subject
      ),

    exam:
      normalizeExam(
        rawQuestion.exam
      ),

    classLevel:
      normalizeClassLevel(
        rawQuestion.classLevel
      ),

    chapter:
      cleanString(
        rawQuestion.chapter
      ),

    difficulty:
      cleanString(
        rawQuestion.difficulty
      ),

    questionType:
      cleanString(
        rawQuestion.questionType
      ).toLowerCase(),

    options:
      safeArray(
        rawQuestion.options
      )
        .map(cleanString)
        .filter(Boolean),

    explanation:
      cleanString(
        rawQuestion.explanation
      ),

    modelAnswer:
      cleanString(
        rawQuestion.modelAnswer
      ),

    keyPoints:
      safeArray(
        rawQuestion.keyPoints
      )
        .map(cleanString)
        .filter(Boolean),
  };

  const reasons = [];

  // =========================================
  // AI DROP CHECK
  // =========================================

  if (question.drop) {
    reasons.push(
      question.dropReason ||
        "NAVTA AI marked this question as uncertain."
    );
  }

  // =========================================
  // QUESTION TEXT
  // =========================================

  if (!question.question) {
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
      "Invalid or uncertain subject."
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
      "Invalid or uncertain exam."
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
      "Invalid or uncertain class level."
    );
  }

  // =========================================
  // CHAPTER
  // =========================================

  if (!question.chapter) {
    reasons.push(
      "Chapter could not be identified."
    );
  }

  // =========================================
  // DIFFICULTY
  // =========================================

  if (
    !VALID_DIFFICULTIES.has(
      question.difficulty
    )
  ) {
    reasons.push(
      "Difficulty could not be identified."
    );
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
      "Invalid question type."
    );
  }

  // =========================================
  // JEE / NEET TYPE RULE
  // =========================================

  if (
    ["JEE", "NEET"].includes(
      question.exam
    ) &&
    question.questionType !== "mcq"
  ) {
    reasons.push(
      `${question.exam} questions must be MCQ.`
    );
  }

  // =========================================
  // MCQ VALIDATION
  // =========================================

  if (
    question.questionType === "mcq"
  ) {
    if (
      question.options.length !== 4
    ) {
      reasons.push(
        "MCQ must contain exactly 4 options."
      );
    }

    if (
      requireCorrectAnswer &&
      (
        !Number.isInteger(
          rawQuestion.correctAnswer
        ) ||
        rawQuestion.correctAnswer < 0 ||
        rawQuestion.correctAnswer > 3
      )
    ) {
      reasons.push(
        "MCQ correct answer could not be determined."
      );
    }
  }

  return {
    valid:
      reasons.length === 0,

    reasons,

    question,
  };
};

// =====================================================
// PROCESS COMPLETE QUESTION SCREENSHOT
// =====================================================
//
// The complete original printed question screenshot is
// now the primary student-facing question image.
//
// We reuse the existing crop service by temporarily
// mapping questionBoundingBox -> visualBoundingBox.
// This keeps all crop math in one tested service.
//
// The returned crop buffer is also sent directly to the
// dedicated Gemini answer solver BEFORE final validation.
//
// =====================================================

const processCompleteQuestionScreenshot =
  async ({
    question,
    renderedPage,
    sourceFileName,
  }) => {
    if (
      !question?.questionBoundingBox
    ) {
      return {
        questionImage: null,
        cropBuffer: null,
        screenshotWarning:
          "The complete question screenshot boundary is missing.",
      };
    }

    if (!renderedPage) {
      return {
        questionImage: null,
        cropBuffer: null,
        screenshotWarning:
          "The source PDF page for this question could not be located.",
      };
    }

    try {
      const cropQuestion = {
        ...question,

        hasVisual:
          true,

        visualBoundingBox:
          question.questionBoundingBox,

        visualDescription:
          question.question ||
          `Question ${question.questionNumber || ""}`.trim(),
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
        cropped.buffer.length === 0
      ) {
        return {
          questionImage: null,
          cropBuffer: null,
          screenshotWarning:
            "NAVTA detected the question boundary but could not create the complete question screenshot.",
        };
      }

      const safeFileName =
        cleanString(
          sourceFileName
        )
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          )
          .slice(0, 80) ||
        "navta-question";

      const questionNumber =
        cleanString(
          question.questionNumber
        )
          .replace(
            /[^a-zA-Z0-9_-]/g,
            "-"
          )
          .slice(0, 30) ||
        "question";

      const upload =
        await uploadQuestionImage({
          buffer:
            cropped.buffer,

          fileName:
            `${safeFileName}-page-${question.sourcePage}-${questionNumber}-full-question`,

          folder:
            "navta/ai-imports/pending",
        });

      if (!upload?.url) {
        return {
          questionImage: null,
          cropBuffer:
            cropped.buffer,
          screenshotWarning:
            "NAVTA created the complete question screenshot but could not upload it.",
        };
      }

      return {
        cropBuffer:
          cropped.buffer,

        questionImage: {
          url:
            upload.url,

          publicId:
            upload.publicId || "",

          altText:
            question.question ||
            `Question ${question.questionNumber || ""}`.trim() ||
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
    } catch (error) {
      console.error(
        "NAVTA COMPLETE QUESTION SCREENSHOT ERROR:",
        error
      );

      return {
        questionImage: null,
        cropBuffer: null,
        screenshotWarning:
          "NAVTA could not process the complete question screenshot.",
      };
    }
  };


// =====================================================
// SOLVE MCQ FROM COMPLETE QUESTION SCREENSHOT
// =====================================================

const solveMissingMcqAnswer =
  async ({
    question,
    cropBuffer,
  }) => {
    if (
      question?.questionType !== "mcq"
    ) {
      return question;
    }

    if (
      Number.isInteger(
        question.correctAnswer
      ) &&
      question.correctAnswer >= 0 &&
      question.correctAnswer <= 3
    ) {
      return question;
    }

    if (
      !Buffer.isBuffer(
        cropBuffer
      ) ||
      cropBuffer.length === 0
    ) {
      return question;
    }

    console.log(
      `NAVTA solving missing MCQ answer from screenshot: page=${question.sourcePage}, question=${question.questionNumber || "?"}.`
    );

    const solution =
      await solveQuestionFromImage({
        imageBuffer:
          cropBuffer,

        question,
      });

    if (
      Number.isInteger(
        solution?.correctAnswer
      ) &&
      solution.correctAnswer >= 0 &&
      solution.correctAnswer <= 3
    ) {
      return {
        ...question,

        correctAnswer:
          solution.correctAnswer,

        explanation:
          cleanString(
            solution.explanation
          ) ||
          question.explanation ||
          "",

        answerConfidence:
          cleanString(
            solution.confidence
          ) ||
          "medium",

        answerSolvedFromScreenshot:
          true,
      };
    }

    return {
      ...question,

      answerConfidence:
        cleanString(
          solution?.confidence
        ) ||
        "low",

      answerSolvedFromScreenshot:
        false,

      answerSolverWarning:
        cleanString(
          solution?.solverError
        ) ||
        "NAVTA could not determine the MCQ answer from the complete question screenshot.",
    };
  };


// =====================================================
// PROCESS QUESTION DIAGRAM
// =====================================================

const processQuestionVisual =
  async ({
    question,
    renderedPage,
    sourceFileName,
  }) => {
    // No visual was detected.
    if (
      !question.hasVisual ||
      !question.visualBoundingBox
    ) {
      return {
        questionImage: null,
      };
    }

    // Visual exists according to AI but we
    // cannot locate its source page.
    if (!renderedPage) {
      return {
        questionImage: null,

        visualWarning:
          "NAVTA AI detected a diagram, but its PDF page could not be located.",
      };
    }

    try {
      // =====================================
      // CROP THE VISUAL
      // =====================================

      const cropped =
        await createQuestionDiagram({
          question,

          pageBuffer:
            renderedPage.buffer,
        });

      if (
        !cropped ||
        !Buffer.isBuffer(
          cropped.buffer
        ) ||
        cropped.buffer.length === 0
      ) {
        return {
          questionImage: null,

          visualWarning:
            "NAVTA detected the diagram but could not create its image.",
        };
      }

      // =====================================
      // SAFE FILE NAME
      // =====================================

      const safeFileName =
        cleanString(
          sourceFileName
        )
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          )
          .slice(0, 80) ||
        "navta-question";

      // =====================================
      // CLOUDINARY UPLOAD
      // =====================================

      const upload =
        await uploadQuestionImage({
          buffer:
            cropped.buffer,

          fileName:
            `${safeFileName}-page-${question.sourcePage}-diagram`,

          folder:
            "navta/ai-imports/pending",
        });

      if (!upload?.url) {
        return {
          questionImage: null,

          visualWarning:
            "The question diagram could not be uploaded.",
        };
      }

      // =====================================
      // RETURN IMAGE METADATA
      // =====================================

      return {
        questionImage: {
          url:
            upload.url,

          publicId:
            upload.publicId || "",

          altText:
            question.visualDescription ||
            "Question diagram",

          sourcePage:
            question.sourcePage,

          width:
            upload.width ||
            cropped.width,

          height:
            upload.height ||
            cropped.height,
        },
      };
    } catch (error) {
      console.error(
        "NAVTA DIAGRAM PROCESSING ERROR:",
        error
      );

      return {
        questionImage: null,

        visualWarning:
          "Diagram was detected, but NAVTA could not process it.",
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
      question.explanation || "",

    sourceDocument: {
      fileName:
        sourceFileName,

      fileType,

      pageNumber:
        question.sourcePage,

      importedByAI:
        true,
    },
  };

  // =========================================
  // MCQ DATA
  // =========================================

  if (
    question.questionType === "mcq"
  ) {
    result.options =
      question.options;

    result.correctAnswer =
      question.correctAnswer;
  }

  // =========================================
  // WRITTEN QUESTION DATA
  // =========================================

  if (
    ["short", "long"].includes(
      question.questionType
    )
  ) {
    result.modelAnswer =
      question.modelAnswer || "";

    result.keyPoints =
      question.keyPoints || [];

    if (
      question.maxMarks !== null &&
      question.maxMarks !== undefined &&
      Number.isFinite(
        Number(
          question.maxMarks
        )
      )
    ) {
      result.maxMarks =
        Number(
          question.maxMarks
        );
    }
  }

  // =========================================
  // QUESTION IMAGE
  // =========================================

  if (questionImage?.url) {
    result.questionImage =
      questionImage;

    result.questionImages = [
      questionImage,
    ];
  } else {
    result.questionImages = [];
  }

  return result;
};

// =====================================================
// PROCESS PDF IMPORT
// =====================================================

const processPdfImport =
  async ({
    file,
    documentResult,
    hints,
  }) => {
    // =========================================
    // RENDER PDF PAGES
    // =========================================

    console.log(
      "====================================================="
    );

    console.log(
      "NAVTA PDF IMPORT STARTING"
    );

    console.log(
      `File: ${file.originalname}`
    );

    console.log(
      "Rendering complete PDF..."
    );

    console.log(
      "====================================================="
    );

    const rendered =
      await renderPdfPages({
        buffer:
          file.buffer,

        scale:
          1.8,

        maxPages:
          MAX_PDF_PAGES_PER_IMPORT,
      });

    if (
      !rendered ||
      !Array.isArray(
        rendered.pages
      ) ||
      rendered.pages.length === 0
    ) {
      throw new Error(
        "NAVTA could not render any pages from this PDF."
      );
    }

    console.log(
      `NAVTA rendered ${rendered.pages.length} PDF page(s).`
    );

    console.log(
      `PDF reports ${rendered.totalPages} total page(s).`
    );

    // =========================================
    // NAVTA GEMINI ANALYSIS
    // =========================================
    //
    // analyseRenderedPages() processes each rendered
    // page sequentially until the final page
    //
    // =========================================

    const detectedQuestions =
      await analyseRenderedPages({
        pages:
          rendered.pages,

        text:
          documentResult.text ||
          "",

        hints,
      });

    console.log(
      `NAVTA AI detected ${detectedQuestions.length} question(s) before validation.`
    );

    // =========================================
    // CREATE PAGE LOOKUP
    // =========================================

    const pageMap =
      new Map();

    for (
      const page of
      rendered.pages
    ) {
      pageMap.set(
        Number(
          page.pageNumber
        ),
        page
      );
    }

    const acceptedQuestions =
      [];

    const droppedQuestions =
      [];

    // =========================================
    // PROCESS EACH DETECTED QUESTION
    // =========================================
    //
    // ORDER IS IMPORTANT:
    //
    // 1. Validate structure WITHOUT requiring MCQ answer.
    // 2. Find original rendered page.
    // 3. Crop the COMPLETE question screenshot.
    // 4. If MCQ answer is missing, solve from screenshot.
    // 5. Run FINAL validation including correctAnswer.
    // 6. Build admin-review object.
    // 7. Accept only after all required checks pass.
    //
    // This prevents valid MCQs from being dropped before
    // the screenshot solver gets a chance to solve them.
    // =========================================

    for (
      const rawQuestion of
      detectedQuestions
    ) {
      // =====================================
      // STAGE 1 VALIDATION
      // =====================================

      const preliminaryValidation =
        validateDetectedQuestion(
          rawQuestion,
          {
            requireCorrectAnswer:
              false,
          }
        );

      if (
        !preliminaryValidation.valid
      ) {
        const reason =
          preliminaryValidation.reasons.join(
            " "
          );

        droppedQuestions.push({
          ...preliminaryValidation.question,

          reason,

          dropReason:
            reason,
        });

        continue;
      }

      let question = {
        ...preliminaryValidation.question,
      };

      // =====================================
      // FIND SOURCE PDF PAGE
      // =====================================

      const renderedPage =
        pageMap.get(
          Number(
            question.sourcePage
          )
        );

      if (!renderedPage) {
        const reason =
          "The source PDF page for this question could not be located.";

        droppedQuestions.push({
          ...question,

          reason,

          dropReason:
            reason,
        });

        continue;
      }

      // =====================================
      // COMPLETE QUESTION SCREENSHOT
      // =====================================

      const screenshot =
        await processCompleteQuestionScreenshot({
          question,

          renderedPage,

          sourceFileName:
            file.originalname,
        });

      if (
        !screenshot.questionImage ||
        !Buffer.isBuffer(
          screenshot.cropBuffer
        ) ||
        screenshot.cropBuffer.length === 0
      ) {
        const reason =
          screenshot.screenshotWarning ||
          "NAVTA could not preserve the complete original question screenshot.";

        droppedQuestions.push({
          ...question,

          reason,

          dropReason:
            reason,
        });

        continue;
      }

      // =====================================
      // SOLVE MISSING MCQ ANSWER
      // =====================================

      if (
        question.questionType === "mcq" &&
        (
          !Number.isInteger(
            question.correctAnswer
          ) ||
          question.correctAnswer < 0 ||
          question.correctAnswer > 3
        )
      ) {
        try {
          question =
            await solveMissingMcqAnswer({
              question,

              cropBuffer:
                screenshot.cropBuffer,
            });
        } catch (error) {
          console.error(
            "NAVTA SCREENSHOT ANSWER SOLVER ERROR:",
            error
          );

          question = {
            ...question,

            answerSolvedFromScreenshot:
              false,

            answerConfidence:
              "low",

            answerSolverWarning:
              error?.message ||
              "NAVTA answer solver failed.",
          };
        }
      }

      // =====================================
      // FINAL VALIDATION
      // =====================================

      const finalValidation =
        validateDetectedQuestion(
          question,
          {
            requireCorrectAnswer:
              true,
          }
        );

      if (
        !finalValidation.valid
      ) {
        const reason =
          finalValidation.reasons.join(
            " "
          );

        droppedQuestions.push({
          ...finalValidation.question,

          questionImage:
            screenshot.questionImage,

          questionImages: [
            screenshot.questionImage,
          ],

          answerConfidence:
            question.answerConfidence ||
            "",

          answerSolvedFromScreenshot:
            Boolean(
              question.answerSolvedFromScreenshot
            ),

          answerSolverWarning:
            question.answerSolverWarning ||
            "",

          reason,

          dropReason:
            reason,
        });

        continue;
      }

      question = {
        ...finalValidation.question,

        answerConfidence:
          question.answerConfidence ||
          "",

        answerSolvedFromScreenshot:
          Boolean(
            question.answerSolvedFromScreenshot
          ),

        answerSolverWarning:
          question.answerSolverWarning ||
          "",
      };

      // =====================================
      // BUILD ADMIN REVIEW QUESTION
      // =====================================

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

      // =====================================
      // PRESERVE SOLVER METADATA
      // =====================================

      if (
        question.questionType === "mcq"
      ) {
        importQuestion.answerConfidence =
          question.answerConfidence ||
          "";

        importQuestion.answerSolvedFromScreenshot =
          Boolean(
            question.answerSolvedFromScreenshot
          );

        if (
          question.answerSolverWarning
        ) {
          importQuestion.answerSolverWarning =
            question.answerSolverWarning;
        }
      }

      // =====================================
      // ACCEPT QUESTION
      // =====================================

      acceptedQuestions.push(
        importQuestion
      );
    }

    // =========================================
    // FINAL IMPORT LOG
    // =========================================

    console.log(
      "====================================================="
    );

    console.log(
      "NAVTA PDF IMPORT COMPLETED"
    );

    console.log(
      `Rendered pages: ${rendered.pages.length}`
    );

    console.log(
      `Detected questions: ${detectedQuestions.length}`
    );

    console.log(
      `Accepted questions: ${acceptedQuestions.length}`
    );

    console.log(
      `Dropped questions: ${droppedQuestions.length}`
    );

    console.log(
      "====================================================="
    );

    // =========================================
    // RETURN PDF RESULT
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
// MAIN NAVTA AI IMPORT SERVICE
// =====================================================

const analyseNavtaImport =
  async ({
    file,
    subject,
    exam,
    classLevel,
  }) => {
    // =========================================
    // FILE CHECK
    // =========================================

    if (!file) {
      throw new Error(
        "Please upload a PDF, DOCX or TXT file."
      );
    }

    // =========================================
    // BUFFER CHECK
    // =========================================

    if (
      !Buffer.isBuffer(
        file.buffer
      ) ||
      file.buffer.length === 0
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
        "Unsupported file type. Please upload a PDF, DOCX or TXT file."
      );
    }

    // =========================================
    // PROCESS ORIGINAL DOCUMENT
    // =========================================
    //
    // IMPORTANT:
    //
    // Pass the Multer file DIRECTLY.
    //
    // Correct:
    //
    // processNavtaDocument(file)
    //
    // NOT:
    //
    // processNavtaDocument({ file })
    //
    // =========================================

    const documentResult =
      await processNavtaDocument(
        file
      );

    // =========================================
    // NORMALIZE ADMIN HINTS
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
    // PDF IMPORT
    // =========================================

    if (
      fileType === "pdf"
    ) {
      const result =
        await processPdfImport({
          file,

          documentResult,

          hints,
        });

      const acceptedCount =
        result
          .acceptedQuestions
          .length;

      const droppedCount =
        result
          .droppedQuestions
          .length;

      return {
        ...result,

        summary: {
          detected:
            acceptedCount +
            droppedCount,

          accepted:
            acceptedCount,

          dropped:
            droppedCount,
        },
      };
    }

    // =========================================
    // DOCX
    // =========================================
    //
    // DOCX text/image extraction exists in the
    // document service, but question-to-image
    // association is not enabled yet.
    //
    // We intentionally stop here instead of
    // importing diagrams incorrectly.
    // =========================================

    if (
      fileType === "docx"
    ) {
      throw new Error(
        "DOCX NAVTA AI import is being connected next. Please use PDF for the current visual-import test."
      );
    }

    // =========================================
    // TXT
    // =========================================
    //
    // TXT has no embedded visual information.
    // A dedicated text-only AI parser will be
    // connected separately.
    // =========================================

    if (
      fileType === "txt"
    ) {
      throw new Error(
        "TXT NAVTA AI import is being connected next. Please use PDF for the current test."
      );
    }

    throw new Error(
      "Unsupported file type."
    );
  };

// =====================================================
// EXPORT
// =====================================================
//
// IMPORTANT:
//
// The existing NAVTA controller imports:
//
// analyseNavtaImport
//
// so this exact export must remain.
//
// =====================================================

module.exports = {
  analyseNavtaImport,
  validateDetectedQuestion,
};
