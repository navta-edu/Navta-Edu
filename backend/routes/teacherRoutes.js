const express = require('express');
const { createChapter, createNote, createPYQ, createTest, getStudentMetrics } = require('../controllers/teacherController');
const { protect, authorizeRoles } = require('../middleware/auth');

const { getQuestions, createQuestion, deleteQuestion } = require('../controllers/adminController');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('teacher', 'admin'));

router.post('/chapters', createChapter);
router.post('/notes', createNote);
router.post('/pyqs', createPYQ);
router.post('/tests', createTest);
router.get('/student-metrics', getStudentMetrics);

router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.delete('/questions/:id', deleteQuestion);

module.exports = router;
