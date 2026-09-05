// =====================================================
// NAVTA QUESTION AI - compatibility wrapper
// =====================================================
//
// Old code may still import:
//   analyzeNavtaQuestions({ text, context })
//
// The real AI implementation now lives in
// navtaAIQuestionService.js so NAVTA uses ONE provider
// and ONE normalization path.
// =====================================================

const {
  analyseTextQuestions,
} = require("./navtaAIQuestionService");

async function analyzeNavtaQuestions({
  text,
  context = {},
} = {}) {
  const questions = await analyseTextQuestions({
    text,
    hints: {
      subject: context.subject || "",
      exam: context.exam || "",
      classLevel: context.classLevel || "",
    },
  });

  const acceptedQuestions = questions.filter(
    (question) => !question.drop
  );

  const droppedQuestions = questions.filter(
    (question) => question.drop
  );

  return {
    detected: questions.length,
    acceptedCount: acceptedQuestions.length,
    droppedCount: droppedQuestions.length,
    acceptedQuestions,
    droppedQuestions,
  };
}

module.exports = {
  analyzeNavtaQuestions,
};
