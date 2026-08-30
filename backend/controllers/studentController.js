const Student = require('../models/Student');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');
const Reward = require('../models/Reward');
const Achievement = require('../models/Achievement');
const User = require('../models/User');

const PERFORMANCE_TIME_ZONE = 'Asia/Kolkata';

/*
|--------------------------------------------------------------------------
| Helper: Get selected test duration
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Coin reward depends on the SELECTED test duration,
| not on how quickly the student actually finishes.
|
*/
const getSelectedDurationMinutes = (
  test,
  requestedDuration
) => {
  const testDuration = Number(test?.duration);

  // Prefer duration stored on the Test itself.
  if (
    Number.isFinite(testDuration) &&
    testDuration > 0
  ) {
    return testDuration;
  }

  // Fallback for NAVTA generated tests where the selected
  // duration may be sent from the frontend.
  const bodyDuration = Number(requestedDuration);

  if (
    Number.isFinite(bodyDuration) &&
    bodyDuration > 0
  ) {
    return bodyDuration;
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| Helper: Calculate NAVTA Test coin reward
|--------------------------------------------------------------------------
|
| Score > 80%
|
| Duration < 30 minutes:
| +1 coin
|
| Duration >= 30 minutes:
| +2 coins
|
| Score <= 80%:
| +0 coins
|
*/
const calculateTestCoins = (
  percentage,
  selectedDuration
) => {
  if (percentage <= 80) {
    return 0;
  }

  if (selectedDuration < 30) {
    return 1;
  }

  return 2;
};

/*
|--------------------------------------------------------------------------
| Helper: Date in India timezone
|--------------------------------------------------------------------------
|
| This is used so tests taken on the same Indian calendar day
| are grouped together in Performance Overview.
|
*/
const getDatePartsInTimeZone = (date) => {
  const parts = new Intl.DateTimeFormat(
    'en-GB',
    {
      timeZone: PERFORMANCE_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ).formatToParts(new Date(date));

  const values = {};

  parts.forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });

  return {
    year: values.year,
    month: values.month,
    day: values.day,

    key: `${values.year}-${values.month}-${values.day}`
  };
};

/*
|--------------------------------------------------------------------------
| Helper: Short graph date
|--------------------------------------------------------------------------
|
| Example:
| 28 Aug
|
*/
const formatGraphDate = (date) => {
  return new Intl.DateTimeFormat(
    'en-GB',
    {
      timeZone: PERFORMANCE_TIME_ZONE,
      day: '2-digit',
      month: 'short'
    }
  ).format(new Date(date));
};

/*
|--------------------------------------------------------------------------
| Helper: Full graph date
|--------------------------------------------------------------------------
|
| Example:
| 28 Aug 2026
|
*/
const formatFullGraphDate = (date) => {
  return new Intl.DateTimeFormat(
    'en-GB',
    {
      timeZone: PERFORMANCE_TIME_ZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  ).format(new Date(date));
};


/*
|--------------------------------------------------------------------------
| NAVTA TEST STREAK HELPERS
|--------------------------------------------------------------------------
|
| A streak day is earned only from a completed NAVTA TEST.
|
| Rules:
| - More than one NAVTA TEST on the same India calendar day counts once.
| - Missing 1 day starts a 1-work-day recovery.
| - Missing 2 days starts a 2-work-day recovery.
| - Recovery work days keep the old streak alive but do not increase it.
| - After recovery is completed, the next consecutive qualifying day
|   increases the streak again.
| - Missing 3 consecutive full days ends the old streak.
|
*/

const indiaDateKeyToDayNumber = (dateKey) => {
  if (
    typeof dateKey !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)
  ) {
    return null;
  }

  const [year, month, day] =
    dateKey
      .split('-')
      .map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  return Math.floor(
    Date.UTC(
      year,
      month - 1,
      day
    ) /
      86400000
  );
};

const getNavtaStreakSnapshot = (student) => {
  if (!student) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastNavtaTestDate: null,
      recoveryActive: false,
      recoveryRequired: 0,
      recoveryCompleted: 0,
      recoveryRemaining: 0
    };
  }

  const required =
    Number(
      student.streakRecoveryRequired
    ) || 0;

  const completed =
    Number(
      student.streakRecoveryCompleted
    ) || 0;

  return {
    currentStreak:
      Number(
        student.currentStreak
      ) || 0,

    longestStreak:
      Number(
        student.longestStreak
      ) || 0,

    lastNavtaTestDate:
      student.lastNavtaTestDate ||
      null,

    recoveryActive:
      Boolean(
        student.streakRecoveryActive
      ),

    recoveryRequired:
      required,

    recoveryCompleted:
      completed,

    recoveryRemaining:
      Math.max(
        0,
        required - completed
      )
  };
};

