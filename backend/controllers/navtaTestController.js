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
// - Minimum 2 chapters
// - Multiple chapters
// - Automatic Easy / Medium / Hard mix
// - 15 / 30 / 50 questions
// - 70% required to defeat Boss
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

    if (
      selectedChapters.length >
      questionCount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The number of selected chapters cannot exceed the battle size.",
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
    // CHECK TOTAL AVAILABILITY
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
    // DIFFICULTY TARGETS
    // ========================================

    const difficultyTargets =
      BOSS_DIFFICULTY_TARGETS[
        questionCount
      ];

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
    // SELECT TARGET QUESTIONS
    // ========================================

    let selectedQuestions = [];

    const selectedIds =
      new Set();

    const difficulties = [
      "Easy",
      "Medium",
      "Hard",
    ];

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
    // ========================================
    //
    // If one difficulty does not have enough
    // questions, fill remaining positions from
    // unused Easy / Medium / Hard questions.
    //
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
    // ENSURE EVERY CHAPTER APPEARS
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
    // DIFFICULTY BREAKDOWN
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
    // CHAPTER BREAKDOWN
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

        winPercentage:
          BOSS_WIN_PERCENTAGE,

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
// Revenge Battle:
// - Unlocks after Boss score below 70%
// - Same subject
// - Same exam
// - Same class
// - Same chapters
// - Same battle size
// - Focuses on weak chapters
// - Focuses on weak difficulties
// - Avoids previous questions when possible
// - Supports Revenge Again
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

    // ========================================
    // BASIC VALIDATION
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
      !allowedExams[
        subject
      ].includes(exam)
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
    // CHAPTER VALIDATION
    // ========================================

    if (
      !Array.isArray(chapters)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Chapters must be provided as a list.",
      });
    }

    const selectedChapters = [
      ...new Set(
        chapters
          .map(
            (chapter) =>
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
          "Select at least 2 chapters for Revenge Battle.",
      });
    }

    // ========================================
    // BATTLE SIZE VALIDATION
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
          "Revenge Battle must contain 15, 30 or 50 questions.",
      });
    }

    if (
      selectedChapters.length >
      questionCount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The number of selected chapters cannot exceed the battle size.",
      });
    }

    // ========================================
    // PREVIOUS QUESTION IDS
    // ========================================

    const previousIds =
      Array.isArray(
        previousQuestionIds
      )
        ? [
            ...new Set(
              previousQuestionIds
                .map(
                  (id) =>
                    String(
                      id || ""
                    ).trim()
                )
                .filter(Boolean)
            ),
          ]
        : [];

    // ========================================
    // BUILD ANSWER MAP
    // ========================================

    const answerMap =
      new Map();

    if (
      Array.isArray(answers)
    ) {
      answers.forEach(
        (item) => {
          const id =
            String(
              item?.questionId ||
                ""
            ).trim();

          if (!id) {
            return;
          }

          const rawSelectedAnswer =
            item?.selectedAnswer;

          const selectedAnswer =
            Number(
              rawSelectedAnswer
            );

          const hasValidAnswer =
            rawSelectedAnswer !==
              null &&
            rawSelectedAnswer !==
              undefined &&
            Number.isInteger(
              selectedAnswer
            ) &&
            selectedAnswer >= 0 &&
            selectedAnswer <= 3;

          answerMap.set(
            id,
            hasValidAnswer
              ? selectedAnswer
              : null
          );
        }
      );
    }

    // ========================================
    // GET PREVIOUS BATTLE QUESTIONS
    // ========================================

    const previousQuestions =
      previousIds.length
        ? await NavtaQuestion.find({
            _id: {
              $in:
                previousIds,
            },

            subject,
            exam,
            classLevel,

            chapter: {
              $in:
                selectedChapters,
            },

            questionType:
              "mcq",

            isActive: true,
          })
            .select(
              "_id chapter difficulty correctAnswer"
            )
            .lean()
        : [];

    // ========================================
    // CHAPTER PERFORMANCE
    // ========================================

    const chapterPerformance = {};

    selectedChapters.forEach(
      (chapter) => {
        chapterPerformance[
          chapter
        ] = {
          correct: 0,
          total: 0,
          percentage: 0,
        };
      }
    );

    // ========================================
    // DIFFICULTY PERFORMANCE
    // ========================================

    const difficultyPerformance = {
      Easy: {
        correct: 0,
        total: 0,
        percentage: 0,
      },

      Medium: {
        correct: 0,
        total: 0,
        percentage: 0,
      },

      Hard: {
        correct: 0,
        total: 0,
        percentage: 0,          numericDuration,

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
// - Minimum 2 chapters
// - Multiple chapters
// - Automatic Easy / Medium / Hard mix
// - 15 / 30 / 50 questions
// - 70% required to defeat Boss
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

    if (
      selectedChapters.length >
      questionCount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The number of selected chapters cannot exceed the battle size.",
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
    // CHECK TOTAL AVAILABILITY
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
    // DIFFICULTY TARGETS
    // ========================================

    const difficultyTargets =
      BOSS_DIFFICULTY_TARGETS[
        questionCount
      ];

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
    // SELECT TARGET QUESTIONS
    // ========================================

    let selectedQuestions = [];

    const selectedIds =
      new Set();

    const difficulties = [
      "Easy",
      "Medium",
      "Hard",
    ];

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
    // ========================================
    //
    // If one difficulty does not have enough
    // questions, fill remaining positions from
    // unused Easy / Medium / Hard questions.
    //
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
    // ENSURE EVERY CHAPTER APPEARS
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
    // DIFFICULTY BREAKDOWN
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
    // CHAPTER BREAKDOWN
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

        winPercentage:
          BOSS_WIN_PERCENTAGE,

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
// Revenge Battle:
// - Unlocks after Boss score below 70%
// - Same subject
// - Same exam
// - Same class
// - Same chapters
// - Same battle size
// - Focuses on weak chapters
// - Focuses on weak difficulties
// - Avoids previous questions when possible
// - Supports Revenge Again
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

    // ========================================
    // BASIC VALIDATION
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
      !allowedExams[
        subject
      ].includes(exam)
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
    // CHAPTER VALIDATION
    // ========================================

    if (
      !Array.isArray(chapters)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Chapters must be provided as a list.",
      });
    }

    const selectedChapters = [
      ...new Set(
        chapters
          .map(
            (chapter) =>
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
          "Select at least 2 chapters for Revenge Battle.",
      });
    }

    // ========================================
    // BATTLE SIZE VALIDATION
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
          "Revenge Battle must contain 15, 30 or 50 questions.",
      });
    }

    if (
      selectedChapters.length >
      questionCount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The number of selected chapters cannot exceed the battle size.",
      });
    }

    // ========================================
    // PREVIOUS QUESTION IDS
    // ========================================

    const previousIds =
      Array.isArray(
        previousQuestionIds
      )
        ? [
            ...new Set(
              previousQuestionIds
                .map(
                  (id) =>
                    String(
                      id || ""
                    ).trim()
                )
                .filter(Boolean)
            ),
          ]
        : [];

    // ========================================
    // BUILD ANSWER MAP
    // ========================================

    const answerMap =
      new Map();

    if (
      Array.isArray(answers)
    ) {
      answers.forEach(
        (item) => {
          const id =
            String(
              item?.questionId ||
                ""
            ).trim();

          if (!id) {
            return;
          }

          const rawSelectedAnswer =
            item?.selectedAnswer;

          const selectedAnswer =
            Number(
              rawSelectedAnswer
            );

          const hasValidAnswer =
            rawSelectedAnswer !==
              null &&
            rawSelectedAnswer !==
              undefined &&
            Number.isInteger(
              selectedAnswer
            ) &&
            selectedAnswer >= 0 &&
            selectedAnswer <= 3;

          answerMap.set(
            id,
            hasValidAnswer
              ? selectedAnswer
              : null
          );
        }
      );
    }

    // ========================================
    // GET PREVIOUS BATTLE QUESTIONS
    // ========================================

    const previousQuestions =
      previousIds.length
        ? await NavtaQuestion.find({
            _id: {
              $in:
                previousIds,
            },

            subject,
            exam,
            classLevel,

            chapter: {
              $in:
                selectedChapters,
            },

            questionType:
              "mcq",

            isActive: true,
          })
            .select(
              "_id chapter difficulty correctAnswer"
            )
            .lean()
        : [];

    // ========================================
    // CHAPTER PERFORMANCE
    // ========================================

    const chapterPerformance = {};

    selectedChapters.forEach(
      (chapter) => {
        chapterPerformance[
          chapter
        ] = {
          correct: 0,
          total: 0,
          percentage: 0,
        };
      }
    );

    // ========================================
    // DIFFICULTY PERFORMANCE
    // ========================================

    const difficultyPerformance = {
      Easy: {
        correct: 0,
        total: 0,
        percentage: 0,
      },

      Medium: {
        correct: 0,
        total: 0,
        percentage: 0,
      },

      Hard: {
        correct: 0,
        total: 0,
        percentage: 0,
              },
    };

    // ========================================
    // CALCULATE PREVIOUS PERFORMANCE
    // ========================================

    previousQuestions.forEach(
      (question) => {
        const id =
          String(
            question._id
          );

        const selectedAnswer =
          answerMap.get(id);

        const isCorrect =
          Number.isInteger(
            selectedAnswer
          ) &&
          selectedAnswer ===
            Number(
              question.correctAnswer
            );

        if (
          chapterPerformance[
            question.chapter
          ]
        ) {
          chapterPerformance[
            question.chapter
          ].total += 1;

          if (isCorrect) {
            chapterPerformance[
              question.chapter
            ].correct += 1;
          }
        }

        if (
          difficultyPerformance[
            question.difficulty
          ]
        ) {
          difficultyPerformance[
            question.difficulty
          ].total += 1;

          if (isCorrect) {
            difficultyPerformance[
              question.difficulty
            ].correct += 1;
          }
        }
      }
    );

    // ========================================
    // CALCULATE PERCENTAGES
    // ========================================

    Object.values(
      chapterPerformance
    ).forEach(
      (result) => {
        result.percentage =
          result.total
            ? Math.round(
                (
                  result.correct /
                  result.total
                ) * 100
              )
            : 0;
      }
    );

    Object.values(
      difficultyPerformance
    ).forEach(
      (result) => {
        result.percentage =
          result.total
            ? Math.round(
                (
                  result.correct /
                  result.total
                ) * 100
              )
            : 0;
      }
    );

    // ========================================
    // FIND WEAKEST CHAPTERS
    // ========================================

    const weakChapters =
      Object.entries(
        chapterPerformance
      )
        .sort(
          (a, b) =>
            a[1].percentage -
            b[1].percentage
        )
        .map(
          ([chapter, result]) => ({
            chapter,
            ...result,
          })
        );

    // ========================================
    // FIND WEAKEST DIFFICULTIES
    // ========================================

    const weakDifficulties =
      Object.entries(
        difficultyPerformance
      )
        .sort(
          (a, b) =>
            a[1].percentage -
            b[1].percentage
        )
        .map(
          ([
            difficulty,
            result,
          ]) => ({
            difficulty,
            ...result,
          })
        );

    // ========================================
    // FETCH AVAILABLE REVENGE QUESTIONS
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

        questionType:
          "mcq",

        difficulty: {
          $in: [
            "Easy",
            "Medium",
            "Hard",
          ],
        },

        isActive: true,
      }).lean();

    if (
      availableQuestions.length <
      questionCount
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Not enough questions are available for this Revenge Battle.",

        required:
          questionCount,

        available:
          availableQuestions.length,
      });
    }

    // ========================================
    // REMOVE PREVIOUS QUESTIONS WHEN POSSIBLE
    // ========================================

    const previousIdSet =
      new Set(
        previousIds
      );

    const unusedQuestions =
      availableQuestions.filter(
        (question) =>
          !previousIdSet.has(
            String(
              question._id
            )
          )
      );

    // If enough fresh questions exist,
    // Revenge uses only fresh questions.
    //
    // If not enough fresh questions exist,
    // older questions may be reused.

    const primaryPool =
      unusedQuestions.length >=
      questionCount
        ? unusedQuestions
        : availableQuestions;

    // ========================================
    // WEAKNESS PRIORITY SCORE
    // ========================================

    const chapterScore =
      Object.fromEntries(
        weakChapters.map(
          (item, index) => [
            item.chapter,

            (100 -
              item.percentage) *
              4 +
              (
                weakChapters.length -
                index
              ) *
                8,
          ]
        )
      );

    const difficultyScore =
      Object.fromEntries(
        weakDifficulties.map(
          (item, index) => [
            item.difficulty,

            (100 -
              item.percentage) *
              3 +
              (
                weakDifficulties.length -
                index
              ) *
                6,
          ]
        )
      );

    // ========================================
    // SCORE THE QUESTION POOL
    // ========================================

    const scoredPool =
      shuffleArray(
        primaryPool
      )
        .map(
          (question) => ({
            question,

            score:
              (
                chapterScore[
                  question.chapter
                ] || 0
              ) +
              (
                difficultyScore[
                  question.difficulty
                ] || 0
              ) +
              Math.random() *
                12,
          })
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        );

    let selectedQuestions = [];

    const selectedIds =
      new Set();

    // ========================================
    // GUARANTEE EACH CHAPTER
    // ========================================

    for (
      const chapter of
      selectedChapters
    ) {
      const candidate =
        scoredPool.find(
          (item) =>
            item.question
              .chapter ===
              chapter &&
            !selectedIds.has(
              String(
                item.question
                  ._id
              )
            )
        );

      if (candidate) {
        selectedQuestions.push(
          candidate.question
        );

        selectedIds.add(
          String(
            candidate.question
              ._id
          )
        );
      }
    }

    // ========================================
    // FILL REMAINING QUESTIONS
    // ========================================

    for (
      const item of scoredPool
    ) {
      if (
        selectedQuestions.length >=
        questionCount
      ) {
        break;
      }

      const id =
        String(
          item.question._id
        );

      if (
        selectedIds.has(id)
      ) {
        continue;
      }

      selectedQuestions.push(
        item.question
      );

      selectedIds.add(id);
    }

    // ========================================
    // PREFER UNUSED QUESTIONS
    // ========================================

    if (
      unusedQuestions.length <
      questionCount
    ) {
      const unusedSelectedIds =
        new Set(
          selectedQuestions
            .filter(
              (question) =>
                !previousIdSet.has(
                  String(
                    question._id
                  )
                )
            )
            .map(
              (question) =>
                String(
                  question._id
                )
            )
        );

      const missingUnused =
        shuffleArray(
          unusedQuestions.filter(
            (question) =>
              !unusedSelectedIds.has(
                String(
                  question._id
                )
              )
          )
        );

      for (
        const freshQuestion of
        missingUnused
      ) {
        const replaceIndex =
          selectedQuestions.findIndex(
            (question) =>
              previousIdSet.has(
                String(
                  question._id
                )
              )
          );

        if (
          replaceIndex === -1
        ) {
          break;
        }

        selectedQuestions[
          replaceIndex
        ] =
          freshQuestion;
      }
    }

    // ========================================
    // FINALIZE REVENGE QUESTIONS
    // ========================================

    selectedQuestions =
      shuffleArray(
        selectedQuestions.slice(
          0,
          questionCount
        )
      );

    if (
      selectedQuestions.length <
      questionCount
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Not enough unique questions are available to build this Revenge Battle.",

        required:
          questionCount,

        available:
          selectedQuestions.length,
      });
    }

    // ========================================
    // TIMER
    // ========================================

    const minutesPerQuestion =
      exam === "JEE"
        ? 2
        : 1;

    const durationMinutes =
      questionCount *
      minutesPerQuestion;

    // ========================================
    // DIFFICULTY BREAKDOWN
    // ========================================

    const difficultyBreakdown = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    };

    // ========================================
    // CHAPTER BREAKDOWN
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
          difficultyBreakdown[
            question.difficulty
          ] !== undefined
        ) {
          difficultyBreakdown[
            question.difficulty
          ] += 1;
        }

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
    // COUNT REPEATED QUESTIONS
    // ========================================

    const repeatedQuestionCount =
      questions.filter(
        (question) =>
          previousIdSet.has(
            String(
              question._id
            )
          )
      ).length;

    // ========================================
    // RETURN REVENGE BATTLE
    // ========================================

    return res.status(200).json({
      success: true,

      revengeBattle: {
        mode:
          "revenge",

        winPercentage:
          BOSS_WIN_PERCENTAGE,

        revengeAttempt:
          Math.max(
            1,
            Number(
              revengeAttempt
            ) || 1
          ),

        previousPercentage:
          Number(
            previousPercentage
          ) || 0,

        originalPercentage:
          Number(
            originalPercentage
          ) || 0,

        subject,
        exam,
        classLevel,

        chapters:
          selectedChapters,

        totalQuestions:
          questions.length,

        minutesPerQuestion,

        durationMinutes,

        durationSeconds:
          durationMinutes *
          60,

        weakChapters,

        weakDifficulties,

        previousChapterPerformance:
          chapterPerformance,

        previousDifficultyPerformance:
          difficultyPerformance,

        difficultyBreakdown,

        chapterBreakdown,

        repeatedQuestionCount,

        questions,
      },
    });
  } catch (error) {
    console.error(
      "GENERATE REVENGE BATTLE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to generate Revenge Battle.",

      error:
        error.message,
    });
  }
};

