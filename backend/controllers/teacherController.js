const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Student = require('../models/Student');
const Result = require('../models/Result');

// =====================================================
// NAVTA TEST QUESTION BANK
// SAME MODEL USED BY ADMIN NAVTA TEST
// =====================================================

const NavtaQuestion = require('../models/NavtaQuestion');

// =====================================================
// CREATE CHAPTER
// =====================================================

// @desc    Upload new chapter content
// @route   POST /api/teacher/chapters
// @access  Private (Teacher/Admin)

exports.createChapter = async (req, res) => {
  try {
    const {
      subjectId,
      title,
      chapterNumber,
      description
    } = req.body;

    const subject = await Subject.findById(
      subjectId
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const chapter = await Chapter.create({
      subject: subjectId,
      title,
      chapterNumber,
      description
    });

    return res.status(201).json({
      success: true,
      data: chapter
    });
  } catch (err) {
    console.error(
      'CREATE CHAPTER ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================================================
// CREATE NOTE
// =====================================================

// @desc    Upload study notes
// @route   POST /api/teacher/notes
// @access  Private (Teacher/Admin)

exports.createNote = async (req, res) => {
  try {
    const {
      chapterId,
      title,
      content,
      pdfUrl
    } = req.body;

    const chapter = await Chapter.findById(
      chapterId
    );

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const note = await Note.create({
      chapter: chapterId,
      title,
      content,
      pdfUrl,
      uploadedBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      data: note
    });
  } catch (err) {
    console.error(
      'CREATE NOTE ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================================================
// CREATE PYQ
// =====================================================

// @desc    Upload past year paper
// @route   POST /api/teacher/pyqs
// @access  Private (Teacher/Admin)

exports.createPYQ = async (req, res) => {
  try {
    const {
      subjectId,
      chapterId,
      year,
      examName,
      title,
      pdfUrl
    } = req.body;

    const pyq = await PYQ.create({
      subject: subjectId,
      chapter: chapterId || null,
      year,
      examName,
      title,
      pdfUrl,
      uploadedBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      data: pyq
    });
  } catch (err) {
    console.error(
      'CREATE PYQ ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================================================
// CREATE TEST
// =====================================================

// @desc    Create quiz/test with new questions
// @route   POST /api/teacher/tests
// @access  Private (Teacher/Admin)

exports.createTest = async (req, res) => {
  try {
    const {
      title,
      description,
      subjectId,
      chapterId,
      duration,
      type,
      questions,
      totalMarks,
      passingScore
    } = req.body;

    if (
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide questions for the test'
      });
    }

    // =================================================
    // CREATE QUESTIONS
    // =================================================

    const questionIds = [];

    for (const q of questions) {
      const question = await Question.create({
        subject: subjectId,

        chapter:
          chapterId || null,

        questionType:
          q.questionType || 'mcq',

        text: q.text,

        options:
          q.options || [],

        correctOption:
          q.correctOption,

        correctAnswer:
          q.correctAnswer,

        explanation:
          q.explanation || '',

        difficulty:
          q.difficulty || 'medium'
      });

      questionIds.push(
        question._id
      );
    }

    // =================================================
    // CREATE TEST
    // =================================================

    const test = await Test.create({
      title,
      description,

      subject:
        subjectId,

      chapter:
        chapterId || null,

      duration,

      type:
        type || 'Quiz',

      questions:
        questionIds,

      totalMarks:
        totalMarks ||
        questions.length * 10,

      passingScore:
        passingScore || 40
    });

    return res.status(201).json({
      success: true,
      data: test
    });
  } catch (err) {
    console.error(
      'CREATE TEST ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================================================
// STUDENT PERFORMANCE METRICS
// =====================================================

// @desc    Get student performance dashboard metrics
// @route   GET /api/teacher/student-metrics
// @access  Private (Teacher/Admin)

exports.getStudentMetrics = async (
  req,
  res
) => {
  try {
    const students = await Student.find()
      .populate(
        'user',
        'name email'
      );

    const results = await Result.find()
      .populate(
        'user',
        'name'
      )
      .populate(
        'test',
        'title type'
      )
      .sort({
        createdAt: -1
      });

    const totalSubmissions =
      results.length;

    const passedCount =
      results.filter(
        (result) =>
          result.isPassed
      ).length;

    const passPercentage =
      totalSubmissions > 0
        ? Math.round(
            (
              passedCount /
              totalSubmissions
            ) * 100
          )
        : 0;

    return res.status(200).json({
      success: true,

      data: {
        studentsCount:
          students.length,

        totalSubmissions,

        passPercentage,

        students:
          students.map(
            (student) => ({
              id:
                student._id,

              name:
                student.user
                  ? student.user.name
                  : 'Unknown',

              email:
                student.user
                  ? student.user.email
                  : 'N/A',

              xp:
                student.xp,

              level:
                student.level,

              badgesCount:
                Array.isArray(
                  student.badges
                )
                  ? student.badges.length
                  : 0
            })
          ),

        recentSubmissions:
          results
            .slice(0, 10)
            .map(
              (result) => ({
                id:
                  result._id,

                studentName:
                  result.user
                    ? result.user.name
                    : 'Unknown',

                testTitle:
                  result.test
                    ? result.test.title
                    : 'Deleted Test',

                testType:
                  result.test
                    ? result.test.type
                    : 'N/A',

                percentage:
                  result.percentage,

                isPassed:
                  result.isPassed,

                date:
                  result.createdAt
                    ? result.createdAt.toLocaleDateString()
                    : ''
              })
            )
      }
    });
  } catch (err) {
    console.error(
      'STUDENT METRICS ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// =====================================================
// NAVTA TEST QUESTION BANK FOR PAPER BUILDER
// =====================================================

// @desc
// Get questions uploaded through Admin -> Navta TEST
//
// @route
// GET /api/teacher/question-bank
//
// @access
// Teacher / External Teacher / Admin

exports.getQuestionBank = async (
  req,
  res
) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      questionType,
      search
    } = req.query;

    // =================================================
    // BASE FILTER
    // =================================================

    const filter = {
      isActive: true
    };

    // =================================================
    // OPTIONAL FILTERS
    // =================================================

    if (subject) {
      filter.subject =
        subject;
    }

    if (exam) {
      filter.exam =
        exam;
    }

    if (classLevel) {
      filter.classLevel =
        classLevel;
    }

    if (chapter) {
      filter.chapter =
        chapter;
    }

    if (difficulty) {
      filter.difficulty =
        difficulty;
    }

    if (questionType) {
      filter.questionType =
        questionType;
    }

    // =================================================
    // SEARCH QUESTION TEXT
    // =================================================

    if (
      search &&
      String(search).trim()
    ) {
      filter.question = {
        $regex:
          String(search).trim(),

        $options: 'i'
      };
    }

    // =================================================
    // FETCH FROM SAME COLLECTION AS NAVTA TEST
    // =================================================

    const questions =
      await NavtaQuestion.find(
        filter
      )
        .sort({
          subject: 1,
          exam: 1,
          classLevel: 1,
          chapter: 1,
          difficulty: 1,
          createdAt: -1
        })
        .lean();

    // =================================================
    // FORMAT FOR PAPER BUILDER
    // =================================================

    const formattedQuestions =
      questions.map(
        (question) => {
          let type =
            question.questionType ||
            'mcq';

          type = String(type)
            .trim()
            .toLowerCase();

          if (
            type ===
              'short answer' ||
            type ===
              'short-answer' ||
            type ===
              'short_answer'
          ) {
            type = 'short';
          }

          if (
            type ===
              'long answer' ||
            type ===
              'long-answer' ||
            type ===
              'long_answer'
          ) {
            type = 'long';
          }

          if (
            ![
              'mcq',
              'short',
              'long'
            ].includes(type)
          ) {
            type = 'mcq';
          }

          // ---------------------------------------------
          // DEFAULT MARKS
          // ---------------------------------------------

          let defaultMarks =
            Number(
              question.maxMarks
            );

          if (
            !Number.isFinite(
              defaultMarks
            ) ||
            defaultMarks <= 0
          ) {
            if (
              type === 'long'
            ) {
              defaultMarks = 5;
            } else if (
              type === 'short'
            ) {
              defaultMarks = 3;
            } else {
              defaultMarks = 1;
            }
          }

          return {
            _id:
              question._id,

            subject:
              question.subject,

            exam:
              question.exam,

            classLevel:
              question.classLevel,

            chapter:
              question.chapter,

            difficulty:
              question.difficulty,

            questionType:
              type,

            question:
              question.question,

            // ===========================================
            // MCQ OPTIONS
            // These are displayed in Paper Builder
            // and printed in the student PDF.
            // ===========================================

            options:
              Array.isArray(
                question.options
              )
                ? question.options
                : [],

            // ===========================================
            // MARKS
            // ===========================================

            maxMarks:
              defaultMarks,

            // ===========================================
            // SOURCE
            // ===========================================

            source:
              'NAVTA Admin Bank',

            sourceType:
              'navta-test',

            createdAt:
              question.createdAt
          };
        }
      );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      count:
        formattedQuestions.length,

      questions:
        formattedQuestions
    });
  } catch (error) {
    console.error(
      'GET NAVTA QUESTION BANK ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        'Failed to load Navta TEST question bank.',

      error:
        error.message
    });
  }
};
