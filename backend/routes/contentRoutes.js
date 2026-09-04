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
  "../config/navtachapters"
);

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
  (req, res) => {
    try {
      const subjects =
        chapterConfig
          .getSubjectNames()
          .map(
            (
              name,
              index
            ) => ({
              _id:
                `navta-subject-${index + 1}`,

              name,

              // Make Maths friendly to pages
              // expecting Mathematics.
              displayName:
                name === "Maths"
                  ? "Mathematics"
                  : name
            })
          );

      return res.status(200).json({
        success:
          true,

        count:
          subjects.length,

        data:
          subjects,

        subjects
      });
    } catch (error) {
      console.error(
        "NAVTA subject config error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Unable to load NAVTA subjects."
      });
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
  (req, res) => {
    try {
      const subject =
        cleanString(
          req.query.subject
        );

      const classLevel =
        cleanString(
          req.query.classLevel ||
          req.query.className ||
          req.query.class
        );

      // ---------------------------------------
      // Validate subject when provided
      // ---------------------------------------

      if (subject) {
        const normalizedSubject =
          chapterConfig
            .normalizeSubjectName(
              subject
            );

        if (!normalizedSubject) {
          return res.status(400).json({
            success:
              false,

            message:
              `Invalid subject: ${subject}`,

            data:
              []
          });
        }
      }

      // ---------------------------------------
      // Validate class when provided
      // ---------------------------------------

      if (classLevel) {
        const normalizedClass =
          chapterConfig
            .normalizeClassName(
              classLevel
            );

        if (!normalizedClass) {
          return res.status(400).json({
            success:
              false,

            message:
              `Invalid class: ${classLevel}`,

            data:
              []
          });
        }
      }

      const chapterList =
        chapterConfig
          .getStructuredChapters(
            subject,
            classLevel
          );

      return res.status(200).json({
        success:
          true,

        count:
          chapterList.length,

        subject:
          subject ||
          "All",

        classLevel:
          classLevel ||
          "All",

        data:
          chapterList,

        chapters:
          chapterList
      });
    } catch (error) {
      console.error(
        "NAVTA chapter config error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Unable to load NAVTA chapters.",

        data:
          []
      });
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
