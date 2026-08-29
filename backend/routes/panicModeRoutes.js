const express = require('express');

const router = express.Router();

const {
  createPanicPlan,
  getActivePanicPlan,
  updateChapterProgress,
  saveFixTestResult,
  resetPanicPlan
} = require(
  '../controllers/panicModeController'
);

const {
  protect,
  authorizeRoles
} = require(
  '../middleware/auth'
);

/*
|--------------------------------------------------------------------------
| All Panic Mode routes are student-only
|--------------------------------------------------------------------------
*/

router.use(
  protect
);

router.use(
  authorizeRoles('student')
);

/*
|--------------------------------------------------------------------------
| PANIC PLAN
|--------------------------------------------------------------------------
*/

// Create a new plan
router.post(
  '/plan',
  createPanicPlan
);

// Get current active plan
router.get(
  '/plan',
  getActivePanicPlan
);

// Reset current plan
router.delete(
  '/plan',
  resetPanicPlan
);

/*
|--------------------------------------------------------------------------
| CHAPTER PROGRESS
|--------------------------------------------------------------------------
*/

// Mark Study Notes / practice progress
router.patch(
  '/chapters/:chapterId',
  updateChapterProgress
);

/*
|--------------------------------------------------------------------------
| FIX TEST
|--------------------------------------------------------------------------
*/

// Save Fix Test result
router.post(
  '/chapters/:chapterId/fix-test',
  saveFixTestResult
);

module.exports = router;
