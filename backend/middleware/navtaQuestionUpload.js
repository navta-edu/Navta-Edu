const multer = require('multer');
const path = require('path');

// =====================================================
// NAVTA AI QUESTION IMPORT FILE UPLOAD
// =====================================================

// Store uploaded files in memory.
// We only need the file temporarily for text extraction.
const storage = multer.memoryStorage();

// =====================================================
// ALLOWED FILE TYPES
// =====================================================

const allowedExtensions = [
  '.pdf',
  '.docx',
  '.txt'
];

const fileFilter = (
  req,
  file,
  callback
) => {
  const extension =
    path.extname(
      file.originalname
    ).toLowerCase();

  if (
    !allowedExtensions.includes(
      extension
    )
  ) {
    return callback(
      new Error(
        'Only PDF, DOCX and TXT files are allowed.'
      )
    );
  }

  callback(
    null,
    true
  );
};

// =====================================================
// MULTER CONFIGURATION
// =====================================================

const navtaQuestionUpload =
  multer({
    storage,

    fileFilter,

    limits: {
      // 15 MB maximum upload
      fileSize:
        15 * 1024 * 1024
    }
  });

module.exports =
  navtaQuestionUpload;
