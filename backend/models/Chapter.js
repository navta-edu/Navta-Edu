const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },

  title: {
    type: String,
    required: [true, 'Please add a chapter title'],
    trim: true
  },

  description: {
    type: String,
    trim: true,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent the same chapter title from being added twice
// under the same subject.
ChapterSchema.index(
  { subject: 1, title: 1 },
  { unique: true }
);

module.exports = mongoose.model('Chapter', ChapterSchema);
