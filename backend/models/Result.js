const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  test: {
    type: mongoose.Schema.ObjectId,
    ref: 'Test',
    required: true
  },

  // ============================================
  // NAVTA TEST CONTEXT
  // ============================================
  //
  // These fields allow features such as
  // Panic Mode to identify performance by:
  //
  // Exam -> Subject -> Class -> Chapter
  //
  // They are optional so older Result documents
  // already stored in MongoDB continue to work.
  // ============================================

  subject: {
    type: String,
    enum: [
      'Physics',
      'Chemistry',
      'Maths',
      'Biology'
    ],
    trim: true,
    default: undefined
  },

  exam: {
    type: String,
    enum: [
      'NEET',
      'JEE',
      'Boards'
    ],
    trim: true,
    default: undefined
  },

  classLevel: {
    type: String,
    enum: [
      'Class 11',
      'Class 12'
    ],
    trim: true,
    default: undefined
  },

  // Used when the NAVTA TEST contains
  // one selected chapter.
  chapter: {
    type: String,
    trim: true,
    default: undefined
  },

  // Kept for compatibility with NAVTA TEST
  // attempts that may contain multiple chapters.
  chapters: {
    type: [
      {
        type: String,
        trim: true
      }
    ],
    default: undefined
  },

  // ============================================
  // ANSWERS
  // ============================================

  answers: [
    {
      question: {
        type: mongoose.Schema.ObjectId,
        ref: 'Question'
      },

      selectedOption: {
        type: Number
      },

      textAnswer: {
        type: String
      },

      isCorrect: {
        type: Boolean
      }
    }
  ],

  // ============================================
  // RESULT
  // ============================================

  score: {
    type: Number,
    required: true
  },

  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  timeTaken: {
    type: Number,
    required: true,
    min: 0
  },

  // Selected NAVTA Test duration in MINUTES.
  // Coin reward uses this value.
  selectedDuration: {
    type: Number,
    required: true,
    min: 1
  },

  // standard / boss / revenge or another
  // future NAVTA TEST type.
  testType: {
    type: String,
    default: 'standard',
    trim: true
  },

  // Unique ID for one particular test attempt.
  // This prevents refresh/resubmit from
  // awarding coins twice.
  attemptId: {
    type: String,
    trim: true,
    default: undefined
  },

  // ============================================
  // COIN REWARD
  // ============================================

  coinsAwarded: {
    type: Number,
    enum: [
      0,
      1,
      2
    ],
    default: 0
  },

  coinRewardProcessed: {
    type: Boolean,
    default: false
  },

  coinRewardProcessedAt: {
    type: Date,
    default: null
  },

  // ============================================
  // PERFORMANCE
  // ============================================

  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },

  totalQuestions: {
    type: Number,
    required: true,
    min: 0
  },

  isPassed: {
    type: Boolean,
    required: true
  },

  // ============================================
  // CREATED DATE
  // ============================================

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// ============================================
// INDEXES
// ============================================

// Prevent the same attempt from being
// submitted twice.
//
// Existing older results without attemptId
// will still work because this index is sparse.
ResultSchema.index(
  {
    user: 1,
    attemptId: 1
  },
  {
    unique: true,
    sparse: true
  }
);

// Makes dashboard date-based analytics faster.
ResultSchema.index({
  user: 1,
  createdAt: 1
});

// Helps Panic Mode retrieve NAVTA TEST
// performance efficiently by student,
// exam, class and subject.
ResultSchema.index({
  user: 1,
  exam: 1,
  classLevel: 1,
  subject: 1,
  createdAt: -1
});

// Helps chapter-level Panic Mode analysis.
ResultSchema.index({
  user: 1,
  exam: 1,
  classLevel: 1,
  subject: 1,
  chapter: 1
});

module.exports =
  mongoose.models.Result ||
  mongoose.model(
    'Result',
    ResultSchema
  );
