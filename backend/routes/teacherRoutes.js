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
// ALL ROUTES REQUIRE LOGIN
// =====================================================

router.use(protect);

// =====================================================
// NAVTA TEST QUESTION BANK
// FOR PAPER BUILDER
//
// Reads directly from NavtaQuestion collection.
// Questions uploaded through Admin -> Navta TEST
// automatically appear here.
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
// CONTENT MANAGEMENT
// TEACHER + ADMIN
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
// STUDENT PERFORMANCE
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
// IMPORTANT:
// This deletes from the older Question collection.
// It does NOT delete NavtaQuestion admin-bank questions.
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

module.exports =
  router;
