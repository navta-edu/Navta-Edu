const mongoose = require('mongoose');

const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Test = require('../models/Test');
const Question = require('../models/Question');


// =====================================================
// HELPERS
// =====================================================

const cleanString = (value = '') => {
  return String(value ?? '').trim();
};

const isObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(
    cleanString(value)
  );
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


const normalizeClassName = (
  value = ''
) => {
  const raw =
    cleanString(value);

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


const normalizePreparationName = (
  value = ''
) => {
  const raw =
    cleanString(value);

  const lower =
    raw.toLowerCase();

  if (
    lower === 'jee' ||
    lower === 'jee main' ||
    lower === 'jee mains' ||
    lower === 'jee advanced'
  ) {
    return 'JEE';
  }

  if (lower === 'neet') {
    return 'NEET';
  }

  if (
    lower === 'boards' ||
    lower === 'board' ||
    lower === 'cbse'
  ) {
    return 'Boards';
  }

  return raw;
};


// =====================================================
// GET ALL SUBJECTS
// =====================================================
//
// GET /api/content/subjects
//
// =====================================================

exports.getSubjects = async (req, res) => {
  try {
    const subjects =
      await Subject.find({})
        .sort({
          name: 1
        });

    return res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });

  } catch (err) {
    console.error(
      'GET SUBJECTS ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        'Failed to load subjects.'
    });
  }
};


// =====================================================
// GET CHAPTERS BY SUBJECT
// =====================================================
//
// GET /api/content/subjects/:subjectId/chapters
//
// Supports:
//
// real MongoDB Subject ObjectId
//
// and fallback subjectName query:
//
// /chapters?subjectName=Maths
//
// =====================================================

exports.getChapters = async (req, res) => {
  try {
    const subjectId =
      cleanString(
        req.params.subjectId
      );

    const requestedSubjectName =
      normalizeSubjectName(
        req.query.subjectName
      );

    let subject = null;

    // -------------------------------------------------
    // 1. Try real MongoDB ObjectId
    // -------------------------------------------------

    if (isObjectId(subjectId)) {
      subject =
        await Subject.findById(
          subjectId
        );
    }

    // -------------------------------------------------
    // 2. Try subject by name
    // -------------------------------------------------

    if (
      !subject &&
      requestedSubjectName
    ) {
      subject =
        await Subject.findOne({
          name: new RegExp(
            `^${escapeRegex(
              requestedSubjectName
            )}$`,
            'i'
          )
        });

      // Maths / Mathematics compatibility
      if (
        !subject &&
        requestedSubjectName ===
          'Maths'
      ) {
        subject =
          await Subject.findOne({
            name: /^Mathematics$/i
          });
      }
    }

    // -------------------------------------------------
    // 3. Subject not found
    // -------------------------------------------------

    if (!subject) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // -------------------------------------------------
    // 4. Build chapter query
    // -------------------------------------------------

    const chapterQuery = {
      subject: subject._id
    };

    const className =
      cleanString(
        req.query.className ||
        req.query.classLevel
      );

    const exam =
      cleanString(
        req.query.exam
      );

    // Only filter if those fields actually exist
    // in your Chapter schema.

    if (
      className &&
      Chapter.schema.path(
        'className'
      )
    ) {
      chapterQuery.className =
        className;
    }

    if (
      className &&
      Chapter.schema.path(
        'classLevel'
      )
    ) {
      chapterQuery.classLevel =
        className;
    }

    if (
      exam &&
      Chapter.schema.path(
        'exam'
      )
    ) {
      chapterQuery.exam =
        exam;
    }

    // -------------------------------------------------
    // 5. Load chapters
    // -------------------------------------------------

    const chapters =
      await Chapter.find(
        chapterQuery
      )
        .sort({
          chapterNumber: 1,
          title: 1
        })
        .lean();

    console.log(
      'NAVTA CONTENT CHAPTERS:',
      {
        requestedSubjectId:
          subjectId,

        subject:
          subject.name,

        subjectId:
          String(
            subject._id
          ),

        count:
          chapters.length,

        className,

        exam
      }
    );

    return res.status(200).json({
      success: true,
      count: chapters.length,
      data: chapters
    });

  } catch (err) {
    console.error(
      'GET CHAPTERS ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        'Failed to load chapters.'
    });
  }
};


// =====================================================
// GET NOTES BY CHAPTER
// =====================================================
//
// GET /api/content/chapters/:chapterId/notes
//
// Primary mode:
//
// real MongoDB Chapter ObjectId
//
// Fallback:
//
// chapterName + subjectName + className
//
// =====================================================

