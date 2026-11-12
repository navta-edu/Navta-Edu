const NavtaQuestion = require("../models/NavtaQuestion");
const { selectQuestionUnits } = require("./navtaScoring");

const questionProjection = {
  question: 1,
  questionType: 1,
  options: 1,
  difficulty: 1,
  maxMarks: 1,
  correctAnswer: 1,
  correctAnswers: 1,
  numericAnswer: 1,
  answerMode: 1,
  caseStudy: 1,
  matchColumns: 1,
  explanation: 1,
  chapter: 1,
  modelAnswer: 1,
  keyPoints: 1,
  evaluationInstructions: 1,
  questionImage: 1,
  questionImages: 1,
  imageCropSource: 1,
  hasVisual: 1,
  visualType: 1,
  visualDescription: 1,
  visualBoundingBox: 1,
  questionBoundingBox: 1,
  studentQuestionFormat: 1,
  sourceDocument: 1,
};

async function selectStandardQuestions(filter, count) {
  const [singles, groups] = await Promise.all([
    NavtaQuestion.aggregate([
      { $match: { ...filter, "caseStudy.id": { $in: [null, ""] } } },
      { $sample: { size: count } },
      { $project: questionProjection },
    ]),
    NavtaQuestion.aggregate([
      {
        $match: {
          ...filter,
          "caseStudy.id": { $type: "string", $ne: "" },
          "caseStudy.size": { $gte: 2, $lte: count },
        },
      },
      {
        $group: {
          _id: "$caseStudy.id",
          members: {
            $push: {
              _id: "$_id",
              caseId: "$caseStudy.id",
              order: "$caseStudy.order",
              size: "$caseStudy.size",
            },
          },
        },
      },
      { $set: { random: { $rand: {} } } },
      { $sort: { random: 1 } },
    ]),
  ]);

  const completeGroups = groups.map(({ members }) => members.sort((a, b) => a.order - b.order))
    .filter((members) => members.every((member, index) =>
      member.order === index && member.size === members.length
    ));
  const available = singles.length + completeGroups.reduce((sum, group) => sum + group.length, 0);
  const selected = selectQuestionUnits(completeGroups, singles, count);
  if (!selected.length) return { questions: [], available };

  const selectedMembers = selected.filter((item) => Object.hasOwn(item, "order"));
  if (!selectedMembers.length) return { questions: selected, available };

  const groupedQuestions = await NavtaQuestion.find({
    ...filter,
    _id: { $in: selectedMembers.map((item) => item._id) },
  }).select(questionProjection).lean();
  const byId = new Map(groupedQuestions.map((question) => [String(question._id), question]));
  const questions = selected.map((item) => Object.hasOwn(item, "order") ? byId.get(String(item._id)) : item);
  const valid = questions.every((question, index) => {
    if (!question) return false;
    const item = selected[index];
    return !Object.hasOwn(item, "order") ||
      (question.caseStudy?.id === item.caseId &&
        question.caseStudy.order === item.order &&
        question.caseStudy.size === item.size);
  });
  return { questions: valid ? questions : [], available };
}

function publicQuestion(question) {
  const { modelAnswer, keyPoints, evaluationInstructions, ...studentQuestion } = question;
  return studentQuestion;
}

module.exports = { selectStandardQuestions, publicQuestion };
