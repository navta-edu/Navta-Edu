const NavtaScoringPolicy = require("../models/NavtaScoringPolicy");
const {
  DEFAULT_SCORING_POLICY,
  SCORING_EXAMS,
  readScoringPolicy,
} = require("../services/navtaScoring");

exports.getScoringPolicies = async (req, res, next) => {
  try {
    const policies = await NavtaScoringPolicy.find().lean();
    res.json({
      policies: Object.fromEntries(
        SCORING_EXAMS.map((exam) => [
          exam,
          readScoringPolicy(policies.find((policy) => policy.exam === exam)) || DEFAULT_SCORING_POLICY,
        ])
      ),
    });
  } catch (error) {
    next(error);
  }
};

exports.updateScoringPolicy = async (req, res, next) => {
  try {
    const { exam } = req.params;
    const policy = readScoringPolicy(req.body);
    if (!SCORING_EXAMS.includes(exam) || !policy) {
      return res.status(400).json({
        message: "Choose a supported preparation. Correct marks must be between 0.01 and 100, and the penalty cannot exceed the correct marks. Use up to two decimal places.",
      });
    }
    await NavtaScoringPolicy.updateOne(
      { exam },
      { $set: policy },
      { upsert: true, runValidators: true }
    );
    return res.json({ policy });
  } catch (error) {
    return next(error);
  }
};
