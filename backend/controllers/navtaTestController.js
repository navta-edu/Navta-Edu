const NavtaQuestion = require("../models/NavtaQuestion");
const NavtaAIImportJob = require("../models/NavtaAIImportJob");
const Result = require("../models/Result");
const Student = require("../models/Student");
const NavtaTestAttempt = require("../models/NavtaTestAttempt");
const { createAttempt, findAttempt } = require("../services/navtaAttempts");
const { gradeQuestion, parseNumber, roundMarks, writtenAnswerDigest } = require("../services/navtaScoring");
const { selectStandardQuestions, publicQuestion } = require("../services/navtaStandardQuestions");

const BATTLE_QUESTION_FILTER = {
  answerMode: { $in: [null, "single"] },
  "caseStudy.id": { $in: [null, ""] },
};
const cloudinary = require("../config/cloudinary");
const { recordAdminActivity } = require("../services/adminActivity");
const {
  buildQuestionBankFilter,
  findQuestionDuplicates,
  getWorkflowStatus,
  hashQuestionImage,
  initialWorkflowFields,
} = require("../services/navtaQuestionBankService");
const { loadImage, createCanvas } = require("@napi-rs/canvas");
const {
  applyNavtaStreakActivity,
  getNavtaStreakSnapshot,
} = require("./studentController");

// ============================================
// TEST RULES
// ============================================

const TEST_RULES = {
  NEET: {
    mcq: {
      minutesPerQuestion: 1,
      durations: [10, 15, 20, 30, 45, 60],
    },
  },

  JEE: {
    mcq: {
      minutesPerQuestion: 2,
      durations: [10, 20, 30, 40, 60, 90],
    },
  },

  Boards: {
    mcq: {
      minutesPerQuestion: 1,
      durations: [10, 15, 20, 30, 45, 60],
    },

    short: {
      minutesPerQuestion: 3,
      durations: [15, 30, 45, 60, 90],
    },

    long: {
      minutesPerQuestion: 6,
      durations: [30, 60, 90, 120, 180],
    },
  },
};

// ============================================
// VALID VALUES
// ============================================

const allowedExams = {
  Physics: ["NEET", "JEE", "Boards"],
  Chemistry: ["NEET", "JEE", "Boards"],
  Maths: ["JEE", "Boards"],
  Biology: ["NEET", "Boards"],
};


const allowedChapters = {
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

const validDifficulties = ["Easy", "Medium", "Hard"];

const validQuestionTypes = ["mcq", "short", "long"];

// ============================================
// BOSS BATTLE SETTINGS
// ============================================

const BOSS_BATTLE_SIZES = [15, 30, 50];

const BOSS_WIN_PERCENTAGE = 70;

const BOSS_DIFFICULTY_TARGETS = {
  15: {
    Easy: 5,
    Medium: 6,
    Hard: 4,
  },

  30: {
    Easy: 9,
    Medium: 12,
    Hard: 9,
  },

  50: {
    Easy: 15,
    Medium: 20,
    Hard: 15,
  },
};

// ============================================
// HELPERS
// ============================================

// ============================================
// NAVTA AI V2 STUDENT / IMPORT HELPERS
// ============================================

const NAVTA_VISUAL_MARKER = "[[NAVTA_VISUAL]]";

function getQuestionImageUrl(image) {
  if (typeof image === "string") {
    return image.trim();
  }

  if (
    image &&
    typeof image === "object"
  ) {
    return String(
      image.url || ""
    ).trim();
  }

  return "";
}

function normalizeQuestionImage(
  image,
  fallback = {}
) {
  const url =
    getQuestionImageUrl(image);

  if (!url) {
    return null;
  }

  if (
    image &&
    typeof image === "object"
  ) {
    return {
      url,

      publicId:
        String(
          image.publicId || ""
        ).trim(),

      altText:
        String(
          image.altText ||
          fallback.altText ||
          "Question diagram"
        ).trim(),

      sourcePage:
        Number(
          image.sourcePage ??
          fallback.sourcePage
        ) || null,

      width:
        Number(
          image.width
        ) || null,

      height:
        Number(
          image.height
        ) || null,
    };
  }

  return {
    url,

    publicId: "",

    altText:
      String(
        fallback.altText ||
        "Question diagram"
      ).trim(),

    sourcePage:
      Number(
        fallback.sourcePage
      ) || null,

    width: null,

    height: null,
  };
}

function normalizeQuestionImages(
  question = {}
) {
  const images = [];

  const primary =
    normalizeQuestionImage(
      question.questionImage,
      {
        altText:
          question.visualDescription ||
          "Question diagram",

        sourcePage:
          question.sourceDocument
            ?.pageNumber,
      }
    );

  if (primary?.url) {
    images.push(primary);
  }

  if (
    Array.isArray(
      question.questionImages
    )
  ) {
    for (
      const image of
      question.questionImages
    ) {
      const normalized =
        normalizeQuestionImage(
          image,
          {
            altText:
              question.visualDescription ||
              "Question diagram",

            sourcePage:
              question.sourceDocument
                ?.pageNumber,
          }
        );

      if (
        normalized?.url &&
        !images.some(
          (existing) =>
            existing.url ===
            normalized.url
        )
      ) {
        images.push(
          normalized
        );
      }
    }
  }

  return images;
}

function hasQuestionVisualImage(
  question = {}
) {
  return (
    normalizeQuestionImages(
      question
    ).length > 0
  );
}

function normalizeOptionCompareText(
  value = ""
) {
  return String(
    value ?? ""
  )
    .replace(
      /\[\[NAVTA_VISUAL\]\]/gi,
      " "
    )
    .replace(
      /[“”]/g,
      '"'
    )
    .replace(
      /[‘’]/g,
      "'"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .toLowerCase();
}

function escapeRegExp(
  value = ""
) {
  return String(
    value
  ).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function stripDuplicatedMCQOptions(
  questionText = "",
  options = []
) {
  const originalText =
    String(
      questionText ?? ""
    ).trim();

  const cleanOptions =
    Array.isArray(options)
      ? options
          .map(
            (option) =>
              String(
                option ?? ""
              ).trim()
          )
          .filter(Boolean)
      : [];

  if (
    !originalText ||
    cleanOptions.length !== 4
  ) {
    return originalText;
  }

  const labelSets = [
    [
      String.raw`(?:\(\s*1\s*\)|1[\.\)])`,
      String.raw`(?:\(\s*2\s*\)|2[\.\)])`,
      String.raw`(?:\(\s*3\s*\)|3[\.\)])`,
      String.raw`(?:\(\s*4\s*\)|4[\.\)])`,
    ],

    [
      String.raw`(?:\(\s*[Aa]\s*\)|[Aa][\.\)])`,
      String.raw`(?:\(\s*[Bb]\s*\)|[Bb][\.\)])`,
      String.raw`(?:\(\s*[Cc]\s*\)|[Cc][\.\)])`,
      String.raw`(?:\(\s*[Dd]\s*\)|[Dd][\.\)])`,
    ],
  ];

  for (
    const labels of labelSets
  ) {
    const optionParts =
      cleanOptions.map(
        (option, index) => {
          const escaped =
            escapeRegExp(
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

    const pattern =
      new RegExp(
        String.raw`\s*` +
        optionParts.join(
          String.raw`\s*`
        ) +
        String.raw`\s*$`,
        "i"
      );

    if (
      pattern.test(
        originalText
      )
    ) {
      return originalText
        .replace(
          pattern,
          ""
        )
        .trim();
    }
  }

  // Conservative fallback:
  // only remove a labelled option block from the tail.
  const normalized =
    normalizeOptionCompareText(
      originalText
    );

  const tailStart =
    Math.max(
      0,
      Math.floor(
        normalized.length *
        0.45
      )
    );

  const tail =
    normalized.slice(
      tailStart
    );

  const allOptionsPresent =
    cleanOptions.every(
      (option) =>
        tail.includes(
          normalizeOptionCompareText(
            option
          )
        )
    );

  const numericLabels =
    /(?:\(\s*1\s*\)|1[\.\)]).*(?:\(\s*2\s*\)|2[\.\)]).*(?:\(\s*3\s*\)|3[\.\)]).*(?:\(\s*4\s*\)|4[\.\)])/is;

  const alphaLabels =
    /(?:\(\s*a\s*\)|a[\.\)]).*(?:\(\s*b\s*\)|b[\.\)]).*(?:\(\s*c\s*\)|c[\.\)]).*(?:\(\s*d\s*\)|d[\.\)])/is;

  if (
    !allOptionsPresent ||
    (
      !numericLabels.test(
        tail
      ) &&
      !alphaLabels.test(
        tail
      )
    )
  ) {
    return originalText;
  }

  const firstOptionPattern =
    /(?:^|\s)(?:\(\s*(?:1|A)\s*\)|(?:1|A)[\.\)])\s*/gi;

  const matches =
    [
      ...originalText.matchAll(
        firstOptionPattern
      ),
    ];

  const candidate =
    matches.find(
      (match) =>
        Number(
          match.index
        ) >=
        Math.floor(
          originalText.length *
          0.35
        )
    );

  if (!candidate) {
    return originalText;
  }

  return originalText
    .slice(
      0,
      candidate.index
    )
    .trim();
}

function preserveVisualMarker(
  questionText = "",
  hasVisual = false
) {
  const text =
    String(
      questionText ?? ""
    ).trim();

  if (
    !hasVisual ||
    text.includes(
      NAVTA_VISUAL_MARKER
    )
  ) {
    return text;
  }

  return text;
}

function normaliseQuestionType(exam, questionType) {
  if (exam !== "Boards") {
    return "mcq";
  }

  return questionType || "mcq";
}

function getQuestionCount(exam, questionType, duration) {
  const config = TEST_RULES[exam]?.[questionType];

  if (!config) {
    return 0;
  }

  return Math.floor(
    Number(duration) / config.minutesPerQuestion
  );
}

function isAllowedDuration(exam, questionType, duration) {
  const config = TEST_RULES[exam]?.[questionType];

  if (!config) {
    return false;
  }

  return config.durations.includes(Number(duration));
}

// ============================================
// NAVTA RESULT / COIN HELPERS
// ============================================

function calculateNavtaCoins(
  percentage,
  selectedDuration
) {
  const numericPercentage =
    Number(percentage);

  const numericDuration =
    Number(selectedDuration);

  if (
    !Number.isFinite(
      numericPercentage
    ) ||
    !Number.isFinite(
      numericDuration
    )
  ) {
    return 0;
  }

  if (numericPercentage <= 80) {
    return 0;
  }

  return numericDuration < 30
    ? 1
    : 2;
}

function normaliseSubmittedAnswer(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numericValue =
    Number(value);

  return Number.isInteger(
    numericValue
  )
    ? numericValue
    : null;
}


// ============================================
// NAVTA TEST STREAK SAFE UPDATE
// ============================================
//
// The shared streak rules live in studentController.js.
// This wrapper applies them with a conditional MongoDB
// update so multiple NAVTA TESTS completed at nearly the
// same time cannot increase the streak more than once.
//
// All streak dates use Asia/Kolkata through the shared
// helper in studentController.js.
//
async function applyNavtaStreakSafely(
  userId,
  activityDate = new Date()
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const student =
      await Student.findOne({
        user: userId,
      });

    if (!student) {
      throw new Error(
        "Student profile not found."
      );
    }

    const previousDate =
      student.lastNavtaTestDate ??
      null;

    const streakUpdate =
      applyNavtaStreakActivity(
        student,
        activityDate
      );

    // Same India-calendar day, stale activity,
    // or otherwise no streak mutation required.
    if (!streakUpdate.changed) {
      return {
        ...streakUpdate,
        ...getNavtaStreakSnapshot(
          student
        ),
      };
    }

    const updatedStudent =
      await Student.findOneAndUpdate(
        {
          _id: student._id,
          lastNavtaTestDate:
            previousDate,
        },
        {
          $set: {
            currentStreak:
              student.currentStreak,
            longestStreak:
              student.longestStreak,
            lastNavtaTestDate:
              student.lastNavtaTestDate,
            streakRecoveryActive:
              student.streakRecoveryActive,
            streakRecoveryRequired:
              student.streakRecoveryRequired,
            streakRecoveryCompleted:
              student.streakRecoveryCompleted,
            streakLastUpdatedAt:
              student.streakLastUpdatedAt,
          },
        },
        {
          new: true,
        }
      );

    if (updatedStudent) {
      return {
        ...streakUpdate,
        ...getNavtaStreakSnapshot(
          updatedStudent
        ),
      };
    }

    // Another completion changed the streak between
    // our read and write. Re-read and try again.
  }

  const latestStudent =
    await Student.findOne({
      user: userId,
    });

  if (!latestStudent) {
    throw new Error(
      "Student profile not found."
    );
  }

  return {
    changed: false,
    status:
      "streak-refresh-required",
    ...getNavtaStreakSnapshot(
      latestStudent
    ),
  };
}

// ============================================
// SHUFFLE HELPER
// ============================================

function shuffleArray(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [copy[i], copy[j]] = [
      copy[j],
      copy[i],
    ];
  }

  return copy;
}

// ============================================
// QUESTION DUPLICATE PROTECTION
// ============================================
//
// Three layers protect NAVTA from duplicate AI questions:
// 1. AI service dedupe during extraction.
// 2. Import-service dedupe before review.
// 3. This controller checks both the incoming approval list
//    and the existing MongoDB question bank before saving.
//
// No schema change is required.
// ============================================

function normalizeQuestionFingerprintText(
  value = ""
) {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /^\s*(?:q(?:uestion)?\.?\s*)?\d+[a-z]?\s*[\).:\-]\s*/i,
      ""
    )
    .replace(
      /\$\$?/g,
      " "
    )
    .replace(
      /\\(?:left|right|mathrm|mathbf|mathit|text)\b/g,
      ""
    )
    .replace(
      /\\begin\{[^}]+\}|\\end\{[^}]+\}/g,
      " "
    )
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function buildQuestionFingerprint(
  question = {}
) {
  const stem =
    normalizeQuestionFingerprintText(
      question?.question
    );

  const options =
    Array.isArray(
      question?.options
    )
      ? question.options
          .map(
            normalizeQuestionFingerprintText
          )
          .filter(Boolean)
          .join("|")
      : "";

  if (
    !stem
  ) {
    return "";
  }

  return `${stem}||${options}`;
}

