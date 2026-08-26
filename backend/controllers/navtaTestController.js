const NavtaQuestion = require("../models/NavtaQuestion");

// ============================================
// TEST RULES
// ============================================

const TEST_RULES = {
  NEET: {
    minutesPerQuestion: 1,
  },

  JEE: {
    minutesPerQuestion: 2,
  },
};

// Keep Boards similar to the previous system:
// fixed 30-minute test.
const BOARD_DURATION_MINUTES = 30;

// Your previous backend generated 15 questions total.
// We keep that count for Boards for now.
const BOARD_QUESTION_COUNT = 15;

// ============================================
// CREATE QUESTION - ADMIN
// ============================================

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

    // ----------------------------------------
    // REQUIRED FIELDS
    // ----------------------------------------

    if (
      !subject ||
      !exam ||
      !classLevel ||
      !chapter ||
      !difficulty ||
      !question ||
      !Array.isArray(options) ||
      correctAnswer === undefined ||
      correctAnswer === null ||
      !explanation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill all required fields, including explanation.",
      });
    }

    // ----------------------------------------
    // VALIDATE SUBJECT / EXAM
    // ----------------------------------------

    const allowedExams = {
      Physics: ["NEET", "JEE", "Boards"],
      Chemistry: ["NEET", "JEE", "Boards"],
      Maths: ["JEE", "Boards"],
      Biology: ["NEET", "Boards"],
    };

    if (!allowedExams[subject]) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject.",
      });
    }

    if (!allowedExams[subject].includes(exam)) {
      return res.status(400).json({
        success: false,
        message: `${exam} is not available for ${subject}.`,
      });
    }

    // ----------------------------------------
    // VALIDATE CLASS
    // ----------------------------------------

    if (
      classLevel !== "Class 11" &&
      classLevel !== "Class 12"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid class.",
      });
    }

    // ----------------------------------------
    // VALIDATE DIFFICULTY
    // ----------------------------------------

    if (
      !["Easy", "Medium", "Hard"].includes(
        difficulty
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty.",
      });
    }

    // ----------------------------------------
    // VALIDATE OPTIONS
    // ----------------------------------------

    if (options.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Exactly 4 options are required.",
      });
    }

    const cleanedOptions = options.map((option) =>
      String(option).trim()
    );

    if (
      cleanedOptions.some(
        (option) => option.length === 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "All 4 options must contain text.",
      });
    }

    // ----------------------------------------
    // VALIDATE CORRECT ANSWER
    // ----------------------------------------

    const answerIndex = Number(correctAnswer);

    if (
      !Number.isInteger(answerIndex) ||
      answerIndex < 0 ||
      answerIndex > 3
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Correct answer must be Option A, B, C or D.",
      });
    }

    // ----------------------------------------
    // CREATE QUESTION
    // ----------------------------------------

    const newQuestion =
      await NavtaQuestion.create({
        subject: subject.trim(),
        exam: exam.trim(),
        classLevel: classLevel.trim(),
        chapter: chapter.trim(),
        difficulty: difficulty.trim(),

        question: question.trim(),

        options: cleanedOptions,

        correctAnswer: answerIndex,

        explanation: explanation.trim(),

        isActive: true,
      });

    return res.status(201).json({
      success: true,
      message: "Question added successfully.",
      question: newQuestion,
    });
  } catch (error) {
    console.error(
      "CREATE NAVTA QUESTION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to add question.",
      error: error.message,
    });
  }
};

// ============================================
// GET QUESTIONS - ADMIN
// ============================================

exports.getQuestions = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
    } = req.query;

    const filter = {};

    if (subject) {
      filter.subject = subject;
    }

    if (exam) {
      filter.exam = exam;
    }

    if (classLevel) {
      filter.classLevel = classLevel;
    }

    if (chapter) {
      filter.chapter = chapter;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    const questions = await NavtaQuestion.find(
      filter
    ).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error(
      "GET NAVTA QUESTIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions.",
      error: error.message,
    });
  }
};

