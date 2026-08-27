const NavtaQuestion = require("../models/NavtaQuestion");

// ============================================
// TEST RULES
// ============================================

const TEST_RULES = {
  NEET: {
    mcq: {
      minutesPerQuestion: 1,
      durations: [10, 15, 20, 30, 45, 60],
    },
  },

  JEE: {
    mcq: {
      minutesPerQuestion: 2,
      durations: [10, 20, 30, 40, 60, 90],
    },
  },

  Boards: {
    mcq: {
      minutesPerQuestion: 1,
      durations: [10, 15, 20, 30, 45, 60],
    },

    short: {
      minutesPerQuestion: 3,
      durations: [15, 30, 45, 60, 90],
    },

    long: {
      minutesPerQuestion: 6,
      durations: [30, 60, 90, 120, 180],
    },
  },
};

// ============================================
// VALID VALUES
// ============================================

const allowedExams = {
  Physics: ["NEET", "JEE", "Boards"],
  Chemistry: ["NEET", "JEE", "Boards"],
  Maths: ["JEE", "Boards"],
  Biology: ["NEET", "Boards"],
};

const validDifficulties = [
  "Easy",
  "Medium",
  "Hard",
];

const validQuestionTypes = [
  "mcq",
  "short",
  "long",
];

// ============================================
// HELPERS
// ============================================

function normaliseQuestionType(exam, questionType) {
  if (exam !== "Boards") {
    return "mcq";
  }

  return questionType || "mcq";
}

function getQuestionCount(exam, questionType, duration) {
  const config = TEST_RULES[exam]?.[questionType];

  if (!config) {
    return 0;
  }

  return Math.floor(
    Number(duration) / config.minutesPerQuestion
  );
}

function isAllowedDuration(exam, questionType, duration) {
  const config = TEST_RULES[exam]?.[questionType];

  if (!config) {
    return false;
  }

  return config.durations.includes(
    Number(duration)
  );
}

// ============================================
// CREATE QUESTION
// ============================================

exports.createQuestion = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      questionType,
      question,
      options,
      correctAnswer,
      modelAnswer,
      keyPoints,
      maxMarks,
      evaluationInstructions,
      explanation,
    } = req.body;

    if (
      !subject ||
      !exam ||
      !classLevel ||
      !chapter ||
      !difficulty ||
      !question
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, preparation, class, chapter, difficulty and question are required.",
      });
    }

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

    if (
      classLevel !== "Class 11" &&
      classLevel !== "Class 12"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid class.",
      });
    }

    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty.",
      });
    }

    const resolvedQuestionType =
      normaliseQuestionType(
        exam,
        questionType
      );

    if (
      !validQuestionTypes.includes(
        resolvedQuestionType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid question type.",
      });
    }

    const payload = {
      subject: subject.trim(),
      exam: exam.trim(),
      classLevel: classLevel.trim(),
      chapter: chapter.trim(),
      difficulty: difficulty.trim(),
      questionType: resolvedQuestionType,
      question: question.trim(),
      explanation: String(
        explanation || ""
      ).trim(),
      isActive: true,
    };

    // ========================================
    // MCQ
    // ========================================

    if (resolvedQuestionType === "mcq") {
      if (
        !Array.isArray(options) ||
        options.length !== 4
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Exactly 4 options are required for MCQ questions.",
        });
      }

      const cleanedOptions = options.map(
        (option) =>
          String(option || "").trim()
      );

      if (
        cleanedOptions.some(
          (option) => !option
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All 4 MCQ options must contain text.",
        });
      }

      const answerIndex =
        Number(correctAnswer);

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

      if (!payload.explanation) {
        return res.status(400).json({
          success: false,
          message:
            "Explanation is required for MCQ questions.",
        });
      }

      payload.options =
        cleanedOptions;

      payload.correctAnswer =
        answerIndex;

      payload.modelAnswer = "";
      payload.keyPoints = [];
      payload.evaluationInstructions = "";

      payload.maxMarks =
        Number(maxMarks) > 0
          ? Number(maxMarks)
          : 1;
    }

    // ========================================
    // BOARDS WRITTEN QUESTIONS
    // ========================================

    if (
      resolvedQuestionType === "short" ||
      resolvedQuestionType === "long"
    ) {
      if (exam !== "Boards") {
        return res.status(400).json({
          success: false,
          message:
            "Short Answer and Long Answer questions are only available for Boards.",
        });
      }

      if (!String(modelAnswer || "").trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Model answer is required for written questions.",
        });
      }

      if (
        !Array.isArray(keyPoints) ||
        keyPoints.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one key point is required.",
        });
      }

      const cleanedKeyPoints =
        keyPoints
          .map((item) =>
            String(item || "").trim()
          )
          .filter(Boolean);

      const numericMaxMarks =
        Number(maxMarks);

      if (
        !Number.isFinite(numericMaxMarks) ||
        numericMaxMarks < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum marks must be at least 1.",
        });
      }

      payload.options = [];

      payload.correctAnswer =
        undefined;

      payload.modelAnswer =
        String(modelAnswer).trim();

      payload.keyPoints =
        cleanedKeyPoints;

      payload.maxMarks =
        numericMaxMarks;

      payload.evaluationInstructions =
        String(
          evaluationInstructions || ""
        ).trim();
    }

    const newQuestion =
      await NavtaQuestion.create(
        payload
      );

    return res.status(201).json({
      success: true,
      message:
        "Question added successfully.",
      question: newQuestion,
    });
  } catch (error) {
    console.error(
      "CREATE NAVTA QUESTION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add question.",
      error: error.message,
    });
  }
};