function getQuestionTokenSet(
  value = ""
) {
  return new Set(
    normalizeQuestionFingerprintText(
      value
    )
      .split(" ")
      .filter(
        (token) =>
          token.length > 1
      )
  );
}

function questionTextSimilarity(
  a = "",
  b = ""
) {
  const left =
    getQuestionTokenSet(
      a
    );

  const right =
    getQuestionTokenSet(
      b
    );

  if (
    left.size === 0 ||
    right.size === 0
  ) {
    return 0;
  }

  let intersection =
    0;

  for (
    const token of left
  ) {
    if (
      right.has(token)
    ) {
      intersection +=
        1;
    }
  }

  const union =
    left.size +
    right.size -
    intersection;

  return union > 0
    ? intersection / union
    : 0;
}

function sameNormalizedOptions(
  a = {},
  b = {}
) {
  const left =
    Array.isArray(
      a?.options
    )
      ? a.options.map(
          normalizeQuestionFingerprintText
        )
      : [];

  const right =
    Array.isArray(
      b?.options
    )
      ? b.options.map(
          normalizeQuestionFingerprintText
        )
      : [];

  if (
    left.length !==
      right.length
  ) {
    return false;
  }

  return left.every(
    (value, index) =>
      value ===
      right[index]
  );
}

function areLikelySameQuestion(
  a = {},
  b = {}
) {
  const exactA =
    buildQuestionFingerprint(
      a
    );

  const exactB =
    buildQuestionFingerprint(
      b
    );

  if (
    exactA &&
    exactA ===
      exactB
  ) {
    return true;
  }

  const similarity =
    questionTextSimilarity(
      a?.question,
      b?.question
    );

  return (
    similarity >=
      0.96 &&
    sameNormalizedOptions(
      a,
      b
    )
  );
}

// ============================================
// ADMIN MANUAL IMAGE CROP
// ============================================
//
// Supports cropping the CURRENT AI-CROPPED image.
// This does not alter Gemini extraction or the automatic crop pipeline.
//
// crop values are normalized 0..1 coordinates relative to the current image.
//
function normalizeAdminCropBox(value = {}) {
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
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0 ||
    x > 1 ||
    y > 1 ||
    x + width > 1.0001 ||
    y + height > 1.0001
  ) {
    return null;
  }

  return { x, y, width, height };
}

async function downloadImageBuffer(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Could not download current question image (${response.status}).`
    );
  }

  return Buffer.from(
    await response.arrayBuffer()
  );
}

async function cropCurrentQuestionImage({
  imageUrl,
  cropBox,
}) {
  const normalizedBox =
    normalizeAdminCropBox(cropBox);

  if (!normalizedBox) {
    throw new Error(
      "Invalid crop area. Crop coordinates must be normalized values between 0 and 1."
    );
  }

  const sourceBuffer =
    await downloadImageBuffer(imageUrl);

  const sourceImage =
    await loadImage(sourceBuffer);

  const sourceWidth =
    Number(sourceImage.width);

  const sourceHeight =
    Number(sourceImage.height);

  if (
    !sourceWidth ||
    !sourceHeight
  ) {
    throw new Error(
      "Could not read the current question image dimensions."
    );
  }

  const sx = Math.max(
    0,
    Math.floor(
      normalizedBox.x *
      sourceWidth
    )
  );

  const sy = Math.max(
    0,
    Math.floor(
      normalizedBox.y *
      sourceHeight
    )
  );

  const sw = Math.max(
    1,
    Math.min(
      sourceWidth - sx,
      Math.ceil(
        normalizedBox.width *
        sourceWidth
      )
    )
  );

  const sh = Math.max(
    1,
    Math.min(
      sourceHeight - sy,
      Math.ceil(
        normalizedBox.height *
        sourceHeight
      )
    )
  );

  const canvas =
    createCanvas(sw, sh);

  const context =
    canvas.getContext("2d");

  context.drawImage(
    sourceImage,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    sw,
    sh
  );

  return {
    buffer:
      canvas.toBuffer("image/png"),

    width: sw,
    height: sh,

    cropBox:
      normalizedBox,
  };
}

function uploadAdminCropBuffer(
  buffer,
  {
    folder = "navta/admin-crops",
  } = {}
) {
  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            format: "png",
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(result);
          }
        );

      stream.end(buffer);
    }
  );
}

// POST /.../:id/crop-ai-image
//
// Expected body:
// {
//   crop: { x, y, width, height }
// }
//
// Coordinates are percentages expressed as 0..1.
// Example: { x: 0.1, y: 0.15, width: 0.75, height: 0.6 }
//
// The endpoint intentionally crops the EXISTING AI image.
// It does not need the original PDF page.
exports.cropAIQuestionImage = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const cropBox =
      normalizeAdminCropBox(
        req.body?.crop
      );

    if (!cropBox) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a valid crop area.",
      });
    }

    const question =
      await NavtaQuestion.findById(
        id
      );

    if (!question) {
      return res.status(404).json({
        success: false,
        message:
          "Question not found.",
      });
    }

    const currentImage =
      normalizeQuestionImage(
        question.questionImage,
        {
          altText:
            question.visualDescription ||
            "Question diagram",

          sourcePage:
            question.sourceDocument
              ?.pageNumber,
        }
      );

    if (!currentImage?.url) {
      return res.status(400).json({
        success: false,
        message:
          "This question does not have an image to crop.",
      });
    }

    const cropped =
      await cropCurrentQuestionImage({
        imageUrl:
          currentImage.url,

        cropBox,
      });

    const uploaded =
      await uploadAdminCropBuffer(
        cropped.buffer
      );

    const nextImage = {
      url:
        uploaded.secure_url ||
        uploaded.url,

      publicId:
        uploaded.public_id ||
        "",

      altText:
        currentImage.altText ||
        "Question diagram",

      sourcePage:
        currentImage.sourcePage ||
        question.sourceDocument
          ?.pageNumber ||
        null,

      width:
        Number(
          uploaded.width
        ) ||
        cropped.width,

      height:
        Number(
          uploaded.height
        ) ||
        cropped.height,
    };

    // Preserve the first automatic AI image so the admin can reset later.
    const existingOriginalAIImage =
      normalizeQuestionImage(
        question.originalAIQuestionImage
      );

    const originalAIImage =
      existingOriginalAIImage?.url
        ? existingOriginalAIImage
        : currentImage;

    question.questionImage =
      nextImage;

    question.questionImages =
      [nextImage];

    question.hasVisual =
      true;

    // These extra fields are written only when the schema supports them.
    // If your schema uses strict mode and does not contain them, the main
    // questionImage update still works.
    if (
      question.schema?.path(
        "originalAIQuestionImage"
      )
    ) {
      question.originalAIQuestionImage =
        originalAIImage;
    }

    if (
      question.schema?.path(
        "imageCropSource"
      )
    ) {
      question.imageCropSource =
        "admin-ai-crop";
    }

    if (
      question.schema?.path(
        "adminImageCrop"
      )
    ) {
      question.adminImageCrop =
        cropBox;
    }

    await question.save();

    return res.json({
      success: true,
      message:
        "Question image cropped successfully.",

      questionImage:
        nextImage,

      questionImages:
        [nextImage],

      crop:
        cropBox,

      imageCropSource:
        "admin-ai-crop",
    });
  } catch (error) {
    console.error(
      "CROP NAVTA AI QUESTION IMAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to crop question image.",
    });
  }
};

// POST /.../:id/reset-ai-image
//
// Restores the first AI crop when originalAIQuestionImage is stored
// in the NavtaQuestion schema.
exports.resetAIQuestionImage = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const question =
      await NavtaQuestion.findById(
        id
      );

    if (!question) {
      return res.status(404).json({
        success: false,
        message:
          "Question not found.",
      });
    }

    const original =
      normalizeQuestionImage(
        question.originalAIQuestionImage
      );

    if (!original?.url) {
      return res.status(400).json({
        success: false,
        message:
          "The original AI crop is not stored for this question.",
      });
    }

    question.questionImage =
      original;

    question.questionImages =
      [original];

    question.hasVisual =
      true;

    if (
      question.schema?.path(
        "imageCropSource"
      )
    ) {
      question.imageCropSource =
        "ai";
    }

    if (
      question.schema?.path(
        "adminImageCrop"
      )
    ) {
      question.adminImageCrop =
        null;
    }

    await question.save();

    return res.json({
      success: true,
      message:
        "Original AI crop restored.",

      questionImage:
        original,

      questionImages:
        [original],

      imageCropSource:
        "ai",
    });
  } catch (error) {
    console.error(
      "RESET NAVTA AI QUESTION IMAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to restore the original AI crop.",
    });
  }
};


// ============================================
// ADMIN - SAVE MANUALLY CROPPED PDF QUESTION
// ============================================
//
// POST /api/navta-test/questions/pdf-crop
//
// Expected:
// multipart/form-data
//
// questionImage  -> cropped PNG/JPG file
// subject
// exam
// classLevel
// chapter
// difficulty
// questionType   -> mcq (default), short or long (Boards only)
// correctAnswer  -> 0, 1, 2 or 3 for MCQs
// question, modelAnswer, keyPoints and maxMarks -> written questions
// evaluationInstructions -> optional written marking guidance
// explanation    -> optional student feedback
// sourcePdfName
// sourcePage
//
// The crop displays the printed question. MCQs use A/B/C/D answer
// controls. Written questions also store a transcript for grading.
// ============================================

exports.createPDFCropQuestion = async (
  req,
  res
) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        success: false,
        message:
          "Please crop and upload a question image.",
      });
    }

    const subject =
      String(
        req.body?.subject || ""
      ).trim();

    const exam =
      String(
        req.body?.exam || ""
      ).trim();

    const classLevel =
      String(
        req.body?.classLevel || ""
      ).trim();

    const chapter =
      String(
        req.body?.chapter || ""
      ).trim();

    const difficulty =
      String(
        req.body?.difficulty || ""
      ).trim();

    const sourcePdfName =
      String(
        req.body?.sourcePdfName || ""
      ).trim();

    const requestedPage = Number(req.body?.sourcePage);
    const sourcePage =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : null;

    if (
      !subject ||
      !exam ||
      !classLevel ||
      !chapter ||
      !difficulty
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, preparation, class, chapter and difficulty are required.",
      });
    }

    if (!allowedExams[subject]) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid subject.",
      });
    }

    if (
      !allowedExams[
        subject
      ].includes(exam)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${exam} is not available for ${subject}.`,
      });
    }

    if (
      classLevel !==
        "Class 11" &&
      classLevel !==
        "Class 12"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid class.",
      });
    }

    const chapterList =
      allowedChapters?.[
        subject
      ]?.[
        classLevel
      ] || [];

    if (
      !chapterList.includes(
        chapter
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid chapter for the selected subject and class.",
      });
    }

    if (
      !validDifficulties.includes(
        difficulty
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid difficulty.",
      });
    }

    const {
      questionType: requestedQuestionType,
      correctAnswer,
      question: questionText,
      modelAnswer: modelAnswerText,
      keyPoints: submittedKeyPoints,
      maxMarks: submittedMaxMarks,
      evaluationInstructions,
      explanation,
    } = req.body ?? {};

    const questionType = String(requestedQuestionType ?? "").trim() || "mcq";
    if (!validQuestionTypes.includes(questionType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question type.",
      });
    }

    let answerFields;
    if (questionType === "mcq") {
      const answerIndex = normaliseSubmittedAnswer(
        typeof correctAnswer === "string" ? correctAnswer.trim() : correctAnswer
      );
      if (answerIndex === null || answerIndex < 0 || answerIndex > 3) {
        return res.status(400).json({
          success: false,
          message: "Correct answer must be Option A, B, C or D.",
        });
      }

      answerFields = {
        question: NAVTA_VISUAL_MARKER,
        options: ["A", "B", "C", "D"],
        correctAnswer: answerIndex,
        maxMarks: 1,
      };
    } else {
      if (exam !== "Boards") {
        return res.status(400).json({
          success: false,
          message: "Short and long answer questions are only available for Boards.",
        });
      }

      const question = typeof questionText === "string" ? questionText.trim() : "";
      const modelAnswer =
        typeof modelAnswerText === "string" ? modelAnswerText.trim() : "";
      const keyPoints = (Array.isArray(submittedKeyPoints)
        ? submittedKeyPoints
        : [submittedKeyPoints])
        .filter((point) => typeof point === "string")
        .map((point) => point.trim())
        .filter(Boolean);
      const maxMarks = Number(submittedMaxMarks);

      if (!question || question === NAVTA_VISUAL_MARKER) {
        return res.status(400).json({
          success: false,
          message: "A question transcript is required for written grading.",
        });
      }
      if (!modelAnswer || keyPoints.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Provide a model answer and at least one marking point.",
        });
      }
      if (!Number.isFinite(maxMarks) || maxMarks < 1) {
        return res.status(400).json({
          success: false,
          message: "Maximum marks must be at least 1.",
        });
      }

      answerFields = {
        question,
        modelAnswer,
        keyPoints,
        maxMarks,
        evaluationInstructions:
          typeof evaluationInstructions === "string" ? evaluationInstructions.trim() : "",
      };
    }

    const mimeType =
      String(
        req.file.mimetype || ""
      ).toLowerCase();

    const allowedImageTypes =
      new Set([
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
      ]);

    if (
      mimeType &&
      !allowedImageTypes.has(
        mimeType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The cropped question must be a PNG, JPG or WEBP image.",
      });
    }

    const workflow = initialWorkflowFields(req.body?.workflowStatus);
    const imageContentHash = hashQuestionImage(req.file.buffer);
    const duplicates = await findQuestionDuplicates({
      subject, exam, classLevel, questionType, imageContentHash, ...answerFields,
    });
    const uploaded = await uploadAdminCropBuffer(req.file.buffer, { folder: "navta/pdf-question-crops" });

    const imageUrl =
      String(
        uploaded?.secure_url ||
        uploaded?.url ||
        ""
      ).trim();

    if (!imageUrl) {
      throw new Error(
        "Cloudinary did not return the cropped question image URL."
      );
    }

    const questionImage = {
      url:
        imageUrl,

      publicId:
        String(
          uploaded?.public_id ||
          ""
        ).trim(),

      altText: questionType === "mcq"
        ? `${subject} ${chapter} question`
        : answerFields.question,

      sourcePage,

      width:
        Number(
          uploaded?.width
        ) || null,

      height:
        Number(
          uploaded?.height
        ) || null,
    };

    const payload = {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,

      questionType,
      ...answerFields,
      explanation: typeof explanation === "string" ? explanation.trim() : "",
      ...workflow,
      imageContentHash,

      hasVisual:
        true,

      visualType:
        "image",

      visualDescription:
        `${subject} ${chapter} question cropped from PDF`,

      questionImage,

      questionImages:
        [questionImage],
    };

    // Add source metadata only when those paths exist in the current
    // NavtaQuestion schema. This keeps the endpoint compatible with
    // strict Mongoose schemas that do not yet contain these fields.
    if (
      NavtaQuestion.schema?.path(
        "sourceDocument.fileName"
      )
    ) {
      payload.sourceDocument = {
        fileName:
          sourcePdfName,

        pageNumber:
          sourcePage,
      };
    }

    if (
      NavtaQuestion.schema?.path(
        "imageCropSource"
      )
    ) {
      payload.imageCropSource =
        "admin-pdf-crop";
    }

    if (
      NavtaQuestion.schema?.path(
        "createdBy"
      ) &&
      (
        req.user?._id ||
        req.user?.id
      )
    ) {
      payload.createdBy =
        req.user?._id ||
        req.user?.id;
    }

    const newQuestion =
      await NavtaQuestion.create(
        payload
      );

    console.log(
      "NAVTA PDF CROP QUESTION CREATED:",
      {
        questionId:
          newQuestion?._id,

        subject,
        exam,
        classLevel,
        chapter,
        difficulty,

        sourcePdfName,
        sourcePage,

        adminUserId:
          req.user?._id ||
          req.user?.id ||
          null,
      }
    );

    await recordAdminActivity(req.user, "Created", "NAVTA TEST question", newQuestion._id);
    const savedQuestion = newQuestion.toObject();
    delete savedQuestion.imageContentHash;

    return res.status(201).json({
      success: true,

      message:
        workflow.workflowStatus === "draft" ? "Cropped PDF question saved as a draft." : "Cropped PDF question published.",

      question: savedQuestion,
      duplicates,

      questionImage,
    });
  } catch (error) {
    console.error(
      "CREATE NAVTA PDF CROP QUESTION ERROR:",
      error
    );

    return res.status(error.statusCode || 500).json({
      success: false,

      message:
        error?.message ||
        "Failed to save the cropped PDF question.",
    });
  }
};


