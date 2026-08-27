// =====================================================
// TEMPORARY FIX FOR navtaTestController.js
// =====================================================
// REPLACE THE TOP OF YOUR FILE WITH THIS:
//
// IMPORTANT:
// Do NOT require navtaFileExtractor or navtaQuestionAI
// until Hostinger dependencies are fixed.

const NavtaQuestion = require("../models/NavtaQuestion");

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