// ============================================
// COMPLETE NAVTA TEST
// ============================================
//
// Saves Standard Test / Boss Battle / Revenge
// results for dashboard performance analytics.
//
// Coin rule:
// - Score <= 80%: 0 coins
// - Score > 80% and duration < 30 min: 1 coin
// - Score > 80% and duration >= 30 min: 2 coins
//
// IMPORTANT:
// This endpoint must be protected by the
// student authentication middleware in routes.
//
// Endpoint:
// POST /api/navta-test/complete
//
// ============================================

exports.completeNavtaTest =
  async (req, res) => {
    try {
      const userId =
        req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication is required.",
        });
      }

      const {
        attemptId,
        testType = "standard",
        subject,
        exam,
        classLevel,
        chapter,
        chapters = [],
        difficulty,
        questionType,
        selectedDuration,
        timeTaken,
        answers = [],
      } = req.body;

      // ========================================
      // ATTEMPT ID
      // ========================================

      const cleanedAttemptId =
        String(
          attemptId || ""
        ).trim();

      if (!cleanedAttemptId) {
        return res.status(400).json({
          success: false,
          message:
            "Attempt ID is required.",
        });
      }

      // ========================================
      // DUPLICATE ATTEMPT PROTECTION
      // ========================================

      const existingResult =
        await Result.findOne({
          user: userId,
          attemptId:
            cleanedAttemptId,
        });

      if (existingResult) {
        // A retry must not create another streak day.
        // Using the original result creation date also
        // lets us safely repair a streak update if the
        // server previously saved the result but stopped
        // before updating the streak.
        const streak =
          await applyNavtaStreakSafely(
            userId,
            existingResult.createdAt ||
              new Date()
          );

        const existingStudent =
          await Student.findOne({
            user: userId,
          }).select(
            "coins xp level currentStreak longestStreak lastNavtaTestDate streakRecoveryActive streakRecoveryRequired streakRecoveryCompleted streakLastUpdatedAt"
          );

        return res.status(200).json({
          success: true,
          alreadySubmitted: true,
          message:
            "This NAVTA Test attempt was already saved.",
          data: {
            result:
              existingResult,
            percentage:
              existingResult.percentage,
            selectedDuration:
              existingResult.selectedDuration,
            coinsEarned:
              Number(
                existingResult.coinsAwarded ||
                  0
              ),
            coinBalance:
              Number(
                existingStudent?.coins ||
                  0
              ),
            newCoins:
              Number(
                existingStudent?.coins ||
                  0
              ),
            streak,
          },
        });
      }

      // ========================================
      // BASIC TEST VALIDATION
      // ========================================

      if (
        !NAVTA_RESULT_TYPES.includes(
          testType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid NAVTA Test type.",
        });
      }

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

      if (
        !allowedExams[subject] ||
        !allowedExams[
          subject
        ].includes(exam)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid subject or preparation.",
        });
      }

      if (
        classLevel !==
          "Class 11" &&
        classLevel !==
          "Class 12"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid class.",
        });
      }

      if (
        !Array.isArray(answers) ||
        answers.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Completed test answers are required.",
        });
      }

      // ========================================
      // DURATION
      // ========================================

      const numericDuration =
        Number(selectedDuration);

      if (
        !Number.isFinite(
          numericDuration
        ) ||
        numericDuration <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid selected test duration is required.",
        });
      }

      // ========================================
      // QUESTION IDS
      // ========================================

      const questionIds =
        answers
          .map(
            (item) =>
              String(
                item?.questionId ||
                  ""
              ).trim()
          )
          .filter(Boolean);

      const uniqueQuestionIds = [
        ...new Set(
          questionIds
        ),
      ];

      if (
        uniqueQuestionIds.length !==
        answers.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Every submitted answer must contain one unique question ID.",
        });
      }

      // ========================================
      // LOAD REAL QUESTIONS FROM DATABASE
      // ========================================

      const storedQuestions =
        await NavtaQuestion.find({
          _id: {
            $in:
              uniqueQuestionIds,
          },
          subject,
          exam,
          classLevel,
          isActive: true,
        })
          .select(
            "_id chapter difficulty questionType correctAnswer maxMarks modelAnswer"
          )
          .lean();

      if (
        storedQuestions.length !==
        uniqueQuestionIds.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more submitted questions are invalid for this NAVTA Test.",
        });
      }

      const questionMap =
        new Map(
          storedQuestions.map(
            (item) => [
              String(item._id),
              item,
            ]
          )
        );

      // ========================================
      // STANDARD TEST VALIDATION
      // ========================================

      const resolvedQuestionType =
        normaliseQuestionType(
          exam,
          questionType
        );

      if (
        testType ===
        "standard"
      ) {
        if (
          !chapter ||
          !difficulty ||
          !validDifficulties.includes(
            difficulty
          ) ||
          !validQuestionTypes.includes(
            resolvedQuestionType
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Chapter, difficulty and question type are required for a Standard Test.",
          });
        }

        if (
          !isAllowedDuration(
            exam,
            resolvedQuestionType,
            numericDuration
          )        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid duration for this Standard Test.",
          });
        }

        const expectedQuestionCount =
          getQuestionCount(
            exam,
            resolvedQuestionType,
            numericDuration
          );

        if (
          answers.length !==
          expectedQuestionCount
        ) {
          return res.status(400).json({
            success: false,
            message:
              "The submitted Standard Test question count does not match the selected duration.",
          });
        }

        const invalidStandardQuestion =
          storedQuestions.some(
            (item) =>
              item.chapter !==
                chapter ||
              item.difficulty !==
                difficulty ||
              item.questionType !==
                resolvedQuestionType
          );

        if (
          invalidStandardQuestion
        ) {
          return res.status(400).json({
            success: false,
            message:
              "One or more questions do not match the selected Standard Test setup.",
          });
        }
      }

      // ========================================
      // BOSS / REVENGE VALIDATION
      // ========================================

      let cleanedChapters = [];

      if (
        testType === "boss" ||
        testType === "revenge"
      ) {
        cleanedChapters = [
          ...new Set(
            (Array.isArray(
              chapters
            )
              ? chapters
              : []
            )
              .map(
                (item) =>
                  String(
                    item || ""
                  ).trim()
              )
              .filter(Boolean)
          ),
        ];

        if (
          cleanedChapters.length <
          2
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Boss and Revenge Battle results require at least 2 selected chapters.",
          });
        }

        if (
          !BOSS_BATTLE_SIZES.includes(
            answers.length
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Boss and Revenge Battle results must contain 15, 30 or 50 questions.",
          });
        }

        const invalidBattleQuestion =
          storedQuestions.some(
            (item) =>
              item.questionType !==
                "mcq" ||
              !cleanedChapters.includes(
                item.chapter
              ) ||
              !validDifficulties.includes(
                item.difficulty
              )
          );

        if (
          invalidBattleQuestion
        ) {
          return res.status(400).json({
            success: false,
            message:
              "One or more questions do not match the Boss/Revenge Battle setup.",
          });
        }

        const expectedDuration =
          answers.length *
          (exam === "JEE"
            ? 2
            : 1);

        if (
          numericDuration !==
          expectedDuration
        ) {
          return res.status(400).json({
            success: false,
            message:
              "The submitted Boss/Revenge duration does not match the official battle timer.",
          });
        }
      }

      // ========================================
      // CANONICAL RESULT CONTEXT
      // ========================================
      //
      // The submitted questions above have already
      // been validated against subject, exam and
      // classLevel. Build the stored chapter context
      // from those real database questions so Panic
      // Mode receives trustworthy Class 11 / Class 12
      // chapter history.
      // ========================================

      const verifiedChapters = [
        ...new Set(
          storedQuestions
            .map((item) =>
              String(
                item.chapter || ""
              ).trim()
            )
            .filter(Boolean)
        ),
      ];

      const resultChapter =
        testType === "standard"
          ? verifiedChapters[0] ||
            String(
              chapter || ""
            ).trim()
          : undefined;

      const resultChapters =
        testType === "standard"
          ? resultChapter
            ? [resultChapter]
            : []
          : verifiedChapters;

      // ========================================
      // GRADE TEST ON SERVER
      // ========================================

      let earnedMarks = 0;
      let maximumMarks = 0;
      let correctAnswers = 0;

      const gradedAnswers =
        answers.map(
          (submitted) => {
            const id =
              String(
                submitted.questionId
              );

            const question =
              questionMap.get(id);

            if (!question) {
              return null;
            }

            // ------------------------------------
            // MCQ
            // ------------------------------------

            if (
              question.questionType ===
              "mcq"
            ) {
              const selectedOption =
                normaliseSubmittedAnswer(
                  submitted.selectedOption
                );

              const correctOption =
                Number(
                  question.correctAnswer
                );

              const isCorrect =
                Number.isInteger(
                  selectedOption
                ) &&
                selectedOption ===
                  correctOption;

              maximumMarks += 1;

              if (isCorrect) {
                earnedMarks += 1;
                correctAnswers += 1;
              }

              return {
                question:
                  question._id,
                selectedOption,
                textAnswer: "",
                isCorrect,
              };
            }

            // ------------------------------------
            // WRITTEN
            // ------------------------------------
            //
            // Written answers have already been
            // evaluated by the backend evaluation
            // endpoint during the test.
            //
            // We cap submitted marks to the real
            // stored maxMarks so impossible values
            // cannot be stored.
            //
            // ------------------------------------

            const maxMarks =
              Math.max(
                1,
                Number(
                  question.maxMarks ||
                    1
                )
              );

            const rawAwarded =
              Number(
                submitted
                  ?.evaluation
                  ?.marksAwarded
              );

            const awarded =
              Number.isFinite(
                rawAwarded
              )
                ? Math.max(
                    0,
                    Math.min(
                      maxMarks,
                      rawAwarded
                    )
                  )
                : 0;

            maximumMarks +=
              maxMarks;

            earnedMarks +=
              awarded;

            const isCorrect =
              awarded >= maxMarks;

            if (isCorrect) {
              correctAnswers += 1;
            }

            return {
              question:
                question._id,
              selectedOption:
                null,
              textAnswer:
                String(
                  submitted.textAnswer ||
                    ""
                ),
              isCorrect,
            };
          }
        )
        .filter(Boolean);

      if (
        maximumMarks <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to calculate this test result.",
        });
      }

      const percentage =
        Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (
                earnedMarks /
                maximumMarks
              ) * 100
            )
          )
        );

      const totalQuestions =
        storedQuestions.length;

      const score =
        Math.round(
          earnedMarks * 100
        ) / 100;

      // 70% is retained as the NAVTA
      // performance success threshold.
      const isPassed =
        percentage >= 70;

      // ========================================
      // COIN REWARD
      // ========================================

      const coinsEarned =
        calculateNavtaCoins(
          percentage,
          numericDuration
        );

      // ========================================
      // ACTUAL TIME TAKEN
      // ========================================

      const numericTimeTaken =
        Number(timeTaken);

      const safeTimeTaken =
        Number.isFinite(
          numericTimeTaken
        ) &&
        numericTimeTaken >= 0
          ? Math.round(
              numericTimeTaken
            )
          : 0;

      // ========================================
      // STUDENT PROFILE
      // ========================================

      const student =
        await Student.findOne({
          user: userId,
        });

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "Student profile not found.",
        });
      }

      // ========================================
      // SAVE RESULT FIRST
      // ========================================
      //
      // NOTE:
      // Result.test must be optional for NAVTA
      // generated tests because these tests are
      // generated dynamically and do not have a
      // Test document.
      //
      // ========================================

      let result;

      try {
        result =
          await Result.create({
            user: userId,
            answers:
              gradedAnswers,
            score,
            percentage,
            timeTaken:
              safeTimeTaken,
            selectedDuration:
              numericDuration,
            testType,
            subject:
              String(subject).trim(),
            exam:
              String(exam).trim(),
            classLevel:
              String(classLevel).trim(),
            chapter:
              resultChapter,
            chapters:
              resultChapters,
            difficulty:
              testType === "standard"
                ? String(difficulty || "")
                : "",
            questionType:
              testType === "standard"
                ? resolvedQuestionType
                : "mcq",
            attemptId:
              cleanedAttemptId,
            coinsAwarded:
              coinsEarned,
            coinRewardProcessed:
              false,
            coinRewardProcessedAt:
              null,
            correctAnswers,
            totalQuestions,
            isPassed,
          });
      } catch (createError) {
        if (
          createError?.code ===
          11000
        ) {
          const duplicateResult =
            await Result.findOne({
              user: userId,
              attemptId:
                cleanedAttemptId,
            });

          const streak =
            await applyNavtaStreakSafely(
              userId,
              duplicateResult?.createdAt ||
                new Date()
            );

          const duplicateStudent =
            await Student.findOne({
              user: userId,
            }).select(
              "coins currentStreak longestStreak lastNavtaTestDate streakRecoveryActive streakRecoveryRequired streakRecoveryCompleted streakLastUpdatedAt"
            );

          return res.status(200).json({
            success: true,
            alreadySubmitted: true,
            message:
              "This NAVTA Test attempt was already saved.",
            data: {
              result:
                duplicateResult,
              percentage:
                duplicateResult?.percentage ||
                0,
              selectedDuration:
                duplicateResult?.selectedDuration ||
                numericDuration,
              coinsEarned:
                Number(
                  duplicateResult?.coinsAwarded ||
                    0
                ),
              coinBalance:
                Number(
                  duplicateStudent?.coins ||
                    0
                ),
              newCoins:
                Number(
                  duplicateStudent?.coins ||
                    0
                ),
              streak,
            },
          });
        }

        throw createError;
      }

      // ========================================
      // APPLY COINS ONCE
      // ========================================

      const claimedReward =
        await Result.findOneAndUpdate(
          {
            _id: result._id,
            coinRewardProcessed:
              false,
          },
          {
            $set: {
              coinRewardProcessed:
                true,
              coinRewardProcessedAt:
                new Date(),
            },
          },
          {
            new: true,
          }
        );

      if (
        claimedReward &&
        coinsEarned > 0
      ) {
        // Atomic increment avoids overwriting streak
        // fields if another NAVTA TEST completion is
        // updating the Student document at the same time.
        await Student.updateOne(
          {
            user: userId,
          },
          {
            $inc: {
              coins:
                coinsEarned,
            },
          }
        );
      }

      // ========================================
      // NAVTA TEST DAILY STREAK
      // ========================================
      //
      // Any successfully saved Standard, Boss, or
      // Revenge completion qualifies, regardless of
      // score.
      //
      // Only the first qualifying completion on the
      // same India-calendar day changes streak state.
      //
      // Miss 1 day:
      //   1 recovery work day.
      //
      // Miss 2 days:
      //   2 recovery work days.
      //
      // Miss 3+ consecutive full days:
      //   old streak ends and this completion starts
      //   a new streak at 1.
      //
      // Recovery days protect the old streak but do
      // not increase currentStreak.
      // ========================================

      const streak =
        await applyNavtaStreakSafely(
          userId,
          result.createdAt ||
            new Date()
        );

      const finalStudent =
        await Student.findOne({
          user: userId,
        }).select(
          "coins xp level currentStreak longestStreak lastNavtaTestDate streakRecoveryActive streakRecoveryRequired streakRecoveryCompleted streakLastUpdatedAt"
        );

      result =
        await Result.findById(
          result._id
        );

      // ========================================
      // RESPONSE
      // ========================================

      return res.status(201).json({
        success: true,
        alreadySubmitted: false,
        message:
          "NAVTA Test performance saved successfully.",
        data: {
          result,
          percentage,
          score,
          correctAnswers,
          totalQuestions,
          selectedDuration:
            numericDuration,
          testType,
          coinsEarned,
          coinBalance:
            Number(
              finalStudent?.coins ||
                0
            ),
          newCoins:
            Number(
              finalStudent?.coins ||
                0
            ),
          streak,
        },
      });
    } catch (error) {
      console.error(
        "COMPLETE NAVTA TEST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to save NAVTA Test performance.",
        error:
          error.message,
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

      // ========================================
      // VALIDATE INPUT
      // ========================================

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

      // ========================================
      // FIND QUESTION
      // ========================================

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

      // ========================================
      // ONLY BOARDS WRITTEN ANSWERS
      // ========================================

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
        return res.status(400).json({
          success: false,
          message:
            "AI evaluation is only available for Boards written-answer questions.",
        });
      }

      // ========================================
      // CHECK OPENAI CONFIG
      // ========================================

      if (
        !process.env
          .OPENAI_API_KEY
      ) {
        return res.status(503).json({
          success: false,
          message:
            "AI evaluation is not configured yet.",
        });
      }

      // ========================================
      // BUILD EVALUATION PROMPT
      // ========================================

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

ADDITIONAL EVALUATION INSTRUCTIONS:
${question.evaluationInstructions || "None"}

STUDENT ANSWER:
${String(studentAnswer).trim()}

Evaluate the student's answer fairly.

Award marks between 0 and ${question.maxMarks}.

Use the model answer and required key points as the marking guide.

Do not require exact wording if the student's meaning is correct.

Return ONLY valid JSON.

Do not include markdown.

Do not include code fences.

Return exactly this structure:

{
  "status": "correct",
  "marksAwarded": 0,
  "maxMarks": ${question.maxMarks},
  "feedback": "",
  "missingPoints": []
}

Allowed status values:

correct
partially_correct
incorrect
`;

      // ========================================
      // CALL OPENAI RESPONSES API
      // ========================================

      const aiResponse =
        await fetch(
          "https://api.openai.com/v1/responses",
          {
            method:
              "POST",

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

      if (!aiResponse.ok) {
        console.error(
          "OPENAI EVALUATION ERROR:",
          aiData
        );

        return res.status(502).json({
          success: false,
          message:
            "AI evaluation service failed.",
        });
      }

      // ========================================
      // EXTRACT RESPONSE TEXT
      // ========================================

      let rawText = "";

      if (
        typeof aiData.output_text ===
        "string"
      ) {
        rawText =
          aiData.output_text;
      }

      if (
        !rawText &&
        Array.isArray(
          aiData.output
        )
      ) {
        for (
          const outputItem of
          aiData.output
        ) {
          if (
            !Array.isArray(
              outputItem.content
            )
          ) {
            continue;
          }

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

      // ========================================
      // PARSE AI JSON
      // ========================================

      let evaluation;

      try {
        evaluation =
          JSON.parse(
            rawText
          );
      } catch (parseError) {
        console.error(
          "AI JSON PARSE ERROR:",
          parseError
        );

        console.error(
          "AI RAW RESPONSE:",
          rawText
        );

        return res.status(502).json({
          success: false,
          message:
            "AI returned an invalid evaluation format.",
        });
      }

      // ========================================
      // VALIDATE MARKS
      // ========================================

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

      // ========================================
      // VALIDATE STATUS
      // ========================================

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

      // ========================================
      // RETURN EVALUATION
      // ========================================

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
        error:
          error.message,
      });
    }
  };