/*
|--------------------------------------------------------------------------
| Apply one qualifying NAVTA TEST completion to a student's streak
|--------------------------------------------------------------------------
|
| This helper MUTATES the supplied Student document.
| The caller must save the Student document after calling it.
|
| It is exported below so navtaTestController.js can use the exact same
| streak logic when /api/navta-test/complete saves a Standard, Boss, or
| Revenge result.
|
*/
const applyNavtaStreakActivity = (
  student,
  activityDate = new Date()
) => {
  if (!student) {
    throw new Error(
      'Student profile is required to update NAVTA streak.'
    );
  }

  const todayKey =
    getDatePartsInTimeZone(
      activityDate
    ).key;

  const previousKey =
    student.lastNavtaTestDate ||
    null;

  const before =
    getNavtaStreakSnapshot(
      student
    );

  // Multiple NAVTA TESTS on the same India date count only once.
  if (
    previousKey === todayKey
  ) {
    return {
      changed: false,
      status: 'already-counted-today',
      ...getNavtaStreakSnapshot(
        student
      )
    };
  }

  const todayDayNumber =
    indiaDateKeyToDayNumber(
      todayKey
    );

  const previousDayNumber =
    indiaDateKeyToDayNumber(
      previousKey
    );

  const hasValidPreviousDay =
    Number.isFinite(
      previousDayNumber
    );

  const hasActiveStreak =
    Number(
      student.currentStreak
    ) > 0;

  // First ever qualifying NAVTA TEST, or a student with no active streak.
  if (
    !hasValidPreviousDay ||
    !hasActiveStreak
  ) {
    student.currentStreak = 1;

    student.longestStreak =
      Math.max(
        Number(
          student.longestStreak
        ) || 0,
        1
      );

    student.lastNavtaTestDate =
      todayKey;

    student.streakRecoveryActive =
      false;

    student.streakRecoveryRequired =
      0;

    student.streakRecoveryCompleted =
      0;

    student.streakLastUpdatedAt =
      new Date(activityDate);

    return {
      changed: true,
      status: 'started',
      previous:
        before,
      ...getNavtaStreakSnapshot(
        student
      )
    };
  }

  const calendarDayDifference =
    todayDayNumber -
    previousDayNumber;

  // A stale/out-of-order completion should never modify the current streak.
  if (
    !Number.isFinite(
      calendarDayDifference
    ) ||
    calendarDayDifference <= 0
  ) {
    return {
      changed: false,
      status:
        'ignored-old-activity',
      ...getNavtaStreakSnapshot(
        student
      )
    };
  }

  const missedDays =
    calendarDayDifference - 1;

  /*
  |--------------------------------------------------------------------------
  | Missed 3 or more consecutive full days
  |--------------------------------------------------------------------------
  |
  | The old streak ends immediately.
  | The returning NAVTA TEST starts a new streak at 1.
  |
  */
  if (missedDays >= 3) {
    student.currentStreak = 1;

    student.longestStreak =
      Math.max(
        Number(
          student.longestStreak
        ) || 0,
        1
      );

    student.lastNavtaTestDate =
      todayKey;

    student.streakRecoveryActive =
      false;

    student.streakRecoveryRequired =
      0;

    student.streakRecoveryCompleted =
      0;

    student.streakLastUpdatedAt =
      new Date(activityDate);

    return {
      changed: true,
      status: 'reset-after-3-missed-days',
      missedDays,
      previous:
        before,
      ...getNavtaStreakSnapshot(
        student
      )
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Student was already in recovery
  |--------------------------------------------------------------------------
  */
  if (
    student.streakRecoveryActive
  ) {
    // Consecutive work day while recovering.
    if (missedDays === 0) {
      const required =
        Math.max(
          1,
          Math.min(
            2,
            Number(
              student.streakRecoveryRequired
            ) || 1
          )
        );

      const completed =
        Math.min(
          required,
          (
            Number(
              student.streakRecoveryCompleted
            ) || 0
          ) + 1
        );

      student.streakRecoveryRequired =
        required;

      student.streakRecoveryCompleted =
        completed;

      student.lastNavtaTestDate =
        todayKey;

      student.streakLastUpdatedAt =
        new Date(activityDate);

      if (
        completed >= required
      ) {
        // Recovery is finished, but this recovery day does not
        // increase currentStreak. The next consecutive NAVTA TEST does.
        student.streakRecoveryActive =
          false;

        return {
          changed: true,
          status:
            'recovery-completed',
          missedDays: 0,
          previous:
            before,
          ...getNavtaStreakSnapshot(
            student
          )
        };
      }

      return {
        changed: true,
        status:
          'recovery-progress',
        missedDays: 0,
        previous:
          before,
        ...getNavtaStreakSnapshot(
          student
        )
      };
    }

    /*
    | The student missed another 1-2 days while recovery was active.
    | Keep the old streak protected, but restart the recovery work
    | requirement using the larger of:
    |   - work days still owed
    |   - newly missed days
    |
    | Today's qualifying test becomes recovery work day 1.
    */
    const previousRequired =
      Number(
        student.streakRecoveryRequired
      ) || 0;

    const previousCompleted =
      Number(
        student.streakRecoveryCompleted
      ) || 0;

    const previousRemaining =
      Math.max(
        0,
        previousRequired -
          previousCompleted
      );

    const newRequired =
      Math.max(
        1,
        Math.min(
          2,
          Math.max(
            previousRemaining,
            missedDays
          )
        )
      );

    student.streakRecoveryRequired =
      newRequired;

    student.streakRecoveryCompleted =
      1;

    student.lastNavtaTestDate =
      todayKey;

    student.streakLastUpdatedAt =
      new Date(activityDate);

    if (newRequired === 1) {
      student.streakRecoveryActive =
        false;

      return {
        changed: true,
        status:
          'recovery-completed',
        missedDays,
        previous:
          before,
        ...getNavtaStreakSnapshot(
          student
        )
      };
    }

    student.streakRecoveryActive =
      true;

    return {
      changed: true,
      status:
        'recovery-restarted',
      missedDays,
      previous:
        before,
      ...getNavtaStreakSnapshot(
        student
      )
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Return after missing 1 or 2 days
  |--------------------------------------------------------------------------
  |
  | Today's NAVTA TEST counts as recovery work day 1.
  | The current streak number does not increase yet.
  |
  */
  if (
    missedDays === 1 ||
    missedDays === 2
  ) {
    student.streakRecoveryRequired =
      missedDays;

    student.streakRecoveryCompleted =
      1;

    student.lastNavtaTestDate =
      todayKey;

    student.streakLastUpdatedAt =
      new Date(activityDate);

    if (missedDays === 1) {
      // 1 missed day = 1 recovery work day.
      // Recovery is completed today, but the streak number
      // stays unchanged until the next consecutive qualifying day.
      student.streakRecoveryActive =
        false;

      return {
        changed: true,
        status:
          'recovery-completed',
        missedDays,
        previous:
          before,
        ...getNavtaStreakSnapshot(
          student
        )
      };
    }

    // 2 missed days = 2 recovery work days.
    student.streakRecoveryActive =
      true;

    return {
      changed: true,
      status:
        'recovery-started',
      missedDays,
      previous:
        before,
      ...getNavtaStreakSnapshot(
        student
      )
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Normal consecutive qualifying day
  |--------------------------------------------------------------------------
  */
  student.currentStreak =
    (
      Number(
        student.currentStreak
      ) || 0
    ) + 1;

  student.longestStreak =
    Math.max(
      Number(
        student.longestStreak
      ) || 0,
      student.currentStreak
    );

  student.lastNavtaTestDate =
    todayKey;

  student.streakRecoveryActive =
    false;

  student.streakRecoveryRequired =
    0;

  student.streakRecoveryCompleted =
    0;

  student.streakLastUpdatedAt =
    new Date(activityDate);

  return {
    changed: true,
    status: 'continued',
    missedDays: 0,
    previous:
      before,
    ...getNavtaStreakSnapshot(
      student
    )
  };
};

// Export helper for navtaTestController.js.
exports.applyNavtaStreakActivity =
  applyNavtaStreakActivity;

exports.getNavtaStreakSnapshot =
  getNavtaStreakSnapshot;


// ============================================================================
// SUBMIT TEST
// ============================================================================

// @desc    Submit test answers and get score
// @route   POST /api/student/tests/:testId/submit
// @access  Private
exports.submitTest = async (req, res) => {
  try {
    const {
      answers = [],
      timeTaken,
      selectedDuration,
      attemptId,
      testType = 'standard'
    } = req.body;

    const userId = req.user.id;

    /*
    |--------------------------------------------------------------------------
    | Duplicate attempt protection
    |--------------------------------------------------------------------------
    |
    | If frontend sends the same attemptId twice,
    | we DO NOT give coins again.
    |
    */
    if (attemptId) {
      const existingResult =
        await Result.findOne({
          user: userId,
          attemptId: String(attemptId).trim()
        });

      if (existingResult) {
        const existingStudent =
          await Student.findOne({
            user: userId
          });

        return res.status(200).json({
          success: true,

          alreadySubmitted: true,

          message:
            'This test attempt has already been submitted.',

          data: {
            result: existingResult,

            xpEarned: 0,

            coinsEarned: 0,

            newCoins:
              existingStudent
                ? existingStudent.coins
                : 0,

            newXp:
              existingStudent
                ? existingStudent.xp
                : 0,

            newLevel:
              existingStudent
                ? existingStudent.level
                : 1
          }
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Find test
    |--------------------------------------------------------------------------
    */

    const test =
      await Test.findById(
        req.params.testId
      ).populate('questions');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'answers must be an array'
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Selected duration
    |--------------------------------------------------------------------------
    */

    const selectedDurationMinutes =
      getSelectedDurationMinutes(
        test,
        selectedDuration
      );

    if (!selectedDurationMinutes) {
      return res.status(400).json({
        success: false,

        message:
          'A valid selected test duration is required.'
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Grade answers
    |--------------------------------------------------------------------------
    */

    let correctCount = 0;

    const gradedAnswers =
      test.questions.map((q) => {
        const submitted =
          answers.find(
            (a) =>
              a.questionId ===
              q._id.toString()
          );

        let isCorrect = false;
        let selectedOption = null;
        let textAnswer = null;

        if (submitted) {
          if (
            q.questionType === 'mcq'
          ) {
            selectedOption =
              submitted.selectedOption;

            isCorrect =
              selectedOption !== null &&
              selectedOption !== undefined &&
              selectedOption ===
                q.correctOption;
          } else {
            textAnswer =
              submitted.textAnswer || '';

            if (
              q.correctAnswer &&
              textAnswer
                .trim()
                .toLowerCase() ===
                q.correctAnswer
                  .trim()
                  .toLowerCase()
            ) {
              isCorrect = true;
            }
          }
        }

        if (isCorrect) {
          correctCount += 1;
        }

        return {
          question: q._id,
          selectedOption,
          textAnswer,
          isCorrect
        };
      });

    /*
    |--------------------------------------------------------------------------
    | Calculate result
    |--------------------------------------------------------------------------
    */

    const totalQuestions =
      test.questions.length;

    if (totalQuestions === 0) {
      return res.status(400).json({
        success: false,
        message:
          'This test has no questions.'
      });
    }

    const score = correctCount;

    const percentage =
      Math.round(
        (correctCount /
          totalQuestions) *
          100
      );

    const isPassed =
      percentage >= test.passingScore;

    /*
    |--------------------------------------------------------------------------
    | NAVTA Test coin calculation
    |--------------------------------------------------------------------------
    */

    const coinsEarned =
      calculateTestCoins(
        percentage,
        selectedDurationMinutes
      );

    /*
    |--------------------------------------------------------------------------
    | Actual time taken
    |--------------------------------------------------------------------------
    |
    | timeTaken is still stored for analytics,
    | but it DOES NOT control the coin reward.
    |
    */

    const normalizedTimeTaken =
      Number(timeTaken);

    const safeTimeTaken =
      Number.isFinite(
        normalizedTimeTaken
      ) &&
      normalizedTimeTaken >= 0
        ? normalizedTimeTaken
        : 0;

    /*
    |--------------------------------------------------------------------------
    | Save result
    |--------------------------------------------------------------------------
    */

    const result =
      await Result.create({
        user: userId,

        test: test._id,

        answers: gradedAnswers,

        score,

        percentage,

        timeTaken: safeTimeTaken,

        selectedDuration:
          selectedDurationMinutes,

        testType: String(
          testType ||
            test.type ||
            'standard'
        ),

        attemptId:
          attemptId
            ? String(
                attemptId
              ).trim()
            : undefined,

        coinsAwarded:
          coinsEarned,

        coinRewardProcessed: true,

        coinRewardProcessedAt:
          new Date(),

        correctAnswers:
          correctCount,

        totalQuestions,

        isPassed
      });

    /*
    |--------------------------------------------------------------------------
    | Student gamification
    |--------------------------------------------------------------------------
    */

    const student =
      await Student.findOne({
        user: userId
      });

    /*
    |--------------------------------------------------------------------------
    | XP
    |--------------------------------------------------------------------------
    |
    | Existing XP system remains unchanged.
    |
    */

    let xpEarned =
      correctCount * 15;

    if (isPassed) {
      xpEarned += 50;
    }

    /*
    |--------------------------------------------------------------------------
    | Achievement bonus tracking
    |--------------------------------------------------------------------------
    */

    let achievementCoinsEarned = 0;

    if (student) {
      /*
      |--------------------------------------------------------------------------
      | Add XP
      |--------------------------------------------------------------------------
      */

      student.xp += xpEarned;

      /*
      |--------------------------------------------------------------------------
      | Add ONLY the NAVTA Test coin reward
      |--------------------------------------------------------------------------
      */

      student.coins +=
        coinsEarned;

      /*
      |--------------------------------------------------------------------------
      | Level calculation
      |--------------------------------------------------------------------------
      */

      const newLevel =
        Math.floor(
          student.xp / 500
        ) + 1;

      student.level =
        newLevel;

      /*
      |--------------------------------------------------------------------------
      | Achievement checks
      |--------------------------------------------------------------------------
      */

      const resultsCount =
        await Result.countDocuments({
          user: userId
        });

      const currentStreakValue =
        Number(
          student.currentStreak
        ) || 0;

      const allAchievements =
        await Achievement.find();

      const currentBadgeNames =
        student.badges.map(
          (b) => b.name
        );

      for (
        const ach of
        allAchievements
      ) {
        if (
          !currentBadgeNames.includes(
            ach.name
          )
        ) {
          let meetsReq = false;

          /*
          |--------------------------------------------------------------------------
          | XP achievement
          |--------------------------------------------------------------------------
          */

          if (
            ach.requirementType ===
              'xp' &&
            student.xp >=
              ach.requirementValue
          ) {
            meetsReq = true;
          }

          /*
          |--------------------------------------------------------------------------
          | Streak achievement
          |--------------------------------------------------------------------------
          */

          if (
            ach.requirementType ===
              'streak' &&
            currentStreakValue >=
              ach.requirementValue
          ) {
            meetsReq = true;
          }

          /*
          |--------------------------------------------------------------------------
          | Test count achievement
          |--------------------------------------------------------------------------
          */

          if (
            ach.requirementType ===
              'test_count' &&
            resultsCount >=
              ach.requirementValue
          ) {
            meetsReq = true;
          }

          /*
          |--------------------------------------------------------------------------
          | Grant achievement
          |--------------------------------------------------------------------------
          */

          if (meetsReq) {
            student.badges.push({
              name: ach.name,
              icon: ach.icon,
              earnedAt:
                new Date()
            });

            /*
            |--------------------------------------------------------------------------
            | Preserve existing achievement reward
            |--------------------------------------------------------------------------
            |
            | This is separate from the NAVTA Test reward.
            |
            */

            student.xp += 100;

            student.coins += 50;

            achievementCoinsEarned +=
              50;
          }
        }
      }

      await student.save();
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      alreadySubmitted: false,

      data: {
        result,

        percentage,

        selectedDuration:
          selectedDurationMinutes,

        xpEarned,

        /*
        |--------------------------------------------------------------------------
        | Coin reward from THIS test
        |--------------------------------------------------------------------------
        */

        coinsEarned,

        /*
        |--------------------------------------------------------------------------
        | Separate achievement coins
        |--------------------------------------------------------------------------
        */

        achievementCoinsEarned,

        /*
        |--------------------------------------------------------------------------
        | Current total coin balance
        |--------------------------------------------------------------------------
        */

        newCoins:
          student
            ? student.coins
            : 0,

        newXp:
          student
            ? student.xp
            : 0,

        newLevel:
          student
            ? student.level
            : 1
      }
    });
  } catch (err) {
    /*
    |--------------------------------------------------------------------------
    | Duplicate attemptId safety
    |--------------------------------------------------------------------------
    */

    if (
      err &&
      err.code === 11000
    ) {
      return res.status(409).json({
        success: false,

        message:
          'This test attempt has already been submitted.'
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// ============================================================================
// GET RESULTS
// ============================================================================

// @desc    Get student scorecard and test history
// @route   GET /api/student/results
// @access  Private
exports.getResults = async (
  req,
  res
) => {
  try {
    const results =
      await Result.find({
        user: req.user.id
      })
        .populate({
          path: 'test',

          select:
            'title type duration subject',

          populate: {
            path: 'subject',
            select: 'name'
          }
        })
        .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// ============================================================================
// RESULT DETAIL
// ============================================================================

// @desc    Get student detailed scorecard
// @route   GET /api/student/results/:resultId
// @access  Private
exports.getResultDetail = async (
  req,
  res
) => {
  try {
    const result =
      await Result.findById(
        req.params.resultId
      ).populate({
        path: 'test',

        populate: [
          {
            path: 'subject',
            select: 'name'
          },

          {
            path: 'questions'
          }
        ]
      });

    if (!result) {
      return res.status(404).json({
        success: false,

        message:
          'Result scorecard not found'
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Student can only view own result
    |--------------------------------------------------------------------------
    */

    if (
      result.user.toString() !==
        req.user.id &&
      req.user.role === 'student'
    ) {
      return res.status(403).json({
        success: false,

        message:
          'Not authorized to view this scorecard'
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// ============================================================================
// ANALYTICS
// ============================================================================

// @desc    Get student performance analytics
// @route   GET /api/student/analytics
// @access  Private
exports.getAnalytics = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    /*
    |--------------------------------------------------------------------------
    | Get all student results
    |--------------------------------------------------------------------------
    */

    const results =
      await Result.find({
        user: userId
      })
        .populate({
          path: 'test',

          populate: {
            path: 'subject',
            select: 'name'
          }
        })
        .sort('createdAt');

    /*
    |--------------------------------------------------------------------------
    | Subject performance
    |--------------------------------------------------------------------------
    */

    const subjectStats = {};

    results.forEach(
      (result) => {
        if (
          !result.test ||
          !result.test.subject
        ) {
          return;
        }

        const subName =
          result.test.subject.name;

        if (
          !subjectStats[subName]
        ) {
          subjectStats[
            subName
          ] = {
            totalScore: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            testCount: 0,
            passedCount: 0
          };
        }

        subjectStats[
          subName
        ].testCount += 1;

        subjectStats[
          subName
        ].totalQuestions +=
          result.totalQuestions;

        subjectStats[
          subName
        ].correctAnswers +=
          result.correctAnswers;

        if (result.isPassed) {
          subjectStats[
            subName
          ].passedCount += 1;
        }
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Parse subject statistics
    |--------------------------------------------------------------------------
    */

    const parsedStats =
      Object.keys(
        subjectStats
      ).map((name) => {
        const stats =
          subjectStats[name];

        const avgPercentage =
          stats.totalQuestions > 0
            ? Math.round(
                (
                  stats.correctAnswers /
                  stats.totalQuestions
                ) * 100
              )
            : 0;

        return {
          subject: name,

          avgPercentage,

          testCount:
            stats.testCount,

          passedCount:
            stats.passedCount,

          failedCount:
            stats.testCount -
            stats.passedCount,

          strength:
            avgPercentage >= 75
              ? 'Strong'
              : avgPercentage >= 45
                ? 'Average'
                : 'Needs Focus'
        };
      });

    /*
    |--------------------------------------------------------------------------
    | DAILY Performance Overview
    |--------------------------------------------------------------------------
    |
    | Example:
    |
    | 28 Aug:
    |
    | Test 1 = 70%
    | Test 2 = 80%
    | Test 3 = 90%
    | Test 4 = 85%
    | Test 5 = 75%
    |
    | Daily graph point = 80%
    |
    */

    const dailyMap = {};

    results.forEach(
      (result) => {
        const parts =
          getDatePartsInTimeZone(
            result.createdAt
          );

        if (
          !dailyMap[parts.key]
        ) {
          dailyMap[
            parts.key
          ] = {
            key: parts.key,

            representativeDate:
              result.createdAt,

            totalPercentage: 0,

            testCount: 0,

            highestPercentage: 0,

            lowestPercentage: 100
          };
        }

        const percentage =
          Number(
            result.percentage
          ) || 0;

        const day =
          dailyMap[
            parts.key
          ];

        day.totalPercentage +=
          percentage;

        day.testCount += 1;

        day.highestPercentage =
          Math.max(
            day.highestPercentage,
            percentage
          );

        day.lowestPercentage =
          Math.min(
            day.lowestPercentage,
            percentage
          );
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Convert grouped dates to graph array
    |--------------------------------------------------------------------------
    */

    const progression =
      Object.values(
        dailyMap
      )
        .sort(
          (a, b) =>
            a.key.localeCompare(
              b.key
            )
        )

        .map((day) => {
          const averagePercentage =
            Math.round(
              day.totalPercentage /
                day.testCount
            );

          return {
            /*
            |--------------------------------------------------------------------------
            | Machine sortable date
            |--------------------------------------------------------------------------
            */

            dateKey:
              day.key,

            /*
            |--------------------------------------------------------------------------
            | Short date for x-axis
            |--------------------------------------------------------------------------
            |
            | Example:
            | 28 Aug
            |
            */

            date:
              formatGraphDate(
                day.representativeDate
              ),

            /*
            |--------------------------------------------------------------------------
            | Full tooltip date
            |--------------------------------------------------------------------------
            |
            | Example:
            | 28 Aug 2026
            |
            */

            fullDate:
              formatFullGraphDate(
                day.representativeDate
              ),

            /*
            |--------------------------------------------------------------------------
            | Keep "score" for compatibility with existing graph
            |--------------------------------------------------------------------------
            */

            score:
              averagePercentage,

            /*
            |--------------------------------------------------------------------------
            | New explicit field
            |--------------------------------------------------------------------------
            */

            averagePercentage,

            /*
            |--------------------------------------------------------------------------
            | Number of tests taken that day
            |--------------------------------------------------------------------------
            */

            testCount:
              day.testCount,

            /*
            |--------------------------------------------------------------------------
            | Extra analytics
            |--------------------------------------------------------------------------
            */

            highestPercentage:
              day.highestPercentage,

            lowestPercentage:
              day.lowestPercentage
          };
        });

    /*
    |--------------------------------------------------------------------------
    | Strength / weakness recommendations
    |--------------------------------------------------------------------------
    */

    const strongAreas =
      parsedStats
        .filter(
          (s) =>
            s.strength ===
            'Strong'
        )
        .map(
          (s) =>
            s.subject
        );

    const weakAreas =
      parsedStats
        .filter(
          (s) =>
            s.strength ===
            'Needs Focus'
        )
        .map(
          (s) =>
            s.subject
        );

    const suggestions = [];

    if (
      weakAreas.length > 0
    ) {
      weakAreas.forEach(
        (area) => {
          suggestions.push(
            `Spend an extra 30 minutes reading chapter notes for ${area}.`
          );

          suggestions.push(
            `Attempt 5 more practice quizzes in ${area} to lift score levels.`
          );
        }
      );
    } else if (
      parsedStats.length === 0
    ) {
      suggestions.push(
        'Complete your first chapter quiz to generate tailored study recommendations.'
      );
    } else {
      suggestions.push(
        'Excellent work! Try taking Mock Tests under time constraints to test speed.'
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Current coin balance
    |--------------------------------------------------------------------------
    */

    const student =
      await Student.findOne({
        user: userId
      }).select(
        [
          'coins',
          'xp',
          'level',
          'currentStreak',
          'longestStreak',
          'lastNavtaTestDate',
          'streakRecoveryActive',
          'streakRecoveryRequired',
          'streakRecoveryCompleted',
          'streakLastUpdatedAt'
        ].join(' ')
      );

    /*
    |--------------------------------------------------------------------------
    | Analytics response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      subjectStats:
        parsedStats,

      /*
      |--------------------------------------------------------------------------
      | Performance Overview graph data
      |--------------------------------------------------------------------------
      */

      progression,

      /*
      |--------------------------------------------------------------------------
      | Dashboard Coin Balance
      |--------------------------------------------------------------------------
      */

      coinBalance:
        student
          ? student.coins
          : 0,

      /*
      |--------------------------------------------------------------------------
      | NAVTA TEST streak
      |--------------------------------------------------------------------------
      */

      streak:
        getNavtaStreakSnapshot(
          student
        ),

      summary: {
        strong:
          strongAreas,

        weak:
          weakAreas,

        suggestions
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// ============================================================================
// REDEEM REWARD
// ============================================================================

// @desc    Redeem a store reward
// @route   POST /api/student/rewards/:rewardId/redeem
// @access  Private
exports.redeemReward = async (
  req,
  res
) => {
  try {
    const userId =
      req.user.id;

    const reward =
      await Reward.findById(
        req.params.rewardId
      );

    if (!reward) {
      return res.status(404).json({
        success: false,
        message:
          'Reward item not found'
      });
    }

    const student =
      await Student.findOne({
        user: userId
      });

    if (!student) {
      return res.status(404).json({
        success: false,

        message:
          'Student profile not found'
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check coin balance
    |--------------------------------------------------------------------------
    */

    if (
      student.coins <
      reward.costCoins
    ) {
      return res.status(400).json({
        success: false,

        message:
          `Insufficient coins. This reward costs ${reward.costCoins} coins, but you only have ${student.coins}.`
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Deduct coins
    |--------------------------------------------------------------------------
    */

    student.coins -=
      reward.costCoins;

    student.rewardsRedeemed.push({
      reward: reward._id,
      redeemedAt:
        new Date()
    });

    /*
    |--------------------------------------------------------------------------
    | Digital badge reward
    |--------------------------------------------------------------------------
    */

    if (
      reward.type ===
      'badge'
    ) {
      student.badges.push({
        name:
          reward.title,

        icon:
          reward.badgeImage,

        earnedAt:
          new Date()
      });
    }

    await student.save();

    return res.status(200).json({
      success: true,

      message:
        `Successfully redeemed '${reward.title}'!`,

      coinsRemaining:
        student.coins,

      badges:
        student.badges
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// ============================================================================
// LEADERBOARD
// ============================================================================

// @desc    Get gamification leaderboard
// @route   GET /api/student/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    const students = await Student.find()
      .populate(
        'user',
        'name'
      )
      .sort({
        coins: -1,
        xp: -1
      })
      .limit(10);

    const parsedLeaderboard =
      students.map(
        (student, index) => ({
          rank: index + 1,

          userId:
            student.user?._id ||
            student.user ||
            null,

          name:
            student.user?.name ||
            'Unknown Student',

          coins:
            Number(student.coins) ||
            0,

          xp:
            Number(student.xp) ||
            0,

          level:
            Number(student.level) ||
            1,

          badgesCount:
            Array.isArray(
              student.badges
            )
              ? student.badges.length
              : 0
        })
      );

    return res.status(200).json({
      success: true,
      count:
        parsedLeaderboard.length,
      data:
        parsedLeaderboard
    });
  } catch (error) {
    console.error(
      'GET LEADERBOARD ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to load leaderboard.'
    });
  }
};


// ============================================================================
// GET REWARDS
// ============================================================================

// @desc    Get all available store rewards
// @route   GET /api/student/rewards
// @access  Private
exports.getRewards = async (
  req,
  res
) => {
  try {
    const rewards =
      await Reward.find();

    return res.status(200).json({
      success: true,

      count:
        rewards.length,

      data:
        rewards
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
