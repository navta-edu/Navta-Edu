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
// NAVTA CHAPTER WHITELIST
// =====================================================

const ALLOWED_CHAPTERS = {
  Physics: {
    "Class 11": [
      "Units and Measurements",
      "Motion in a Straight Line",
      "Motion in a Plane",
      "Laws of Motion",
      "Work, Energy and Power",
      "System of Particles and Rotational Motion",
      "Gravitation",
      "Mechanical Properties of Solids",
      "Mechanical Properties of Fluids",
      "Thermal Properties of Matter",
      "Thermodynamics",
      "Kinetic Theory",
      "Oscillations",
      "Waves",
    ],

    "Class 12": [
      "Electric Charges and Fields",
      "Electrostatic Potential and Capacitance",
      "Current Electricity",
      "Moving Charges and Magnetism",
      "Magnetism and Matter",
      "Electromagnetic Induction",
      "Alternating Current",
      "Electromagnetic Waves",
      "Ray Optics and Optical Instruments",
      "Wave Optics",
      "Dual Nature of Radiation and Matter",
      "Atoms",
      "Nuclei",
      "Semiconductor Electronics",
    ],
  },

  Chemistry: {
    "Class 11": [
      "Some Basic Concepts of Chemistry",
      "Structure of Atom",
      "Classification of Elements and Periodicity in Properties",
      "Chemical Bonding and Molecular Structure",
      "Thermodynamics",
      "Equilibrium",
      "Redox Reactions",
      "Organic Chemistry: Some Basic Principles and Techniques",
      "Hydrocarbons",
    ],

    "Class 12": [
      "Solutions",
      "Electrochemistry",
      "Chemical Kinetics",
      "The d- and f-Block Elements",
      "Coordination Compounds",
      "Haloalkanes and Haloarenes",
      "Alcohols, Phenols and Ethers",
      "Aldehydes, Ketones and Carboxylic Acids",
      "Amines",
      "Biomolecules",
    ],
  },

  Maths: {
    "Class 11": [
      "Sets",
      "Relations and Functions",
      "Trigonometric Functions",
      "Complex Numbers and Quadratic Equations",
      "Linear Inequalities",
      "Permutations and Combinations",
      "Binomial Theorem",
      "Sequences and Series",
      "Straight Lines",
      "Conic Sections",
      "Introduction to Three Dimensional Geometry",
      "Limits and Derivatives",
      "Statistics",
      "Probability",
    ],

    "Class 12": [
      "Relations and Functions",
      "Inverse Trigonometric Functions",
      "Matrices",
      "Determinants",
      "Continuity and Differentiability",
      "Applications of Derivatives",
      "Integrals",
      "Applications of Integrals",
      "Differential Equations",
      "Vector Algebra",
      "Three Dimensional Geometry",
      "Linear Programming",
      "Probability",
    ],
  },

  Biology: {
    "Class 11": [
      "The Living World",
      "Biological Classification",
      "Plant Kingdom",
      "Animal Kingdom",
      "Morphology of Flowering Plants",
      "Anatomy of Flowering Plants",
      "Structural Organisation in Animals",
      "Cell: The Unit of Life",
      "Biomolecules",
      "Cell Cycle and Cell Division",
      "Photosynthesis in Higher Plants",
      "Respiration in Plants",
      "Plant Growth and Development",
      "Breathing and Exchange of Gases",
      "Body Fluids and Circulation",
      "Excretory Products and their Elimination",
      "Locomotion and Movement",
      "Neural Control and Coordination",
      "Chemical Coordination and Integration",
    ],

    "Class 12": [
      "Sexual Reproduction in Flowering Plants",
      "Human Reproduction",
      "Reproductive Health",
      "Principles of Inheritance and Variation",
      "Molecular Basis of Inheritance",
      "Evolution",
      "Human Health and Disease",
      "Microbes in Human Welfare",
      "Biotechnology: Principles and Processes",
      "Biotechnology and its Applications",
      "Organisms and Populations",
      "Ecosystem",
      "Biodiversity and Conservation",
    ],
  },
};

const getAllowedChapters = (
  subject,
  classLevel
) => {
  return (
    ALLOWED_CHAPTERS?.[subject]?.[classLevel] ||
    []
  );
};

// =====================================================
// SETTINGS
// =====================================================

