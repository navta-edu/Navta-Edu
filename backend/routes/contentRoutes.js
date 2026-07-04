const express = require('express');
const { getSubjects, getChapters, getNotes, getPYQs, getTests, getTestDetail } = require('../controllers/contentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/subjects', getSubjects);
router.get('/subjects/:subjectId/chapters', getChapters);
router.get('/chapters/:chapterId/notes', getNotes);
router.get('/subjects/:subjectId/pyqs', getPYQs);
router.get('/subjects/:subjectId/tests', getTests);
router.get('/tests/:testId', protect, getTestDetail);

module.exports = router;
