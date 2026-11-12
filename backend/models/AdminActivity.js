const mongoose = require('mongoose');

const adminActivitySchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now }
});

adminActivitySchema.index({ createdAt: -1, _id: -1 });

module.exports = mongoose.model('AdminActivity', adminActivitySchema);
