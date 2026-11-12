const express = require('express');
const { register, login, getMe, verifyEmail, forgotPassword, googleAuth, completeProfile, startPortalTest } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.post('/portal-test', protect, authorizeRoles('admin'), startPortalTest);
router.post('/verify-email', protect, verifyEmail);
router.post('/forgot-password', forgotPassword);
router.put('/complete-profile', protect, completeProfile);

module.exports = router;
