const { isObjectIdOrHexString } = require("mongoose");
const NavtaQuestion = require("../models/NavtaQuestion");
const { recordAdminActivity } = require("../services/adminActivity");
const {
  planQuestionAttachments,
  uploadQuestionAttachments,
  discardUploadedAttachments,
} = require("../services/navtaQuestionAttachments");
const {
  findQuestionDuplicates,
  getWorkflowStatus,
  workflowFields,
} = require("../services/navtaQuestionBankService");

const workflowTransitions = {
  draft: ["review", "published", "archived"],
  review: ["draft", "published", "archived"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

function requestError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function respondWithError(res, error) {
  const status = error.statusCode || 500;
  if (status === 500) console.error("NAVTA QUESTION BANK ERROR:", error);
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Unable to update the question bank." : error.message,
  });
}

async function readQuestion(id, session = null) {
  if (!isObjectIdOrHexString(id)) throw requestError(400, "Invalid question ID.");
  const question = await NavtaQuestion.findById(id).select("+imageContentHash").session(session);
  if (!question) throw requestError(404, "Question not found.");
  return question;
}

function assertQuestionVersion(question, updatedAt, version) {
  const current = question.updatedAt?.toISOString() || null;
  if (updatedAt !== current || version !== (question.__v ?? null)) {
    throw requestError(409, "This question changed. Refresh the question bank before saving.");
  }
}

function versionFilter(question) {
  return {
    _id: question._id,
    updatedAt: question.updatedAt || { $exists: false },
    __v: question.__v ?? { $exists: false },
  };
}

function validMarks(value, minimum = 1) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum;
}

function applyEditableFields(question, updates) {
  const written = ["short", "long"].includes(question.questionType);
  const answerMode = question.answerMode || "single";

  const textFields = ["question", "explanation"];
  if (!question.caseStudy?.id) textFields.push("difficulty");
  if (written) textFields.push("modelAnswer", "evaluationInstructions");
  for (const field of textFields) {
    if (!Object.hasOwn(updates, field)) continue;
    if (typeof updates[field] !== "string") throw requestError(400, `Invalid ${field}.`);
    question[field] = updates[field].trim();
  }

  if (Object.hasOwn(updates, "maxMarks")) {
    if (!validMarks(updates.maxMarks)) throw requestError(400, "Maximum marks must be at least 1.");
    question.maxMarks = updates.maxMarks;
  }

  if (written) {
    if (Object.hasOwn(updates, "keyPoints")) {
      if (!Array.isArray(updates.keyPoints) || updates.keyPoints.some(point => typeof point !== "string")) {
        throw requestError(400, "Enter marking points as text.");
      }
      question.keyPoints = updates.keyPoints.map(point => point.trim()).filter(Boolean);
    }
    return;
  }

  if (answerMode === "numeric") {
    if (Object.hasOwn(updates, "numericAnswer")) {
      const { value, tolerance } = updates.numericAnswer || {};
      if (!Number.isFinite(value) || !validMarks(tolerance, 0)) {
        throw requestError(400, "Enter a finite numerical answer and a non-negative tolerance.");
      }
      question.numericAnswer = { value, tolerance };
    }
    return;
  }

  if (Object.hasOwn(updates, "options")) {
    if (!Array.isArray(updates.options) || updates.options.some(option => typeof option !== "string")) {
      throw requestError(400, "Enter each answer choice as text.");
    }
    question.options = updates.options.map(option => option.trim());
  }
  const validChoice = choice => Number.isInteger(choice) && choice >= 0 && choice < 4;
  if (answerMode === "multiple" && Object.hasOwn(updates, "correctAnswers")) {
    const choices = updates.correctAnswers;
    if (!Array.isArray(choices) || !choices.length || !choices.every(validChoice) || new Set(choices).size !== choices.length) {
      throw requestError(400, "Select the correct answer choices.");
    }
    question.correctAnswers = choices;
  } else if (answerMode === "single" && Object.hasOwn(updates, "correctAnswer")) {
    if (!validChoice(updates.correctAnswer)) throw requestError(400, "Select a correct answer.");
    question.correctAnswer = updates.correctAnswer;
  }
}

async function validateQuestion(question) {
  try {
    await question.validate();
  } catch (error) {
    throw requestError(400, error.message);
  }
}

function responseQuestion(question) {
  const result = question.toObject();
  delete result.imageContentHash;
  return { ...result, workflowStatus: getWorkflowStatus(result) };
}

