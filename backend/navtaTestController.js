const NavtaQuestion = require("../models/NavtaQuestion");

// Add a question
exports.createQuestion = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      question,
      options,
      correctAnswer,
      explanation,
    } = req.body;

    if (
      !subject ||
      !exam ||
      !classLevel ||
      !chapter ||
      !difficulty ||
      !question ||
      !options ||
      correctAnswer === undefined
    ) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    if (options.length !== 4) {
      return res.status(400).json({
        message: "Exactly 4 options are required.",
      });
    }

    const newQuestion = await NavtaQuestion.create({
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      question,
      options,
      correctAnswer,
      explanation,
    });

    res.status(201).json({
      message: "Question added successfully.",
      question: newQuestion,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add question.",
      error: error.message,
    });
  }
};


// Get questions for admin
exports.getQuestions = async (req, res) => {
  try {
    const questions = await NavtaQuestion.find()
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch questions.",
      error: error.message,
    });
  }
};


// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    await NavtaQuestion.findByIdAndDelete(id);

    res.json({
      message: "Question deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete question.",
      error: error.message,
    });
  }
};
