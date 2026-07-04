const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a test title']
  },
  description: {
    type: String
  },
  subject: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subject',
    required: true
  },
  chapter: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chapter'
  },
  duration: {
    type: Number,
    required: [true, 'Please specify duration in minutes']
  },
  type: {
    type: String,
    enum: ['Quiz', 'Mock Test', 'PYQ Test'],
    default: 'Quiz'
  },
  questions: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Question',
      required: true
    }
  ],
  totalMarks: {
    type: Number,
    default: 100
  },
  passingScore: {
    type: Number,
    default: 40 // passing percentage
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Test', TestSchema);
