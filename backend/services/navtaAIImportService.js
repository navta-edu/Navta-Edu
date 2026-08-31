// =====================================================
// NAVTA AI IMPORT SERVICE
// =====================================================
//
// Responsibilities:
//
// 1. Process uploaded PDF / DOCX / TXT documents
// 2. Render the COMPLETE PDF
// 3. Send rendered PDF pages to NAVTA AI
// 4. NAVTA AI processes pages in sequential 5-page batches
// 5. Validate detected questions
// 6. Preserve diagrams / graphs / circuits / figures
// 7. Upload question visuals to Cloudinary
// 8. Prepare questions for Admin Preview
//
// IMPORTANT:
//
// This file DOES NOT limit PDF processing to 20 pages.
//
// The complete PDF is rendered.
//
// navtaAIQuestionService.js then processes:
//
// pages 1-5
// pages 6-10
// pages 11-15
// ...
// until the final page.
//
// =====================================================

const {
  processNavtaDocument,
} = require(
  "./navtaDocumentService"
);

const {
  renderPdfPages,
} = require(
  "./navtaPdfVisualService"
);

const {
  analyseRenderedPages,
} = require(
  "./navtaAIQuestionService"
);

const {
  createQuestionDiagram,
} = require(
  "./navtaDiagramCropService"
);

const {
  uploadQuestionImage,
} = require(
  "./navtaImageService"
);


// =====================================================
// PDF PAGE LIMIT
// =====================================================
//
// OLD:
// const MAX_PDF_PAGES_PER_IMPORT = 20;
//
// NEW:
//
// Process the entire PDF.
//
// The actual Gemini batching happens in
// navtaAIQuestionService.js.
//
// =====================================================

const MAX_PDF_PAGES_PER_IMPORT =
  Number.MAX_SAFE_INTEGER;


// =====================================================
// BASIC HELPERS
// =====================================================

const cleanString = (
  value = ""
) => {
  return String(
    value || ""
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


// =====================================================
// NORMALIZE SUBJECT
// =====================================================

const normalizeSubject = (
  value
) => {
  const subject =
    cleanString(
      value
    ).toLowerCase();


  if (
    subject ===
    "physics"
  ) {
    return "Physics";
  }


  if (
    subject ===
    "chemistry"
  ) {
    return "Chemistry";
  }


  if (
    subject ===
      "maths" ||
    subject ===
      "math" ||
    subject ===
      "mathematics"
  ) {
    return "Maths";
  }


  if (
    subject ===
    "biology"
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
  const exam =
    cleanString(
      value
    ).toLowerCase();


  if (
    exam ===
    "neet"
  ) {
    return "NEET";
  }


  if (
    exam ===
      "jee" ||
    exam ===
      "jee main" ||
    exam ===
      "jee mains" ||
    exam ===
      "jee advanced"
  ) {
    return "JEE";
  }


  if (
    exam ===
      "boards" ||
    exam ===
      "board" ||
    exam ===
      "cbse"
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
  const classLevel =
    cleanString(
      value
    ).toLowerCase();


  if (
    [
      "11",
      "class 11",
      "class11",
      "xi",
    ].includes(
      classLevel
    )
  ) {
    return "Class 11";
  }


  if (
    [
      "12",
      "class 12",
      "class12",
      "xii",
    ].includes(
      classLevel
    )
  ) {
    return "Class 12";
  }


  return "";
};


// =====================================================
// NORMALIZE DIFFICULTY
// =====================================================

const normalizeDifficulty = (
  value
) => {
  const difficulty =
    cleanString(
      value
    ).toLowerCase();


  if (
    difficulty ===
    "easy"
  ) {
    return "Easy";
  }


  if (
    difficulty ===
    "medium"
  ) {
    return "Medium";
  }


  if (
    difficulty ===
    "hard"
  ) {
    return "Hard";
  }


  return "";
};


// =====================================================
// NORMALIZE QUESTION TYPE
// =====================================================

const normalizeQuestionType = (
  value
) => {
  const type =
    cleanString(
      value
    ).toLowerCase();


  if (
    type ===
    "mcq"
  ) {
    return "mcq";
  }


  if (
    type ===
    "short"
  ) {
    return "short";
  }


  if (
    type ===
    "long"
  ) {
    return "long";
  }


  return "";
};


// =====================================================
// NORMALIZE OPTIONS
// =====================================================

const normalizeOptions = (
  value
) => {
  return safeArray(
    value
  )
    .map(
      (option) =>
        cleanString(
          option
        )
    )
    .filter(
      Boolean
    );
};


// =====================================================
// NORMALIZE KEY POINTS
// =====================================================

const normalizeKeyPoints = (
  value
) => {
  return safeArray(
    value
  )
    .map(
      (point) =>
        cleanString(
          point
        )
    )
    .filter(
      Boolean
    );
};


// =====================================================
// NORMALIZE CORRECT ANSWER
// =====================================================

const normalizeCorrectAnswer = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }


  const numeric =
    Number(
      value
    );


  if (
    !Number.isInteger(
      numeric
    )
  ) {
    return null;
  }


  if (
    numeric < 0 ||
    numeric > 3
  ) {
    return null;
  }


  return numeric;
};


// =====================================================
// NORMALIZE MAX MARKS
// =====================================================

const normalizeMaxMarks = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }


  const numeric =
    Number(
      value
    );


  if (
    !Number.isFinite(
      numeric
    ) ||
    numeric <= 0
  ) {
    return null;
  }


  return numeric;
};


