// =====================================================
// NAVTA MASTER CHAPTER CONFIGURATION
// =====================================================
//
// SINGLE SOURCE OF TRUTH FOR CHAPTERS
//
// Used by:
// 1. NAVTA Test
// 2. Study Notes
// 3. Admin Dashboard
// 4. PYQ / future content systems
//
// IMPORTANT:
// Add or remove chapters ONLY HERE.
// Any page using the chapter API will automatically
// receive the updated chapter list.
// =====================================================

const chapters = {
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
      "Waves"
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
      "Semiconductor Electronics"
    ]
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
      "Hydrocarbons"
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
      "Biomolecules"
    ]
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
      "Probability"
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
      "Probability"
    ]
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
      "Chemical Coordination and Integration"
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
      "Biodiversity and Conservation"
    ]
  }
};

// =====================================================
// SUBJECT ALIASES
// =====================================================
//
// Your website may use:
// Maths
// Mathematics
//
// Both should resolve to the same chapter list.
// =====================================================

const SUBJECT_ALIASES = {
  physics: "Physics",
  chemistry: "Chemistry",

  maths: "Maths",
  math: "Maths",
  mathematics: "Maths",

  biology: "Biology",
  bio: "Biology"
};

// =====================================================
// CLASS ALIASES
// =====================================================

const CLASS_ALIASES = {
  "11": "Class 11",
  "class 11": "Class 11",
  "class11": "Class 11",
  "xi": "Class 11",

  "12": "Class 12",
  "class 12": "Class 12",
  "class12": "Class 12",
  "xii": "Class 12"
};

// =====================================================
// NORMALIZE SUBJECT
// =====================================================

const normalizeSubjectName = (value = "") => {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (chapters[raw]) {
    return raw;
  }

  return (
    SUBJECT_ALIASES[raw.toLowerCase()] ||
    ""
  );
};

// =====================================================
// NORMALIZE CLASS
// =====================================================

const normalizeClassName = (value = "") => {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (
    raw === "Class 11" ||
    raw === "Class 12"
  ) {
    return raw;
  }

  return (
    CLASS_ALIASES[raw.toLowerCase()] ||
    ""
  );
};

// =====================================================
// GET SUBJECTS
// =====================================================

const getSubjectNames = () => {
  return Object.keys(chapters);
};

// =====================================================
// GET CLASSES
// =====================================================

const getClassesForSubject = (
  subject
) => {
  const normalizedSubject =
    normalizeSubjectName(subject);

  if (
    !normalizedSubject ||
    !chapters[normalizedSubject]
  ) {
    return [];
  }

  return Object.keys(
    chapters[normalizedSubject]
  );
};

// =====================================================
// GET CHAPTERS
// =====================================================

const getChaptersForSubject = (
  subject,
  classLevel = ""
) => {
  const normalizedSubject =
    normalizeSubjectName(subject);

  if (
    !normalizedSubject ||
    !chapters[normalizedSubject]
  ) {
    return [];
  }

  // -----------------------------------------
  // If class was supplied, return that class.
  // -----------------------------------------

  if (classLevel) {
    const normalizedClass =
      normalizeClassName(
        classLevel
      );

    if (!normalizedClass) {
      return [];
    }

    return [
      ...(
        chapters[
          normalizedSubject
        ][normalizedClass] ||
        []
      )
    ];
  }

  // -----------------------------------------
  // No class supplied:
  // return chapters from both classes.
  // -----------------------------------------

  const output = [];

  Object.entries(
    chapters[normalizedSubject]
  ).forEach(
    ([
      currentClass,
      chapterList
    ]) => {
      chapterList.forEach(
        (chapterName) => {
          output.push({
            name: chapterName,
            chapter: chapterName,
            subject:
              normalizedSubject,
            classLevel:
              currentClass
          });
        }
      );
    }
  );

  return output;
};

// =====================================================
// GET STRUCTURED CHAPTERS
// =====================================================
//
// Useful for Admin Dashboard / Study Notes.
//
// Output:
//
// [
//   {
//     name: "Determinants",
//     subject: "Maths",
//     classLevel: "Class 12"
//   }
// ]
// =====================================================

const getStructuredChapters = (
  subject = "",
  classLevel = ""
) => {
  const subjectsToUse =
    subject
      ? [
          normalizeSubjectName(
            subject
          )
        ].filter(Boolean)
      : getSubjectNames();

  const output = [];

  subjectsToUse.forEach(
    (subjectName) => {
      const classes =
        classLevel
          ? [
              normalizeClassName(
                classLevel
              )
            ].filter(Boolean)
          : getClassesForSubject(
              subjectName
            );

      classes.forEach(
        (className) => {
          const chapterList =
            chapters[
              subjectName
            ]?.[className] ||
            [];

          chapterList.forEach(
            (
              chapterName,
              index
            ) => {
              output.push({
                // Stable config ID.
                // This is NOT a MongoDB ObjectId.
                _id:
                  `${subjectName}-${className}-${index}`
                    .toLowerCase()
                    .replace(
                      /[^a-z0-9]+/g,
                      "-"
                    )
                    .replace(
                      /^-|-$/g,
                      ""
                    ),

                name:
                  chapterName,

                chapter:
                  chapterName,

                subject:
                  subjectName,

                classLevel:
                  className
              });
            }
          );
        }
      );
    }
  );

  return output;
};

// =====================================================
// EXPORT
// =====================================================
//
// Existing code using:
//
// const chapters = require("../config/chapters");
//
// will STILL work because the chapter object itself
// remains module.exports.
//
// Helper functions are non-enumerable so
// Object.keys(chapters) continues returning only:
//
// Physics
// Chemistry
// Maths
// Biology
//
// =====================================================

Object.defineProperties(
  chapters,
  {
    normalizeSubjectName: {
      value:
        normalizeSubjectName,
      enumerable:
        false
    },

    normalizeClassName: {
      value:
        normalizeClassName,
      enumerable:
        false
    },

    getSubjectNames: {
      value:
        getSubjectNames,
      enumerable:
        false
    },

    getClassesForSubject: {
      value:
        getClassesForSubject,
      enumerable:
        false
    },

    getChaptersForSubject: {
      value:
        getChaptersForSubject,
      enumerable:
        false
    },

    getStructuredChapters: {
      value:
        getStructuredChapters,
      enumerable:
        false
    }
  }
);

module.exports = chapters;
