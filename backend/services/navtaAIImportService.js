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

// Better PDF render quality for diagram crops.
// 2.2 is a safe default: clearer diagrams without making uploads too slow.
const NAVTA_AI_PDF_RENDER_SCALE = Math.max(
  1.6,
  Math.min(
    3,
    Number(
      process.env.NAVTA_AI_PDF_RENDER_SCALE || 2.2
    ) || 2.2
  )
);

// Padding is normalized to the page size.
// 0.07 means 7% page padding around a diagram box.
const NAVTA_AI_VISUAL_CROP_PADDING = Math.max(
  0,
  Math.min(
    0.15,
    Number(
      process.env.NAVTA_AI_VISUAL_CROP_PADDING || 0.1
    ) || 0.1
  )
);

// Fallback full-question crop needs smaller padding.
const NAVTA_AI_QUESTION_CROP_PADDING = Math.max(
  0,
  Math.min(
    0.1,
    Number(
      process.env.NAVTA_AI_QUESTION_CROP_PADDING || 0.04
    ) || 0.04
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

  // Gemini sometimes returns percentages instead of 0-1 values.
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

const resolveBestVisualCropBox = (
  question = {}
) => {
  const visualBox =
    normalizeBoundingBox(
      question.visualBoundingBox
    );

  const questionBox =
    normalizeBoundingBox(
      question.questionBoundingBox
    );

  if (
    isUsableVisualBoundingBox(
      visualBox
    )
  ) {
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
  }

  // Fallback: when Gemini detects a visual but the diagram box is missing,
  // too tiny, or unreliable, crop the whole question area instead.
  // This is better than saving a cut-off or blank diagram.
  if (
    questionBox
  ) {
    return {
      box:
        expandBoundingBox(
          questionBox,
          NAVTA_AI_QUESTION_CROP_PADDING
        ),

      originalBox:
        questionBox,

      usedFallback:
        true,
    };
  }

  return {
    box:
      null,

    originalBox:
      null,

    usedFallback:
      false,
  };
};


// =====================================================
// OPTION / QUESTION TEXT REPAIR
// =====================================================
// Gemini sometimes returns MCQ choices inside question text instead of
// the options array. This safety layer repairs those cases before
// validation and before saving to MongoDB.
// =====================================================

const normalizeLineBreaks = (
  value = ""
) => {
  return cleanString(
    value
  )
    .replace(
      /\r\n?/g,
      "\n"
    )
    .replace(
      /[ \t]+\n/g,
      "\n"
    )
    .replace(
      /\n[ \t]+/g,
      "\n"
    )
    .replace(
      /[ \t]{2,}/g,
      " "
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
};

const compactOptionText = (
  value = ""
) => {
  return normalizeLineBreaks(
    value
  )
    .replace(
      /^\s*(?:(?:\(\s*(?:[1-4]|[A-Da-d])\s*\))|(?:(?:[1-4]|[A-Da-d])\s*[\).:-]))\s*/,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
};

const normalizeOptionArray = (
  value
) => {
  return safeArray(
    value
  )
    .map(
      compactOptionText
    )
    .filter(Boolean);
};

const getMarkerLabel = (
  marker = ""
) => {
  return cleanString(
    marker
  )
    .replace(
      /[()\s.:\-]/g,
      ""
    );
};

const collectMarkers = (
  text = "",
  markerRegex,
  labels = []
) => {
  const source =
    String(text || "");

  const result =
    [];

  let match;

  markerRegex.lastIndex = 0;

  while (
    (match = markerRegex.exec(source))
  ) {
    const leading =
      match[1] || "";

    const marker =
      match[2] || "";

    const label =
      getMarkerLabel(
        marker
      );

    if (
      !labels.includes(
        label
      )
    ) {
      continue;
    }

    const start =
      match.index +
      leading.length;

    result.push({
      label,

      start,

      end:
        markerRegex.lastIndex,

      marker,
    });
  }

  return result;
};

const containsQuestionContinuation = (
  value = ""
) => {
  const text =
    cleanString(value).toLowerCase();

  return (
    /\?\s*(?:$|\n)/.test(text) ||
    /\b(?:which|identify|choose|select|find|calculate|determine|among|following|correct|incorrect)\b/.test(text)
  );
};

const optionLooksUnsafe = (
  value = ""
) => {
  const text =
    compactOptionText(value);

  if (
    !text
  ) {
    return true;
  }

  if (
    text.length > 600
  ) {
    return true;
  }

  return false;
};

const scoreOptionBlock = (
  source = "",
  block
) => {
  if (
    !block
  ) {
    return -1;
  }

  let score =
    block.start;

  if (
    block.start >
    source.length * 0.35
  ) {
    score += 1000;
  }

  if (
    block.start >
    source.length * 0.55
  ) {
    score += 1000;
  }

  if (
    block.kind === "number"
  ) {
    score += 500;
  }

  if (
    block.kind === "lower-letter"
  ) {
    score += 300;
  }

  return score;
};

const extractOrderedOptionBlock = (
  text = "",
  config = {}
) => {
  const source =
    normalizeLineBreaks(
      text
    );

  if (
    !source
  ) {
    return null;
  }

  const markers =
    collectMarkers(
      source,
      config.regex,
      config.labels
    );

  if (
    markers.length < 4
  ) {
    return null;
  }

  const candidates =
    [];

  for (
    let index = 0;
    index < markers.length;
    index += 1
  ) {
    const first =
      markers[index];

    if (
      first.label !==
      config.labels[0]
    ) {
      continue;
    }

    const chosen =
      [first];

    let searchFrom =
      index + 1;

    for (
      let labelIndex = 1;
      labelIndex < config.labels.length;
      labelIndex += 1
    ) {
      const nextIndex =
        markers.findIndex(
          (marker, markerIndex) =>
            markerIndex >= searchFrom &&
            marker.label ===
              config.labels[labelIndex] &&
            marker.start >
              chosen[chosen.length - 1].end
        );

      if (
        nextIndex === -1
      ) {
        break;
      }

      chosen.push(
        markers[nextIndex]
      );

      searchFrom =
        nextIndex + 1;
    }

    if (
      chosen.length !== 4
    ) {
      continue;
    }

    const options =
      chosen.map(
        (marker, optionIndex) => {
          const next =
            chosen[optionIndex + 1];

          const end =
            next
              ? next.start
              : source.length;

          return compactOptionText(
            source.slice(
              marker.end,
              end
            )
          );
        }
      );

    if (
      options.some(
        optionLooksUnsafe
      )
    ) {
      continue;
    }

    // Prevent internal compound lists like (A), (B), (C), (D) from being
    // converted into final MCQ options when the real question continues
    // after the list.
    if (
      config.kind !== "number" &&
      chosen[0].start <
        source.length * 0.35 &&
      containsQuestionContinuation(
        options[3]
      )
    ) {
      continue;
    }

    candidates.push({
      kind:
        config.kind,

      start:
        chosen[0].start,

      end:
        source.length,

      question:
        normalizeQuestionText(
          source.slice(
            0,
            chosen[0].start
          )
        ),

      options,

      markerStyle:
        config.kind,
    });
  }

  if (
    candidates.length === 0
  ) {
    return null;
  }

  return candidates.sort(
    (a, b) =>
      scoreOptionBlock(
        source,
        b
      ) -
      scoreOptionBlock(
        source,
        a
      )
  )[0];
};

const OPTION_BLOCK_CONFIGS = [
  {
    kind:
      "number",

    labels:
      ["1", "2", "3", "4"],

    regex:
      /(^|[\s\n;:,])((?:\(\s*[1-4]\s*\)|[1-4]\s*[\).]))(?=\s|$)/g,
  },
  {
    kind:
      "lower-letter",

    labels:
      ["a", "b", "c", "d"],

    regex:
      /(^|[\s\n;:,])((?:\(\s*[a-d]\s*\)|[a-d]\s*[\).]))(?=\s|$)/g,
  },
  {
    kind:
      "upper-letter",

    labels:
      ["A", "B", "C", "D"],

    regex:
      /(^|[\s\n;:,])((?:\(\s*[A-D]\s*\)|[A-D]\s*[\).]))(?=\s|$)/g,
  },
];

