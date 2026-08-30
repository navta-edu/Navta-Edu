const express = require("express");

const router = express.Router();

const {
  createPanicPlan,
  getActivePanicPlan,
  updateChapterProgress,
  generateTargetedPractice,
  checkPracticeAnswer,
  completeTargetedPractice,
  startFixTest,
  submitFixTest,
  resetPanicPlan,
} = require(
  "../controllers/panicModeController"
);

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth");

// ============================================
// ALL PANIC MODE ROUTES ARE STUDENT ONLY
// ============================================

router.use(protect);

router.use(
  authorizeRoles("student")
);

// ============================================
// PANIC PLAN
// ============================================

// Create Panic Mode plan
router.post(
  "/plan",
  createPanicPlan
);

// Get active Panic Mode plan
router.get(
  "/plan",
  getActivePanicPlan
);

// Reset active Panic Mode plan
router.delete(
  "/plan",
  resetPanicPlan
);

// ============================================
// CHAPTER PROGRESS
// ============================================

// Save Study Notes revision progress
router.patch(
  "/chapters/:chapterId",
  updateChapterProgress
);

// ============================================
// TARGETED PRACTICE
// ============================================

// Generate targeted practice questions
router.post(
  "/chapters/:chapterId/practice",
  generateTargetedPractice
);

// Check one targeted practice answer
router.post(
  "/chapters/:chapterId/practice/check",
  checkPracticeAnswer
);

// Complete targeted practice
router.post(
  "/chapters/:chapterId/practice/complete",
  completeTargetedPractice
);

// ============================================
// SECURE FIX TEST
// ============================================

// Start a new secure 10-question Fix Test
router.post(
  "/chapters/:chapterId/fix-test/start",
  startFixTest
);

// Submit Fix Test answers for server-side grading
router.post(
  "/chapters/:chapterId/fix-test/submit",
  submitFixTest
);

// ============================================
// EXPORT
// ============================================

module.exports = router;
