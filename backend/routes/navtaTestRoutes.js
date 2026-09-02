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
// ADMIN - QUESTION MANAGEMENT
// ============================================

router.post(
  "/questions",
  protect,
  authorizeRoles("admin"),
  createQuestion
);

router.get(
  "/questions",
  protect,
  authorizeRoles("admin"),
  getQuestions
);

router.delete(
  "/questions/:id",
  protect,
  authorizeRoles("admin"),
  deleteQuestion
);

// ============================================
// ADMIN - NAVTA AI IMPORT
// ============================================

router.post(
  "/import",
  protect,
  authorizeRoles("admin"),
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

router.post(
  "/import/confirm",
  protect,
  authorizeRoles("admin"),
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