const extractBestOptionBlock = (
  text = ""
) => {
  const blocks =
    OPTION_BLOCK_CONFIGS
      .map(
        (config) =>
          extractOrderedOptionBlock(
            text,
            config
          )
      )
      .filter(Boolean);

  if (
    blocks.length === 0
  ) {
    return null;
  }

  return blocks.sort(
    (a, b) =>
      scoreOptionBlock(
        text,
        b
      ) -
      scoreOptionBlock(
        text,
        a
      )
  )[0];
};

const normalizedOptionFingerprint = (
  value = ""
) => {
  return compactOptionText(
    value
  )
    .toLowerCase()
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

const optionArraysLookSimilar = (
  left = [],
  right = []
) => {
  const a =
    normalizeOptionArray(
      left
    ).map(
      normalizedOptionFingerprint
    );

  const b =
    normalizeOptionArray(
      right
    ).map(
      normalizedOptionFingerprint
    );

  if (
    a.length !== 4 ||
    b.length !== 4
  ) {
    return false;
  }

  return a.every(
    (value, index) =>
      value &&
      value === b[index]
  );
};

const replaceRepeatedLabelsWithLines = (
  text = "",
  regex,
  minCount = 2
) => {
  const source =
    String(text || "");

  const matches =
    Array.from(
      source.matchAll(
        regex
      )
    );

  if (
    matches.length < minCount
  ) {
    return source;
  }

  return source.replace(
    regex,
    (...args) => {
      const match =
        args[0];

      const offset =
        args[args.length - 2];

      const whole =
        args[args.length - 1];

      const before =
        whole.slice(
          Math.max(
            0,
            offset - 35
          ),
          offset
        ).toLowerCase();

      // Keep inline references like "compound (C)" untouched.
      if (
        /\b(?:compound|option|choice|answer|statement)\s*$/.test(
          before
        )
      ) {
        return match;
      }

      if (
        offset === 0 ||
        whole[offset - 1] === "\n"
      ) {
        return match.trimStart();
      }

      return `\n${match.trimStart()}`;
    }
  );
};

const normalizeQuestionText = (
  value = ""
) => {
  let text =
    normalizeLineBreaks(
      value
    );

  if (
    !text
  ) {
    return "";
  }

  text = text.replace(
    /([^\n])\s+(\((?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)\))\s+/gi,
    "$1\n$2 "
  );

  text = text.replace(
    /([^\n])\s+(Statement\s+(?:I|II|III|IV|V|VI|VII|VIII|IX|X)\b)/g,
    "$1\n$2"
  );

  text = text.replace(
    /([^\n])\s+(Assertion\s*:)/gi,
    "$1\n$2"
  );

  text = text.replace(
    /([^\n])\s+(Reason\s*:)/gi,
    "$1\n$2"
  );

  text = replaceRepeatedLabelsWithLines(
    text,
    /((?:\(?[a-d]\)?[\).])\s+)/g,
    2
  );

  text = replaceRepeatedLabelsWithLines(
    text,
    /((?:\(?[A-D]\)?[\).])\s+)/g,
    2
  );

  text = replaceRepeatedLabelsWithLines(
    text,
    /(^|\s)((?:[1-9][0-9]?\.)\s+)/g,
    3
  );

  return normalizeLineBreaks(
    text
  );
};

