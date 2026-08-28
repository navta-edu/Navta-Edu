const express = require("express");

const router = express.Router();

const {
  createQuestion,
  getQuestions,
  deleteQuestion,
  generateTest,
  generateBossBattle,
  generateRevengeBattle,
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
//
// Endpoint:
// POST /api/navta-test/generate
//
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
// STUDENT - GENERATE REVENGE BATTLE
// ============================================
//
// Revenge Battle supports:
// - Unlocks after a failed Boss Battle
// - Boss must be defeated with 70% or higher
// - Uses the same subject
// - Uses the same preparation/exam
// - Uses the same class
// - Uses the same selected chapters
// - Uses the same Boss Battle size
// - Focuses on weak chapters
// - Focuses on weak difficulty levels
// - Tries to avoid recently answered questions
// - Supports repeated Revenge attempts
//
// Endpoint:
// POST /api/navta-test/revenge-battle
//
// ============================================

router.post(
  "/revenge-battle",
  generateRevengeBattle
);

// ============================================
// STUDENT - EVALUATE WRITTEN ANSWER
// ============================================
//
// Endpoint:
// POST /api/navta-test/evaluate-answer
//
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
