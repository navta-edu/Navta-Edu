const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Student = require('../models/Student');
const Result = require('../models/Result');

// SAME MODEL USED BY ADMIN NAVTA TEST
const NavtaQuestion = require('../models/NavtaQuestion');

// =====================================================
// CREATE CHAPTER
// =====================================================

exports.createChapter = async (req, res) => {
  try {
    const {
      subjectId,
      title,
      chapterNumber,
      description
    } = req.body;

    const subject = await Subject.findById(subjectId);

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
  } catch (error) {
    console.error('CREATE CHAPTER ERROR:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================================
// CREATE NOTE
// =====================================================

exports.createNote = async (req, res) => {
  try {
    const {
      chapterId,
      title,
      content,
      pdfUrl
    } = req.body;

    const chapter = await Chapter.findById(chapterId);

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
  } catch (error) {
    console.error('CREATE NOTE ERROR:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================================
// CREATE PYQ
// =====================================================

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
  } catch (error) {
    console.error('CREATE PYQ ERROR:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================================
// CREATE TEST
// =====================================================

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

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide questions for the test'
      });
    }

    const questionIds = [];

    for (const item of questions) {
      const question = await Question.create({
        subject: subjectId,
        chapter: chapterId || null,
        questionType: item.questionType || 'mcq',
        text: item.text,
        options: item.options || [],
        correctOption: item.correctOption,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation || '',
        difficulty: item.difficulty || 'medium'
      });

      questionIds.push(question._id);
    }

    const test = await Test.create({
      title,
      description,
      subject: subjectId,
      chapter: chapterId || null,
      duration,
      type: type || 'Quiz',
      questions: questionIds,
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
  } catch (error) {
    console.error('CREATE TEST ERROR:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================================
// STUDENT METRICS
// =====================================================

exports.getStudentMetrics = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('user', 'name email');

    const results = await Result.find()
      .populate('user', 'name')
      .populate('test', 'title type')
      .sort({
        createdAt: -1
      });

    const totalSubmissions = results.length;

    const passedCount = results.filter(
      (result) => result.isPassed
    ).length;

    const passPercentage =
      totalSubmissions > 0
        ? Math.round(
            (passedCount / totalSubmissions) * 100
          )
        : 0;

    return res.status(200).json({
      success: true,

      data: {
        studentsCount: students.length,
        totalSubmissions,
        passPercentage,

        students: students.map((student) => ({
          id: student._id,

          name:
            student.user?.name ||
            'Unknown',

          email:
            student.user?.email ||
            'N/A',

          xp:
            student.xp,

          level:
            student.level,

          badgesCount:
            Array.isArray(student.badges)
              ? student.badges.length
              : 0
        })),

        recentSubmissions:
          results
            .slice(0, 10)
            .map((result) => ({
              id: result._id,

              studentName:
                result.user?.name ||
                'Unknown',

              testTitle:
                result.test?.title ||
                'Deleted Test',

              testType:
                result.test?.type ||
                'N/A',

              percentage:
                result.percentage,

              isPassed:
                result.isPassed,

              date:
                result.createdAt
                  ? result.createdAt.toLocaleDateString()
                  : ''
            }))
      }
    });
  } catch (error) {
    console.error('STUDENT METRICS ERROR:', error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================================
// HELPER - NORMALISE QUESTION TYPE
// =====================================================

const normalizeQuestionType = (value) => {
  if (!value) {
    return 'mcq';
  }

  const type = String(value)
    .trim()
    .toLowerCase();

  if (
    [
      'short',
      'short answer',
      'short-answer',
      'short_answer',
      'shortanswer'
    ].includes(type)
  ) {
    return 'short';
  }

  if (
    [
      'long',
      'long answer',
      'long-answer',
      'long_answer',
      'longanswer'
    ].includes(type)
  ) {
    return 'long';
  }

  return 'mcq';
};

// =====================================================
// NAVTA TEST QUESTION BANK
// PAPER BUILDER
// =====================================================

exports.getQuestionBank = async (req, res) => {
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
    // CHAPTER DISCOVERY FILTER
    //
    // IMPORTANT:
    // This uses Subject + Exam + Class only.
    // This allows the Paper Builder chapter dropdown
    // to update automatically from NavtaQuestion.
    // =================================================

    const chapterFilter = {
      isActive: true
    };

    if (subject) {
      chapterFilter.subject = subject;
    }

    if (exam) {
      chapterFilter.exam = exam;
    }

    if (classLevel) {
      chapterFilter.classLevel = classLevel;
    }

    // =================================================
    // AUTOMATIC CHAPTER LIST
    // =================================================

    const chapterRecords = await NavtaQuestion.find(
      chapterFilter
    )
      .select('chapter')
      .lean();

    const chapters = [
      ...new Set(
        chapterRecords
          .map((item) => item.chapter)
          .filter(
            (item) =>
              item &&
              String(item).trim()
          )
          .map((item) =>
            String(item).trim()
          )
      )
    ].sort((a, b) =>
      a.localeCompare(b)
    );

    // =================================================
    // QUESTION FILTER
    // =================================================

    const conditions = [
      {
        isActive: true
      }
    ];

    if (subject) {
      conditions.push({
        subject
      });
    }

    if (exam) {
      conditions.push({
        exam
      });
    }

    if (classLevel) {
      conditions.push({
        classLevel
      });
    }

    if (chapter) {
      conditions.push({
        chapter
      });
    }

    if (difficulty) {
      conditions.push({
        difficulty
      });
    }

    // =================================================
    // QUESTION TYPE
    // =================================================

    if (questionType) {
      const type =
        normalizeQuestionType(
          questionType
        );

      if (type === 'mcq') {
        conditions.push({
          $or: [
            {
              questionType: 'mcq'
            },
            {
              questionType: 'MCQ'
            },
            {
              questionType: 'objective'
            },
            {
              questionType: 'Objective'
            },
            {
              questionType: {
                $exists: false
              }
            },
            {
              questionType: null
            },
            {
              questionType: ''
            }
          ]
        });
      }

      if (type === 'short') {
        conditions.push({
          questionType: {
            $in: [
              'short',
              'Short',
              'short answer',
              'Short Answer',
              'short-answer',
              'short_answer'
            ]
          }
        });
      }

      if (type === 'long') {
        conditions.push({
          questionType: {
            $in: [
              'long',
              'Long',
              'long answer',
              'Long Answer',
              'long-answer',
              'long_answer'
            ]
          }
        });
      }
    }

    // =================================================
    // SEARCH
    // =================================================

    if (
      search &&
      String(search).trim()
    ) {
      const regex =
        new RegExp(
          String(search).trim(),
          'i'
        );

      conditions.push({
        $or: [
          {
            question: regex
          },
          {
            chapter: regex
          },
          {
            subject: regex
          }
        ]
      });
    }

    const mongoFilter =
      conditions.length === 1
        ? conditions[0]
        : {
            $and:
              conditions
          };

    // =================================================
    // FETCH QUESTIONS FROM ADMIN NAVTA TEST COLLECTION
    // =================================================

    const questions =
      await NavtaQuestion.find(
        mongoFilter
      )
        .sort({
          createdAt: -1
        })
        .lean();

    // =================================================
    // FORMAT QUESTIONS FOR PAPER BUILDER
    // =================================================

    const formattedQuestions =
      questions.map(
        (question) => {
          const type =
            normalizeQuestionType(
              question.questionType
            );

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
            if (type === 'short') {
              defaultMarks = 3;
            } else if (
              type === 'long'
            ) {
              defaultMarks = 5;
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

            options:
              Array.isArray(
                question.options
              )
                ? question.options
                : [],

            maxMarks:
              defaultMarks,

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
        formattedQuestions,

      chapters
    });
  } catch (error) {
    console.error(
      'GET NAVTA QUESTION BANK ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        'Failed to load NAVTA question bank.',

      error:
        error.message
    });
  }
};
