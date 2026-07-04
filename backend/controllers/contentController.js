const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Test = require('../models/Test');
const Question = require('../models/Question');

// @desc    Get all subjects
// @route   GET /api/content/subjects
// @access  Public
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get chapters by subject
// @route   GET /api/content/subjects/:subjectId/chapters
// @access  Public
exports.getChapters = async (req, res) => {
  try {
    const chapters = await Chapter.find({ subject: req.params.subjectId }).sort('chapterNumber');
    res.status(200).json({ success: true, count: chapters.length, data: chapters });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get notes by chapter
// @route   GET /api/content/chapters/:chapterId/notes
// @access  Public
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ chapter: req.params.chapterId }).populate('uploadedBy', 'name');
    res.status(200).json({ success: true, count: notes.length, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get PYQs by subject
// @route   GET /api/content/subjects/:subjectId/pyqs
// @access  Public
exports.getPYQs = async (req, res) => {
  try {
    const pyqs = await PYQ.find({ subject: req.params.subjectId }).populate('chapter', 'title');
    res.status(200).json({ success: true, count: pyqs.length, data: pyqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get tests/quizzes by subject
// @route   GET /api/content/subjects/:subjectId/tests
// @access  Public
exports.getTests = async (req, res) => {
  try {
    const query = { subject: req.params.subjectId };
    if (req.query.chapterId) {
      query.chapter = req.query.chapterId;
    }
    const tests = await Test.find(query).populate('chapter', 'title');
    res.status(200).json({ success: true, count: tests.length, data: tests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get test detail with full questions
// @route   GET /api/content/tests/:testId
// @access  Private
exports.getTestDetail = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId).populate('questions');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.status(200).json({ success: true, data: test });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
