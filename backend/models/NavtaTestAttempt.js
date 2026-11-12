const mongoose = require("mongoose");

const writtenGradeSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    answerDigest: { type: String, required: true },
    evaluation: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const navtaTestAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    mode: { type: String, enum: ["standard", "boss", "revenge"], required: true },
    setup: { type: mongoose.Schema.Types.Mixed, required: true },
    scoringPolicy: { type: mongoose.Schema.Types.Mixed, required: true },
    questions: { type: [mongoose.Schema.Types.Mixed], required: true },
    writtenGrades: { type: [writtenGradeSchema], default: [] },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NavtaTestAttempt", navtaTestAttemptSchema);
