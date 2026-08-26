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

function normaliseQuestionType(
  exam,
  questionType
) {
  // NEET and JEE are always MCQ
  if (exam !== "Boards") {
    return "mcq";
  }

  return questionType || "mcq";
}

function getQuestionCount(
  exam,
  questionType,
  duration
) {
  const config =
    TEST_RULES[exam]?.[questionType];

  if (!config) {
    return 0;
  }

  return Math.floor(
    Number(duration) /
      config.minutesPerQuestion
  );
}

function isAllowedDuration(
  exam,
  questionType,
  duration
) {
  const config =
    TEST_RULES[exam]?.[questionType];

  if (!config) {
    return false;
  }

  return config.durations.includes(
    Number(duration)
  );
}

// ============================================
// CREATE QUESTION - ADMIN
// ============================================

exports.createQuestion = async (
  req,
  res
) => {
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

    // ========================================
    // BASIC REQUIRED FIELDS
    // ========================================

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

    // ========================================
    // SUBJECT VALIDATION
    // ========================================

    if (!allowedExams[subject]) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject.",
      });
    }

    // ========================================
    // EXAM VALIDATION
    // ========================================

    if (
      !allowedExams[subject].includes(exam)
    ) {
      return res.status(400).json({
        success: false,

        message:
          `${exam} is not available for ${subject}.`,
      });
    }

    // ========================================
    // CLASS VALIDATION
    // ========================================

    if (
      classLevel !== "Class 11" &&
      classLevel !== "Class 12"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid class.",
      });
    }

    // ========================================
    // DIFFICULTY VALIDATION
    // ========================================

    if (
      !validDifficulties.includes(
        difficulty
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty.",
      });
    }

    // ========================================
    // QUESTION TYPE
    // ========================================

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

    // NEET and JEE are MCQ only
    if (
      exam !== "Boards" &&
      resolvedQuestionType !== "mcq"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "NEET and JEE questions must use MCQ question type.",
      });
    }

    // ========================================
    // DATABASE PAYLOAD
    // ========================================

    const payload = {
      subject: subject.trim(),

      exam: exam.trim(),

      classLevel:
        classLevel.trim(),

      chapter: chapter.trim(),

      difficulty:
        difficulty.trim(),

      questionType:
        resolvedQuestionType,

      question:
        question.trim(),

      explanation:
        String(
          explanation || ""
        ).trim(),

      isActive: true,
    };

    // ========================================
    // MCQ QUESTION
    // ========================================

    if (
      resolvedQuestionType === "mcq"
    ) {
      // --------------------------------------
      // OPTIONS
      // --------------------------------------

      if (!Array.isArray(options)) {
        return res.status(400).json({
          success: false,

          message:
            "MCQ options are required.",
        });
      }

      if (options.length !== 4) {
        return res.status(400).json({
          success: false,

          message:
            "Exactly 4 options are required for MCQ questions.",
        });
      }

      const cleanedOptions =
        options.map((option) =>
          String(option).trim()
        );

      if (
        cleanedOptions.some(
          (option) =>
            option.length === 0
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "All 4 MCQ options must contain text.",
        });
      }

      // --------------------------------------
      // CORRECT ANSWER
      // --------------------------------------

      const answerIndex =
        Number(correctAnswer);

      if (
        !Number.isInteger(
          answerIndex
        ) ||
        answerIndex < 0 ||
        answerIndex > 3
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Correct answer must be Option A, B, C or D.",
        });
      }

      payload.options =
        cleanedOptions;

      payload.correctAnswer =
        answerIndex;

      payload.modelAnswer = "";

      payload.keyPoints = [];

      payload.evaluationInstructions =
        "";

      // Explanation is required because
      // it will be shown when the student
      // selects a wrong MCQ answer.

      if (!payload.explanation) {
        return res.status(400).json({
          success: false,

          message:
            "Explanation is required for MCQ questions.",
        });
      }
    }

    // ========================================
    // SHORT / LONG ANSWER
    // BOARDS ONLY
    // ========================================

    if (
      resolvedQuestionType ===
        "short" ||
      resolvedQuestionType ===
        "long"
    ) {
      // --------------------------------------
      // MUST BE BOARDS
      // --------------------------------------

      if (exam !== "Boards") {
        return res.status(400).json({
          success: false,

          message:
            "Short Answer and Long Answer questions are only available for Boards.",
        });
      }

      // --------------------------------------
      // MODEL ANSWER
      // --------------------------------------

      if (
        !String(
          modelAnswer || ""
        ).trim()
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Model answer is required for written questions.",
        });
      }

      // --------------------------------------
      // KEY POINTS
      // --------------------------------------

      if (
        !Array.isArray(
          keyPoints
        ) ||
        keyPoints.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "At least one key point is required for written questions.",
        });
      }

      const cleanedKeyPoints =
        keyPoints
          .map((item) =>
            String(item).trim()
          )
          .filter(Boolean);

      if (
        cleanedKeyPoints.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "At least one valid key point is required.",
        });
      }

      // --------------------------------------
      // MAXIMUM MARKS
      // --------------------------------------

      const numericMaxMarks =
        Number(maxMarks);

      if (
        !Number.isFinite(
          numericMaxMarks
        ) ||
        numericMaxMarks < 1
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Maximum marks must be at least 1.",
        });
      }

      // Written questions do not use
      // MCQ options or correctAnswer.

      payload.options = [];

      payload.correctAnswer =
        undefined;

      payload.modelAnswer =
        String(
          modelAnswer
        ).trim();

      payload.keyPoints =
        cleanedKeyPoints;

      payload.maxMarks =
        numericMaxMarks;

      payload.evaluationInstructions =
        String(
          evaluationInstructions ||
            ""
        ).trim();
    }

    // ========================================
    // SAVE QUESTION
    // ========================================

    const newQuestion =
      await NavtaQuestion.create(
        payload
      );

    return res
      .status(201)
      .json({
        success: true,

        message:
          "Question added successfully.",

        question:
          newQuestion,
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

      error:
        error.message,
    });
  }
};

