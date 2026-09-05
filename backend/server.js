const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const {
  analyseNavtaImport,
} = require("../services/navtaAIImportService");

// =====================================================
// NAVTA AI UPLOAD
// =====================================================

const storage = multer.memoryStorage();

const allowedExtensions = new Set([
  ".pdf",
  ".docx",
  ".txt",
]);

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const fileFilter = (
  req,
  file,
  callback
) => {
  const extension = path
    .extname(
      file.originalname || ""
    )
    .toLowerCase();

  if (
    !allowedExtensions.has(
      extension
    )
  ) {
    return callback(
      new Error(
        "Only PDF, DOCX and TXT files are allowed."
      )
    );
  }

  // Some browsers/providers may send
  // application/octet-stream.
  if (
    file.mimetype &&
    file.mimetype !==
      "application/octet-stream" &&
    !allowedMimeTypes.has(
      file.mimetype
    )
  ) {
    return callback(
      new Error(
        "Invalid uploaded file type."
      )
    );
  }

  return callback(
    null,
    true
  );
};

const upload =
  multer({
    storage,

    limits: {
      fileSize:
        30 *
        1024 *
        1024,

      files: 1,
    },

    fileFilter,
  });

// =====================================================
// HEALTH CHECK
// =====================================================
//
// GET /api/question-separator/health
//

router.get(
  "/health",
  (req, res) => {
    return res
      .status(200)
      .json({
        success: true,

        service:
          "NAVTA AI Question Separator",

        status:
          "running",
      });
  }
);

// =====================================================
// QUESTION SEPARATOR
// =====================================================
//
// POST /api/question-separator/upload
//
// FormData field name MUST be:
// file
//

router.post(
  "/upload",

  upload.single(
    "file"
  ),

  async (
    req,
    res
  ) => {
    try {
      // ==========================================
      // FILE CHECK
      // ==========================================

      if (
        !req.file
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Please upload a PDF, DOCX or TXT file.",
          });
      }

      // ==========================================
      // ADMIN HINTS
      // ==========================================

      const subject =
        String(
          req.body
            ?.subject ||
            ""
        ).trim();

      const exam =
        String(
          req.body
            ?.exam ||
            ""
        ).trim();

      const classLevel =
        String(
          req.body
            ?.classLevel ||
            ""
        ).trim();

      // ==========================================
      // LOG
      // ==========================================

      console.log("");
      console.log(
        "========================================"
      );

      console.log(
        "NAVTA AI QUESTION SEPARATOR"
      );

      console.log(
        "========================================"
      );

      console.log(
        `File: ${req.file.originalname}`
      );

      console.log(
        `Size: ${req.file.size}`
      );

      console.log(
        `Mime: ${req.file.mimetype}`
      );

      console.log(
        `Subject: ${
          subject ||
          "Auto"
        }`
      );

      console.log(
        `Exam: ${
          exam ||
          "Auto"
        }`
      );

      console.log(
        `Class: ${
          classLevel ||
          "Auto"
        }`
      );

      console.log(
        "========================================"
      );

      // ==========================================
      // PROCESS WITH NAVTA AI
      // ==========================================

      const result =
        await analyseNavtaImport({
          file:
            req.file,

          subject,

          exam,

          classLevel,
        });

      // ==========================================
      // RESPONSE
      // ==========================================

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "NAVTA AI finished separating the questions.",

          summary:
            result.summary ||
            {
              detected:
                0,

              accepted:
                0,

              dropped:
                0,
            },

          documentInfo:
            result.documentInfo ||
            null,

          acceptedQuestions:
            Array.isArray(
              result.acceptedQuestions
            )
              ? result.acceptedQuestions
              : [],

          droppedQuestions:
            Array.isArray(
              result.droppedQuestions
            )
              ? result.droppedQuestions
              : [],
        });
    } catch (
      error
    ) {
      console.error("");
      console.error(
        "========================================"
      );

      console.error(
        "NAVTA AI QUESTION SEPARATOR ERROR"
      );

      console.error(
        "========================================"
      );

      console.error(
        error
      );

      console.error("");

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error?.message ||
            "NAVTA AI could not process the uploaded file.",
        });
    }
  }
);

// =====================================================
// MULTER / ROUTE ERROR HANDLER
// =====================================================

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "File is too large. Maximum size is 30 MB.",
          });
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Invalid upload field. The frontend must send the file using the field name "file".',
          });
      }

      return res
        .status(400)
        .json({
          success:
            false,

          message:
            error.message,
        });
    }

    if (
      error
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            error.message ||
            "File upload failed.",
        });
    }

    return next();
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports =
  router;
