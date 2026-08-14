require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const navtaTestRoutes = require("./routes/navtaTestRoutes");

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [
    "https://navta.in",
    "https://www.navta.in",

    // Local development
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true
}));

// Set Cross-Origin-Opener-Policy to allow Google OAuth popups
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
  app.use(morgan("dev"));
}

// Mount routers
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/content", require("./routes/contentRoutes"));
app.use("/api/student", require("./routes/studentRoutes"));
app.use("/api/teacher", require("./routes/teacherRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/navta-test", navtaTestRoutes);

// Serve Frontend (Hostinger deployment)
// Serve Frontend (Hostinger deployment)
app.use(express.static(path.join(__dirname, "frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
});

// Custom Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
