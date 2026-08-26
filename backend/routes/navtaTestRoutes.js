const express = require("express");

const router = express.Router();

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

const {
  createQuestion,
  getQuestions,
  deleteQuestion,
  generateTest,
  evaluateWrittenAnswer,

  // NEW AI IMPORT FUNCTIONS
  importQuestionsWithAI,
  confirmAIImport,
} = require("../controllers/navtaTestController");

// ============================================
// FILE UPLOAD MIDDLEWARE
// ============================================

const navtaQuestionUpload =
  require("../middleware/navtaQuestionUpload");

// ============================================
// ADMIN - CREATE NAVTA TEST QUESTION
// MANUAL QUESTION ENTRY
// ============================================

router.post(
  "/questions",
  createQuestion
);

// ============================================
// ADMIN - AI QUESTION FILE IMPORT
//
// Accepts:
// PDF
// DOCX
// TXT
//
// IMPORTANT:
// This route only analyses the file.
// It DOES NOT save questions yet.
//
// Form-data field name must be:
//
// file
//
// Optional fields:
// subject
// exam
// classLevel
// ============================================

router.post(
  "/import",

  navtaQuestionUpload.single(
    "file"
  ),

  importQuestionsWithAI
);

// ============================================
// ADMIN - CONFIRM AI IMPORT
//
// Admin reviews accepted questions first.
// Only approved questions are sent here.
//
// Expected body:
//
// {
//   questions: [
//     {...},
//     {...}
//   ]
// }
//
// Approved questions are then stored in:
//
// NavtaQuestion
//
// After that they automatically become
// available in:
//
// Student Navta TEST
// Teacher Paper Builder
// ============================================

router.post(
  "/import/confirm",
  confirmAIImport
);

// ============================================
// STUDENT - GENERATE NAVTA TEST
// ============================================

router.post(
  "/generate",
  generateTest
);

// ============================================
// STUDENT - AI EVALUATE WRITTEN ANSWER
// BOARDS SHORT / LONG ANSWERS ONLY
// ============================================

router.post(
  "/evaluate-answer",
  evaluateWrittenAnswer
);

// ============================================
// ADMIN - GET NAVTA TEST QUESTIONS
// ============================================

router.get(
  "/questions",
  getQuestions
);

// ============================================
// ADMIN - DELETE NAVTA TEST QUESTION
// ============================================

router.delete(
  "/questions/:id",
  deleteQuestion
);

// ============================================
// EXPORT ROUTER
// ============================================

module.exports = router;