const MAX_PDF_PAGES_PER_IMPORT = Math.max(
  1,
  Math.min(
    250,
    Number(
      process.env.NAVTA_AI_MAX_PDF_PAGES || 100
    ) || 100
  )
);

const QUESTION_PROCESS_CONCURRENCY = Math.max(
  1,
  Math.min(
    6,
    Number(
      process.env.NAVTA_AI_QUESTION_CONCURRENCY || 4
    ) || 4
  )
);

const NAVTA_AI_PDF_RENDER_SCALE = Math.max(
  1.6,
  Math.min(
    3,
    Number(
      process.env.NAVTA_AI_PDF_RENDER_SCALE || 2.2
    ) || 2.2
  )
);

const NAVTA_AI_VISUAL_CROP_PADDING = Math.max(
  0,
  Math.min(
    0.04,
    Number(
      process.env.NAVTA_AI_VISUAL_CROP_PADDING || 0.008
    ) || 0.008
  )
);

const NAVTA_AI_MIN_VISUAL_BOX_WIDTH = Math.max(
  0.005,
  Math.min(
    0.08,
    Number(
      process.env.NAVTA_AI_MIN_VISUAL_BOX_WIDTH || 0.025
    ) || 0.025
  )
);

const NAVTA_AI_MIN_VISUAL_BOX_HEIGHT = Math.max(
  0.005,
  Math.min(
    0.08,
    Number(
      process.env.NAVTA_AI_MIN_VISUAL_BOX_HEIGHT || 0.025
    ) || 0.025
  )
);

// =====================================================
// HELPERS
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

const normalizeConfidence = (
  value
) => {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return null;
  }

  if (
    numeric >= 0 &&
    numeric <= 1
  ) {
    return numeric;
  }

  if (
    numeric > 1 &&
    numeric <= 100
  ) {
    return numeric / 100;
  }

  return null;
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

const toFiniteNumber = (
  value
) => {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
};

