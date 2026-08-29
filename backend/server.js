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

// ============================================
// MISTAKE NOTEBOOK ROUTES
// ============================================

const mistakeNotebookRoutes = require(
  "./routes/mistakeNotebookRoutes"
);

// ============================================
// PANIC MODE ROUTES
// ============================================

const panicModeRoutes = require(
  "./routes/panicModeRoutes"
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
      // e.g. Postman, curl, same-server requests
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

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NAVTA API is running",
  });
});

// ============================================
// API ROUTES
// ============================================

app.use("/api/auth", authRoutes);

app.use("/api/content", contentRoutes);

app.use("/api/student", studentRoutes);

app.use("/api/teacher", teacherRoutes);

app.use("/api/admin", adminRoutes);

// ============================================
// NAVTA TEST
// ============================================

app.use(
  "/api/navta-test",
  navtaTestRoutes
);

// ============================================
// MISTAKE NOTEBOOK
// ============================================
//
// Student Mistake Notebook API
//
// POST   /api/mistake-notebook
// GET    /api/mistake-notebook
// GET    /api/mistake-notebook/stats
// GET    /api/mistake-notebook/:id
// PUT    /api/mistake-notebook/:id/note
// PUT    /api/mistake-notebook/:id/mastered
// PUT    /api/mistake-notebook/:id/review
// DELETE /api/mistake-notebook/:id
//

app.use(
  "/api/mistake-notebook",
  mistakeNotebookRoutes
);

// ============================================
// PANIC MODE
// ============================================
//
// NAVTA Panic Mode API
//
// This route handles the student's
// emergency exam-preparation plan.
//
// Base endpoint:
// /api/panic-mode
//

app.use(
  "/api/panic-mode",
  panicModeRoutes
);

// ============================================
// API 404 HANDLER
// IMPORTANT:
// Prevent unknown API requests from returning
// the React index.html page.
// ============================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================
// SERVE REACT FRONTEND
// Hostinger Deployment
// ============================================

const frontendPath = path.join(
  __dirname,
  "frontend",
  "dist"
);

app.use(
  express.static(frontendPath)
);

// ============================================
// REACT ROUTER FALLBACK
// ============================================
//
// Any route that is not an API route will
// return React's index.html.
//
// This allows routes such as:
//
// /dashboard
// /navta-test
// /mistake-notebook
// /panic-mode
//
// to work after refreshing the browser.
//

app.get(/.*/, (req, res) => {
  res.sendFile(
    path.join(
      frontendPath,
      "index.html"
    )
  );
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
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

  // CORS errors
  if (
    err &&
    typeof err.message === "string" &&
    err.message.startsWith(
      "CORS blocked request from:"
    )
  ) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  res
    .status(
      err.statusCode ||
      err.status ||
      500
    )
    .json({
      success: false,

      message:
        err.message ||
        "Internal Server Error",
    });
});

// ============================================
// START SERVER
// ============================================

const PORT =
  process.env.PORT || 5000;

const server = app.listen(
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
      `Mistake Notebook API: http://localhost:${PORT}/api/mistake-notebook`
    );

    console.log(
      `Panic Mode API: http://localhost:${PORT}/api/panic-mode`
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
    console.error(
      "NAVTA server failed to start:"
    );

    console.error(err);
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
