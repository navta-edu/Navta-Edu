const Student = require('../models/Student');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');
const Streak = require('../models/Streak');
const Reward = require('../models/Reward');
const Achievement = require('../models/Achievement');
const User = require('../models/User');

// @desc    Submit test answers and get score
// @route   POST /api/student/tests/:testId/submit
// @access  Private
exports.submitTest = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body; // answers: [{ questionId, selectedOption }]
    const userId = req.user.id;

    const test = await Test.findById(req.params.testId).populate('questions');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    let correctCount = 0;
    const gradedAnswers = test.questions.map((q) => {
      const submitted = answers.find(a => a.questionId === q._id.toString());
      const selectedOption = submitted ? submitted.selectedOption : null;
      const isCorrect = selectedOption !== null && selectedOption === q.correctOption;
      
      if (isCorrect) correctCount++;

      return {
        question: q._id,
        selectedOption,
        isCorrect
      };
    });

    const totalQuestions = test.questions.length;
    const score = correctCount; // 1 mark per question
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const isPassed = percentage >= test.passingScore;

    // Create Result
    const result = await Result.create({
      user: userId,
      test: test._id,
      answers: gradedAnswers,
      score,
      percentage,
      timeTaken: timeTaken || 60,
      correctAnswers: correctCount,
      totalQuestions,
      isPassed
    });

    // Update Student Gamification Stats
    const student = await Student.findOne({ user: userId });
    let xpEarned = correctCount * 15; // 15 XP per correct answer
    let coinsEarned = correctCount * 5; // 5 Coins per correct answer

    if (isPassed) {
      xpEarned += 50; // passing bonus
      coinsEarned += 20; // passing bonus
    }

    if (student) {
      student.xp += xpEarned;
      student.coins += coinsEarned;
      
      // Calculate new level based on XP (e.g. 500 XP per level)
      const newLevel = Math.floor(student.xp / 500) + 1;
      const leveledUp = newLevel > student.level;
      student.level = newLevel;

      // Check for milestone Achievements
      const resultsCount = await Result.countDocuments({ user: userId });
      const activeStreak = await Streak.findOne({ user: userId });
      const currentStreakValue = activeStreak ? activeStreak.currentStreak : 0;

      // Find locked achievements
      const allAchievements = await Achievement.find();
      const currentBadgeNames = student.badges.map(b => b.name);

      for (const ach of allAchievements) {
        if (!currentBadgeNames.includes(ach.name)) {
          let meetsReq = false;
          if (ach.requirementType === 'xp' && student.xp >= ach.requirementValue) meetsReq = true;
          if (ach.requirementType === 'streak' && currentStreakValue >= ach.requirementValue) meetsReq = true;
          if (ach.requirementType === 'test_count' && resultsCount >= ach.requirementValue) meetsReq = true;

          if (meetsReq) {
            student.badges.push({
              name: ach.name,
              icon: ach.icon,
              earnedAt: new Date()
            });
            // Grant achievement bonus
            student.xp += 100;
            student.coins += 50;
          }
        }
      }

      await student.save();
    }

    res.status(201).json({
      success: true,
      data: {
        result,
        xpEarned,
        coinsEarned,
        newCoins: student ? student.coins : 0,
        newXp: student ? student.xp : 0,
        newLevel: student ? student.level : 1
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get student scorecard and test history
// @route   GET /api/student/results
// @access  Private
exports.getResults = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user.id })
      .populate({
        path: 'test',
        select: 'title type duration subject',
        populate: { path: 'subject', select: 'name' }
      })
      .sort('-createdAt');

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get student detailed scorecard
// @route   GET /api/student/results/:resultId
// @access  Private
exports.getResultDetail = async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId)
      .populate({
        path: 'test',
        populate: [
          { path: 'subject', select: 'name' },
          { path: 'questions' }
        ]
      });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result scorecard not found' });
    }

    // Ensure the student owns this result (or is teacher/admin)
    if (result.user.toString() !== req.user.id && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this scorecard' });
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get detailed subject/chapter performance analytics
// @route   GET /api/student/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const results = await Result.find({ user: userId }).populate({
      path: 'test',
      populate: { path: 'subject', select: 'name' }
    });

    // Subject performance mapping
    const subjectStats = {};
    results.forEach((res) => {
      if (!res.test || !res.test.subject) return;
      const subName = res.test.subject.name;

      if (!subjectStats[subName]) {
        subjectStats[subName] = {
          totalScore: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          testCount: 0,
          passedCount: 0
        };
      }

      subjectStats[subName].testCount += 1;
      subjectStats[subName].totalQuestions += res.totalQuestions;
      subjectStats[subName].correctAnswers += res.correctAnswers;
      if (res.isPassed) subjectStats[subName].passedCount += 1;
    });

    const parsedStats = Object.keys(subjectStats).map((name) => {
      const stats = subjectStats[name];
      const avgPercentage = stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0;
      return {
        subject: name,
        avgPercentage,
        testCount: stats.testCount,
        passedCount: stats.passedCount,
        failedCount: stats.testCount - stats.passedCount,
        strength: avgPercentage >= 75 ? 'Strong' : avgPercentage >= 45 ? 'Average' : 'Needs Focus'
      };
    });

    // Over-time score progression
    const progression = results.map(r => ({
      date: r.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: r.percentage
    })).reverse();

    // Strengths and Weaknesses recommendations
    const strongAreas = parsedStats.filter(s => s.strength === 'Strong').map(s => s.subject);
    const weakAreas = parsedStats.filter(s => s.strength === 'Needs Focus').map(s => s.subject);
    const suggestions = [];

    if (weakAreas.length > 0) {
      weakAreas.forEach(area => {
        suggestions.push(`Spend an extra 30 minutes reading chapter notes for ${area}.`);
        suggestions.push(`Attempt 5 more practice quizzes in ${area} to lift score levels.`);
      });
    } else if (parsedStats.length === 0) {
      suggestions.push("Complete your first chapter quiz to generate tailored study recommendations.");
    } else {
      suggestions.push("Excellent work! Try taking Mock Tests under time constraints to test speed.");
    }

    res.status(200).json({
      success: true,
      subjectStats: parsedStats,
      progression,
      summary: {
        strong: strongAreas,
        weak: weakAreas,
        suggestions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Redeem a store reward
// @route   POST /api/student/rewards/:rewardId/redeem
// @access  Private
exports.redeemReward = async (req, res) => {
  try {
    const userId = req.user.id;
    const reward = await Reward.findById(req.params.rewardId);

    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward item not found' });
    }

    const student = await Student.findOne({ user: userId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Check coin balance
    if (student.coins < reward.costCoins) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. This reward costs ${reward.costCoins} coins, but you only have ${student.coins}.`
      });
    }

    // Deduct coins and record redemption
    student.coins -= reward.costCoins;
    student.rewardsRedeemed.push({
      reward: reward._id,
      redeemedAt: new Date()
    });

    // Add badge if reward is digital badge
    if (reward.type === 'badge') {
      student.badges.push({
        name: reward.title,
        icon: reward.badgeImage,
        earnedAt: new Date()
      });
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: `Successfully redeemed '${reward.title}'!`,
      coinsRemaining: student.coins,
      badges: student.badges
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get gamification leaderboard
// @route   GET /api/student/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('user', 'name')
      .sort('-xp')
      .limit(10);

    const parsedLeaderboard = students.map((s, index) => ({
      rank: index + 1,
      name: s.user ? s.user.name : 'Unknown Student',
      xp: s.xp,
      level: s.level,
      badgesCount: s.badges.length
    }));

    res.status(200).json({ success: true, count: parsedLeaderboard.length, data: parsedLeaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all available store rewards
// @route   GET /api/student/rewards
// @access  Private
exports.getRewards = async (req, res) => {
  try {
    const rewards = await Reward.find();
    res.status(200).json({ success: true, count: rewards.length, data: rewards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
