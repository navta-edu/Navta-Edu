const AdminActivity = require('../models/AdminActivity');

async function recordAdminActivity(user, action, resource, resourceId) {
  if (user?.role !== 'admin') return;

  try {
    await AdminActivity.create({
      actor: user._id || user.id,
      actorName: user.name || 'Administrator',
      action,
      resource,
      resourceId
    });
  } catch (error) {
    // The underlying action has already succeeded. Keep its response accurate.
    console.error('Failed to record admin activity:', error.name, error.code);
  }
}

module.exports = { recordAdminActivity };
