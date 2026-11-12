const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a reward title'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please add a reward description']
  },
  costCoins: {
    type: Number,
    required: [true, 'Please specify the coin cost']
  },
  badgeImage: {
    type: String,
    default: 'award' // Fallback Lucide icon name
  },
  type: {
    type: String,
    enum: ['coupon', 'badge', 'resource'],
    default: 'badge'
  },
  archivedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reward', RewardSchema);
