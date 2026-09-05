require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const connectDB = require("./config/db");

// ============================================
// ROUTES
// ============================================

const authRoutes = require("./routes/authRoutes");
const contentRoutes = require("./routes/contentRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const adminRoutes = require("./routes/adminRoutes");
const navtaTestRoutes = require("./routes/navtaTestRoutes");
const aiRoutes = require("./routes/aiRoutes");

const mistakeNotebookRoutes = require(
  "./routes/mistakeNotebookRoutes"
);

const panicModeRoutes = require(
  "./routes/panicModeRoutes"
);

const questionSeparatorRoutes = require(
  "./routes/questionSeparatorRoutes"
);

// ============================================
// CONNECT DATABASE
// ============================================

connectDB();

// ============================================
// EXPRESS APP
// ============================================

const app = express();

// ============================================
// CORS
// ============================================

const allowedOrigins = [
  // Production
  "https://navta.in",
  "https://www.navta.in",
  "https://skyblue-dunlin-922022.hostingersite.com",

  // Local development
  "http://localhost:5173",
  "http://127.0.0.1:5173",

  "http://localhost:5174",
  "http://127.0.0.1:5174",

  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      // e.g. curl, Postman, server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS blocked request from: ${origin}`
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ============================================
// GOOGLE OAUTH POPUP SUPPORT
// ============================================

app.use((req, res, next) => {
  res.setHeader(
    "Cross-Origin-Opener-Policy",
    "same-origin-allow-popups"
  );

  next();
});

// ============================================
// BODY PARSERS
// ============================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ============================================
// DEVELOPMENT LOGGING
// ============================================

if (
  process.env.NODE_ENV === "development" ||
  !process.env.NODE_ENV
) {
  app.use(morgan("dev"));
}

// ============================================
// BASIC API HEALTH CHECK
// ============================================

app.get(
  "/api/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "NAVTA API is running",
    });
  }
);

// ============================================
// MAIN API ROUTES
// ============================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/content",
  contentRoutes
);

app.use(
  "/api/student",
  studentRoutes
);

app.use(
  "/api/teacher",
  teacherRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

// ============================================
// NAVTA TEST
// ============================================

app.use(
  "/api/navta-test",
  navtaTestRoutes
);

// ============================================
// NAVTA AI QUESTION SEPARATOR
// ============================================
//
// GET
// /api/question-separator/health
//
// POST
// /api/question-separator/upload
//

app.use(
  "/api/question-separator",
  questionSeparatorRoutes
);

// ============================================
// MISTAKE NOTEBOOK
// ============================================

app.use(
  "/api/mistake-notebook",
  mistakeNotebookRoutes
);

// ============================================
// PANIC MODE
// ============================================

app.use(
  "/api/panic-mode",
  panicModeRoutes
);

// ============================================
// NAVTA AI TUTOR
// ============================================
//
// This is separate from the question separator.
//
// POST
// /api/ai/chat
//

app.use(
  "/api/ai",
  aiRoutes
);

// ============================================
// API 404 HANDLER
// ============================================
//
// IMPORTANT:
// Keep this AFTER all API routes.
//
// This prevents unknown API requests
// from returning the React frontend.
//

app.use(
  "/api",
  (req, res) => {
    return res.status(404).json({
      success: false,
      message:
        `API route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// ============================================
// SERVE REACT FRONTEND
// ============================================
//
// Your current project previously used:
//
// backend/frontend/dist
//
// Keep this path only if your Hostinger project
// really builds frontend inside backend/frontend/dist.
//
// If frontend/dist is outside backend,
// we can change this later.
//

const frontendPath = path.join(
  __dirname,
  "frontend",
  "dist"
);

app.use(
  express.static(
    frontendPath
  )
);

// ============================================
// REACT ROUTER FALLBACK
// ============================================

app.get(
  /.*/,
  (req, res) => {
    return res.sendFile(
      path.join(
        frontendPath,
        "index.html"
      )
    );
  }
);

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error("");
    console.error(
      "================================"
    );
    console.error(
      "NAVTA SERVER ERROR"
    );
    console.error(
      "================================"
    );
    console.error(err);
    console.error("");

    // ========================================
    // CORS ERROR
    // ========================================

    if (
      err &&
      typeof err.message ===
        "string" &&
      err.message.startsWith(
        "CORS blocked request from:"
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: err.message,
        });
    }

    // ========================================
    // MULTER FILE TOO LARGE
    // ========================================

    if (
      err?.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Uploaded file is too large. Maximum size is 30 MB.",
        });
    }

    // ========================================
    // MULTER WRONG FIELD NAME
    // ========================================

    if (
      err?.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            'Invalid upload field. Use the field name "file".',
        });
    }

    // ========================================
    // DEFAULT ERROR
    // ========================================

    return res
      .status(
        err?.statusCode ||
        err?.status ||
        500
      )
      .json({
        success: false,

        message:
          err?.message ||
          "Internal Server Error",
      });
  }
);

// ============================================
// START SERVER
// ============================================

const PORT =
  process.env.PORT ||
  5000;

const server =
  app.listen(
    PORT,
    () => {
      console.log("");
      console.log(
        "================================"
      );
      console.log(
        "🚀 NAVTA Backend Started"
      );
      console.log(
        "================================"
      );

      console.log(
        `Environment: ${
          process.env.NODE_ENV ||
          "development"
        }`
      );

      console.log(
        `Port: ${PORT}`
      );

      console.log(
        `API: http://localhost:${PORT}/api`
      );

      console.log(
        `Health: http://localhost:${PORT}/api/health`
      );

      console.log(
        `Navta TEST API: http://localhost:${PORT}/api/navta-test`
      );

      console.log(
        `Question Separator Health: http://localhost:${PORT}/api/question-separator/health`
      );

      console.log(
        `Question Separator Upload: http://localhost:${PORT}/api/question-separator/upload`
      );

      console.log(
        `Mistake Notebook API: http://localhost:${PORT}/api/mistake-notebook`
      );

      console.log(
        `Panic Mode API: http://localhost:${PORT}/api/panic-mode`
      );

      console.log(
        `NAVTA AI Tutor API: http://localhost:${PORT}/api/ai`
      );

      console.log(
        "================================"
      );
      console.log("");
    }
  );

// ============================================
// SERVER ERROR
// ============================================

server.on(
  "error",
  (err) => {
    console.error("");
    console.error(
      "NAVTA server failed to start:"
    );
    console.error(err);
    console.error("");
  }
);

// ============================================
// UNHANDLED PROMISE REJECTIONS
// ============================================

process.on(
  "unhandledRejection",
  (err) => {
    console.error("");
    console.error(
      "Unhandled Promise Rejection:"
    );
    console.error(err);
    console.error("");
  }
);

// ============================================
// UNCAUGHT EXCEPTIONS
// ============================================

process.on(
  "uncaughtException",
  (err) => {
    console.error("");
    console.error(
      "Uncaught Exception:"
    );
    console.error(err);
    console.error("");
  }
);
