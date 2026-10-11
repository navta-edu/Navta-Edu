const mongoose = require('mongoose');

const CurriculumClassSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

CurriculumClassSchema.index({ code: 1 }, { unique: true });
CurriculumClassSchema.index({ name: 1 }, { unique: true });
module.exports = mongoose.model('CurriculumClass', CurriculumClassSchema);
