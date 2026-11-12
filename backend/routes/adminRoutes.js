const express = require('express');
const {
  getUsers,
  getAdminActivity,
  createUser,
  updateUser,
  deleteUser,
  createSubject,
  createChapter,
  getChapters,
  deleteSubject,
  deleteChapter,
  deleteNote,
  getPYQs,
  createPYQ,
  updatePYQ,
  setPYQArchived,
  deletePYQ,
  getRewards,
  createReward,
  updateReward,
  setRewardArchived,
  getDashboardStats,
  updateStudentProfile,
  getQuestions,
  createQuestion,
  deleteQuestion
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);
router.put('/students/:userId', updateStudentProfile);
router.delete('/users/:userId', deleteUser);
router.get('/activity', getAdminActivity);

router.post('/subjects', createSubject);
router.delete('/subjects/:id', deleteSubject);

router.get('/chapters', getChapters);
router.post('/chapters', createChapter);
router.delete('/chapters/:id', deleteChapter);

router.delete('/notes/:id', deleteNote);
router.get('/pyqs', getPYQs);
router.post('/pyqs', createPYQ);
router.patch('/pyqs/:id', updatePYQ);
router.patch('/pyqs/:id/archive', setPYQArchived);
router.delete('/pyqs/:id', deletePYQ);
router.get('/rewards', getRewards);
router.post('/rewards', createReward);
router.patch('/rewards/:id', updateReward);
router.patch('/rewards/:id/archive', setRewardArchived);
router.get('/dashboard-stats', getDashboardStats);

router.get('/questions', getQuestions);
router.post('/questions', createQuestion);
router.delete('/questions/:id', deleteQuestion);

module.exports = router;