// ============================================
// CREATE QUESTION
// ============================================

exports.createStructuredQuestions = async (req, res) => {
  const { buildStructuredQuestions } = require("../services/navtaStructuredQuestionService");
  const input = req.body ?? {};
  const { subject, exam, classLevel, chapter, difficulty } = input;

  if (!Object.hasOwn(allowedExams, subject) || !allowedExams[subject].includes(exam) ||
      !allowedChapters[subject]?.[classLevel]?.includes(chapter) ||
      !validDifficulties.includes(difficulty)) {
    return res.status(400).json({ success: false, message: "Choose a valid subject, preparation, class, chapter and difficulty." });
  }

  let questions;
  try {
    questions = buildStructuredQuestions(input).map((item) => ({
      ...item,
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      workflowStatus: "draft",
      isActive: false,
    }));
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  const groupId = questions[0].caseStudy?.id;
  try {
    const duplicates = await Promise.all(questions.map((item) => findQuestionDuplicates(item)));
    const saved = await NavtaQuestion.insertMany(questions);
    await recordAdminActivity(req.user, "Created", groupId ? "NAVTA TEST case study" : "NAVTA TEST question", saved[0]._id);
    return res.status(201).json({
      success: true,
      questionIds: saved.map((item) => item._id),
      duplicateCount: duplicates.filter((matches) => matches.length > 0).length,
    });
  } catch (error) {
    if (groupId) {
      try {
        await NavtaQuestion.deleteMany({ "caseStudy.id": groupId, workflowStatus: "draft" });
      } catch (cleanupError) {
        console.error("Failed to remove an incomplete case study draft:", cleanupError);
      }
    }
    console.error("CREATE STRUCTURED QUESTIONS ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not save the question draft." });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      questionType,
      question,
      options,
      correctAnswer,
      modelAnswer,
      keyPoints,
      maxMarks,
      evaluationInstructions,
      explanation,
    } = req.body;

    if (
      !subject ||
      !exam ||
      !classLevel ||
      !chapter ||
      !difficulty ||
      !question
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, preparation, class, chapter, difficulty and question are required.",
      });
    }

    if (!allowedExams[subject]) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject.",
      });
    }

    if (!allowedExams[subject].includes(exam)) {
      return res.status(400).json({
        success: false,
        message: `${exam} is not available for ${subject}.`,
      });
    }

    if (
      classLevel !== "Class 11" &&
      classLevel !== "Class 12"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid class.",
      });
    }

    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty.",
      });
    }

    const resolvedQuestionType =
      normaliseQuestionType(
        exam,
        questionType
      );

    if (
      !validQuestionTypes.includes(
        resolvedQuestionType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid question type.",
      });
    }

    const payload = {
      subject: subject.trim(),
      exam: exam.trim(),
      classLevel: classLevel.trim(),
      chapter: chapter.trim(),
      difficulty: difficulty.trim(),
      questionType: resolvedQuestionType,
      question: question.trim(),

      explanation: String(
        explanation || ""
      ).trim(),
      ...initialWorkflowFields(req.body.workflowStatus),
    };

    // ========================================
    // MCQ
    // ========================================

    if (resolvedQuestionType === "mcq") {
      if (
        !Array.isArray(options) ||
        options.length !== 4
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Exactly 4 options are required for MCQ questions.",
        });
      }

      const cleanedOptions = options.map(
        (option) =>
          String(option || "").trim()
      );

      if (
        cleanedOptions.some(
          (option) => !option
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All 4 MCQ options must contain text.",
        });
      }

      const answerIndex =
        Number(correctAnswer);

      if (
        !Number.isInteger(answerIndex) ||
        answerIndex < 0 ||
        answerIndex > 3
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Correct answer must be Option A, B, C or D.",
        });
      }

      if (!payload.explanation) {
        return res.status(400).json({
          success: false,
          message:
            "Explanation is required for MCQ questions.",
        });
      }

      payload.options =
        cleanedOptions;

      payload.question =
        stripDuplicatedMCQOptions(
          payload.question,
          cleanedOptions
        );

      payload.correctAnswer =
        answerIndex;

      payload.modelAnswer = "";

      payload.keyPoints = [];

      payload.evaluationInstructions = "";

      payload.maxMarks =
        Number(maxMarks) > 0
          ? Number(maxMarks)
          : 1;
    }

    // ========================================
    // BOARDS WRITTEN QUESTIONS
    // ========================================

    if (
      resolvedQuestionType === "short" ||
      resolvedQuestionType === "long"
    ) {
      if (exam !== "Boards") {
        return res.status(400).json({
          success: false,
          message:
            "Short Answer and Long Answer questions are only available for Boards.",
        });
      }

      if (
        !String(
          modelAnswer || ""
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Model answer is required for written questions.",
        });
      }

      if (
        !Array.isArray(keyPoints) ||
        keyPoints.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one key point is required.",
        });
      }

      const cleanedKeyPoints =
        keyPoints
          .map((item) =>
            String(item || "").trim()
          )
          .filter(Boolean);

      const numericMaxMarks =
        Number(maxMarks);

      if (
        !Number.isFinite(numericMaxMarks) ||
        numericMaxMarks < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum marks must be at least 1.",
        });
      }

      payload.options = [];

      payload.correctAnswer =
        undefined;

      payload.modelAnswer =
        String(modelAnswer).trim();

      payload.keyPoints =
        cleanedKeyPoints;

      payload.maxMarks =
        numericMaxMarks;

      payload.evaluationInstructions =
        String(
          evaluationInstructions || ""
        ).trim();
    }

    const duplicates = await findQuestionDuplicates(payload);
    const newQuestion =
      await NavtaQuestion.create(
        payload
      );

    await recordAdminActivity(req.user, "Created", "NAVTA TEST question", newQuestion._id);
    return res.status(201).json({
      success: true,
      message:
        "Question added successfully.",
      question: newQuestion,
      duplicates,
    });
  } catch (error) {
    console.error(
      "CREATE NAVTA QUESTION ERROR:",
      error
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 400 ? error.message : "Failed to add question.",
      error: error.message,
    });
  }
};

// ============================================
// GET QUESTIONS
// ============================================

exports.getQuestions = async (req, res) => {
  try {
    const filter = buildQuestionBankFilter(req.query);
    const paginated = req.query.page !== undefined || req.query.pageSize !== undefined;
    const query = NavtaQuestion.find(filter).sort({ createdAt: -1, _id: -1 }).lean();
    const total = paginated ? await NavtaQuestion.countDocuments(filter) : undefined;
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 25));
    const pageCount = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    const page = Math.min(pageCount, Math.max(1, Number.parseInt(req.query.page, 10) || 1));
    if (paginated) query.skip((page - 1) * pageSize).limit(pageSize);
    const questions = (await query).map(question => ({
      ...question,
      workflowStatus: getWorkflowStatus(question),
    }));

    return res.json({
      success: true,
      count: questions.length,
      questions,
      ...(paginated ? { total, page, pageCount, pageSize } : {}),
    });
  } catch (error) {
    console.error(
      "GET NAVTA QUESTIONS ERROR:",
      error
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 400 ? error.message : "Failed to fetch questions.",
      error: error.message,
    });
  }
};

// ============================================
// DELETE QUESTION
// ============================================

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } =
      req.params;

    const deletedQuestion =
      await NavtaQuestion.findOneAndDelete({ _id: id, "caseStudy.id": { $in: [null, ""] } });

    if (!deletedQuestion) {
      const groupedQuestion = await NavtaQuestion.exists({ _id: id, "caseStudy.id": { $nin: [null, ""] } });
      if (groupedQuestion) {
        return res.status(409).json({ success: false, message: "Archive this case study as a group." });
      }
      return res.status(404).json({
        success: false,
        message:
          "Question not found.",
      });
    }

    await recordAdminActivity(req.user, "Deleted", "NAVTA TEST question", deletedQuestion._id);
    return res.json({
      success: true,
      message:
        "Question deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE NAVTA QUESTION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete question.",
      error: error.message,
    });
  }
};

// ============================================
// NAVTA AI - ANALYSE IMPORT FILE
// ============================================
//
// This endpoint analyses an uploaded PDF/DOCX/TXT file.
//
// At the current stage:
// - PDF visual analysis is connected.
// - DOCX/TXT adapters can be connected separately.
// - This endpoint does NOT save questions to MongoDB.
// - Admin reviews accepted questions first.
//
// ============================================

exports.importQuestionsWithAI = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF, DOCX or TXT file.",
      });
    }

    const {
      subject = "",
      exam = "",
      classLevel = "",
      chapter = "",
      startPage,
      endPage,
    } = req.body || {};

    const fileType = String(req.file.originalname || "").split(".").pop().toLowerCase();
    const readPage = (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      if (typeof value !== "number" && (typeof value !== "string" || !/^\d+$/.test(value.trim()))) return NaN;
      const page = Number(value);
      return Number.isSafeInteger(page) && page > 0 ? page : NaN;
    };
    const firstPage = readPage(startPage);
    const lastPage = readPage(endPage);
    if (Number.isNaN(firstPage) || Number.isNaN(lastPage) ||
        (firstPage !== undefined && lastPage !== undefined && firstPage > lastPage)) {
      return res.status(400).json({
        success: false,
        message: "Enter positive whole page numbers with the first page on or before the last page.",
      });
    }
    if (fileType !== "pdf" && (firstPage !== undefined || lastPage !== undefined)) {
      return res.status(400).json({ success: false, message: "Page ranges are available for PDF files." });
    }

    const adminUserId =
      req.user?._id ||
      req.user?.id ||
      null;

    const job = await NavtaAIImportJob.create({
      status: "queued",
      fileName: req.file.originalname || "",
      fileType,
      createdBy: adminUserId || undefined,
      progress: {
        stage: "queued",
        message: "Upload received. NAVTA AI analysis is starting.",
      },
    });

    const jobId = String(job._id);

    // IMPORTANT:
    // Return immediately so Hostinger/nginx never waits for the
    // full PDF + Gemini pipeline and therefore cannot turn this
    // request into a 504 Gateway Time-out.
    res.status(202).json({
      success: true,
      async: true,
      jobId,
      status: "queued",
      message: "NAVTA AI analysis started.",
    });

    const uploadedFile = req.file;

    const hints = {
      subject,
      exam,
      classLevel,
      chapter,
    };

    setImmediate(async () => {
      try {
        const {
          analyseNavtaImport,
        } = require("../services/navtaAIImportService");

        await NavtaAIImportJob.findByIdAndUpdate(jobId, {
          $set: {
            status: "processing",
            startedAt: new Date(),
            progress: {
              stage: "analysing",
              message:
                "NAVTA AI is reading the document, rendering pages and analysing questions.",
            },
          },
        });

        console.log(
          `NAVTA AI async import started: ${uploadedFile.originalname} job=${jobId}`
        );

        // The scanner throttles progress reports. Serialize writes and leave
        // a terminal job untouched even if a progress callback is still queued.
        let progressWrite = Promise.resolve();
        const onProgress = (progress) => {
          progressWrite = progressWrite.then(() =>
            NavtaAIImportJob.updateOne({ _id: jobId, status: "processing" }, { $set: { progress } })
          ).catch((error) => {
            console.warn("NAVTA could not update scan progress:", error?.name);
          });
          return progressWrite;
        };

        const result = await analyseNavtaImport({
          file: uploadedFile,
          ...hints,
          startPage: firstPage,
          endPage: lastPage,
          onProgress,
        });

        const acceptedQuestions =
          Array.isArray(result?.acceptedQuestions)
            ? result.acceptedQuestions
            : [];

        const droppedQuestions =
          Array.isArray(result?.droppedQuestions)
            ? result.droppedQuestions
            : [];

        const summary =
          result?.summary || {
            detected:
              acceptedQuestions.length +
              droppedQuestions.length,
            accepted: acceptedQuestions.length,
            dropped: droppedQuestions.length,
            needsReview: 0,
          };

        const message =
          acceptedQuestions.length > 0
            ? `NAVTA AI found ${acceptedQuestions.length} question(s) ready for review.`
            : "NAVTA AI analysed the document, but no questions were accepted.";

        await NavtaAIImportJob.findByIdAndUpdate(jobId, {
          $set: {
            status: "completed",
            completedAt: new Date(),
            progress: {
              stage: "completed",
              message,
            },
            result: {
              acceptedQuestions,
              droppedQuestions,
              summary,
              documentInfo: result?.documentInfo || null,
            },
            error: null,
          },
        });

        console.log(
          `NAVTA AI async import completed: ${uploadedFile.originalname} job=${jobId}`,
          summary
        );
      } catch (error) {
        console.error(
          `NAVTA AI ASYNC IMPORT ERROR job=${jobId}:`,
          error
        );

        const message =
          error?.message ||
          "NAVTA AI could not analyse this file.";

        try {
          await NavtaAIImportJob.findByIdAndUpdate(jobId, {
            $set: {
              status: "failed",
              completedAt: new Date(),
              progress: {
                stage: "failed",
                message,
              },
              error: {
                message,
                statusCode:
                  Number(error?.statusCode) || 500,
              },
            },
          });
        } catch (jobUpdateError) {
          console.error(
            `NAVTA AI JOB FAILURE UPDATE ERROR job=${jobId}:`,
            jobUpdateError
          );
        }
      }
    });

    return;
  } catch (error) {
    console.error(
      "NAVTA AI IMPORT JOB CREATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "NAVTA AI import job could not be created.",
    });
  }
};

