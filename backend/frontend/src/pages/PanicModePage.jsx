import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  Target,
  X,
  XCircle,
  Zap
} from 'lucide-react';

import {
  panicModeAPI
} from '../utils/api';

// ============================================
// OPTIONS
// ============================================

const EXAM_OPTIONS = [
  {
    id: 'NEET',
    label: 'NEET',
    description: 'Medical entrance preparation'
  },
  {
    id: 'JEE',
    label: 'JEE',
    description: 'Engineering entrance preparation'
  },
  {
    id: 'Boards',
    label: 'Boards',
    description: 'School board preparation'
  }
];

const EXAM_WINDOWS = [
  {
    id: 'tomorrow',
    label: 'Tomorrow',
    days: 1
  },
  {
    id: '3-days',
    label: '3 Days',
    days: 3
  },
  {
    id: '7-days',
    label: '7 Days',
    days: 7
  },
  {
    id: '14-days',
    label: '14 Days',
    days: 14
  }
];

const STUDY_TIME_OPTIONS = [
  {
    id: '1-hour',
    label: '1 Hour',
    minutes: 60
  },
  {
    id: '2-hours',
    label: '2 Hours',
    minutes: 120
  },
  {
    id: '4-hours',
    label: '4 Hours',
    minutes: 240
  },
  {
    id: '6-hours',
    label: '6+ Hours',
    minutes: 360
  }
];

const PRACTICE_COUNT = {
  tomorrow: 5,
  '3-days': 10,
  '7-days': 15,
  '14-days': 20
};

// ============================================
// HELPERS
// ============================================

function getErrorMessage(
  error,
  fallback = 'Something went wrong.'
) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function chapterId(chapter) {
  return String(
    chapter?._id ||
    chapter?.id ||
    ''
  );
}

