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
// ALL TEACHER ROUTES REQUIRE LOGIN
// =====================================================

router.use(protect);

// =====================================================
// NAVTA QUESTION PAPER BUILDER QUESTION BANK
//
// IMPORTANT:
// This reads directly from the same NavtaQuestion
// collection used by the Admin Navta TEST portal.
//
// Teacher
// External Teacher
// Admin
// can all VIEW it.
// =====================================================

router.get(
  '/question-bank',

  authorizeRoles(
    'teacher',
    'admin',
    'external_teacher'
  ),

  getQuestionBank
);

// =====================================================
// EXISTING GENERAL QUESTIONS
// =====================================================

router.get(
  '/questions',

  authorizeRoles(
    'teacher',
    'admin',
    'external_teacher'
  ),

  getQuestions
);

router.post(
  '/questions',

  authorizeRoles(
    'teacher',
    'admin',
    'external_teacher'
  ),

  createQuestion
);

// =====================================================
// TEACHER / ADMIN CONTENT MANAGEMENT
// =====================================================

router.post(
  '/chapters',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createChapter
);

router.post(
  '/notes',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createNote
);

router.post(
  '/pyqs',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createPYQ
);

router.post(
  '/tests',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createTest
);

// =====================================================
// STUDENT PERFORMANCE METRICS
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
//
// Keep your existing behavior:
// Teacher/Admin can delete questions from the older
// general Question collection.
//
// This DOES NOT delete questions from NavtaQuestion.
// =====================================================

router.delete(
  '/questions/:id',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  deleteQuestion
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