// ============================================
// NAVTA AI - GET ASYNC IMPORT JOB STATUS
// ============================================

exports.getAIImportJob = async (req, res) => {
  try {
    const jobId = String(req.params?.jobId || "").trim();

    if (!/^[0-9a-f]{24}$/i.test(jobId)) {
      return res.status(400).json({
        success: false,
        message: "A valid NAVTA AI import job ID is required.",
      });
    }

    const job = await NavtaAIImportJob.findById(jobId).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "NAVTA AI import job was not found.",
      });
    }

    const currentAdminId = String(
      req.user?._id ||
      req.user?.id ||
      ""
    );

    if (
      job.createdBy &&
      currentAdminId &&
      String(job.createdBy) !== currentAdminId
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this NAVTA AI import job.",
      });
    }

    if (job.status === "failed") {
      return res.status(200).json({
        success: false,
        jobId,
        status: "failed",
        progress: job.progress || null,
        message:
          job.error?.message ||
          "NAVTA AI analysis failed.",
        error: job.error || null,
      });
    }

    if (job.status !== "completed") {
      return res.status(200).json({
        success: true,
        jobId,
        status: job.status,
        progress: job.progress || null,
        message:
          job.progress?.message ||
          "NAVTA AI analysis is still running.",
      });
    }

    const result = job.result || {};

    return res.status(200).json({
      success: true,
      jobId,
      status: "completed",
      message:
        job.progress?.message ||
        "NAVTA AI analysis completed.",
      acceptedQuestions:
        result.acceptedQuestions || [],
      droppedQuestions:
        result.droppedQuestions || [],
      summary:
        result.summary || {
          detected: 0,
          accepted: 0,
          dropped: 0,
          needsReview: 0,
        },
      documentInfo:
        result.documentInfo || null,
    });
  } catch (error) {
    console.error(
      "NAVTA AI IMPORT JOB STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Could not read NAVTA AI import status.",
    });
  }
};

// ============================================
// NAVTA AI - CROP IMAGE DURING ADMIN REVIEW
// ============================================
//
// POST /api/navta-test/import/crop-image
//
// This endpoint is intentionally STATELESS.
// The AI-review question has not been saved to MongoDB yet,
// so no question ID is required.
//
// Expected body:
// {
//   image: {
//     url: "...",
//     publicId: "...",
//     altText: "...",
//     sourcePage: 1,
//     width: 1000,
//     height: 500
//   },
//   crop: {
//     x: 0.1,
//     y: 0.1,
//     width: 0.8,
//     height: 0.7
//   },
//   sourcePage: 1
// }
//
// The current AI image is cropped, uploaded to Cloudinary,
// and returned to the Admin AI Review screen.
// Gemini is NOT called.
// ============================================

exports.cropAIReviewImage = async (
  req,
  res
) => {
  try {
    const cropBox =
      normalizeAdminCropBox(
        req.body?.crop
      );

    if (!cropBox) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a valid crop area.",
      });
    }

    const currentImage =
      normalizeQuestionImage(
        req.body?.image,
        {
          altText:
            String(
              req.body?.image?.altText ||
                "Question diagram"
            ).trim(),

          sourcePage:
            Number(
              req.body?.sourcePage ||
                req.body?.image
                  ?.sourcePage
            ) || null,
        }
      );

    if (!currentImage?.url) {
      return res.status(400).json({
        success: false,
        message:
          "The AI review question does not have an image to crop.",
      });
    }

    // The NAVTA AI visual pipeline stores question images on Cloudinary.
    // Restrict this stateless endpoint to Cloudinary HTTPS URLs so an
    // administrator request cannot make the server fetch arbitrary hosts.
    let parsedImageUrl;

    try {
      parsedImageUrl =
        new URL(
          currentImage.url
        );
    } catch {
      return res.status(400).json({
        success: false,
        message:
          "The AI review image URL is invalid.",
      });
    }

    if (
      parsedImageUrl.protocol !==
        "https:" ||
      parsedImageUrl.hostname !==
        "res.cloudinary.com"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only NAVTA Cloudinary question images can be cropped during AI review.",
      });
    }

    const cropped =
      await cropCurrentQuestionImage({
        imageUrl:
          currentImage.url,
        cropBox,
      });

    const uploaded =
      await uploadAdminCropBuffer(
        cropped.buffer,
        {
          folder:
            "navta/admin-review-crops",
        }
      );

    const nextImage = {
      url:
        uploaded.secure_url ||
        uploaded.url ||
        "",

      publicId:
        uploaded.public_id ||
        "",

      altText:
        currentImage.altText ||
        "Question diagram",

      sourcePage:
        Number(
          req.body?.sourcePage ||
            currentImage.sourcePage
        ) || null,

      width:
        Number(
          uploaded.width
        ) ||
        cropped.width,

      height:
        Number(
          uploaded.height
        ) ||
        cropped.height,
    };

    if (!nextImage.url) {
      throw new Error(
        "Cloudinary did not return the cropped image URL."
      );
    }

    return res.status(200).json({
      success: true,

      message:
        "AI review image cropped successfully.",

      questionImage:
        nextImage,

      questionImages:
        [nextImage],

      crop:
        cropBox,

      imageCropSource:
        "admin-ai-crop",
    });
  } catch (error) {
    console.error(
      "CROP NAVTA AI REVIEW IMAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error?.message ||
        "Failed to crop the AI review image.",
    });
  }
};


// ============================================
// NAVTA AI - CONFIRM IMPORT
// ============================================
//
// Keep database confirmation disabled until the
// analysis/review flow has been tested successfully.
// ============================================

// ============================================
// NAVTA AI - CONFIRM IMPORT
// ============================================
//
// IMPORTANT:
//
// This endpoint DOES NOT run AI.
//
// AI analysis has already happened before this
// endpoint is called.
//
// This endpoint only:
//
// 1. Receives administrator-approved questions.
// 2. Validates them again for safety.
// 3. Preserves AI-generated metadata.
// 4. Preserves question diagrams/images.
// 5. Saves valid questions to MongoDB.
//
// It does NOT change:
// - Gemini
// - AI model
// - AI prompts
// - 5-page batching
// - question extraction
// - AI classification
// - AI answer generation
// - AI diagram detection
//
// ============================================

