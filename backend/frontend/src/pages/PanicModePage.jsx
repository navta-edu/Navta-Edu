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
              activeChapter._id
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
              activeChapter._id
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
                </button>
              </div>

              {/* PROGRESS */}

              <div
                className="
                  mt-6
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <p
                  className="
                    text-sm
                    font-bold
                    text-slate-600

                    dark:text-slate-300
                  "
                >
                  Question{' '}
                  {practiceIndex + 1}
                  {' / '}
                  {
                    practiceQuestions.length
                  }
                </p>

                <p
                  className="
                    text-sm
                    font-black
                    text-violet-600
                  "
                >
                  {answeredQuestionCount}
                  {' '}
                  answered
                </p>
              </div>

              <div
                className="
                  mt-3
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-slate-100

                  dark:bg-slate-800
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-violet-600
                    transition-all
                  "
                  style={{
                    width: `${
                      practiceQuestions.length
                        ? (
                            answeredQuestionCount /
                            practiceQuestions.length
                          ) * 100
                        : 0
                    }%`
                  }}
                />
              </div>

              {/* QUESTION */}

              {currentPracticeQuestion && (
                <div
                  className="
                    mt-7
                    rounded-[24px]
                    border
                    border-slate-200
                    p-5
                    sm:p-6

                    dark:border-slate-800
                  "
                >
                  <div
                    className="
                      flex
                      flex-wrap
                      gap-2
                    "
                  >
                    <span
                      className="
                        rounded-full
                        bg-violet-50
                        px-3
                        py-1
                        text-xs
                        font-black
                        text-violet-600

                        dark:bg-violet-500/10
                      "
                    >
                      {
                        currentPracticeQuestion.difficulty
                      }
                    </span>

                    <span
                      className="
                        rounded-full
                        bg-slate-100
                        px-3
                        py-1
                        text-xs
                        font-bold
                        text-slate-500

                        dark:bg-slate-800
                      "
                    >
                      {
                        currentPracticeQuestion.chapter
                      }
                    </span>
                  </div>

                  <h3
                    className="
                      mt-5
                      text-lg
                      font-black
                      leading-8
                      text-slate-950
                      sm:text-xl

                      dark:text-white
                    "
                  >
                    {
                      currentPracticeQuestion.question
                    }
                  </h3>

                  <div
                    className="
                      mt-6
                      space-y-3
                    "
                  >
                    {(
                      currentPracticeQuestion.options ||
                      []
                    ).map(
                      (
                        option,
                        optionIndex
                      ) => {
                        const selected =
                          selectedAnswers[
                            currentQuestionId
                          ] ===
                          optionIndex;

                        const correct =
                          currentFeedback &&
                          Number(
                            currentFeedback.correctAnswer
                          ) ===
                            optionIndex;

                        const wrongSelected =
                          currentFeedback &&
                          selected &&
                          !currentFeedback.isCorrect;

                        return (
                          <button
                            key={
                              optionIndex
                            }
                            type="button"
                            disabled={
                              Boolean(
                                currentFeedback
                              )
                            }
                            onClick={() =>
                              selectPracticeAnswer(
                                optionIndex
                              )
                            }
                            className={`
                              flex
                              w-full
                              items-center
                              gap-3
                              rounded-2xl
                              border
                              p-4
                              text-left
                              text-sm
                              font-bold
                              transition

                              ${
                                correct
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                                  : wrongSelected
                                    ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300'
                                    : selected
                                      ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-300'
                                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900'
                              }
                            `}
                          >
                            <span
                              className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                border
                                text-xs
                                font-black
                              "
                            >
                              {String.fromCharCode(
                                65 +
                                  optionIndex
                              )}
                            </span>

                            <span>
                              {getOptionText(
                                option
                              )}
                            </span>

                            {correct && (
                              <Check
                                className="
                                  ml-auto
                                  h-5
                                  w-5
                                "
                              />
                            )}

                            {wrongSelected && (
                              <X
                                className="
                                  ml-auto
                                  h-5
                                  w-5
                                "
                              />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* FEEDBACK */}

                  {currentFeedback && (
                    <div
                      className={`
                        mt-6
                        rounded-2xl
                        border
                        p-5

                        ${
                          currentFeedback.isCorrect
                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                            : 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10'
                        }
                      `}
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >
                        {currentFeedback.isCorrect ? (
                          <CheckCircle2
                            className="
                              h-5
                              w-5
                              text-emerald-600
                            "
                          />
                        ) : (
                          <XCircle
                            className="
                              h-5
                              w-5
                              text-rose-600
                            "
                          />
                        )}

                        <p
                          className="
                            font-black
                            text-slate-950

                            dark:text-white
                          "
                        >
                          {currentFeedback.isCorrect
                            ? 'Correct!'
                            : 'Not quite.'}
                        </p>
                      </div>

                      {!currentFeedback.isCorrect && (
                        <p
                          className="
                            mt-3
                            text-sm
                            font-bold
                            text-slate-700

                            dark:text-slate-300
                          "
                        >
                          Correct answer:{' '}
                          {String.fromCharCode(
                            65 +
                              Number(
                                currentFeedback.correctAnswer
                              )
                          )}
                        </p>
                      )}

                      {currentFeedback.explanation && (
                        <div
                          className="
                            mt-4
                            rounded-xl
                            bg-white/70
                            p-4

                            dark:bg-slate-950/50
                          "
                        >
                          <p
                            className="
                              text-xs
                              font-black
                              uppercase
                              tracking-wider
                              text-slate-500
                            "
                          >
                            Key Explanation
                          </p>

                          <p
                            className="
                              mt-2
                              text-sm
                              leading-6
                              text-slate-700

                              dark:text-slate-300
                            "
                          >
                            {
                              currentFeedback.explanation
                            }
                          </p>
                        </div>
                      )}

                      {!currentFeedback.isCorrect && (
                        <Link
                          to="/notes"
                          state={{
                            panicMode: true,

                            exam:
                              session?.exam,

                            subject:
                              activeChapter?.subject,

                            chapter:
                              activeChapter?.chapter,

                            panicChapterId:
                              activeChapter?._id
                          }}
                          className="
                            mt-4
                            inline-flex
                            items-center
                            gap-2
                            text-sm
                            font-black
                            text-sky-600
                          "
                        >
                          <BookOpen
                            className="h-4 w-4"
                          />

                          Quickly Review Note
                        </Link>
                      )}
                    </div>
                  )}

                  {practiceMessage && (
                    <p
                      className="
                        mt-4
                        text-sm
                        font-bold
                        text-amber-600
                      "
                    >
                      {practiceMessage}
                    </p>
                  )}

                  {/* ACTIONS */}

                  <div
                    className="
                      mt-6
                      flex
                      flex-col
                      gap-3
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "
                  >
                    <button
                      type="button"
                      disabled={
                        practiceIndex === 0
                      }
                      onClick={() =>
                        setPracticeIndex(
                          (previous) =>
                            Math.max(
                              0,
                              previous - 1
                            )
                        )
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
                        text-sm
                        font-black
                        disabled:opacity-40

                        dark:border-slate-700
                      "
                    >
                      <ChevronLeft
                        className="h-4 w-4"
                      />

                      Previous
                    </button>

                    {!currentFeedback ? (
                      <button
                        type="button"
                        onClick={
                          checkPracticeAnswer
                        }
                        disabled={
                          checkingAnswer ||
                          selectedAnswers[
                            currentQuestionId
                          ] ===
                            undefined
                        }
                        className="
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-violet-600
                          px-5
                          py-3
                          text-sm
                          font-black
                          text-white
                          disabled:opacity-40
                        "
                      >
                        {checkingAnswer && (
                          <Loader2
                            className="
                              h-4
                              w-4
                              animate-spin
                            "
                          />
                        )}

                        Check Answer
                      </button>
                    ) : practiceIndex <
                      practiceQuestions.length -
                        1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPracticeIndex(
                            (
                              previous
                            ) =>
                              Math.min(
                                practiceQuestions.length -
                                  1,

                                previous +
                                  1
                              )
                          )
                        }
                        className="
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-violet-600
                          px-5
                          py-3
                          text-sm
                          font-black
                          text-white
                        "
                      >
                        Next Question

                        <ChevronRight
                          className="h-4 w-4"
                        />
                      </button>
                    ) : allPracticeAnswered ? (
                      <button
                        type="button"
                        onClick={
                          completePractice
                        }
                        disabled={
                          completingPractice
                        }
                        className="
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-emerald-600
                          px-5
                          py-3
                          text-sm
                          font-black
                          text-white
                          disabled:opacity-50
                        "
                      >
                        {completingPractice ? (
                          <Loader2
                            className="
                              h-4
                              w-4
                              animate-spin
                            "
                          />
                        ) : (
                          <CheckCircle2
                            className="h-4 w-4"
                          />
                        )}

                        Complete Practice
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {/* RESULT */}

              {progress.practised &&
                allPracticeAnswered && (
                  <div
                    className="
                      mt-6
                      rounded-2xl
                      border
                      border-emerald-200
                      bg-emerald-50
                      p-5

                      dark:border-emerald-500/20
                      dark:bg-emerald-500/10
                    "
                  >
                    <p
                      className="
                        text-lg
                        font-black
                        text-emerald-800

                        dark:text-emerald-300
                      "
                    >
                      Practice Complete
                    </p>

                    <p
                      className="
                        mt-2
                        text-sm
                        text-emerald-700

                        dark:text-emerald-400
                      "
                    >
                      {
                        practiceCorrectCount
                      }
                      /
                      {
                        practiceQuestions.length
                      }{' '}
                      correct •{' '}
                      {
                        practicePercentage
                      }
                      %
                    </p>

                    <button
                      type="button"
                      onClick={
                        closePractice
                      }
                      className="
                        mt-4
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        bg-emerald-600
                        px-4
                        py-3
                        text-sm
                        font-black
                        text-white
                      "
                    >
                      Return to Panic Plan

                      <ArrowRight
                        className="h-4 w-4"
                      />
                    </button>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ====================================
            SECURE FIX TEST PANEL
        ==================================== */}

        {fixTest && (
          <div
            className="
              fixed
              inset-0
              z-[60]
              overflow-y-auto
              bg-slate-950/80
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
                    🔒 Secure Panic Fix Test
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
                    {fixTest.chapter ||
                      activeChapter?.chapter}
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    10 questions • 10 minutes •
                    70% required
                  </p>
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  {!fixTestResult && (
                    <div
                      className={`
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        px-4
                        py-2
                        text-sm
                        font-black

                        ${
                          fixTestSecondsLeft <= 60
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }
                      `}
                    >
                      <Clock3
                        className="h-4 w-4"
                      />

                      {String(
                        fixTestMinutes
                      ).padStart(2, '0')}
                      :
                      {String(
                        fixTestSeconds
                      ).padStart(2, '0')}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={
                      closeFixTest
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
                  </button>
                </div>
              </div>

              {!fixTestResult ? (
                <>
                  <div
                    className="
                      mt-6
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <p
                      className="
                        text-sm
                        font-bold
                        text-slate-600

                        dark:text-slate-300
                      "
                    >
                      Question{' '}
                      {fixTestIndex + 1}
                      {' / '}
                      {fixTestQuestions.length}
                    </p>

                    <p
                      className="
                        text-sm
                        font-black
                        text-rose-600
                      "
                    >
                      {fixTestAnsweredCount}{' '}
                      answered
                    </p>
                  </div>

                  <div
                    className="
                      mt-3
                      h-2
                      overflow-hidden
                      rounded-full
                      bg-slate-100

                      dark:bg-slate-800
                    "
                  >
                    <div
                      className="
                        h-full
                        rounded-full
                        bg-rose-600
                        transition-all
                      "
                      style={{
                        width: `${
                          fixTestQuestions.length
                            ? (
                                fixTestAnsweredCount /
                                fixTestQuestions.length
                              ) * 100
                            : 0
                        }%`
                      }}
                    />
                  </div>

                  {currentFixQuestion && (
                    <div
                      className="
                        mt-7
                        rounded-[24px]
                        border
                        border-slate-200
                        p-5
                        sm:p-6

                        dark:border-slate-800
                      "
                    >
                      <div
                        className="
                          flex
                          flex-wrap
                          gap-2
                        "
                      >
                        <span
                          className="
                            rounded-full
                            bg-rose-50
                            px-3
                            py-1
                            text-xs
                            font-black
                            text-rose-600

                            dark:bg-rose-500/10
                          "
                        >
                          {currentFixQuestion.difficulty}
                        </span>

                        <span
                          className="
                            rounded-full
                            bg-slate-100
                            px-3
                            py-1
                            text-xs
                            font-bold
                            text-slate-500

                            dark:bg-slate-800
                          "
                        >
                          {currentFixQuestion.chapter}
                        </span>
                      </div>

                      <h3
                        className="
                          mt-5
                          text-lg
                          font-black
                          leading-8
                          text-slate-950
                          sm:text-xl

                          dark:text-white
                        "
                      >
                        {currentFixQuestion.question}
                      </h3>

                      <div
                        className="
                          mt-6
                          space-y-3
                        "
                      >
                        {(
                          currentFixQuestion.options ||
                          []
                        ).map(
                          (
                            option,
                            optionIndex
                          ) => {
                            const selected =
                              fixTestAnswers[
                                currentFixQuestionId
                              ] ===
                              optionIndex;

                            return (
                              <button
                                key={
                                  optionIndex
                                }
                                type="button"
                                onClick={() =>
                                  selectFixTestAnswer(
                                    optionIndex
                                  )
                                }
                                className={`
                                  flex
                                  w-full
                                  items-center
                                  gap-3
                                  rounded-2xl
                                  border
                                  p-4
                                  text-left
                                  text-sm
                                  font-bold
                                  transition

                                  ${
                                    selected
                                      ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300'
                                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900'
                                  }
                                `}
                              >
                                <span
                                  className="
                                    flex
                                    h-8
                                    w-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    text-xs
                                    font-black
                                  "
                                >
                                  {String.fromCharCode(
                                    65 +
                                    optionIndex
                                  )}
                                </span>

                                <span>
                                  {getOptionText(
                                    option
                                  )}
                                </span>

                                {selected && (
                                  <Check
                                    className="
                                      ml-auto
                                      h-5
                                      w-5
                                    "
                                  />
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>

                      {fixTestMessage && (
                        <p
                          className="
                            mt-4
                            text-sm
                            font-bold
                            text-amber-600
                          "
                        >
                          {fixTestMessage}
                        </p>
                      )}

                      <div
                        className="
                          mt-6
                          flex
                          flex-col
                          gap-3
                          sm:flex-row
                          sm:items-center
                          sm:justify-between
                        "
                      >
                        <button
                          type="button"
                          disabled={
                            fixTestIndex === 0
                          }
                          onClick={() =>
                            setFixTestIndex(
                              (previous) =>
                                Math.max(
                                  0,
                                  previous - 1
                                )
                            )
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
                            text-sm
                            font-black
                            disabled:opacity-40

                            dark:border-slate-700
                          "
                        >
                          <ChevronLeft
                            className="h-4 w-4"
                          />

                          Previous
                        </button>

                        {fixTestIndex <
                        fixTestQuestions.length -
                          1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setFixTestIndex(
                                (previous) =>
                                  Math.min(
                                    fixTestQuestions.length -
                                      1,
                                    previous + 1
                                  )
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              bg-rose-600
                              px-5
                              py-3
                              text-sm
                              font-black
                              text-white
                            "
                          >
                            Next Question

                            <ChevronRight
                              className="h-4 w-4"
                            />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              submitFixTest(
                                false
                              )
                            }
                            disabled={
                              submittingFixTest ||
                              fixTestAnsweredCount <
                                fixTestQuestions.length
                            }
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              bg-emerald-600
                              px-5
                              py-3
                              text-sm
                              font-black
                              text-white
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            {submittingFixTest ? (
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

                            Submit Fix Test
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="
                    mt-7
                    rounded-[24px]
                    border
                    border-slate-200
                    p-6
                    text-center

                    dark:border-slate-800
                  "
                >
                  {fixTestResult.passed ? (
                    <CheckCircle2
                      className="
                        mx-auto
                        h-12
                        w-12
                        text-emerald-500
                      "
                    />
                  ) : (
                    <XCircle
                      className="
                        mx-auto
                        h-12
                        w-12
                        text-rose-500
                      "
                    />
                  )}

                  <p
                    className="
                      mt-4
                      text-xs
                      font-black
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Fix Test Result
                  </p>

                  <h3
                    className="
                      mt-2
                      text-4xl
                      font-black
                      text-slate-950

                      dark:text-white
                    "
                  >
                    {Number(
                      fixTestResult.percentage ||
                      0
                    )}
                    %
                  </h3>

                  <p
                    className={`
                      mt-3
                      text-base
                      font-black

                      ${
                        fixTestResult.passed
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }
                    `}
                  >
                    {fixTestResult.passed
                      ? 'Weakness Fixed 🎯'
                      : 'Needs More Work'}
                  </p>

                  <p
                    className="
                      mt-2
                      text-sm
                      text-slate-500
                    "
                  >
                    {Number(
                      fixTestResult.correctAnswers ||
                      0
                    )}
                    /
                    {Number(
                      fixTestResult.totalQuestions ||
                      fixTestQuestions.length
                    )}{' '}
                    correct. You need 70% or
                    more to fix this chapter.
                  </p>

                  {Array.isArray(
                    fixTestResult.review
                  ) &&
                    fixTestResult.review.length >
                      0 && (
                      <div
                        className="
                          mt-7
                          space-y-4
                          text-left
                        "
                      >
                        {fixTestResult.review.map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                item.questionId ||
                                index
                              }
                              className={`
                                rounded-2xl
                                border
                                p-4

                                ${
                                  item.isCorrect
                                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                                    : 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10'
                                }
                              `}
                            >
                              <p
                                className="
                                  text-sm
                                  font-black
                                  text-slate-950

                                  dark:text-white
                                "
                              >
                                {index + 1}.{' '}
                                {item.question}
                              </p>

                              <p
                                className="
                                  mt-2
                                  text-xs
                                  font-bold
                                  text-slate-600

                                  dark:text-slate-300
                                "
                              >
                                Your answer:{' '}
                                {item.selectedOption ===
                                null ||
                                item.selectedOption ===
                                  undefined
                                  ? 'Not answered'
                                  : String.fromCharCode(
                                      65 +
                                      Number(
                                        item.selectedOption
                                      )
                                    )}
                                {' • '}
                                Correct:{' '}
                                {String.fromCharCode(
                                  65 +
                                  Number(
                                    item.correctAnswer
                                  )
                                )}
                              </p>

                              {item.explanation && (
                                <p
                                  className="
                                    mt-3
                                    text-sm
                                    leading-6
                                    text-slate-600

                                    dark:text-slate-300
                                  "
                                >
                                  {item.explanation}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                  <div
                    className="
                      mt-7
                      flex
                      flex-col
                      items-center
                      justify-center
                      gap-3
                      sm:flex-row
                    "
                  >
                    <button
                      type="button"
                      onClick={
                        closeFixTest
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-xl
                        bg-slate-900
                        px-5
                        py-3
                        text-sm
                        font-black
                        text-white

                        dark:bg-white
                        dark:text-slate-950
                      "
                    >
                      Return to Panic Plan

                      <ArrowRight
                        className="h-4 w-4"
                      />
                    </button>

                    {!fixTestResult.passed && (
                      <button
                        type="button"
                        onClick={async () => {
                          closeFixTest();

                          window.setTimeout(
                            () => {
                              startFixTest();
                            },
                            0
                          );
                        }}
                        className="
                          inline-flex
                          items-center
                          gap-2
                          rounded-xl
                          bg-rose-600
                          px-5
                          py-3
                          text-sm
                          font-black
                          text-white
                        "
                      >
                        <RotateCcw
                          className="h-4 w-4"
                        />

                        Retry Fix Test
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PLAN BUILDER
// ============================================

function PlanBuilder({
  exam,
  setExam,
  examWindow,
  setExamWindow,
  studyTime,
  setStudyTime,
  creatingPlan,
  createPlan
}) {
  return (
    <section
      className="
        mt-6
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
      <p
        className="
          text-xs
          font-black
          uppercase
          tracking-wider
          text-rose-500
        "
      >
        Build Emergency Plan
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
        Tell NAVTA how close
        your exam is.
      </h2>

      <div
        className="
          mt-7
          space-y-7
        "
      >
        <ChoiceGroup
          title="Preparing for"
          options={
            EXAM_OPTIONS
          }
          value={exam}
          onChange={setExam}
        />

        <ChoiceGroup
          title="Exam in"
          options={
            EXAM_WINDOWS
          }
          value={examWindow}
          onChange={
            setExamWindow
          }
        />

        <ChoiceGroup
          title="Available study time today"
          options={
            STUDY_TIME_OPTIONS
          }
          value={studyTime}
          onChange={
            setStudyTime
          }
        />
      </div>

      <button
        type="button"
        onClick={createPlan}
        disabled={
          creatingPlan
        }
        className="
          mt-8
          inline-flex
          items-center
          justify-center
          gap-2
          rounded-2xl
          bg-rose-600
          px-6
          py-3.5
          text-sm
          font-black
          text-white
          hover:bg-rose-700
          disabled:opacity-50
        "
      >
        {creatingPlan ? (
          <Loader2
            className="
              h-4
              w-4
              animate-spin
            "
          />
        ) : (
          <Sparkles
            className="h-4 w-4"
          />
        )}

        {creatingPlan
          ? 'Building Plan...'
          : 'Build My Panic Plan'}
      </button>
    </section>
  );
}

// ============================================
// CHOICE GROUP
// ============================================

function ChoiceGroup({
  title,
  options,
  value,
  onChange
}) {
  return (
    <div>
      <h3
        className="
          mb-3
          text-sm
          font-black
          text-slate-800

          dark:text-slate-200
        "
      >
        {title}
      </h3>

      <div
        className="
          grid
          gap-3
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        {options.map(
          (option) => {
            const selected =
              value ===
              option.id;

            return (
              <button
                key={
                  option.id
                }
                type="button"
                onClick={() =>
                  onChange(
                    option.id
                  )
                }
                className={`
                  rounded-2xl
                  border
                  p-4
                  text-left
                  transition

                  ${
                    selected
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                  }
                `}
              >
                <p
                  className="
                    font-black
                    text-slate-950

                    dark:text-white
                  "
                >
                  {
                    option.label
                  }
                </p>

                {option.description && (
                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                    "
                  >
                    {
                      option.description
                    }
                  </p>
                )}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

// ============================================
// PRIORITY SECTION
// ============================================

function PrioritySection({
  title,
  subtitle,
  items,
  activeChapterId,
  onSelect
}) {
  return (
    <section
      className="
        rounded-[24px]
        border
        border-slate-200
        bg-white
        p-5

        dark:border-slate-800
        dark:bg-slate-950
      "
    >
      <h3
        className="
          font-black
          text-slate-950

          dark:text-white
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-1
          text-xs
          text-slate-500
        "
      >
        {subtitle}
      </p>

      <div
        className="
          mt-4
          space-y-2
        "
      >
        {items.length === 0 ? (
          <p
            className="
              rounded-xl
              bg-slate-50
              p-3
              text-xs
              text-slate-500

              dark:bg-slate-900
            "
          >
            No chapters here.
          </p>
        ) : (
          items.map(
            (chapter) => {
              const id =
                chapterId(
                  chapter
                );

              const active =
                id ===
                activeChapterId;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    onSelect(id)
                  }
                  className={`
                    flex
                    w-full
                    items-center
                    justify-between
                    gap-3
                    rounded-xl
                    border
                    p-3
                    text-left

                    ${
                      active
                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-500/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }
                  `}
                >
                  <div>
                    <p
                      className="
                        text-sm
                        font-black
                        text-slate-900

                        dark:text-white
                      "
                    >
                      {
                        chapter.chapter
                      }
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-500
                      "
                    >
                      {
                        chapter.subject
                      }
                    </p>
                  </div>

                  <span
                    className="
                      text-sm
                      font-black
                      text-rose-600
                    "
                  >
                    {
                      chapter.accuracy
                    }
                    %
                  </span>
                </button>
              );
            }
          )
        )}
      </div>
    </section>
  );
}

// ============================================
// WORKFLOW STEP
// ============================================

function WorkflowStep({
  number,
  icon: Icon,
  title,
  completed = false,
  locked = false,
  children
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        p-5

        ${
          completed
            ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-500/5'
            : 'border-slate-200 dark:border-slate-800'
        }
      `}
    >
      <div
        className="
          flex
          items-start
          gap-4
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-slate-100

            dark:bg-slate-900
          "
        >
          {locked ? (
            <Lock
              className="
                h-5
                w-5
                text-slate-400
              "
            />
          ) : completed ? (
            <CheckCircle2
              className="
                h-5
                w-5
                text-emerald-600
              "
            />
          ) : (
            <Icon
              className="
                h-5
                w-5
                text-rose-500
              "
            />
          )}
        </div>

        <div
          className="min-w-0 flex-1"
        >
          <p
            className="
              text-[10px]
              font-black
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            Step {number}
          </p>

          <h3
            className="
              mt-1
              font-black
              text-slate-950

              dark:text-white
            "
          >
            {title}
          </h3>

          <div
            className="
              mt-4
            "
          >
            {locked ? (
              <p
                className="
                  text-sm
                  font-bold
                  text-slate-400
                "
              >
                Complete the
                previous step
                first.
              </p>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SMALL COMPONENTS
// ============================================

function HeroMetric({
  icon: Icon,
  label,
  value
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/70
        bg-white/70
        p-3
        text-center

        dark:border-white/10
        dark:bg-white/5
      "
    >
      <Icon
        className="
          mx-auto
          h-4
          w-4
          text-rose-500
        "
      />

      <p
        className="
          mt-2
          text-[9px]
          font-black
          uppercase
          text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-xs
          font-black
          text-slate-950

          dark:text-white
        "
      >
        {value}
      </p>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-2xl
        bg-slate-50
        p-4

        dark:bg-slate-900
      "
    >
      <Icon
        className="
          h-5
          w-5
          text-rose-500
        "
      />

      <div>
        <p
          className="
            text-[10px]
            font-black
            uppercase
            text-slate-400
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            text-sm
            font-black
            text-slate-950

            dark:text-white
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function LoadingCard({
  text
}) {
  return (
    <div
      className="
        mt-6
        rounded-[24px]
        border
        border-slate-200
        bg-white
        p-10
        text-center

        dark:border-slate-800
        dark:bg-slate-950
      "
    >
      <Loader2
        className="
          mx-auto
          h-7
          w-7
          animate-spin
          text-rose-500
        "
      />

      <p
        className="
          mt-4
          text-sm
          font-black
          text-slate-600

          dark:text-slate-300
        "
      >
        {text}
      </p>
    </div>
  );
}

function EmptyHistory() {
  return (
    <section
      className="
        mt-6
        rounded-[24px]
        border
        border-slate-200
        bg-white
        p-8
        text-center

        dark:border-slate-800
        dark:bg-slate-950
      "
    >
      <Flame
        className="
          mx-auto
          h-9
          w-9
          text-rose-500
        "
      />

      <h2
        className="
          mt-4
          text-xl
          font-black
          text-slate-950

          dark:text-white
        "
      >
        Complete NAVTA TESTs
        first
      </h2>

      <p
        className="
          mx-auto
          mt-2
          max-w-xl
          text-sm
          leading-6
          text-slate-500
        "
      >
        NAVTA needs
        chapter-level test
        history before it can
        identify your weak
        chapters.
      </p>

      <Link
        to="/navta-test"
        className="
          mt-5
          inline-flex
          items-center
          gap-2
          rounded-xl
          bg-rose-600
          px-5
          py-3
          text-sm
          font-black
          text-white
        "
      >
        Take NAVTA TEST

        <ArrowRight
          className="h-4 w-4"
        />
      </Link>
    </section>
  );
}
