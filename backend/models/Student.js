const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  coins: {
    type: Number,
    default: 0,
    min: 0
  },

  xp: {
    type: Number,
    default: 0,
    min: 0
  },

  level: {
    type: Number,
    default: 1,
    min: 1
  },

  stream: {
    type: String,
    enum: ['Science', 'Commerce', 'Arts', 'General'],
    default: 'General'
  },

  // ============================================================
  // NAVTA TEST STREAK
  // ============================================================
  //
  // A qualifying day means the student completed at least
  // ONE NAVTA TEST on that India-calendar day.
  //
  // Multiple NAVTA TEST completions on the same day count once.
  //
  // Miss 1 day  -> 1 recovery work day.
  // Miss 2 days -> 2 recovery work days.
  // Miss 3 consecutive full days -> old streak ends.
  //
  // Recovery work days protect the old streak but do not
  // increase currentStreak. Normal streak growth resumes on
  // the next consecutive qualifying day after recovery.
  // ============================================================

  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },

  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },

  // India date key: YYYY-MM-DD
  lastNavtaTestDate: {
    type: String,
    default: null
  },

  streakRecoveryActive: {
    type: Boolean,
    default: false
  },

  streakRecoveryRequired: {
    type: Number,
    default: 0,
    min: 0,
    max: 2
  },

  streakRecoveryCompleted: {
    type: Number,
    default: 0,
    min: 0,
    max: 2
  },

  streakLastUpdatedAt: {
    type: Date,
    default: null
  },

  badges: [
    {
      name: String,
      earnedAt: {
        type: Date,
        default: Date.now
      },
      icon: String
    }
  ],

  rewardsRedeemed: [
    {
      reward: {
        type: mongoose.Schema.ObjectId,
        ref: 'Reward'
      },
      redeemedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =
  mongoose.models.Student ||
  mongoose.model(
    'Student',
    StudentSchema
  );
