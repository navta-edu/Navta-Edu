const mongoose = require("mongoose");

const PanicSession = require(
  "../models/PanicSession"
);

const PanicFixAttempt = require(
  "../models/PanicFixAttempt"
);

const Result = require(
  "../models/Result"
);

const NavtaQuestion = require(
  "../models/NavtaQuestion"
);

// ============================================
// CONFIGURATION
// ============================================


const VALID_EXAMS = [
  "NEET",
  "JEE",
  "Boards",
];

const EXAM_WINDOWS = {
  tomorrow: 1,
  "3-days": 3,
  "7-days": 7,
  "14-days": 14,
};

const STUDY_TIME_OPTIONS = [
  60,
  120,
  240,
  360,
];

const VALID_DIFFICULTIES = [
  "Easy",
  "Medium",
  "Hard",
];

const VALID_CLASS_LEVELS = [
  "Class 11",
  "Class 12",
];

const FIX_TEST_QUESTION_COUNT = 10;

const FIX_TEST_PASS_PERCENTAGE = 70;

const FIX_TEST_DURATION_MINUTES = 10;

const FIX_TEST_DIFFICULTY_TARGET = {
  Easy: 3,
  Medium: 4,
  Hard: 3,
};

// ============================================
// HELPERS
// ============================================

const normaliseString = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

const normaliseSubject = (subject) => {
  const value =
    normaliseString(subject);

  if (
    value.toLowerCase() ===
    "mathematics"
  ) {
    return "Maths";
  }

  return value;
};

const normaliseClassLevel = (value) => {
  const classLevel =
    normaliseString(value);

  if (!classLevel) {
    return "";
  }

  const compact =
    classLevel
      .toLowerCase()
      .replace(/\s+/g, "");

  if (
    compact === "class11" ||
    compact === "11" ||
    compact === "xi"
  ) {
    return "Class 11";
  }

  if (
    compact === "class12" ||
    compact === "12" ||
    compact === "xii"
  ) {
    return "Class 12";
  }

  return VALID_CLASS_LEVELS.includes(
    classLevel
  )
    ? classLevel
    : "";
};

const clampPercentage = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(number)
    )
  );
};

const getChapterStatus = (
  accuracy
) => {
  const percentage =
    clampPercentage(accuracy);

  if (percentage < 60) {
    return "fix-first";
  }

  if (percentage < 80) {
    return "quick-revision";
  }

  return "strong";
};

const getPracticeQuestionCount = (
  examWindow
) => {
  switch (examWindow) {
    case "tomorrow":
      return 5;

    case "3-days":
      return 10;

    case "7-days":
      return 15;

    case "14-days":
      return 20;

    default:
      return 10;
  }
};

const buildChapterKey = (
  subject,
  classLevel,
  chapter
) => {
  return `${normaliseString(
    subject
  ).toLowerCase()}::${normaliseClassLevel(
    classLevel
  ).toLowerCase()}::${normaliseString(
    chapter
  ).toLowerCase()}`;
};

const escapeRegex = (value) => {
  return normaliseString(value)
    .replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
};

const exactCaseInsensitive = (
  value
) => {
  return new RegExp(
    `^${escapeRegex(value)}$`,
    "i"
  );
};

const shuffleArray = (items) => {
  const copy = [...items];

  for (
    let index =
      copy.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          (index + 1)
      );

    [
      copy[index],
      copy[randomIndex],
    ] = [
      copy[randomIndex],
      copy[index],
    ];
  }

  return copy;
};

const getResultChapters = (
  result
) => {
  const chapters = [];

  if (
    Array.isArray(
      result.chapters
    )
  ) {
    result.chapters.forEach(
      (chapter) => {
        const value =
          normaliseString(
            chapter
          );

        if (value) {
          chapters.push(
            value
          );
        }
      }
    );
  }

  const singleChapter =
    normaliseString(
      result.chapter
    );

  if (
    singleChapter &&
    !chapters.includes(
      singleChapter
    )
  ) {
    chapters.push(
      singleChapter
    );
  }

  return chapters;
};

const getResultPercentage = (
  result
) => {
  const directPercentage =
    Number(
      result.percentage
    );

  if (
    Number.isFinite(
      directPercentage
    )
  ) {
    return clampPercentage(
      directPercentage
    );
  }

  const score =
    Number(result.score);

  const total =
    Number(
      result.totalQuestions
    );

  if (
    Number.isFinite(score) &&
    Number.isFinite(total) &&
    total > 0
  ) {
    return clampPercentage(
      (score / total) * 100
    );
  }

  const correctAnswers =
    Number(
      result.correctAnswers
    );

  if (
    Number.isFinite(
      correctAnswers
    ) &&
    Number.isFinite(total) &&
    total > 0
  ) {
    return clampPercentage(
      (
        correctAnswers /
        total
      ) * 100
    );
  }

  return 0;
};

const getResultQuestionCount = (
  result
) => {
  const total =
    Number(
      result.totalQuestions
    );

  if (
    Number.isFinite(total) &&
    total > 0
  ) {
    return total;
  }

  if (
    Array.isArray(
      result.answers
    )
  ) {
    return result.answers.length;
  }

  return 1;
};

const buildQuestionFilter = ({
  subject,
  exam,
  chapter,
  classLevel,
}) => {
  const filter = {
    subject:
      exactCaseInsensitive(
        normaliseSubject(
          subject
        )
      ),

    exam:
      exactCaseInsensitive(
        exam
      ),

    chapter:
      exactCaseInsensitive(
        chapter
      ),

    questionType:
      "mcq",

    isActive:
      true,
  };

  const safeClassLevel =
    normaliseClassLevel(
      classLevel
    );

  if (safeClassLevel) {
    filter.classLevel =
      exactCaseInsensitive(
        safeClassLevel
      );
  }

  return filter;
};

const sanitisePracticeQuestion = (
  question
) => {
  return {
    _id:
      question._id,

    question:
      question.question,

    questionType:
      question.questionType,

    options:
      Array.isArray(
        question.options
      )
        ? question.options
        : [],

    difficulty:
      question.difficulty,

    subject:
      question.subject,

    exam:
      question.exam,

    classLevel:
      question.classLevel,

    chapter:
      question.chapter,
  };
};

