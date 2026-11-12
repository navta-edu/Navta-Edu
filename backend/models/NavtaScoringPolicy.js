const mongoose = require("mongoose");

const navtaScoringPolicySchema = new mongoose.Schema(
  {
    exam: { type: String, enum: ["Boards", "NEET", "JEE"], required: true, unique: true },
    correctMarks: { type: Number, required: true, min: 0.01, max: 100 },
    incorrectPenalty: { type: Number, required: true, min: 0, max: 100 },
    partialCredit: { type: Boolean, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NavtaScoringPolicy", navtaScoringPolicySchema);
