const express = require("express");

const router = express.Router();

const {
  createQuestion,
  getQuestions,
  deleteQuestion,
  generateTest,
  evaluateWrittenAnswer,
} = require("../controllers/navtaTestController");

// ============================================
// ADMIN - CREATE NAVTA TEST QUESTION
// ============================================

router.post(
  "/questions",
  createQuestion
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

module.exports = router;
