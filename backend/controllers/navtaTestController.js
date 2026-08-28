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
// BOSS BATTLE SETTINGS
// ============================================

const BOSS_BATTLE_SIZES = [15, 30, 50];
const BOSS_WIN_PERCENTAGE = 70;

const BOSS_DIFFICULTY_TARGETS = {
  15: {
    Easy: 5,
    Medium: 6,
    Hard: 4,
  },

  30: {
    Easy: 9,
    Medium: 12,
    Hard: 9,
  },

  50: {
    Easy: 15,
    Medium: 20,
    Hard: 15,
  },
};

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
// SHUFFLE HELPER
// ============================================

function shuffleArray(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [copy[i], copy[j]] = [
      copy[j],
      copy[i],
    ];
  }

  return copy;
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

    if (classLevel) {
      filter.classLevel = classLevel;
    }

    if (chapter) {
      filter.chapter = chapter;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (questionType) {
      filter.questionType = questionType;
    }

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
// GENERATE STANDARD STUDENT TEST
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
            chapter: 1,
          },
        },
      ]);

    return res.status(200).json({
      success: true,

      test: {
        mode: "standard",

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
// GENERATE BOSS BATTLE
// ============================================
//
// Boss Battle:
// - MCQ only
// - minimum 2 chapters
// - multiple chapters
// - Easy + Medium + Hard automatically
// - 15 / 30 / 50 question sizes
// - tries to represent every chapter
// - fills missing difficulty slots automatically
//
// ============================================

exports.generateBossBattle = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapters,
      totalQuestions,
    } = req.body;

    // ========================================
    // VALIDATE BASIC DETAILS
    // ========================================

    if (
      !subject ||
      !exam ||
      !classLevel
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subject, preparation and class are required.",
      });
    }

    if (!allowedExams[subject]) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid subject.",
      });
    }

    if (
      !allowedExams[subject].includes(
        exam
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${exam} is not available for ${subject}.`,
      });
    }

    if (
      classLevel !== "Class 11" &&
      classLevel !== "Class 12"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid class.",
      });
    }

    // ========================================
    // VALIDATE CHAPTERS
    // ========================================

    if (!Array.isArray(chapters)) {
      return res.status(400).json({
        success: false,
        message:
          "Chapters must be provided as a list.",
      });
    }

    const selectedChapters = [
      ...new Set(
        chapters
          .map((chapter) =>
            String(
              chapter || ""
            ).trim()
          )
          .filter(Boolean)
      ),
    ];

    if (
      selectedChapters.length < 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Select at least 2 chapters for Boss Battle.",
      });
    }

    // ========================================
    // VALIDATE BOSS SIZE
    // ========================================

    const questionCount =
      Number(totalQuestions);

    if (
      !BOSS_BATTLE_SIZES.includes(
        questionCount
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Boss Battle must contain 15, 30 or 50 questions.",
      });
    }

    // ========================================
    // CHECK EACH SELECTED CHAPTER
    // ========================================

    const unavailableChapters = [];

    const chapterAvailability = {};

    for (
      const chapter of selectedChapters
    ) {
      const questions =
        await NavtaQuestion.find({
          subject,
          exam,
          classLevel,
          chapter,

          questionType: "mcq",

          difficulty: {
            $in: [
              "Easy",
              "Medium",
              "Hard",
            ],
          },

          isActive: true,
        })
          .select(
            "_id difficulty"
          )
          .lean();

      chapterAvailability[
        chapter
      ] = {
        total:
          questions.length,

        Easy:
          questions.filter(
            (q) =>
              q.difficulty ===
              "Easy"
          ).length,

        Medium:
          questions.filter(
            (q) =>
              q.difficulty ===
              "Medium"
          ).length,

        Hard:
          questions.filter(
            (q) =>
              q.difficulty ===
              "Hard"
          ).length,
      };

      if (
        questions.length === 0
      ) {
        unavailableChapters.push(
          chapter
        );
      }
    }

    if (
      unavailableChapters.length > 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Some selected chapters do not have questions available for Boss Battle.",

        unavailableChapters,

        chapterAvailability,
      });
    }

    // ========================================
    // FETCH ALL AVAILABLE QUESTIONS
    // ========================================

    const availableQuestions =
      await NavtaQuestion.find({
        subject,
        exam,
        classLevel,

        chapter: {
          $in:
            selectedChapters,
        },

        questionType: "mcq",

        difficulty: {
          $in: [
            "Easy",
            "Medium",
            "Hard",
          ],
        },

        isActive: true,
      }).lean();

    // ========================================
    // CHECK TOTAL QUESTION AVAILABILITY
    // ========================================

    if (
      availableQuestions.length <
      questionCount
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Not enough questions are available for this Boss Battle.",

        required:
          questionCount,

        available:
          availableQuestions.length,

        chapterAvailability,
      });
    }

    // ========================================
    // GET DIFFICULTY TARGET
    // ========================================

    const difficultyTargets =
      BOSS_DIFFICULTY_TARGETS[
        questionCount
      ];

    // ========================================
    // GROUP QUESTIONS BY DIFFICULTY
    // ========================================

    const questionsByDifficulty = {
      Easy: [],
      Medium: [],
      Hard: [],
    };

    availableQuestions.forEach(
      (question) => {
        if (
          questionsByDifficulty[
            question.difficulty
          ]
        ) {
          questionsByDifficulty[
            question.difficulty
          ].push(
            question
          );
        }
      }
    );

    // ========================================
    // SELECT QUESTIONS
    // ========================================

    let selectedQuestions = [];

    const selectedIds =
      new Set();

    const difficulties = [
      "Easy",
      "Medium",
      "Hard",
    ];

    // ========================================
    // FIRST PASS:
    // SELECT EASY/MEDIUM/HARD TARGETS
    // ========================================

    for (
      const difficulty of difficulties
    ) {
      const pool =
        shuffleArray(
          questionsByDifficulty[
            difficulty
          ]
        );

      const target =
        difficultyTargets[
          difficulty
        ];

      const picked =
        pool.slice(
          0,
          target
        );

      picked.forEach(
        (question) => {
          selectedQuestions.push(
            question
          );

          selectedIds.add(
            String(
              question._id
            )
          );
        }
      );
    }

    // ========================================
    // FALLBACK
    //
    // Example:
    // Need 9 Hard but only 6 exist.
    // Remaining positions are filled using
    // unused Easy/Medium questions.
    // ========================================

    if (
      selectedQuestions.length <
      questionCount
    ) {
      const remaining =
        shuffleArray(
          availableQuestions.filter(
            (question) =>
              !selectedIds.has(
                String(
                  question._id
                )
              )
          )
        );

      const needed =
        questionCount -
        selectedQuestions.length;

      const fallback =
        remaining.slice(
          0,
          needed
        );

      fallback.forEach(
        (question) => {
          selectedQuestions.push(
            question
          );

          selectedIds.add(
            String(
              question._id
            )
          );
        }
      );
    }

    if (
      selectedQuestions.length <
      questionCount
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Not enough unique questions are available to build this Boss Battle.",

        required:
          questionCount,

        available:
          selectedQuestions.length,
      });
    }

    // ========================================
    // MAKE SURE EVERY SELECTED CHAPTER
    // APPEARS IN THE BATTLE
    // ========================================

    for (
      const chapter of selectedChapters
    ) {
      const chapterAlreadyIncluded =
        selectedQuestions.some(
          (question) =>
            question.chapter ===
            chapter
        );

      if (
        chapterAlreadyIncluded
      ) {
        continue;
      }

      const replacementCandidate =
        shuffleArray(
          availableQuestions.filter(
            (question) =>
              question.chapter ===
                chapter &&
              !selectedIds.has(
                String(
                  question._id
                )
              )
          )
        )[0];

      if (
        !replacementCandidate
      ) {
        continue;
      }

      let replacementIndex = -1;

      // Find a question from a chapter
      // that currently has more than
      // one question in the battle.

      for (
        let i =
          selectedQuestions.length - 1;
        i >= 0;
        i--
      ) {
        const currentChapter =
          selectedQuestions[
            i
          ].chapter;

        const currentChapterCount =
          selectedQuestions.filter(
            (question) =>
              question.chapter ===
              currentChapter
          ).length;

        if (
          currentChapterCount > 1
        ) {
          replacementIndex =
            i;

          break;
        }
      }

      if (
        replacementIndex !== -1
      ) {
        const oldQuestion =
          selectedQuestions[
            replacementIndex
          ];

        selectedIds.delete(
          String(
            oldQuestion._id
          )
        );

        selectedQuestions[
          replacementIndex
        ] =
          replacementCandidate;

        selectedIds.add(
          String(
            replacementCandidate._id
          )
        );
      }
    }

    // ========================================
    // FINAL SHUFFLE
    // ========================================

    selectedQuestions =
      shuffleArray(
        selectedQuestions
      );

    // ========================================
    // TIMER
    // ========================================

    let minutesPerQuestion = 1;

    if (exam === "JEE") {
      minutesPerQuestion = 2;
    }

    const durationMinutes =
      questionCount *
      minutesPerQuestion;

    // ========================================
    // ACTUAL DIFFICULTY BREAKDOWN
    // ========================================

    const difficultyBreakdown = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    };

    selectedQuestions.forEach(
      (question) => {
        if (
          difficultyBreakdown[
            question.difficulty
          ] !== undefined
        ) {
          difficultyBreakdown[
            question.difficulty
          ] += 1;
        }
      }
    );

    // ========================================
    // ACTUAL CHAPTER BREAKDOWN
    // ========================================

    const chapterBreakdown = {};

    selectedChapters.forEach(
      (chapter) => {
        chapterBreakdown[
          chapter
        ] = 0;
      }
    );

    selectedQuestions.forEach(
      (question) => {
        if (
          chapterBreakdown[
            question.chapter
          ] !== undefined
        ) {
          chapterBreakdown[
            question.chapter
          ] += 1;
        }
      }
    );

    // ========================================
    // FORMAT QUESTIONS
    // ========================================

    const questions =
      selectedQuestions.map(
        (question) => ({
          _id:
            question._id,

          question:
            question.question,

          questionType:
            question.questionType,

          options:
            question.options ||
            [],

          correctAnswer:
            question.correctAnswer,

          explanation:
            question.explanation ||
            "",

          chapter:
            question.chapter,

          difficulty:
            question.difficulty,

          maxMarks:
            question.maxMarks ||
            1,
        })
      );

    // ========================================
    // RETURN BOSS BATTLE
    // ========================================

    return res.status(200).json({
      success: true,

      bossBattle: {
        mode: "boss",

        subject,
        exam,
        classLevel,

        chapters:
          selectedChapters,

        totalQuestions:
          questions.length,

        difficultyTargets,

        difficultyBreakdown,

        chapterBreakdown,

        chapterAvailability,

        minutesPerQuestion,

        durationMinutes,

        durationSeconds:
          durationMinutes *
          60,

        questions,
      },
    });
  } catch (error) {
    console.error(
      "GENERATE BOSS BATTLE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate Boss Battle.",

      error:
        error.message,
    });
  }
};

// ============================================
// GENERATE REVENGE BATTLE
// ============================================
//
// Revenge Battle unlocks after a Boss Battle score below 70%.
// It keeps the same subject, exam, class, chapters and battle size,
// but prioritises the chapters and difficulty levels where the
// student performed worst. Previous questions are avoided whenever
// the question bank has enough unused questions.
//
// ============================================

exports.generateRevengeBattle = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapters,
      totalQuestions,
      previousQuestionIds = [],
      answers = [],
      revengeAttempt = 1,
      previousPercentage,
      originalPercentage,
    } = req.body;

    if (!subject || !exam || !classLevel) {
      return res.status(400).json({
        success: false,
        message: "Subject, preparation and class are required.",
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

    if (classLevel !== "Class 11" && classLevel !== "Class 12") {
      return res.status(400).json({
        success: false,
        message: "Invalid class.",
      });
    }

    if (!Array.isArray(chapters)) {
      return res.status(400).json({
        success: false,
        message: "Chapters must be provided as a list.",
      });
    }

    const selectedChapters = [
      ...new Set(
        chapters
          .map((chapter) => String(chapter || "").trim())
          .filter(Boolean)
      ),
    ];

    if (selectedChapters.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Select at least 2 chapters for Revenge Battle.",
      });
    }

    const questionCount = Number(totalQuestions);

    if (!BOSS_BATTLE_SIZES.includes(questionCount)) {
      return res.status(400).json({
        success: false,
        message: "Revenge Battle must contain 15, 30 or 50 questions.",
      });
    }

    if (selectedChapters.length > questionCount) {
      return res.status(400).json({
        success: false,
        message: "The number of selected chapters cannot exceed the battle size.",
      });
    }

    const previousIds = Array.isArray(previousQuestionIds)
      ? [...new Set(previousQuestionIds.map((id) => String(id || "").trim()).filter(Boolean))]
      : [];

    const answerMap = new Map();

    if (Array.isArray(answers)) {
      answers.forEach((item) => {
        const id = String(item?.questionId || "").trim();
        if (!id) return;

        const rawSelectedAnswer = item?.selectedAnswer;
        const selectedAnswer = Number(rawSelectedAnswer);
        const hasValidAnswer =
          rawSelectedAnswer !== null &&
          rawSelectedAnswer !== undefined &&
          Number.isInteger(selectedAnswer) &&
          selectedAnswer >= 0 &&
          selectedAnswer <= 3;

        answerMap.set(id, hasValidAnswer ? selectedAnswer : null);
      });
    }

    const previousQuestions = previousIds.length
      ? await NavtaQuestion.find({
          _id: { $in: previousIds },
          subject,
          exam,
          classLevel,
          chapter: { $in: selectedChapters },
          questionType: "mcq",
          isActive: true,
        })
          .select("_id chapter difficulty correctAnswer")
          .lean()
      : [];

    const chapterPerformance = {};
    selectedChapters.forEach((chapter) => {
      chapterPerformance[chapter] = { correct: 0, total: 0, percentage: 0 };
    });

    const difficultyPerformance = {
      Easy: { correct: 0, total: 0, percentage: 0 },
      Medium: { correct: 0, total: 0, percentage: 0 },
      Hard: { correct: 0, total: 0, percentage: 0 },
    };

    previousQuestions.forEach((question) => {
      const id = String(question._id);
      const selectedAnswer = answerMap.get(id);
      const isCorrect =
        Number.isInteger(selectedAnswer) &&
        selectedAnswer === Number(question.correctAnswer);

      if (chapterPerformance[question.chapter]) {
        chapterPerformance[question.chapter].total += 1;
        if (isCorrect) chapterPerformance[question.chapter].correct += 1;
      }

      if (difficultyPerformance[question.difficulty]) {
        difficultyPerformance[question.difficulty].total += 1;
        if (isCorrect) difficultyPerformance[question.difficulty].correct += 1;
      }
    });

    Object.values(chapterPerformance).forEach((result) => {
      result.percentage = result.total
        ? Math.round((result.correct / result.total) * 100)
        : 0;
    });

    Object.values(difficultyPerformance).forEach((result) => {
      result.percentage = result.total
        ? Math.round((result.correct / result.total) * 100)
        : 0;
    });

    const weakChapters = Object.entries(chapterPerformance)
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(([chapter, result]) => ({ chapter, ...result }));

    const weakDifficulties = Object.entries(difficultyPerformance)
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .map(([difficulty, result]) => ({ difficulty, ...result }));

    const availableQuestions = await NavtaQuestion.find({
      subject,
      exam,
      classLevel,
      chapter: { $in: selectedChapters },
      questionType: "mcq",
      difficulty: { $in: ["Easy", "Medium", "Hard"] },
      isActive: true,
    }).lean();

    if (availableQuestions.length < questionCount) {
      return res.status(400).json({
        success: false,
        message: "Not enough questions are available for this Revenge Battle.",
        required: questionCount,
        available: availableQuestions.length,
      });
    }

    const previousIdSet = new Set(previousIds);
    const unusedQuestions = availableQuestions.filter(
      (question) => !previousIdSet.has(String(question._id))
    );

    // If the bank has enough unused questions, Revenge uses only new ones.
    // Otherwise it uses every unused question first, then fills the remaining
    // slots from the older pool without duplicating a question in this battle.
    const primaryPool =
      unusedQuestions.length >= questionCount
        ? unusedQuestions
        : availableQuestions;

    const chapterScore = Object.fromEntries(
      weakChapters.map((item, index) => [
        item.chapter,
        (100 - item.percentage) * 4 + (weakChapters.length - index) * 8,
      ])
    );

    const difficultyScore = Object.fromEntries(
      weakDifficulties.map((item, index) => [
        item.difficulty,
        (100 - item.percentage) * 3 + (weakDifficulties.length - index) * 6,
      ])
    );

    const scoredPool = shuffleArray(primaryPool)
      .map((question) => ({
        question,
        score:
          (chapterScore[question.chapter] || 0) +
          (difficultyScore[question.difficulty] || 0) +
          Math.random() * 12,
      }))
      .sort((a, b) => b.score - a.score);

    let selectedQuestions = [];
    const selectedIds = new Set();

    // Guarantee that every selected chapter is still represented at least once.
    for (const chapter of selectedChapters) {
      const candidate = scoredPool.find(
        (item) =>
          item.question.chapter === chapter &&
          !selectedIds.has(String(item.question._id))
      );

      if (candidate) {
        selectedQuestions.push(candidate.question);
        selectedIds.add(String(candidate.question._id));
      }
    }

    for (const item of scoredPool) {
      if (selectedQuestions.length >= questionCount) break;

      const id = String(item.question._id);
      if (selectedIds.has(id)) continue;

      selectedQuestions.push(item.question);
      selectedIds.add(id);
    }

    // When the unused pool was too small, make sure unused questions are
    // preferred before any old questions that may have entered the scored pool.
    if (unusedQuestions.length < questionCount) {
      const unusedSelectedIds = new Set(
        selectedQuestions
          .filter((q) => !previousIdSet.has(String(q._id)))
          .map((q) => String(q._id))
      );

      const missingUnused = shuffleArray(
        unusedQuestions.filter((q) => !unusedSelectedIds.has(String(q._id)))
      );

      for (const freshQuestion of missingUnused) {
        const replaceIndex = selectedQuestions.findIndex((q) =>
          previousIdSet.has(String(q._id))
        );

        if (replaceIndex === -1) break;

        selectedQuestions[replaceIndex] = freshQuestion;
      }
    }

    selectedQuestions = shuffleArray(selectedQuestions.slice(0, questionCount));

    if (selectedQuestions.length < questionCount) {
      return res.status(400).json({
        success: false,
        message: "Not enough unique questions are available to build this Revenge Battle.",
        required: questionCount,
        available: selectedQuestions.length,
      });
    }

    const minutesPerQuestion = exam === "JEE" ? 2 : 1;
    const durationMinutes = questionCount * minutesPerQuestion;

    const difficultyBreakdown = { Easy: 0, Medium: 0, Hard: 0 };
    const chapterBreakdown = {};
    selectedChapters.forEach((chapter) => {
      chapterBreakdown[chapter] = 0;
    });

    selectedQuestions.forEach((question) => {
      if (difficultyBreakdown[question.difficulty] !== undefined) {
        difficultyBreakdown[question.difficulty] += 1;
      }

      if (chapterBreakdown[question.chapter] !== undefined) {
        chapterBreakdown[question.chapter] += 1;
      }
    });

    const questions = selectedQuestions.map((question) => ({
      _id: question._id,
      question: question.question,
      questionType: question.questionType,
      options: question.options || [],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "",
      chapter: question.chapter,
      difficulty: question.difficulty,
      maxMarks: question.maxMarks || 1,
    }));

    const repeatedQuestionCount = questions.filter((question) =>
      previousIdSet.has(String(question._id))
    ).length;

    return res.status(200).json({
      success: true,
      revengeBattle: {
        mode: "revenge",
        winPercentage: BOSS_WIN_PERCENTAGE,
        revengeAttempt: Math.max(1, Number(revengeAttempt) || 1),
        previousPercentage: Number(previousPercentage) || 0,
        originalPercentage: Number(originalPercentage) || 0,
        subject,
        exam,
        classLevel,
        chapters: selectedChapters,
        totalQuestions: questions.length,
        minutesPerQuestion,
        durationMinutes,
        durationSeconds: durationMinutes * 60,
        weakChapters,
        weakDifficulties,
        previousChapterPerformance: chapterPerformance,
        previousDifficultyPerformance: difficultyPerformance,
        difficultyBreakdown,
        chapterBreakdown,
        repeatedQuestionCount,
        questions,
      },
    });
  } catch (error) {
    console.error("GENERATE REVENGE BATTLE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate Revenge Battle.",
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
