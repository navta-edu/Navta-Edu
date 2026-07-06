const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subject'
  },
  chapter: {
    type: mongoose.Schema.ObjectId,
    ref: 'Chapter'
  },
  questionType: {
    type: String,
    enum: ['mcq', 'short', 'long'],
    default: 'mcq'
  },
  text: {
    type: String,
    required: [true, 'Please add question text']
  },
  options: {
    type: [String],
    validate: {
      validator: function(arr) {
        if (this.questionType === 'mcq') {
          return arr && arr.length >= 2;
        }
        return true;
      },
      message: 'MCQ Options must have at least 2 answers'
    }
  },
  correctOption: {
    type: Number,
    required: function() { return this.questionType === 'mcq'; }
  },
  correctAnswer: {
    type: String,
    required: function() { return this.questionType !== 'mcq'; }
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