const repairQuestionAndOptions = (
  rawQuestion = {}
) => {
  const warnings =
    [];

  let questionText =
    normalizeQuestionText(
      rawQuestion?.question
    );

  let options =
    normalizeOptionArray(
      rawQuestion?.options
    );

  if (
    options.length === 1
  ) {
    const optionBlock =
      extractBestOptionBlock(
        options[0]
      );

    if (
      optionBlock?.options?.length === 4
    ) {
      options =
        optionBlock.options;

      warnings.push(
        "NAVTA repaired four MCQ options that were merged into one option field."
      );
    }
  }

  const blockFromQuestion =
    extractBestOptionBlock(
      questionText
    );

  if (
    blockFromQuestion?.options?.length === 4
  ) {
    const shouldUseBlockOptions =
      options.length !== 4;

    const shouldStripBlockOnly =
      options.length === 4 &&
      (
        optionArraysLookSimilar(
          options,
          blockFromQuestion.options
        ) ||
        blockFromQuestion.start >
          questionText.length * 0.4
      );

    if (
      shouldUseBlockOptions ||
      shouldStripBlockOnly
    ) {
      questionText =
        blockFromQuestion.question ||
        questionText;

      if (
        shouldUseBlockOptions
      ) {
        options =
          blockFromQuestion.options;
      }

      warnings.push(
        "NAVTA removed final MCQ options from Question Text and placed them in Option A/B/C/D fields."
      );
    }
  }

  if (
    options.length > 4
  ) {
    options =
      options.slice(
        0,
        4
      );

    warnings.push(
      "NAVTA found more than four MCQ options and kept the first four for admin review."
    );
  }

  return {
    question:
      normalizeQuestionText(
        questionText
      ),

    options:
      options.map(
        compactOptionText
      ),

    warnings,
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
// VALIDATE QUESTION
// =====================================================
//
// IMPORTANT:
//
// Ordinary equations / matrices / determinants
// DO NOT require a screenshot.
//
// Images are optional and only used when:
//
// hasVisual = true
//
// AND:
//
// visualBoundingBox exists.
//
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

  const repairedQuestion =
    repairQuestionAndOptions(
      rawQuestion
    );

  const normalizedQuestionBoundingBox =
    normalizeBoundingBox(
      rawQuestion?.questionBoundingBox
    );

  const normalizedVisualBoundingBox =
    normalizeBoundingBox(
      rawQuestion?.visualBoundingBox
    );

  const hasDetectedVisual =
    Boolean(
      rawQuestion?.hasVisual
    );

  const question = {
    ...rawQuestion,

    question:
      repairedQuestion.question,

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
      repairedQuestion.options,

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
        (
          normalizedVisualBoundingBox ||
          normalizedQuestionBoundingBox
        )
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
        rawQuestion?.needsReview ||
        repairedQuestion.warnings.length > 0
      ),

    importRepairWarnings:
      repairedQuestion.warnings,
  };

  const reasons =
    [];

  // =========================================
  // DROP
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
  // QUESTION
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
      question.correctAnswer =
        null;

      question.needsReview =
        true;

      question.answerReviewReason =
        "NAVTA AI could not determine the MCQ answer confidently during the PDF analysis.";
    }
  }

  // =========================================
  // CONFIDENCE REVIEW RULES
  // =========================================

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

  // =========================================
  // NO VISUAL
  // =========================================

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
//
// NAVTA stores a screenshot only for genuine diagrams / graphs / figures.
// The crop is padded because Gemini bounding boxes are often slightly tight.
// If visualBoundingBox is missing or too small, NAVTA falls back to the full
// questionBoundingBox so the admin/student never receives a half-cut diagram.
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
          "NAVTA detected a visual but no usable diagram or question crop box was available.",
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

      const fallbackWarning =
        crop.usedFallback
          ? "NAVTA used the full question crop because the detected diagram crop was missing, too small, or unreliable."
          : null;

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
            Boolean(
              crop.usedFallback
            ),
        },

        screenshotWarning:
          fallbackWarning,
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
// BUILD ADMIN REVIEW QUESTION
// =====================================================