const sanitiseFixTestQuestion = (
  question
) => {
  return {
    _id:
      question._id,

    question:
      question.question,

    questionType:
      question.questionType,

    options:
      Array.isArray(
        question.options
      )
        ? question.options
        : [],

    difficulty:
      question.difficulty,

    subject:
      question.subject,

    exam:
      question.exam,

    classLevel:
      question.classLevel,

    chapter:
      question.chapter,
  };
};

const formatSession = (
  session
) => {
  if (!session) {
    return null;
  }

  const source =
    typeof session.toObject ===
    "function"
      ? session.toObject()
      : session;

  const chapters =
    Array.isArray(
      source.chapters
    )
      ? source.chapters
      : [];

  return {
    ...source,

    practiceQuestionCount:
      getPracticeQuestionCount(
        source.examWindow
      ),

    fixFirst:
      chapters.filter(
        (chapter) =>
          chapter.status ===
            "fix-first" &&
          !chapter.fixTestPassed
      ),

    quickRevision:
      chapters.filter(
        (chapter) =>
          chapter.status ===
          "quick-revision"
      ),

    strong:
      chapters.filter(
        (chapter) =>
          chapter.status ===
            "strong" ||
          chapter.status ===
            "fixed"
      ),

    fixed:
      chapters.filter(
        (chapter) =>
          chapter.status ===
            "fixed" ||
          chapter.fixTestPassed
      ),
  };
};

const getActiveSessionChapter =
  async (
    userId,
    chapterId
  ) => {
    if (
      !mongoose.Types.ObjectId.isValid(
        chapterId
      )
    ) {
      return {
        error: {
          status: 400,
          message:
            "Invalid chapter ID.",
        },
      };
    }

    const session =
      await PanicSession.findOne({
        user: userId,
        active: true,
        "chapters._id":
          chapterId,
      });

    if (!session) {
      return {
        error: {
          status: 404,
          message:
            "Panic Mode chapter not found.",
        },
      };
    }

    const chapter =
      session.chapters.id(
        chapterId
      );

    if (!chapter) {
      return {
        error: {
          status: 404,
          message:
            "Chapter not found.",
        },
      };
    }

    return {
      session,
      chapter,
    };
  };

// ============================================
// FIX TEST QUESTION SELECTION
// ============================================

const selectFixTestQuestions =
  async ({
    subject,
    exam,
    chapter,
    classLevel,
  }) => {
    const baseFilter =
      buildQuestionFilter({
        subject,
        exam,
        chapter,
        classLevel,
      });

    const allQuestions =
      await NavtaQuestion.find(
        baseFilter
      )
        .select(
          "_id question options questionType difficulty subject exam classLevel chapter"
        )
        .lean();

    if (
      allQuestions.length <
      FIX_TEST_QUESTION_COUNT
    ) {
      return {
        success: false,

        available:
          allQuestions.length,

        questions: [],
      };
    }

    const selected = [];

    const usedIds =
      new Set();

    for (
      const difficulty of
      VALID_DIFFICULTIES
    ) {
      const targetCount =
        FIX_TEST_DIFFICULTY_TARGET[
          difficulty
        ];

      const pool =
        shuffleArray(
          allQuestions.filter(
            (question) =>
              question.difficulty ===
              difficulty
          )
        );

      for (
        const question of pool
      ) {
        if (
          selected.length >=
          FIX_TEST_QUESTION_COUNT
        ) {
          break;
        }

        const currentDifficultyCount =
          selected.filter(
            (item) =>
              item.difficulty ===
              difficulty
          ).length;

        if (
          currentDifficultyCount >=
          targetCount
        ) {
          break;
        }

        const questionId =
          String(
            question._id
          );

        if (
          usedIds.has(
            questionId
          )
        ) {
          continue;
        }

        usedIds.add(
          questionId
        );

        selected.push(
          question
        );
      }
    }

    if (
      selected.length <
      FIX_TEST_QUESTION_COUNT
    ) {
      const remaining =
        shuffleArray(
          allQuestions.filter(
            (question) =>
              !usedIds.has(
                String(
                  question._id
                )
              )
          )
        );

      for (
        const question of
        remaining
      ) {
        if (
          selected.length >=
          FIX_TEST_QUESTION_COUNT
        ) {
          break;
        }

        const questionId =
          String(
            question._id
          );

        if (
          usedIds.has(
            questionId
          )
        ) {
          continue;
        }

        usedIds.add(
          questionId
        );

        selected.push(
          question
        );
      }
    }

    return {
      success:
        selected.length ===
        FIX_TEST_QUESTION_COUNT,

      available:
        allQuestions.length,

      questions:
        shuffleArray(
          selected
        ).slice(
          0,
          FIX_TEST_QUESTION_COUNT
        ),
    };
  };

// ============================================
// ANALYSE STUDENT PERFORMANCE
// ============================================

