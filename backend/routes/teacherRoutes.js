const express = require('express');
const { createChapter, createNote, createPYQ, createTest, getStudentMetrics } = require('../controllers/teacherController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('teacher', 'admin'));

router.post('/chapters', createChapter);
router.post('/notes', createNote);
router.post('/pyqs', createPYQ);
router.post('/tests', createTest);
router.get('/student-metrics', getStudentMetrics);

module.exports = router;
