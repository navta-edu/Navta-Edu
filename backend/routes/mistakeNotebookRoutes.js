const express = require("express");

const {
  saveMistake,
  getMistakes,
  getMistakeById,
  updateNote,
  updateMastered,
  recordReview,
  deleteMistake,
  getMistakeStats,
} = require("../controllers/mistakeNotebookController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth");

const router = express.Router();

// ============================================
// PROTECT ALL ROUTES
// ============================================

router.use(protect);
router.use(authorizeRoles("student"));

// ============================================
// SAVE MISTAKE
// POST /api/mistake-notebook
// ============================================

router.post(
  "/",
  saveMistake
);

// ============================================
// GET ALL MISTAKES
// GET /api/mistake-notebook
// ============================================

router.get(
  "/",
  getMistakes
);

// ============================================
// GET DASHBOARD STATS
// IMPORTANT: MUST BE BEFORE /:id
// ============================================

router.get(
  "/stats",
  getMistakeStats
);

// ============================================
// GET ONE MISTAKE
// ============================================

router.get(
  "/:id",
  getMistakeById
);

// ============================================
// UPDATE NOTE
// ============================================

router.put(
  "/:id/note",
  updateNote
);

// ============================================
// MARK MASTERED
// ============================================

router.put(
  "/:id/mastered",
  updateMastered
);

// ============================================
// RECORD REVIEW
// ============================================

router.put(
  "/:id/review",
  recordReview
);

// ============================================
// DELETE MISTAKE
// ============================================

router.delete(
  "/:id",
  deleteMistake
);

module.exports = router;
