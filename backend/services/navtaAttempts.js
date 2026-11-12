const mongoose = require("mongoose");
const NavtaTestAttempt = require("../models/NavtaTestAttempt");
const NavtaScoringPolicy = require("../models/NavtaScoringPolicy");
const {
  DEFAULT_SCORING_POLICY,
  readScoringPolicy,
  snapshotQuestion,
} = require("./navtaScoring");

async function createAttempt(user, mode, setup, questions) {
  const storedPolicy = mode === "standard"
    ? await NavtaScoringPolicy.findOne({ exam: setup.exam }).lean()
    : null;
  const scoringPolicy = readScoringPolicy(storedPolicy) || DEFAULT_SCORING_POLICY;
  const attempt = await NavtaTestAttempt.create({
    user,
    mode,
    setup,
    scoringPolicy,
    questions: questions.map(snapshotQuestion),
    expiresAt: new Date(Date.now() + (setup.durationMinutes + 24 * 60) * 60_000),
  });
  return { attemptId: String(attempt._id), scoringPolicy };
}

function findAttempt(user, id) {
  if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id)) {
    return Promise.resolve(null);
  }
  return NavtaTestAttempt.findOne({ _id: id, user, expiresAt: { $gt: new Date() } }).lean();
}

module.exports = { createAttempt, findAttempt };
