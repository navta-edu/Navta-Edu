const multer = require("multer");
const path = require("path");

// ============================================
// NAVTA AI FILE UPLOAD
// ============================================
//
// Supported:
// - PDF
// - DOCX
// - TXT
//
// Maximum file size: 30 MB
//
// Files stay in memory.
// They are NOT permanently written to the server.
// ============================================

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const allowedExtensions = new Set([
  ".pdf",
  ".docx",
  ".txt",
]);

const fileFilter = (
  req,
  file,
  callback
) => {
  const extension = path
    .extname(file.originalname || "")
    .toLowerCase();

  const validMimeType =
    allowedMimeTypes.has(
      file.mimetype
    );

  const validExtension =
    allowedExtensions.has(
      extension
    );

  if (
    !validMimeType ||
    !validExtension
  ) {
    return callback(
      new Error(
        "Only PDF, DOCX and TXT files are allowed."
      ),
      false
    );
  }

  return callback(
    null,
    true
  );
};

const uploadNavtaAIFile =
  multer({
    storage,

    limits: {
      // 30 MB maximum file size
      fileSize:
        30 * 1024 * 1024,

      files: 1,
    },

    fileFilter,
  });

module.exports =
  uploadNavtaAIFile;
