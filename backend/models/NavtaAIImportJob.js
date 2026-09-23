const mongoose = require("mongoose");

// Stores only the asynchronous import state/result.
// The uploaded PDF buffer is NOT stored in MongoDB.
const navtaAIImportJobSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },

    fileName: {
      type: String,
      trim: true,
      default: "",
    },

    fileType: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },

    progress: {
      stage: {
        type: String,
        trim: true,
        default: "queued",
      },
      message: {
        type: String,
        trim: true,
        default: "",
      },
    },

    result: {
      acceptedQuestions: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      droppedQuestions: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      summary: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      documentInfo: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    startedAt: {
      type: Date,
      default: undefined,
    },

    completedAt: {
      type: Date,
      default: undefined,
    },

    // Automatic cleanup. MongoDB TTL cleanup is asynchronous.
    expiresAt: {
      type: Date,
      default: () =>
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: {
        expires: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.NavtaAIImportJob ||
  mongoose.model(
    "NavtaAIImportJob",
    navtaAIImportJobSchema
  );
