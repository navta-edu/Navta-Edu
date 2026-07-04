const express = require('express');
const { submitTest, getResults, getResultDetail, getAnalytics, redeemReward, getLeaderboard, getRewards } = require('../controllers/studentController');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

router.post('/tests/:testId/submit', authorizeRoles('student'), submitTest);
router.get('/results', getResults);
router.get('/results/:resultId', getResultDetail);
router.get('/analytics', authorizeRoles('student'), getAnalytics);
router.get('/rewards', authorizeRoles('student'), getRewards);
router.post('/rewards/:rewardId/redeem', authorizeRoles('student'), redeemReward);
router.get('/leaderboard', authorizeRoles('student'), getLeaderboard);

module.exports = router;
