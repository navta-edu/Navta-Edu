const mongoose = require("mongoose");

const PanicSession = require(
  "../models/PanicSession"
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

const VALID_QUESTION_TYPES = [
  "mcq",
];

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

      // Keep backwards compatibility, but do not
      // allow the frontend to fake practice completion.
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
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Please select an answer.",
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
// SAVE FIX TEST RESULT
// POST /api/panic-mode/chapters/:chapterId/fix-test
// ============================================

exports.saveFixTestResult =
  async (req, res) => {
    try {
      const {
        chapterId,
      } = req.params;

      const {
        percentage,
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

      const score =
        Number(
          percentage
        );

      if (
        !Number.isFinite(score) ||
        score < 0 ||
        score > 100
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "A valid Fix Test percentage is required.",
          });
      }

      if (
        !chapter.practised
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Complete targeted practice before taking the Fix Test.",
          });
      }

      const passed =
        score >= 70;

      chapter.fixTestScore =
        Math.round(
          score
        );

      chapter.fixTestPassed =
        passed;

      if (passed) {
        chapter.status =
          "fixed";

        chapter.fixedAt =
          new Date();
      } else {
        chapter.status =
          "fix-first";

        chapter.fixedAt =
          null;
      }

      const unresolved =
        session.chapters.filter(
          (item) => {
            return (
              item.status ===
                "fix-first" &&
              !item.fixTestPassed
            );
          }
        );

      if (
        unresolved.length === 0
      ) {
        session.completed =
          true;

        session.completedAt =
          new Date();
      }

      await session.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            passed
              ? "Weakness fixed. Great work!"
              : "You improved, but this chapter still needs work.",

          data: {
            passed,

            targetPercentage:
              70,

            percentage:
              Math.round(
                score
              ),

            chapter,

            session:
              formatSession(
                session
              ),
          },
        });
    } catch (error) {
      console.error(
        "SAVE PANIC FIX TEST ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to save Fix Test result.",
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
