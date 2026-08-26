const express =
  require('express');

const {
  protect,
  authorizeRoles
} = require(
  '../middleware/auth'
);

const {
  createChapter,
  createNote,
  createPYQ,
  createTest,
  getStudentMetrics,
  getQuestionBank
} = require(
  '../controllers/teacherController'
);

const {
  getQuestions,
  createQuestion,
  deleteQuestion
} = require(
  '../controllers/adminController'
);

const router =
  express.Router();

// =====================================================
// LOGIN REQUIRED
// =====================================================

router.use(protect);

// =====================================================
// PAPER BUILDER
//
// Must remain ABOVE any stricter teacher-only middleware.
// Teacher + External Teacher + Admin can read NavtaQuestion.
// =====================================================

router.get(
  '/question-bank',

  authorizeRoles(
    'teacher',
    'external_teacher',
    'admin'
  ),

  getQuestionBank
);

// =====================================================
// EXISTING GENERAL QUESTION BANK
// =====================================================

router.get(
  '/questions',

  authorizeRoles(
    'teacher',
    'external_teacher',
    'admin'
  ),

  getQuestions
);

router.post(
  '/questions',

  authorizeRoles(
    'teacher',
    'external_teacher',
    'admin'
  ),

  createQuestion
);

// =====================================================
// CHAPTER
// =====================================================

router.post(
  '/chapters',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createChapter
);

// =====================================================
// NOTES
// =====================================================

router.post(
  '/notes',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createNote
);

// =====================================================
// PYQ
// =====================================================

router.post(
  '/pyqs',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createPYQ
);

// =====================================================
// TEST
// =====================================================

router.post(
  '/tests',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createTest
);

// =====================================================
// STUDENT METRICS
// =====================================================

router.get(
  '/student-metrics',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  getStudentMetrics
);

// =====================================================
// DELETE GENERAL QUESTION
// =====================================================

router.delete(
  '/questions/:id',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  deleteQuestion
);

module.exports =
  router;
