const mongoose = require("mongoose");

const panicFixAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NavtaQuestion",
      required: true,
    },

    selectedOption: {
      type: Number,
      min: 0,
      max: 3,
      default: null,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const panicFixAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    panicSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PanicSession",
      required: true,
      index: true,
    },

    panicChapterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    exam: {
      type: String,
      required: true,
    },

    chapter: {
      type: String,
      required: true,
    },

    classLevel: {
      type: String,
      enum: ["Class 11", "Class 12"],
      default: undefined,
    },

    questionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NavtaQuestion",
        required: true,
      },
    ],

    answers: {
      type: [panicFixAnswerSchema],
      default: [],
    },

    totalQuestions: {
      type: Number,
      default: 10,
    },

    correctAnswers: {
      type: Number,
      default: 0,
    },

    percentage: {
      type: Number,
      default: 0,
    },

    passed: {
      type: Boolean,
      default: false,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

panicFixAttemptSchema.index({
  user: 1,
  panicSession: 1,
  panicChapterId: 1,
  completed: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "PanicFixAttempt",
  panicFixAttemptSchema
);