const analyseStudentPerformance =
  async (
    userId,
    exam
  ) => {
    // Panic Mode must only learn from real NAVTA TEST
    // completions. Limiting the history also keeps plan
    // creation fast as the student's history grows.
    const results =
      await Result.find({
        user: userId,
        testType: {
          $in: [
            "standard",
            "boss",
            "revenge",
          ],
        },
      })
        .sort({
          createdAt: -1,
        })
        .limit(200)
        .lean();

    const performanceMap =
      new Map();

    // Boss/Revenge results can contain questions from
    // multiple chapters. Load their real NavtaQuestion
    // records once so each chapter receives its own
    // actual performance instead of the overall battle
    // percentage.
    const battleQuestionIds = [
      ...new Set(
        results
          .filter(
            (result) =>
              result.testType === "boss" ||
              result.testType === "revenge"
          )
          .flatMap((result) =>
            Array.isArray(result.answers)
              ? result.answers
                  .map((answer) =>
                    normaliseString(
                      answer?.question
                    )
                  )
                  .filter(
                    (id) =>
                      mongoose.Types.ObjectId.isValid(
                        id
                      )
                  )
              : []
          )
      ),
    ];

    const battleQuestions =
      battleQuestionIds.length > 0
        ? await NavtaQuestion.find({
            _id: {
              $in:
                battleQuestionIds,
            },
          })
            .select(
              "_id subject exam classLevel chapter questionType"
            )
            .lean()
        : [];

    const battleQuestionMap =
      new Map(
        battleQuestions.map(
          (question) => [
            String(question._id),
            question,
          ]
        )
      );

    const addPerformance = ({
      subject,
      classLevel,
      chapter,
      correctAnswers,
      totalQuestions,
      percentage,
    }) => {
      const safeSubject =
        normaliseSubject(subject);

      const safeClassLevel =
        normaliseClassLevel(
          classLevel
        );

      const safeChapter =
        normaliseString(chapter);

      // Do not merge legacy results whose class cannot
      // be proven. New NAVTA TEST results always save
      // Class 11 / Class 12.
      if (
        !safeSubject ||
        !safeClassLevel ||
        !safeChapter
      ) {
        return;
      }

      const safeTotal =
        Math.max(
          0,
          Number(totalQuestions) ||
            0
        );

      if (safeTotal <= 0) {
        return;
      }

      const safeCorrect =
        Math.max(
          0,
          Math.min(
            safeTotal,
            Number(correctAnswers) ||
              0
          )
        );

      const safePercentage =
        Number.isFinite(
          Number(percentage)
        )
          ? clampPercentage(
              percentage
            )
          : clampPercentage(
              (
                safeCorrect /
                safeTotal
              ) * 100
            );

      const key =
        buildChapterKey(
          safeSubject,
          safeClassLevel,
          safeChapter
        );

      const existing =
        performanceMap.get(
          key
        ) || {
          subject:
            safeSubject,

          classLevel:
            safeClassLevel,

          chapter:
            safeChapter,

          weightedScore:
            0,

          totalWeight:
            0,

          attempts:
            0,
        };

      existing.weightedScore +=
        safePercentage *
        safeTotal;

      existing.totalWeight +=
        safeTotal;

      existing.attempts +=
        1;

      performanceMap.set(
        key,
        existing
      );
    };

    results.forEach(
      (result) => {
        const resultExam =
          normaliseString(
            result.exam
          );

        // Results created before exam context was stored
        // are intentionally ignored because they cannot
        // be safely assigned to a Panic Mode exam.
        if (
          !resultExam ||
          resultExam.toLowerCase() !==
            exam.toLowerCase()
        ) {
          return;
        }

        const resultSubject =
          normaliseSubject(
            result.subject
          );

        const resultClassLevel =
          normaliseClassLevel(
            result.classLevel
          );

        if (
          !resultSubject ||
          !resultClassLevel
        ) {
          return;
        }

        // ========================================
        // STANDARD TEST
        // ========================================
        //
        // A Standard Test belongs to one chapter, so
        // its server-calculated percentage is the most
        // accurate source (including Boards written
        // marking).
        // ========================================

        if (
          result.testType ===
          "standard"
        ) {
          const chapters =
            getResultChapters(
              result
            );

          const chapter =
            chapters[0];

          if (!chapter) {
            return;
          }

          const totalQuestions =
            Math.max(
              1,
              getResultQuestionCount(
                result
              )
            );

          const percentage =
            getResultPercentage(
              result
            );

          addPerformance({
            subject:
              resultSubject,

            classLevel:
              resultClassLevel,

            chapter,

            correctAnswers:
              Math.round(
                (
                  percentage /
                  100
                ) *
                  totalQuestions
              ),

            totalQuestions,

            percentage,
          });

          return;
        }

        // ========================================
        // BOSS / REVENGE
        // ========================================
        //
        // Grade chapter-by-chapter from the stored
        // answer records and the real NavtaQuestion
        // chapter metadata. This prevents a 30-question
        // battle's overall score from being copied to
        // every chapter.
        // ========================================

        const chapterStats =
          new Map();

        const answers =
          Array.isArray(
            result.answers
          )
            ? result.answers
            : [];

        answers.forEach(
          (answer) => {
            const questionId =
              normaliseString(
                answer?.question
              );

            const question =
              battleQuestionMap.get(
                questionId
              );

            if (!question) {
              return;
            }

            const questionExam =
              normaliseString(
                question.exam
              );

            const questionSubject =
              normaliseSubject(
                question.subject
              );

            const questionClassLevel =
              normaliseClassLevel(
                question.classLevel
              );

            const questionChapter =
              normaliseString(
                question.chapter
              );

            if (
              questionExam.toLowerCase() !==
                exam.toLowerCase() ||
              questionSubject !==
                resultSubject ||
              questionClassLevel !==
                resultClassLevel ||
              !questionChapter
            ) {
              return;
            }

            const key =
              buildChapterKey(
                questionSubject,
                questionClassLevel,
                questionChapter
              );

            const existing =
              chapterStats.get(
                key
              ) || {
                subject:
                  questionSubject,

                classLevel:
                  questionClassLevel,

                chapter:
                  questionChapter,

                correctAnswers:
                  0,

                totalQuestions:
                  0,
              };

            existing.totalQuestions +=
              1;

            if (
              answer?.isCorrect ===
              true
            ) {
              existing.correctAnswers +=
                1;
            }

            chapterStats.set(
              key,
              existing
            );
          }
        );

        chapterStats.forEach(
          (entry) => {
            const percentage =
              entry.totalQuestions >
              0
                ? (
                    entry.correctAnswers /
                    entry.totalQuestions
                  ) *
                  100
                : 0;

            addPerformance({
              ...entry,
              percentage,
            });
          }
        );
      }
    );

    return Array.from(
      performanceMap.values()
    )
      .map(
        (entry) => {
          const accuracy =
            entry.totalWeight > 0
              ? clampPercentage(
                  entry.weightedScore /
                    entry.totalWeight
                )
              : 0;

          const totalQuestions =
            entry.totalWeight;

          const correctAnswers =
            Math.round(
              (
                accuracy /
                100
              ) *
                totalQuestions
            );

          return {
            subject:
              entry.subject,

            classLevel:
              entry.classLevel,

            chapter:
              entry.chapter,

            accuracy,

            totalQuestions,

            correctAnswers,

            status:
              getChapterStatus(
                accuracy
              ),

            revised:
              false,

            practised:
              false,

            fixTestPassed:
              false,

            fixTestScore:
              null,

            fixedAt:
              null,
          };
        }
      )
      .sort(
        (a, b) =>
          a.accuracy -
          b.accuracy
      );
  };

// ============================================
// CREATE PANIC PLAN
// POST /api/panic-mode/plan
// ============================================

