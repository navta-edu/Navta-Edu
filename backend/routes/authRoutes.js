const express = require('express');
const { register, login, getMe, verifyEmail, forgotPassword, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.post('/verify-email', protect, verifyEmail);
router.post('/forgot-password', forgotPassword);

module.exports = router;
