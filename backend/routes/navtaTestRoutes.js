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
// ADMIN - CREATE QUESTION
// ============================================

router.post(
  "/questions",
  createQuestion
);

// ============================================
// STUDENT - GENERATE TEST
// ============================================

router.post(
  "/generate",
  generateTest
);

// ============================================
// STUDENT - EVALUATE WRITTEN ANSWER
// ============================================

router.post(
  "/evaluate-answer",
  evaluateWrittenAnswer
);

// ============================================
// ADMIN - GET QUESTIONS
// ============================================

router.get(
  "/questions",
  getQuestions
);

// ============================================
// ADMIN - DELETE QUESTION
// ============================================

router.delete(
  "/questions/:id",
  deleteQuestion
);

module.exports = router;
