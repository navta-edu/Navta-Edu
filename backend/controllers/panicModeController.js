const mongoose = require('mongoose');

const PanicSession = require(
  '../models/PanicSession'
);

const Result = require(
  '../models/Result'
);

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const VALID_EXAMS = [
  'NEET',
  'JEE',
  'Boards'
];

const EXAM_WINDOWS = {
  tomorrow: 1,
  '3-days': 3,
  '7-days': 7,
  '14-days': 14
};

const STUDY_TIME_OPTIONS = [
  60,
  120,
  240,
  360
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const normaliseString = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value).trim();
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
    return 'fix-first';
  }

  if (percentage < 80) {
    return 'quick-revision';
  }

  return 'strong';
};

const getPracticeQuestionCount = (
  examWindow
) => {
  switch (examWindow) {
    case 'tomorrow':
      return 5;

    case '3-days':
      return 10;

    case '7-days':
      return 15;

    case '14-days':
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

/*
|--------------------------------------------------------------------------
| Extract chapter information from a NAVTA result
|--------------------------------------------------------------------------
|
| NAVTA has had multiple Result formats during development.
| This helper intentionally supports both:
|
| chapter: "Rotational Motion"
|
| and
|
| chapters: ["Rotational Motion", ...]
|
|--------------------------------------------------------------------------
*/

const getResultChapters = (
  result
) => {
  const chapters = [];

  if (
    Array.isArray(result.chapters)
  ) {
    result.chapters.forEach(
      (chapter) => {
        const value =
          normaliseString(chapter);

        if (value) {
          chapters.push(value);
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

/*
|--------------------------------------------------------------------------
| Calculate percentage from Result
|--------------------------------------------------------------------------
*/

const getResultPercentage = (
  result
) => {
  const directPercentage =
    Number(result.percentage);

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

/*
|--------------------------------------------------------------------------
| Get total question count
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Analyse student NAVTA history
|--------------------------------------------------------------------------
*/

const analyseStudentPerformance =
  async (
    userId,
    exam
  ) => {
    /*
    |--------------------------------------------------------------------------
    | Get NAVTA results
    |--------------------------------------------------------------------------
    */

    const query = {
      user: userId
    };

    /*
    |--------------------------------------------------------------------------
    | Only include NAVTA test types
    |--------------------------------------------------------------------------
    */

    query.testType = {
      $in: [
        'standard',
        'boss',
        'revenge'
      ]
    };

    const results =
      await Result.find(
        query
      )
        .sort({
          createdAt: -1
        })
        .limit(200)
        .lean();

    /*
    |--------------------------------------------------------------------------
    | Filter exam
    |--------------------------------------------------------------------------
    */

    const relevantResults =
      results.filter(
        (result) => {
          const resultExam =
            normaliseString(
              result.exam
            );

          /*
          | Older results may not contain exam.
          | We do not throw them away automatically.
          */

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
          normaliseString(
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

        /*
        |--------------------------------------------------------------------------
        | Boss/Revenge can contain multiple chapters.
        |
        | Without per-question chapter data in the result snapshot,
        | distribute the result weight across its chapters.
        |--------------------------------------------------------------------------
        */

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
              !chapterMap.has(key)
            ) {
              chapterMap.set(
                key,
                {
                  subject,
                  chapter,

                  weightedScore: 0,

                  totalWeight: 0,

                  attempts: 0,

                  latestAttempt:
                    result.createdAt ||
                    new Date()
                }
              );
            }

            const entry =
              chapterMap.get(key);

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

    /*
    |--------------------------------------------------------------------------
    | Convert to Panic Mode chapters
    |--------------------------------------------------------------------------
    */

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
              null
          };
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Weakest chapters first
    |--------------------------------------------------------------------------
    */

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

/*
|--------------------------------------------------------------------------
| Format session for frontend
|--------------------------------------------------------------------------
*/

const formatSession = (
  session
) => {
  if (!session) {
    return null;
  }

  const source =
    typeof session.toObject ===
    'function'
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
          'fix-first'
      ),

    quickRevision:
      chapters.filter(
        (chapter) =>
          chapter.status ===
          'quick-revision'
      ),

    strong:
      chapters.filter(
        (chapter) =>
          chapter.status ===
          'strong'
      ),

    fixed:
      chapters.filter(
        (chapter) =>
          chapter.status ===
            'fixed' ||
          chapter.fixTestPassed
      )
  };
};

/*
|--------------------------------------------------------------------------
| CREATE PANIC PLAN
|--------------------------------------------------------------------------
|
| POST /api/panic-mode/plan
|
|--------------------------------------------------------------------------
*/

exports.createPanicPlan =
  async (req, res) => {
    try {
      const userId =
        req.user.id;

      const {
        exam,
        examWindow,
        studyTimeMinutes
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */

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
              'Please select NEET, JEE or Boards.'
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
              'Invalid exam window.'
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
              'Invalid study time.'
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Analyse real NAVTA TEST history
      |--------------------------------------------------------------------------
      */

      const chapters =
        await analyseStudentPerformance(
          userId,
          exam
        );

      /*
      |--------------------------------------------------------------------------
      | Close previous active plan
      |--------------------------------------------------------------------------
      */

      await PanicSession.updateMany(
        {
          user: userId,
          active: true
        },
        {
          $set: {
            active: false
          }
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Create plan
      |--------------------------------------------------------------------------
      */

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

          completed: false
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            chapters.length > 0
              ? 'Your Panic Mode plan is ready.'
              : 'Panic Mode plan created, but more NAVTA TEST data is needed to identify weak chapters.',

          data: {
            session:
              formatSession(
                session
              )
          }
        });
    } catch (error) {
      console.error(
        'Create Panic Plan Error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            'Unable to create Panic Mode plan.'
        });
    }
  };

/*
|--------------------------------------------------------------------------
| GET ACTIVE PANIC PLAN
|--------------------------------------------------------------------------
|
| GET /api/panic-mode/plan
|
|--------------------------------------------------------------------------
*/

exports.getActivePanicPlan =
  async (req, res) => {
    try {
      const session =
        await PanicSession.findOne({
          user: req.user.id,
          active: true
        }).sort({
          createdAt: -1
        });

      return res
        .status(200)
        .json({
          success: true,

          data: {
            session:
              formatSession(
                session
              )
          }
        });
    } catch (error) {
      console.error(
        'Get Panic Plan Error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            'Unable to load Panic Mode plan.'
        });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE CHAPTER PROGRESS
|--------------------------------------------------------------------------
|
| PATCH /api/panic-mode/chapters/:chapterId
|
|--------------------------------------------------------------------------
*/

exports.updateChapterProgress =
  async (req, res) => {
    try {
      const {
        chapterId
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          chapterId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              'Invalid chapter ID.'
          });
      }

      const session =
        await PanicSession.findOne({
          user: req.user.id,
          active: true,
          'chapters._id':
            chapterId
        });

      if (!session) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              'Panic Mode chapter not found.'
          });
      }

      const chapter =
        session.chapters.id(
          chapterId
        );

      if (!chapter) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              'Chapter not found.'
          });
      }

      const {
        revised,
        practised
      } = req.body;

      if (
        typeof revised ===
        'boolean'
      ) {
        chapter.revised =
          revised;
      }

      if (
        typeof practised ===
        'boolean'
      ) {
        /*
        | Practice should only be completed
        | after revision.
        */

        if (
          practised &&
          !chapter.revised
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                'Revise the Study Notes before completing targeted practice.'
            });
        }

        chapter.practised =
          practised;
      }

      await session.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            'Panic Mode progress updated.',

          data: {
            chapter,

            session:
              formatSession(
                session
              )
          }
        });
    } catch (error) {
      console.error(
        'Update Panic Progress Error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            'Unable to update Panic Mode progress.'
        });
    }
  };