exports.confirmAIImport = async (req, res) => {
  try {
    // ========================================
    // READ APPROVED QUESTIONS
    // ========================================

    const {
      questions,
      workflowStatus,
    } = req.body || {};

    if (
      !Array.isArray(questions)
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Approved questions must be provided as a list.",
      });
    }

    if (
      questions.length === 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "There are no approved questions to import.",
      });
    }

    // ========================================
    // SAFETY LIMIT
    // ========================================
    //
    // This protects MongoDB from accidentally
    // receiving an abnormally large request.
    //
    // It does NOT affect AI analysis.
    // ========================================

    if (
      questions.length > 1000
    ) {
      return res.status(400).json({
        success: false,

        message:
          "A maximum of 1000 approved questions can be imported at one time.",
      });
    }

    const workflow = initialWorkflowFields(workflowStatus);
    const questionsToSave = [];

    const rejectedQuestions = [];

    const duplicateQuestions = [];

    // Load only the fields needed for duplicate detection.
    // This protects against re-uploading the same PDF later.
    const existingQuestionDocs =
      await NavtaQuestion.find(
        {},
        {
          question: 1,
          options: 1,
          subject: 1,
          exam: 1,
          classLevel: 1,
        }
      )
        .lean();

    const existingQuestions =
      Array.isArray(
        existingQuestionDocs
      )
        ? existingQuestionDocs
        : [];

    // ========================================
    // VALIDATE EVERY APPROVED QUESTION
    // ========================================

    for (
      let index = 0;
      index < questions.length;
      index += 1
    ) {
      const rawQuestion =
        questions[index] || {};

      // ======================================
      // CLEAN BASIC VALUES
      // ======================================

      const subject =
        String(
          rawQuestion.subject || ""
        ).trim();

      const exam =
        String(
          rawQuestion.exam || ""
        ).trim();

      const classLevel =
        String(
          rawQuestion.classLevel || ""
        ).trim();

      const chapter =
        String(
          rawQuestion.chapter || ""
        ).trim();

      const difficulty =
        String(
          rawQuestion.difficulty || ""
        ).trim();

      const questionText =
        String(
          rawQuestion.question || ""
        ).trim();

      const explanation =
        String(
          rawQuestion.explanation || ""
        ).trim();

      const questionType =
        normaliseQuestionType(
          exam,
          String(
            rawQuestion.questionType ||
              "mcq"
          )
            .trim()
            .toLowerCase()
        );

      const reasons = [];

      // ======================================
      // BASIC REQUIRED VALUES
      // ======================================

      if (!subject) {
        reasons.push(
          "Subject is required."
        );
      }

      if (!exam) {
        reasons.push(
          "Preparation is required."
        );
      }

      if (!classLevel) {
        reasons.push(
          "Class is required."
        );
      }

      if (!chapter) {
        reasons.push(
          "Chapter is required."
        );
      }

      if (!difficulty) {
        reasons.push(
          "Difficulty is required."
        );
      }

      if (!questionText) {
        reasons.push(
          "Question text is required."
        );
      }

      // ======================================
      // SUBJECT / EXAM
      // ======================================

      if (
        subject &&
        !allowedExams[subject]
      ) {
        reasons.push(
          "Invalid subject."
        );
      }

      if (
        subject &&
        exam &&
        allowedExams[subject] &&
        !allowedExams[
          subject
        ].includes(exam)
      ) {
        reasons.push(
          `${exam} is not available for ${subject}.`
        );
      }

      // ======================================
      // CLASS
      // ======================================

      if (
        classLevel &&
        classLevel !== "Class 11" &&
        classLevel !== "Class 12"
      ) {
        reasons.push(
          "Invalid class."
        );
      }

      // ======================================
      // CHAPTER WHITELIST
      // ======================================

      if (
        subject &&
        classLevel &&
        chapter
      ) {
        const validChapters =
          allowedChapters?.[subject]?.[classLevel] || [];

        if (!validChapters.includes(chapter)) {
          reasons.push(
            `Invalid chapter "${chapter}" for ${subject} ${classLevel}.`
          );
        }
      }

      // ======================================
      // DIFFICULTY
      // ======================================

      if (
        difficulty &&
        !validDifficulties.includes(
          difficulty
        )
      ) {
        reasons.push(
          "Invalid difficulty."
        );
      }

      // ======================================
      // QUESTION TYPE
      // ======================================

      if (
        !validQuestionTypes.includes(
          questionType
        )
      ) {
        reasons.push(
          "Invalid question type."
        );
      }

      // ======================================
      // START DATABASE PAYLOAD
      // ======================================

      const payload = {
        subject,

        exam,

        classLevel,

        chapter,

        difficulty,

        questionType,

        question:
          questionText,

        explanation,

        ...workflow,
      };

      const normalizeConfidence = (value) => {
        const numeric = Number(value);

        if (!Number.isFinite(numeric)) {
          return null;
        }

        if (numeric > 1 && numeric <= 100) {
          return numeric / 100;
        }

        if (numeric >= 0 && numeric <= 1) {
          return numeric;
        }

        return null;
      };

      const chapterConfidence =
        normalizeConfidence(rawQuestion.chapterConfidence);

      const answerConfidence =
        normalizeConfidence(rawQuestion.answerConfidence);

      const classificationConfidence =
        normalizeConfidence(rawQuestion.classificationConfidence);

      const difficultyConfidence =
        normalizeConfidence(rawQuestion.difficultyConfidence);

      if (chapterConfidence !== null) {
        payload.chapterConfidence = chapterConfidence;
      }

      if (answerConfidence !== null) {
        payload.answerConfidence = answerConfidence;
      }

      if (classificationConfidence !== null) {
        payload.classificationConfidence = classificationConfidence;
      }

      if (difficultyConfidence !== null) {
        payload.difficultyConfidence = difficultyConfidence;
      }

      payload.needsReview =
        Boolean(rawQuestion.needsReview) ||
        (chapterConfidence !== null && chapterConfidence < 0.9) ||
        (answerConfidence !== null && answerConfidence < 0.85);

      // ======================================
      // OPTIONAL ORIGINAL QUESTION NUMBER
      // ======================================

      const questionNumber =
        String(
          rawQuestion.questionNumber ||
            ""
        ).trim();

      if (questionNumber) {
        payload.questionNumber =
          questionNumber;
      }

      // ======================================
      // MCQ VALIDATION
      // ======================================

      if (
        questionType === "mcq"
      ) {
        const options =
          Array.isArray(
            rawQuestion.options
          )
            ? rawQuestion.options.map(
                (option) =>
                  String(
                    option || ""
                  ).trim()
              )
            : [];

        if (
          options.length !== 4
        ) {
          reasons.push(
            "MCQ must contain exactly 4 options."
          );
        }

        if (
          options.length === 4 &&
          options.some(
            (option) => !option
          )
        ) {
          reasons.push(
            "All 4 MCQ options must contain text."
          );
        }

        const answerIndex =
          Number(
            rawQuestion.correctAnswer
          );

        if (
          !Number.isInteger(
            answerIndex
          ) ||
          answerIndex < 0 ||
          answerIndex > 3
        ) {
          reasons.push(
            "Correct answer must be Option A, B, C or D."
          );
        }

        payload.options =
          options;

        payload.question =
          stripDuplicatedMCQOptions(
            payload.question,
            options
          );

        if (
          Number.isInteger(
            answerIndex
          ) &&
          answerIndex >= 0 &&
          answerIndex <= 3
        ) {
          payload.correctAnswer =
            answerIndex;
        }

        payload.modelAnswer =
          "";

        payload.keyPoints =
          [];

        payload.evaluationInstructions =
          "";

        payload.maxMarks =
          Number(
            rawQuestion.maxMarks
          ) > 0
            ? Number(
                rawQuestion.maxMarks
              )
            : 1;
      }

      // ======================================
      // BOARD WRITTEN QUESTIONS
      // ======================================

      if (
        questionType === "short" ||
        questionType === "long"
      ) {
        if (
          exam !== "Boards"
        ) {
          reasons.push(
            "Short and long questions are only available for Boards."
          );
        }

        const modelAnswer =
          String(
            rawQuestion.modelAnswer ||
              ""
          ).trim();

        const keyPoints =
          Array.isArray(
            rawQuestion.keyPoints
          )
            ? rawQuestion.keyPoints
                .map(
                  (item) =>
                    String(
                      item || ""
                    ).trim()
                )
                .filter(Boolean)
            : [];

        const maxMarks =
          Number(
            rawQuestion.maxMarks
          );

        if (!modelAnswer) {
          reasons.push(
            "Model answer is required for written questions."
          );
        }

        if (
          keyPoints.length === 0
        ) {
          reasons.push(
            "At least one key point is required for written questions."
          );
        }

        if (
          !Number.isFinite(
            maxMarks
          ) ||
          maxMarks < 1
        ) {
          reasons.push(
            "Maximum marks must be at least 1."
          );
        }

        payload.options =
          [];

        payload.correctAnswer =
          undefined;

        payload.modelAnswer =
          modelAnswer;

        payload.keyPoints =
          keyPoints;

        payload.maxMarks =
          maxMarks;

        payload.evaluationInstructions =
          String(
            rawQuestion
              .evaluationInstructions ||
              ""
          ).trim();
      }

      // ======================================
      // PRESERVE AI QUESTION IMAGE
      // ======================================

      const normalizedImportImages =
        normalizeQuestionImages(
          rawQuestion
        );

      if (
        normalizedImportImages.length >
        0
      ) {
        payload.questionImage =
          normalizedImportImages[0];

        payload.questionImages =
          normalizedImportImages;
      } else {
        payload.questionImage =
          null;

        payload.questionImages =
          [];
      }

      // ======================================
      // PRESERVE ADMIN REVIEW IMAGE CROP METADATA
      // ======================================

      const originalAIQuestionImage =
        normalizeQuestionImage(
          rawQuestion
            .originalAIQuestionImage
        );

      if (
        originalAIQuestionImage?.url
      ) {
        payload.originalAIQuestionImage =
          originalAIQuestionImage;
      }

      const imageCropSource =
        String(
          rawQuestion.imageCropSource ||
            ""
        ).trim();

      if (
        [
          "ai",
          "admin-ai-crop",
          "admin-original-page",
        ].includes(
          imageCropSource
        )
      ) {
        payload.imageCropSource =
          imageCropSource;
      } else if (
        payload.questionImage?.url
      ) {
        payload.imageCropSource =
          "ai";
      }

      const adminImageCrop =
        normalizeAdminCropBox(
          rawQuestion.adminImageCrop
        );

      if (adminImageCrop) {
        payload.adminImageCrop =
          adminImageCrop;
      }

      // ======================================
      // PRESERVE NAVTA VISUAL METADATA
      // ======================================

      const hasSavedVisualImage =
        hasQuestionVisualImage(
          payload
        );

      payload.hasVisual =
        Boolean(
          rawQuestion.hasVisual ||
          hasSavedVisualImage
        );

      payload.visualType =
        payload.hasVisual
          ? (
              String(
                rawQuestion.visualType ||
                "other"
              ).trim() ||
              "other"
            )
          : "none";

      payload.visualDescription =
        String(
          rawQuestion.visualDescription ||
          ""
        ).trim();

      if (
        rawQuestion.visualBoundingBox &&
        typeof rawQuestion
          .visualBoundingBox ===
          "object"
      ) {
        const visualBox =
          rawQuestion.visualBoundingBox;

        const visualX =
          Number(
            visualBox.x
          );

        const visualY =
          Number(
            visualBox.y
          );

        const visualWidth =
          Number(
            visualBox.width
          );

        const visualHeight =
          Number(
            visualBox.height
          );

        if (
          Number.isFinite(
            visualX
          ) &&
          Number.isFinite(
            visualY
          ) &&
          Number.isFinite(
            visualWidth
          ) &&
          Number.isFinite(
            visualHeight
          ) &&
          visualX >= 0 &&
          visualY >= 0 &&
          visualWidth > 0 &&
          visualHeight > 0 &&
          visualX <= 1 &&
          visualY <= 1 &&
          visualX +
            visualWidth <=
            1.0001 &&
          visualY +
            visualHeight <=
            1.0001
        ) {
          payload.visualBoundingBox = {
            x:
              visualX,

            y:
              visualY,

            width:
              visualWidth,

            height:
              visualHeight,
          };
        }
      }

      // ======================================
      // PRESERVE AI SOURCE DOCUMENT
      // ======================================

      if (
        rawQuestion.sourceDocument &&
        typeof rawQuestion
          .sourceDocument ===
          "object"
      ) {
        payload.sourceDocument = {
          fileName:
            String(
              rawQuestion
                .sourceDocument
                .fileName || ""
            ).trim(),

          fileType:
            String(
              rawQuestion
                .sourceDocument
                .fileType || ""
            ).trim(),

          pageNumber:
            Number(
              rawQuestion
                .sourceDocument
                .pageNumber
            ) || null,

          importedByAI:
            true,
        };
      }

      // ======================================
      // SCREENSHOT-FIRST NAVTA TEST METADATA
      // ======================================
      //
      // The AI import service creates one complete
      // question screenshot from the original PDF.
      // questionImage is therefore the PRIMARY
      // student-facing representation for AI-imported
      // NAVTA TEST questions.
      //
      // These fields are preserved when the schema
      // supports them. questionImage/questionImages
      // remain the fields used by the test generators.
      // ======================================

      if (
        rawQuestion.questionBoundingBox &&
        typeof rawQuestion
          .questionBoundingBox ===
          "object"
      ) {
        const box =
          rawQuestion.questionBoundingBox;

        const x = Number(box.x);
        const y = Number(box.y);
        const width = Number(box.width);
        const height = Number(box.height);

        if (
          Number.isFinite(x) &&
          Number.isFinite(y) &&
          Number.isFinite(width) &&
          Number.isFinite(height) &&
          x >= 0 &&
          y >= 0 &&
          width > 0 &&
          height > 0 &&
          x <= 1 &&
          y <= 1 &&
          x + width <= 1.0001 &&
          y + height <= 1.0001
        ) {
          payload.questionBoundingBox = {
            x,
            y,
            width,
            height,
          };
        }
      }

      if (payload.questionImage?.url) {
        payload.studentQuestionFormat =
          "image";
      } else if (
        rawQuestion.studentQuestionFormat
      ) {
        payload.studentQuestionFormat =
          String(
            rawQuestion.studentQuestionFormat
          )
            .trim()
            .toLowerCase();
      }

      // ======================================
      // REJECT INVALID ADMIN-APPROVED ITEM
      // ======================================

      if (
        reasons.length > 0
      ) {
        rejectedQuestions.push({
          index,

          questionNumber:
            questionNumber ||
            String(
              index + 1
            ),

          question:
            questionText,

          reasons,
        });

        continue;
      }

      // ======================================
      // DUPLICATE CHECK
      // ======================================

      const duplicateInThisImport =
        questionsToSave.find(
          (existing) =>
            areLikelySameQuestion(
              existing,
              payload
            )
        );

      const duplicateAlreadySaved =
        existingQuestions.find(
          (existing) =>
            areLikelySameQuestion(
              existing,
              payload
            )
        );

      if (
        duplicateInThisImport ||
        duplicateAlreadySaved
      ) {
        duplicateQuestions.push({
          index,

          questionNumber:
            questionNumber ||
            String(
              index + 1
            ),

          question:
            questionText,

          reason:
            duplicateAlreadySaved
              ? "Duplicate already exists in NAVTA TEST question bank."
              : "Duplicate appears more than once in this import.",
        });

        continue;
      }

      // ======================================
      // READY FOR MONGODB
      // ======================================

      questionsToSave.push(
        payload
      );
    }

    // ========================================
    // NOTHING VALID TO SAVE
    // ========================================

    if (
      questionsToSave.length === 0
    ) {
      const onlyDuplicates =
        duplicateQuestions.length >
          0 &&
        rejectedQuestions.length ===
          0;

      return res
        .status(
          onlyDuplicates
            ? 200
            : 400
        )
        .json({
          success:
            onlyDuplicates,

          message:
            onlyDuplicates
              ? "No new questions were saved because all approved questions already exist."
              : "None of the approved questions passed the final database validation.",

          imported:
            0,

          duplicates:
            duplicateQuestions.length,

          rejected:
            rejectedQuestions.length,

          duplicateQuestions,

          rejectedQuestions,
        });
    }

    // ========================================
    // SAVE APPROVED QUESTIONS
    // ========================================

    const savedQuestions =
      await NavtaQuestion.insertMany(
        questionsToSave,
        {
          ordered:
            true,
        }
      );

    await recordAdminActivity(req.user, "Imported", "NAVTA TEST questions");

    // ========================================
    // SUCCESS
    // ========================================

    console.log(
      "============================================"
    );

    console.log(
      "NAVTA AI QUESTION IMPORT CONFIRMED"
    );

    console.log(
      `Received: ${questions.length}`
    );

    console.log(
      `Saved: ${savedQuestions.length}`
    );

    console.log(
      `Duplicates skipped: ${duplicateQuestions.length}`
    );

    console.log(
      `Rejected: ${rejectedQuestions.length}`
    );

    console.log(
      "============================================"
    );

    return res.status(201).json({
      success: true,

      message:
        `${savedQuestions.length} question(s) ${workflowStatus === "draft" ? "saved as drafts" : "imported successfully"}. ${duplicateQuestions.length} duplicate(s) skipped.`,

      imported:
        savedQuestions.length,

      duplicates:
        duplicateQuestions.length,

      rejected:
        rejectedQuestions.length,

      totalReceived:
        questions.length,

      questions:
        savedQuestions,

      duplicateQuestions,

      rejectedQuestions,
    });
  } catch (error) {
    console.error(
      "CONFIRM NAVTA AI IMPORT ERROR:",
      error
    );

    return res.status(error.statusCode || 500).json({
      success: false,

      message:
        error.statusCode === 400 ? error.message : "Failed to import approved questions.",

      error:
        error.message,
    });
  }
};

// ============================================
// GENERATE STANDARD STUDENT TEST
// ============================================

