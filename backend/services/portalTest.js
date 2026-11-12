const { Types } = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const portalTestRoles = new Set(['student', 'teacher']);
const portalTestEmailDomain = 'portal-test.example.net';

// Public curriculum and content reads are handled by their existing routes.
// Protected preview routes must be approved explicitly, including their method.
const sharedRoutes = [
  ['GET', '/api/auth/me'],
  ['GET', /^\/api\/content\/tests\/[0-9a-fA-F]{24}$/]
];
const teacherRoutes = [
  ['GET', '/api/teacher/question-bank'],
  ['GET', '/api/teacher/questions'],
  ['GET', '/api/teacher/student-metrics']
];
const studentRoutes = [
  ['GET', '/api/student/results'],
  ['GET', /^\/api\/student\/results\/[0-9a-fA-F]{24}$/],
  ['GET', '/api/student/analytics'],
  ['GET', '/api/student/rewards'],
  ['GET', '/api/student/leaderboard'],
  ['POST', /^\/api\/student\/tests\/[0-9a-fA-F]{24}\/submit$/],
  ['POST', '/api/navta-test/generate'],
  ['POST', '/api/navta-test/boss-battle'],
  ['POST', '/api/navta-test/revenge-battle'],
  ['POST', '/api/navta-test/complete'],
  ['POST', '/api/navta-test/evaluate-answer'],
  ['GET', '/api/mistake-notebook'],
  ['POST', '/api/mistake-notebook'],
  ['GET', '/api/mistake-notebook/stats'],
  ['GET', /^\/api\/mistake-notebook\/[0-9a-fA-F]{24}$/],
  ['PUT', /^\/api\/mistake-notebook\/[0-9a-fA-F]{24}\/(note|mastered|review)$/],
  ['DELETE', /^\/api\/mistake-notebook\/[0-9a-fA-F]{24}$/],
  ['GET', '/api/panic-mode/plan'],
  ['POST', '/api/panic-mode/plan'],
  ['DELETE', '/api/panic-mode/plan'],
  ['PATCH', /^\/api\/panic-mode\/chapters\/[0-9a-fA-F]{24}$/],
  ['POST', /^\/api\/panic-mode\/chapters\/[0-9a-fA-F]{24}\/practice(\/(check|complete))?$/],
  ['POST', /^\/api\/panic-mode\/chapters\/[0-9a-fA-F]{24}\/fix-test\/(start|submit)$/]
];

function isPortalTestRole(role) {
  return portalTestRoles.has(role);
}

function isPortalTestEmail(email) {
  return typeof email === 'string' &&
    email.trim().toLowerCase().endsWith('@' + portalTestEmailDomain);
}

function isPortalTestRouteAllowed(role, method, originalUrl) {
  if (!isPortalTestRole(role)) return false;

  const path = originalUrl.split('?')[0].replace(/\/$/, '');
  const routes = role === 'student' ? studentRoutes : teacherRoutes;
  return [...sharedRoutes, ...routes].some(([allowedMethod, allowedPath]) =>
    method === allowedMethod &&
    (typeof allowedPath === 'string' ? path === allowedPath : allowedPath.test(path))
  );
}

async function provisionPortalTestUser(ownerId, role) {
  // Wait for the partial unique index before a possible concurrent creation.
  await User.init();
  const identity = { portalTestOwner: ownerId, role };
  let user = await User.findOne(identity);

  if (!user) {
    const id = new Types.ObjectId();
    try {
      user = await User.create({
        ...identity,
        _id: id,
        name: role === 'student' ? 'Test Student' : 'Test Educator',
        email: id.toString() + '@' + portalTestEmailDomain,
        classLevel: role === 'student' ? 'Class 12' : '',
        isProfileComplete: true,
        isVerified: true
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      user = await User.findOne(identity);
      if (!user) throw error;
    }
  }

  // The profile ID is stable so simultaneous starts cannot create duplicates.
  const profileModel = role === 'student' ? Student : Teacher;
  const profile = {
    user: user._id,
    portalTestOwner: ownerId,
    ...(role === 'student' ? { stream: 'Science' } : { qualification: 'Test Educator' })
  };
  await profileModel.updateOne(
    { _id: user._id },
    { $setOnInsert: profile },
    { upsert: true, runValidators: true }
  );
}

module.exports = {
  isPortalTestEmail,
  isPortalTestRole,
  isPortalTestRouteAllowed,
  provisionPortalTestUser
};
