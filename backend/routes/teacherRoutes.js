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
// SAFETY CHECK
// =====================================================
//
// This gives a clear startup error if teacherController
// is missing one of the functions required below.
//
// =====================================================

const requiredTeacherControllers = {
  createChapter,
  createNote,
  createPYQ,
  createTest,
  getStudentMetrics,
  getQuestionBank
};

for (const [name, handler] of Object.entries(
  requiredTeacherControllers
)) {
  if (typeof handler !== 'function') {
    throw new Error(
      `teacherRoutes.js: teacherController.${name} is missing or is not exported correctly.`
    );
  }
}


// =====================================================
// SAFETY CHECK - ADMIN CONTROLLER
// =====================================================

const requiredAdminControllers = {
  getQuestions,
  createQuestion,
  deleteQuestion
};

for (const [name, handler] of Object.entries(
  requiredAdminControllers
)) {
  if (typeof handler !== 'function') {
    throw new Error(
      `teacherRoutes.js: adminController.${name} is missing or is not exported correctly.`
    );
  }
}


// =====================================================
// LOGIN REQUIRED FOR ALL TEACHER ROUTES
// =====================================================

router.use(protect);


// =====================================================
// NAVTA QUESTION BANK / PAPER BUILDER
// =====================================================
//
// Reads questions directly from the NAVTA Test
// question bank.
//
// Available to:
// - Teacher
// - External Teacher
// - Admin
//
// Example:
//
// GET /api/teacher/question-bank
//
// GET /api/teacher/question-bank
//   ?subject=Physics
//   &exam=JEE
//   &classLevel=Class%2012
//
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
// GENERAL QUESTION BANK
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


// =====================================================
// CREATE GENERAL QUESTION
// =====================================================

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


// =====================================================
// CREATE / RESOLVE CHAPTER
// =====================================================
//
// Used by Study Notes.
//
// Your updated teacherController can resolve NAVTA Test
// chapter names and create/find the corresponding
// MongoDB Chapter.
//
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
// CREATE STUDY NOTE
// =====================================================
//
// Expected body can contain:
//
// title
// content
// chapterId
// chapterName
// subjectId
// subjectName
// exam
// className
// classLevel
// chapterNumber
// pdfUrl
//
// NAVTA Test chapter names can therefore be resolved by
// teacherController instead of requiring the frontend
// to already have a MongoDB Chapter ObjectId.
//
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
// CREATE PYQ
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
// CREATE TEST
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
// ROUTER
// =====================================================

module.exports = router;
