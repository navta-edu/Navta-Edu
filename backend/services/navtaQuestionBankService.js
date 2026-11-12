const { createHash } = require("node:crypto");
const NavtaQuestion = require("../models/NavtaQuestion");

const workflowStatuses = ["draft", "review", "published", "archived"];

function getWorkflowStatus(question) {
  return workflowStatuses.includes(question.workflowStatus)
    ? question.workflowStatus
    : question.isActive === false ? "archived" : "published";
}

function workflowFields(workflowStatus) {
  return { workflowStatus, isActive: workflowStatus === "published" };
}

function initialWorkflowFields(requestedStatus = "published") {
  if (requestedStatus !== "draft" && requestedStatus !== "published") {
    const error = new Error("New questions can be saved as drafts or published.");
    error.statusCode = 400;
    throw error;
  }
  return workflowFields(requestedStatus);
}

function buildQuestionBankFilter(query = {}) {
  const filter = {};
  for (const key of ["subject", "exam", "classLevel", "chapter", "difficulty", "questionType", "answerMode"]) {
    if (typeof query[key] === "string" && query[key].trim()) {
      filter[key] = query[key].trim();
    }
  }

  if (query.workflowStatus) {
    const status = query.workflowStatus;
    if (!workflowStatuses.includes(status)) {
      const error = new Error("Invalid question status.");
      error.statusCode = 400;
      throw error;
    }
    if (status === "published" || status === "archived") {
      filter.$or = [
        { workflowStatus: status },
        {
          workflowStatus: { $in: [null, ""] },
          isActive: status === "published" ? { $ne: false } : false,
        },
      ];
    } else {
      filter.workflowStatus = status;
    }
  }

  const search = typeof query.search === "string" ? query.search.trim().slice(0, 160) : "";
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$and = [{ $or: [{ question: regex }, { "caseStudy.passage": regex }] }];
  }
  return filter;
}

function normalizeQuestionText(value) {
  return String(value ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
}

function questionFingerprint(question) {
  const stem = normalizeQuestionText(question.question)
    .replace(/\[\[NAVTA_VISUAL\]\]/gi, "")
    .replace(/^(?:(?:Q(?:uestion)?\.?\s*)?\d+[a-z]?[.):\-]\s+)/i, "")
    .trim();
  if (!stem) return "";

  const matchColumns = question.matchColumns;
  const options = Array.isArray(question.options) ? question.options : [];
  const left = Array.isArray(matchColumns?.left) ? matchColumns.left : [];
  const right = Array.isArray(matchColumns?.right) ? matchColumns.right : [];
  return JSON.stringify([
    stem,
    question.answerMode || "single",
    options.map(normalizeQuestionText).sort(),
    normalizeQuestionText(question.caseStudy?.passage),
    left.map(row => normalizeQuestionText(row?.text)),
    right.map(row => normalizeQuestionText(row?.text)),
  ]);
}

function hashQuestionImage(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function findQuestionDuplicates(question, { excludeId } = {}) {
  const fingerprint = questionFingerprint(question);
  const imageUrl = question.questionImage?.url;
  if (!fingerprint && !question.imageContentHash && !imageUrl) return [];

  const filter = {
    subject: question.subject,
    exam: question.exam,
    classLevel: question.classLevel,
    questionType: question.questionType,
  };
  if (excludeId) filter._id = { $ne: excludeId };
  if (!fingerprint) {
    filter.$or = [];
    if (question.imageContentHash) filter.$or.push({ imageContentHash: question.imageContentHash });
    if (imageUrl) filter.$or.push({ "questionImage.url": imageUrl });
  }

  const duplicates = [];
  const candidates = NavtaQuestion.find(filter)
    .select("question options answerMode caseStudy matchColumns questionImage.url chapter subject exam classLevel workflowStatus isActive +imageContentHash")
    .lean()
    .cursor();
  for await (const candidate of candidates) {
    const textMatches = fingerprint && questionFingerprint(candidate) === fingerprint;
    const imageMatches = (question.imageContentHash && question.imageContentHash === candidate.imageContentHash)
      || (imageUrl && imageUrl === candidate.questionImage?.url);
    if (textMatches || imageMatches) {
      duplicates.push({
        _id: candidate._id,
        question: candidate.question,
        subject: candidate.subject,
        exam: candidate.exam,
        classLevel: candidate.classLevel,
        chapter: candidate.chapter,
        workflowStatus: getWorkflowStatus(candidate),
      });
      if (duplicates.length === 8) break;
    }
  }
  return duplicates;
}

module.exports = {
  buildQuestionBankFilter,
  findQuestionDuplicates,
  getWorkflowStatus,
  hashQuestionImage,
  initialWorkflowFields,
  workflowFields,
};
