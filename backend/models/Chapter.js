const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subject',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a chapter title']
  },
  chapterNumber: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Avoid duplicate chapter numbers within the same subject
ChapterSchema.index({ subject: 1, chapterNumber: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', ChapterSchema);
