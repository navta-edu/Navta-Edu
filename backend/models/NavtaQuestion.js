const mongoose = require("mongoose");

const navtaQuestionSchema = new mongoose.Schema(
  {
    // =====================================================
    // QUESTION CLASSIFICATION
    // =====================================================

    subject: {
      type: String,
      enum: [
        "Physics",
        "Chemistry",
        "Maths",
        "Biology",
      ],
      required: true,
    },

    exam: {
      type: String,
      enum: [
        "NEET",
        "JEE",
        "Boards",
      ],
      required: true,
    },

    classLevel: {
      type: String,
      enum: [
        "Class 11",
        "Class 12",
      ],
      required: true,
    },

    chapter: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: [
        "Easy",
        "Medium",
        "Hard",
      ],
      required: true,
    },

    // =====================================================
    // QUESTION TYPE
    // =====================================================

    questionType: {
      type: String,
      enum: [
        "mcq",
        "short",
        "long",
      ],
      default: "mcq",
      required: true,
    },

    // =====================================================
    // QUESTION
    // =====================================================

    question: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // QUESTION DIAGRAM / IMAGE
    // =====================================================
    //
    // Used for:
    // - Physics diagrams
    // - Circuit diagrams
    // - Graphs
    // - Maths geometry
    // - Chemistry structures
    // - Biology diagrams
    // - Any image attached to the original question
    //
    // The actual image should be stored outside MongoDB.
    // MongoDB stores only its URL/reference.
    // =====================================================

    questionImage: {
      url: {
        type: String,
        trim: true,
        default: "",
      },

      publicId: {
        type: String,
        trim: true,
        default: "",
      },

      altText: {
        type: String,
        trim: true,
        default: "",
      },

      sourcePage: {
        type: Number,
        min: 1,
        default: undefined,
      },

      width: {
        type: Number,
        min: 1,
        default: undefined,
      },

      height: {
        type: Number,
        min: 1,
        default: undefined,
      },
    },

    // =====================================================
    // MULTIPLE QUESTION IMAGES
    // =====================================================
    //
    // Some questions can contain:
    // - More than one diagram
    // - A graph + table
    // - Multiple figures
    //
    // questionImage remains the main image.
    // questionImages allows extra images.
    // =====================================================

    questionImages: {
      type: [
        {
          url: {
            type: String,
            trim: true,
            required: true,
          },

          publicId: {
            type: String,
            trim: true,
            default: "",
          },

          altText: {
            type: String,
            trim: true,
            default: "",
          },

          sourcePage: {
            type: Number,
            min: 1,
            default: undefined,
          },

          width: {
            type: Number,
            min: 1,
            default: undefined,
          },

          height: {
            type: Number,
            min: 1,
            default: undefined,
          },
        },
      ],

      default: [],
    },

    // =====================================================
    // SOURCE DOCUMENT INFORMATION
    // =====================================================
    //
    // Helps NAVTA AI remember where the question came from.
    // Useful for debugging and re-processing imported papers.
    // =====================================================

    sourceDocument: {
      fileName: {
        type: String,
        trim: true,
        default: "",
      },

      fileType: {
        type: String,
        enum: [
          "",
          "pdf",
          "docx",
          "txt",
        ],
        default: "",
      },

      pageNumber: {
        type: Number,
        min: 1,
        default: undefined,
      },

      importedByAI: {
        type: Boolean,
        default: false,
      },
    },

    // =====================================================
    // MCQ ONLY
    // =====================================================

    options: {
      type: [String],

      default: [],

      validate: {
        validator: function (value) {
          if (this.questionType !== "mcq") {
            return true;
          }

          return (
            Array.isArray(value) &&
            value.length === 4 &&
            value.every(
              (option) =>
                typeof option === "string" &&
                option.trim().length > 0
            )
          );
        },

        message:
          "MCQ questions must have exactly 4 valid options.",
      },
    },

    correctAnswer: {
      type: Number,

      min: 0,
      max: 3,

      required: function () {
        return this.questionType === "mcq";
      },

      default: undefined,
    },

    // =====================================================
    // SHORT / LONG ANSWER
    // =====================================================

    modelAnswer: {
      type: String,

      trim: true,

      required: function () {
        return (
          this.questionType === "short" ||
          this.questionType === "long"
        );
      },

      default: "",
    },

    keyPoints: {
      type: [String],

      default: [],

      validate: {
        validator: function (value) {
          if (this.questionType === "mcq") {
            return true;
          }

          return (
            Array.isArray(value) &&
            value.length > 0
          );
        },

        message:
          "Short and Long Answer questions must contain at least one key point.",
      },
    },

    maxMarks: {
      type: Number,

      min: 1,

      required: function () {
        return (
          this.questionType === "short" ||
          this.questionType === "long"
        );
      },

      default: function () {
        if (this.questionType === "mcq") {
          return 1;
        }

        return undefined;
      },
    },

    evaluationInstructions: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // EXPLANATION / FEEDBACK
    // =====================================================

    explanation: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // STATUS
    // =====================================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);

// =====================================================
// VALIDATION BEFORE SAVE
// =====================================================

navtaQuestionSchema.pre(
  "validate",
  function (next) {
    // ---------------------------------------------
    // NEET AND JEE
    // Only MCQ questions are currently supported.
    // ---------------------------------------------

    if (
      (this.exam === "NEET" ||
        this.exam === "JEE") &&
      this.questionType !== "mcq"
    ) {
      return next(
        new Error(
          `${this.exam} questions must use MCQ question type.`
        )
      );
    }

    // ---------------------------------------------
    // CLEAN MAIN QUESTION IMAGE
    // ---------------------------------------------

    if (
      this.questionImage &&
      !this.questionImage.url
    ) {
      this.questionImage = {
        url: "",
        publicId: "",
        altText: "",
      };
    }

    // ---------------------------------------------
    // CLEAN EXTRA QUESTION IMAGES
    // ---------------------------------------------

    if (
      Array.isArray(this.questionImages)
    ) {
      this.questionImages =
        this.questionImages.filter(
          (image) =>
            image &&
            typeof image.url === "string" &&
            image.url.trim()
        );
    }

    // ---------------------------------------------
    // MCQ
    // ---------------------------------------------

    if (this.questionType === "mcq") {
      this.modelAnswer = "";
      this.keyPoints = [];
      this.evaluationInstructions = "";

      if (
        this.correctAnswer === undefined ||
        this.correctAnswer === null
      ) {
        return next(
          new Error(
            "MCQ questions require a correct answer."
          )
        );
      }
    }

    // ---------------------------------------------
    // SHORT / LONG
    // ---------------------------------------------

    if (
      this.questionType === "short" ||
      this.questionType === "long"
    ) {
      if (this.exam !== "Boards") {
        return next(
          new Error(
            "Short Answer and Long Answer questions are only available for Boards."
          )
        );
      }

      this.options = [];
      this.correctAnswer = undefined;

      if (!this.modelAnswer?.trim()) {
        return next(
          new Error(
            "A model answer is required for written questions."
          )
        );
      }

      if (
        !Array.isArray(this.keyPoints) ||
        this.keyPoints.length === 0
      ) {
        return next(
          new Error(
            "At least one key point is required for written questions."
          )
        );
      }
    }

    next();
  }
);

// =====================================================
// INDEXES
// =====================================================

navtaQuestionSchema.index({
  subject: 1,
  exam: 1,
  classLevel: 1,
  chapter: 1,
  difficulty: 1,
  questionType: 1,
  isActive: 1,
});

navtaQuestionSchema.index({
  "sourceDocument.importedByAI": 1,
  createdAt: -1,
});

// =====================================================
// EXPORT
// =====================================================

module.exports =
  mongoose.models.NavtaQuestion ||
  mongoose.model(
    "NavtaQuestion",
    navtaQuestionSchema
  );