exports.createPanicPlan =
  async (req, res) => {
    try {
      const {
        exam,
        examWindow,
        studyTimeMinutes,
      } = req.body;

      const userId =
        req.user.id;

      if (
        !VALID_EXAMS.includes(
          exam
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Please select a valid exam.",
          });
      }

      if (
        !Object.prototype.hasOwnProperty.call(
          EXAM_WINDOWS,
          examWindow
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Please select a valid exam window.",
          });
      }

      const studyMinutes =
        Number(
          studyTimeMinutes
        );

      if (
        !STUDY_TIME_OPTIONS.includes(
          studyMinutes
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Please select a valid study time.",
          });
      }

      const chapters =
        await analyseStudentPerformance(
          userId,
          exam
        );

      // Close any previous active Panic Mode
      // session before creating a new one.
      await PanicSession.updateMany(
        {
          user: userId,
          active: true,
        },
        {
          $set: {
            active: false,
          },
        }
      );

      // Close unfinished Fix Test attempts from
      // previous Panic Mode sessions.
      await PanicFixAttempt.updateMany(
        {
          user: userId,
          completed: false,
        },
        {
          $set: {
            completed: true,

            submittedAt:
              new Date(),
          },
        }
      );

      const session =
        await PanicSession.create({
          user:
            userId,

          exam,

          examWindow,

          examDays:
            EXAM_WINDOWS[
              examWindow
            ],

          studyTimeMinutes:
            studyMinutes,

          chapters,

          active:
            true,

          completed:
            false,
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            chapters.length > 0
              ? "Your Panic Mode plan is ready."
              : "Panic Mode plan created, but more NAVTA TEST data is needed to identify weak chapters.",

          data: {
            session:
              formatSession(
                session
              ),
          },
        });
    } catch (error) {
      console.error(
        "CREATE PANIC PLAN ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to create Panic Mode plan.",
        });
    }
  };

// ============================================
// GET ACTIVE PANIC PLAN
// GET /api/panic-mode/plan
// ============================================

exports.getActivePanicPlan =
  async (req, res) => {
    try {
      const session =
        await PanicSession.findOne({
          user:
            req.user.id,

          active:
            true,
        }).sort({
          createdAt: -1,
        });

      return res
        .status(200)
        .json({
          success: true,

          data: {
            session:
              formatSession(
                session
              ),
          },
        });
    } catch (error) {
      console.error(
        "GET PANIC PLAN ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to load Panic Mode plan.",
        });
    }
  };

// ============================================
// UPDATE CHAPTER PROGRESS
// PATCH /api/panic-mode/chapters/:chapterId
// ============================================

exports.updateChapterProgress =
  async (req, res) => {
    try {
      const {
        chapterId,
      } = req.params;

      const lookup =
        await getActiveSessionChapter(
          req.user.id,
          chapterId
        );

      if (lookup.error) {
        return res
          .status(
            lookup.error.status
          )
          .json({
            success: false,

            message:
              lookup.error
                .message,
          });
      }

      const {
        session,
        chapter,
      } = lookup;

      const {
        revised,
        practised,
      } = req.body;

      if (
        typeof revised ===
        "boolean"
      ) {
        chapter.revised =
          revised;
      }

      if (
        typeof practised ===
          "boolean" &&
        practised === false
      ) {
        chapter.practised =
          false;
      }

      if (
        practised === true &&
        !chapter.practised
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Complete the targeted practice questions before marking practice complete.",
          });
      }

      await session.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Panic Mode progress updated.",

          data: {
            chapter,

            session:
              formatSession(
                session
              ),
          },
        });
    } catch (error) {
      console.error(
        "UPDATE PANIC PROGRESS ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to update Panic Mode progress.",
        });
    }
  };

// ============================================
// GENERATE TARGETED PRACTICE
// POST /api/panic-mode/chapters/:chapterId/practice
// ============================================

exports.generateTargetedPractice =
  async (req, res) => {
    try {
      const {
        chapterId,
      } = req.params;

      const lookup =
        await getActiveSessionChapter(
          req.user.id,
          chapterId
        );

      if (lookup.error) {
        return res
          .status(
            lookup.error.status
          )
          .json({
            success: false,

            message:
              lookup.error
                .message,
          });
      }

      const {
        session,
        chapter,
      } = lookup;

      if (!chapter.revised) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Revise the Study Notes before starting targeted practice.",
          });
      }

      // New PanicSession records already contain
      // classLevel. req.body.classLevel is kept
      // only as a fallback for older sessions.
      const requestedClassLevel =
        normaliseClassLevel(
          req.body?.classLevel
        );

      const resolvedClassLevel =
        normaliseClassLevel(
          chapter.classLevel
        ) ||
        requestedClassLevel;

      const requiredCount =
        getPracticeQuestionCount(
          session.examWindow
        );

      const filter =
        buildQuestionFilter({
          subject:
            chapter.subject,

          exam:
            session.exam,

          chapter:
            chapter.chapter,

          classLevel:
            resolvedClassLevel,
        });

      const availableQuestions =
        await NavtaQuestion.find(
          filter
        )
          .select(
            "_id question questionType options difficulty subject exam classLevel chapter"
          )
          .lean();

      if (
        availableQuestions.length ===
        0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "No active MCQ questions are available for this Panic Mode chapter yet.",

            data: {
              required:
                requiredCount,

              available:
                0,

              subject:
                chapter.subject,

              exam:
                session.exam,

              classLevel:
                resolvedClassLevel ||
                null,

              chapter:
                chapter.chapter,
            },
          });
      }

      const actualCount =
        Math.min(
          requiredCount,
          availableQuestions.length
        );

      const selected =
        shuffleArray(
          availableQuestions
        ).slice(
          0,
          actualCount
        );

      // Older PanicSession records may not contain
      // classLevel. Once we safely discover it
      // from the selected question, save it.
      const selectedClassLevel =
        resolvedClassLevel ||
        normaliseClassLevel(
          selected[0]
            ?.classLevel
        ) ||
        "";

      if (
        !chapter.classLevel &&
        selectedClassLevel
      ) {
        chapter.classLevel =
          selectedClassLevel;

        await session.save();
      }

      const difficultyCounts =
        VALID_DIFFICULTIES.reduce(
          (
            accumulator,
            difficulty
          ) => {
            accumulator[
              difficulty
            ] = selected.filter(
              (question) =>
                question.difficulty ===
                difficulty
            ).length;

            return accumulator;
          },
          {}
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            availableQuestions.length <
            requiredCount
              ? `Only ${availableQuestions.length} active questions are currently available, so NAVTA created the largest possible practice set.`
              : "Targeted practice is ready.",

          data: {
            practice: {
              mode:
                "panic-practice",

              panicSessionId:
                session._id,

              panicChapterId:
                chapter._id,

              subject:
                chapter.subject,

              exam:
                session.exam,

              classLevel:
                selectedClassLevel,

              chapter:
                chapter.chapter,

              requiredQuestionCount:
                requiredCount,

              totalQuestions:
                selected.length,

              difficultyCounts,

              questions:
                selected.map(
                  sanitisePracticeQuestion
                ),
            },
          },
        });
    } catch (error) {
      console.error(
        "GENERATE PANIC PRACTICE ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to generate targeted practice.",
        });
    }
  };

