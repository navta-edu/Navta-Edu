const mongoose = require("mongoose");

const mistakeNotebookSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NavtaQuestion",
      required: true,
      index: true,
    },

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

    source: {
      type: String,
      enum: ["standard", "boss", "revenge"],
      default: "standard",
      required: true,
    },

    selectedAnswer: {
      type: Number,
      min: 0,
      max: 3,
      default: null,
    },

    correctAnswer: {
      type: Number,
      min: 0,
      max: 3,
      required: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    isMastered: {
      type: Boolean,
      default: false,
    },

    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
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

mistakeNotebookSchema.index(
  {
    student: 1,
    question: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.models.MistakeNotebook ||
  mongoose.model(
    "MistakeNotebook",
    mistakeNotebookSchema
  );
