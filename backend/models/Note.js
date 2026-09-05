const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  chapter: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chapter',
    required: true
  },

  title: {
    type: String,
    required: [
      true,
      'Please add a note title'
    ]
  },

  content: {
    type: String,
    required: [
      true,
      'Please add note content'
    ]
  },

  pdfUrl: {
    type: String
  },

  subjectName: {
    type: String,
    trim: true,
    default: ''
  },

  chapterName: {
    type: String,
    trim: true,
    default: ''
  },

  className: {
    type: String,
    enum: [
      '',
      'Class 11',
      'Class 12'
    ],
    default: ''
  },

  exam: {
    type: String,
    enum: [
      '',
      'NEET',
      'JEE',
      'Boards'
    ],
    default: ''
  },

  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

NoteSchema.index({
  chapter: 1,
  exam: 1,
  className: 1
});

module.exports = mongoose.model(
  'Note',
  NoteSchema
);
