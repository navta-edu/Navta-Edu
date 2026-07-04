const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subject',
    required: true
  },
  chapter: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chapter'
  },
  text: {
    type: String,
    required: [true, 'Please add question text']
  },
  options: {
    type: [String],
    required: [true, 'Please add options'],
    validate: [arr => arr.length >= 2, 'Options must have at least 2 answers']
  },
  correctOption: {
    type: Number,
    required: [true, 'Please specify the correct option index (0-indexed)']
  },
  explanation: {
    type: String
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', QuestionSchema);
