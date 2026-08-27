// IMPORTANT:
// At the TOP of navtaTestController.js keep:

const NavtaQuestion = require("../models/NavtaQuestion");

// TEMPORARY RECOVERY MODE:
// DO NOT load these right now:
//
// const {
//   extractTextFromNavtaFile,
// } = require("../services/navtaFileExtractor");
//
// const {
//   analyzeNavtaQuestions,
// } = require("../services/navtaQuestionAI");
//
// This prevents Hostinger from loading mammoth/openai
// while the dependencies are not deployed.

// ============================================
// TEST RULES
// ============================================

const TEST_RULES = {
  NEET: {
    mcq: {
      minutesPerQuestion: 1,
      durations: [10, 15, 20, 30, 45, 60],
    },
  },

  JEE: {
    mcq: {
      minutesPerQuestion: 2,
      durations: [10, 20, 30, 40, 60, 90],
    },
  },

  Boards: {
    mcq: {
      minutesPerQuestion: 1,
      durations: [10, 15, 20, 30, 45, 60],
    },

    short: {
      minutesPerQuestion: 3,
      durations: [15, 30, 45, 60, 90],
    },

    long: {
      minutesPerQuestion: 6,
      durations: [30, 60, 90, 120, 180],
    },
  },
};

// ============================================
// KEEP ALL OF YOUR EXISTING FUNCTIONS HERE
// ============================================
//
// Keep your existing:
// createQuestion
// getQuestions
// deleteQuestion
// generateTest
// evaluateWrittenAnswer
//
// unchanged.

// ============================================
// TEMPORARY AI IMPORT FUNCTIONS
// ============================================

exports.importQuestionsWithAI = async (req, res) => {
  return res.status(503).json({
    success: false,
    message:
      "AI question file import is temporarily disabled while deployment dependencies are being fixed.",
  });
};

exports.confirmAIImport = async (req, res) => {
  return res.status(503).json({
    success: false,
    message:
      "AI question file import is temporarily disabled while deployment dependencies are being fixed.",
  });
};