async function updateQuestion(req, res) {
  const uploadedIds = [];
  let persisted = false;
  try {
    const question = await readQuestion(req.params.id);
    const { updatedAt, version, changes } = req.body || {};
    assertQuestionVersion(question, updatedAt, version);
    if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
      throw requestError(400, "Question changes are required.");
    }
    applyEditableFields(question, changes);
    const imagePlan = planQuestionAttachments(changes.attachments, req.files, question);
    if (imagePlan && !imagePlan.length && !question.question.replace(/\[\[NAVTA_VISUAL\]\]/gi, "").trim()) {
      throw requestError(400, "Keep an image or enter the question text.");
    }
    await validateQuestion(question);
    if (imagePlan) {
      const images = await uploadQuestionAttachments(imagePlan, uploadedIds);
      const primaryChanged = question.questionImage?.url !== images[0]?.url;
      question.questionImage = images[0] || null;
      question.questionImages = images;
      if (primaryChanged) {
        question.originalAIQuestionImage = null;
        question.adminImageCrop = null;
        question.imageContentHash = undefined;
        question.imageCropSource = "ai";
      }
    }
    const duplicates = await findQuestionDuplicates(question, { excludeId: question._id });
    const update = question.getChanges();
    const changed = Object.keys(update).length > 0;
    const saved = changed
      ? await NavtaQuestion.findOneAndUpdate(versionFilter(question), { ...update, $inc: { ...update.$inc, __v: 1 } }, { new: true })
      : question;
    if (!saved) throw requestError(409, "This question changed. Refresh the question bank before saving.");
    persisted = true;
    if (changed) await recordAdminActivity(req.user, "Updated", "NAVTA TEST question", saved._id);
    return res.json({ success: true, question: responseQuestion(saved), duplicates });
  } catch (error) {
    if (!persisted) await discardUploadedAttachments(uploadedIds);
    return respondWithError(res, error);
  }
}

async function findDuplicates(req, res) {
  try {
    const question = await readQuestion(req.params.id);
    const duplicates = await findQuestionDuplicates(question, { excludeId: question._id });
    return res.json({ success: true, duplicates });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function transitionQuestion(req, res) {
  try {
    const { updatedAt, version, workflowStatus } = req.body || {};
    const question = await readQuestion(req.params.id);
    assertQuestionVersion(question, updatedAt, version);
    const nextFields = workflowFields(workflowStatus);
    const update = { $set: nextFields, $inc: { __v: 1 } };

    const checkTransition = async (candidate) => {
      const current = getWorkflowStatus(candidate);
      if (workflowStatus !== current && !workflowTransitions[current].includes(workflowStatus)) {
        throw requestError(400, "This workflow action is unavailable for the current status.");
      }
      if (workflowStatus === "published") await validateQuestion(candidate);
    };

    let saved;
    if (question.caseStudy?.id) {
      saved = await NavtaQuestion.db.transaction(async (session) => {
        const current = await readQuestion(question._id, session);
        assertQuestionVersion(current, updatedAt, version);
        const groupFilter = { "caseStudy.id": current.caseStudy.id };
        const group = await NavtaQuestion.find(groupFilter).session(session);
        if (workflowStatus === "published") {
          const size = current.caseStudy.size;
          const orders = new Set(group.map(item => item.caseStudy?.order));
          if (!Number.isInteger(size) || group.length !== size || orders.size !== size ||
              group.some(item => item.caseStudy?.size !== size || !Number.isInteger(item.caseStudy.order) ||
                item.caseStudy.order < 0 || item.caseStudy.order >= size)) {
            throw requestError(409, "The case study must have all of its questions before publishing.");
          }
        }
        for (const item of group) await checkTransition(item);
        await NavtaQuestion.updateMany(groupFilter, update, { session });
        return readQuestion(question._id, session);
      });
    } else {
      await checkTransition(question);
      saved = await NavtaQuestion.findOneAndUpdate(versionFilter(question), update, { new: true });
    }
    if (!saved) throw requestError(409, "This question changed. Refresh the question bank before saving.");
    const action = { draft: "Moved to draft", review: "Sent for review", published: "Published", archived: "Archived" }[workflowStatus];
    await recordAdminActivity(req.user, action, question.caseStudy?.id ? "NAVTA TEST case study" : "NAVTA TEST question", saved._id);
    return res.json({ success: true, question: responseQuestion(saved) });
  } catch (error) {
    return respondWithError(res, error);
  }
}

module.exports = { findDuplicates, transitionQuestion, updateQuestion };