// ============================================
// PART 1 ENDS HERE
// ============================================

// ============================================
// CHECK ONE PRACTICE ANSWER
// POST /api/panic-mode/chapters/:chapterId/practice/check
// ============================================

exports.checkPracticeAnswer =
  async (req, res) => {
    try {
      const {
        chapterId,
      } = req.params;

      const {
        questionId,
        selectedOption,
      } = req.body;

      const lookup =
        await getActiveSessionChapter(
          req.user.id,
          chapterId
        );

      if (lookup.error) {
        return res
          .status(
            lookup.error.status
          )
          .json({
            success: false,

            message:
              lookup.error
                .message,
          });
      }

      const {
        session,
        chapter,
      } = lookup;

      if (!chapter.revised) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Revise the Study Notes before practice.",
          });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          questionId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid question ID.",
          });
      }

      const question =
        await NavtaQuestion.findOne({
          _id:
            questionId,

          ...buildQuestionFilter({
            subject:
              chapter.subject,

            exam:
              session.exam,

            chapter:
              chapter.chapter,

            classLevel:
              chapter.classLevel,
          }),
        }).lean();

      if (!question) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Practice question not found for this Panic Mode chapter.",
          });
      }

      const answer =
        selectedOption === null ||
        selectedOption === undefined
          ? null
          : Number(
              selectedOption
            );

      if (
        answer === null ||
        !Number.isInteger(
          answer
        ) ||
        answer < 0 ||
        answer > 3
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Please select a valid answer.",
          });
      }

      const correctAnswer =
        Number(
          question.correctAnswer
        );

      const isCorrect =
        answer ===
        correctAnswer;

      return res
        .status(200)
        .json({
          success: true,

          data: {
            questionId:
              question._id,

            selectedOption:
              answer,

            isCorrect,

            correctAnswer:
              question.correctAnswer,

            explanation:
              question.explanation ||
              "",

            difficulty:
              question.difficulty,

            classLevel:
              question.classLevel,

            chapter:
              question.chapter,
          },
        });
    } catch (error) {
      console.error(
        "CHECK PANIC PRACTICE ANSWER ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to check the practice answer.",
        });
    }
  };

// ============================================
// COMPLETE TARGETED PRACTICE
// POST /api/panic-mode/chapters/:chapterId/practice/complete
// ============================================

exports.completeTargetedPractice =
  async (req, res) => {
    try {
      const {
        chapterId,
      } = req.params;

      const {
        questionIds = [],
      } = req.body;

      const lookup =
        await getActiveSessionChapter(
          req.user.id,
          chapterId
        );

      if (lookup.error) {
        return res
          .status(
            lookup.error.status
          )
          .json({
            success: false,

            message:
              lookup.error
                .message,
          });
      }

      const {
        session,
        chapter,
      } = lookup;

      if (!chapter.revised) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Revise the Study Notes before completing targeted practice.",
          });
      }

      const uniqueIds = [
        ...new Set(
          (
            Array.isArray(
              questionIds
            )
              ? questionIds
              : []
          )
            .map((id) =>
              normaliseString(
                id
              )
            )
            .filter(
              (id) =>
                mongoose.Types.ObjectId.isValid(
                  id
                )
            )
        ),
      ];

      if (
        uniqueIds.length ===
        0
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Completed practice question IDs are required.",
          });
      }

      const validQuestionCount =
        await NavtaQuestion.countDocuments({
          _id: {
            $in:
              uniqueIds,
          },

          ...buildQuestionFilter({
            subject:
              chapter.subject,

            exam:
              session.exam,

            chapter:
              chapter.chapter,

            classLevel:
              chapter.classLevel,
          }),
        });

      if (
        validQuestionCount !==
        uniqueIds.length
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "One or more submitted questions do not belong to this targeted practice chapter.",
          });
      }

      const intendedCount =
        getPracticeQuestionCount(
          session.examWindow
        );

      const availableCount =
        await NavtaQuestion.countDocuments(
          buildQuestionFilter({
            subject:
              chapter.subject,

            exam:
              session.exam,

            chapter:
              chapter.chapter,

            classLevel:
              chapter.classLevel,
          })
        );

      const minimumRequired =
        Math.min(
          intendedCount,
          availableCount
        );

      if (
        uniqueIds.length <
        minimumRequired
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              `Complete all ${minimumRequired} targeted practice questions before unlocking the Fix Test.`,

            data: {
              required:
                minimumRequired,

              completed:
                uniqueIds.length,
            },
          });
      }

      chapter.practised =
        true;

      await session.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Targeted practice completed. Fix Test unlocked.",

          data: {
            completedQuestions:
              uniqueIds.length,

            chapter,

            session:
              formatSession(
                session
              ),
          },
        });
    } catch (error) {
      console.error(
        "COMPLETE PANIC PRACTICE ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to complete targeted practice.",
        });
    }
  };

// ============================================
// START SECURE FIX TEST
// POST /api/panic-mode/chapters/:chapterId/fix-test/start
// ============================================