exports.getNotes = async (req, res) => {
  try {
    const chapterId =
      cleanString(
        req.params.chapterId
      );

    const requestedChapterName =
      cleanString(
        req.query.chapterName
      );

    const requestedSubjectName =
      normalizeSubjectName(
        req.query.subjectName
      );

    const requestedClassName =
      normalizeClassName(
        req.query.className ||
        req.query.classLevel
      );

    const requestedPreparation =
      normalizePreparationName(
        req.query.exam ||
        req.query.preparation
      );

    // -------------------------------------------------
    // SAFETY:
    // Study Notes must be separated by preparation.
    // If the Note model has not been upgraded yet,
    // do not silently return every PDF.
    // -------------------------------------------------

    if (
      requestedPreparation &&
      !Note.schema.path(
        'exam'
      )
    ) {
      return res.status(500).json({
        success: false,
        message:
          'Note model is missing the exam field. Update Note.js so Study Notes can be separated into NEET, JEE and Boards.'
      });
    }

    let chapter = null;

    // -------------------------------------------------
    // 1. Try real MongoDB chapter ObjectId
    // -------------------------------------------------

    if (isObjectId(chapterId)) {
      chapter =
        await Chapter.findById(
          chapterId
        );
    }

    // -------------------------------------------------
    // 2. Fallback by NAVTA metadata
    // -------------------------------------------------

    if (
      !chapter &&
      requestedChapterName &&
      requestedSubjectName
    ) {
      let subject =
        await Subject.findOne({
          name:
            new RegExp(
              `^${escapeRegex(
                requestedSubjectName
              )}$`,
              'i'
            )
        });

      if (
        !subject &&
        requestedSubjectName ===
          'Maths'
      ) {
        subject =
          await Subject.findOne({
            name:
              /^Mathematics$/i
          });
      }

      if (subject) {
        const chapterQuery = {
          subject:
            subject._id,

          title:
            new RegExp(
              `^${escapeRegex(
                requestedChapterName
              )}$`,
              'i'
            )
        };

        if (
          requestedClassName &&
          Chapter.schema.path(
            'className'
          )
        ) {
          chapterQuery.className =
            requestedClassName;
        }

        if (
          requestedClassName &&
          Chapter.schema.path(
            'classLevel'
          )
        ) {
          chapterQuery.classLevel =
            requestedClassName;
        }

        chapter =
          await Chapter.findOne(
            chapterQuery
          );
      }
    }

    // -------------------------------------------------
    // 3. Chapter not found
    // -------------------------------------------------

    if (!chapter) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // -------------------------------------------------
    // 4. Build STRICT Study Note filter
    // -------------------------------------------------

    const noteQuery = {
      chapter:
        chapter._id
    };

    // This is the critical filter that keeps Boards,
    // JEE and NEET PDFs in their own preparation section.
    if (requestedPreparation) {
      noteQuery.exam =
        requestedPreparation;
    }

    if (
      requestedClassName &&
      Note.schema.path(
        'className'
      )
    ) {
      noteQuery.className =
        requestedClassName;
    }

    if (
      requestedSubjectName &&
      Note.schema.path(
        'subjectName'
      )
    ) {
      noteQuery.subjectName =
        new RegExp(
          `^${escapeRegex(
            requestedSubjectName
          )}$`,
          'i'
        );
    }

    if (
      requestedChapterName &&
      Note.schema.path(
        'chapterName'
      )
    ) {
      noteQuery.chapterName =
        new RegExp(
          `^${escapeRegex(
            requestedChapterName
          )}$`,
          'i'
        );
    }

    // -------------------------------------------------
    // 5. Find ONLY notes for this exact preparation
    // -------------------------------------------------

    const notes =
      await Note.find(
        noteQuery
      )
        .populate(
          'uploadedBy',
          'name email'
        )
        .populate(
          'chapter',
          'title chapterNumber'
        )
        .sort({
          createdAt: -1
        })
        .lean();

    console.log(
      'NAVTA CONTENT NOTES:',
      {
        chapterId:
          String(
            chapter._id
          ),

        chapter:
          chapter.title,

        subject:
          requestedSubjectName,

        className:
          requestedClassName,

        preparation:
          requestedPreparation,

        count:
          notes.length
      }
    );

    return res.status(200).json({
      success: true,
      count: notes.length,
      preparation:
        requestedPreparation,
      data: notes
    });

  } catch (err) {
    console.error(
      'GET NOTES ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        'Failed to load Study Notes.'
    });
  }
};


// =====================================================
// GET PYQS BY SUBJECT
// =====================================================
//
// GET /api/content/subjects/:subjectId/pyqs
//
// =====================================================

exports.getPYQs = async (req, res) => {
  try {
    const subjectId =
      cleanString(
        req.params.subjectId
      );

    if (!isObjectId(subjectId)) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const pyqs =
      await PYQ.find({
        subject:
          subjectId
      })
        .populate(
          'chapter',
          'title chapterNumber'
        )
        .sort({
          year: -1,
          createdAt: -1
        });

    return res.status(200).json({
      success: true,
      count: pyqs.length,
      data: pyqs
    });

  } catch (err) {
    console.error(
      'GET PYQS ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        'Failed to load PYQs.'
    });
  }
};


// =====================================================
// GET TESTS BY SUBJECT
// =====================================================
//
// GET /api/content/subjects/:subjectId/tests
//
// =====================================================

exports.getTests = async (req, res) => {
  try {
    const subjectId =
      cleanString(
        req.params.subjectId
      );

    if (!isObjectId(subjectId)) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const query = {
      subject:
        subjectId
    };

    if (
      req.query.chapterId &&
      isObjectId(
        req.query.chapterId
      )
    ) {
      query.chapter =
        req.query.chapterId;
    }

    const tests =
      await Test.find(query)
        .populate(
          'chapter',
          'title chapterNumber'
        );

    return res.status(200).json({
      success: true,
      count: tests.length,
      data: tests
    });

  } catch (err) {
    console.error(
      'GET TESTS ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        'Failed to load tests.'
    });
  }
};


// =====================================================
// GET TEST DETAIL
// =====================================================
//
// GET /api/content/tests/:testId
//
// =====================================================

exports.getTestDetail = async (req, res) => {
  try {
    const testId =
      cleanString(
        req.params.testId
      );

    if (!isObjectId(testId)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid test ID.'
      });
    }

    const test =
      await Test.findById(
        testId
      )
        .populate(
          'questions'
        )
        .populate(
          'chapter',
          'title chapterNumber'
        )
        .populate(
          'subject',
          'name'
        );

    if (!test) {
      return res.status(404).json({
        success: false,
        message:
          'Test not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: test
    });

  } catch (err) {
    console.error(
      'GET TEST DETAIL ERROR:',
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        'Failed to load test.'
    });
  }
};
