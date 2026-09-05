const express = require('express');
const multer = require('multer');

const {
  protect,
  authorizeRoles
} = require('../middleware/auth');

const {
  createChapter,
  createNote,
  createPYQ,
  createTest,
  getStudentMetrics,
  getQuestionBank
} = require('../controllers/teacherController');

const {
  getQuestions,
  createQuestion,
  deleteQuestion
} = require('../controllers/adminController');

const router = express.Router();


// =====================================================
// STUDY NOTE PDF UPLOAD CONFIGURATION
// =====================================================
//
// IMPORTANT:
//
// Study Notes are submitted from AdminDashboard using
// multipart/form-data.
//
// The expected PDF field name is:
//
// pdf
//
// We intentionally use memoryStorage() because the
// updated teacherController uploads:
//
// req.file.buffer
//
// directly to Cloudinary.
//
// Therefore:
//
// Browser FormData
//      ↓
// Multer memoryStorage
//      ↓
// req.file.buffer
//      ↓
// teacherController
//      ↓
// Cloudinary
//      ↓
// Cloudinary secure_url
//      ↓
// MongoDB Note.pdfUrl
//
// =====================================================

const studyNoteStorage =
  multer.memoryStorage();


const studyNoteUpload = multer({
  storage:
    studyNoteStorage,

  limits: {
    // Maximum PDF size: 25 MB
    fileSize:
      25 * 1024 * 1024,

    // Maximum number of normal FormData fields
    fields:
      30,

    // Only one PDF
    files:
      1
  },

  fileFilter: (
    req,
    file,
    callback
  ) => {
    try {
      if (!file) {
        return callback(
          null,
          true
        );
      }

      const mimeType =
        String(
          file.mimetype ||
          ''
        )
          .trim()
          .toLowerCase();

      const fileName =
        String(
          file.originalname ||
          ''
        )
          .trim()
          .toLowerCase();

      const isPdfMime =
        mimeType ===
        'application/pdf';

      const isPdfExtension =
        fileName.endsWith(
          '.pdf'
        );

      if (
        !isPdfMime &&
        !isPdfExtension
      ) {
        return callback(
          new Error(
            'Only PDF files are allowed for Study Notes.'
          )
        );
      }

      return callback(
        null,
        true
      );

    } catch (error) {
      return callback(
        error
      );
    }
  }
});


// =====================================================
// MULTER ERROR HANDLER
// =====================================================
//
// Do not call:
//
// studyNoteUpload.single('pdf')
//
// directly inside router.post.
//
// Using this wrapper allows us to return useful JSON
// instead of an HTML/server error.
//
// =====================================================

const handleStudyNoteUpload = (
  req,
  res,
  next
) => {
  const uploadSinglePdf =
    studyNoteUpload.single(
      'pdf'
    );

  uploadSinglePdf(
    req,
    res,
    (error) => {
      if (!error) {
        return next();
      }

      console.error(
        '======================================'
      );

      console.error(
        'NAVTA STUDY NOTE MULTER ERROR'
      );

      console.error(
        '======================================'
      );

      console.error(
        'NAME:',
        error?.name
      );

      console.error(
        'CODE:',
        error?.code
      );

      console.error(
        'MESSAGE:',
        error?.message
      );

      console.error(
        '======================================'
      );

      if (
        error instanceof
        multer.MulterError
      ) {
        if (
          error.code ===
          'LIMIT_FILE_SIZE'
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                'Study Note PDF is too large. Maximum allowed size is 25 MB.'
            });
        }

        if (
          error.code ===
          'LIMIT_FILE_COUNT'
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                'Only one Study Note PDF can be uploaded at a time.'
            });
        }

        if (
          error.code ===
          'LIMIT_UNEXPECTED_FILE'
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                'Unexpected PDF field. The Study Note PDF must be sent using the field name "pdf".'
            });
        }

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              `Study Note PDF upload failed: ${error.message}`
          });
      }

      return res
        .status(400)
        .json({
          success:
            false,

          message:
            error?.message ||
            'Unable to process the Study Note PDF.'
        });
    }
  );
};


// =====================================================
// VERIFY MULTIPART DATA
// =====================================================
//
// Runs AFTER Multer.
//
// At this point:
//
// req.body
//
// should contain the text fields.
//
// req.file
//
// should contain the uploaded PDF.
//
// If a PDF exists, memoryStorage() MUST give us:
//
// req.file.buffer
//
// =====================================================

const verifyStudyNoteRequest = (
  req,
  res,
  next
) => {
  try {
    const title =
      String(
        req.body?.title ||
        ''
      ).trim();

    const content =
      String(
        req.body?.content ||
        ''
      ).trim();

    // -------------------------------------------------
    // TITLE
    // -------------------------------------------------

    if (!title) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            'Study Note title is required.'
        });
    }

    // -------------------------------------------------
    // CONTENT
    // -------------------------------------------------

    if (!content) {
      return res
        .status(400)
        .json({
          success:
            false,

          message:
            'Study Note content is required.'
        });
    }

    // -------------------------------------------------
    // VERIFY PDF BUFFER
    // -------------------------------------------------

    if (req.file) {
      const hasBuffer =
        Buffer.isBuffer(
          req.file.buffer
        );

      const bufferLength =
        hasBuffer
          ? req.file.buffer.length
          : 0;

      if (
        !hasBuffer ||
        bufferLength === 0
      ) {
        console.error(
          'NAVTA STUDY NOTE ERROR: PDF exists but req.file.buffer is missing.'
        );

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'The Study Note PDF was received but its file data is missing.'
          });
      }
    }

    return next();

  } catch (error) {
    console.error(
      'VERIFY STUDY NOTE REQUEST ERROR:',
      error
    );

    return res
      .status(400)
      .json({
        success:
          false,

        message:
          error?.message ||
          'Invalid Study Note upload request.'
      });
  }
};