// =====================================================
// NORMALIZE SOURCE PAGE
// =====================================================

const normalizeSourcePage = (
  value
) => {
  const numeric =
    Number(
      value
    );


  if (
    !Number.isInteger(
      numeric
    ) ||
    numeric <= 0
  ) {
    return null;
  }


  return numeric;
};


// =====================================================
// NORMALIZE VISUAL BOUNDING BOX
// =====================================================

const normalizeVisualBoundingBox = (
  value
) => {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return null;
  }


  const x =
    Number(
      value.x
    );

  const y =
    Number(
      value.y
    );

  const width =
    Number(
      value.width
    );

  const height =
    Number(
      value.height
    );


  if (
    !Number.isFinite(
      x
    ) ||
    !Number.isFinite(
      y
    ) ||
    !Number.isFinite(
      width
    ) ||
    !Number.isFinite(
      height
    )
  ) {
    return null;
  }


  if (
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }


  const safeX =
    Math.max(
      0,
      Math.min(
        1,
        x
      )
    );


  const safeY =
    Math.max(
      0,
      Math.min(
        1,
        y
      )
    );


  const safeWidth =
    Math.max(
      0,
      Math.min(
        width,
        1 -
          safeX
      )
    );


  const safeHeight =
    Math.max(
      0,
      Math.min(
        height,
        1 -
          safeY
      )
    );


  if (
    safeWidth <= 0 ||
    safeHeight <= 0
  ) {
    return null;
  }


  return {
    x:
      safeX,

    y:
      safeY,

    width:
      safeWidth,

    height:
      safeHeight,
  };
};


// =====================================================
// NORMALIZE DETECTED QUESTION
// =====================================================

const normalizeDetectedQuestion = (
  rawQuestion
) => {
  const questionType =
    normalizeQuestionType(
      rawQuestion?.questionType
    );


  const requestedVisual =
    Boolean(
      rawQuestion?.hasVisual
    );


  const visualBoundingBox =
    normalizeVisualBoundingBox(
      rawQuestion?.visualBoundingBox
    );


  return {
    questionNumber:
      cleanString(
        rawQuestion?.questionNumber
      ),

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
      normalizeDifficulty(
        rawQuestion?.difficulty
      ),

    questionType,

    options:
      normalizeOptions(
        rawQuestion?.options
      ),

    correctAnswer:
      normalizeCorrectAnswer(
        rawQuestion?.correctAnswer
      ),

    modelAnswer:
      cleanString(
        rawQuestion?.modelAnswer
      ),

    keyPoints:
      normalizeKeyPoints(
        rawQuestion?.keyPoints
      ),

    maxMarks:
      normalizeMaxMarks(
        rawQuestion?.maxMarks
      ),

    explanation:
      cleanString(
        rawQuestion?.explanation
      ),

    hasVisual:
      requestedVisual,

    visualDescription:
      cleanString(
        rawQuestion?.visualDescription
      ),

    visualBoundingBox,

    sourcePage:
      normalizeSourcePage(
        rawQuestion?.sourcePage
      ),

    drop:
      Boolean(
        rawQuestion?.drop
      ),

    dropReason:
      cleanString(
        rawQuestion?.dropReason
      ),
  };
};


