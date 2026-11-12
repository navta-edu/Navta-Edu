
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Streak = require('../models/Streak');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { isPortalTestEmail, isPortalTestRole, provisionPortalTestUser } = require('../services/portalTest');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const getSignedToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '30d' }
  );
};

// Send authentication response
const sendTokenResponse = (user, statusCode, res) => {
  const token = getSignedToken(user._id);

  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isProfileComplete: user.isProfileComplete,
      classLevel: user.classLevel || ''
    }
  });
};

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      stream,
      classLevel,
      qualification,
      bio
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    if ((role !== undefined && !isPortalTestRole(role)) || isPortalTestEmail(email)) {
      return res.status(400).json({ success: false, message: 'Select a valid account type and email.' });
    }

    if (role === 'student' && !classLevel) {
      return res.status(400).json({
        success: false,
        message: 'Please select your class'
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      classLevel: (role || 'student') === 'student'
        ? (classLevel || '')
        : ''
    });

    if (user.role === 'student') {
      await Student.create({
        user: user._id,
        stream: stream || 'General'
      });

      await Streak.create({
        user: user._id,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date()
      });
    } else if (user.role === 'teacher') {
      await Teacher.create({
        user: user._id,
        qualification: qualification || 'Qualified Educator',
        bio: bio || '',
        subjects: []
      });
    }

    return sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, classLevel } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || user.portalTestOwner || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Save a selected class if provided by the login page.
    // If none is provided, retain the class already saved on the account.
    if (user.role === 'student' && classLevel) {
      user.classLevel = classLevel;
      await user.save();
    }

    if (user.role === 'student') {
      const streak = await Streak.findOne({ user: user._id });

      if (streak) {
        const today = new Date();
        const lastActive = new Date(streak.lastActiveDate);
        const diffTime = Math.abs(today - lastActive);
        const diffDays = Math.ceil(
          diffTime / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          streak.currentStreak += 1;
          streak.longestStreak = Math.max(
            streak.currentStreak,
            streak.longestStreak
          );
          streak.lastActiveDate = today;
          await streak.save();
        } else if (diffDays > 1) {
          streak.currentStreak = 1;
          streak.lastActiveDate = today;
          await streak.save();
        }
      }
    }

    return sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const user = req.user;

    let profile = null;
    let streak = null;

    if (user.role === 'student') {
      profile = await Student.findOne({
        user: user._id
      }).populate('rewardsRedeemed.reward');

      streak = await Streak.findOne({ user: user._id });
    } else if (user.role === 'teacher') {
      profile = await Teacher.findOne({ user: user._id });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
        classLevel: user.classLevel || ''
      },
      profile,
      streak,
      ...(req.portalTest ? { portalTest: { role: req.portalTest.role } } : {})
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.startPortalTest = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { role } = req.body || {};
  if (!isPortalTestRole(role)) {
    return res.status(400).json({ success: false, message: 'Select Student or Educator.' });
  }
  try {
    await provisionPortalTestUser(req.user._id, role);
    return res.json({ success: true, role });
  } catch (error) {
    console.error('Unable to prepare portal test profile:', error.name, error.code);
    return res.status(500).json({ success: false, message: 'Unable to open the test portal. Please try again.' });
  }
};

// @route POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.portalTestOwner) {
      return res.status(404).json({
        success: false,
        message: 'User with this email does not exist'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reset password link sent (simulated)'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// @route POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { credential, classLevel } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google authentication is not configured on the server'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google account information'
      });
    }

    const {
      sub: googleId,
      email,
      name,
      picture
    } = payload;

    let user = await User.findOne({
      $or: [{ googleId }, { email }]
    });

    if (user?.portalTestOwner || isPortalTestEmail(email)) {
      return res.status(401).json({ success: false, message: 'Google authentication failed' });
    }

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;

      if (classLevel && user.role === 'student') {
        user.classLevel = classLevel;
      }

      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || '',
        role: 'student',
        classLevel: classLevel || '',
        isVerified: true
      });

      await Student.create({
        user: user._id,
        stream: 'General'
      });

      await Streak.create({
        user: user._id,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date()
      });
    }

    return sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Google authentication error:', err.message);

    return res.status(401).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
};

// @route PUT /api/auth/complete-profile
exports.completeProfile = async (req, res) => {
  try {
    const {
      role,
      stream,
      classLevel,
      department,
      schoolName,
      address
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (role !== undefined && role !== user.role) {
      if (!isPortalTestRole(role) || !isPortalTestRole(user.role)) {
        return res.status(403).json({ success: false, message: 'This account type cannot be changed here.' });
      }
      user.role = role;
    }
    if (stream) user.stream = stream;
    if (classLevel) user.classLevel = classLevel;
    if (department) user.department = department;
    if (schoolName) user.schoolName = schoolName;
    if (address) user.address = address;

    if (user.role === 'student') {
      const existingStudent = await Student.findOne({
        user: user._id
      });

      if (!existingStudent) {
        await Student.create({
          user: user._id,
          stream: stream || 'General'
        });
      } else if (stream) {
        existingStudent.stream = stream;
        await existingStudent.save();
      }
    } else if (user.role === 'teacher') {
      const existingTeacher = await Teacher.findOne({
        user: user._id
      });

      if (!existingTeacher) {
        await Teacher.create({
          user: user._id,
          qualification: 'Qualified Educator',
          bio: '',
          subjects: []
        });
      }
    }

    user.isProfileComplete = true;
    await user.save();

    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
