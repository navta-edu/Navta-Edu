const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  chapter: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chapter',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a note title']
  },
  content: {
    type: String,
    required: [true, 'Please add note content']
  },
  pdfUrl: {
    type: String // Optional link to external PDF file
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

module.exports = mongoose.model('Note', NoteSchema);
