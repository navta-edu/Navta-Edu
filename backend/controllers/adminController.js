const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Reward = require('../models/Reward');
const Result = require('../models/Result');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');

// @desc    Get all platform users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a user account
// @route   POST /api/admin/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role, isVerified: true });

    if (role === 'student') {
      await Student.create({ user: user._id });
    } else if (role === 'teacher') {
      await Teacher.create({ user: user._id, qualification: 'Qualified Educator' });
    }

    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update user details or role
// @route   PUT /api/admin/users/:userId
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { name, role, isVerified } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (isVerified !== undefined) user.isVerified = isVerified;
    
    // If role changes, check profile creation
    if (role && role !== user.role) {
      // Create student or teacher profiles if they don't already exist
      if (role === 'student') {
        const studentExists = await Student.findOne({ user: user._id });
        if (!studentExists) {
          await Student.create({ user: user._id });
        }
      } else if (role === 'teacher') {
        const teacherExists = await Teacher.findOne({ user: user._id });
        if (!teacherExists) {
          await Teacher.create({ user: user._id, qualification: 'Qualified Educator' });
        }
      }
      user.role = role;
    }

    await user.save();
    res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update student profile details
// @route   PUT /api/admin/students/:userId
// @access  Private (Admin)
exports.updateStudentProfile = async (req, res) => {
  try {
    const { coins, xp, level, stream } = req.body;
    const student = await Student.findOne({ user: req.params.userId });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    if (coins !== undefined) student.coins = coins;
    if (xp !== undefined) student.xp = xp;
    if (level !== undefined) student.level = level;
    if (stream !== undefined) student.stream = stream;

    await student.save();
    res.status(200).json({ success: true, message: 'Student profile updated', data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove profiles first
    await Student.deleteOne({ user: user._id });
    await Teacher.deleteOne({ user: user._id });
    await User.deleteOne({ _id: user._id });

    res.status(200).json({ success: true, message: 'User account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new subject category
// @route   POST /api/admin/subjects
// @access  Private (Admin)
exports.createSubject = async (req, res) => {
  try {
    const { name, code, description, category } = req.body;

    const subjectExists = await Subject.findOne({ code });
    if (subjectExists) {
      return res.status(400).json({ success: false, message: 'Subject with this code already exists' });
    }

    const subject = await Subject.create({
      name,
      code,
      description,
      category: category || 'General'
    });

    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete subject category
// @route   DELETE /api/admin/subjects/:id
// @access  Private (Admin)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    
    // Check if chapters exist, ideally we should cascade delete or throw error.
    await Subject.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete chapter
// @route   DELETE /api/admin/chapters/:id
// @access  Private (Admin)
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    
    await Chapter.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'Chapter deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete note
// @route   DELETE /api/admin/notes/:id
// @access  Private (Admin)
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    
    await Note.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete PYQ
// @route   DELETE /api/admin/pyqs/:id
// @access  Private (Admin)
exports.deletePYQ = async (req, res) => {
  try {
    const pyq = await PYQ.findById(req.params.id);
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found' });
    
    await PYQ.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'PYQ deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new reward item
// @route   POST /api/admin/rewards
// @access  Private (Admin)
exports.createReward = async (req, res) => {
  try {
    const { title, description, costCoins, badgeImage, type } = req.body;

    const rewardExists = await Reward.findOne({ title });
    if (rewardExists) {
      return res.status(400).json({ success: false, message: 'Reward item already exists' });
    }

    const reward = await Reward.create({
      title,
      description,
      costCoins,
      badgeImage,
      type
    });

    res.status(201).json({ success: true, data: reward });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get system global usage reports
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const studentsCount = await Student.countDocuments();
    const teachersCount = await Teacher.countDocuments();
    const subjectsCount = await Subject.countDocuments();
    const resultsCount = await Result.countDocuments();
    const rewardsCount = await Reward.countDocuments();

    // Average performance scoring
    const results = await Result.find();
    const totalScorePercent = results.reduce((acc, curr) => acc + curr.percentage, 0);
    const averageScore = resultsCount > 0 ? Math.round(totalScorePercent / resultsCount) : 0;

    res.status(200).json({
      success: true,
      stats: {
        studentsCount,
        teachersCount,
        subjectsCount,
        resultsCount,
        rewardsCount,
        averageScore
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
