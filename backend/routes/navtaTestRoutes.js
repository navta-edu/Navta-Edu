const express = require("express");

const router = express.Router();

const NavtaQuestion =
  require("../models/NavtaQuestion");

const {
  createQuestion,
  createPDFCropQuestion,
  getQuestions,
  deleteQuestion,
  generateTest,
  generateBossBattle,
  generateRevengeBattle,
  evaluateWrittenAnswer,
  completeNavtaTest,

  // ADMIN - NAVTA AI IMPORT
  importQuestionsWithAI,
  getAIImportJob,
  confirmAIImport,

  // ADMIN - MANUAL QUESTION IMAGE CROP
  cropAIQuestionImage,
  resetAIQuestionImage,

  // ADMIN - AI REVIEW IMAGE CROP
  cropAIReviewImage,
} = require("../controllers/navtaTestController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth");

const cleanFilterValue = (value) => {
  return String(value ?? "").trim();
};

const buildBulkDeleteFilter = (query = {}) => {
  const allowedKeys = [
    "subject",
    "exam",
    "classLevel",
    "chapter",
    "difficulty",
    "questionType",
  ];

  const filter = {};

  allowedKeys.forEach((key) => {
    const value = cleanFilterValue(query[key]);

    if (value) {
      filter[key] = value;
    }
  });

  return filter;
};

router.post(
  "/questions",
  protect,
  authorizeRoles("admin"),
  createQuestion
);

// ADMIN - SAVE MANUALLY CROPPED PDF QUESTION
//
// The upload middleware is loaded lazily so a configuration problem
// returns a useful API error instead of crashing the entire backend.
//
// Field name expected from the frontend: questionImage
router.post(
  "/questions/pdf-crop",
  protect,
  authorizeRoles("admin"),
  (req, res, next) => {
    try {
      const multer =
        require("multer");

      const upload =
        multer({
          storage:
            multer.memoryStorage(),

          limits: {
            fileSize:
              12 * 1024 * 1024,
          },

          fileFilter: (
            request,
            file,
            callback
          ) => {
            const mimeType =
              String(
                file?.mimetype || ""
              ).toLowerCase();

            const allowedTypes =
              new Set([
                "image/png",
                "image/jpeg",
                "image/jpg",
                "image/webp",
              ]);

            if (
              !allowedTypes.has(
                mimeType
              )
            ) {
              const error =
                new Error(
                  "Only PNG, JPG and WEBP cropped question images are allowed."
                );

              error.statusCode =
                400;

              return callback(
                error
              );
            }

            return callback(
              null,
              true
            );
          },
        });

      return upload.single(
        "questionImage"
      )(
        req,
        res,
        (error) => {
          if (!error) {
            return next();
          }

          console.error(
            "NAVTA PDF CROP UPLOAD ERROR:",
            error
          );

          return res.status(
            Number(
              error?.statusCode
            ) || 400
          ).json({
            success: false,
            message:
              error?.message ||
              "Could not upload the cropped question image.",
          });
        }
      );
    } catch (error) {
      console.error(
        "NAVTA PDF CROP UPLOAD MIDDLEWARE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "NAVTA PDF crop upload service could not be loaded.",
        error:
          error.message,
      });
    }
  },
  createPDFCropQuestion
);

router.get(
  "/questions",
  protect,
  authorizeRoles("admin"),
  getQuestions
);

router.delete(
  "/questions/bulk",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const filter = buildBulkDeleteFilter(req.query);
      const filterKeys = Object.keys(filter);

      if (filterKeys.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Select at least one filter before deleting questions.",
        });
      }

      const matchedCount =
        await NavtaQuestion.countDocuments(filter);

      if (matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message:
            "No NAVTA TEST questions matched the selected filters.",
          deletedCount: 0,
        });
      }

      const result =
        await NavtaQuestion.deleteMany(filter);

      const deletedCount =
        Number(result?.deletedCount) || 0;

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
            deletedCount === 1 ? "" : "s"
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
        error: error.message,
      });
    }
  }
);

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

router.delete(
  "/questions/:id",
  protect,
  authorizeRoles("admin"),
  deleteQuestion
);

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
        error: error.message,
      });
    }
  },
  importQuestionsWithAI
);

// Async import polling endpoint.
// This fixes the 404 from GET /api/navta-test/import/jobs/:jobId.
router.get(
  "/import/jobs/:jobId",
  protect,
  authorizeRoles("admin"),
  getAIImportJob
);

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

router.post(
  "/generate",
  generateTest
);

router.post(
  "/boss-battle",
  generateBossBattle
);

router.post(
  "/revenge-battle",
  generateRevengeBattle
);

router.post(
  "/complete",
  protect,
  authorizeRoles("student"),
  completeNavtaTest
);

router.post(
  "/evaluate-answer",
  evaluateWrittenAnswer
);

module.exports = router;
