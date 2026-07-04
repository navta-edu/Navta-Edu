const mongoose = require('mongoose');

const PYQSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subject',
    required: true
  },
  chapter: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chapter'
  },
  year: {
    type: Number,
    required: [true, 'Please add the examination year']
  },
  examName: {
    type: String,
    required: [true, 'Please add the exam board or name (e.g. CBSE, JEE)']
  },
  title: {
    type: String,
    required: true
  },
  pdfUrl: {
    type: String
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

module.exports = mongoose.model('PYQ', PYQSchema);
