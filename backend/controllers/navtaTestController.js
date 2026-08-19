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

exports.generateTest = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapter,
    } = req.body;

    const EASY_COUNT = 5;
    const MEDIUM_COUNT = 5;
    const HARD_COUNT = 5;

    const getRandomQuestions = async (difficulty, count) => {
      return NavtaQuestion.aggregate([
        {
          $match: {
            subject,
            exam,
            classLevel,
            chapter,
            difficulty,
            isActive: true,
          },
        },
        {
          $sample: {
            size: count,
          },
        },
        {
          $project: {
            question: 1,
            options: 1,
            difficulty: 1,
          },
        },
      ]);
    };

    const easyQuestions = await getRandomQuestions(
      "Easy",
      EASY_COUNT
    );

    const mediumQuestions = await getRandomQuestions(
      "Medium",
      MEDIUM_COUNT
    );

    const hardQuestions = await getRandomQuestions(
      "Hard",
      HARD_COUNT
    );

    if (
      easyQuestions.length < EASY_COUNT ||
      mediumQuestions.length < MEDIUM_COUNT ||
      hardQuestions.length < HARD_COUNT
    ) {
      return res.status(400).json({
        message:
          "Not enough questions available for this test.",
        available: {
          easy: easyQuestions.length,
          medium: mediumQuestions.length,
          hard: hardQuestions.length,
        },
      });
    }

    const questions = [
      ...easyQuestions,
      ...mediumQuestions,
      ...hardQuestions,
    ];

    // Shuffle the complete test
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [questions[i], questions[j]] = [
        questions[j],
        questions[i],
      ];
    }

    res.json({
      duration: 30 * 60,
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to generate test.",
      error: error.message,
    });
  }
};