function getOptionText(option) {
  if (
    option === null ||
    option === undefined
  ) {
    return '';
  }

  if (
    typeof option === 'string' ||
    typeof option === 'number'
  ) {
    return String(option);
  }

  return (
    option.text ||
    option.label ||
    option.value ||
    ''
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function PanicModePage() {
  const [exam, setExam] =
    useState('NEET');

  const [
    examWindow,
    setExamWindow
  ] = useState('3-days');

  const [
    studyTime,
    setStudyTime
  ] = useState('2-hours');

  const [
    session,
    setSession
  ] = useState(null);

  const [
    activeChapterId,
    setActiveChapterId
  ] = useState('');

  const [
    loadingPlan,
    setLoadingPlan
  ] = useState(true);

  const [
    creatingPlan,
    setCreatingPlan
  ] = useState(false);

  const [
    resettingPlan,
    setResettingPlan
  ] = useState(false);

  const [
    updatingProgress,
    setUpdatingProgress
  ] = useState(false);

  const [
    error,
    setError
  ] = useState('');

  // ============================================
  // PRACTICE STATE
  // ============================================

  const [
    practice,
    setPractice
  ] = useState(null);

  const [
    loadingPractice,
    setLoadingPractice
  ] = useState(false);

  const [
    practiceIndex,
    setPracticeIndex
  ] = useState(0);

  const [
    selectedAnswers,
    setSelectedAnswers
  ] = useState({});

  const [
    answerFeedback,
    setAnswerFeedback
  ] = useState({});

  const [
    checkingAnswer,
    setCheckingAnswer
  ] = useState(false);

  const [
    completingPractice,
    setCompletingPractice
  ] = useState(false);

  const [
    practiceMessage,
    setPracticeMessage
  ] = useState('');

  // ============================================
  // SECURE FIX TEST STATE
  // ============================================

  const [
    fixTest,
    setFixTest
  ] = useState(null);

  const [
    loadingFixTest,
    setLoadingFixTest
  ] = useState(false);

  const [
    submittingFixTest,
    setSubmittingFixTest
  ] = useState(false);

  const [
    fixTestIndex,
    setFixTestIndex
  ] = useState(0);

  const [
    fixTestAnswers,
    setFixTestAnswers
  ] = useState({});

  const [
    fixTestSecondsLeft,
    setFixTestSecondsLeft
  ] = useState(0);

  const [
    fixTestResult,
    setFixTestResult
  ] = useState(null);

  const [
    fixTestMessage,
    setFixTestMessage
  ] = useState('');

  // ============================================
  // DERIVED DATA
  // ============================================

  const chapters =
    Array.isArray(
      session?.chapters
    )
      ? session.chapters
      : [];

  const fixFirst =
    chapters.filter(
      (chapter) =>
        chapter.status ===
          'fix-first' &&
        !chapter.fixTestPassed
    );

  const quickRevision =
    chapters.filter(
      (chapter) =>
        chapter.status ===
        'quick-revision'
    );

  const strong =
    chapters.filter(
      (chapter) =>
        chapter.status ===
          'strong' ||
        chapter.status ===
          'fixed' ||
        chapter.fixTestPassed
    );

  const activeChapter =
    chapters.find(
      (chapter) =>
        chapterId(chapter) ===
        activeChapterId
    ) ||
    fixFirst[0] ||
    quickRevision[0] ||
    strong[0] ||
    null;

  const progress = {
    revised:
      Boolean(
        activeChapter?.revised
      ),

    practised:
      Boolean(
        activeChapter?.practised
      ),

    fixTestPassed:
      Boolean(
        activeChapter?.fixTestPassed
      )
  };

  const selectedWindow =
    EXAM_WINDOWS.find(
      (option) =>
        option.id ===
        (
          session?.examWindow ||
          examWindow
        )
    ) ||
    EXAM_WINDOWS[1];

  const selectedStudyTime =
    STUDY_TIME_OPTIONS.find(
      (option) =>
        Number(
          option.minutes
        ) ===
        Number(
          session?.studyTimeMinutes
        )
    ) ||
    STUDY_TIME_OPTIONS.find(
      (option) =>
        option.id === studyTime
    ) ||
    STUDY_TIME_OPTIONS[1];

  const practiceCount =
    Number(
      session?.practiceQuestionCount
    ) ||
    PRACTICE_COUNT[
      session?.examWindow ||
      examWindow
    ] ||
    10;

  const planCreated =
    Boolean(session);

  // ============================================
  // PRACTICE DERIVED DATA
  // ============================================

  const practiceQuestions =
    Array.isArray(
      practice?.questions
    )
      ? practice.questions
      : [];

  const currentPracticeQuestion =
    practiceQuestions[
      practiceIndex
    ] || null;

  const currentQuestionId =
    String(
      currentPracticeQuestion?._id ||
      ''
    );

  const currentFeedback =
    answerFeedback[
      currentQuestionId
    ] || null;

  const answeredQuestionCount =
    Object.keys(
      answerFeedback
    ).length;

  const allPracticeAnswered =
    practiceQuestions.length > 0 &&
    answeredQuestionCount >=
      practiceQuestions.length;

  const practiceCorrectCount =
    Object.values(
      answerFeedback
    ).filter(
      (item) =>
        item?.isCorrect
    ).length;

  const practicePercentage =
    practiceQuestions.length
      ? Math.round(
          (
            practiceCorrectCount /
            practiceQuestions.length
          ) * 100
        )
      : 0;

  // ============================================
  // FIX TEST DERIVED DATA
  // ============================================

  const fixTestQuestions =
    Array.isArray(
      fixTest?.questions
    )
      ? fixTest.questions
      : [];

  const currentFixQuestion =
    fixTestQuestions[
      fixTestIndex
    ] || null;

  const currentFixQuestionId =
    String(
      currentFixQuestion?._id ||
      ''
    );

  const fixTestAnsweredCount =
    Object.keys(
      fixTestAnswers
    ).filter(
      (questionId) =>
        fixTestAnswers[
          questionId
        ] !== undefined &&
        fixTestAnswers[
          questionId
        ] !== null
    ).length;

  const fixTestMinutes =
    Math.floor(
      fixTestSecondsLeft / 60
    );

  const fixTestSeconds =
    fixTestSecondsLeft % 60;

  // ============================================
  // SYNC SESSION
  // ============================================

  const syncSession = (
    nextSession
  ) => {
    setSession(
      nextSession || null
    );

    if (
      !nextSession
    ) {
      setActiveChapterId('');
      return;
    }

    const nextChapters =
      Array.isArray(
        nextSession.chapters
      )
        ? nextSession.chapters
        : [];

    if (
      nextChapters.length === 0
    ) {
      setActiveChapterId('');
      return;
    }

    setActiveChapterId(
      (currentId) => {
        const stillExists =
          nextChapters.some(
            (chapter) =>
              chapterId(
                chapter
              ) ===
              currentId
          );

        if (stillExists) {
          return currentId;
        }

        const firstWeak =
          nextChapters.find(
            (chapter) =>
              chapter.status ===
                'fix-first' &&
              !chapter.fixTestPassed
          );

        return chapterId(
          firstWeak ||
          nextChapters[0]
        );
      }
    );
  };

  // ============================================
  // LOAD EXISTING PLAN
  // ============================================

  useEffect(() => {
    let active = true;

    const loadPlan =
      async () => {
        setLoadingPlan(true);
        setError('');

        try {
          const response =
            await panicModeAPI.getPlan();

          const existingSession =
            response?.data
              ?.session ||
            null;

          if (!active) {
            return;
          }

          if (
            existingSession
          ) {
            setExam(
              existingSession.exam ||
              'NEET'
            );

            setExamWindow(
              existingSession.examWindow ||
              '3-days'
            );

            const matchingTime =
              STUDY_TIME_OPTIONS.find(
                (option) =>
                  Number(
                    option.minutes
                  ) ===
                  Number(
                    existingSession
                      .studyTimeMinutes
                  )
              );

            if (
              matchingTime
            ) {
              setStudyTime(
                matchingTime.id
              );
            }

            syncSession(
              existingSession
            );
          }
        } catch (
          requestError
        ) {
          if (active) {
            setError(
              getErrorMessage(
                requestError,
                'Unable to load your Panic Mode plan.'
              )
            );
          }
        } finally {
          if (active) {
            setLoadingPlan(
              false
            );
          }
        }
      };

    loadPlan();

    return () => {
      active = false;
    };
  }, []);

  // ============================================
  // CREATE PLAN
  // ============================================

  const createPlan =
    async () => {
      const studyOption =
        STUDY_TIME_OPTIONS.find(
          (option) =>
            option.id ===
            studyTime
        ) ||
        STUDY_TIME_OPTIONS[1];

      setCreatingPlan(true);
      setError('');

      try {
        const response =
          await panicModeAPI.createPlan({
            exam,

            examWindow,

            studyTimeMinutes:
              studyOption.minutes
          });

        syncSession(
          response?.data
            ?.session ||
          null
        );
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            'Unable to build your Panic Mode plan.'
          )
        );
      } finally {
        setCreatingPlan(
          false
        );
      }
    };

  // ============================================
  // RESET PLAN
  // ============================================

  const resetPlan =
    async () => {
      setResettingPlan(true);
      setError('');

      try {
        await panicModeAPI.resetPlan();

        setSession(null);
        setActiveChapterId('');
        closePractice();
        closeFixTest();
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            'Unable to reset Panic Mode.'
          )
        );
      } finally {
        setResettingPlan(
          false
        );
      }
    };

  // ============================================
  // UPDATE REVISION
  // ============================================

  const markRevised =
    async () => {
      if (
        !activeChapter?._id
      ) {
        return;
      }

      setUpdatingProgress(
        true
      );

      setError('');

      try {
        const response =
          await panicModeAPI
            .updateChapterProgress(
              activeChapter._id,
              {
                revised: true
              }
            );

        syncSession(
          response?.data
            ?.session ||
          session
        );
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            'Unable to update revision progress.'
          )
        );
      } finally {
        setUpdatingProgress(
          false
        );
      }
    };

  // ============================================
  // START TARGETED PRACTICE
  // ============================================

  const startPractice =
    async () => {
      if (
        !activeChapter?._id
      ) {
        return;
      }

      setLoadingPractice(true);
      setPracticeMessage('');
      setError('');

      try {
        const response =
          await panicModeAPI
            .generatePractice(
              activeChapter._id,
              {
                classLevel:
                  activeChapter.classLevel
              }
            );

        const nextPractice =
          response?.data
            ?.practice ||
          null;

        setPractice(
          nextPractice
        );

        setPracticeIndex(0);

        setSelectedAnswers(
          {}
        );

        setAnswerFeedback(
          {}
        );

        setPracticeMessage(
          response?.message ||
          ''
        );
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            'Unable to generate targeted practice.'
          )
        );
      } finally {
        setLoadingPractice(
          false
        );
      }
    };

  // ============================================
  // SELECT PRACTICE ANSWER
  // ============================================

  const selectPracticeAnswer = (
    optionIndex
  ) => {
    if (
      !currentQuestionId ||
      currentFeedback
    ) {
      return;
    }

    setSelectedAnswers(
      (previous) => ({
        ...previous,

        [currentQuestionId]:
          optionIndex
      })
    );
  };

  // ============================================
  // CHECK PRACTICE ANSWER
  // ============================================

  const checkPracticeAnswer =
    async () => {
      if (
        !activeChapter?._id ||
        !currentQuestionId
      ) {
        return;
      }

      const selectedOption =
        selectedAnswers[
          currentQuestionId
        ];

      if (
        selectedOption ===
          undefined ||
        selectedOption ===
          null
      ) {
        setPracticeMessage(
          'Select an answer first.'
        );

        return;
      }

      setCheckingAnswer(true);
      setPracticeMessage('');

      try {
        const response =
          await panicModeAPI
            .checkPracticeAnswer(
              activeChapter._id,
              {
                questionId:
                  currentQuestionId,

                selectedOption
              }
            );

        const feedback =
          response?.data ||
          null;

        setAnswerFeedback(
          (previous) => ({
            ...previous,

            [currentQuestionId]:
              feedback
          })
        );
      } catch (
        requestError
      ) {
        setPracticeMessage(
          getErrorMessage(
            requestError,
            'Unable to check this answer.'
          )
        );
      } finally {
        setCheckingAnswer(
          false
        );
      }
    };

  // ============================================
  // COMPLETE PRACTICE
  // ============================================

  const completePractice =
    async () => {
      if (
        !activeChapter?._id ||
        !allPracticeAnswered
      ) {
        return;
      }

      setCompletingPractice(
        true
      );

      setPracticeMessage('');

      try {
        const questionIds =
          practiceQuestions.map(
            (question) =>
              String(
                question._id
              )
          );

        const response =
          await panicModeAPI
            .completePractice(
              activeChapter._id,
              questionIds
            );

        syncSession(
          response?.data
            ?.session ||
          session
        );

        setPracticeMessage(
          response?.message ||
          'Targeted practice completed.'
        );
      } catch (
        requestError
      ) {
        setPracticeMessage(
          getErrorMessage(
            requestError,
            'Unable to complete targeted practice.'
          )
        );
      } finally {
        setCompletingPractice(
          false
        );
      }
    };

  // ============================================
  // START SECURE FIX TEST
  // ============================================

  const startFixTest =
    async () => {
      if (
        !activeChapter?._id ||
        !progress.practised
      ) {
        return;
      }

      setLoadingFixTest(true);
      setFixTestMessage('');
      setError('');

      try {
        const response =
          await panicModeAPI
            .startFixTest(
              activeChapter._id,
              {
                classLevel:
                  activeChapter.classLevel
              }
            );

        const nextFixTest =
          response?.data
            ?.fixTest ||
          response?.data
            ?.attempt ||
          response?.data ||
          null;

        const questions =
          Array.isArray(
            nextFixTest?.questions
          )
            ? nextFixTest.questions
            : [];

        if (
          !nextFixTest ||
          questions.length === 0
        ) {
          throw new Error(
            'No Fix Test questions were returned.'
          );
        }

        const expiresAt =
          nextFixTest.expiresAt ||
          response?.data?.expiresAt;

        const remainingSeconds =
          expiresAt
            ? Math.max(
                0,
                Math.ceil(
                  (
                    new Date(
                      expiresAt
                    ).getTime() -
                    Date.now()
                  ) / 1000
                )
              )
            : 10 * 60;

        setFixTest({
          ...nextFixTest,
          questions,
          attemptId:
            nextFixTest.attemptId ||
            nextFixTest._id ||
            response?.data
              ?.attemptId
        });

        setFixTestIndex(0);
        setFixTestAnswers({});
        setFixTestResult(null);
        setFixTestSecondsLeft(
          remainingSeconds
        );
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError,
            'Unable to start the Fix Test.'
          )
        );
      } finally {
        setLoadingFixTest(false);
      }
    };

  // ============================================
  // SELECT FIX TEST ANSWER
  // ============================================

  const selectFixTestAnswer = (
    optionIndex
  ) => {
    if (
      !currentFixQuestionId ||
      fixTestResult
    ) {
      return;
    }

    setFixTestAnswers(
      (previous) => ({
        ...previous,

        [currentFixQuestionId]:
          optionIndex
      })
    );
  };

  // ============================================
  // SUBMIT SECURE FIX TEST
  // ============================================

  const submitFixTest =
    async (
      autoSubmit = false
    ) => {
      if (
        !activeChapter?._id ||
        !fixTest ||
        submittingFixTest ||
        fixTestResult
      ) {
        return;
      }

      const attemptId =
        fixTest.attemptId ||
        fixTest._id;

      if (!attemptId) {
        setFixTestMessage(
          'Fix Test attempt ID is missing. Close the test and start again.'
        );

        return;
      }

      if (
        !autoSubmit &&
        fixTestAnsweredCount <
          fixTestQuestions.length
      ) {
        setFixTestMessage(
          `Answer all ${fixTestQuestions.length} questions before submitting.`
        );

        return;
      }

      setSubmittingFixTest(true);
      setFixTestMessage('');

      try {
        const answers =
          fixTestQuestions.map(
            (question) => {
              const questionId =
                String(
                  question._id
                );

              const selectedOption =
                fixTestAnswers[
                  questionId
                ];

              return {
                questionId,

                selectedOption:
                  selectedOption ===
                    undefined
                    ? null
                    : selectedOption
              };
            }
          );

        const response =
          await panicModeAPI
            .submitFixTest(
              activeChapter._id,
              attemptId,
              answers
            );

        const result =
          response?.data
            ?.result ||
          response?.data ||
          null;

        setFixTestResult(
          result
        );

        if (
          response?.data
            ?.session
        ) {
          syncSession(
            response.data.session
          );
        } else {
          try {
            const planResponse =
              await panicModeAPI
                .getPlan();

            syncSession(
              planResponse?.data
                ?.session ||
              session
            );
          } catch {
            // Result is still shown even if
            // refreshing the plan fails.
          }
        }

        setFixTestSecondsLeft(0);
      } catch (
        requestError
      ) {
        const expired =
          Boolean(
            requestError
              ?.response
              ?.data
              ?.expired
          );

        setFixTestMessage(
          getErrorMessage(
            requestError,
            expired
              ? 'Time is over. This Fix Test attempt has expired.'
              : 'Unable to submit the Fix Test.'
          )
        );

        if (expired) {
          setFixTestSecondsLeft(0);
        }
      } finally {
        setSubmittingFixTest(false);
      }
    };

  // ============================================
  // FIX TEST TIMER
  // ============================================

  useEffect(() => {
    if (
      !fixTest ||
      fixTestResult ||
      fixTestSecondsLeft <= 0
    ) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setFixTestSecondsLeft(
            (previous) =>
              Math.max(
                0,
                previous - 1
              )
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    fixTest,
    fixTestResult,
    fixTestSecondsLeft
  ]);

  useEffect(() => {
    if (
      fixTest &&
      !fixTestResult &&
      fixTestSecondsLeft === 0 &&
      !submittingFixTest
    ) {
      submitFixTest(true);
    }
  }, [
    fixTestSecondsLeft,
    fixTest,
    fixTestResult,
    submittingFixTest
  ]);

  // ============================================
  // CLOSE FIX TEST
  // ============================================

  function closeFixTest() {
    setFixTest(null);
    setFixTestIndex(0);
    setFixTestAnswers({});
    setFixTestResult(null);
    setFixTestSecondsLeft(0);
    setFixTestMessage('');
  }

  // ============================================
  // CLOSE PRACTICE
  // ============================================

  function closePractice() {
    setPractice(null);
    setPracticeIndex(0);
    setSelectedAnswers({});
    setAnswerFeedback({});
    setPracticeMessage('');
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      className="
        min-h-screen
        bg-transparent
        px-4
        py-6
        sm:px-6
        lg:px-8
      "
    >
      <div
        className="
          mx-auto
          max-w-7xl
        "
      >
        {/* ====================================
            HERO
        ==================================== */}

        <section
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-rose-200
            bg-gradient-to-br
            from-white
            via-rose-50
            to-orange-50
            p-6
            shadow-lg
            sm:p-8

            dark:border-rose-500/20
            dark:from-slate-950
            dark:via-rose-950/20
            dark:to-orange-950/10
          "
        >
          <Link
            to="/dashboard"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-bold
              text-slate-600

              dark:text-slate-300
            "
          >
            <ArrowLeft
              className="h-4 w-4"
            />

            Dashboard
          </Link>

          <div
            className="
              mt-6
              flex
              flex-col
              gap-6
              lg:flex-row
              lg:items-end
              lg:justify-between
            "
          >
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-rose-100
                  px-3
                  py-2
                  text-xs
                  font-black
                  uppercase
                  tracking-wider
                  text-rose-600

                  dark:bg-rose-500/10
                  dark:text-rose-300
                "
              >
                <AlertTriangle
                  className="h-4 w-4"
                />

                Emergency Revision
              </div>

              <h1
                className="
                  mt-4
                  text-3xl
                  font-black
                  text-slate-950
                  sm:text-4xl

                  dark:text-white
                "
              >
                🚨 Panic Mode
              </h1>

              <p
                className="
                  mt-4
                  max-w-3xl
                  leading-7
                  text-slate-600

                  dark:text-slate-300
                "
              >
                Fix your weakest
                chapters first.
                Revise the notes,
                practise targeted
                questions, then prove
                the weakness is fixed.
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-3
                gap-3
              "
            >
              <HeroMetric
                icon={BookOpen}
                label="Step 1"
                value="Revise"
              />

              <HeroMetric
                icon={BrainCircuit}
                label="Step 2"
                value="Practice"
              />

              <HeroMetric
                icon={Target}
                label="Step 3"
                value="70%+"
              />
            </div>
          </div>
        </section>

        {/* ====================================
            ERROR
        ==================================== */}

        {error && (
          <div
            className="
              mt-5
              rounded-2xl
              border
              border-rose-200
              bg-rose-50
              p-4
              text-sm
              font-bold
              text-rose-700

              dark:border-rose-500/20
              dark:bg-rose-500/10
              dark:text-rose-300
            "
          >
            {error}
          </div>
        )}

        {/* ====================================
            LOADING
        ==================================== */}

        {loadingPlan ? (
          <LoadingCard
            text="Loading your Panic Mode plan..."
          />
        ) : !planCreated ? (
          <PlanBuilder
            exam={exam}
            setExam={setExam}
            examWindow={
              examWindow
            }
            setExamWindow={
              setExamWindow
            }
            studyTime={
              studyTime
            }
            setStudyTime={
              setStudyTime
            }
            creatingPlan={
              creatingPlan
            }
            createPlan={
              createPlan
            }
          />
        ) : (
          <>
            {/* =================================
                PLAN SUMMARY
            ================================= */}

            <section
              className="
                mt-6
                rounded-[24px]
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm

                dark:border-slate-800
                dark:bg-slate-950
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-black
                      uppercase
                      tracking-wider
                      text-rose-500
                    "
                  >
                    Current Plan
                  </p>

                  <h2
                    className="
                      mt-1
                      text-xl
                      font-black
                      text-slate-950

                      dark:text-white
                    "
                  >
                    {session.exam}
                    {' • '}
                    {
                      selectedWindow.label
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    resetPlan
                  }
                  disabled={
                    resettingPlan
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-2
                    text-xs
                    font-black
                    text-slate-600

                    dark:border-slate-700
                    dark:text-slate-300
                  "
                >
                  <RotateCcw
                    className="h-4 w-4"
                  />

                  {resettingPlan
                    ? 'Resetting...'
                    : 'Change Plan'}
                </button>
              </div>

              <div
                className="
                  mt-4
                  grid
                  gap-3
                  sm:grid-cols-3
                "
              >
                <SummaryMetric
                  icon={Clock3}
                  label="Time Today"
                  value={
                    selectedStudyTime.label
                  }
                />

                <SummaryMetric
                  icon={Zap}
                  label="Practice"
                  value={`${practiceCount} Questions`}
                />

                <SummaryMetric
                  icon={Target}
                  label="Fix Target"
                  value="70%+"
                />
              </div>
            </section>

            {chapters.length === 0 ? (
              <EmptyHistory />
            ) : (
              <div
                className="
                  mt-6
                  grid
                  gap-6
                  xl:grid-cols-[0.8fr_1.2fr]
                "
              >
                {/* =============================
                    CHAPTER LIST
                ============================= */}

                <div
                  className="
                    space-y-5
                  "
                >
                  <PrioritySection
                    title="🔴 Fix First"
                    subtitle="Your weakest chapters."
                    items={fixFirst}
                    activeChapterId={
                      chapterId(
                        activeChapter
                      )
                    }
                    onSelect={
                      setActiveChapterId
                    }
                  />

                  <PrioritySection
                    title="🟡 Quick Revision"
                    subtitle="Review after your weakest chapters."
                    items={
                      quickRevision
                    }
                    activeChapterId={
                      chapterId(
                        activeChapter
                      )
                    }
                    onSelect={
                      setActiveChapterId
                    }
                  />

                  <PrioritySection
                    title="🟢 Strong"
                    subtitle="Already performing well."
                    items={strong}
                    activeChapterId={
                      chapterId(
                        activeChapter
                      )
                    }
                    onSelect={
                      setActiveChapterId
                    }
                  />
                </div>

                {/* =============================
                    WORKFLOW
                ============================= */}

                {activeChapter && (
                  <section
                    className="
                      rounded-[26px]
                      border
                      border-slate-200
                      bg-white
                      p-5
                      shadow-md
                      sm:p-7

                      dark:border-slate-800
                      dark:bg-slate-950
                    "
                  >
                    <div
                      className="
                        flex
                        flex-wrap
                        items-start
                        justify-between
                        gap-4
                      "
                    >
                      <div>
                        <p
                          className="
                            text-xs
                            font-black
                            uppercase
                            tracking-wider
                            text-rose-500
                          "
                        >
                          Fix Session
                        </p>

                        <h2
                          className="
                            mt-1
                            text-2xl
                            font-black
                            text-slate-950

                            dark:text-white
                          "
                        >
                          {
                            activeChapter.chapter
                          }
                        </h2>

                        <p
                          className="
                            mt-1
                            text-sm
                            text-slate-500

                            dark:text-slate-400
                          "
                        >
                          {
                            activeChapter.subject
                          }
                          {activeChapter.classLevel && (
                            <>
                              {' • '}
                              {activeChapter.classLevel}
                            </>
                          )}
                          {' • '}
                          Recent accuracy{' '}
                          {
                            activeChapter.accuracy
                          }
                          %
                        </p>
                      </div>

                      <div
                        className="
                          rounded-2xl
                          bg-rose-50
                          px-5
                          py-3
                          text-center

                          dark:bg-rose-500/10
                        "
                      >
                        <p
                          className="
                            text-[10px]
                            font-black
                            uppercase
                            text-rose-500
                          "
                        >
                          Target
                        </p>

                        <p
                          className="
                            text-2xl
                            font-black
                            text-slate-950

                            dark:text-white
                          "
                        >
                          70%+
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        mt-7
                        space-y-4
                      "
                    >
                      {/* STEP 1 */}

                      <WorkflowStep
                        number="01"
                        icon={BookOpen}
                        title="Revise Study Notes"
                        completed={
                          progress.revised
                        }
                      >
                        <div
                          className="
                            flex
                            flex-col
                            gap-3
                            sm:flex-row
                          "
                        >
                          <Link
                            to="/notes"
                            state={{
                              panicMode: true,

                              exam:
                                session.exam,

                              subject:
                                activeChapter.subject,

                              classLevel:
                                activeChapter.classLevel,

                              chapter:
                                activeChapter.chapter,

                              panicChapterId:
                                activeChapter._id
                            }}
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              bg-sky-600
                              px-4
                              py-3
                              text-xs
                              font-black
                              text-white
                              hover:bg-sky-700
                            "
                          >
                            <BookOpen
                              className="h-4 w-4"
                            />

                            Open Study Notes
                          </Link>

                          <button
                            type="button"
                            disabled={
                              updatingProgress ||
                              progress.revised
                            }
                            onClick={
                              markRevised
                            }
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              border
                              border-slate-200
                              px-4
                              py-3
                              text-xs
                              font-black
                              text-slate-700
                              disabled:opacity-50

                              dark:border-slate-700
                              dark:text-slate-200
                            "
                          >
                            <CheckCircle2
                              className="h-4 w-4"
                            />

                            {progress.revised
                              ? 'Revised'
                              : 'I Revised This'}
                          </button>
                        </div>
                      </WorkflowStep>

                      {/* STEP 2 */}

                      <WorkflowStep
                        number="02"
                        icon={
                          BrainCircuit
                        }
                        title="Targeted Practice"
                        completed={
                          progress.practised
                        }
                        locked={
                          !progress.revised
                        }
                      >
                        <button
                          type="button"
                          disabled={
                            !progress.revised ||
                            loadingPractice
                          }
                          onClick={
                            startPractice
                          }
                          className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-violet-600
                            px-4
                            py-3
                            text-xs
                            font-black
                            text-white
                            hover:bg-violet-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {loadingPractice ? (
                            <Loader2
                              className="
                                h-4
                                w-4
                                animate-spin
                              "
                            />
                          ) : (
                            <BrainCircuit
                              className="h-4 w-4"
                            />
                          )}

                          {progress.practised
                            ? 'Practice Again'
                            : `Start ${practiceCount} Questions`}
                        </button>
                      </WorkflowStep>

                      {/* STEP 3 */}

                      <WorkflowStep
                        number="03"
                        icon={Target}
                        title="Fix Test"
                        completed={
                          progress.fixTestPassed
                        }
                        locked={
                          !progress.practised
                        }
                      >
                        {progress.fixTestPassed ? (
                          <div
                            className="
                              rounded-xl
                              bg-emerald-50
                              p-4
                              text-sm
                              font-bold
                              text-emerald-700

                              dark:bg-emerald-500/10
                              dark:text-emerald-300
                            "
                          >
                            <CheckCircle2
                              className="
                                mr-2
                                inline
                                h-4
                                w-4
                              "
                            />

                            Weakness fixed at{' '}
                            {
                              activeChapter.fixTestScore
                            }
                            %.
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              !progress.practised ||
                              loadingFixTest
                            }
                            onClick={
                              startFixTest
                            }
                            className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-xl
                              bg-rose-600
                              px-4
                              py-3
                              text-xs
                              font-black
                              text-white
                              hover:bg-rose-700
                              disabled:cursor-not-allowed
                              disabled:bg-slate-200
                              disabled:text-slate-500
                              disabled:opacity-70

                              dark:disabled:bg-slate-800
                              dark:disabled:text-slate-400
                            "
                          >
                            {loadingFixTest ? (
                              <Loader2
                                className="
                                  h-4
                                  w-4
                                  animate-spin
                                "
                              />
                            ) : (
                              <Target
                                className="h-4 w-4"
                              />
                            )}

                            {!progress.practised
                              ? 'Complete Practice First'
                              : loadingFixTest
                                ? 'Preparing Fix Test...'
                                : 'Start 10-Min Fix Test'}
                          </button>
                        )}
                      </WorkflowStep>
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {/* ====================================
            TARGETED PRACTICE PANEL
        ==================================== */}

        {practice && (
          <div
            className="
              fixed
              inset-0
              z-50
              overflow-y-auto
              bg-slate-950/70
              p-3
              backdrop-blur-sm
              sm:p-6
            "
          >
            <div
              className="
                mx-auto
                my-4
                max-w-4xl
                rounded-[28px]
                bg-white
                p-5
                shadow-2xl
                sm:p-8

                dark:bg-slate-950
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-black
                      uppercase
                      tracking-wider
                      text-violet-500
                    "
                  >
                    🚨 Panic Targeted Practice
                  </p>

                  <h2
                    className="
                      mt-2
                      text-2xl
                      font-black
                      text-slate-950

                      dark:text-white
                    "
                  >
                    {practice.chapter}
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    {practice.subject}
                    {' • '}
                    {practice.exam}
                    {practice.classLevel && (
                      <>
                        {' • '}
                        {practice.classLevel}
                      </>
                    )}
                    {' • '}
                    {
                      practiceQuestions.length
                    }{' '}
                    Questions
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closePractice
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    p-2

                    dark:border-slate-700
                  "
                >
                  <X
                    className="h-5 w-5"
                  />
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
