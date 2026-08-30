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

// Render at most this many pages during one import.
// We can add batching later for very large PDFs.
const MAX_PDF_PAGES_PER_IMPORT = 20;

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

  return map[text] || cleanString(value);
};

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

  if (question.drop) {
    reasons.push(
      question.dropReason ||
        "NAVTA AI marked this question as uncertain."
    );
  }

  if (!question.question) {
    reasons.push(
      "Question text is missing."
    );
  }

  if (
    !VALID_SUBJECTS.has(
      question.subject
    )
  ) {
    reasons.push(
      "Invalid or uncertain subject."
    );
  }

  if (
    !VALID_EXAMS.has(
      question.exam
    )
  ) {
    reasons.push(
      "Invalid or uncertain exam."
    );
  }

  if (
    !VALID_CLASSES.has(
      question.classLevel
    )
  ) {
    reasons.push(
      "Invalid or uncertain class level."
    );
  }

  if (!question.chapter) {
    reasons.push(
      "Chapter could not be identified."
    );
  }

  if (
    !VALID_DIFFICULTIES.has(
      question.difficulty
    )
  ) {
    reasons.push(
      "Difficulty could not be identified."
    );
  }

  if (
    !VALID_QUESTION_TYPES.has(
      question.questionType
    )
  ) {
    reasons.push(
      "Invalid question type."
    );
  }

  // JEE and NEET only support MCQ
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
// PROCESS DIAGRAM
// =====================================================

const processQuestionVisual =
  async ({
    question,
    renderedPage,
    sourceFileName,
  }) => {
    if (
      !question.hasVisual ||
      !question.visualBoundingBox ||
      !renderedPage
    ) {
      return {
        questionImage: null,
      };
    }

    try {
      const cropped =
        await createQuestionDiagram({
          question,
          pageBuffer:
            renderedPage.buffer,
        });

      if (!cropped) {
        return {
          questionImage: null,
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
          .slice(0, 80);

      const upload =
        await uploadQuestionImage({
          buffer:
            cropped.buffer,

          fileName:
            `${safeFileName}-page-${question.sourcePage}-diagram`,

          folder:
            "navta/ai-imports/pending",
        });

      return {
        questionImage: {
          url:
            upload.url,

          publicId:
            upload.publicId,

          altText:
            question.visualDescription ||
            "Question diagram",

          sourcePage:
            question.sourcePage,

          width:
            upload.width,

          height:
            upload.height,
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
// BUILD FRONTEND QUESTION
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
  // MCQ
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
  // WRITTEN
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
  // DIAGRAM
  // =========================================

  if (
    questionImage?.url
  ) {
    result.questionImage =
      questionImage;

    result.questionImages = [
      questionImage,
    ];
  } else {
    result.questionImages =
      [];
  }

  return result;
};

// =====================================================
// PROCESS PDF
// =====================================================

const processPdfImport =
  async ({
    file,
    documentResult,
    hints,
  }) => {
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
      rendered.pages.length === 0
    ) {
      throw new Error(
        "NAVTA could not render any pages from this PDF."
      );
    }

    const detectedQuestions =
      await analyseRenderedPages({
        pages:
          rendered.pages,

        // Current document service gives document-wide
        // extracted text. The rendered image remains the
        // primary source for visual analysis.
        text:
          documentResult.text ||
          "",

        hints,
      });

    const pageMap =
      new Map();

    for (
      const page of
      rendered.pages
    ) {
      pageMap.set(
        page.pageNumber,
        page
      );
    }

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
          rawQuestion
        );

      if (
        !validation.valid
      ) {
        droppedQuestions.push({
          ...validation.question,

          reason:
            validation.reasons.join(
              " "
            ),

          dropReason:
            validation.reasons.join(
              " "
            ),
        });

        continue;
      }

      const question =
        validation.question;

      const renderedPage =
        pageMap.get(
          Number(
            question.sourcePage
          )
        );

      const visual =
        await processQuestionVisual({
          question,
          renderedPage,
          sourceFileName:
            file.originalname,
        });

      const importQuestion =
        buildImportQuestion({
          question,
          questionImage:
            visual.questionImage,

          sourceFileName:
            file.originalname,

          fileType:
            "pdf",
        });

      if (
        question.hasVisual &&
        !visual.questionImage
      ) {
        droppedQuestions.push({
          ...importQuestion,

          hasVisual:
            true,

          visualDescription:
            question.visualDescription,

          reason:
            visual.visualWarning ||
            "The question requires a diagram, but the diagram could not be preserved.",

          dropReason:
            visual.visualWarning ||
            "The question requires a diagram, but the diagram could not be preserved.",
        });

        continue;
      }

      acceptedQuestions.push(
        importQuestion
      );
    }

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
// MAIN IMPORT SERVICE
// =====================================================

const analyseNavtaImport =
  async ({
    file,
    subject,
    exam,
    classLevel,
  }) => {
    if (!file) {
      throw new Error(
        "Please upload a PDF, DOCX or TXT file."
      );
    }

    if (
      !process.env.OPENAI_API_KEY
    ) {
      throw new Error(
        "OPENAI_API_KEY is not configured on the server."
      );
    }

    const fileType =
      getFileType(
        file.originalname
      );

    const documentResult =
      await processNavtaDocument(
        file
      );

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

    // =================================================
    // PDF
    // =================================================

    if (
      fileType === "pdf"
    ) {
      const result =
        await processPdfImport({
          file,
          documentResult,
          hints,
        });

      return {
        ...result,

        summary: {
          detected:
            result
              .acceptedQuestions
              .length +
            result
              .droppedQuestions
              .length,

          accepted:
            result
              .acceptedQuestions
              .length,

          dropped:
            result
              .droppedQuestions
              .length,
        },
      };
    }

    // =================================================
    // DOCX / TXT
    // =================================================
    //
    // We intentionally do not silently process these
    // incorrectly yet.
    //
    // DOCX needs question ↔ embedded-image association.
    // TXT needs a text-only AI parser.
    //
    // Those are the next two adapters.
    // =================================================

    if (
      fileType === "docx"
    ) {
      throw new Error(
        "DOCX NAVTA AI import is being connected next. PDF visual import is ready first."
      );
    }

    if (
      fileType === "txt"
    ) {
      throw new Error(
        "TXT NAVTA AI import is being connected next. PDF visual import is ready first."
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
