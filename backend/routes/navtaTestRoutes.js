const express = require("express");

const router = express.Router();

const {
  createQuestion,
  getQuestions,
  deleteQuestion,
  generateTest,
  generateBossBattle,
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
// STUDENT - GENERATE STANDARD NAVTA TEST
// ============================================

router.post(
  "/generate",
  generateTest
);

// ============================================
// STUDENT - GENERATE BOSS BATTLE
// ============================================
//
// Boss Battle supports:
// - Multiple chapters
// - Minimum 2 chapters
// - Automatic Easy / Medium / Hard mix
// - 15, 30 or 50 questions
//
// Endpoint:
// POST /api/navta-test/boss-battle
//
// ============================================

router.post(
  "/boss-battle",
  generateBossBattle
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
