const express = require('express');
const { getUsers, createUser, updateUser, deleteUser, createSubject, deleteSubject, deleteChapter, deleteNote, deletePYQ, createReward, getDashboardStats, updateStudentProfile } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);
router.put('/students/:userId', updateStudentProfile);
router.delete('/users/:userId', deleteUser);
router.post('/subjects', createSubject);
router.delete('/subjects/:id', deleteSubject);
router.delete('/chapters/:id', deleteChapter);
router.delete('/notes/:id', deleteNote);
router.delete('/pyqs/:id', deletePYQ);
router.post('/rewards', createReward);
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;
