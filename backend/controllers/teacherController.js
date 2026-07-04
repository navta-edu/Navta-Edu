const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Student = require('../models/Student');
const Result = require('../models/Result');

// @desc    Upload new chapter content
// @route   POST /api/teacher/chapters
// @access  Private (Teacher/Admin)
exports.createChapter = async (req, res) => {
  try {
    const { subjectId, title, chapterNumber, description } = req.body;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const chapter = await Chapter.create({
      subject: subjectId,
      title,
      chapterNumber,
      description
    });

    res.status(201).json({ success: true, data: chapter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload study notes
// @route   POST /api/teacher/notes
// @access  Private (Teacher/Admin)
exports.createNote = async (req, res) => {
  try {
    const { chapterId, title, content, pdfUrl } = req.body;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }

    const note = await Note.create({
      chapter: chapterId,
      title,
      content,
      pdfUrl,
      uploadedBy: req.user.id
    });

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload past year paper details (PYQ)
// @route   POST /api/teacher/pyqs
// @access  Private (Teacher/Admin)
exports.createPYQ = async (req, res) => {
  try {
    const { subjectId, chapterId, year, examName, title, pdfUrl } = req.body;

    const pyq = await PYQ.create({
      subject: subjectId,
      chapter: chapterId || null,
      year,
      examName,
      title,
      pdfUrl,
      uploadedBy: req.user.id
    });

    res.status(201).json({ success: true, data: pyq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create quiz/test with new questions
// @route   POST /api/teacher/tests
// @access  Private (Teacher/Admin)
exports.createTest = async (req, res) => {
  try {
    const { title, description, subjectId, chapterId, duration, type, questions, totalMarks, passingScore } = req.body;
    // questions is an array of objects: { text, options, correctOption, explanation, difficulty }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide questions for the test' });
    }

    // 1. Create questions
    const questionIds = [];
    for (const q of questions) {
      const question = await Question.create({
        subject: subjectId,
        chapter: chapterId || null,
        text: q.text,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium'
      });
      questionIds.push(question._id);
    }

    // 2. Create Test referencing the questions
    const test = await Test.create({
      title,
      description,
      subject: subjectId,
      chapter: chapterId || null,
      duration,
      type: type || 'Quiz',
      questions: questionIds,
      totalMarks: totalMarks || questions.length * 10,
      passingScore: passingScore || 40
    });

    res.status(201).json({ success: true, data: test });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get student performance dashboard metrics
// @route   GET /api/teacher/student-metrics
// @access  Private (Teacher/Admin)
exports.getStudentMetrics = async (req, res) => {
  try {
    // Get all students
    const students = await Student.find().populate('user', 'name email');
    const results = await Result.find()
      .populate('user', 'name')
      .populate('test', 'title type');

    // Summarize test performance metrics
    const totalSubmissions = results.length;
    const passedCount = results.filter(r => r.isPassed).length;
    const passPercentage = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        studentsCount: students.length,
        totalSubmissions,
        passPercentage,
        students: students.map(s => ({
          id: s._id,
          name: s.user ? s.user.name : 'Unknown',
          email: s.user ? s.user.email : 'N/A',
          xp: s.xp,
          level: s.level,
          badgesCount: s.badges.length
        })),
        recentSubmissions: results.slice(0, 10).map(r => ({
          id: r._id,
          studentName: r.user ? r.user.name : 'Unknown',
          testTitle: r.test ? r.test.title : 'Deleted Test',
          testType: r.test ? r.test.type : 'N/A',
          percentage: r.percentage,
          isPassed: r.isPassed,
          date: r.createdAt.toLocaleDateString()
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
