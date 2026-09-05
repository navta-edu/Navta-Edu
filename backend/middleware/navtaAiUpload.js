const multer = require("multer");
const path = require("path");

// =====================================================
// NAVTA AI FILE UPLOAD
// Multer 2.x
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

const fileFilter = (req, file, callback) => {
  const extension = path
    .extname(file.originalname || "")
    .toLowerCase();

  if (!allowedExtensions.has(extension)) {
    return callback(
      new Error("Only PDF, DOCX and TXT files are allowed.")
    );
  }

  // Some clients send application/octet-stream.
  // The extension is still checked above.
  if (
    file.mimetype &&
    file.mimetype !== "application/octet-stream" &&
    !allowedMimeTypes.has(file.mimetype)
  ) {
    return callback(
      new Error("The uploaded file type does not match PDF, DOCX or TXT.")
    );
  }

  return callback(null, true);
};

const uploadNavtaAIFile = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024,
    files: 1,
  },
  fileFilter,
});

module.exports = uploadNavtaAIFile;
