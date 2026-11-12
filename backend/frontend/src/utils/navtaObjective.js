export function getObjectiveAnswerMode(question) {
  return question?.answerMode || "single";
}

export function getSingleChoiceAnswer(question) {
  if (typeof question?.correctAnswer === "number") return question.correctAnswer;
  if (typeof question?.answer === "number") return question.answer;
  return question?.correctAnswer == null ? NaN : Number(question.correctAnswer);
}

export function isObjectiveAnswerCorrect(question, response) {
  if (response == null || response === "") return false;

  const mode = getObjectiveAnswerMode(question);
  if (mode === "numeric") {
    const { value, tolerance } = question.numericAnswer ?? {};
    return typeof response === "number" && Number.isFinite(response) &&
      Number.isFinite(value) && Number.isFinite(tolerance) &&
      Math.abs(response - value) <= tolerance;
  }
  if (mode === "multiple") {
    const correct = question.correctAnswers ?? [];
    return correct.length > 0 && Array.isArray(response) && response.length === correct.length &&
      new Set(response).size === correct.length &&
      response.every((choice) => correct.includes(choice));
  }
  return response === getSingleChoiceAnswer(question);
}

export function getObjectivePartialFraction(question, response) {
  if (getObjectiveAnswerMode(question) !== "multiple" || !Array.isArray(response) ||
      !response.length || response.length !== new Set(response).size) return 0;
  const correct = question.correctAnswers ?? [];
  if (response.length >= correct.length || !response.every((choice) => correct.includes(choice))) return 0;
  return response.length / correct.length;
}
