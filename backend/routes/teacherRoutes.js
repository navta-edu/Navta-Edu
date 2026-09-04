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
// STUDY NOTE PDF UPLOAD
// =====================================================
//
// IMPORTANT:
//
// AdminDashboard sends Study Notes using FormData:
//
// title
// content
// subjectId
// subjectName
// chapterId
// chapterName
// exam
// className
// classLevel
// pdf
// pdfUrl
//
// express.json() does NOT parse multipart/form-data.
//
// Multer is therefore required before createNote.
//
// We use memory storage here so:
// - req.body is parsed correctly
// - req.file is available
// - no missing uploads directory can crash Hostinger
//
// =====================================================

const studyNoteUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    // 25 MB PDF limit
    fileSize: 25 * 1024 * 1024,

    // Reasonable multipart field limits
    fields: 30,
    files: 1
  },

  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(null, true);
    }

    const mimeType =
      String(
        file.mimetype || ''
      ).toLowerCase();

    const fileName =
      String(
        file.originalname || ''
      ).toLowerCase();

    const isPdf =
      mimeType ===
        'application/pdf' ||
      fileName.endsWith('.pdf');

    if (!isPdf) {
      return cb(
        new Error(
          'Only PDF files are allowed for Study Notes.'
        )
      );
    }

    return cb(null, true);
  }
});


// =====================================================
// MULTER ERROR WRAPPER
// =====================================================

const handleStudyNoteUpload = (
  req,
  res,
  next
) => {
  studyNoteUpload.single('pdf')(
    req,
    res,
    (error) => {
      if (!error) {
        return next();
      }

      console.error(
        'STUDY NOTE UPLOAD ERROR:',
        error
      );

      if (
        error instanceof
        multer.MulterError
      ) {
        if (
          error.code ===
          'LIMIT_FILE_SIZE'
        ) {
          return res.status(400).json({
            success: false,

            message:
              'Study Note PDF is too large. Maximum size is 25 MB.'
          });
        }

        return res.status(400).json({
          success: false,

          message:
            `Study Note upload failed: ${error.message}`
        });
      }

      return res.status(400).json({
        success: false,

        message:
          error.message ||
          'Unable to process Study Note PDF.'
      });
    }
  );
};


// =====================================================
// DEBUG STUDY NOTE REQUEST
// =====================================================
//
// This runs AFTER Multer.
//
// It confirms that title/content/chapter metadata have
// actually reached the backend.
//
// Do not log PDF bytes.
//
// =====================================================

const debugStudyNoteRequest = (
  req,
  res,
  next
) => {
  console.log(
    'NAVTA STUDY NOTE REQUEST:',
    {
      title:
        req.body?.title || '',

      contentLength:
        String(
          req.body?.content ||
          ''
        ).length,

      subjectId:
        req.body?.subjectId ||
        '',

      subjectName:
        req.body?.subjectName ||
        '',

      chapterId:
        req.body?.chapterId ||
        '',

      chapterName:
        req.body?.chapterName ||
        '',

      exam:
        req.body?.exam ||
        '',

      className:
        req.body?.className ||
        '',

      classLevel:
        req.body?.classLevel ||
        '',

      hasPdf:
        Boolean(req.file),

      pdfName:
        req.file?.originalname ||
        '',

      pdfSize:
        req.file?.size ||
        0,

      pdfUrl:
        req.body?.pdfUrl ||
        ''
    }
  );

  next();
};


// =====================================================
// SAFETY CHECK
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
  const [name, handler]
  of Object.entries(
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
// SAFETY CHECK - ADMIN CONTROLLER
// =====================================================

const requiredAdminControllers = {
  getQuestions,
  createQuestion,
  deleteQuestion
};

for (
  const [name, handler]
  of Object.entries(
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

router.use(protect);


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
// Order is important:
//
// authorize
//   ↓
// Multer parses multipart/form-data
//   ↓
// req.body becomes available
//   ↓
// req.file becomes available
//   ↓
// controller receives title/content/chapter data
//
// =====================================================

router.post(
  '/notes',

  authorizeRoles(
    'teacher',
    'admin'
  ),

  handleStudyNoteUpload,

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
// ROUTER
// =====================================================

module.exports = router;
