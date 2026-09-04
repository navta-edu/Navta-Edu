const mongoose = require('mongoose');

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
// NAVTA MASTER STUDY NOTE HELPERS
// =====================================================
//
// NAVTA TEST chapters come from the NAVTA master chapter
// configuration and therefore their frontend IDs are not
// necessarily MongoDB ObjectIds.
//
// Study Notes, however, store a real Chapter ObjectId.
//
// These helpers bridge both systems:
//
// NAVTA TEST chapter
//    -> subjectName + className + chapterName
//    -> find/create MongoDB Subject
//    -> find/create MongoDB Chapter
//    -> save Study Note against real Chapter._id
//
// =====================================================

const cleanString = (value = '') => {
  return String(value ?? '').trim();
};

const escapeRegex = (value = '') => {
  return cleanString(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
};

const normalizeSubjectName = (value = '') => {
  const raw = cleanString(value);
  const lower = raw.toLowerCase();

  if (lower === 'physics') {
    return 'Physics';
  }

  if (lower === 'chemistry') {
    return 'Chemistry';
  }

  if (
    lower === 'maths' ||
    lower === 'math' ||
    lower === 'mathematics'
  ) {
    return 'Maths';
  }

  if (
    lower === 'biology' ||
    lower === 'bio'
  ) {
    return 'Biology';
  }

  return raw;
};

const normalizeClassName = (value = '') => {
  const raw = cleanString(value);

  if (!raw) {
    return '';
  }

  const compact =
    raw
      .toLowerCase()
      .replace(/\s+/g, '');

  if (
    compact === '11' ||
    compact === 'class11' ||
    compact === 'xi'
  ) {
    return 'Class 11';
  }

  if (
    compact === '12' ||
    compact === 'class12' ||
    compact === 'xii'
  ) {
    return 'Class 12';
  }

  return raw;
};

const isMongoObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(
    cleanString(value)
  );
};

// =====================================================
// RESOLVE / CREATE SUBJECT
// =====================================================

const resolveSubjectForNavta = async ({
  subjectId,
  subjectName
}) => {
  // -------------------------------------------
  // 1. Real MongoDB subject ID supplied
  // -------------------------------------------

  if (isMongoObjectId(subjectId)) {
    const subjectById =
      await Subject.findById(subjectId);

    if (subjectById) {
      return subjectById;
    }
  }

  // -------------------------------------------
  // 2. Resolve by human-readable NAVTA name
  // -------------------------------------------

  const normalizedName =
    normalizeSubjectName(subjectName);

  if (!normalizedName) {
    return null;
  }

  const exactNameRegex =
    new RegExp(
      `^${escapeRegex(normalizedName)}$`,
      'i'
    );

  let subject =
    await Subject.findOne({
      name: exactNameRegex
    });

  // -------------------------------------------
  // Handle Mathematics <-> Maths compatibility
  // -------------------------------------------

  if (
    !subject &&
    normalizedName === 'Maths'
  ) {
    subject =
      await Subject.findOne({
        name: /^Mathematics$/i
      });
  }

  if (subject) {
    return subject;
  }

  // -------------------------------------------
  // 3. Automatically create missing subject
  // -------------------------------------------

  subject =
    await Subject.create({
      name: normalizedName
    });

  console.log(
    `NAVTA Study Notes: created MongoDB subject "${normalizedName}" (${subject._id}).`
  );

  return subject;
};

// =====================================================
// RESOLVE / CREATE CHAPTER
// =====================================================

