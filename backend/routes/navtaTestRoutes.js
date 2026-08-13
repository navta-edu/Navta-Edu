const express = require("express");

const router = express.Router();

const {
  createQuestion,
  getQuestions,
  deleteQuestion,
} = require("../controllers/navtaTestController");

// Admin
router.post("/questions", createQuestion);

// Admin
router.get("/questions", getQuestions);

// Admin
router.delete("/questions/:id", deleteQuestion);

module.exports = router;