// ============================================
// DELETE QUESTION - ADMIN
// ============================================

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedQuestion =
      await NavtaQuestion.findByIdAndDelete(id);

    if (!deletedQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    return res.json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE NAVTA QUESTION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete question.",
      error: error.message,
    });
  }
};

// ============================================
// GENERATE STUDENT TEST
// ============================================

exports.generateTest = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      duration,
    } = req.body;

    // ----------------------------------------
    // REQUIRED FIELDS
    // ----------------------------------------

    if (
      !subject ||
      !exam ||
      !classLevel ||
      !chapter ||
      !difficulty
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, preparation, class, chapter and difficulty are required.",
      });
    }

    if (
      !["Easy", "Medium", "Hard"].includes(
        difficulty
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty.",
      });
    }

    let testDurationMinutes;
    let questionCount;

    // ========================================
    // NEET
    // 1 minute = 1 question
    // ========================================

    if (exam === "NEET") {
      const numericDuration = Number(duration);

      const allowedDurations = [
        10,
        15,
        20,
        30,
        45,
        60,
      ];

      if (
        !allowedDurations.includes(
          numericDuration
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid NEET test duration.",
        });
      }

      testDurationMinutes = numericDuration;

      questionCount =
        testDurationMinutes /
        TEST_RULES.NEET.minutesPerQuestion;
    }

    // ========================================
    // JEE
    // 2 minutes = 1 question
    // ========================================

    else if (exam === "JEE") {
      const numericDuration = Number(duration);

      const allowedDurations = [
        10,
        20,
        30,
        40,
        60,
        90,
      ];

      if (
        !allowedDurations.includes(
          numericDuration
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid JEE test duration.",
        });
      }

      testDurationMinutes = numericDuration;

      questionCount = Math.floor(
        testDurationMinutes /
          TEST_RULES.JEE.minutesPerQuestion
      );
    }

    // ========================================
    // BOARDS
    // Keep previous fixed behavior
    // ========================================

    else if (exam === "Boards") {
      testDurationMinutes =
        BOARD_DURATION_MINUTES;

      questionCount =
        BOARD_QUESTION_COUNT;
    }

    // ========================================
    // INVALID EXAM
    // ========================================

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid preparation type.",
      });
    }

    // ========================================
    // COUNT AVAILABLE QUESTIONS
    // ========================================

    const matchFilter = {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      isActive: true,
    };

    const availableCount =
      await NavtaQuestion.countDocuments(
        matchFilter
      );

    // ----------------------------------------
    // NOT ENOUGH QUESTIONS
    // ----------------------------------------

    if (availableCount < questionCount) {
      return res.status(400).json({
        success: false,

        message:
          "Not enough questions are currently available for this test.",

        required: questionCount,

        available: availableCount,

        details: {
          subject,
          exam,
          classLevel,
          chapter,
          difficulty,
        },
      });
    }

    // ========================================
    // FETCH RANDOM QUESTIONS
    // ========================================

    const questions =
      await NavtaQuestion.aggregate([
        {
          $match: matchFilter,
        },

        {
          $sample: {
            size: questionCount,
          },
        },

        {
          $project: {
            question: 1,
            options: 1,
            difficulty: 1,

            // Required for current student-side
            // correct/wrong checking.
            correctAnswer: 1,

            // Student UI only shows this
            // after a wrong answer.
            explanation: 1,
          },
        },
      ]);

    // ========================================
    // RETURN TEST
    // ========================================

    return res.status(200).json({
      success: true,

      test: {
        subject,
        exam,
        classLevel,
        chapter,
        difficulty,

        durationMinutes:
          testDurationMinutes,

        durationSeconds:
          testDurationMinutes * 60,

        totalQuestions:
          questions.length,

        minutesPerQuestion:
          exam === "NEET"
            ? 1
            : exam === "JEE"
              ? 2
              : null,

        questions,
      },
    });
  } catch (error) {
    console.error(
      "GENERATE NAVTA TEST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate Navta TEST.",
      error: error.message,
    });
  }
};