exports.generateTest = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      questionType,
      duration,
    } = req.body ?? {};

    if (
      typeof subject !== "string" ||
      !Object.hasOwn(allowedExams, subject) ||
      !allowedExams[subject].includes(exam) ||
      !["Class 11", "Class 12"].includes(classLevel) ||
      typeof chapter !== "string" ||
      !chapter.trim() ||
      !validDifficulties.includes(difficulty)
    ) {
      return res.status(400).json({
        success: false,
        message:
            "Choose a valid subject, preparation, class, chapter and difficulty.",
      });
    }

    const resolvedQuestionType =
      normaliseQuestionType(
        exam,
        questionType
      );

    if (
      !validQuestionTypes.includes(
        resolvedQuestionType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid question type.",
      });
    }

    const numericDuration =
      Number(duration);

    if (
      !isAllowedDuration(
        exam,
        resolvedQuestionType,
        numericDuration
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid duration for ${exam} ${resolvedQuestionType} test.`,
      });
    }

    const minutesPerQuestion =
      TEST_RULES[exam][
        resolvedQuestionType
      ].minutesPerQuestion;

    const questionCount =
      getQuestionCount(
        exam,
        resolvedQuestionType,
        numericDuration
      );

    const matchFilter = {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,

      questionType:
        resolvedQuestionType,

      isActive: true,
    };

    const { questions, available } = await selectStandardQuestions(matchFilter, questionCount);
    if (questions.length !== questionCount) {
      return res.status(400).json({
        success: false,
        message: "There are not enough matching questions to build this test with complete case studies.",
        required: questionCount,
        available,
      });
    }

    const attempt = await createAttempt(req.user._id, "standard", {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      questionType: resolvedQuestionType,
      durationMinutes: numericDuration,
    }, questions);

    return res.status(200).json({
      success: true,

      test: {
        mode: "standard",
        ...attempt,

        subject,
        exam,
        classLevel,
        chapter,
        difficulty,

        questionType:
          resolvedQuestionType,

        durationMinutes:
                    numericDuration,

        durationSeconds:
          numericDuration * 60,

        totalQuestions:
          questions.length,

        minutesPerQuestion,

        questions: questions.map(publicQuestion),
      },
    });
  } catch (error) {
    console.error(
      "GENERATE NAVTA TEST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate Navta TEST.",
      error: error.message,
    });
  }
};

// ============================================
// GENERATE BOSS BATTLE
// ============================================
//
// Boss Battle:
// - MCQ only
// - Minimum 2 chapters
// - Multiple chapters
// - Automatic Easy / Medium / Hard mix
// - 15 / 30 / 50 questions
// - 70% required to defeat Boss
//
// ============================================

exports.generateBossBattle = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapters,
      totalQuestions,
    } = req.body;

    // ========================================
    // VALIDATE BASIC DETAILS
    // ========================================

    if (
      !subject ||
      !exam ||
      !classLevel
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, preparation and class are required.",
      });
    }

    if (!allowedExams[subject]) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid subject.",
      });
    }

    if (
      !allowedExams[subject].includes(
        exam
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${exam} is not available for ${subject}.`,
      });
    }

    if (
      classLevel !== "Class 11" &&
      classLevel !== "Class 12"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid class.",
      });
    }

    // ========================================
    // VALIDATE CHAPTERS
    // ========================================

    if (!Array.isArray(chapters)) {
      return res.status(400).json({
        success: false,
        message:
          "Chapters must be provided as a list.",
      });
    }

    const selectedChapters = [
      ...new Set(
        chapters
          .map((chapter) =>
            String(
              chapter || ""
            ).trim()
          )
          .filter(Boolean)
      ),
    ];

    if (
      selectedChapters.length < 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Select at least 2 chapters for Boss Battle.",
      });
    }

    // ========================================
    // VALIDATE BOSS SIZE
    // ========================================

    const questionCount =
      Number(totalQuestions);

    if (
      !BOSS_BATTLE_SIZES.includes(
        questionCount
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Boss Battle must contain 15, 30 or 50 questions.",
      });
    }

    if (
      selectedChapters.length >
      questionCount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The number of selected chapters cannot exceed the battle size.",
      });
    }

    // ========================================
    // CHECK EACH SELECTED CHAPTER
    // ========================================

    const unavailableChapters = [];

    const chapterAvailability = {};

    for (
      const chapter of selectedChapters
    ) {
      const questions =
        await NavtaQuestion.find({
          subject,
          exam,
          classLevel,
          chapter,

          questionType: "mcq",
          ...BATTLE_QUESTION_FILTER,

          difficulty: {
            $in: [
              "Easy",
              "Medium",
              "Hard",
            ],
          },

          isActive: true,
        })
          .select(
            "_id difficulty"
          )
          .lean();

      chapterAvailability[
        chapter
      ] = {
        total:
          questions.length,

        Easy:
          questions.filter(
            (q) =>
              q.difficulty ===
              "Easy"
          ).length,

        Medium:
          questions.filter(
            (q) =>
              q.difficulty ===
              "Medium"
          ).length,

        Hard:
          questions.filter(
            (q) =>
              q.difficulty ===
              "Hard"
          ).length,
      };

      if (
        questions.length === 0
      ) {
        unavailableChapters.push(
          chapter
        );
      }
    }

    if (
      unavailableChapters.length > 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Some selected chapters do not have questions available for Boss Battle.",

        unavailableChapters,

        chapterAvailability,
      });
    }

    // ========================================
    // FETCH ALL AVAILABLE QUESTIONS
    // ========================================

    const availableQuestions =
      await NavtaQuestion.find({
        subject,
        exam,
        classLevel,

        chapter: {
          $in:
            selectedChapters,
        },

        questionType: "mcq",
        ...BATTLE_QUESTION_FILTER,

        difficulty: {
          $in: [
            "Easy",
            "Medium",
            "Hard",
          ],
        },

        isActive: true,
      }).lean();

    // ========================================
    // CHECK TOTAL AVAILABILITY
    // ========================================

    if (
      availableQuestions.length <
      questionCount
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Not enough questions are available for this Boss Battle.",

        required:
          questionCount,

        available:
          availableQuestions.length,

        chapterAvailability,
      });
    }

    // ========================================
    // DIFFICULTY TARGETS
    // ========================================

    const difficultyTargets =
      BOSS_DIFFICULTY_TARGETS[
        questionCount
      ];

    const questionsByDifficulty = {
      Easy: [],
      Medium: [],
      Hard: [],
    };

    availableQuestions.forEach(
      (question) => {
        if (
          questionsByDifficulty[
            question.difficulty
          ]
        ) {
          questionsByDifficulty[
            question.difficulty
          ].push(
            question
          );
        }
      }
    );

    // ========================================
    // SELECT TARGET QUESTIONS
    // ========================================

    let selectedQuestions = [];

    const selectedIds =
      new Set();

    const difficulties = [
      "Easy",
      "Medium",
      "Hard",
    ];

    for (
      const difficulty of difficulties
    ) {
      const pool =
        shuffleArray(
          questionsByDifficulty[
            difficulty
          ]
        );

      const target =
        difficultyTargets[
          difficulty
        ];

      const picked =
        pool.slice(
          0,
          target
        );

      picked.forEach(
        (question) => {
          selectedQuestions.push(
            question
          );

          selectedIds.add(
            String(
              question._id
            )
          );
        }
      );
    }

    // ========================================
    // FALLBACK
    // ========================================
    //
    // If one difficulty does not have enough
    // questions, fill remaining positions from
    // unused Easy / Medium / Hard questions.
    //
    // ========================================

    if (
      selectedQuestions.length <
      questionCount
    ) {
      const remaining =
        shuffleArray(
          availableQuestions.filter(
            (question) =>
              !selectedIds.has(
                String(
                  question._id
                )
              )
          )
        );

      const needed =
        questionCount -
        selectedQuestions.length;

      const fallback =
        remaining.slice(
          0,
          needed
        );

      fallback.forEach(
        (question) => {
          selectedQuestions.push(
            question
          );

          selectedIds.add(
            String(
              question._id
            )
          );
        }
      );
    }

    if (
      selectedQuestions.length <
      questionCount
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Not enough unique questions are available to build this Boss Battle.",

        required:
          questionCount,

        available:
          selectedQuestions.length,
      });
    }

    // ========================================
    // ENSURE EVERY CHAPTER APPEARS
    // ========================================

    for (
      const chapter of selectedChapters
    ) {
      const chapterAlreadyIncluded =
        selectedQuestions.some(
          (question) =>
            question.chapter ===
            chapter
        );

      if (
        chapterAlreadyIncluded
      ) {
        continue;
      }

      const replacementCandidate =
        shuffleArray(
          availableQuestions.filter(
            (question) =>
              question.chapter ===
                chapter &&
              !selectedIds.has(
                String(
                  question._id
                )
              )
          )
        )[0];

      if (
        !replacementCandidate
      ) {
        continue;
      }

      let replacementIndex = -1;

      for (
        let i =
          selectedQuestions.length - 1;
        i >= 0;
        i--
      ) {
        const currentChapter =
          selectedQuestions[
            i
          ].chapter;

        const currentChapterCount =
          selectedQuestions.filter(
            (question) =>
              question.chapter ===
              currentChapter
          ).length;

        if (
          currentChapterCount > 1
        ) {
          replacementIndex =
            i;

          break;
        }
      }

      if (
        replacementIndex !== -1
      ) {
        const oldQuestion =
          selectedQuestions[
            replacementIndex
          ];

        selectedIds.delete(
          String(
            oldQuestion._id
          )
        );

        selectedQuestions[
          replacementIndex
        ] =
          replacementCandidate;

        selectedIds.add(
          String(
            replacementCandidate._id
          )
        );
      }
    }

    // ========================================
    // FINAL SHUFFLE
    // ========================================

    selectedQuestions =
      shuffleArray(
        selectedQuestions
      );

    // ========================================
    // TIMER
    // ========================================

    let minutesPerQuestion = 1;

    if (exam === "JEE") {
      minutesPerQuestion = 2;
    }

    const durationMinutes =
      questionCount *
      minutesPerQuestion;

    // ========================================
    // DIFFICULTY BREAKDOWN
    // ========================================

    const difficultyBreakdown = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    };

    selectedQuestions.forEach(
      (question) => {
        if (
          difficultyBreakdown[
            question.difficulty
          ] !== undefined
        ) {
          difficultyBreakdown[
            question.difficulty
          ] += 1;
        }
      }
    );

    // ========================================
    // CHAPTER BREAKDOWN
    // ========================================

    const chapterBreakdown = {};

    selectedChapters.forEach(
      (chapter) => {
        chapterBreakdown[
          chapter
        ] = 0;
      }
    );

    selectedQuestions.forEach(
      (question) => {
        if (
          chapterBreakdown[
            question.chapter
          ] !== undefined
        ) {
          chapterBreakdown[
            question.chapter
          ] += 1;
        }
      }
    );

    // ========================================
    // FORMAT QUESTIONS
    // ========================================

    const questions =
      selectedQuestions.map(
        (question) => ({
          _id:
            question._id,

          question:
            question.question,

          questionType:
            question.questionType,

          options:
            question.options ||
            [],

          correctAnswer:
            question.correctAnswer,

          explanation:
            question.explanation ||
            "",

          chapter:
            question.chapter,

          difficulty:
            question.difficulty,

          // Screenshot-first AI questions
          questionImage:
            question.questionImage ||
            null,

          questionImages:
            Array.isArray(
              question.questionImages
            )
              ? question.questionImages
              : [],

          hasVisual:
            Boolean(
              question.hasVisual ||
              Boolean(
                getQuestionImageUrl(
                  question.questionImage
                )
              ) ||
              (
                Array.isArray(
                  question.questionImages
                ) &&
                question.questionImages.some(
                  (image) =>
                    Boolean(
                      typeof image === "string"
                        ? image.trim()
                        : image?.url
                    )
                )
              )
            ),

          visualType:
            String(
              question.visualType ||
              (
                hasQuestionVisualImage(
                  question
                )
                  ? "other"
                  : "none"
              )
            ).trim() ||
            "none",

          visualDescription:
            String(
              question.visualDescription ||
              ""
            ).trim(),

          visualBoundingBox:
            question.visualBoundingBox ||
            null,

          questionBoundingBox:
            question.questionBoundingBox ||
            null,

          studentQuestionFormat:
            (
              hasQuestionVisualImage(
                question
              ) ||
              (
                Array.isArray(
                  question.questionImages
                ) &&
                question.questionImages.some(
                  (image) =>
                    Boolean(
                      typeof image === "string"
                        ? image.trim()
                        : image?.url
                    )
                )
              )
            )
              ? "image"
              : (
                  question.studentQuestionFormat ||
                  "text"
                ),

          maxMarks:
            question.maxMarks ||
            1,
        })
      );

    // ========================================
    // RETURN BOSS BATTLE
    // ========================================

    const attempt = await createAttempt(req.user._id, "boss", {
      subject,
      exam,
      classLevel,
      chapters: selectedChapters,
      questionType: "mcq",
      durationMinutes,
    }, questions);

    return res.status(200).json({
      success: true,
      bossBattle: {
        ...attempt,
        mode: "boss",

        winPercentage:
          BOSS_WIN_PERCENTAGE,

        subject,
        exam,
        classLevel,

        chapters:
          selectedChapters,

        totalQuestions:
          questions.length,

        difficultyTargets,

        difficultyBreakdown,

        chapterBreakdown,

        chapterAvailability,

        minutesPerQuestion,

        durationMinutes,

        durationSeconds:
          durationMinutes *
          60,

        questions,
      },
    });
  } catch (error) {
    console.error(
      "GENERATE BOSS BATTLE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate Boss Battle.",

      error:
        error.message,
    });
  }
};

// ============================================
// GENERATE REVENGE BATTLE
// ============================================
//
// Revenge Battle:
// - Unlocks after Boss score below 70%
// - Same subject
// - Same exam
// - Same class
// - Same chapters
// - Same battle size
// - Focuses on weak chapters
// - Focuses on weak difficulties
// - Avoids previous questions when possible
// - Supports Revenge Again
//
// ============================================