// =====================================================
// DEBUG STUDY NOTE REQUEST
// =====================================================
//
// Do NOT log req.file.buffer because it can be several
// megabytes.
//
// We only log metadata.
//
// =====================================================

const debugStudyNoteRequest = (
  req,
  res,
  next
) => {
  const hasFile =
    Boolean(
      req.file
    );

  const hasBuffer =
    Buffer.isBuffer(
      req.file?.buffer
    );

  console.log(
    '======================================'
  );

  console.log(
    'NAVTA STUDY NOTE ROUTE'
  );

  console.log(
    '======================================'
  );

  console.log(
    'TITLE:',
    req.body?.title ||
    ''
  );

  console.log(
    'CONTENT LENGTH:',
    String(
      req.body?.content ||
      ''
    ).length
  );

  console.log(
    'SUBJECT ID:',
    req.body?.subjectId ||
    ''
  );

  console.log(
    'SUBJECT NAME:',
    req.body?.subjectName ||
    ''
  );

  console.log(
    'CHAPTER ID:',
    req.body?.chapterId ||
    ''
  );

  console.log(
    'CHAPTER NAME:',
    req.body?.chapterName ||
    ''
  );

  console.log(
    'EXAM:',
    req.body?.exam ||
    ''
  );

  console.log(
    'CLASS NAME:',
    req.body?.className ||
    ''
  );

  console.log(
    'CLASS LEVEL:',
    req.body?.classLevel ||
    ''
  );

  console.log(
    'HAS PDF:',
    hasFile
  );

  console.log(
    'PDF NAME:',
    req.file?.originalname ||
    ''
  );

  console.log(
    'PDF MIME TYPE:',
    req.file?.mimetype ||
    ''
  );

  console.log(
    'PDF SIZE:',
    req.file?.size ||
    0
  );

  console.log(
    'HAS PDF BUFFER:',
    hasBuffer
  );

  console.log(
    'PDF BUFFER LENGTH:',
    hasBuffer
      ? req.file.buffer.length
      : 0
  );

  console.log(
    'EXISTING PDF URL:',
    req.body?.pdfUrl ||
    ''
  );

  console.log(
    '======================================'
  );

  return next();
};


// =====================================================
// TEACHER CONTROLLER SAFETY CHECK
// =====================================================
//
// If teacherController.js is incomplete or one of these
// exports is missing, fail immediately with a useful
// startup message.
//
// =====================================================

const requiredTeacherControllers = {
  createChapter,
  createNote,
  createPYQ,
  createTest,
  getStudentMetrics,
  getQuestionBank
};


for (
  const [
    name,
    handler
  ] of Object.entries(
    requiredTeacherControllers
  )
) {
  if (
    typeof handler !==
    'function'
  ) {
    throw new Error(
      `teacherRoutes.js: teacherController.${name} is missing or is not exported correctly.`
    );
  }
}


// =====================================================
// ADMIN CONTROLLER SAFETY CHECK
// =====================================================

const requiredAdminControllers = {
  getQuestions,
  createQuestion,
  deleteQuestion
};


for (
  const [
    name,
    handler
  ] of Object.entries(
    requiredAdminControllers
  )
) {
  if (
    typeof handler !==
    'function'
  ) {
    throw new Error(
      `teacherRoutes.js: adminController.${name} is missing or is not exported correctly.`
    );
  }
}


// =====================================================
// LOGIN REQUIRED
// =====================================================
//
// Everything below this line requires authentication.
//
// =====================================================

router.use(
  protect
);


// =====================================================
// NAVTA QUESTION BANK / PAPER BUILDER
// =====================================================

router.get(
  '/question-bank',

  authorizeRoles(
    'teacher',
    'external_teacher',
    'admin'
  ),

  getQuestionBank
);


// =====================================================
// GENERAL QUESTION BANK
// =====================================================

router.get(
  '/questions',

  authorizeRoles(
    'teacher',
    'external_teacher',
    'admin'
  ),

  getQuestions
);


// =====================================================
// CREATE GENERAL QUESTION
// =====================================================

router.post(
  '/questions',

  authorizeRoles(
    'teacher',
    'external_teacher',
    'admin'
  ),

  createQuestion
);


// =====================================================
// DELETE GENERAL QUESTION
// =====================================================

router.delete(
  '/questions/:id',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  deleteQuestion
);


// =====================================================
// CREATE / RESOLVE CHAPTER
// =====================================================

router.post(
  '/chapters',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createChapter
);


// =====================================================
// CREATE STUDY NOTE
// =====================================================
//
// ORDER IS CRITICAL:
//
// 1. authorizeRoles
//
// 2. handleStudyNoteUpload
//      Parses multipart/form-data.
//      Produces req.body and req.file.
//
// 3. verifyStudyNoteRequest
//      Confirms title/content and verifies the PDF
//      buffer.
//
// 4. debugStudyNoteRequest
//      Prints safe diagnostics.
//
// 5. createNote
//      Uploads req.file.buffer to Cloudinary.
//      Saves Cloudinary URL into MongoDB Note.pdfUrl.
//
// =====================================================

router.post(
  '/notes',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  handleStudyNoteUpload,

  verifyStudyNoteRequest,

  debugStudyNoteRequest,

  createNote
);


// =====================================================
// CREATE PYQ
// =====================================================

router.post(
  '/pyqs',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createPYQ
);


// =====================================================
// CREATE TEST
// =====================================================

router.post(
  '/tests',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  createTest
);


// =====================================================
// STUDENT METRICS
// =====================================================

router.get(
  '/student-metrics',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  getStudentMetrics
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