/*
|--------------------------------------------------------------------------
| SAVE FIX TEST RESULT
|--------------------------------------------------------------------------
|
| POST /api/panic-mode/chapters/:chapterId/fix-test
|
|--------------------------------------------------------------------------
*/

exports.saveFixTestResult =
  async (req, res) => {
    try {
      const {
        chapterId
      } = req.params;

      const {
        percentage
      } = req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          chapterId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              'Invalid chapter ID.'
          });
      }

      const score =
        Number(percentage);

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
              'A valid Fix Test percentage is required.'
          });
      }

      const session =
        await PanicSession.findOne({
          user: req.user.id,
          active: true,
          'chapters._id':
            chapterId
        });

      if (!session) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              'Panic Mode chapter not found.'
          });
      }

      const chapter =
        session.chapters.id(
          chapterId
        );

      if (
        !chapter.practised
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              'Complete targeted practice before taking the Fix Test.'
          });
      }

      const passed =
        score >= 70;

      chapter.fixTestScore =
        Math.round(score);

      chapter.fixTestPassed =
        passed;

      if (passed) {
        chapter.status =
          'fixed';

        chapter.fixedAt =
          new Date();
      } else {
        chapter.status =
          'fix-first';

        chapter.fixedAt =
          null;
      }

      /*
      |--------------------------------------------------------------------------
      | Check whether all Fix First chapters are fixed
      |--------------------------------------------------------------------------
      */

      const unresolved =
        session.chapters.filter(
          (item) => {
            return (
              item.status ===
                'fix-first' &&
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

          message: passed
            ? 'Weakness fixed. Great work!'
            : 'You improved, but this chapter still needs work.',

          data: {
            passed,

            targetPercentage: 70,

            percentage:
              Math.round(score),

            chapter,

            session:
              formatSession(
                session
              )
          }
        });
    } catch (error) {
      console.error(
        'Save Fix Test Error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            'Unable to save Fix Test result.'
        });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE / RESET ACTIVE PANIC PLAN
|--------------------------------------------------------------------------
|
| DELETE /api/panic-mode/plan
|
|--------------------------------------------------------------------------
*/

exports.resetPanicPlan =
  async (req, res) => {
    try {
      await PanicSession.updateMany(
        {
          user: req.user.id,
          active: true
        },
        {
          $set: {
            active: false
          }
        }
      );

      return res
        .status(200)
        .json({
          success: true,
          message:
            'Panic Mode plan reset.'
        });
    } catch (error) {
      console.error(
        'Reset Panic Plan Error:',
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            'Unable to reset Panic Mode plan.'
        });
    }
  };
