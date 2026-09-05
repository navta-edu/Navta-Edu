const express = require("express");

const router = express.Router();

const uploadNavtaAIFile = require("../middleware/navtaaiupload");

const {
  analyseNavtaImport,
} = require("../services/navtaAIImportService");

// =====================================================
// NAVTA AI QUESTION SEPARATOR
// POST /api/question-separator/upload
// =====================================================

router.post(
  "/upload",

  uploadNavtaAIFile.single("file"),

  async (req, res) => {
    try {
      // ============================================
      // FILE CHECK
      // ============================================

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload a PDF, DOCX or TXT file.",
        });
      }

      // ============================================
      // OPTIONAL ADMIN HINTS
      // ============================================

      const subject =
        String(
          req.body?.subject || ""
        ).trim();

      const exam =
        String(
          req.body?.exam || ""
        ).trim();

      const classLevel =
        String(
          req.body?.classLevel || ""
        ).trim();

      // ============================================
      // NAVTA AI IMPORT
      // ============================================

      console.log(
        "============================================"
      );

      console.log(
        "NAVTA AI QUESTION IMPORT"
      );

      console.log(
        `File: ${req.file.originalname}`
      );

      console.log(
        `Size: ${req.file.size} bytes`
      );

      console.log(
        `Type: ${req.file.mimetype}`
      );

      console.log(
        "============================================"
      );

      const result =
        await analyseNavtaImport({
          file:
            req.file,

          subject,

          exam,

          classLevel,
        });

      // ============================================
      // SUCCESS RESPONSE
      // ============================================

      return res.status(200).json({
        success: true,

        message:
          "NAVTA AI finished separating the questions.",

        summary:
          result.summary,

        documentInfo:
          result.documentInfo,

        acceptedQuestions:
          result.acceptedQuestions,

        droppedQuestions:
          result.droppedQuestions,
      });
    } catch (error) {
      console.error(
        "NAVTA AI QUESTION SEPARATOR ERROR:",
        error
      );

      // ============================================
      // FRIENDLIER ERROR RESPONSE
      // ============================================

      const message =
        error?.message ||
        "NAVTA AI could not process this file.";

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// =====================================================
// HEALTH CHECK
// GET /api/question-separator/health
// =====================================================

router.get(
  "/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      service:
        "NAVTA AI Question Separator",

      status:
        "running",
    });
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
