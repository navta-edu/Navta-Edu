const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // Optional because NAVTA TEST Standard / Boss / Revenge
  // tests are generated dynamically and do not require
  // a Test document.
  test: {
    type: mongoose.Schema.ObjectId,
    ref: "Test",
    default: undefined,
  },

  // ============================================
  // NAVTA TEST CONTEXT
  // ============================================

  subject: {
    type: String,
    enum: [
      "Physics",
      "Chemistry",
      "Maths",
      "Biology",
    ],
    trim: true,
    default: undefined,
  },

  exam: {
    type: String,
    enum: [
      "NEET",
      "JEE",
      "Boards",
    ],
    trim: true,
    default: undefined,
  },

  classLevel: {
    type: String,
    enum: [
      "Class 11",
      "Class 12",
    ],
    trim: true,
    default: undefined,
  },

  // Standard NAVTA TEST chapter.
  chapter: {
    type: String,
    trim: true,
    default: undefined,
  },

  // Boss / Revenge can contain multiple chapters.
  chapters: {
    type: [
      {
        type: String,
        trim: true,
      },
    ],
    default: undefined,
  },

  // Standard NAVTA TEST difficulty.
  difficulty: {
    type: String,
    enum: [
      "Easy",
      "Medium",
      "Hard",
    ],
    trim: true,
    default: undefined,
  },

  // NAVTA TEST question type.
  questionType: {
    type: String,
    enum: [
      "mcq",
      "short",
      "long",
    ],
    trim: true,
    default: undefined,
  },

  // ============================================
  // ANSWERS
  // ============================================

  answers: [
    {
      question: {
        type: mongoose.Schema.ObjectId,

        // Keep this reference unchanged because
        // Result may also be used by the normal
        // Test system.
        ref: "Question",
      },

      selectedOption: {
        type: Number,
      },

      textAnswer: {
        type: String,
      },

      isCorrect: {
        type: Boolean,
      },
    },
  ],

  // ============================================
  // RESULT
  // ============================================

  score: {
    type: Number,
    required: true,
  },

  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },

  timeTaken: {
    type: Number,
    required: true,
    min: 0,
  },

  // Selected NAVTA TEST duration in minutes.
  selectedDuration: {
    type: Number,
    required: true,
    min: 1,
  },

  testType: {
    type: String,
    default: "standard",
    trim: true,
  },

  attemptId: {
    type: String,
    trim: true,
    default: undefined,
  },

  // ============================================
  // COIN REWARD
  // ============================================

  coinsAwarded: {
    type: Number,
    enum: [
      0,
      1,
      2,
    ],
    default: 0,
  },

  coinRewardProcessed: {
    type: Boolean,
    default: false,
  },

  coinRewardProcessedAt: {
    type: Date,
    default: null,
  },

  // ============================================
  // PERFORMANCE
  // ============================================

  correctAnswers: {
    type: Number,
    required: true,
    min: 0,
  },

  totalQuestions: {
    type: Number,
    required: true,
    min: 0,
  },

  isPassed: {
    type: Boolean,
    required: true,
  },

  // ============================================
  // CREATED DATE
  // ============================================

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// ============================================
// INDEXES
// ============================================

// Prevent duplicate NAVTA TEST completion.
//
// sparse allows old Result documents without
// attemptId to continue working.
ResultSchema.index(
  {
    user: 1,
    attemptId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

// Dashboard / performance history.
ResultSchema.index({
  user: 1,
  createdAt: 1,
});

// Panic Mode exam + class performance.
ResultSchema.index({
  user: 1,
  exam: 1,
  classLevel: 1,
  subject: 1,
  createdAt: -1,
});

// Panic Mode chapter analysis.
ResultSchema.index({
  user: 1,
  exam: 1,
  classLevel: 1,
  subject: 1,
  chapter: 1,
});

module.exports =
  mongoose.models.Result ||
  mongoose.model(
    "Result",
    ResultSchema
  );
