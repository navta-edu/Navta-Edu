const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },

  examination: {
    type: String,
    required: [true, 'Please select an examination'],
    trim: true
  },

  classLevel: {
    type: String,
    required: [true, 'Please select a class'],
    trim: true
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

// Same chapter name can exist in different exams/classes,
// but cannot be duplicated inside the same combination.
ChapterSchema.index(
  {
    subject: 1,
    examination: 1,
    classLevel: 1,
    title: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model('Chapter', ChapterSchema);
