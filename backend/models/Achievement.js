const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add an achievement name'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please add an achievement description']
  },
  requirementType: {
    type: String,
    enum: ['xp', 'streak', 'test_count'],
    required: true
  },
  requirementValue: {
    type: Number,
    required: true
  },
  icon: {
    type: String,
    default: 'zap' // Lucide icon name
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Achievement', AchievementSchema);
