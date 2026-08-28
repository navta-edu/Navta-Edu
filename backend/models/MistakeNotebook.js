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
// PROTECT ALL MISTAKE NOTEBOOK ROUTES
// ============================================
//
// Student must:
// 1. Be logged in
// 2. Have the "student" role
//
// The protect middleware provides req.user,
// which mistakeNotebookController.js uses
// to identify the notebook owner.
//
// ============================================

router.use(protect);
router.use(authorizeRoles("student"));

// ============================================
// MISTAKE NOTEBOOK ROUTES
// ============================================

// --------------------------------------------
// SAVE A MISTAKE
// POST /api/mistake-notebook
// --------------------------------------------

router.post(
  "/",
  saveMistake
);

// --------------------------------------------
// GET ALL MY MISTAKES
// GET /api/mistake-notebook
// --------------------------------------------

router.get(
  "/",
  getMistakes
);

// --------------------------------------------
// DASHBOARD STATS
// GET /api/mistake-notebook/stats
//
// IMPORTANT:
// Keep this BEFORE /:id
// --------------------------------------------

router.get(
  "/stats",
  getMistakeStats
);

// --------------------------------------------
// GET ONE MISTAKE
// GET /api/mistake-notebook/:id
// --------------------------------------------

router.get(
  "/:id",
  getMistakeById
);

// --------------------------------------------
// UPDATE PERSONAL NOTE
// PUT /api/mistake-notebook/:id/note
// --------------------------------------------

router.put(
  "/:id/note",
  updateNote
);

// --------------------------------------------
// MARK MASTERED / NOT MASTERED
// PUT /api/mistake-notebook/:id/mastered
// --------------------------------------------

router.put(
  "/:id/mastered",
  updateMastered
);

// --------------------------------------------
// RECORD REVIEW
// PUT /api/mistake-notebook/:id/review
// --------------------------------------------

router.put(
  "/:id/review",
  recordReview
);

// --------------------------------------------
// DELETE FROM NOTEBOOK
// DELETE /api/mistake-notebook/:id
// --------------------------------------------

router.delete(
  "/:id",
  deleteMistake
);

module.exports = router;
