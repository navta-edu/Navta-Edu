const mongoose = require('mongoose');
const CurriculumClass = require('../models/CurriculumClass');
const PreparationMethod = require('../models/PreparationMethod');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');

const slugCode = (value) => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const sendError = (res, error) => res.status(error.code === 11000 ? 409 : 400).json({ success: false, message: error.code === 11000 ? 'A curriculum item with this name or code already exists.' : error.message });

exports.listClasses = async (req, res) => {
  try {
    const [items, legacy] = await Promise.all([
      CurriculumClass.find({ isActive: true }).sort({ name: 1 }).lean(),
      Chapter.distinct('classLevel')
    ]);
    const names = new Set(items.map(x => x.name.toLowerCase()));
    const merged = [...items, ...legacy.filter(Boolean).filter(n => !names.has(String(n).toLowerCase())).map(name => ({ _id: null, name, code: slugCode(name), isActive: true, legacy: true }))];
    res.json({ success: true, data: merged });
  } catch (error) { sendError(res, error); }
};

exports.createClass = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Class name is required.' });
    const item = await CurriculumClass.create({ name, code: slugCode(req.body.code || name), description: req.body.description || '' });
    res.status(201).json({ success: true, data: item });
  } catch (error) { sendError(res, error); }
};

exports.updateClass = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.code !== undefined || req.body.name !== undefined) updates.code = slugCode(req.body.code || req.body.name);
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
    const item = await CurriculumClass.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, data: item });
  } catch (error) { sendError(res, error); }
};

exports.listPreparationMethods = async (req, res) => {
  try {
    const [items, legacy] = await Promise.all([
      PreparationMethod.find({ isActive: true }).populate('classes', 'name code').sort({ name: 1 }).lean(),
      Chapter.distinct('examination')
    ]);
    const names = new Set(items.map(x => x.name.toLowerCase()));
    const merged = [...items, ...legacy.filter(Boolean).filter(n => !names.has(String(n).toLowerCase())).map(name => ({ _id: null, name, code: slugCode(name), classes: [], isActive: true, legacy: true }))];
    res.json({ success: true, data: merged });
  } catch (error) { sendError(res, error); }
};

exports.createPreparationMethod = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Preparation method name is required.' });
    const classes = Array.isArray(req.body.classes) ? req.body.classes.filter(mongoose.isValidObjectId) : [];
    const item = await PreparationMethod.create({ name, code: slugCode(req.body.code || name), description: req.body.description || '', classes });
    res.status(201).json({ success: true, data: item });
  } catch (error) { sendError(res, error); }
};

exports.updatePreparationMethod = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.code !== undefined || req.body.name !== undefined) updates.code = slugCode(req.body.code || req.body.name);
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (Array.isArray(req.body.classes)) updates.classes = req.body.classes.filter(mongoose.isValidObjectId);
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
    const item = await PreparationMethod.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Preparation method not found.' });
    res.json({ success: true, data: item });
  } catch (error) { sendError(res, error); }
};

exports.listSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: { $ne: false } }).populate('classes', 'name code').populate('preparationMethods', 'name code').sort({ name: 1 }).lean();
    res.json({ success: true, data: subjects });
  } catch (error) { sendError(res, error); }
};

exports.updateSubjectLinks = async (req, res) => {
  try {
    const { classes, preparationMethods } = req.body;
    const updates = {};
    if (Array.isArray(classes)) updates.classes = classes.filter(mongoose.isValidObjectId);
    if (Array.isArray(preparationMethods)) updates.preparationMethods = preparationMethods.filter(mongoose.isValidObjectId);
    const subject = await Subject.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('classes', 'name code').populate('preparationMethods', 'name code');
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    res.json({ success: true, data: subject });
  } catch (error) { sendError(res, error); }
};
