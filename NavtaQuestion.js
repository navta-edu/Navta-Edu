const mongoose = require("mongoose");

const navtaQuestionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      enum: ["Physics", "Chemistry", "Maths", "Biology"],
      required: true,
    },

    exam: {
      type: String,
      enum: ["NEET", "JEE", "Boards"],
      required: true,
    },

    classLevel: {
      type: String,
      enum: ["Class 11", "Class 12"],
      required: true,
    },

    chapter: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      validate: {
        validator: function (value) {
          return value.length === 4;
        },
        message: "A question must have exactly 4 options.",
      },
      required: true,
    },

    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },

    explanation: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "NavtaQuestion",
  navtaQuestionSchema
);
