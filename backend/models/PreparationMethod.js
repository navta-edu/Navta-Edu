const mongoose = require('mongoose');

const PreparationMethodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true, default: '' },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CurriculumClass' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

PreparationMethodSchema.index({ code: 1 }, { unique: true });
PreparationMethodSchema.index({ name: 1 }, { unique: true });
module.exports = mongoose.model('PreparationMethod', PreparationMethodSchema);
