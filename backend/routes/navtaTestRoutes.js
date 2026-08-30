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
  completeNavtaTest,
  importQuestionsWithAI,
  confirmAIImport,
} = require("../controllers/navtaTestController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth");

// ============================================
// QUESTION MANAGEMENT
// ============================================

router.post(
  "/questions",
  createQuestion
);

router.get(
  "/questions",
  getQuestions
);

router.delete(
  "/questions/:id",
  deleteQuestion
);

// ============================================
// NAVTA AI IMPORT
// ============================================
//
// Multer is loaded lazily here so a problem with
// the new AI upload dependency cannot crash the
// entire NAVTA backend during startup.
// ============================================

router.post(
  "/import",
  (req, res, next) => {
    try {
      const uploadNavtaAIFile =
        require("../middleware/navtaAiUpload");

      return uploadNavtaAIFile.single("file")(
        req,
        res,
        next
      );
    } catch (error) {
      console.error(
        "NAVTA AI UPLOAD MIDDLEWARE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "NAVTA AI upload service could not be loaded.",
        error:
          error.message,
      });
    }
  },
  importQuestionsWithAI
);

// Keep saving disabled until analysis has
// been tested successfully.
router.post(
  "/import/confirm",
  confirmAIImport
);

// ============================================
// STANDARD TEST
// ============================================

router.post(
  "/generate",
  generateTest
);

// ============================================
// BOSS BATTLE
// ============================================

router.post(
  "/boss-battle",
  generateBossBattle
);

// ============================================
// REVENGE BATTLE
// ============================================

router.post(
  "/revenge-battle",
  generateRevengeBattle
);

// ============================================
// COMPLETE NAVTA TEST
// ============================================

router.post(
  "/complete",
  protect,
  authorizeRoles("student"),
  completeNavtaTest
);

// ============================================
// WRITTEN ANSWER EVALUATION
// ============================================

router.post(
  "/evaluate-answer",
  evaluateWrittenAnswer
);

module.exports = router;
