const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  coins: {
    type: Number,
    default: 0
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  stream: {
    type: String,
    enum: ['Science', 'Commerce', 'Arts', 'General'],
    default: 'General'
  },
  badges: [
    {
      name: String,
      earnedAt: { type: Date, default: Date.now },
      icon: String
    }
  ],
  rewardsRedeemed: [
    {
      reward: { type: mongoose.Schema.ObjectId, ref: 'Reward' },
      redeemedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', StudentSchema);
