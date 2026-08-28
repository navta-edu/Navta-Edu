const mongoose = require("mongoose");

const mistakeNotebookSchema = new mongoose.Schema(
  {
    // Student who saved this mistake
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Original NAVTA question
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NavtaQuestion",
      required: true,
    },

    // Question information
    subject: {
      type: String,
      required: true,
      trim: true,
    },

    exam: {
      type: String,
      required: true,
      trim: true,
    },

    classLevel: {
      type: String,
      required: true,
      trim: true,
    },

    chapter: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },

    // Where the mistake happened
    source: {
      type: String,
      enum: ["standard", "boss", "revenge"],
      required: true,
      default: "standard",
    },

    // Student's incorrect answer
    selectedAnswer: {
      type: Number,
      min: 0,
      max: 3,
      default: null,
    },

    // Correct answer
    correctAnswer: {
      type: Number,
      min: 0,
      max: 3,
      required: true,
    },

    // Student's personal note
    note: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // Has the student mastered this mistake?
    isMastered: {
      type: Boolean,
      default: false,
    },

    // Number of times reviewed
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastReviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same question from appearing
// multiple times for the same student.
mistakeNotebookSchema.index(
  {
    student: 1,
    question: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "MistakeNotebook",
  mistakeNotebookSchema
);