exports.startFixTest =
  async (req, res) => {
    try {
      const {
        chapterId,
      } = req.params;

      const lookup =
        await getActiveSessionChapter(
          req.user.id,
          chapterId
        );

      if (lookup.error) {
        return res
          .status(
            lookup.error.status
          )
          .json({
            success: false,

            message:
              lookup.error.message,
          });
      }

      const {
        session,
        chapter,
      } = lookup;

      // ----------------------------------------
      // PRACTICE MUST BE COMPLETED
      // ----------------------------------------

      if (!chapter.practised) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Complete targeted practice before starting the Fix Test.",
          });
      }

      // ----------------------------------------
      // ALREADY FIXED
      // ----------------------------------------

      if (
        chapter.fixTestPassed ||
        chapter.status ===
          "fixed"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "This chapter has already been fixed.",
          });
      }

      // ----------------------------------------
      // EXISTING ACTIVE ATTEMPT
      // ----------------------------------------

      const existingAttempt =
        await PanicFixAttempt.findOne({
          user:
            req.user.id,

          panicSession:
            session._id,

          panicChapterId:
            chapter._id,

          completed:
            false,
        }).sort({
          createdAt: -1,
        });

      if (existingAttempt) {
        const now =
          new Date();

        if (
          existingAttempt.expiresAt >
          now
        ) {
          const existingQuestions =
            await NavtaQuestion.find({
              _id: {
                $in:
                  existingAttempt.questionIds,
              },

              isActive:
                true,
            })
              .select(
                "_id question questionType options difficulty subject exam classLevel chapter"
              )
              .lean();

          const questionMap =
            new Map(
              existingQuestions.map(
                (question) => [
                  String(
                    question._id
                  ),

                  question,
                ]
              )
            );

          const orderedQuestions =
            existingAttempt.questionIds
              .map((id) =>
                questionMap.get(
                  String(id)
                )
              )
              .filter(Boolean);

          if (
            orderedQuestions.length ===
            existingAttempt
              .questionIds
              .length
          ) {
            return res
              .status(200)
              .json({
                success: true,

                message:
                  "Your active Fix Test has been restored.",

                data: {
                  fixTest: {
                    attemptId:
                      existingAttempt._id,

                    panicSessionId:
                      session._id,

                    panicChapterId:
                      chapter._id,

                    subject:
                      chapter.subject,

                    exam:
                      session.exam,

                    chapter:
                      chapter.chapter,

                    classLevel:
                      existingAttempt
                        .classLevel ||
                      chapter.classLevel ||
                      "",

                    totalQuestions:
                      existingAttempt
                        .totalQuestions,

                    targetPercentage:
                      FIX_TEST_PASS_PERCENTAGE,

                    durationMinutes:
                      FIX_TEST_DURATION_MINUTES,

                    startedAt:
                      existingAttempt
                        .startedAt,

                    expiresAt:
                      existingAttempt
                        .expiresAt,

                    questions:
                      orderedQuestions.map(
                        sanitiseFixTestQuestion
                      ),
                  },
                },
              });
          }

          // Questions belonging to the saved
          // attempt were removed/deactivated.
          // Close it and create a fresh attempt.

          existingAttempt.completed =
            true;

          existingAttempt.submittedAt =
            now;

          await existingAttempt.save();
        } else {
          // ------------------------------------
          // EXPIRED ATTEMPT
          // ------------------------------------

          existingAttempt.completed =
            true;

          existingAttempt.submittedAt =
            existingAttempt.expiresAt;

          existingAttempt.correctAnswers =
            0;

          existingAttempt.percentage =
            0;

          existingAttempt.passed =
            false;

          await existingAttempt.save();
        }
      }

      // ----------------------------------------
      // RESOLVE CLASS LEVEL
      // ----------------------------------------

      const requestedClassLevel =
        normaliseClassLevel(
          req.body?.classLevel
        );

      // PanicSession's stored class is now
      // authoritative. Body value is only a
      // fallback for older Panic Sessions.

      const resolvedClassLevel =
        normaliseClassLevel(
          chapter.classLevel
        ) ||
        requestedClassLevel;

      // ----------------------------------------
      // SELECT 10 QUESTIONS
      // ----------------------------------------

      const selection =
        await selectFixTestQuestions({
          subject:
            chapter.subject,

          exam:
            session.exam,

          chapter:
            chapter.chapter,

          classLevel:
            resolvedClassLevel,
        });

      if (!selection.success) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              `At least ${FIX_TEST_QUESTION_COUNT} active MCQ questions are required for the secure Fix Test. Only ${selection.available} are currently available.`,

            data: {
              required:
                FIX_TEST_QUESTION_COUNT,

              available:
                selection.available,

              subject:
                chapter.subject,

              exam:
                session.exam,

              classLevel:
                resolvedClassLevel ||
                null,

              chapter:
                chapter.chapter,
            },
          });
      }

      const questions =
        selection.questions;

      // ----------------------------------------
      // FINAL CLASS LEVEL
      // ----------------------------------------

      const selectedClassLevel =
        resolvedClassLevel ||
        normaliseClassLevel(
          questions[0]
            ?.classLevel
        ) ||
        undefined;

      // Backfill classLevel into older Panic
      // Session chapters when it can be safely
      // determined from the selected questions.

      if (
        !chapter.classLevel &&
        selectedClassLevel
      ) {
        chapter.classLevel =
          selectedClassLevel;

        await session.save();
      }

      // ----------------------------------------
      // SERVER-SIDE TIMER
      // ----------------------------------------

      const startedAt =
        new Date();

      const expiresAt =
        new Date(
          startedAt.getTime() +
            FIX_TEST_DURATION_MINUTES *
              60 *
              1000
        );

      // ----------------------------------------
      // CREATE SECURE ATTEMPT
      // ----------------------------------------

      const attempt =
        await PanicFixAttempt.create({
          user:
            req.user.id,

          panicSession:
            session._id,

          panicChapterId:
            chapter._id,

          subject:
            normaliseSubject(
              chapter.subject
            ),

          exam:
            session.exam,

          chapter:
            chapter.chapter,

          classLevel:
            selectedClassLevel,

          questionIds:
            questions.map(
              (question) =>
                question._id
            ),

          answers:
            [],

          totalQuestions:
            FIX_TEST_QUESTION_COUNT,

          correctAnswers:
            0,

          percentage:
            0,

          passed:
            false,

          startedAt,

          expiresAt,

          completed:
            false,
        });

      // ----------------------------------------
      // IMPORTANT:
      // correctAnswer and explanation are NOT
      // exposed before the student submits.
      // ----------------------------------------

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Fix Test started. You have 10 minutes.",

          data: {
            fixTest: {
              attemptId:
                attempt._id,

              panicSessionId:
                session._id,

              panicChapterId:
                chapter._id,

              subject:
                chapter.subject,

              exam:
                session.exam,

              chapter:
                chapter.chapter,

              classLevel:
                selectedClassLevel ||
                "",

              totalQuestions:
                FIX_TEST_QUESTION_COUNT,

              targetPercentage:
                FIX_TEST_PASS_PERCENTAGE,

              durationMinutes:
                FIX_TEST_DURATION_MINUTES,

              startedAt,

              expiresAt,

              questions:
                questions.map(
                  sanitiseFixTestQuestion
                ),
            },
          },
        });
    } catch (error) {
      console.error(
        "START PANIC FIX TEST ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to start the Fix Test.",
        });
    }
  };

