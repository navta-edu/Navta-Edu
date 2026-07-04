const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a subject name'],
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Please add a subject code'],
    unique: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['Science', 'Commerce', 'Arts', 'General'],
    default: 'General'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subject', SubjectSchema);