const buildImportQuestion = ({
  question,
  questionImage = null,
  sourceFileName,
  fileType,
  visualWarning = null,
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
  // WRITTEN
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
  // REAL VISUAL ONLY
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
    result.questionImage =
      null;

    result.questionImages =
      [];
  }

  if (
    safeArray(
      question.importRepairWarnings
    ).length > 0
  ) {
    result.importRepairWarnings =
      question.importRepairWarnings;

    result.needsReview =
      true;
  }

  if (
    visualWarning
  ) {
    result.visualWarning =
      visualWarning;

    result.needsReview =
      true;
  }

  return result;
};

// =====================================================
// LIMITED CONCURRENCY
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
// This is a second safety layer after AI-service dedupe.
// It runs BEFORE visual cropping / Cloudinary upload so a
// duplicate question does not waste image processing.
//
// The controller performs one more database-level check
// before saving approved questions.
// =====================================================

const normalizeImportFingerprintText = (
  value = ""
) => {
  return cleanString(
    value
  )
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
};

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
      .filter(Boolean)
      .join("|");

  return stem
    ? `${stem}||${options}`
    : "";
};

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
    // =========================================
    // RENDER PDF
    // =========================================

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

    // =========================================
    // AI ANALYSIS
    // =========================================

    const detectedQuestionsRaw =
      await analyseRenderedPages({
        pages:
          rendered.pages,

        text:
          documentResult?.text ||
          "",

        hints,
      });

    const detectedQuestions =
      removeImportDuplicates(
        detectedQuestionsRaw
      );

    console.log(
      `NAVTA AI detected ${detectedQuestions.length} unique question(s) before validation.`
    );

    // =========================================
    // PAGE MAP
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
    // VALIDATION
    // =========================================

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

    // =========================================
    // PROCESS VISUALS
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

          // =====================================
          // NORMAL TEXT / MATH
          // =====================================
          //
          // No screenshot.
          // No Cloudinary upload.
          //

          if (
            !question.hasVisual
          ) {
            return {
              accepted:
                true,

              question:
                buildImportQuestion({
                  question,

                  questionImage:
                    null,

                  sourceFileName:
                    file.originalname,

                  fileType:
                    "pdf",
                }),
            };
          }

          // =====================================
          // ACTUAL VISUAL
          // =====================================

          const visual =
            await processQuestionVisual({
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

                sourceFileName:
                  file.originalname,

                fileType:
                  "pdf",

                visualWarning:
                  visual.screenshotWarning,
              }),
          };
        }
      );

    // =========================================
    // FINAL QUESTIONS
    // =========================================

    const acceptedQuestions =
      processed
        .filter(
          (item) =>
            item?.accepted
        )
        .map(
          (item) =>
            item.question
        );

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
// TXT / DOCX
// =====================================================

const processTextImport =
  async ({
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
// MAIN IMPORT
// =====================================================

const analyseNavtaImport =
  async ({
    file,
    subject,
    exam,
    classLevel,
    chapter,
  }) => {
    // =========================================
    // FILE CHECK
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
    // EXTRACT DOCUMENT
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

      chapter:
        cleanString(
          chapter
        ),
    };

    hints.allowedChapters =
      getAllowedChapters(
        hints.subject,
        hints.classLevel
      );

    if (
      hints.chapter &&
      hints.allowedChapters.length > 0 &&
      !hints.allowedChapters.includes(
        hints.chapter
      )
    ) {
      throw new Error(
        `Invalid chapter "${hints.chapter}" for ${hints.subject} ${hints.classLevel}.`
      );
    }

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
    // NEEDS REVIEW
    // =========================================

    const needsReview =
      result.acceptedQuestions.filter(
        (question) =>
          question.needsReview
      ).length;

    // =========================================
    // RETURN
    // =========================================

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