exports.generateRevengeBattle = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapters,
      totalQuestions,
      previousQuestionIds = [],
      answers = [],
      revengeAttempt = 1,
      previousPercentage,
      originalPercentage,
    } = req.body;

    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (
      !subject ||
      !exam ||
      !classLevel
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, preparation and class are required.",
      });
    }

    if (!allowedExams[subject]) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid subject.",
      });
    }

    if (
      !allowedExams[
        subject
      ].includes(exam)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${exam} is not available for ${subject}.`,
      });
    }

    if (
      classLevel !== "Class 11" &&
      classLevel !== "Class 12"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid class.",
      });
    }

    // ========================================
    // CHAPTER VALIDATION
    // ========================================

    if (
      !Array.isArray(chapters)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Chapters must be provided as a list.",
      });
    }

    const selectedChapters = [
      ...new Set(
        chapters
          .map(
            (chapter) =>
              String(
                chapter || ""
              ).trim()
          )
          .filter(Boolean)
      ),
    ];

    if (
      selectedChapters.length < 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Select at least 2 chapters for Revenge Battle.",
      });
    }

    // ========================================
    // BATTLE SIZE VALIDATION
    // ========================================

    const questionCount =
      Number(totalQuestions);

    if (
      !BOSS_BATTLE_SIZES.includes(
        questionCount
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Revenge Battle must contain 15, 30 or 50 questions.",
      });
    }

    if (
      selectedChapters.length >
      questionCount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The number of selected chapters cannot exceed the battle size.",
      });
    }

    // ========================================
    // PREVIOUS QUESTION IDS
    // ========================================

    const previousIds =
      Array.isArray(
        previousQuestionIds
      )
        ? [
            ...new Set(
              previousQuestionIds
                .map(
                  (id) =>
                    String(
                      id || ""
                    ).trim()
                )
                .filter(Boolean)
            ),
          ]
        : [];

    // ========================================
    // BUILD ANSWER MAP
    // ========================================

    const answerMap =
      new Map();

    if (
      Array.isArray(answers)
    ) {
      answers.forEach(
        (item) => {
          const id =
            String(
              item?.questionId ||
                ""
            ).trim();

          if (!id) {
            return;
          }

          const rawSelectedAnswer =
            item?.selectedAnswer;

          const selectedAnswer =
            Number(
              rawSelectedAnswer
            );

          const hasValidAnswer =
            rawSelectedAnswer !==
              null &&
            rawSelectedAnswer !==
              undefined &&
            Number.isInteger(
              selectedAnswer
            ) &&
            selectedAnswer >= 0 &&
            selectedAnswer <= 3;

          answerMap.set(
            id,
            hasValidAnswer
              ? selectedAnswer
              : null
          );
        }
      );
    }

    // ========================================
    // GET PREVIOUS BATTLE QUESTIONS
    // ========================================

    const previousQuestions =
      previousIds.length
        ? await NavtaQuestion.find({
            _id: {
              $in:
                previousIds,
            },

            subject,
            exam,
            classLevel,

            chapter: {
              $in:
                selectedChapters,
            },

            questionType: "mcq",
            ...BATTLE_QUESTION_FILTER,

            isActive: true,
          })
            .select(
              "_id chapter difficulty correctAnswer"
            )
            .lean()
        : [];

    // ========================================
    // CHAPTER PERFORMANCE
    // ========================================

    const chapterPerformance = {};

    selectedChapters.forEach(
      (chapter) => {
        chapterPerformance[
          chapter
        ] = {
          correct: 0,
          total: 0,
          percentage: 0,
        };
      }
    );

    // ========================================
    // DIFFICULTY PERFORMANCE
    // ========================================

    const difficultyPerformance = {
      Easy: {
        correct: 0,
        total: 0,
        percentage: 0,
      },

      Medium: {
        correct: 0,
        total: 0,
        percentage: 0,
      },

      Hard: {
        correct: 0,
        total: 0,
        percentage: 0,
            },
    };

    // ========================================
    // CALCULATE PREVIOUS PERFORMANCE
    // ========================================

    previousQuestions.forEach(
      (question) => {
        const id =
          String(
            question._id
          );

        const selectedAnswer =
          answerMap.get(id);

        const isCorrect =
          Number.isInteger(
            selectedAnswer
          ) &&
          selectedAnswer ===
            Number(
              question.correctAnswer
            );

        if (
          chapterPerformance[
            question.chapter
          ]
        ) {
          chapterPerformance[
            question.chapter
          ].total += 1;

          if (isCorrect) {
            chapterPerformance[
              question.chapter
            ].correct += 1;
          }
        }

        if (
          difficultyPerformance[
            question.difficulty
          ]
        ) {
          difficultyPerformance[
            question.difficulty
          ].total += 1;

          if (isCorrect) {
            difficultyPerformance[
              question.difficulty
            ].correct += 1;
          }
        }
      }
    );

    // ========================================
    // CALCULATE PERCENTAGES
    // ========================================

    Object.values(
      chapterPerformance
    ).forEach(
      (result) => {
        result.percentage =
          result.total
            ? Math.round(
                (
                  result.correct /
                  result.total
                ) * 100
              )
            : 0;
      }
    );

    Object.values(
      difficultyPerformance
    ).forEach(
      (result) => {
        result.percentage =
          result.total
            ? Math.round(
                (
                  result.correct /
                  result.total
                ) * 100
              )
            : 0;
      }
    );

    // ========================================
    // FIND WEAKEST CHAPTERS
    // ========================================

    const weakChapters =
      Object.entries(
        chapterPerformance
      )
        .sort(
          (a, b) =>
            a[1].percentage -
            b[1].percentage
        )
        .map(
          ([chapter, result]) => ({
            chapter,
            ...result,
          })
        );

    // ========================================
    // FIND WEAKEST DIFFICULTIES
    // ========================================

    const weakDifficulties =
      Object.entries(
        difficultyPerformance
      )
        .sort(
          (a, b) =>
            a[1].percentage -
            b[1].percentage
        )
        .map(
          ([
            difficulty,
            result,
          ]) => ({
            difficulty,
            ...result,
          })
        );

    // ========================================
    // FETCH AVAILABLE REVENGE QUESTIONS
    // ========================================

    const availableQuestions =
      await NavtaQuestion.find({
        subject,
        exam,
        classLevel,

        chapter: {
          $in:
            selectedChapters,
        },

        questionType: "mcq",
        ...BATTLE_QUESTION_FILTER,

        difficulty: {
          $in: [
            "Easy",
            "Medium",
            "Hard",
          ],
        },

        isActive: true,
      }).lean();

    if (
      availableQuestions.length <
      questionCount
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Not enough questions are available for this Revenge Battle.",

        required:
          questionCount,

        available:
          availableQuestions.length,
      });
    }

    // ========================================
    // REMOVE PREVIOUS QUESTIONS WHEN POSSIBLE
    // ========================================

    const previousIdSet =
      new Set(
        previousIds
      );

    const unusedQuestions =
      availableQuestions.filter(
        (question) =>
          !previousIdSet.has(
            String(
              question._id
            )
          )
      );

    // If enough fresh questions exist,
    // Revenge uses only fresh questions.
    //
    // If not enough fresh questions exist,
    // older questions may be reused.

    const primaryPool =
      unusedQuestions.length >=
      questionCount
        ? unusedQuestions
        : availableQuestions;

    // ========================================
    // WEAKNESS PRIORITY SCORE
    // ========================================

    const chapterScore =
      Object.fromEntries(
        weakChapters.map(
          (item, index) => [
            item.chapter,

            (100 -
              item.percentage) *
              4 +
              (
                weakChapters.length -
                index
              ) *
                8,
          ]
        )
      );

    const difficultyScore =
      Object.fromEntries(
        weakDifficulties.map(
          (item, index) => [
            item.difficulty,

            (100 -
              item.percentage) *
              3 +
              (
                weakDifficulties.length -
                index
              ) *
                6,
          ]
        )
      );

    // ========================================
    // SCORE THE QUESTION POOL
    // ========================================

    const scoredPool =
      shuffleArray(
        primaryPool
      )
        .map(
          (question) => ({
            question,

            score:
              (
                chapterScore[
                  question.chapter
                ] || 0
              ) +
              (
                difficultyScore[
                  question.difficulty
                ] || 0
              ) +
              Math.random() *
                12,
          })
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        );

    let selectedQuestions = [];

    const selectedIds =
      new Set();

    // ========================================
    // GUARANTEE EACH CHAPTER
    // ========================================

    for (
      const chapter of
      selectedChapters
    ) {
      const candidate =
        scoredPool.find(
          (item) =>
            item.question
              .chapter ===
              chapter &&
            !selectedIds.has(
              String(
                item.question
                  ._id
              )
            )
        );

      if (candidate) {
        selectedQuestions.push(
          candidate.question
        );

        selectedIds.add(
          String(
            candidate.question
              ._id
          )
        );
      }
    }

    // ========================================
    // FILL REMAINING QUESTIONS
    // ========================================

    for (
      const item of scoredPool
    ) {
      if (
        selectedQuestions.length >=
        questionCount
      ) {
        break;
      }

      const id =
        String(
          item.question._id
        );

      if (
        selectedIds.has(id)
      ) {
        continue;
      }

      selectedQuestions.push(
        item.question
      );

      selectedIds.add(id);
    }

    // ========================================
    // PREFER UNUSED QUESTIONS
    // ========================================

    if (
      unusedQuestions.length <
      questionCount
    ) {
      const unusedSelectedIds =
        new Set(
          selectedQuestions
            .filter(
              (question) =>
                !previousIdSet.has(
                  String(
                    question._id
                  )
                )
            )
            .map(
              (question) =>
                String(
                  question._id
                )
            )
        );

      const missingUnused =
        shuffleArray(
          unusedQuestions.filter(
            (question) =>
              !unusedSelectedIds.has(
                String(
                  question._id
                )
              )
          )
        );

      for (
        const freshQuestion of
        missingUnused
      ) {
        const replaceIndex =
          selectedQuestions.findIndex(
            (question) =>
              previousIdSet.has(
                String(
                  question._id
                )
              )
          );

        if (
          replaceIndex === -1
        ) {
          break;
        }

        selectedQuestions[
          replaceIndex
        ] =
          freshQuestion;
      }
    }

    // ========================================
    // FINALIZE REVENGE QUESTIONS
    // ========================================

    selectedQuestions =
      shuffleArray(
        selectedQuestions.slice(
          0,
          questionCount
        )
      );

    if (
      selectedQuestions.length <
      questionCount
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Not enough unique questions are available to build this Revenge Battle.",

        required:
          questionCount,

        available:
          selectedQuestions.length,
      });
    }

    // ========================================
    // TIMER
    // ========================================

    const minutesPerQuestion =
      exam === "JEE"
        ? 2
        : 1;

    const durationMinutes =
      questionCount *
      minutesPerQuestion;

    // ========================================
    // DIFFICULTY BREAKDOWN
    // ========================================

    const difficultyBreakdown = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    };

    // ========================================
    // CHAPTER BREAKDOWN
    // ========================================

    const chapterBreakdown = {};

    selectedChapters.forEach(
      (chapter) => {
        chapterBreakdown[
          chapter
        ] = 0;
      }
    );

    selectedQuestions.forEach(
      (question) => {
        if (
          difficultyBreakdown[
            question.difficulty
          ] !== undefined
        ) {
          difficultyBreakdown[
            question.difficulty
          ] += 1;
        }

        if (
          chapterBreakdown[
            question.chapter
          ] !== undefined
        ) {
          chapterBreakdown[
            question.chapter
          ] += 1;
        }
      }
    );

    // ========================================
    // FORMAT QUESTIONS
    // ========================================

    const questions =
      selectedQuestions.map(
        (question) => ({
          _id:
            question._id,

          question:
            question.question,

          questionType:
            question.questionType,

          options:
            question.options ||
            [],

          correctAnswer:
            question.correctAnswer,

          explanation:
            question.explanation ||
            "",

          chapter:
            question.chapter,

          difficulty:
            question.difficulty,

          // Screenshot-first AI questions
          questionImage:
            question.questionImage ||
            null,

          questionImages:
            Array.isArray(
              question.questionImages
            )
              ? question.questionImages
              : [],

          hasVisual:
            Boolean(
              question.hasVisual ||
              Boolean(
                getQuestionImageUrl(
                  question.questionImage
                )
              ) ||
              (
                Array.isArray(
                  question.questionImages
                ) &&
                question.questionImages.some(
                  (image) =>
                    Boolean(
                      typeof image === "string"
                        ? image.trim()
                        : image?.url
                    )
                )
              )
            ),

          visualType:
            String(
              question.visualType ||
              (
                hasQuestionVisualImage(
                  question
                )
                  ? "other"
                  : "none"
              )
            ).trim() ||
            "none",

          visualDescription:
            String(
              question.visualDescription ||
              ""
            ).trim(),

          visualBoundingBox:
            question.visualBoundingBox ||
            null,

          questionBoundingBox:
            question.questionBoundingBox ||
            null,

          studentQuestionFormat:
            (
              hasQuestionVisualImage(
                question
              ) ||
              (
                Array.isArray(
                  question.questionImages
                ) &&
                question.questionImages.some(
                  (image) =>
                    Boolean(
                      typeof image === "string"
                        ? image.trim()
                        : image?.url
                    )
                )
              )
            )
              ? "image"
              : (
                  question.studentQuestionFormat ||
                  "text"
                ),

          maxMarks:
            question.maxMarks ||
            1,
        })
      );

    // ========================================
    // COUNT REPEATED QUESTIONS
    // ========================================

    const repeatedQuestionCount =
      questions.filter(
        (question) =>
          previousIdSet.has(
            String(
              question._id
            )
          )
      ).length;

    // ========================================
    // RETURN REVENGE BATTLE
    // ========================================

    const attempt = await createAttempt(req.user._id, "revenge", {
      subject,
      exam,
      classLevel,
      chapters: selectedChapters,
      questionType: "mcq",
      durationMinutes,
    }, questions);

    return res.status(200).json({
      success: true,
      revengeBattle: {
        ...attempt,
        mode:
          "revenge",

        winPercentage:
          BOSS_WIN_PERCENTAGE,

        revengeAttempt:
          Math.max(
            1,
            Number(
              revengeAttempt
            ) || 1
          ),

        previousPercentage:
          Number(
            previousPercentage
          ) || 0,

        originalPercentage:
          Number(
            originalPercentage
          ) || 0,

        subject,
        exam,
        classLevel,

        chapters:
          selectedChapters,

        totalQuestions:
          questions.length,

        minutesPerQuestion,

        durationMinutes,

        durationSeconds:
          durationMinutes *
          60,

        weakChapters,

        weakDifficulties,

        previousChapterPerformance:
          chapterPerformance,

        previousDifficultyPerformance:
          difficultyPerformance,

        difficultyBreakdown,

        chapterBreakdown,

        repeatedQuestionCount,

        questions,
      },
    });
  } catch (error) {
    console.error(
      "GENERATE REVENGE BATTLE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate Revenge Battle.",

      error:
        error.message,
    });
  }
};

// ============================================
// COMPLETE NAVTA TEST
// ============================================
//
// Saves Standard Test / Boss Battle / Revenge
// results for dashboard performance analytics.
//
// Coin rule:
// - Score <= 80%: 0 coins
// - Score > 80% and duration < 30 min: 1 coin
// - Score > 80% and duration >= 30 min: 2 coins
//
// IMPORTANT:
// This endpoint must be protected by the
// student authentication middleware in routes.
//
// Endpoint:
// POST /api/navta-test/complete
//
// ============================================

exports.completeNavtaTest =
  async (req, res) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication is required.",
        });
      }

      const { attemptId, timeTaken, answers } = req.body ?? {};

      // ========================================
      // ATTEMPT ID
      // ========================================

      const cleanedAttemptId =
        String(
          attemptId || ""
        ).trim();

      if (!cleanedAttemptId) {
        return res.status(400).json({
          success: false,
          message:
            "Attempt ID is required.",
        });
      }

      // ========================================
      // DUPLICATE ATTEMPT PROTECTION
      // ========================================

      const existingResult =
        await Result.findOne({
          user: userId,
          attemptId:
            cleanedAttemptId,
        });

      if (existingResult) {
        // A retry must not create another streak day.
        // Using the original result creation date also
        // lets us safely repair a streak update if the
        // server previously saved the result but stopped
        // before updating the streak.
        const streak =
          await applyNavtaStreakSafely(
            userId,
            existingResult.createdAt ||
              new Date()
          );

        const existingStudent =
          await Student.findOne({
            user: userId,
          }).select(
            "coins xp level currentStreak longestStreak lastNavtaTestDate streakRecoveryActive streakRecoveryRequired streakRecoveryCompleted streakLastUpdatedAt"
          );

        return res.status(200).json({
          success: true,
          alreadySubmitted: true,
          message:
            "This NAVTA Test attempt was already saved.",
          data: {
            result:
              existingResult,
            percentage:
              existingResult.percentage,
            selectedDuration:
              existingResult.selectedDuration,
            coinsEarned:
              Number(
                existingResult.coinsAwarded ||
                  0
              ),
            coinBalance:
              Number(
                existingStudent?.coins ||
                  0
              ),
            newCoins:
              Number(
                existingStudent?.coins ||
                  0
              ),
            streak,
          },
        });
      }

      const attempt = await findAttempt(userId, cleanedAttemptId);
      if (!attempt) {
        return res.status(409).json({
          success: false,
          message: "This NAVTA TEST session is no longer available. Start a new test.",
        });
      }

      const testType = attempt.mode;
      const {
        subject,
        exam,
        classLevel,
        chapter,
        difficulty,
        questionType: resolvedQuestionType,
        durationMinutes: numericDuration,
      } = attempt.setup;
      const assignedIds = new Set(attempt.questions.map((question) => question.questionId));
      if (
        !Array.isArray(answers) ||
        answers.length !== assignedIds.size ||
        new Set(answers.map((answer) => answer?.questionId)).size !== assignedIds.size ||
        answers.some((answer) => !assignedIds.has(answer?.questionId))
      ) {
        return res.status(400).json({
          success: false,
          message: "Submit one answer for every question assigned to this attempt.",
        });
      }

      const submittedAnswers = new Map(answers.map((answer) => [answer.questionId, answer]));
      const writtenGrades = new Map(attempt.writtenGrades.map((grade) => [grade.questionId, grade]));
      const resultChapter = testType === "standard" ? chapter : undefined;
      const resultChapters = [...new Set(attempt.questions.map((question) => question.chapter).filter(Boolean))];
      const gradedAnswers = attempt.questions.map((question) => {
        const submitted = submittedAnswers.get(question.questionId);
        const grade = gradeQuestion(
          question,
          submitted,
          attempt.scoringPolicy,
          writtenGrades.get(question.questionId)
        );
        const response = submitted.selectedAnswer ?? submitted.selectedOption;
        const isSingleChoice = question.questionType === "mcq" && question.answerMode === "single";
        const selectedOption = isSingleChoice ? parseNumber(response) : null;
        let selectedAnswer;
        if (question.answerMode === "numeric") selectedAnswer = parseNumber(response);
        if (question.answerMode === "multiple" && Array.isArray(response) && response.length <= 4) {
          selectedAnswer = response.filter((option) => Number.isInteger(option) && option >= 0 && option <= 3);
        }
        return {
          question: question.questionId,
          selectedOption: Number.isInteger(selectedOption) && selectedOption >= 0 && selectedOption <= 3
            ? selectedOption
            : null,
          selectedAnswer,
          textAnswer: question.questionType !== "mcq" && typeof submitted.textAnswer === "string"
            ? submitted.textAnswer
            : "",
          ...grade,
        };
      });

      const earnedMarks = gradedAnswers.reduce((sum, answer) => sum + answer.awardedMarks, 0);
      const maximumMarks = roundMarks(gradedAnswers.reduce((sum, answer) => sum + answer.maximumMarks, 0));
      const correctAnswers = gradedAnswers.filter((answer) => answer.isCorrect).length;

      if (
        !Number.isFinite(maximumMarks) || maximumMarks <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to calculate this test result.",
        });
      }

      const percentage =
        Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (
                earnedMarks /
                maximumMarks
              ) * 100
            )
          )
        );

      const totalQuestions =
        attempt.questions.length;

      const score = roundMarks(earnedMarks);

      // 70% is retained as the NAVTA
      // performance success threshold.
      const isPassed =
        percentage >= 70;

      // ========================================
      // COIN REWARD
      // ========================================

      const coinsEarned =
        calculateNavtaCoins(
          percentage,
          numericDuration
        );

      // ========================================
      // ACTUAL TIME TAKEN
      // ========================================

      const numericTimeTaken =
        Number(timeTaken);

      const safeTimeTaken =
        Number.isFinite(
          numericTimeTaken
        ) &&
        numericTimeTaken >= 0
          ? Math.min(Math.round(numericTimeTaken), numericDuration * 60)
          : 0;

      // ========================================
      // STUDENT PROFILE
      // ========================================

      const student =
        await Student.findOne({
          user: userId,
        });

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "Student profile not found.",
        });
      }

      // ========================================
      // SAVE RESULT FIRST
      // ========================================
      //
      // NOTE:
      // Result.test must be optional for NAVTA
      // generated tests because these tests are
      // generated dynamically and do not have a
      // Test document.
      //
      // ========================================

      let result;

      try {
        result =
          await Result.create({
            user: userId,
            answers:
              gradedAnswers,
            score,
            percentage,
            maximumMarks,
            scoringPolicy: attempt.scoringPolicy,
            timeTaken:
              safeTimeTaken,
            selectedDuration:
              numericDuration,
            testType,
            subject:
              String(subject).trim(),
            exam:
              String(exam).trim(),
            classLevel:
              String(classLevel).trim(),
            chapter:
              resultChapter,
            chapters:
              resultChapters,
            difficulty:
              testType === "standard"
                ? difficulty
                : undefined,
            questionType:
              testType === "standard"
                ? resolvedQuestionType
                : "mcq",
            attemptId:
              cleanedAttemptId,
            coinsAwarded:
              coinsEarned,
            coinRewardProcessed:
              false,
            coinRewardProcessedAt:
              null,
            correctAnswers,
            totalQuestions,
            isPassed,
          });
      } catch (createError) {
        if (
          createError?.code ===
          11000
        ) {
          const duplicateResult =
            await Result.findOne({
              user: userId,
              attemptId:
                cleanedAttemptId,
            });

          const streak =
            await applyNavtaStreakSafely(
              userId,
              duplicateResult?.createdAt ||
                new Date()
            );

          const duplicateStudent =
            await Student.findOne({
              user: userId,
            }).select(
              "coins currentStreak longestStreak lastNavtaTestDate streakRecoveryActive streakRecoveryRequired streakRecoveryCompleted streakLastUpdatedAt"
            );

          return res.status(200).json({
            success: true,
            alreadySubmitted: true,
            message:
              "This NAVTA Test attempt was already saved.",
            data: {
              result:
                duplicateResult,
              percentage:
                duplicateResult?.percentage ||
                0,
              selectedDuration:
                duplicateResult?.selectedDuration ||
                numericDuration,
              coinsEarned:
                Number(
                  duplicateResult?.coinsAwarded ||
                    0
                ),
              coinBalance:
                Number(
                  duplicateStudent?.coins ||
                    0
                ),
              newCoins:
                Number(
                  duplicateStudent?.coins ||
                    0
                ),
              streak,
            },
          });
        }

        throw createError;
      }

      // ========================================
      // APPLY COINS ONCE
      // ========================================

      const claimedReward =
        await Result.findOneAndUpdate(
          {
            _id: result._id,
            coinRewardProcessed:
              false,
          },
          {
            $set: {
              coinRewardProcessed:
                true,
              coinRewardProcessedAt:
                new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (
        claimedReward &&
        coinsEarned > 0
      ) {
        // Atomic increment avoids overwriting streak
        // fields if another NAVTA TEST completion is
        // updating the Student document at the same time.
        await Student.updateOne(
          {
            user: userId,
          },
          {
            $inc: {
              coins:
                coinsEarned,
            },
          }
        );
      }

      // ========================================
      // NAVTA TEST DAILY STREAK
      // ========================================
      //
      // Any successfully saved Standard, Boss, or
      // Revenge completion qualifies, regardless of
      // score.
      //
      // Only the first qualifying completion on the
      // same India-calendar day changes streak state.
      //
      // Miss 1 day:
      //   1 recovery work day.
      //
      // Miss 2 days:
      //   2 recovery work days.
      //
      // Miss 3+ consecutive full days:
      //   old streak ends and this completion starts
      //   a new streak at 1.
      //
      // Recovery days protect the old streak but do
      // not increase currentStreak.
      // ========================================

      const streak =
        await applyNavtaStreakSafely(
          userId,
          result.createdAt ||
            new Date()
        );

      const finalStudent =
        await Student.findOne({
          user: userId,
        }).select(
          "coins xp level currentStreak longestStreak lastNavtaTestDate streakRecoveryActive streakRecoveryRequired streakRecoveryCompleted streakLastUpdatedAt"
        );

      result =
        await Result.findById(
          result._id
        );

      // ========================================
      // RESPONSE
      // ========================================

      return res.status(201).json({
        success: true,
        alreadySubmitted: false,
        message:
          "NAVTA Test performance saved successfully.",
        data: {
          result,
          percentage,
          score,
          maximumMarks,
          correctAnswers,
          totalQuestions,
          selectedDuration:
            numericDuration,
          testType,
          coinsEarned,
          coinBalance:
            Number(
              finalStudent?.coins ||
                0
            ),
          newCoins:
            Number(
              finalStudent?.coins ||
                0
            ),
          streak,
        },
      });
    } catch (error) {
      console.error(
        "COMPLETE NAVTA TEST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to save NAVTA Test performance.",
        error:
          error.message,
      });
    }
  };


// ============================================
// BOARDS WRITTEN ANSWER EVALUATION
// ============================================

function replyWithWrittenGrade(res, grade, answerDigest) {
  if (!grade || grade.answerDigest !== answerDigest) {
    return res.status(409).json({
      success: false,
      message: "This written question is already evaluated or the attempt is unavailable.",
    });
  }
  return res.json({ success: true, evaluation: grade.evaluation });
}

exports.evaluateWrittenAnswer =
  async (req, res) => {
    try {
      const { attemptId, questionId, studentAnswer } = req.body ?? {};
      if (!questionId || typeof studentAnswer !== "string" || !studentAnswer.trim()) {
        return res.status(400).json({
          success: false,
          message: "Question ID and student answer are required.",
        });
      }

      const userId = req.user._id;
      const attempt = await findAttempt(userId, attemptId);
      if (!attempt || attempt.mode !== "standard" || attempt.setup.exam !== "Boards") {
        return res.status(409).json({
          success: false,
          message: "Start a Boards written test before requesting an evaluation.",
        });
      }

      const question = attempt.questions.find((item) => item.questionId === questionId);
      if (!question || !["short", "long"].includes(question.questionType)) {
        return res.status(400).json({
          success: false,
          message: "This written question is not assigned to your attempt.",
        });
      }

      const answerDigest = writtenAnswerDigest(studentAnswer);
      const savedGrade = attempt.writtenGrades.find((grade) => grade.questionId === questionId);
      if (savedGrade) {
        return replyWithWrittenGrade(res, savedGrade, answerDigest);
      }

      if (await Result.exists({ user: userId, attemptId })) {
        return res.status(409).json({
          success: false,
          message: "This test has already been submitted.",
        });
      }

      // ========================================
      // CHECK OPENAI CONFIG
      // ========================================

      if (
        !process.env
          .OPENAI_API_KEY
      ) {
        return res.status(503).json({
          success: false,
          message:
            "AI evaluation is not configured yet.",
        });
      }

      // ========================================
      // BUILD EVALUATION PROMPT
      // ========================================

      const evaluationPrompt = `
You are evaluating a school board examination answer.

QUESTION:
${question.question}

QUESTION TYPE:
${question.questionType}

MAXIMUM MARKS:
${question.maxMarks}

MODEL ANSWER:
${question.modelAnswer}

REQUIRED KEY POINTS:
${(question.keyPoints || [])
  .map(
    (point, index) =>
      `${index + 1}. ${point}`
  )
  .join("\n")}

ADDITIONAL EVALUATION INSTRUCTIONS:
${question.evaluationInstructions || "None"}

STUDENT ANSWER:
${String(studentAnswer).trim()}

Evaluate the student's answer fairly.

Award marks between 0 and ${question.maxMarks}.

Use the model answer and required key points as the marking guide.

Do not require exact wording if the student's meaning is correct.

Return ONLY valid JSON.

Do not include markdown.

Do not include code fences.

Return exactly this structure:

{
  "status": "correct",
  "marksAwarded": 0,
  "maxMarks": ${question.maxMarks},
  "feedback": "",
  "missingPoints": []
}

Allowed status values:

correct
partially_correct
incorrect
`;

      // ========================================
      // CALL OPENAI RESPONSES API
      // ========================================

      const aiResponse =
        await fetch(
          "https://api.openai.com/v1/responses",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${process.env.OPENAI_API_KEY}`,
            },

            body:
              JSON.stringify({
                model:
                  process.env
                    .OPENAI_MODEL ||
                  "gpt-4.1-mini",

                input:
                  evaluationPrompt,
              }),
          }
        );

      const aiData =
        await aiResponse.json();

      if (!aiResponse.ok) {
        console.error(
          "OPENAI EVALUATION ERROR:",
          aiData
        );

        return res.status(502).json({
          success: false,
          message:
            "AI evaluation service failed.",
        });
      }

      // ========================================
      // EXTRACT RESPONSE TEXT
      // ========================================

      let rawText = "";

      if (
        typeof aiData.output_text ===
        "string"
      ) {
        rawText =
          aiData.output_text;
      }

      if (
        !rawText &&
        Array.isArray(
          aiData.output
        )
      ) {
        for (
          const outputItem of
          aiData.output
        ) {
          if (
            !Array.isArray(
              outputItem.content
            )
          ) {
            continue;
          }

          for (
            const contentItem of
            outputItem.content
          ) {
            if (
              typeof contentItem.text ===
              "string"
            ) {
              rawText +=
                contentItem.text;
            }
          }
        }
      }

      rawText =
        rawText
          .trim()
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          );

      // ========================================
      // PARSE AI JSON
      // ========================================

      let evaluation;

      try {
        evaluation =
          JSON.parse(
            rawText
          );
        if (!evaluation || typeof evaluation !== "object" || Array.isArray(evaluation)) {
          throw new Error("The evaluation must be an object.");
        }
      } catch (parseError) {
        console.error(
          "AI JSON PARSE ERROR:",
          parseError
        );

        return res.status(502).json({
          success: false,
          message:
            "AI returned an invalid evaluation format.",
        });
      }

      // ========================================
      // VALIDATE MARKS
      // ========================================

      const maxMarks =
        Number(
          question.maxMarks
        );

      let marksAwarded =
        Number(
          evaluation.marksAwarded
        );

      if (
        !Number.isFinite(
          marksAwarded
        )
      ) {
        marksAwarded = 0;
      }

      marksAwarded =
        Math.max(
          0,
          Math.min(
            maxMarks,
            marksAwarded
          )
        );

      const status = marksAwarded >= maxMarks
        ? "correct"
        : marksAwarded > 0 ? "partially_correct" : "incorrect";
      const savedEvaluation = {
        status,
        marksAwarded,
        maxMarks,
        feedback: typeof evaluation.feedback === "string" && evaluation.feedback.trim()
          ? evaluation.feedback
          : question.explanation || "",
        missingPoints: Array.isArray(evaluation.missingPoints)
          ? evaluation.missingPoints.filter((point) => typeof point === "string")
          : [],
      };
      const savedAttempt = await NavtaTestAttempt.findOneAndUpdate(
        { _id: attemptId, user: userId, expiresAt: { $gt: new Date() }, "writtenGrades.questionId": { $ne: questionId } },
        { $push: { writtenGrades: { questionId, answerDigest, evaluation: savedEvaluation } } },
        { new: true }
      ).lean();
      const currentAttempt = savedAttempt || await findAttempt(userId, attemptId);
      const grade = currentAttempt?.writtenGrades.find((item) => item.questionId === questionId);
      return replyWithWrittenGrade(res, grade, answerDigest);
    } catch (error) {
      console.error(
        "AI WRITTEN ANSWER EVALUATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to evaluate written answer.",
        error:
          error.message,
      });
    }
  };