// =====================================================
// VALIDATE DETECTED QUESTION
// =====================================================

const validateDetectedQuestion = (
  rawQuestion
) => {
  const question =
    normalizeDetectedQuestion(
      rawQuestion
    );


  const reasons =
    [];


  // =================================================
  // AI EXPLICITLY DROPPED QUESTION
  // =================================================

  if (
    question.drop
  ) {
    reasons.push(
      question.dropReason ||
        "NAVTA AI marked this question as incomplete or unreliable."
    );
  }


  // =================================================
  // QUESTION TEXT
  // =================================================

  if (
    !question.question
  ) {
    reasons.push(
      "Question text is missing."
    );
  }


  // =================================================
  // SUBJECT
  // =================================================

  if (
    !question.subject
  ) {
    reasons.push(
      "Subject could not be identified."
    );
  }


  // =================================================
  // EXAM
  // =================================================

  if (
    !question.exam
  ) {
    reasons.push(
      "Exam could not be identified."
    );
  }


  // =================================================
  // CLASS
  // =================================================

  if (
    !question.classLevel
  ) {
    reasons.push(
      "Class level could not be identified."
    );
  }


  // =================================================
  // CHAPTER
  // =================================================

  if (
    !question.chapter
  ) {
    reasons.push(
      "Chapter could not be identified."
    );
  }


  // =================================================
  // DIFFICULTY
  // =================================================

  if (
    !question.difficulty
  ) {
    reasons.push(
      "Difficulty could not be identified."
    );
  }


  // =================================================
  // QUESTION TYPE
  // =================================================

  if (
    !question.questionType
  ) {
    reasons.push(
      "Question type could not be identified."
    );
  }


  // =================================================
  // MCQ VALIDATION
  // =================================================

  if (
    question.questionType ===
    "mcq"
  ) {
    if (
      question.options.length !==
      4
    ) {
      reasons.push(
        "MCQ must contain exactly four options."
      );
    }


    if (
      question.correctAnswer ===
      null
    ) {
      reasons.push(
        "MCQ correct answer could not be identified."
      );
    }
  }


  // =================================================
  // WRITTEN QUESTION VALIDATION
  // =================================================
  //
  // IMPORTANT:
  //
  // Do not throw away a readable written question
  // merely because Gemini did not create a detailed
  // explanation/model answer.
  //
  // =================================================

  if (
    [
      "short",
      "long",
    ].includes(
      question.questionType
    )
  ) {
    if (
      question.exam !==
      "Boards"
    ) {
      reasons.push(
        "Short and long questions are supported only for Boards."
      );
    }
  }


  // =================================================
  // SOURCE PAGE
  // =================================================

  if (
    !question.sourcePage
  ) {
    reasons.push(
      "Source PDF page could not be identified."
    );
  }


  // =================================================
  // REQUIRED VISUAL
  // =================================================

  if (
    question.hasVisual &&
    !question.visualBoundingBox
  ) {
    reasons.push(
      "The question requires a visual, but its diagram location could not be identified."
    );
  }


  return {
    valid:
      reasons.length ===
      0,

    reasons,

    question,
  };
};


// =====================================================
// PROCESS QUESTION VISUAL
// =====================================================

