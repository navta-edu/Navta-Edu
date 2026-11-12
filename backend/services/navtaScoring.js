const { createHash } = require("node:crypto");

const DEFAULT_SCORING_POLICY = Object.freeze({
  correctMarks: 1,
  incorrectPenalty: 0,
  partialCredit: false,
});

const SCORING_EXAMS = ["Boards", "NEET", "JEE"];

function readScoringPolicy(input) {
  const { correctMarks, incorrectPenalty, partialCredit } = input ?? {};
  if (
    !Number.isFinite(correctMarks) || correctMarks < 0.01 || correctMarks > 100 ||
    !Number.isFinite(incorrectPenalty) || incorrectPenalty < 0 || incorrectPenalty > correctMarks ||
    roundMarks(correctMarks) !== correctMarks || roundMarks(incorrectPenalty) !== incorrectPenalty ||
    typeof partialCredit !== "boolean"
  ) {
    return null;
  }

  return { correctMarks, incorrectPenalty, partialCredit };
}

function writtenAnswerDigest(answer) {
  return createHash("sha256").update(typeof answer === "string" ? answer.trim() : "").digest("hex");
}

function snapshotQuestion(question) {
  return {
    questionId: String(question._id),
    questionType: question.questionType,
    chapter: question.chapter,
    difficulty: question.difficulty,
    answerMode: question.answerMode ?? "single",
    correctAnswer: question.correctAnswer,
    correctAnswers: question.correctAnswers,
    numericAnswer: question.numericAnswer,
    maxMarks: question.maxMarks,
    ...(question.questionType !== "mcq" && {
      question: question.question,
      modelAnswer: question.modelAnswer,
      keyPoints: question.keyPoints,
      evaluationInstructions: question.evaluationInstructions,
      explanation: question.explanation,
    }),
  };
}

function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function roundMarks(marks) {
  return Math.round(marks * 100) / 100;
}

function gradeObjective(question, response, policy) {
  const maximumMarks = policy.correctMarks;
  const blank = response == null || (typeof response === "string" && !response.trim()) ||
    (Array.isArray(response) && response.length === 0);
  if (blank) return { awardedMarks: 0, maximumMarks, isCorrect: false };

  if (question.answerMode === "multiple") {
    const expected = new Set(question.correctAnswers);
    const chosen = Array.isArray(response) ? new Set(response) : new Set();
    const isSubset = chosen.size > 0 && chosen.size === response.length &&
      [...chosen].every((option) => expected.has(option));
    const isCorrect = isSubset && chosen.size === expected.size;
    const fraction = isSubset && policy.partialCredit ? chosen.size / expected.size : 0;
    const awardedMarks = isCorrect
      ? maximumMarks
      : fraction ? roundMarks(maximumMarks * fraction) : -policy.incorrectPenalty;
    return { awardedMarks, maximumMarks, isCorrect };
  }

  const number = parseNumber(response);
  const isCorrect = question.answerMode === "numeric"
    ? number !== null && Number.isFinite(question.numericAnswer?.value) &&
      Math.abs(number - question.numericAnswer.value) <= question.numericAnswer.tolerance
    : number !== null && number === question.correctAnswer;
  return {
    awardedMarks: isCorrect ? maximumMarks : -policy.incorrectPenalty,
    maximumMarks,
    isCorrect,
  };
}

function gradeQuestion(question, submitted, policy, writtenGrade) {
  if (question.questionType === "mcq") {
    const response = submitted.selectedAnswer ?? submitted.selectedOption;
    return gradeObjective(question, response, policy);
  }

  const maximumMarks = Number.isFinite(question.maxMarks) && question.maxMarks >= 1
    ? question.maxMarks
    : 1;
  const digest = writtenAnswerDigest(submitted.textAnswer);
  const score = writtenGrade?.answerDigest === digest
    ? writtenGrade.evaluation?.marksAwarded
    : 0;
  const awardedMarks = Number.isFinite(score) ? Math.max(0, Math.min(maximumMarks, score)) : 0;
  return { awardedMarks, maximumMarks, isCorrect: awardedMarks >= maximumMarks };
}

function selectQuestionUnits(groups, singles, count) {
  const choices = Array(count + 1).fill(null);
  choices[0] = [];
  for (const group of groups) {
    for (let size = count; size >= group.length; size -= 1) {
      if (!choices[size] && choices[size - group.length]) {
        choices[size] = [...choices[size - group.length], group];
      }
    }
  }

  // Keep whole case studies together while filling any remaining slots with standalone questions.
  for (let size = count; size >= 0; size -= 1) {
    if (choices[size] && count - size <= singles.length) {
      return [...choices[size].flat(), ...singles.slice(0, count - size)];
    }
  }
  return [];
}

module.exports = {
  DEFAULT_SCORING_POLICY,
  SCORING_EXAMS,
  gradeQuestion,
  parseNumber,
  readScoringPolicy,
  roundMarks,
  selectQuestionUnits,
  snapshotQuestion,
  writtenAnswerDigest,
};
