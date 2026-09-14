const express = require("express");

const router = express.Router();

const NavtaQuestion =
  require("../models/NavtaQuestion");

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

  // ============================================
  // ADMIN - MANUAL QUESTION IMAGE CROP
  // ============================================
  cropAIQuestionImage,
  resetAIQuestionImage,

  // ============================================
  // ADMIN - AI REVIEW IMAGE CROP
  // ============================================
  cropAIReviewImage,
} = require("../controllers/navtaTestController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth");

// ============================================
// HELPERS - BULK DELETE
// ============================================

const cleanFilterValue = (
  value
) => {
  return String(
    value ?? ""
  ).trim();
};

const buildBulkDeleteFilter = (
  query = {}
) => {
  const allowedKeys = [
    "subject",
    "exam",
    "classLevel",
    "chapter",
    "difficulty",
    "questionType",
  ];

  const filter = {};

  allowedKeys.forEach(
    (key) => {
      const value =
        cleanFilterValue(
          query[key]
        );

      if (value) {
        filter[key] =
          value;
      }
    }
  );

  return filter;
};

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

// ============================================
// ADMIN - BULK DELETE FILTERED QUESTIONS
// IMPORTANT:
// Keep this ABOVE "/questions/:id"
// so Express does not treat "bulk" as an ID.
// ============================================

router.delete(
  "/questions/bulk",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const filter =
        buildBulkDeleteFilter(
          req.query
        );

      const filterKeys =
        Object.keys(
          filter
        );

      if (
        filterKeys.length ===
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Select at least one filter before deleting questions.",
        });
      }

      const matchedCount =
        await NavtaQuestion.countDocuments(
          filter
        );

      if (
        matchedCount ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "No NAVTA TEST questions matched the selected filters.",
          deletedCount:
            0,
        });
      }

      const result =
        await NavtaQuestion.deleteMany(
          filter
        );

      const deletedCount =
        Number(
          result?.deletedCount
        ) || 0;

      console.log(
        "NAVTA BULK QUESTION DELETE:",
        {
          filter,
          matchedCount,
          deletedCount,
          adminUserId:
            req.user?._id ||
            req.user?.id ||
            null,
        }
      );

      return res.status(200).json({
        success: true,
        message:
          `${deletedCount} question${
            deletedCount === 1
              ? ""
              : "s"
          } deleted successfully.`,
        deletedCount,
        filter,
      });
    } catch (error) {
      console.error(
        "NAVTA BULK QUESTION DELETE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete filtered NAVTA TEST questions.",
        error:
          error.message,
      });
    }
  }
);

// ============================================
// ADMIN - MANUAL AI IMAGE CROP
// ============================================

router.post(
  "/questions/:id/crop-ai-image",
  protect,
  authorizeRoles("admin"),
  cropAIQuestionImage
);

router.post(
  "/questions/:id/reset-ai-image",
  protect,
  authorizeRoles("admin"),
  resetAIQuestionImage
);

// ============================================
// ADMIN - DELETE SINGLE QUESTION
// ============================================

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

      return uploadNavtaAIFile.single(
        "file"
      )(
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

// ============================================
// ADMIN - CROP IMAGE DURING AI REVIEW
// ============================================
//
// This route works before the question is saved,
// so no MongoDB question ID is required.
// ============================================

router.post(
  "/import/crop-image",
  protect,
  authorizeRoles("admin"),
  cropAIReviewImage
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
