const mongoose = require('mongoose');

// ============================================
// PANIC CHAPTER SCHEMA
// ============================================


const panicChapterSchema = new mongoose.Schema(
  {
    // ----------------------------------------
    // SUBJECT
    // ----------------------------------------

    subject: {
      type: String,
      required: true,
      trim: true
    },

    // ----------------------------------------
    // CLASS LEVEL
    // ----------------------------------------
    // Used to make sure Panic Mode loads
    // questions/notes from the correct class.
    //
    // Example:
    // Physics + Class 11 + Laws of Motion
    // Physics + Class 12 + Current Electricity

    classLevel: {
      type: String,
      enum: [
        'Class 11',
        'Class 12'
      ],
      default: undefined
    },

    // ----------------------------------------
    // CHAPTER
    // ----------------------------------------

    chapter: {
      type: String,
      required: true,
      trim: true
    },

    // ----------------------------------------
    // PERFORMANCE
    // ----------------------------------------

    accuracy: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    totalQuestions: {
      type: Number,
      default: 0,
      min: 0
    },

    correctAnswers: {
      type: Number,
      default: 0,
      min: 0
    },

    // ----------------------------------------
    // PANIC MODE STATUS
    // ----------------------------------------

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

    // ----------------------------------------
    // STEP 1 — STUDY NOTES
    // ----------------------------------------

    revised: {
      type: Boolean,
      default: false
    },

    // ----------------------------------------
    // STEP 2 — TARGETED PRACTICE
    // ----------------------------------------

    practised: {
      type: Boolean,
      default: false
    },

    // ----------------------------------------
    // STEP 3 — FIX TEST
    // ----------------------------------------

    fixTestPassed: {
      type: Boolean,
      default: false
    },

    fixTestScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100
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

// ============================================
// PANIC SESSION SCHEMA
// ============================================

const panicSessionSchema = new mongoose.Schema(
  {
    // ----------------------------------------
    // STUDENT
    // ----------------------------------------

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // ----------------------------------------
    // EXAM
    // ----------------------------------------

    exam: {
      type: String,
      enum: [
        'NEET',
        'JEE',
        'Boards'
      ],
      required: true
    },

    // ----------------------------------------
    // EXAM WINDOW
    // ----------------------------------------

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

    // ----------------------------------------
    // DAYS UNTIL EXAM
    // ----------------------------------------

    examDays: {
      type: Number,
      required: true,
      min: 1
    },

    // ----------------------------------------
    // AVAILABLE STUDY TIME
    // ----------------------------------------

    studyTimeMinutes: {
      type: Number,
      required: true,
      min: 1
    },

    // ----------------------------------------
    // PANIC MODE CHAPTERS
    // ----------------------------------------

    chapters: {
      type: [panicChapterSchema],
      default: []
    },

    // ----------------------------------------
    // SESSION STATE
    // ----------------------------------------

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

// ============================================
// INDEXES
// ============================================

// Quickly find the student's current active
// Panic Mode session.

panicSessionSchema.index({
  user: 1,
  active: 1,
  createdAt: -1
});

// Helps when analysing sessions by exam.

panicSessionSchema.index({
  user: 1,
  exam: 1,
  createdAt: -1
});

// ============================================
// MODEL
// ============================================

module.exports = mongoose.model(
  'PanicSession',
  panicSessionSchema
);