const normalizeBoundingBox = (
  box
) => {
  if (
    !box ||
    typeof box !== "object"
  ) {
    return null;
  }

  let x =
    toFiniteNumber(
      box.x
    );

  let y =
    toFiniteNumber(
      box.y
    );

  let width =
    toFiniteNumber(
      box.width
    );

  let height =
    toFiniteNumber(
      box.height
    );

  if (
    [
      x,
      y,
      width,
      height,
    ].some(
      (value) =>
        value === null
    )
  ) {
    return null;
  }

  if (
    x > 1 ||
    y > 1 ||
    width > 1 ||
    height > 1
  ) {
    if (
      x >= 0 &&
      y >= 0 &&
      x <= 100 &&
      y <= 100 &&
      width > 0 &&
      height > 0 &&
      width <= 100 &&
      height <= 100
    ) {
      x /= 100;
      y /= 100;
      width /= 100;
      height /= 100;
    }
  }

  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  x = Math.max(
    0,
    Math.min(
      1,
      x
    )
  );

  y = Math.max(
    0,
    Math.min(
      1,
      y
    )
  );

  width = Math.max(
    0,
    Math.min(
      1 - x,
      width
    )
  );

  height = Math.max(
    0,
    Math.min(
      1 - y,
      height
    )
  );

  if (
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return {
    x,
    y,
    width,
    height,
  };
};

const expandBoundingBox = (
  box,
  padding = 0
) => {
  const normalized =
    normalizeBoundingBox(
      box
    );

  if (
    !normalized
  ) {
    return null;
  }

  const safePadding =
    Math.max(
      0,
      Math.min(
        0.2,
        Number(
          padding
        ) || 0
      )
    );

  const x =
    Math.max(
      0,
      normalized.x -
        safePadding
    );

  const y =
    Math.max(
      0,
      normalized.y -
        safePadding
    );

  const right =
    Math.min(
      1,
      normalized.x +
        normalized.width +
        safePadding
    );

  const bottom =
    Math.min(
      1,
      normalized.y +
        normalized.height +
        safePadding
    );

  const width =
    right - x;

  const height =
    bottom - y;

  if (
    width <= 0 ||
    height <= 0
  ) {
    return normalized;
  }

  return {
    x,
    y,
    width,
    height,
  };
};

const isUsableVisualBoundingBox = (
  box
) => {
  const normalized =
    normalizeBoundingBox(
      box
    );

  if (
    !normalized
  ) {
    return false;
  }

  return (
    normalized.width >=
      NAVTA_AI_MIN_VISUAL_BOX_WIDTH &&
    normalized.height >=
      NAVTA_AI_MIN_VISUAL_BOX_HEIGHT
  );
};

const normalizeOptionVisualBoundingBoxes = (
  value
) => {
  const source =
    safeArray(value);

  return [0, 1, 2, 3].map(
    (index) => {
      const box =
        normalizeBoundingBox(
          source[index]
        );

      return isUsableVisualBoundingBox(
        box
      )
        ? box
        : null;
    }
  );
};

// =====================================================
// IMPORTANT VISUAL CROP RULE
// =====================================================
//
// We DO NOT fall back to the full questionBoundingBox.
//
// If Gemini detects a real visual, it must provide a usable
// visualBoundingBox.
//
// This prevents NAVTA from storing the entire question as
// a giant screenshot when only a diagram/reaction/graph is
// required.
// =====================================================

const resolveBestVisualCropBox = (
  question = {}
) => {
  const visualBox =
    normalizeBoundingBox(
      question.visualBoundingBox
    );

  if (
    !isUsableVisualBoundingBox(
      visualBox
    )
  ) {
    return {
      box:
        null,

      originalBox:
        null,

      usedFallback:
        false,
    };
  }

  return {
    box:
      expandBoundingBox(
        visualBox,
        NAVTA_AI_VISUAL_CROP_PADDING
      ),

    originalBox:
      visualBox,

    usedFallback:
      false,
  };
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
// REMOVE DUPLICATED MCQ OPTIONS FROM QUESTION STEM
// =====================================================
//
// Gemini/PDF extraction can occasionally return the same
// four MCQ options both inside `question` and in `options`.
// This helper removes ONLY a labelled trailing option block.
// It does not remove ordinary numbered statements from the
// middle of a question.
//
// No external service is required, so this cannot cause the
// backend to fail because of a missing V2 helper module.
// =====================================================

const escapeRegex = (
  value = ""
) =>
  String(
    value
  ).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

const stripDuplicatedOptionsFromQuestion = (
  questionText = "",
  options = []
) => {
  const text =
    cleanString(
      questionText
    );

  const cleanOptions =
    safeArray(
      options
    )
      .map(
        (option) =>
          cleanString(
            option
          )
      )
      .filter(Boolean);

  if (
    !text ||
    cleanOptions.length !== 4
  ) {
    return text;
  }

  const numericLabels = [
    String.raw`(?:\(\s*1\s*\)|1[\.\)])`,
    String.raw`(?:\(\s*2\s*\)|2[\.\)])`,
    String.raw`(?:\(\s*3\s*\)|3[\.\)])`,
    String.raw`(?:\(\s*4\s*\)|4[\.\)])`,
  ];

  const alphaLabels = [
    String.raw`(?:\(\s*[Aa]\s*\)|[Aa][\.\)])`,
    String.raw`(?:\(\s*[Bb]\s*\)|[Bb][\.\)])`,
    String.raw`(?:\(\s*[Cc]\s*\)|[Cc][\.\)])`,
    String.raw`(?:\(\s*[Dd]\s*\)|[Dd][\.\)])`,
  ];

  const buildTrailingPattern = (
    labels
  ) => {
    const parts =
      cleanOptions.map(
        (option, index) => {
          const escaped =
            escapeRegex(
              option
            ).replace(
              /\s+/g,
              String.raw`\s+`
            );

          return (
            `${labels[index]}` +
            String.raw`\s*` +
            escaped
          );
        }
      );

    return new RegExp(
      String.raw`\s*` +
        parts.join(
          String.raw`\s*`
        ) +
        String.raw`\s*$`,
      "i"
    );
  };

  for (
    const labels of [
      numericLabels,
      alphaLabels,
    ]
  ) {
    const pattern =
      buildTrailingPattern(
        labels
      );

    if (
      pattern.test(
        text
      )
    ) {
      return text
        .replace(
          pattern,
          ""
        )
        .trim();
    }
  }

  return text;
};

// =====================================================
// VALIDATE QUESTION
// =====================================================

const validateDetectedQuestion = (
  rawQuestion,
  hints = {}
) => {
  const hintedSubject =
    normalizeSubject(
      hints?.subject
    );

  const hintedExam =
    normalizeExam(
      hints?.exam
    );

  const hintedClassLevel =
    normalizeClassLevel(
      hints?.classLevel
    );

  const hintedChapter =
    cleanString(
      hints?.chapter
    );

  const aiChapter =
    cleanString(
      rawQuestion?.chapter
    );

  const normalizedQuestionBoundingBox =
    normalizeBoundingBox(
      rawQuestion?.questionBoundingBox
    );

  const normalizedVisualBoundingBox =
    normalizeBoundingBox(
      rawQuestion?.visualBoundingBox
    );

  const normalizedOptionVisualBoundingBoxes =
    normalizeOptionVisualBoundingBoxes(
      rawQuestion?.optionVisualBoundingBoxes
    );

  const hasDetectedVisual =
    Boolean(
      rawQuestion?.hasVisual
    );

  const question = {
    ...rawQuestion,

    question:
      cleanString(
        rawQuestion?.question
      ),

    subject:
      hintedSubject ||
      normalizeSubject(
        rawQuestion?.subject
      ),

    exam:
      hintedExam ||
      normalizeExam(
        rawQuestion?.exam
      ),

    classLevel:
      hintedClassLevel ||
      normalizeClassLevel(
        rawQuestion?.classLevel
      ),

    chapter:
      hintedChapter ||
      aiChapter,

    detectedChapter:
      aiChapter,

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

    hasVisual:
      Boolean(
        hasDetectedVisual &&
        normalizedVisualBoundingBox
      ),

    visualType:
      cleanString(
        rawQuestion?.visualType ||
        "none"
      ),

    visualDescription:
      cleanString(
        rawQuestion?.visualDescription
      ),

    questionBoundingBox:
      normalizedQuestionBoundingBox,

    visualBoundingBox:
      normalizedVisualBoundingBox,

    optionVisualBoundingBoxes:
      normalizedOptionVisualBoundingBoxes,

    hasOptionVisuals:
      normalizedOptionVisualBoundingBoxes.some(
        Boolean
      ),

    chapterConfidence:
      normalizeConfidence(
        rawQuestion?.chapterConfidence
      ),

    answerConfidence:
      normalizeConfidence(
        rawQuestion?.answerConfidence
      ),

    classificationConfidence:
      normalizeConfidence(
        rawQuestion?.classificationConfidence
      ),

    difficultyConfidence:
      normalizeConfidence(
        rawQuestion?.difficultyConfidence
      ),

    needsReview:
      Boolean(
        rawQuestion?.needsReview
      ),
  };

  if (
    question.questionType ===
      "mcq" &&
    question.options.length ===
      4
  ) {
    question.question =
      stripDuplicatedOptionsFromQuestion(
        question.question,
        question.options
      );
  }

  const reasons =
    [];

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

  if (
    !question.question
  ) {
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
      "Subject could not be identified."
    );
  }

  if (
    !VALID_EXAMS.has(
      question.exam
    )
  ) {
    reasons.push(
      "Exam type could not be identified."
    );
  }

  if (
    !VALID_CLASSES.has(
      question.classLevel
    )
  ) {
    reasons.push(
      "Class level could not be identified."
    );
  }

  if (
    !question.chapter
  ) {
    reasons.push(
      "Chapter could not be identified."
    );
  } else {
    const validChapters =
      getAllowedChapters(
        question.subject,
        question.classLevel
      );

    if (
      validChapters.length > 0 &&
      !validChapters.includes(
        question.chapter
      )
    ) {
      reasons.push(
        `Invalid chapter "${question.chapter}" for ${question.subject} ${question.classLevel}.`
      );
    }
  }

  if (
    hintedChapter &&
    aiChapter &&
    aiChapter !== hintedChapter
  ) {
    question.chapterMismatch =
      true;

    question.needsReview =
      true;
  }

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

  if (
    !VALID_QUESTION_TYPES.has(
      question.questionType
    )
  ) {
    reasons.push(
      "Question type could not be identified."
    );
  }

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
      question.correctAnswer =
        null;

      question.needsReview =
        true;

      question.answerReviewReason =
        "NAVTA AI could not determine the MCQ answer confidently during the PDF analysis.";
    }
  }

  if (
    question.chapterConfidence !==
      null &&
    question.chapterConfidence <
      0.9
  ) {
    question.needsReview =
      true;
  }

  if (
    question.answerConfidence !==
      null &&
    question.answerConfidence <
      0.85
  ) {
    question.needsReview =
      true;
  }

  if (
    question.classificationConfidence !==
      null &&
    question.classificationConfidence <
      0.9
  ) {
    question.needsReview =
      true;
  }

  if (
    question.difficultyConfidence !==
      null &&
    question.difficultyConfidence <
      0.8
  ) {
    question.needsReview =
      true;
  }

  if (
    !question.hasVisual
  ) {
    question.visualType =
      "none";

    question.visualDescription =
      "";

    question.visualBoundingBox =
      null;
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
// PROCESS GENUINE VISUAL WITH SAFE CROP
// =====================================================

const processQuestionVisual =
  async ({
    question,
    renderedPage,
    sourceFileName,
  }) => {
    if (
      !question?.hasVisual
    ) {
      return {
        questionImage:
          null,

        screenshotWarning:
          null,
      };
    }

    if (
      !renderedPage
    ) {
      return {
        questionImage:
          null,

        screenshotWarning:
          "Source PDF page could not be located for the detected visual.",
      };
    }

    const crop =
      resolveBestVisualCropBox(
        question
      );

    if (
      !crop.box
    ) {
      return {
        questionImage:
          null,

        screenshotWarning:
          "NAVTA detected a visual but no usable visualBoundingBox was available. Whole-question visual fallback is disabled.",
      };
    }

    try {
      const cropped =
        await createQuestionDiagram({
          question: {
            ...question,

            hasVisual:
              true,

            visualBoundingBox:
              crop.box,
          },

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
            "NAVTA detected a visual but could not crop it.",
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

      const upload =
        await uploadQuestionImage({
          buffer:
            cropped.buffer,

          fileName:
            `${safeFileName}-page-${question.sourcePage}-${questionNumber}-visual`,

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
            "NAVTA created the visual crop but could not upload it.",
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
            `Visual for ${
              question.question ||
              "NAVTA question"
            }`,

          sourcePage:
            question.sourcePage,

          visualType:
            question.visualType ||
            "other",

          width:
            upload.width ||
            cropped.width,

          height:
            upload.height ||
            cropped.height,

          bbox:
            crop.box,

          originalBbox:
            crop.originalBox,

          usedFallbackCrop:
            false,
        },

        screenshotWarning:
          null,
      };
    } catch (
      error
    ) {
      console.error(
        "NAVTA QUESTION VISUAL ERROR:",
        error
      );

      return {
        questionImage:
          null,

        screenshotWarning:
          error?.message ||
          "NAVTA could not process the detected visual.",
      };
    }
  };

// =====================================================
// PROCESS OPTION-LEVEL VISUALS
// =====================================================

const processOptionVisuals =
  async ({
    question,
    renderedPage,
    sourceFileName,
  }) => {
    const boxes =
      normalizeOptionVisualBoundingBoxes(
        question?.optionVisualBoundingBoxes
      );

    if (
      !boxes.some(Boolean)
    ) {
      return {
        optionImages:
          [null, null, null, null],

        optionVisualWarnings:
          [],
      };
    }

    if (!renderedPage) {
      return {
        optionImages:
          [null, null, null, null],

        optionVisualWarnings: [
          "Source PDF page could not be located for visual answer options.",
        ],
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

    const optionImages =
      [null, null, null, null];

    const optionVisualWarnings =
      [];

    await Promise.all(
      boxes.map(
        async (
          originalBox,
          optionIndex
        ) => {
          if (!originalBox) {
            return;
          }

          // Use only the option's own box.
          // Never use questionBoundingBox or the stem visual box.
          const cropBox =
            expandBoundingBox(
              originalBox,
              NAVTA_AI_VISUAL_CROP_PADDING
            );

          try {
            const cropped =
              await createQuestionDiagram({
                question: {
                  hasVisual:
                    true,

                  visualBoundingBox:
                    cropBox,
                },

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
              throw new Error(
                "Empty option visual crop."
              );
            }

            const label =
              String.fromCharCode(
                65 + optionIndex
              );

            const upload =
              await uploadQuestionImage({
                buffer:
                  cropped.buffer,

                fileName:
                  `${safeFileName}-page-${question.sourcePage}-${questionNumber}-option-${label}`,

                folder:
                  "navta/ai-imports/pending",
              });

            if (!upload?.url) {
              throw new Error(
                "Option visual upload failed."
              );
            }

            optionImages[
              optionIndex
            ] = {
              optionIndex,

              label,

              url:
                upload.url,

              publicId:
                upload.publicId ||
                "",

              altText:
                `Option ${label} visual`,

              sourcePage:
                question.sourcePage,

              visualType:
                question.visualType ||
                "other",

              width:
                upload.width ||
                cropped.width,

              height:
                upload.height ||
                cropped.height,

              bbox:
                cropBox,

              originalBbox:
                originalBox,
            };
          } catch (error) {
            optionVisualWarnings.push(
              `Option ${String.fromCharCode(
                65 + optionIndex
              )}: ${
                error?.message ||
                "visual could not be processed"
              }`
            );
          }
        }
      )
    );

    return {
      optionImages,
      optionVisualWarnings,
    };
  };

// =====================================================
// BUILD ADMIN REVIEW QUESTION
// =====================================================

const buildImportQuestion = ({
  question,
  questionImage = null,
  optionImages = [null, null, null, null],
  sourceFileName,
  fileType,
  visualWarning = null,
  optionVisualWarnings = [],
}) => {
  const result = {
    questionNumber:
      cleanString(
        question.questionNumber
      ),

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

    hasVisual:
      Boolean(
        question.hasVisual
      ),

    visualType:
      question.hasVisual
        ? (
            question.visualType ||
            "other"
          )
        : "none",

    visualDescription:
      question.hasVisual
        ? (
            question.visualDescription ||
            ""
          )
        : "",

    needsReview:
      Boolean(
        question.needsReview
      ),

    chapterConfidence:
      question.chapterConfidence,

    answerConfidence:
      question.answerConfidence,

    classificationConfidence:
      question.classificationConfidence,

    difficultyConfidence:
      question.difficultyConfidence,

    detectedChapter:
      question.detectedChapter ||
      "",

    chapterMismatch:
      Boolean(
        question.chapterMismatch
      ),

    questionBoundingBox:
      question.questionBoundingBox ||
      null,

    visualBoundingBox:
      question.visualBoundingBox ||
      null,

    optionVisualBoundingBoxes:
      normalizeOptionVisualBoundingBoxes(
        question.optionVisualBoundingBoxes
      ),

    hasOptionVisuals:
      normalizeOptionVisualBoundingBoxes(
        question.optionVisualBoundingBoxes
      ).some(Boolean),

    optionImages:
      safeArray(optionImages)
        .slice(0, 4)
        .map(
          (image) =>
            image?.url
              ? image
              : null
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

  // ===================================================
  // MCQ
  // ===================================================

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

  // ===================================================
  // SHORT / LONG ANSWER
  // ===================================================

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

  // ===================================================
  // QUESTION VISUAL
  // ===================================================

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
    result.questionImage =
      null;

    result.questionImages =
      [];
  }

  // ===================================================
  // VISUAL WARNING
  // ===================================================

  if (
    visualWarning
  ) {
    result.visualWarning =
      visualWarning;

    result.needsReview =
      true;
  }

  if (
    safeArray(
      optionVisualWarnings
    ).length > 0
  ) {
    result.optionVisualWarnings =
      safeArray(
        optionVisualWarnings
      );

    result.needsReview =
      true;
  }

  return result;
};

// =====================================================
// LIMITED CONCURRENCY
// =====================================================
//
// This prevents NAVTA from trying to process/upload too
// many question diagrams simultaneously.
//
// It also helps reduce:
// - server load
// - Cloudinary load
// - memory spikes
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
// IMPORT-LEVEL DUPLICATE GUARD
// =====================================================
//
// AI can occasionally detect the same question twice,
// especially when:
//
// - a question crosses page boundaries
// - a PDF has unusual spacing
// - the same question number is visually repeated
//
// We therefore create a simplified fingerprint before
// continuing with visual processing.
// =====================================================

const normalizeImportFingerprintText = (
  value = ""
) => {
  return cleanString(
    value
  )
    .toLowerCase()

    // Remove leading question numbers such as:
    // 1.
    // 1)
    // Q1.
    // Question 1:
    .replace(
      /^\s*(?:q(?:uestion)?\.?\s*)?\d+[a-z]?\s*[\).:\-]\s*/i,
      ""
    )

    // Remove common LaTeX delimiters
    .replace(
      /\$\$?/g,
      " "
    )

    // Remove formatting-only LaTeX commands
    .replace(
      /\\(?:left|right|mathrm|mathbf|mathit|text)\b/g,
      ""
    )

    // Remove begin/end environment declarations
    .replace(
      /\\begin\{[^}]+\}|\\end\{[^}]+\}/g,
      " "
    )

    // Keep only useful comparison characters
    .replace(
      /[^a-z0-9]+/g,
      " "
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
};

// =====================================================
// BUILD QUESTION FINGERPRINT
// =====================================================

const buildImportFingerprint = (
  question = {}
) => {
  const stem =
    normalizeImportFingerprintText(
      question?.question
    );

  const options =
    safeArray(
      question?.options
    )
      .map(
        normalizeImportFingerprintText
      )
      .filter(
        Boolean
      )
      .join(
        "|"
      );

  return stem
    ? `${stem}||${options}`
    : "";
};

// =====================================================
// REMOVE DUPLICATE QUESTIONS
// =====================================================

const removeImportDuplicates = (
  questions = []
) => {
  const seen =
    new Set();

  const result =
    [];

  let removed =
    0;

  for (
    const question of
    safeArray(
      questions
    )
  ) {
    const fingerprint =
      buildImportFingerprint(
        question
      );

    if (
      fingerprint &&
      seen.has(
        fingerprint
      )
    ) {
      removed +=
        1;

      continue;
    }

    if (
      fingerprint
    ) {
      seen.add(
        fingerprint
      );
    }

    result.push(
      question
    );
  }

  if (
    removed > 0
  ) {
    console.log(
      `NAVTA import removed ${removed} duplicate question(s) before visual processing.`
    );
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
    // =================================================
    // RENDER PDF PAGES
    // =================================================

    const rendered =
      await renderPdfPages({
        buffer:
          file.buffer,

        scale:
          NAVTA_AI_PDF_RENDER_SCALE,

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

    // =================================================
    // ANALYSE PDF WITH NAVTA AI
    // =================================================
    //
    // IMPORTANT:
    //
    // analyseRenderedPages() already processes the
    // rendered PDF pages using the batching system in:
    //
    // navtaAIQuestionService.js
    //
    // Do NOT call Gemini once again for every question
    // here.
    //
    // This prevents the old problem where a 5-page PDF
    // could generate many unnecessary Gemini requests
    // and hit the API quota.
    // =================================================

    const detectedQuestionsRaw =
      await analyseRenderedPages({
        pages:
          rendered.pages,

        text:
          documentResult?.text ||
          "",

        hints,
      });

    // =================================================
    // SECOND DUPLICATE PROTECTION
    // =================================================

    const detectedQuestions =
      removeImportDuplicates(
        detectedQuestionsRaw
      );

    console.log(
      `NAVTA AI detected ${detectedQuestions.length} unique question(s) before validation.`
    );

    // =================================================
    // CREATE PAGE LOOKUP
    // =================================================

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

    // =================================================
    // VALIDATE QUESTIONS
    // =================================================

    const preliminaryAccepted =
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
          hints
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

    // =================================================
    // PROCESS VISUALS
    // =================================================
    //
    // Normal equations are NOT screenshots.
    //
    // Examples that remain text/LaTeX:
    //
    // x² + y² = r²
    //
    // \frac{a}{b}
    //
    // \int x dx
    //
    // matrices
    //
    // determinants
    //
    // vectors
    //
    // chemical formulas that can be represented using
    // text/Unicode/LaTeX
    //
    // Real visual objects may become images:
    //
    // graph
    // circuit
    // geometry diagram
    // biology diagram
    // organic structure
    // reaction scheme
    // apparatus
    // labelled scientific figure
    // =================================================

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

          // =============================================
          // QUESTION-STEM VISUAL
          // =============================================

          const visual =
            question.hasVisual
              ? await processQuestionVisual({
                  question,

                  renderedPage,

                  sourceFileName:
                    file.originalname,
                })
              : {
                  questionImage:
                    null,

                  screenshotWarning:
                    null,
                };

          // =============================================
          // OPTION-LEVEL VISUALS
          // =============================================

          const optionVisuals =
            await processOptionVisuals({
              question,

              renderedPage,

              sourceFileName:
                file.originalname,
            });

          return {
            accepted:
              true,

            question:
              buildImportQuestion({
                question,

                questionImage:
                  visual.questionImage,

                optionImages:
                  optionVisuals.optionImages,

                sourceFileName:
                  file.originalname,

                fileType:
                  "pdf",

                visualWarning:
                  visual.screenshotWarning,

                optionVisualWarnings:
                  optionVisuals.optionVisualWarnings,
              }),
          };
        }
      );

    // =================================================
    // FINAL ACCEPTED QUESTIONS
    // =================================================

    const acceptedQuestions =
      processed
        .filter(
          (item) =>
            item?.accepted &&
            item?.question
        )
        .map(
          (item) =>
            item.question
        );

    // =================================================
    // RETURN PDF RESULT
    // =================================================

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

const processTextImport =
  async ({
    file,
    documentResult,
    hints,
    fileType,
  }) => {
    // =================================================
    // AI QUESTION SEPARATION
    // =================================================

    const detectedQuestionsRaw =
      await analyseTextQuestions({
        text:
          documentResult?.text ||
          "",

        hints,
      });

    // =================================================
    // DUPLICATE PROTECTION
    // =================================================

    const detectedQuestions =
      removeImportDuplicates(
        detectedQuestionsRaw
      );

    const acceptedQuestions =
      [];

    const droppedQuestions =
      [];

    // =================================================
    // VALIDATE EACH QUESTION
    // =================================================

    for (
      const rawQuestion of
      detectedQuestions
    ) {
      const validation =
        validateDetectedQuestion(
          rawQuestion,
          hints
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

    // =================================================
    // RETURN TXT / DOCX RESULT
    // =================================================

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
// MAIN NAVTA AI IMPORT
// =====================================================

const analyseNavtaImport =
  async ({
    file,
    subject,
    exam,
    classLevel,
    chapter,
  }) => {
    // =================================================
    // FILE VALIDATION
    // =================================================

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

    // =================================================
    // FILE TYPE
    // =================================================

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

    console.log(
      `NAVTA AI import started: ${file.originalname}`
    );

    // =================================================
    // EXTRACT DOCUMENT CONTENT
    // =================================================

    const documentResult =
      await processNavtaDocument(
        file
      );

    // =================================================
    // NORMALIZE ADMIN SELECTIONS
    // =================================================

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

      chapter:
        cleanString(
          chapter
        ),
    };

    // =================================================
    // GET CHAPTER WHITELIST
    // =================================================

    hints.allowedChapters =
      getAllowedChapters(
        hints.subject,
        hints.classLevel
      );

    // =================================================
    // VALIDATE SELECTED CHAPTER
    // =================================================

    if (
      hints.chapter &&
      hints.allowedChapters.length >
        0 &&
      !hints.allowedChapters.includes(
        hints.chapter
      )
    ) {
      throw new Error(
        `Invalid chapter "${hints.chapter}" for ${hints.subject} ${hints.classLevel}.`
      );
    }

    // =================================================
    // PROCESS DOCUMENT
    // =================================================

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

    // =================================================
    // COUNT QUESTIONS NEEDING REVIEW
    // =================================================

    const needsReview =
      result.acceptedQuestions.filter(
        (question) =>
          question.needsReview
      ).length;

    // =================================================
    // FINAL SUMMARY
    // =================================================

    const summary = {
      detected:
        result.acceptedQuestions.length +
        result.droppedQuestions.length,

      accepted:
        result.acceptedQuestions.length,

      dropped:
        result.droppedQuestions.length,

      needsReview,
    };

    console.log(
      `NAVTA AI import completed: ${file.originalname}`,
      JSON.stringify(
        summary
      )
    );

    // =================================================
    // FINAL RESPONSE
    // =================================================

    return {
      ...result,

      summary,
    };
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  analyseNavtaImport,

  validateDetectedQuestion,
};