// ============================================
// GET QUESTIONS - ADMIN
// ============================================

exports.getQuestions = async (
  req,
  res
) => {
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

    if (subject) {
      filter.subject =
        subject;
    }

    if (exam) {
      filter.exam =
        exam;
    }

    if (classLevel) {
      filter.classLevel =
        classLevel;
    }

    if (chapter) {
      filter.chapter =
        chapter;
    }

    if (difficulty) {
      filter.difficulty =
        difficulty;
    }

    if (questionType) {
      filter.questionType =
        questionType;
    }

    const questions =
      await NavtaQuestion.find(
        filter
      ).sort({
        createdAt: -1,
      });

    return res.json({
      success: true,

      count:
        questions.length,

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

      error:
        error.message,
    });
  }
};

// ============================================
// DELETE QUESTION - ADMIN
// ============================================

exports.deleteQuestion = async (
  req,
  res
) => {
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

      error:
        error.message,
    });
  }
};

// ============================================
// GENERATE STUDENT TEST
// ============================================

exports.generateTest = async (
  req,
  res
) => {
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

    // ========================================
    // REQUIRED FIELDS
    // ========================================

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

    // ========================================
    // DIFFICULTY
    // ========================================

    if (
      !validDifficulties.includes(
        difficulty
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid difficulty.",
      });
    }

    // ========================================
    // QUESTION TYPE
    // ========================================

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

    // NEET and JEE remain MCQ only

    if (
      exam !== "Boards" &&
      resolvedQuestionType !== "mcq"
    ) {
      return res.status(400).json({
        success: false,

        message:
          "NEET and JEE tests support MCQ questions only.",
      });
    }

    // ========================================
    // DURATION
    // ========================================

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

    // ========================================
    // MINUTES PER QUESTION
    // ========================================

    const minutesPerQuestion =
      TEST_RULES[exam][
        resolvedQuestionType
      ].minutesPerQuestion;

    // ========================================
    // CALCULATE NUMBER OF QUESTIONS
    // ========================================

    const questionCount =
      getQuestionCount(
        exam,
        resolvedQuestionType,
        numericDuration
      );

    if (questionCount <= 0) {
      return res.status(400).json({
        success: false,

        message:
          "Unable to calculate question count.",
      });
    }

    // ========================================
    // QUESTION BANK FILTER
    // ========================================

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

    // ========================================
    // CHECK AVAILABLE QUESTIONS
    // ========================================

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

        details: {
          subject,
          exam,
          classLevel,
          chapter,
          difficulty,

          questionType:
            resolvedQuestionType,

          duration:
            numericDuration,
        },
      });
    }

    // ========================================
    // RANDOM QUESTIONS
    // ========================================

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

            // MCQ checking
            correctAnswer: 1,

            // MCQ wrong answer explanation
            explanation: 1,

            // IMPORTANT:
            // modelAnswer
            // keyPoints
            // evaluationInstructions
            //
            // are intentionally NOT
            // returned to the student's
            // browser.
          },
        },
      ]);

    // ========================================
    // RETURN GENERATED TEST
    // ========================================

    return res
      .status(200)
      .json({
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
            numericDuration *
            60,

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

      error:
        error.message,
    });
  }
};

