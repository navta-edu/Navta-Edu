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

  // standard / boss / revenge or another future test type
  testType: {
    type: String,
    default: 'standard',
    trim: true
  },

  // Unique ID for one particular test attempt.
  // This prevents refresh/resubmit from awarding coins twice.
  attemptId: {
    type: String,
    trim: true,
    default: undefined
  },

  coinsAwarded: {
    type: Number,
    enum: [0, 1, 2],
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

  correctAnswers: {
    type: Number,
    required: true
  },

  totalQuestions: {
    type: Number,
    required: true
  },

  isPassed: {
    type: Boolean,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Prevent the same attempt from being submitted twice.
//
// Existing older results without attemptId will still work because
// this index is sparse.
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

// Makes dashboard date-based analytics faster
ResultSchema.index({
  user: 1,
  createdAt: 1
});

module.exports =
  mongoose.models.Result ||
  mongoose.model('Result', ResultSchema);
