const express = require('express');

const {
  protect,
  authorizeRoles
} = require('../middleware/auth');

const {
  createChapter,
  createNote,
  createPYQ,
  createTest,
  getStudentMetrics,
  getQuestionBank
} = require('../controllers/teacherController');

const {
  getQuestions,
  createQuestion,
  deleteQuestion
} = require('../controllers/adminController');

const router = express.Router();

// =====================================================
// ALL TEACHER ROUTES REQUIRE LOGIN
// =====================================================

router.use(protect);

// =====================================================
// NAVTA TEST -> PAPER BUILDER QUESTION BANK
//
// IMPORTANT:
// teacher + external_teacher + admin can access it
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
// EXISTING QUESTION MANAGEMENT
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
// CHAPTERS
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
// PYQS
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
// TESTS
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
// DELETE EXISTING QUESTION
// =====================================================

router.delete(
  '/questions/:id',
  authorizeRoles(
    'teacher',
    'admin'
  ),
  deleteQuestion
);

module.exports = router;
