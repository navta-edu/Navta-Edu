const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isPortalTestRole, isPortalTestRouteAllowed } = require('../services/portalTest');

// Protect routes - Verify Token
exports.protect = async (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const token = req.get('Authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1];
  const secret = process.env.JWT_SECRET;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
  if (!secret) {
    return res.status(503).json({ success: false, message: 'Sign-in is temporarily unavailable.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
  if (typeof decoded?.id !== 'string' || !/^[0-9a-f]{24}$/i.test(decoded.id)) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const account = await User.findById(decoded.id);
    if (!account || account.portalTestOwner) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = account;
    const role = req.get('X-Navta-Portal-Test');
    if (role !== undefined) {
      const testUser = account.role === 'admin' && isPortalTestRole(role)
        ? await User.findOne({ portalTestOwner: account._id, role })
        : null;
      if (!testUser) {
        return res.status(403).json({
          success: false,
          code: 'PORTAL_TEST_UNAVAILABLE',
          message: 'Portal testing is available only to System Admin.'
        });
      }
      if (!isPortalTestRouteAllowed(role, req.method, req.originalUrl)) {
        return res.status(403).json({
          success: false,
          code: 'PORTAL_TEST_READ_ONLY',
          message: 'This action is unavailable in the test portal.'
        });
      }
      req.portalTest = { role, ownerId: account._id };
      req.user = testUser;
    }
  } catch (error) {
    console.error('Unable to load authenticated account:', error.name);
    return res.status(503).json({ success: false, message: 'Sign-in is temporarily unavailable.' });
  }
  next();
};

// Grant access to specific roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};
