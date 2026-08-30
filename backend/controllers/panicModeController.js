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
  chapter
) => {
  return `${normaliseString(
    subject
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

  if (
    normaliseString(
      classLevel
    )
  ) {
    filter.classLevel =
      exactCaseInsensitive(
        classLevel
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

        if (
          selected.filter(
            (item) =>
              item.difficulty ===
              difficulty
          ).length >=
          targetCount
        ) {
          break;
        }

        const id =
          String(
            question._id
          );

        if (
          usedIds.has(id)
        ) {
          continue;
        }

        usedIds.add(id);

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
        const question of remaining
      ) {
        if (
          selected.length >=
          FIX_TEST_QUESTION_COUNT
        ) {
          break;
        }

        usedIds.add(
          String(
            question._id
          )
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
          selected.slice(
            0,
            FIX_TEST_QUESTION_COUNT
          )
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

    const relevantResults =
      results.filter(
        (result) => {
          const resultExam =
            normaliseString(
              result.exam
            );

          if (!resultExam) {
            return true;
          }

          return (
            resultExam.toLowerCase() ===
            exam.toLowerCase()
          );
        }
      );

    const chapterMap =
      new Map();

    relevantResults.forEach(
      (result) => {
        const subject =
          normaliseSubject(
            result.subject
          );

        const chapters =
          getResultChapters(
            result
          );

        if (
          !subject ||
          chapters.length === 0
        ) {
          return;
        }

        const percentage =
          getResultPercentage(
            result
          );

        const totalQuestions =
          getResultQuestionCount(
            result
          );

        const questionWeight =
          Math.max(
            1,
            totalQuestions /
              chapters.length
          );

        chapters.forEach(
          (chapter) => {
            const key =
              buildChapterKey(
                subject,
                chapter
              );

            if (
              !chapterMap.has(
                key
              )
            ) {
              chapterMap.set(
                key,
                {
                  subject,
                  chapter,
                  weightedScore: 0,
                  totalWeight: 0,
                  attempts: 0,
                }
              );
            }

            const entry =
              chapterMap.get(
                key
              );

            entry.weightedScore +=
              percentage *
              questionWeight;

            entry.totalWeight +=
              questionWeight;

            entry.attempts += 1;
          }
        );
      }
    );

    const chapters =
      Array.from(
        chapterMap.values()
      ).map(
        (entry) => {
          const accuracy =
            entry.totalWeight > 0
              ? clampPercentage(
                  entry.weightedScore /
                    entry.totalWeight
                )
              : 0;

          return {
            subject:
              entry.subject,

            chapter:
              entry.chapter,

            accuracy,

            totalQuestions:
              Math.round(
                entry.totalWeight
              ),

            correctAnswers:
              Math.round(
                (
                  accuracy /
                  100
                ) *
                  entry.totalWeight
              ),

            status:
              getChapterStatus(
                accuracy
              ),

            revised: false,

            practised: false,

            fixTestPassed:
              false,

            fixTestScore:
              null,
          };
        }
      );

    chapters.sort(
      (a, b) => {
        if (
          a.accuracy !==
          b.accuracy
        ) {
          return (
            a.accuracy -
            b.accuracy
          );
        }

        return (
          b.totalQuestions -
          a.totalQuestions
        );
      }
    );

    return chapters;
  };

// ============================================
// CREATE PANIC PLAN
// POST /api/panic-mode/plan
// ============================================

exports.createPanicPlan =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      const {
        exam,
        examWindow,
        studyTimeMinutes,
      } = req.body;

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
              "Please select NEET, JEE or Boards.",
          });
      }

      if (
        !EXAM_WINDOWS[
          examWindow
        ]
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid exam window.",
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
              "Invalid study time.",
          });
      }

      const chapters =
        await analyseStudentPerformance(
          userId,
          exam
        );

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
          user: userId,

          exam,

          examWindow,

          examDays:
            EXAM_WINDOWS[
              examWindow
            ],

          studyTimeMinutes:
            studyMinutes,

          chapters,

          active: true,

          completed: false,
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

      const requestedClassLevel =
        normaliseString(
          req.body?.classLevel
        );

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
            requestedClassLevel,
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

              chapter:
                chapter.chapter,

              classLevel:
                requestedClassLevel ||
                selected[0]
                  ?.classLevel ||
                "",

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
        selectedOption ===
          null ||
        selectedOption ===
          undefined
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

      const uniqueIds =
        [
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
      // TARGETED PRACTICE MUST BE COMPLETED
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
      // IF ALREADY FIXED
      // ----------------------------------------

      if (
        chapter.fixTestPassed ||
        chapter.status === "fixed"
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
      // CHECK FOR AN EXISTING ACTIVE ATTEMPT
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
            existingAttempt.questionIds.length
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
                      existingAttempt.classLevel ||
                      "",

                    totalQuestions:
                      existingAttempt.totalQuestions,

                    targetPercentage:
                      FIX_TEST_PASS_PERCENTAGE,

                    durationMinutes:
                      FIX_TEST_DURATION_MINUTES,

                    startedAt:
                      existingAttempt.startedAt,

                    expiresAt:
                      existingAttempt.expiresAt,

                    questions:
                      orderedQuestions.map(
                        sanitiseFixTestQuestion
                      ),
                  },
                },
              });
          }

          // If questions were removed/deactivated,
          // close this attempt and create a fresh one.
          existingAttempt.completed =
            true;

          existingAttempt.submittedAt =
            now;

          await existingAttempt.save();
        } else {
          // --------------------------------------
          // EXPIRED ATTEMPT
          // --------------------------------------

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
      // OPTIONAL CLASS LEVEL
      // ----------------------------------------

      const requestedClassLevel =
        normaliseString(
          req.body?.classLevel
        );

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
            requestedClassLevel,
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

              chapter:
                chapter.chapter,
            },
          });
      }

      const questions =
        selection.questions;

      // ----------------------------------------
      // CLASS LEVEL
      // ----------------------------------------

      const selectedClassLevel =
        requestedClassLevel ||
        questions[0]
          ?.classLevel ||
        undefined;

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
      // RETURN SANITISED QUESTIONS
      // correctAnswer IS NOT returned
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
      // VALIDATE CHAPTER
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
      // FIND ATTEMPT
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
      // SERVER-SIDE EXPIRY CHECK
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
      // VALIDATE ANSWERS
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
      // BUILD QUESTION ID SET
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
        const answer of answers
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
      // LOAD QUESTIONS FROM DATABASE
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
      // MAP QUESTIONS FOR ORIGINAL ORDER
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
        });
      }

      // ----------------------------------------
      // CALCULATE SCORE
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
      // SAVE ATTEMPT
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
      // CHECK IF PANIC PLAN IS COMPLETE
      // ----------------------------------------

      const unresolved =
        session.chapters.filter(
          (item) =>
            item.status ===
              "fix-first" &&
            !item.fixTestPassed
        );

      if (
        unresolved.length === 0
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
              : "You scored below 70%. Review this chapter and try the Fix Test again.",

          data: {
            result: {
              attemptId:
                attempt._id,

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
// RESET ACTIVE PANIC PLAN
// DELETE /api/panic-mode/plan
// ============================================

exports.resetPanicPlan =
  async (req, res) => {
    try {
      const activeSessions =
        await PanicSession.find({
          user:
            req.user.id,

          active:
            true,
        }).select("_id");

      const sessionIds =
        activeSessions.map(
          (session) =>
            session._id
        );

      // ----------------------------------------
      // CLOSE ACTIVE FIX TESTS
      // ----------------------------------------

      if (
        sessionIds.length > 0
      ) {
        await PanicFixAttempt.updateMany(
          {
            user:
              req.user.id,

            panicSession: {
              $in:
                sessionIds,
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

              passed:
                false,
            },
          }
        );
      }

      // ----------------------------------------
      // CLOSE PANIC SESSIONS
      // ----------------------------------------

      await PanicSession.updateMany(
        {
          user:
            req.user.id,

          active:
            true,
        },
        {
          $set: {
            active:
              false,
          },
        }
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Panic Mode plan reset.",
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