const resolveChapterForNavta = async ({
  chapterId,
  chapterName,
  subject,
  className,
  exam,
  chapterNumber
}) => {
  // -------------------------------------------
  // 1. Existing real MongoDB Chapter ID
  // -------------------------------------------

  if (isMongoObjectId(chapterId)) {
    const chapterById =
      await Chapter.findById(chapterId);

    if (chapterById) {
      return chapterById;
    }
  }

  // -------------------------------------------
  // 2. NAVTA master chapter name is required
  // -------------------------------------------

  const normalizedChapterName =
    cleanString(chapterName);

  if (
    !normalizedChapterName ||
    !subject?._id
  ) {
    return null;
  }

  const normalizedClass =
    normalizeClassName(className);

  const chapterQuery = {
    subject: subject._id,

    title: new RegExp(
      `^${escapeRegex(normalizedChapterName)}$`,
      'i'
    )
  };

  // -------------------------------------------
  // Detect class field from Chapter schema
  // -------------------------------------------

  let chapterClassField = '';

  if (Chapter.schema.path('classLevel')) {
    chapterClassField = 'classLevel';
  } else if (Chapter.schema.path('className')) {
    chapterClassField = 'className';
  } else if (Chapter.schema.path('class')) {
    chapterClassField = 'class';
  }

  if (
    chapterClassField &&
    normalizedClass
  ) {
    chapterQuery[
      chapterClassField
    ] = normalizedClass;
  }

  let chapter =
    await Chapter.findOne(
      chapterQuery
    );

  // -------------------------------------------
  // Backward-compatible fallback
  // -------------------------------------------

  if (
    !chapter &&
    chapterClassField
  ) {
    chapter =
      await Chapter.findOne({
        subject: subject._id,

        title: new RegExp(
          `^${escapeRegex(normalizedChapterName)}$`,
          'i'
        ),

        $or: [
          {
            [chapterClassField]: {
              $exists: false
            }
          },
          {
            [chapterClassField]: null
          },
          {
            [chapterClassField]: ''
          }
        ]
      });
  }

  if (chapter) {
    return chapter;
  }

  // -------------------------------------------
  // 3. Automatically create missing chapter
  // -------------------------------------------

  let resolvedChapterNumber =
    Number(chapterNumber);

  if (
    !Number.isFinite(
      resolvedChapterNumber
    ) ||
    resolvedChapterNumber <= 0
  ) {
    resolvedChapterNumber =
      (
        await Chapter.countDocuments({
          subject: subject._id
        })
      ) + 1;
  }

  const chapterPayload = {
    subject: subject._id,

    title:
      normalizedChapterName,

    chapterNumber:
      resolvedChapterNumber,

    description:
      `NAVTA master chapter${
        normalizedClass
          ? ` • ${normalizedClass}`
          : ''
      }${
        cleanString(exam)
          ? ` • ${cleanString(exam)}`
          : ''
      }`
  };

  if (
    chapterClassField &&
    normalizedClass
  ) {
    chapterPayload[
      chapterClassField
    ] = normalizedClass;
  }

  if (
    Chapter.schema.path('exam') &&
    cleanString(exam)
  ) {
    chapterPayload.exam =
      cleanString(exam);
  }

  chapter =
    await Chapter.create(
      chapterPayload
    );

  console.log(
    `NAVTA Study Notes: created MongoDB chapter "${normalizedChapterName}" (${chapter._id}).`
  );

  return chapter;
};

// =====================================================
// CREATE CHAPTER
// =====================================================