// ============================================
// SUBMIT SECURE FIX TEST
// POST /api/panic-mode/chapters/:chapterId/fix-test/submit
// ============================================

exports.submitFixTest =
  async (req, res) => {
    try {
      const {
        chapterId,
      } = req.params;

      const {
        attemptId,
        answers = [],
      } = req.body;

      // ----------------------------------------
      // VALIDATE PANIC CHAPTER
      // ----------------------------------------

      const lookup =
        await getActiveSessionChapter(
          req.user.id,
          chapterId
        );

      if (lookup.error) {
        return res
          .status(
            lookup.error.status
          )
          .json({
            success: false,

            message:
              lookup.error.message,
          });
      }

      const {
        session,
        chapter,
      } = lookup;

      // ----------------------------------------
      // PRACTICE MUST STILL BE COMPLETE
      // ----------------------------------------

      if (!chapter.practised) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Complete targeted practice before submitting the Fix Test.",
          });
      }

      // ----------------------------------------
      // VALIDATE ATTEMPT ID
      // ----------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          attemptId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid Fix Test attempt.",
          });
      }

      // ----------------------------------------
      // FIND SECURE ATTEMPT
      // ----------------------------------------

      const attempt =
        await PanicFixAttempt.findOne({
          _id:
            attemptId,

          user:
            req.user.id,

          panicSession:
            session._id,

          panicChapterId:
            chapter._id,
        });

      if (!attempt) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Fix Test attempt not found.",
          });
      }

      // ----------------------------------------
      // PREVENT DOUBLE SUBMISSION
      // ----------------------------------------

      if (attempt.completed) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "This Fix Test has already been submitted.",
          });
      }

      // ----------------------------------------
      // SERVER-SIDE EXPIRY
      // ----------------------------------------

      const now =
        new Date();

      if (
        now >
        attempt.expiresAt
      ) {
        attempt.completed =
          true;

        attempt.submittedAt =
          attempt.expiresAt;

        attempt.correctAnswers =
          0;

        attempt.percentage =
          0;

        attempt.passed =
          false;

        attempt.answers =
          [];

        await attempt.save();

        chapter.fixTestScore =
          0;

        chapter.fixTestPassed =
          false;

        chapter.status =
          "fix-first";

        chapter.fixedAt =
          null;

        session.completed =
          false;

        session.completedAt =
          null;

        await session.save();

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Fix Test time expired. Start a new Fix Test and try again.",

            expired:
              true,

            data: {
              expired:
                true,

              percentage:
                0,

              passed:
                false,

              targetPercentage:
                FIX_TEST_PASS_PERCENTAGE,

              session:
                formatSession(
                  session
                ),
            },
          });
      }

      // ----------------------------------------
      // VALIDATE ANSWERS ARRAY
      // ----------------------------------------

      if (
        !Array.isArray(
          answers
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Fix Test answers must be provided.",
          });
      }

      // ----------------------------------------
      // ALLOWED QUESTION IDS
      // ----------------------------------------

      const allowedQuestionIds =
        new Set(
          attempt.questionIds.map(
            (id) =>
              String(id)
          )
        );

      // ----------------------------------------
      // NORMALISE SUBMITTED ANSWERS
      // ----------------------------------------

      const submittedAnswerMap =
        new Map();

      for (
        const answer of
        answers
      ) {
        const questionId =
          normaliseString(
            answer?.questionId
          );

        if (
          !questionId ||
          !mongoose.Types.ObjectId.isValid(
            questionId
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "One or more Fix Test answers contain an invalid question ID.",
            });
        }

        if (
          !allowedQuestionIds.has(
            questionId
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "One or more submitted answers do not belong to this Fix Test.",
            });
        }

        if (
          submittedAnswerMap.has(
            questionId
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                "A Fix Test question was submitted more than once.",
            });
        }

        const rawSelectedOption =
          answer?.selectedOption;

        let selectedOption =
          null;

        if (
          rawSelectedOption !==
            null &&
          rawSelectedOption !==
            undefined &&
          rawSelectedOption !==
            ""
        ) {
          selectedOption =
            Number(
              rawSelectedOption
            );

          if (
            !Number.isInteger(
              selectedOption
            ) ||
            selectedOption < 0 ||
            selectedOption > 3
          ) {
            return res
              .status(400)
              .json({
                success: false,

                message:
                  "One or more Fix Test answers contain an invalid option.",
              });
          }
        }

        submittedAnswerMap.set(
          questionId,
          selectedOption
        );
      }

      // ----------------------------------------
      // LOAD ORIGINAL QUESTIONS
      // ----------------------------------------

      const questions =
        await NavtaQuestion.find({
          _id: {
            $in:
              attempt.questionIds,
          },
        })
          .select(
            "_id question options correctAnswer explanation difficulty subject exam classLevel chapter isActive questionType"
          )
          .lean();

      if (
        questions.length !==
        attempt.questionIds.length
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "One or more Fix Test questions are no longer available.",
          });
      }

      // ----------------------------------------
      // EXTRA SECURITY:
      // Verify questions still belong to the
      // correct subject/exam/chapter/class.
      // ----------------------------------------

      const expectedSubject =
        normaliseSubject(
          chapter.subject
        ).toLowerCase();

      const expectedExam =
        normaliseString(
          session.exam
        ).toLowerCase();

      const expectedChapter =
        normaliseString(
          chapter.chapter
        ).toLowerCase();

      const expectedClassLevel =
        normaliseClassLevel(
          chapter.classLevel ||
          attempt.classLevel
        );

      const invalidStoredQuestion =
        questions.some(
          (question) => {
            const questionSubject =
              normaliseSubject(
                question.subject
              ).toLowerCase();

            const questionExam =
              normaliseString(
                question.exam
              ).toLowerCase();

            const questionChapter =
              normaliseString(
                question.chapter
              ).toLowerCase();

            const questionClassLevel =
              normaliseClassLevel(
                question.classLevel
              );

            if (
              questionSubject !==
                expectedSubject ||
              questionExam !==
                expectedExam ||
              questionChapter !==
                expectedChapter
            ) {
              return true;
            }

            if (
              expectedClassLevel &&
              questionClassLevel !==
                expectedClassLevel
            ) {
              return true;
            }

            return false;
          }
        );

      if (invalidStoredQuestion) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "This Fix Test contains a question that does not belong to the selected Panic Mode chapter.",
          });
      }

      // ----------------------------------------
      // RESTORE ORIGINAL QUESTION ORDER
      // ----------------------------------------

      const questionMap =
        new Map(
          questions.map(
            (question) => [
              String(
                question._id
              ),

              question,
            ]
          )
        );

      // ----------------------------------------
      // SERVER-SIDE GRADING
      // ----------------------------------------

      let correctAnswers =
        0;

      const gradedAnswers =
        [];

      const review =
        [];

      for (
        const questionId of
        attempt.questionIds
      ) {
        const id =
          String(
            questionId
          );

        const question =
          questionMap.get(
            id
          );

        if (!question) {
          continue;
        }

        const selectedOption =
          submittedAnswerMap.has(
            id
          )
            ? submittedAnswerMap.get(
                id
              )
            : null;

        const correctAnswer =
          Number(
            question.correctAnswer
          );

        const isCorrect =
          selectedOption !==
            null &&
          selectedOption ===
            correctAnswer;

        if (isCorrect) {
          correctAnswers +=
            1;
        }

        gradedAnswers.push({
          question:
            question._id,

          selectedOption,

          isCorrect,
        });

        review.push({
          questionId:
            question._id,

          question:
            question.question,

          options:
            Array.isArray(
              question.options
            )
              ? question.options
              : [],

          selectedOption,

          correctAnswer,

          isCorrect,

          explanation:
            question.explanation ||
            "",

          difficulty:
            question.difficulty,

          classLevel:
            question.classLevel,

          chapter:
            question.chapter,
        });
      }

      // ----------------------------------------
      // CALCULATE RESULT
      // ----------------------------------------

      const totalQuestions =
        attempt.questionIds.length;

      const percentage =
        totalQuestions > 0
          ? Math.round(
              (
                correctAnswers /
                totalQuestions
              ) * 100
            )
          : 0;

      const passed =
        percentage >=
        FIX_TEST_PASS_PERCENTAGE;

      // ----------------------------------------
      // SAVE FIX TEST ATTEMPT
      // ----------------------------------------

      attempt.answers =
        gradedAnswers;

      attempt.totalQuestions =
        totalQuestions;

      attempt.correctAnswers =
        correctAnswers;

      attempt.percentage =
        percentage;

      attempt.passed =
        passed;

      attempt.completed =
        true;

      attempt.submittedAt =
        now;

      await attempt.save();

      // ----------------------------------------
      // UPDATE PANIC CHAPTER
      // ----------------------------------------

      chapter.fixTestScore =
        percentage;

      chapter.fixTestPassed =
        passed;

      if (
        !chapter.classLevel &&
        attempt.classLevel
      ) {
        chapter.classLevel =
          normaliseClassLevel(
            attempt.classLevel
          ) ||
          undefined;
      }

      if (passed) {
        chapter.status =
          "fixed";

        chapter.fixedAt =
          now;
      } else {
        chapter.status =
          "fix-first";

        chapter.fixedAt =
          null;
      }

      // ----------------------------------------
      // CHECK PANIC PLAN COMPLETION
      // ----------------------------------------

      const unresolved =
        session.chapters.filter(
          (item) =>
            item.status ===
              "fix-first" &&
            !item.fixTestPassed
        );

      if (
        unresolved.length ===
        0
      ) {
        session.completed =
          true;

        session.completedAt =
          now;
      } else {
        session.completed =
          false;

        session.completedAt =
          null;
      }

      await session.save();

      // ----------------------------------------
      // RESPONSE
      // ----------------------------------------

      return res
        .status(200)
        .json({
          success: true,

          message:
            passed
              ? "Weakness fixed! You passed the Fix Test."
              : "You did not reach 70% yet. Review the chapter and retry the Fix Test.",

          data: {
            result: {
              attemptId:
                attempt._id,

              panicSessionId:
                session._id,

              panicChapterId:
                chapter._id,

              subject:
                chapter.subject,

              exam:
                session.exam,

              classLevel:
                chapter.classLevel ||
                attempt.classLevel ||
                "",

              chapter:
                chapter.chapter,

              totalQuestions,

              correctAnswers,

              percentage,

              passed,

              targetPercentage:
                FIX_TEST_PASS_PERCENTAGE,

              submittedAt:
                attempt.submittedAt,

              review,
            },

            chapter,

            session:
              formatSession(
                session
              ),
          },
        });
    } catch (error) {
      console.error(
        "SUBMIT PANIC FIX TEST ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to submit the Fix Test.",
        });
    }
  };

// ============================================
// RESET PANIC PLAN
// DELETE /api/panic-mode/plan
// ============================================

exports.resetPanicPlan =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      // Find currently active sessions first so
      // unfinished secure Fix Tests belonging to
      // them can also be closed.

      const activeSessions =
        await PanicSession.find({
          user:
            userId,

          active:
            true,
        })
          .select(
            "_id"
          )
          .lean();

      const activeSessionIds =
        activeSessions.map(
          (session) =>
            session._id
        );

      if (
        activeSessionIds.length >
        0
      ) {
        await PanicFixAttempt.updateMany(
          {
            user:
              userId,

            panicSession: {
              $in:
                activeSessionIds,
            },

            completed:
              false,
          },
          {
            $set: {
              completed:
                true,

              submittedAt:
                new Date(),
            },
          }
        );
      }

      await PanicSession.updateMany(
        {
          user:
            userId,

          active:
            true,
        },
        {
          $set: {
            active:
              false,

            completed:
              false,

            completedAt:
              null,
          },
        }
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Panic Mode plan reset successfully.",

          data: {
            session:
              null,
          },
        });
    } catch (error) {
      console.error(
        "RESET PANIC PLAN ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to reset Panic Mode plan.",
        });
    }
  };
