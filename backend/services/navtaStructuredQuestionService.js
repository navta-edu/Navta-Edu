const { randomUUID } = require("node:crypto");

const text = (value) => typeof value === "string" ? value.trim() : "";
const isChoiceIndex = (value) => Number.isInteger(value) && value >= 0 && value <= 3;

function readNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !value.trim()) return NaN;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return NaN;
  return Number(value);
}

function objectiveQuestion(input, answerMode) {
  const question = text(input?.question);
  const explanation = text(input?.explanation);
  if (!question || !explanation) throw new Error("Enter a question and an explanation.");

  const base = { question, explanation, questionType: "mcq", answerMode };
  if (answerMode === "numeric") {
    const value = readNumber(input.numericAnswer?.value);
    const tolerance = readNumber(input.numericAnswer?.tolerance ?? 0);
    if (!Number.isFinite(value) || !Number.isFinite(tolerance) || tolerance < 0) {
      throw new Error("Enter a finite numerical answer and a nonnegative tolerance.");
    }
    return { ...base, numericAnswer: { value, tolerance } };
  }

  const options = Array.isArray(input.options) ? input.options.map(text) : [];
  if (options.length !== 4 || options.some((option) => !option) || new Set(options).size !== 4) {
    throw new Error("Enter four distinct answer choices.");
  }

  if (answerMode === "multiple") {
    const answers = input.correctAnswers;
    if (!Array.isArray(answers) || answers.length < 2 || answers.length > 4 ||
        new Set(answers).size !== answers.length || !answers.every(isChoiceIndex)) {
      throw new Error("Select at least two correct choices.");
    }
    return { ...base, options, correctAnswers: [...answers].sort((a, b) => a - b) };
  }

  if (answerMode !== "single" || !isChoiceIndex(input.correctAnswer)) {
    throw new Error("Select the correct choice.");
  }
  return { ...base, options, correctAnswer: input.correctAnswer };
}

function matchingColumn(value, labelForIndex) {
  const lines = text(value).split(/\r?\n/).map(text).filter(Boolean);
  if (lines.length < 2 || lines.length > 10) {
    throw new Error("Each column must contain between 2 and 10 entries.");
  }
  return lines.map((line, index) => ({ label: labelForIndex(index), text: line }));
}

function buildStructuredQuestions(input) {
  const { format } = input;
  if (format === "numeric" || format === "multiple") {
    return [objectiveQuestion(input, format)];
  }

  if (format === "matching") {
    const result = objectiveQuestion(input, "single");
    const left = matchingColumn(input.leftColumn, (index) => String.fromCharCode(65 + index));
    const right = matchingColumn(input.rightColumn, (index) => String(index + 1));
    const asText = (rows) => rows.map(({ label, text: value }) => `${label}. ${value}`).join("\n");
    return [{
      ...result,
      question: `${result.question}\n\nColumn A\n${asText(left)}\n\nColumn B\n${asText(right)}`,
      matchColumns: { leftTitle: "Column A", rightTitle: "Column B", left, right },
    }];
  }

  if (format !== "case-study") throw new Error("Select a supported question format.");
  const passage = text(input.casePassage);
  const questions = input.questions;
  if (!passage || !Array.isArray(questions) || questions.length < 2 || questions.length > 10) {
    throw new Error("Enter a passage and between 2 and 10 case study questions.");
  }
  const id = randomUUID();
  return questions.map((question, order) => {
    const mode = question?.answerMode ?? "single";
    if (!["single", "numeric", "multiple"].includes(mode)) {
      throw new Error(`Question ${order + 1} has an invalid answer type.`);
    }
    try {
      return {
        ...objectiveQuestion(question, mode),
        caseStudy: { id, passage, order, size: questions.length },
      };
    } catch (error) {
      throw new Error(`Question ${order + 1}. ${error.message}`);
    }
  });
}

module.exports = { buildStructuredQuestions };
