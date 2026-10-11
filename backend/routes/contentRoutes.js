const express = require("express");

const {
  getSubjects,
  getChapters,
  getNotes,
  getPYQs,
  getTests,
  getTestDetail
} = require(
  "../controllers/contentController"
);

const {
  protect
} = require(
  "../middleware/auth"
);

// =====================================================
// NAVTA MASTER CHAPTER CONFIG
// =====================================================

const chapterConfig = require(
  "../config/navtaChapters"
);

const Subject = require("../models/Subject");
const Chapter = require("../models/Chapter");

const router =
  express.Router();

// =====================================================
// HELPER
// =====================================================

const cleanString = (
  value = ""
) => {
  return String(
    value ?? ""
  ).trim();
};

// =====================================================
// EXISTING CONTENT ROUTES
// =====================================================

router.get(
  "/subjects",
  getSubjects
);

router.get(
  "/subjects/:subjectId/chapters",
  getChapters
);

router.get(
  "/chapters/:chapterId/notes",
  getNotes
);

router.get(
  "/subjects/:subjectId/pyqs",
  getPYQs
);

router.get(
  "/subjects/:subjectId/tests",
  getTests
);

router.get(
  "/tests/:testId",
  protect,
  getTestDetail
);

// =====================================================
// NAVTA MASTER SUBJECTS
// =====================================================
//
// GET:
//
// /api/content/navta-subjects
//
// Returns the same subjects used by NAVTA Test.
// =====================================================

router.get(
  "/navta-subjects",
  async (req, res) => {
    try {
      const staticNames = chapterConfig.getSubjectNames();
      const databaseSubjects = await Subject.find({ isActive: { $ne: false } }).select('_id name code category classes preparationMethods').populate('classes', 'name code').populate('preparationMethods', 'name code').sort({ name: 1 }).lean();
      const byName = new Map();
      staticNames.forEach((name, index) => byName.set(String(name).toLowerCase(), {
        _id: `navta-subject-${index + 1}`,
        name,
        displayName: name === 'Maths' ? 'Mathematics' : name,
        legacy: true
      }));
      databaseSubjects.forEach((subject) => byName.set(String(subject.name).toLowerCase(), {
        ...byName.get(String(subject.name).toLowerCase()),
        ...subject,
        displayName: subject.name === 'Maths' ? 'Mathematics' : subject.name,
        legacy: false
      }));
      const subjects = [...byName.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
      return res.status(200).json({ success: true, count: subjects.length, data: subjects, subjects });
    } catch (error) {
      console.error('NAVTA subject list error:', error);
      return res.status(500).json({ success: false, message: 'Unable to load NAVTA subjects.', data: [], subjects: [] });
    }
  }
);

// =====================================================
// NAVTA MASTER CHAPTERS
// =====================================================
//
// This is the important new endpoint.
//
// Examples:
//
// GET
// /api/content/navta-chapters
//
// GET
// /api/content/navta-chapters?subject=Physics
//
// GET
// /api/content/navta-chapters?subject=Physics&classLevel=Class%2011
//
// GET
// /api/content/navta-chapters?subject=Maths&classLevel=Class%2012
//
// Study Notes should use THIS endpoint.
//
// Therefore the exact chapters used by NAVTA Test
// automatically become available to Study Notes.
// =====================================================

router.get(
  "/navta-chapters",
  async (req, res) => {
    try {
      const subjectInput = cleanString(req.query.subject);
      const classLevel = cleanString(req.query.classLevel || req.query.className || req.query.class);
      const examination = cleanString(req.query.examination || req.query.exam || req.query.preparation);

      let databaseSubject = null;
      if (subjectInput) {
        if (/^[a-f\d]{24}$/i.test(subjectInput)) databaseSubject = await Subject.findById(subjectInput).lean();
        if (!databaseSubject) databaseSubject = await Subject.findOne({ name: { $regex: `^${subjectInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }).lean();
      }

      const dbQuery = {};
      if (databaseSubject) dbQuery.subject = databaseSubject._id;
      else if (subjectInput) {
        // Legacy static subjects are still served from chapterConfig; a custom subject with no DB match has no DB chapters.
        dbQuery.subject = { $exists: false };
      }
      if (classLevel) dbQuery.classLevel = classLevel;
      if (examination) dbQuery.examination = examination;

      let dbChapters = [];
      if (databaseSubject || !subjectInput) {
        dbChapters = await Chapter.find(dbQuery).populate('subject', 'name code').sort({ title: 1 }).lean();
      }

      let staticChapters = [];
      try {
        staticChapters = chapterConfig.getStructuredChapters(subjectInput && databaseSubject ? databaseSubject.name : subjectInput, classLevel) || [];
      } catch (_) {
        staticChapters = [];
      }

      const normalize = (item, index, source) => {
        const title = typeof item === 'string' ? item : (item?.title || item?.name || item?.chapter || '');
        if (!String(title).trim()) return null;
        return {
          ...(typeof item === 'object' && item ? item : {}),
          _id: item?._id || item?.id || `${source}-${index}-${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          id: item?._id || item?.id || `${source}-${index}-${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          title: String(title).trim(),
          name: String(title).trim(),
          subject: item?.subject?.name || item?.subject || databaseSubject?.name || subjectInput || '',
          classLevel: item?.classLevel || classLevel || '',
          examination: item?.examination || examination || '',
          source
        };
      };

      const merged = [];
      const seen = new Set();
      [...dbChapters.map((item, i) => normalize(item, i, 'database')), ...staticChapters.map((item, i) => normalize(item, i, 'legacy'))].forEach((item) => {
        if (!item) return;
        const key = `${String(item.subject).toLowerCase()}|${String(item.classLevel).toLowerCase()}|${String(item.examination).toLowerCase()}|${String(item.title).toLowerCase()}`;
        if (!seen.has(key)) { seen.add(key); merged.push(item); }
      });

      return res.status(200).json({ success: true, count: merged.length, subject: subjectInput || 'All', classLevel: classLevel || 'All', data: merged, chapters: merged });
    } catch (error) {
      console.error('NAVTA chapter list error:', error);
      return res.status(500).json({ success: false, message: 'Unable to load NAVTA chapters.', data: [], chapters: [] });
    }
  }
);

// =====================================================
// NAVTA CHAPTER TREE
// =====================================================
//
// GET:
//
// /api/content/navta-chapter-tree
//
// Useful for debugging and future admin pages.
//
// Returns:
//
// Physics
//   Class 11
//   Class 12
//
// Chemistry
//   ...
//
// =====================================================

router.get(
  "/navta-chapter-tree",
  (req, res) => {
    try {
      return res.status(200).json({
        success:
          true,

        data: {
          Physics:
            chapterConfig.Physics,

          Chemistry:
            chapterConfig.Chemistry,

          Maths:
            chapterConfig.Maths,

          Biology:
            chapterConfig.Biology
        }
      });
    } catch (error) {
      console.error(
        "NAVTA chapter tree error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Unable to load chapter configuration."
      });
    }
  }
);

module.exports =
  router;