const processQuestionVisual =
  async ({
    question,
    renderedPage,
    sourceFileName,
  }) => {
    if (
      !question.hasVisual
    ) {
      return {
        questionImage:
          null,

        visualWarning:
          "",
      };
    }


    if (
      !renderedPage
    ) {
      return {
        questionImage:
          null,

        visualWarning:
          "The source PDF page for this diagram could not be found.",
      };
    }


    if (
      !question.visualBoundingBox
    ) {
      return {
        questionImage:
          null,

        visualWarning:
          "The question requires a diagram, but its position on the PDF page could not be identified.",
      };
    }


    try {
      // =============================================
      // CROP DIAGRAM
      // =============================================

      const cropped =
        await createQuestionDiagram({
          imageBuffer:
            renderedPage.buffer,

          boundingBox:
            question.visualBoundingBox,
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

          visualWarning:
            "NAVTA detected a diagram but could not crop it.",
        };
      }


      // =============================================
      // CLOUDINARY UPLOAD
      // =============================================

      const upload =
        await uploadQuestionImage({
          buffer:
            cropped.buffer,

          fileName:
            sourceFileName,

          pageNumber:
            question.sourcePage,
        });


      if (
        !upload ||
        !upload.url
      ) {
        return {
          questionImage:
            null,

          visualWarning:
            "NAVTA detected a diagram but could not upload it.",
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

        visualWarning:
          "",
      };
    } catch (error) {
      console.error(
        "NAVTA DIAGRAM PROCESSING ERROR:",
        error
      );


      return {
        questionImage:
          null,

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
  questionImage =
    null,
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


  // =================================================
  // PRESERVE ORIGINAL QUESTION NUMBER
  // =================================================

  if (
    question.questionNumber
  ) {
    result.questionNumber =
      question.questionNumber;
  }


  // =================================================
  // MCQ
  // =================================================

  if (
    question.questionType ===
    "mcq"
  ) {
    result.options =
      question.options;

    result.correctAnswer =
      question.correctAnswer;
  }


  // =================================================
  // WRITTEN QUESTION
  // =================================================

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


    if (
      question.maxMarks !==
        null &&
      question.maxMarks !==
        undefined &&
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


  // =================================================
  // QUESTION IMAGE
  // =================================================

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
// PROCESS PDF IMPORT
// =====================================================

const processPdfImport =
  async ({
    file,
    documentResult,
    hints,
  }) => {
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
      "PDF processing mode: COMPLETE PDF"
    );

    console.log(
      "Gemini processing mode: 5 pages per batch"
    );

    console.log(
      "====================================================="
    );


    // =================================================
    // RENDER COMPLETE PDF
    // =================================================

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
      rendered.pages.length ===
        0
    ) {
      throw new Error(
        "NAVTA could not render any pages from this PDF."
      );
    }


    console.log(
      `NAVTA rendered ${rendered.pages.length} PDF page(s).`
    );


    // =================================================
    // GEMINI ANALYSIS
    // =================================================
    //
    // analyseRenderedPages() now handles:
    //
    // pages 1-5
    // pages 6-10
    // pages 11-15
    // ...
    //
    // sequentially.
    //
    // =================================================

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
      `NAVTA AI detected ${detectedQuestions.length} total question(s).`
    );


    // =================================================
    // PAGE LOOKUP
    // =================================================

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


    // =================================================
    // VALIDATE EVERY DETECTED QUESTION
    // =================================================

    for (
      const rawQuestion of
      detectedQuestions
    ) {
      const validation =
        validateDetectedQuestion(
          rawQuestion
        );


      // ===============================================
      // INVALID QUESTION
      // ===============================================

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


      // ===============================================
      // FIND ORIGINAL PDF PAGE
      // ===============================================

      const renderedPage =
        pageMap.get(
          Number(
            question.sourcePage
          )
        );


      // ===============================================
      // DIAGRAM / GRAPH / CIRCUIT
      // ===============================================

      const visual =
        await processQuestionVisual({
          question,

          renderedPage,

          sourceFileName:
            file.originalname,
        });


      // ===============================================
      // BUILD ADMIN PREVIEW OBJECT
      // ===============================================

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


      // ===============================================
      // VISUAL REQUIRED BUT COULD NOT BE PRESERVED
      // ===============================================

      if (
        question.hasVisual &&
        !visual.questionImage
      ) {
        const reason =
          visual.visualWarning ||
          "The question requires a diagram, but the diagram could not be preserved.";


        droppedQuestions.push({
          ...importQuestion,

          hasVisual:
            true,

          visualDescription:
            question.visualDescription,

          reason,

          dropReason:
            reason,
        });


        continue;
      }


      // ===============================================
      // ACCEPT QUESTION
      // ===============================================

      acceptedQuestions.push(
        importQuestion
      );
    }


    // =================================================
    // LOG FINAL COUNTS
    // =================================================

    console.log(
      "====================================================="
    );

    console.log(
      "NAVTA PDF IMPORT COMPLETED"
    );

    console.log(
      `PDF pages processed: ${rendered.pages.length}`
    );

    console.log(
      `AI questions detected: ${detectedQuestions.length}`
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


    return {
      acceptedQuestions,

      droppedQuestions,

      summary: {
        totalPages:
          rendered.pages.length,

        detected:
          detectedQuestions.length,

        accepted:
          acceptedQuestions.length,

        dropped:
          droppedQuestions.length,

        batchSize:
          5,
      },
    };
  };


// =====================================================
// PROCESS NON-PDF IMPORT
// =====================================================

const processTextDocumentImport =
  async ({
    file,
    documentResult,
    hints,
  }) => {
    const text =
      cleanString(
        documentResult?.text
      );


    if (
      !text
    ) {
      throw new Error(
        "NAVTA could not extract readable text from this document."
      );
    }


    // =================================================
    // NON-PDF DOCUMENT SUPPORT
    // =================================================
    //
    // navtaAIQuestionService currently analyses rendered
    // PDF page images.
    //
    // PDF is the primary AI import format.
    //
    // DOCX/TXT support remains explicit here rather than
    // silently creating unreliable questions.
    //
    // =================================================

    throw new Error(
      "NAVTA AI automatic question extraction currently supports PDF files. DOCX and TXT AI extraction will be enabled separately."
    );
  };


// =====================================================
// MAIN IMPORT FUNCTION
// =====================================================

const processNavtaAIImport =
  async ({
    file,
    hints = {},
  }) => {
    if (
      !file
    ) {
      throw new Error(
        "A document file is required."
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
        "The uploaded document is empty."
      );
    }


    // =================================================
    // NORMALIZE ADMIN HINTS
    // =================================================

    const normalizedHints = {
      subject:
        normalizeSubject(
          hints.subject
        ),

      exam:
        normalizeExam(
          hints.exam
        ),

      classLevel:
        normalizeClassLevel(
          hints.classLevel
        ),
    };


    // =================================================
    // EXTRACT DOCUMENT
    // =================================================

    const documentResult =
      await processNavtaDocument({
        file,
      });


    if (
      !documentResult
    ) {
      throw new Error(
        "NAVTA could not process the uploaded document."
      );
    }


    const fileType =
      cleanString(
        documentResult.fileType
      ).toLowerCase();


    // =================================================
    // PDF
    // =================================================

    if (
      fileType ===
        "pdf" ||
      file.mimetype ===
        "application/pdf" ||
      /\.pdf$/i.test(
        file.originalname ||
          ""
      )
    ) {
      return processPdfImport({
        file,

        documentResult,

        hints:
          normalizedHints,
      });
    }


    // =================================================
    // DOCX / TXT
    // =================================================

    return processTextDocumentImport({
      file,

      documentResult,

      hints:
        normalizedHints,
    });
  };


// =====================================================
// ALIASES FOR CONTROLLER COMPATIBILITY
// =====================================================
//
// IMPORTANT:
//
// The existing NAVTA controller calls:
//
// analyseNavtaImport(...)
//
// Therefore this alias MUST remain available.
//
// All aliases point to the same main import function so
// older NAVTA controller/service code remains compatible.
//
// =====================================================

const analyseNavtaImport =
  processNavtaAIImport;


const importNavtaQuestions =
  processNavtaAIImport;


const analyseNavtaDocument =
  processNavtaAIImport;


const processAIImport =
  processNavtaAIImport;


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  // Existing NAVTA controller expects this:
  analyseNavtaImport,

  // Main import function:
  processNavtaAIImport,

  // Backward compatibility:
  importNavtaQuestions,

  analyseNavtaDocument,

  processAIImport,

  // Internal helpers:
  processPdfImport,

  validateDetectedQuestion,

  buildImportQuestion,
};
