const mongoose = require('mongoose');

const panicChapterSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true
    },

    chapter: {
      type: String,
      required: true,
      trim: true
    },

    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    totalQuestions: {
      type: Number,
      default: 0
    },

    correctAnswers: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: [
        'fix-first',
        'quick-revision',
        'strong',
        'fixed'
      ],
      default: 'fix-first'
    },

    revised: {
      type: Boolean,
      default: false
    },

    practised: {
      type: Boolean,
      default: false
    },

    fixTestPassed: {
      type: Boolean,
      default: false
    },

    fixTestScore: {
      type: Number,
      default: null
    },

    fixedAt: {
      type: Date,
      default: null
    }
  },
  {
    _id: true
  }
);

const panicSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    exam: {
      type: String,
      enum: ['NEET', 'JEE', 'Boards'],
      required: true
    },

    examWindow: {
      type: String,
      enum: [
        'tomorrow',
        '3-days',
        '7-days',
        '14-days'
      ],
      required: true
    },

    examDays: {
      type: Number,
      required: true,
      min: 1
    },

    studyTimeMinutes: {
      type: Number,
      required: true,
      min: 1
    },

    chapters: {
      type: [panicChapterSchema],
      default: []
    },

    active: {
      type: Boolean,
      default: true
    },

    completed: {
      type: Boolean,
      default: false
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

panicSessionSchema.index({
  user: 1,
  active: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  'PanicSession',
  panicSessionSchema
);
