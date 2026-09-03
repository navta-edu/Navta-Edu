const path = require("path");

const {
  processNavtaDocument,
} = require("./navtaDocumentService");

const {
  renderPdfPages,
} = require("./navtaPdfVisualService");

const {
  analyseRenderedPages,
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

// Limit the number of PDF pages processed in one import.
// This protects server memory and avoids sending a huge
// number of AI requests during a single upload.
const MAX_PDF_PAGES_PER_IMPORT = Number.MAX_SAFE_INTEGER;

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

const normalizeBoundingBox = (value) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const x = Number(value.x);
  const y = Number(value.y);
  const width = Number(value.width);
  const height = Number(value.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  const safeX = Math.min(1, Math.max(0, x));
  const safeY = Math.min(1, Math.max(0, y));
  const safeWidth = Math.min(
    Math.max(0, 1 - safeX),
    Math.max(0, width)
  );
  const safeHeight = Math.min(
    Math.max(0, 1 - safeY),
    Math.max(0, height)
  );

  if (safeWidth <= 0 || safeHeight <= 0) {
    return null;
  }

  return {
    x: safeX,
    y: safeY,
    width: safeWidth,
    height: safeHeight,
  };
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
  rawQuestion
) => {
  const question = {
    ...rawQuestion,

    question:
      cleanString(
        rawQuestion.question
      ),

    questionBoundingBox:
      normalizeBoundingBox(
        rawQuestion.questionBoundingBox
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
  // QUESTION SCREENSHOT BOUNDING BOX
  // =========================================

  if (!question.questionBoundingBox) {
    reasons.push(
      "Complete one-question screenshot boundary could not be identified."
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
      !Number.isInteger(
        rawQuestion.correctAnswer
      ) ||
      rawQuestion.correctAnswer < 0 ||
      rawQuestion.correctAnswer > 3
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

const processQuestionScreenshot =
  async ({
    question,
    renderedPage,
    sourceFileName,
  }) => {
    if (!question.questionBoundingBox) {
      return {
        questionImage: null,
        screenshotWarning:
          "NAVTA AI did not return a complete question screenshot boundary.",
      };
    }

    if (!renderedPage) {
      return {
        questionImage: null,
        screenshotWarning:
          "NAVTA could not locate the rendered PDF page for this question.",
      };
    }

    try {
      // Reuse NAVTA's existing crop service by presenting the
      // complete question box as the crop box.
      const cropQuestion = {
        ...question,
        visualBoundingBox:
          question.questionBoundingBox,
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

          screenshotWarning:
            "NAVTA detected the question but could not create its screenshot.",
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
            `${safeFileName}-page-${question.sourcePage}-${questionNumber}`,

          folder:
            "navta/ai-imports/questions",
        });

      if (!upload?.url) {
        return {
          questionImage: null,

          screenshotWarning:
            "The complete question screenshot could not be uploaded.",
        };
      }

      return {
        questionImage: {
          url:
            upload.url,

          publicId:
            upload.publicId || "",

          altText:
            `Question ${cleanString(
              question.questionNumber
            ) || ""}`.trim() ||
            "NAVTA question",

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
        "NAVTA QUESTION SCREENSHOT PROCESSING ERROR:",
        error
      );

      return {
        questionImage: null,

        screenshotWarning:
          "NAVTA could not process the complete question screenshot.",
      };
    }
  };


// =====================================================
// PROCESS OPTIONAL QUESTION VISUAL
// =====================================================
//
// This keeps the old visual-crop capability for admin
// metadata, but the STUDENT-FACING image is now always
// the complete question screenshot above.
// =====================================================

const processQuestionVisual =
  async ({
    question,
    renderedPage,
    sourceFileName,
  }) => {
    if (
      !question.hasVisual ||
      !question.visualBoundingBox
    ) {
      return {
        visualImage: null,
      };
    }

    if (!renderedPage) {
      return {
        visualImage: null,

        visualWarning:
          "NAVTA AI detected a visual, but its PDF page could not be located.",
      };
    }

    try {
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
          visualImage: null,

          visualWarning:
            "NAVTA detected the visual but could not create its image.",
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

      const upload =
        await uploadQuestionImage({
          buffer:
            cropped.buffer,

          fileName:
            `${safeFileName}-page-${question.sourcePage}-visual`,

          folder:
            "navta/ai-imports/visuals",
        });

      if (!upload?.url) {
        return {
          visualImage: null,

          visualWarning:
            "The question visual could not be uploaded.",
        };
      }

      return {
        visualImage: {
          url:
            upload.url,

          publicId:
            upload.publicId || "",

          altText:
            question.visualDescription ||
            "Question visual",

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
        "NAVTA VISUAL PROCESSING ERROR:",
        error
      );

      return {
        visualImage: null,

        visualWarning:
          "Visual was detected, but NAVTA could not process it.",
      };
    }
  };


// =====================================================
// BUILD QUESTION FOR ADMIN REVIEW
// =====================================================

const buildImportQuestion = ({
  question,
  questionImage = null,
  visualImage = null,
  sourceFileName,
  fileType,
}) => {
  const result = {
    question:
      question.question,

    questionNumber:
      question.questionNumber || "",

    questionBoundingBox:
      question.questionBoundingBox || null,

    studentQuestionFormat:
      questionImage?.url
        ? "image"
        : "text",

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
    result.questionImage =
      null;

    result.questionImages = [];
  }

  // Keep a separately-cropped required visual only as
  // optional metadata. NAVTA TEST should use questionImage.
  if (visualImage?.url) {
    result.questionVisual =
      visualImage;
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

    // =========================================
    // NAVTA AI GATEWAY ANALYSIS
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
    // VALIDATE EACH DETECTED QUESTION
    // =========================================

    for (
      const rawQuestion of
      detectedQuestions
    ) {
      const validation =
        validateDetectedQuestion(
          rawQuestion
        );

      // =====================================
      // DROP INVALID QUESTION
      // =====================================

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

      const question =
        validation.question;

      // =====================================
      // FIND SOURCE PDF PAGE
      // =====================================

      const renderedPage =
        pageMap.get(
          Number(
            question.sourcePage
          )
        );

      // =====================================
      // CREATE COMPLETE QUESTION SCREENSHOT
      // =====================================

      const screenshot =
        await processQuestionScreenshot({
          question,

          renderedPage,

          sourceFileName:
            file.originalname,
        });

      // The screenshot is now mandatory because NAVTA TEST
      // will show the original question image, not reconstructed
      // question text.
      if (!screenshot.questionImage?.url) {
        const reason =
          screenshot.screenshotWarning ||
          "The complete question screenshot could not be preserved.";

        droppedQuestions.push({
          ...question,

          reason,

          dropReason:
            reason,
        });

        continue;
      }

      // =====================================
      // OPTIONAL SEPARATE DIAGRAM / VISUAL
      // =====================================

      const visual =
        await processQuestionVisual({
          question,

          renderedPage,

          sourceFileName:
            file.originalname,
        });

      // =====================================
      // BUILD ADMIN REVIEW QUESTION
      // =====================================

      const importQuestion =
        buildImportQuestion({
          question,

          questionImage:
            screenshot.questionImage,

          visualImage:
            visual.visualImage,

          sourceFileName:
            file.originalname,

          fileType:
            "pdf",
        });

      // Since the complete screenshot already contains any
      // printed diagram or visual, a separate visual crop failing
      // must NOT drop an otherwise valid question.
      if (
        question.hasVisual &&
        visual.visualWarning
      ) {
        importQuestion.visualWarning =
          visual.visualWarning;
      }

      // =====================================
      // ACCEPT QUESTION
      // =====================================

      acceptedQuestions.push(
        importQuestion
      );
    }

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
        "Screenshot-first NAVTA AI currently requires PDF. Please upload a PDF so NAVTA can crop one original question image per question."
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
        "Screenshot-first NAVTA AI currently requires PDF. TXT files cannot provide original question screenshots."
      );
    }

    throw new Error(
      "Unsupported file type."
    );
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  analyseNavtaImport,
  validateDetectedQuestion,
};