exports.createChapter = async (req, res) => {
  try {
    const {
      subjectId,
      subjectName,
      title,
      chapterNumber,
      description,
      className,
      classLevel,
      exam
    } = req.body;

    const subject =
      await resolveSubjectForNavta({
        subjectId,
        subjectName
      });

    if (!subject) {
      return res.status(400).json({
        success: false,

        message:
          'Please provide a valid subject.'
      });
    }

    if (!cleanString(title)) {
      return res.status(400).json({
        success: false,

        message:
          'Chapter title is required.'
      });
    }

    const existingChapter =
      await resolveChapterForNavta({
        chapterId: '',

        chapterName:
          title,

        subject,

        className:
          className ||
          classLevel,

        exam,

        chapterNumber
      });

    if (
      existingChapter &&
      cleanString(description) &&
      Chapter.schema.path('description') &&
      !cleanString(
        existingChapter.description
      )
    ) {
      existingChapter.description =
        cleanString(description);

      await existingChapter.save();
    }

    return res.status(201).json({
      success: true,

      data:
        existingChapter
    });
  } catch (error) {
    console.error(
      'CREATE CHAPTER ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};

// =====================================================
// CREATE NOTE
// =====================================================
//
// AdminDashboard can send:
//
// chapterId
// chapterName
// subjectId
// subjectName
// exam
// className
// title
// content
// pdf OR pdfUrl
//
// NAVTA-generated chapter IDs are NOT assumed to be
// MongoDB ObjectIds.
//
// =====================================================

exports.createNote = async (req, res) => {
  try {
    const {
      chapterId,
      chapterName,
      subjectId,
      subjectName,
      exam,
      className,
      classLevel,
      chapterNumber,
      title,
      content,
      pdfUrl
    } = req.body;

    // -----------------------------------------
    // Validate title
    // -----------------------------------------

    if (!cleanString(title)) {
      return res.status(400).json({
        success: false,

        message:
          'Study Note title is required.'
      });
    }

    // -----------------------------------------
    // Validate content
    // -----------------------------------------

    if (!cleanString(content)) {
      return res.status(400).json({
        success: false,

        message:
          'Study Note content is required.'
      });
    }

    // -----------------------------------------
    // 1. Try genuine MongoDB chapter ID
    // -----------------------------------------

    let chapter = null;

    if (isMongoObjectId(chapterId)) {
      chapter =
        await Chapter.findById(
          chapterId
        );
    }

    // -----------------------------------------
    // 2. Resolve NAVTA master chapter
    // -----------------------------------------

    if (!chapter) {
      const subject =
        await resolveSubjectForNavta({
          subjectId,
          subjectName
        });

      if (!subject) {
        return res.status(400).json({
          success: false,

          message:
            'Subject could not be resolved for this Study Note.'
        });
      }

      chapter =
        await resolveChapterForNavta({
          chapterId,

          chapterName,

          subject,

          className:
            className ||
            classLevel,

          exam,

          chapterNumber
        });
    }

    if (!chapter) {
      return res.status(400).json({
        success: false,

        message:
          'Chapter could not be resolved. Please select the chapter again.'
      });
    }

    // -----------------------------------------
    // 3. Resolve PDF
    // -----------------------------------------

    const uploadedPdfUrl =
      cleanString(pdfUrl) ||

      cleanString(
        req.file?.secure_url
      ) ||

      cleanString(
        req.file?.url
      ) ||

      cleanString(
        req.file?.location
      ) ||

      cleanString(
        req.file?.path
      ) ||

      cleanString(
        req.file?.filename
      );

    // -----------------------------------------
    // Create Study Note
    // -----------------------------------------

    const notePayload = {
      chapter:
        chapter._id,

      title:
        cleanString(title),

      content:
        cleanString(content),

      pdfUrl:
        uploadedPdfUrl,

      uploadedBy:
        req.user?.id ||
        req.user?._id
    };

    const note =
      await Note.create(
        notePayload
      );

    console.log(
      'NAVTA STUDY NOTE CREATED:',
      {
        noteId:
          String(note._id),

        chapterId:
          String(chapter._id),

        chapter:
          chapter.title,

        subject:
          subjectName || '',

        className:
          className ||
          classLevel ||
          '',

        exam:
          exam || ''
      }
    );

    return res.status(201).json({
      success: true,

      message:
        'Study Note uploaded successfully.',

      data:
        note,

      resolvedChapter: {
        _id:
          chapter._id,

        title:
          chapter.title,

        chapterNumber:
          chapter.chapterNumber
      }
    });
  } catch (error) {
    console.error(
      'CREATE NOTE ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to create Study Note.'
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

    const pyq =
      await PYQ.create({
        subject:
          subjectId,

        chapter:
          chapterId || null,

        year,

        examName,

        title,

        pdfUrl,

        uploadedBy:
          req.user.id
      });

    return res.status(201).json({
      success: true,

      data:
        pyq
    });
  } catch (error) {
    console.error(
      'CREATE PYQ ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
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

    const questionIds = [];

    for (const item of questions) {
      const question =
        await Question.create({
          subject:
            subjectId,

          chapter:
            chapterId || null,

          questionType:
            item.questionType ||
            'mcq',

          text:
            item.text,

          options:
            item.options || [],

          correctOption:
            item.correctOption,

          correctAnswer:
            item.correctAnswer,

          explanation:
            item.explanation || '',

          difficulty:
            item.difficulty ||
            'medium'
        });

      questionIds.push(
        question._id
      );
    }

    const test =
      await Test.create({
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

      data:
        test
    });
  } catch (error) {
    console.error(
      'CREATE TEST ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};
// =====================================================
// TEACHER / ADMIN STUDENT METRICS
// =====================================================

exports.getStudentMetrics = async (req, res) => {
  try {
    const students =
      await Student.find({})
        .populate(
          'user',
          'name email'
        )
        .lean();

    const results =
      await Result.find({})
        .populate(
          'test',
          'title subject chapter'
        )
        .lean();

    const studentMetrics =
      students.map((student) => {
        const studentId =
          String(
            student._id
          );

        const studentResults =
          results.filter(
            (result) =>
              String(
                result.student
              ) === studentId
          );

        const totalTests =
          studentResults.length;

        const totalScore =
          studentResults.reduce(
            (
              sum,
              result
            ) => {
              const percentage =
                Number(
                  result.percentage ??
                  result.score ??
                  0
                );

              return (
                sum +
                (
                  Number.isFinite(
                    percentage
                  )
                    ? percentage
                    : 0
                )
              );
            },
            0
          );

        const averageScore =
          totalTests > 0
            ? Number(
                (
                  totalScore /
                  totalTests
                ).toFixed(2)
              )
            : 0;

        return {
          studentId:
            student._id,

          name:
            student.user?.name ||
            student.name ||
            'Student',

          email:
            student.user?.email ||
            student.email ||
            '',

          totalTests,

          averageScore,

          results:
            studentResults
        };
      });

    return res.status(200).json({
      success: true,

      count:
        studentMetrics.length,

      data:
        studentMetrics
    });
  } catch (error) {
    console.error(
      'GET STUDENT METRICS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to load student metrics.'
    });
  }
};


// =====================================================
// GET ALL QUESTIONS
// =====================================================

exports.getQuestions = async (req, res) => {
  try {
    const {
      subject,
      chapter,
      difficulty,
      questionType
    } = req.query;

    const query = {};

    if (subject) {
      query.subject =
        subject;
    }

    if (chapter) {
      query.chapter =
        chapter;
    }

    if (difficulty) {
      query.difficulty =
        difficulty;
    }

    if (questionType) {
      query.questionType =
        questionType;
    }

    const questions =
      await Question.find(query)
        .populate(
          'subject',
          'name'
        )
        .populate(
          'chapter',
          'title chapterNumber'
        )
        .sort({
          createdAt: -1
        });

    return res.status(200).json({
      success: true,

      count:
        questions.length,

      data:
        questions
    });
  } catch (error) {
    console.error(
      'GET QUESTIONS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};


// =====================================================
// CREATE SINGLE QUESTION
// =====================================================

exports.createQuestion = async (req, res) => {
  try {
    const {
      subjectId,
      chapterId,
      questionType,
      text,
      options,
      correctOption,
      correctAnswer,
      explanation,
      difficulty
    } = req.body;

    if (!subjectId) {
      return res.status(400).json({
        success: false,

        message:
          'Subject is required.'
      });
    }

    if (!cleanString(text)) {
      return res.status(400).json({
        success: false,

        message:
          'Question text is required.'
      });
    }

    const question =
      await Question.create({
        subject:
          subjectId,

        chapter:
          chapterId || null,

        questionType:
          questionType ||
          'mcq',

        text:
          cleanString(text),

        options:
          Array.isArray(options)
            ? options
            : [],

        correctOption:
          correctOption,

        correctAnswer:
          correctAnswer,

        explanation:
          cleanString(
            explanation
          ),

        difficulty:
          difficulty ||
          'medium'
      });

    return res.status(201).json({
      success: true,

      message:
        'Question created successfully.',

      data:
        question
    });
  } catch (error) {
    console.error(
      'CREATE QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};


// =====================================================
// DELETE QUESTION
// =====================================================

exports.deleteQuestion = async (req, res) => {
  try {
    const {
      questionId
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        questionId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Invalid question ID.'
      });
    }

    const question =
      await Question.findById(
        questionId
      );

    if (!question) {
      return res.status(404).json({
        success: false,

        message:
          'Question not found.'
      });
    }

    await question.deleteOne();

    return res.status(200).json({
      success: true,

      message:
        'Question deleted successfully.'
    });
  } catch (error) {
    console.error(
      'DELETE QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};


// =====================================================
// NAVTA TEST QUESTION BANK
// =====================================================
//
// IMPORTANT:
//
// NAVTA TEST uses NavtaQuestion.
//
// This is intentionally kept separate from the older
// generic Question model.
//
// =====================================================


// =====================================================
// GET NAVTA TEST QUESTIONS
// =====================================================

exports.getNavtaQuestions = async (req, res) => {
  try {
    const {
      subject,
      preparation,
      exam,
      classLevel,
      className,
      chapter,
      difficulty,
      questionType,
      active
    } = req.query;

    const query = {};

    if (subject) {
      query.subject =
        subject;
    }

    if (
      preparation ||
      exam
    ) {
      query.preparation =
        preparation ||
        exam;
    }

    if (
      classLevel ||
      className
    ) {
      query.classLevel =
        classLevel ||
        className;
    }

    if (chapter) {
      query.chapter =
        chapter;
    }

    if (difficulty) {
      query.difficulty =
        difficulty;
    }

    if (questionType) {
      query.questionType =
        questionType;
    }

    if (
      active !== undefined
    ) {
      query.active =
        String(active) !==
        'false';
    }

    const questions =
      await NavtaQuestion
        .find(query)
        .sort({
          createdAt: -1
        })
        .lean();

    return res.status(200).json({
      success: true,

      count:
        questions.length,

      questions,

      data:
        questions
    });
  } catch (error) {
    console.error(
      'GET NAVTA QUESTIONS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to load NAVTA TEST questions.'
    });
  }
};


// =====================================================
// GET ONE NAVTA TEST QUESTION
// =====================================================

exports.getNavtaQuestion = async (req, res) => {
  try {
    const questionId =
      req.params.questionId ||
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        questionId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Invalid NAVTA question ID.'
      });
    }

    const question =
      await NavtaQuestion.findById(
        questionId
      );

    if (!question) {
      return res.status(404).json({
        success: false,

        message:
          'NAVTA TEST question not found.'
      });
    }

    return res.status(200).json({
      success: true,

      question,

      data:
        question
    });
  } catch (error) {
    console.error(
      'GET NAVTA QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};


// =====================================================
// CREATE NAVTA TEST QUESTION
// =====================================================

exports.createNavtaQuestion = async (req, res) => {
  try {
    const {
      question,
      text,
      subject,
      preparation,
      exam,
      classLevel,
      className,
      chapter,
      difficulty,
      questionType,
      options,
      correctAnswer,
      correctOption,
      explanation,
      modelAnswer,
      keyPoints,
      maxMarks,
      questionImage,
      questionBoundingBox,
      sourcePage,
      hasVisual,
      visualDescription,
      visualBoundingBox,
      active
    } = req.body;

    const visibleQuestion =
      cleanString(
        question ||
        text
      );

    if (!visibleQuestion) {
      return res.status(400).json({
        success: false,

        message:
          'Question text is required.'
      });
    }

    if (!cleanString(subject)) {
      return res.status(400).json({
        success: false,

        message:
          'Subject is required.'
      });
    }

    if (!cleanString(chapter)) {
      return res.status(400).json({
        success: false,

        message:
          'Chapter is required.'
      });
    }

    const payload = {
      question:
        visibleQuestion,

      subject:
        cleanString(subject),

      preparation:
        cleanString(
          preparation ||
          exam
        ),

      classLevel:
        normalizeClassName(
          classLevel ||
          className
        ),

      chapter:
        cleanString(chapter),

      difficulty:
        cleanString(
          difficulty
        ) ||
        'Medium',

      questionType:
        cleanString(
          questionType
        ) ||
        'mcq',

      options:
        Array.isArray(options)
          ? options
          : [],

      correctAnswer:
        correctAnswer ??
        correctOption ??
        null,

      explanation:
        cleanString(
          explanation
        ),

      modelAnswer:
        cleanString(
          modelAnswer
        ),

      keyPoints:
        Array.isArray(keyPoints)
          ? keyPoints
          : [],

      maxMarks:
        maxMarks ?? null,

      questionImage:
        cleanString(
          questionImage
        ),

      questionBoundingBox:
        questionBoundingBox ||
        null,

      sourcePage:
        sourcePage ?? null,

      hasVisual:
        Boolean(
          hasVisual
        ),

      visualDescription:
        cleanString(
          visualDescription
        ),

      visualBoundingBox:
        visualBoundingBox ||
        null,

      active:
        active !== false
    };

    // -----------------------------------------
    // Remove properties not present in schema
    // -----------------------------------------

    Object.keys(payload).forEach(
      (key) => {
        if (
          !NavtaQuestion.schema.path(
            key
          )
        ) {
          delete payload[key];
        }
      }
    );

    const navtaQuestion =
      await NavtaQuestion.create(
        payload
      );

    return res.status(201).json({
      success: true,

      message:
        'NAVTA TEST question created successfully.',

      question:
        navtaQuestion,

      data:
        navtaQuestion
    });
  } catch (error) {
    console.error(
      'CREATE NAVTA QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to create NAVTA TEST question.'
    });
  }
};


// =====================================================
// UPDATE NAVTA TEST QUESTION
// =====================================================

exports.updateNavtaQuestion = async (req, res) => {
  try {
    const questionId =
      req.params.questionId ||
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        questionId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Invalid NAVTA question ID.'
      });
    }

    const question =
      await NavtaQuestion.findById(
        questionId
      );

    if (!question) {
      return res.status(404).json({
        success: false,

        message:
          'NAVTA TEST question not found.'
      });
    }

    const allowedFields = [
      'question',
      'subject',
      'preparation',
      'classLevel',
      'chapter',
      'difficulty',
      'questionType',
      'options',
      'correctAnswer',
      'explanation',
      'modelAnswer',
      'keyPoints',
      'maxMarks',
      'questionImage',
      'questionBoundingBox',
      'sourcePage',
      'hasVisual',
      'visualDescription',
      'visualBoundingBox',
      'active'
    ];

    for (
      const field of
      allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        if (
          NavtaQuestion.schema.path(
            field
          )
        ) {
          question[field] =
            req.body[field];
        }
      }
    }

    if (
      req.body.exam !==
        undefined &&
      NavtaQuestion.schema.path(
        'preparation'
      )
    ) {
      question.preparation =
        cleanString(
          req.body.exam
        );
    }

    if (
      req.body.className !==
        undefined &&
      NavtaQuestion.schema.path(
        'classLevel'
      )
    ) {
      question.classLevel =
        normalizeClassName(
          req.body.className
        );
    }

    const savedQuestion =
      await question.save();

    return res.status(200).json({
      success: true,

      message:
        'NAVTA TEST question updated successfully.',

      question:
        savedQuestion,

      data:
        savedQuestion
    });
  } catch (error) {
    console.error(
      'UPDATE NAVTA QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to update NAVTA TEST question.'
    });
  }
};


// =====================================================
// DELETE NAVTA TEST QUESTION
// =====================================================

exports.deleteNavtaQuestion = async (req, res) => {
  try {
    const questionId =
      req.params.questionId ||
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        questionId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Invalid NAVTA question ID.'
      });
    }

    const question =
      await NavtaQuestion.findById(
        questionId
      );

    if (!question) {
      return res.status(404).json({
        success: false,

        message:
          'NAVTA TEST question not found.'
      });
    }

    await question.deleteOne();

    return res.status(200).json({
      success: true,

      message:
        'NAVTA TEST question permanently deleted.'
    });
  } catch (error) {
    console.error(
      'DELETE NAVTA QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to delete NAVTA TEST question.'
    });
  }
};


// =====================================================
// NAVTA TEST CHAPTER DISCOVERY
// =====================================================
//
// This endpoint can be used to obtain chapters that
// already exist in the NAVTA TEST question bank.
//
// It is useful for keeping Study Notes and NAVTA TEST
// chapter selections synchronized.
//
// =====================================================

exports.getNavtaTestChapters = async (req, res) => {
  try {
    const {
      subject,
      preparation,
      exam,
      classLevel,
      className
    } = req.query;

    const query = {};

    if (subject) {
      query.subject =
        cleanString(subject);
    }

    if (
      preparation ||
      exam
    ) {
      query.preparation =
        cleanString(
          preparation ||
          exam
        );
    }

    if (
      classLevel ||
      className
    ) {
      query.classLevel =
        normalizeClassName(
          classLevel ||
          className
        );
    }

    const questions =
      await NavtaQuestion
        .find(query)
        .select(
          'subject preparation classLevel chapter'
        )
        .lean();

    const chapterMap =
      new Map();

    for (
      const question of
      questions
    ) {
      const chapter =
        cleanString(
          question.chapter
        );

      if (!chapter) {
        continue;
      }

      const item = {
        subject:
          cleanString(
            question.subject
          ),

        preparation:
          cleanString(
            question.preparation
          ),

        classLevel:
          cleanString(
            question.classLevel
          ),

        chapter
      };

      const key =
        [
          item.subject,
          item.preparation,
          item.classLevel,
          item.chapter
        ]
          .map(
            (value) =>
              value.toLowerCase()
          )
          .join('|');

      if (
        !chapterMap.has(key)
      ) {
        chapterMap.set(
          key,
          item
        );
      }
    }

    const chapters =
      Array.from(
        chapterMap.values()
      ).sort(
        (
          first,
          second
        ) =>
          first.chapter.localeCompare(
            second.chapter
          )
      );

    return res.status(200).json({
      success: true,

      count:
        chapters.length,

      chapters,

      data:
        chapters
    });
  } catch (error) {
    console.error(
      'GET NAVTA TEST CHAPTERS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to load NAVTA TEST chapters.'
    });
  }
};


// =====================================================
// END OF teacherController.js
// =====================================================
