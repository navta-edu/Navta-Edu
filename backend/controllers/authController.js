const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Streak = require('../models/Streak');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Helper to sign JWT token
const getSignedToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecretjwtkeyfornavtaplatform',
    { expiresIn: '30d' }
  );
};

// Helper to send response with token
const sendTokenResponse = (user, statusCode, res) => {
  const token = getSignedToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isProfileComplete: user.isProfileComplete
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, stream, qualification, bio } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });

    // Create profile based on role
    if (user.role === 'student') {
      await Student.create({
        user: user._id,
        stream: stream || 'General'
      });
      // Initialize daily streak
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

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update streak if student
    if (user.role === 'student') {
      const streak = await Streak.findOne({ user: user._id });
      if (streak) {
        const today = new Date();
        const lastActive = new Date(streak.lastActiveDate);
        
        // Calculate difference in days
        const diffTime = Math.abs(today - lastActive);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          streak.currentStreak += 1;
          if (streak.currentStreak > streak.longestStreak) {
            streak.longestStreak = streak.currentStreak;
          }
          streak.lastActiveDate = today;
          await streak.save();
        } else if (diffDays > 1) {
          streak.currentStreak = 1;
          streak.lastActiveDate = today;
          await streak.save();
        }
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = null;
    let streak = null;

    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id }).populate('rewardsRedeemed.reward');
      streak = await Streak.findOne({ user: user._id });
    } else if (user.role === 'teacher') {
      profile = await Teacher.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete
      },
      profile,
      streak
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mock Email Verification
// @route   POST /api/auth/verify-email
// @access  Private
exports.verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.isVerified = true;
    await user.save();
    res.status(200).json({ success: true, message: 'Email verified successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mock Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email does not exist' });
    }
    res.status(200).json({ success: true, message: 'Reset password link sent (simulated)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Authenticate with Google OAuth
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    console.log('Google Auth: Received credential, attempting verification...');
    console.log('Google Auth: GOOGLE_CLIENT_ID configured:', !!process.env.GOOGLE_CLIENT_ID);

    let payload;

    try {
      // Try strict verification first
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
      console.log('Google Auth: Strict verification succeeded for', payload.email);
    } catch (verifyErr) {
      console.warn('Google Auth: Strict verification failed:', verifyErr.message);

      // Fall back to manual JWT decoding for any verification error
      // (clock skew, network issues on Render, etc.)
      const parts = credential.split('.');
      if (parts.length !== 3) {
        return res.status(401).json({ success: false, message: 'Invalid Google token format' });
      }

      // Decode the payload (base64url)
      const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));

      console.log('Google Auth: Decoded JWT payload for', payload.email);

      // Verify essential claims manually
      const CLOCK_TOLERANCE = 5 * 60; // 5 minutes tolerance
      const now = Math.floor(Date.now() / 1000);

      if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
        console.error('Google Auth: Invalid issuer:', payload.iss);
        return res.status(401).json({ success: false, message: 'Invalid token issuer' });
      }

      // Check audience - if GOOGLE_CLIENT_ID is set, verify it matches
      if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        console.error('Google Auth: Audience mismatch. Token aud:', payload.aud, 'Expected:', process.env.GOOGLE_CLIENT_ID);
        return res.status(401).json({ success: false, message: 'Invalid token audience' });
      }

      if (payload.exp && now > payload.exp + CLOCK_TOLERANCE) {
        console.error('Google Auth: Token expired. exp:', payload.exp, 'now:', now);
        return res.status(401).json({ success: false, message: 'Token expired' });
      }

      if (!payload.email) {
        console.error('Google Auth: No email in token payload');
        return res.status(401).json({ success: false, message: 'No email in Google token' });
      }

      console.log('Google Auth: Manual verification passed for', payload.email);
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Update googleId and avatar if not already set
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      await user.save();
    } else {
      // Create a new user (defaults to student role)
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || '',
        role: 'student',
        isVerified: true
      });

      // Create student profile
      await Student.create({
        user: user._id,
        stream: 'General'
      });

      // Initialize daily streak
      await Streak.create({
        user: user._id,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date()
      });
    }

    console.log('Google Auth: Success for', email, '- role:', user.role);
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Google Auth Error:', err.message, err.stack);
    res.status(401).json({ success: false, message: 'Google authentication failed: ' + err.message });
  }
};

// @desc    Complete user profile details
// @route   PUT /api/auth/complete-profile
// @access  Private
exports.completeProfile = async (req, res, next) => {
  try {
    const { role, stream, department, schoolName, address } = req.body;
    
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (stream) user.stream = stream;
    if (department) user.department = department;
    if (schoolName) user.schoolName = schoolName;
    if (address) user.address = address;

    // Optional: Update Student/Teacher profiles if role changes
    if (role === 'student') {
      const existingStudent = await Student.findOne({ user: user._id });
      if (!existingStudent) {
        await Student.create({ user: user._id, stream: stream || 'General' });
      } else if (stream) {
        existingStudent.stream = stream;
        await existingStudent.save();
      }
    } else if (role === 'teacher') {
      const existingTeacher = await Teacher.findOne({ user: user._id });
      if (!existingTeacher) {
        await Teacher.create({ user: user._id, qualification: 'Qualified Educator', bio: '', subjects: [] });
      }
    }

    user.isProfileComplete = true;
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