// ============================================
// AI EVALUATE WRITTEN ANSWER
// BOARDS SHORT / LONG ANSWERS ONLY
// ============================================

exports.evaluateWrittenAnswer =
  async (req, res) => {
    try {
      const {
        questionId,
        studentAnswer,
      } = req.body;

      // ======================================
      // VALIDATE REQUEST
      // ======================================

      if (
        !questionId ||
        !String(
          studentAnswer || ""
        ).trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Question ID and student answer are required.",
          });
      }

      // ======================================
      // GET QUESTION FROM DATABASE
      // ======================================

      const question =
        await NavtaQuestion.findById(
          questionId
        );

      if (!question) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Question not found.",
          });
      }

      // ======================================
      // WRITTEN BOARDS ONLY
      // ======================================

      if (
        question.exam !==
          "Boards" ||
        ![
          "short",
          "long",
        ].includes(
          question.questionType
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "AI evaluation is only available for Boards written-answer questions.",
          });
      }

      // ======================================
      // OPENAI API KEY CHECK
      // ======================================

      if (
        !process.env
          .OPENAI_API_KEY
      ) {
        return res
          .status(503)
          .json({
            success: false,

            message:
              "AI evaluation is not configured yet. OPENAI_API_KEY is missing.",
          });
      }

      // ======================================
      // BUILD AI EVALUATION PROMPT
      // ======================================

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
${question.keyPoints
  .map(
    (point, index) =>
      `${index + 1}. ${point}`
  )
  .join("\n")}

ADDITIONAL MARKING INSTRUCTIONS:
${
  question.evaluationInstructions ||
  "None"
}

STUDENT ANSWER:
${String(
  studentAnswer
).trim()}

Evaluate the student's answer fairly.

Important rules:

1. Do not require exact wording.
2. Accept scientifically or mathematically equivalent wording.
3. Award partial marks where appropriate.
4. Compare the answer against the model answer and required key points.
5. Do not penalize harmless grammar or spelling errors if the meaning is clear.
6. Give short, useful educational feedback.

Return ONLY valid JSON.

Use exactly this structure:

{
  "status": "correct",
  "marksAwarded": 0,
  "maxMarks": 0,
  "feedback": "feedback for student",
  "missingPoints": []
}

The status must be exactly one of:

"correct"
"partially_correct"
"incorrect"
`;

      // ======================================
      // CALL OPENAI
      // ======================================

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
                  process.env
                    .OPENAI_MODEL ||
                  "gpt-4.1-mini",

                input:
                  evaluationPrompt,
              }),
          }
        );

      const aiData =
        await aiResponse.json();

      // ======================================
      // OPENAI ERROR
      // ======================================

      if (!aiResponse.ok) {
        console.error(
          "OPENAI EVALUATION ERROR:",
          aiData
        );

        return res
          .status(502)
          .json({
            success: false,

            message:
              "AI evaluation service failed.",
          });
      }

      // ======================================
      // EXTRACT RESPONSE TEXT
      // ======================================

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
        rawText.trim();

      // Remove markdown fences
      // if the AI accidentally adds them.

      rawText =
        rawText
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

      // ======================================
      // PARSE AI JSON
      // ======================================

      let evaluation;

      try {
        evaluation =
          JSON.parse(rawText);
      } catch (parseError) {
        console.error(
          "AI JSON PARSE ERROR:",
          rawText
        );

        return res
          .status(502)
          .json({
            success: false,

            message:
              "AI returned an invalid evaluation format.",
          });
      }

      // ======================================
      // VALIDATE MARKS
      // ======================================

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

      // Never allow AI to give
      // negative marks or more
      // than the maximum marks.

      marksAwarded =
        Math.max(
          0,
          Math.min(
            maxMarks,
            marksAwarded
          )
        );

      // ======================================
      // VALIDATE STATUS
      // ======================================

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

      // ======================================
      // RETURN RESULT TO STUDENT
      // ======================================

      return res
        .status(200)
        .json({
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

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Failed to evaluate written answer.",

          error:
            error.message,
        });
    }
  };