// ============================================
// GET QUESTIONS
// ============================================

exports.getQuestions = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      questionType,
    } = req.query;

    const filter = {};

    if (subject) filter.subject = subject;
    if (exam) filter.exam = exam;
    if (classLevel)
      filter.classLevel = classLevel;
    if (chapter)
      filter.chapter = chapter;
    if (difficulty)
      filter.difficulty = difficulty;
    if (questionType)
      filter.questionType = questionType;

    const questions =
      await NavtaQuestion.find(filter)
        .sort({
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
      message:
        "Failed to fetch questions.",
      error: error.message,
    });
  }
};

// ============================================
// DELETE QUESTION
// ============================================

exports.deleteQuestion = async (req, res) => {
  try {
    const { id } =
      req.params;

    const deletedQuestion =
      await NavtaQuestion.findByIdAndDelete(
        id
      );

    if (!deletedQuestion) {
      return res.status(404).json({
        success: false,
        message:
          "Question not found.",
      });
    }

    return res.json({
      success: true,
      message:
        "Question deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE NAVTA QUESTION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete question.",
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
      questionType,
      duration,
    } = req.body;

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

    const resolvedQuestionType =
      normaliseQuestionType(
        exam,
        questionType
      );

    if (
      !validQuestionTypes.includes(
        resolvedQuestionType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid question type.",
      });
    }

    const numericDuration =
      Number(duration);

    if (
      !isAllowedDuration(
        exam,
        resolvedQuestionType,
        numericDuration
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid duration for ${exam} ${resolvedQuestionType} test.`,
      });
    }

    const minutesPerQuestion =
      TEST_RULES[exam][
        resolvedQuestionType
      ].minutesPerQuestion;

    const questionCount =
      getQuestionCount(
        exam,
        resolvedQuestionType,
        numericDuration
      );

    const matchFilter = {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      questionType:
        resolvedQuestionType,
      isActive: true,
    };

    const availableCount =
      await NavtaQuestion.countDocuments(
        matchFilter
      );

    if (
      availableCount <
      questionCount
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Not enough questions are currently available for this test.",

        required:
          questionCount,

        available:
          availableCount,
      });
    }

    const questions =
      await NavtaQuestion.aggregate([
        {
          $match:
            matchFilter,
        },

        {
          $sample: {
            size:
              questionCount,
          },
        },

        {
          $project: {
            question: 1,
            questionType: 1,
            options: 1,
            difficulty: 1,
            maxMarks: 1,
            correctAnswer: 1,
            explanation: 1,
          },
        },
      ]);

    return res.status(200).json({
      success: true,

      test: {
        subject,
        exam,
        classLevel,
        chapter,
        difficulty,

        questionType:
          resolvedQuestionType,

        durationMinutes:
          numericDuration,

        durationSeconds:
          numericDuration * 60,

        totalQuestions:
          questions.length,

        minutesPerQuestion,

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

// ============================================
// BOARDS WRITTEN ANSWER EVALUATION
// ============================================

exports.evaluateWrittenAnswer =
  async (req, res) => {
    try {
      const {
        questionId,
        studentAnswer,
      } = req.body;

      if (
        !questionId ||
        !String(
          studentAnswer || ""
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Question ID and student answer are required.",
        });
      }

      const question =
        await NavtaQuestion.findById(
          questionId
        );

      if (!question) {
        return res.status(404).json({
          success: false,
          message:
            "Question not found.",
        });
      }

      if (
        question.exam !== "Boards" ||
        ![
          "short",
          "long",
        ].includes(
          question.questionType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "AI evaluation is only available for Boards written-answer questions.",
        });
      }

      if (
        !process.env.OPENAI_API_KEY
      ) {
        return res.status(503).json({
          success: false,
          message:
            "AI evaluation is not configured yet.",
        });
      }

      const evaluationPrompt = `
You are evaluating a school board examination answer.

QUESTION:
${question.question}

QUESTION TYPE:
${question.questionType}

MAXIMUM MARKS:
${question.maxMarks}

MODEL ANSWER:
${question.modelAnswer}

REQUIRED KEY POINTS:
${(question.keyPoints || [])
  .map(
    (point, index) =>
      `${index + 1}. ${point}`
  )
  .join("\n")}

STUDENT ANSWER:
${String(studentAnswer).trim()}

Return ONLY valid JSON:

{
  "status": "correct",
  "marksAwarded": 0,
  "maxMarks": 0,
  "feedback": "",
  "missingPoints": []
}

Allowed status:
correct
partially_correct
incorrect
`;

      const aiResponse =
        await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${process.env.OPENAI_API_KEY}`,
            },

            body:
              JSON.stringify({
                model:
                  process.env.OPENAI_MODEL ||
                  "gpt-4.1-mini",

                input:
                  evaluationPrompt,
              }),
          }
        );

      const aiData =
        await aiResponse.json();

      if (!aiResponse.ok) {
        return res.status(502).json({
          success: false,
          message:
            "AI evaluation service failed.",
        });
      }

      let rawText = "";

      if (
        Array.isArray(
          aiData.output
        )
      ) {
        for (
          const outputItem of
          aiData.output
        ) {
          if (
            Array.isArray(
              outputItem.content
            )
          ) {
            for (
              const contentItem of
              outputItem.content
            ) {
              if (
                typeof contentItem.text ===
                "string"
              ) {
                rawText +=
                  contentItem.text;
              }
            }
          }
        }
      }

      rawText =
        rawText
          .trim()
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          );

      let evaluation;

      try {
        evaluation =
          JSON.parse(
            rawText
          );
      } catch {
        return res.status(502).json({
          success: false,
          message:
            "AI returned an invalid evaluation format.",
        });
      }

      const maxMarks =
        Number(
          question.maxMarks
        );

      let marksAwarded =
        Number(
          evaluation.marksAwarded
        );

      if (
        !Number.isFinite(
          marksAwarded
        )
      ) {
        marksAwarded = 0;
      }

      marksAwarded =
        Math.max(
          0,
          Math.min(
            maxMarks,
            marksAwarded
          )
        );

      const allowedStatuses = [
        "correct",
        "partially_correct",
        "incorrect",
      ];

      const status =
        allowedStatuses.includes(
          evaluation.status
        )
          ? evaluation.status
          : "incorrect";

      return res.status(200).json({
        success: true,

        evaluation: {
          status,
          marksAwarded,
          maxMarks,

          feedback:
            evaluation.feedback ||
            question.explanation ||
            "",

          missingPoints:
            Array.isArray(
              evaluation.missingPoints
            )
              ? evaluation.missingPoints
              : [],
        },
      });
    } catch (error) {
      console.error(
        "AI WRITTEN ANSWER EVALUATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to evaluate written answer.",
        error: error.message,
      });
    }
  };
