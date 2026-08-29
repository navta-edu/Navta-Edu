import React, { useEffect, useMemo, useState } from 'react';

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Flame,
  RotateCcw,
  Sparkles,
  Target,
  TimerReset,
  Zap
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { panicModeAPI } from '../utils/api';

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

const PRACTICE_QUESTION_COUNT = {
  tomorrow: 5,
  '3-days': 10,
  '7-days': 15,
  '14-days': 20
};

export default function PanicModePage() {
  const [exam, setExam] = useState('NEET');
  const [examWindow, setExamWindow] = useState('3-days');
  const [studyTime, setStudyTime] = useState('2-hours');

  const [session, setSession] = useState(null);
  const [activeChapterId, setActiveChapterId] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [resettingPlan, setResettingPlan] = useState(false);
  const [error, setError] = useState('');

  const planCreated = Boolean(session);

  const selectedWindow = useMemo(
    () =>
      EXAM_WINDOWS.find(
        (option) => option.id === examWindow
      ) || EXAM_WINDOWS[1],
    [examWindow]
  );

  const selectedStudyTime = useMemo(
    () =>
      STUDY_TIME_OPTIONS.find(
        (option) => option.id === studyTime
      ) || STUDY_TIME_OPTIONS[1],
    [studyTime]
  );

  const chapters = useMemo(
    () => (Array.isArray(session?.chapters) ? session.chapters : []),
    [session]
  );

  const fixFirst = useMemo(
    () =>
      chapters.filter(
        (item) =>
          item.status === 'fix-first' &&
          !item.fixTestPassed
      ),
    [chapters]
  );

  const quickRevision = useMemo(
    () =>
      chapters.filter(
        (item) => item.status === 'quick-revision'
      ),
    [chapters]
  );

  const strong = useMemo(
    () =>
      chapters.filter(
        (item) =>
          item.status === 'strong' ||
          item.status === 'fixed' ||
          item.fixTestPassed
      ),
    [chapters]
  );

  const activeChapter = useMemo(
    () =>
      chapters.find(
        (item) => String(item._id) === String(activeChapterId)
      ) ||
      fixFirst[0] ||
      quickRevision[0] ||
      strong[0] ||
      null,
    [
      chapters,
      activeChapterId,
      fixFirst,
      quickRevision,
      strong
    ]
  );

  const progress = {
    revised: Boolean(activeChapter?.revised),
    practised: Boolean(activeChapter?.practised),
    fixTestPassed: Boolean(activeChapter?.fixTestPassed)
  };

  const practiceCount =
    Number(session?.practiceQuestionCount) ||
    PRACTICE_QUESTION_COUNT[examWindow] ||
    10;

  const getErrorMessage = (requestError, fallback) => {
    return (
      requestError?.response?.data?.message ||
      requestError?.message ||
      fallback
    );
  };

  const syncSession = (nextSession) => {
    setSession(nextSession || null);

    const nextChapters = Array.isArray(nextSession?.chapters)
      ? nextSession.chapters
      : [];

    if (nextChapters.length === 0) {
      setActiveChapterId('');
      return;
    }

    setActiveChapterId((currentId) => {
      const stillExists = nextChapters.some(
        (item) => String(item._id) === String(currentId)
      );

      if (stillExists) {
        return currentId;
      }

      const preferred =
        nextChapters.find(
          (item) =>
            item.status === 'fix-first' &&
            !item.fixTestPassed
        ) ||
        nextChapters.find(
          (item) => item.status === 'quick-revision'
        ) ||
        nextChapters[0];

      return String(preferred?._id || '');
    });
  };

  useEffect(() => {
    let active = true;

    const loadPlan = async () => {
      setLoadingPlan(true);
      setError('');

      try {
        const response = await panicModeAPI.getPlan();
        const existingSession = response?.data?.session || null;

        if (!active) {
          return;
        }

        if (existingSession) {
          setExam(existingSession.exam || 'NEET');
          setExamWindow(existingSession.examWindow || '3-days');

          const matchingStudyTime =
            STUDY_TIME_OPTIONS.find(
              (option) =>
                Number(option.minutes) ===
                Number(existingSession.studyTimeMinutes)
            );

          if (matchingStudyTime) {
            setStudyTime(matchingStudyTime.id);
          }

          syncSession(existingSession);
        }
      } catch (requestError) {
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
          setLoadingPlan(false);
        }
      }
    };

    loadPlan();

    return () => {
      active = false;
    };
  }, []);

  const changeActiveChapter = (chapterId) => {
    setActiveChapterId(String(chapterId));
    setError('');
  };

  const createPlan = async () => {
    const selectedStudyOption =
      STUDY_TIME_OPTIONS.find(
        (option) => option.id === studyTime
      ) || STUDY_TIME_OPTIONS[1];

    setCreatingPlan(true);
    setError('');

    try {
      const response = await panicModeAPI.createPlan({
        exam,
        examWindow,
        studyTimeMinutes: selectedStudyOption.minutes
      });

      const nextSession = response?.data?.session || null;
      syncSession(nextSession);

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Unable to build your Panic Mode plan.'
        )
      );
    } finally {
      setCreatingPlan(false);
    }
  };

  const resetPlan = async () => {
    setResettingPlan(true);
    setError('');

    try {
      await panicModeAPI.resetPlan();

      setSession(null);
      setActiveChapterId('');
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Unable to reset your Panic Mode plan.'
        )
      );
    } finally {
      setResettingPlan(false);
    }
  };

  const updateProgress = async (updates) => {
    if (!activeChapter?._id) {
      return;
    }

    setUpdatingProgress(true);
    setError('');

    try {
      const response =
        await panicModeAPI.updateChapterProgress(
          activeChapter._id,
          updates
        );

      syncSession(response?.data?.session || session);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Unable to update Panic Mode progress.'
        )
      );
    } finally {
      setUpdatingProgress(false);
    }
  };

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
        <section
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-rose-200/80
            bg-gradient-to-br
            from-white
            via-rose-50/70
            to-orange-50
            p-6
            shadow-lg
            sm:p-8

            dark:border-rose-500/20
            dark:from-slate-950
            dark:via-rose-950/15
            dark:to-orange-950/10
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-56
              w-56
              rounded-full
              bg-rose-400/15
              blur-3xl
            "
          />

          <div className="relative">
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-rose-200
                bg-white/80
                px-3
                py-2
                text-xs
                font-black
                uppercase
                tracking-[0.16em]
                text-rose-600

                dark:border-rose-500/20
                dark:bg-white/5
                dark:text-rose-300
              "
            >
              <AlertTriangle className="h-4 w-4" />
              Emergency Revision System
            </div>

            <div
              className="
                mt-5
                grid
                gap-6
                lg:grid-cols-[1.15fr_0.85fr]
                lg:items-end
              "
            >
              <div>
                <h1
                  className="
                    text-3xl
                    font-black
                    tracking-tight
                    text-slate-950
                    sm:text-4xl
                    lg:text-5xl

                    dark:text-white
                  "
                >
                  🚨 Panic Mode
                </h1>

                <p
                  className="
                    mt-4
                    max-w-3xl
                    text-sm
                    leading-7
                    text-slate-600
                    sm:text-base

                    dark:text-slate-300
                  "
                >
                  When your exam is close, do not revise everything.
                  NAVTA helps you focus on weak chapters first:
                  revise the Study Notes, practise targeted questions,
                  then complete a Fix Test.
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
                  label="Revise"
                  value="Notes"
                />

                <HeroMetric
                  icon={BrainCircuit}
                  label="Practise"
                  value="Targeted"
                />

                <HeroMetric
                  icon={Target}
                  label="Fix"
                  value="70%+"
                />
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div
            className="
              mt-6
              rounded-2xl
              border
              border-rose-200
              bg-rose-50
              px-4
              py-3
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

        {loadingPlan ? (
          <section
            className="
              mt-6
              rounded-[26px]
              border
              border-slate-200
              bg-white/90
              p-8
              text-center
              shadow-sm

              dark:border-slate-800
              dark:bg-slate-950/70
            "
          >
            <p
              className="
                text-sm
                font-black
                text-slate-700

                dark:text-slate-200
              "
            >
              Loading your Panic Mode plan...
            </p>
          </section>
        ) : !planCreated ? (
          <section
            className="
              mt-6
              rounded-[26px]
              border
              border-slate-200
              bg-white/90
              p-5
              shadow-md
              sm:p-7

              dark:border-slate-800
              dark:bg-slate-950/70
            "
          >
            <div>
              <p
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.16em]
                  text-rose-500
                "
              >
                Build Your Emergency Plan
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
                Tell NAVTA how close your exam is.
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500

                  dark:text-slate-400
                "
              >
                NAVTA will analyse your real NAVTA TEST history
                and build your Fix First, Quick Revision and Strong lists.
              </p>
            </div>

            <div
              className="
                mt-7
                space-y-7
              "
            >
              <ChoiceGroup
                title="Preparing for"
                options={EXAM_OPTIONS}
                value={exam}
                onChange={setExam}
              />

              <ChoiceGroup
                title="Exam in"
                options={EXAM_WINDOWS}
                value={examWindow}
                onChange={setExamWindow}
              />

              <ChoiceGroup
                title="Available study time today"
                options={STUDY_TIME_OPTIONS}
                value={studyTime}
                onChange={setStudyTime}
              />
            </div>

            <button
              type="button"
              onClick={createPlan}
              disabled={creatingPlan || loadingPlan}
              className="
                mt-8
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-rose-600
                px-5
                py-3.5
                text-sm
                font-black
                text-white
                shadow-sm
                transition-colors
                hover:bg-rose-700
                sm:w-auto

                dark:bg-rose-500
                dark:hover:bg-rose-400
              "
            >
              <Sparkles className="h-4 w-4" />
              {creatingPlan ? 'Building Plan...' : 'Build My Panic Plan'}
            </button>
          </section>
        ) : (
          <div
            className="
              mt-6
              grid
              gap-6
              xl:grid-cols-[0.78fr_1.22fr]
            "
          >
            <section
              className="
                space-y-5
              "
            >
              <div
                className="
                  rounded-[24px]
                  border
                  border-slate-200
                  bg-white/90
                  p-5
                  shadow-sm

                  dark:border-slate-800
                  dark:bg-slate-950/70
                "
              >
                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    justify-between
                    gap-3
                  "
                >
                  <div>
                    <p
                      className="
                        text-[10px]
                        font-black
                        uppercase
                        tracking-[0.16em]
                        text-slate-500
                      "
                    >
                      Current Panic Plan
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
                      {session?.exam || exam} • {selectedWindow.label}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={resetPlan}
                    disabled={resettingPlan}
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-2
                      text-xs
                      font-bold
                      text-slate-600
                      transition-colors
                      hover:bg-slate-50

                      dark:border-slate-700
                      dark:bg-slate-900
                      dark:text-slate-300
                      dark:hover:bg-slate-800
                    "
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {resettingPlan ? 'Resetting...' : 'Change Plan'}
                  </button>
                </div>

                <div
                  className="
                    mt-4
                    grid
                    grid-cols-2
                    gap-3
                  "
                >
                  <SummaryMetric
                    icon={Clock3}
                    label="Time Today"
                    value={selectedStudyTime.label}
                  />

                  <SummaryMetric
                    icon={Zap}
                    label="Practice Set"
                    value={`${practiceCount} Questions`}
                  />
                </div>
              </div>

              <PrioritySection
                title="🔴 Fix First"
                subtitle="These chapters need attention before the exam."
                items={fixFirst}
                activeChapterId={activeChapterId}
                onSelect={changeActiveChapter}
                tone="rose"
              />

              <PrioritySection
                title="🟡 Quick Revision"
                subtitle="Review these after Fix First."
                items={quickRevision}
                activeChapterId={activeChapterId}
                onSelect={changeActiveChapter}
                tone="amber"
              />

              <PrioritySection
                title="🟢 Already Strong"
                subtitle="Do not spend too much time here."
                items={strong}
                activeChapterId={activeChapterId}
                onSelect={changeActiveChapter}
                tone="emerald"
              />
            </section>

            {activeChapter ? (
            <section
              className="
                rounded-[26px]
                border
                border-slate-200
                bg-white/90
                p-5
                shadow-md
                sm:p-7

                dark:border-slate-800
                dark:bg-slate-950/70
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.16em]
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
                    {activeChapter.chapter}
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500

                      dark:text-slate-400
                    "
                  >
                    {activeChapter.subject} • Recent accuracy{' '}
                    {activeChapter.accuracy}%
                  </p>
                </div>

                <div
                  className="
                    rounded-2xl
                    bg-rose-50
                    px-4
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
                      tracking-wider
                      text-rose-500
                    "
                  >
                    Fix Target
                  </p>

                  <p
                    className="
                      mt-1
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
                <WorkflowStep
                  number="01"
                  icon={BookOpen}
                  title="Revise Study Notes"
                  description={`Read the important notes for ${activeChapter.chapter} before attempting questions.`}
                  completed={progress.revised}
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
                        subject: activeChapter.subject,
                        chapter: activeChapter.chapter
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
                        transition-colors
                        hover:bg-sky-700
                      "
                    >
                      <BookOpen className="h-4 w-4" />
                      Open Study Notes
                    </Link>

                    <button
                      type="button"
                      disabled={updatingProgress || progress.revised}
                      onClick={() =>
                        updateProgress({
                          revised: true
                        })
                      }
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        text-xs
                        font-black
                        text-slate-700
                        transition-colors
                        hover:bg-slate-50

                        dark:border-slate-700
                        dark:bg-slate-900
                        dark:text-slate-200
                        dark:hover:bg-slate-800
                      "
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      I Revised This
                    </button>
                  </div>
                </WorkflowStep>

                <WorkflowStep
                  number="02"
                  icon={BrainCircuit}
                  title="Targeted Practice"
                  description={`Practise ${practiceCount} questions from ${activeChapter.chapter}.`}
                  completed={progress.practised}
                  locked={!progress.revised}
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
                      to="/navta-test"
                      state={{
                        panicMode: true,
                        mode: 'practice',
                        subject: activeChapter.subject,
                        chapter: activeChapter.chapter,
                        totalQuestions: practiceCount
                      }}
                      onClick={(event) => {
                        if (!progress.revised) {
                          event.preventDefault();
                        }
                      }}
                      className={`
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        px-4
                        py-3
                        text-xs
                        font-black
                        text-white
                        transition-colors

                        ${
                          progress.revised
                            ? 'bg-violet-600 hover:bg-violet-700'
                            : 'cursor-not-allowed bg-slate-300 dark:bg-slate-700'
                        }
                      `}
                    >
                      <BrainCircuit className="h-4 w-4" />
                      Start Targeted Practice
                    </Link>

                    <button
                      type="button"
                      disabled={
                        !progress.revised ||
                        updatingProgress ||
                        progress.practised
                      }
                      onClick={() =>
                        updateProgress({
                          practised: true
                        })
                      }
                      className={`
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        px-4
                        py-3
                        text-xs
                        font-black
                        transition-colors

                        ${
                          progress.revised
                            ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                            : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50'
                        }
                      `}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Practice Complete
                    </button>
                  </div>
                </WorkflowStep>

                <WorkflowStep
                  number="03"
                  icon={Target}
                  title="Fix Test"
                  description="Take a short verification test. Score 70% or more to mark the chapter fixed."
                  completed={progress.fixTestPassed}
                  locked={!progress.practised}
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
                      to="/navta-test"
                      state={{
                        panicMode: true,
                        mode: 'fix-test',
                        subject: activeChapter.subject,
                        chapter: activeChapter.chapter,
                        totalQuestions: 10,
                        targetPercentage: 70
                      }}
                      onClick={(event) => {
                        if (!progress.practised) {
                          event.preventDefault();
                        }
                      }}
                      className={`
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        px-4
                        py-3
                        text-xs
                        font-black
                        text-white
                        transition-colors

                        ${
                          progress.practised
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'cursor-not-allowed bg-slate-300 dark:bg-slate-700'
                        }
                      `}
                    >
                      <Target className="h-4 w-4" />
                      Start Fix Test
                    </Link>

                    <button
                      type="button"
                      disabled
                      title="The real Fix Test result will update this automatically."
                      className={`
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        px-4
                        py-3
                        text-xs
                        font-black
                        transition-colors

                        ${
                          progress.practised
                            ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                            : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900/50'
                        }
                      `}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Fix Test decides this automatically
                    </button>
                  </div>
                </WorkflowStep>
              </div>

              {progress.fixTestPassed && (
                <div
                  className="
                    mt-6
                    rounded-[22px]
                    border
                    border-emerald-200
                    bg-emerald-50
                    p-5

                    dark:border-emerald-500/20
                    dark:bg-emerald-500/10
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      gap-3
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
                        bg-emerald-500
                        text-white
                      "
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>

                    <div>
                      <p
                        className="
                          text-sm
                          font-black
                          text-emerald-800

                          dark:text-emerald-300
                        "
                      >
                        Weakness Fixed
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          leading-5
                          text-emerald-700

                          dark:text-emerald-400
                        "
                      >
                        NAVTA saved this chapter as fixed after the
                        Fix Test reached the required 70% score.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div
                className="
                  mt-6
                  rounded-[22px]
                  border
                  border-amber-200
                  bg-amber-50/80
                  p-5

                  dark:border-amber-500/20
                  dark:bg-amber-500/10
                "
              >
                <div
                  className="
                    flex
                    items-start
                    gap-3
                  "
                >
                  <TimerReset
                    className="
                      mt-0.5
                      h-5
                      w-5
                      shrink-0
                      text-amber-600
                    "
                  />

                  <div>
                    <p
                      className="
                        text-sm
                        font-black
                        text-slate-900

                        dark:text-white
                      "
                    >
                      Panic Rule
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        leading-5
                        text-slate-600

                        dark:text-slate-400
                      "
                    >
                      Do not spend time on strong chapters while your
                      Fix First list still has unresolved weaknesses.
                    </p>
                  </div>
                </div>
              </div>
            </section>
            ) : (
              <section
                className="
                  rounded-[26px]
                  border
                  border-slate-200
                  bg-white/90
                  p-8
                  text-center
                  shadow-sm

                  dark:border-slate-800
                  dark:bg-slate-950/70
                "
              >
                <BrainCircuit
                  className="
                    mx-auto
                    h-10
                    w-10
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
                  Complete NAVTA TESTs to unlock your chapter analysis
                </h2>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-xl
                    text-sm
                    leading-6
                    text-slate-500

                    dark:text-slate-400
                  "
                >
                  Your Panic Mode plan is active, but NAVTA does not
                  yet have enough chapter-level test history for this
                  exam. Complete NAVTA TESTs and return here.
                </p>

                <Link
                  to="/navta-test"
                  className="
                    mt-5
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-rose-600
                    px-4
                    py-3
                    text-xs
                    font-black
                    text-white
                    transition-colors
                    hover:bg-rose-700
                  "
                >
                  Go to NAVTA TEST
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
        border-white/80
        bg-white/75
        p-3
        text-center
        shadow-sm

        dark:border-white/5
        dark:bg-white/[0.04]
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
          text-sm
          font-black
          text-slate-950

          dark:text-white
        "
      >
        {value}
      </p>

      <p
        className="
          mt-0.5
          text-[9px]
          font-black
          uppercase
          tracking-wider
          text-slate-500
        "
      >
        {label}
      </p>
    </div>
  );
}

function ChoiceGroup({
  title,
  options,
  value,
  onChange
}) {
  return (
    <div>
      <p
        className="
          mb-3
          text-sm
          font-black
          text-slate-900

          dark:text-white
        "
      >
        {title}
      </p>

      <div
        className="
          grid
          gap-3
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        {options.map((option) => {
          const selected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`
                rounded-2xl
                border
                p-4
                text-left
                transition-colors

                ${
                  selected
                    ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-500/10 dark:border-rose-500/50 dark:bg-rose-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900'
                }
              `}
            >
              <p
                className={`
                  text-sm
                  font-black

                  ${
                    selected
                      ? 'text-rose-600 dark:text-rose-300'
                      : 'text-slate-900 dark:text-white'
                  }
                `}
              >
                {option.label}
              </p>

              {option.description && (
                <p
                  className="
                    mt-1
                    text-[10px]
                    leading-4
                    text-slate-500
                  "
                >
                  {option.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
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
        rounded-2xl
        border
        border-slate-200
        bg-slate-50/70
        p-4

        dark:border-slate-800
        dark:bg-slate-900/60
      "
    >
      <Icon
        className="
          h-4
          w-4
          text-rose-500
        "
      />

      <p
        className="
          mt-3
          text-sm
          font-black
          text-slate-950

          dark:text-white
        "
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-[9px]
          font-black
          uppercase
          tracking-wider
          text-slate-500
        "
      >
        {label}
      </p>
    </div>
  );
}

function PrioritySection({
  title,
  subtitle,
  items,
  activeChapterId,
  onSelect,
  tone
}) {
  const toneClasses = {
    rose: {
      badge:
        'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
      active:
        'border-rose-400 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10'
    },
    amber: {
      badge:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
      active:
        'border-amber-400 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
    },
    emerald: {
      badge:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
      active:
        'border-emerald-400 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10'
    }
  };

  const classes = toneClasses[tone] || toneClasses.rose;

  return (
    <div
      className="
        rounded-[24px]
        border
        border-slate-200
        bg-white/90
        p-5
        shadow-sm

        dark:border-slate-800
        dark:bg-slate-950/70
      "
    >
      <h3
        className="
          text-base
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
          leading-5
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
        {items.map((item) => {
          const active =
            String(item._id || item.id) === String(activeChapterId);

          return (
            <button
              key={item._id || item.id}
              type="button"
              onClick={() => onSelect(item._id || item.id)}
              className={`
                flex
                w-full
                items-center
                justify-between
                gap-3
                rounded-2xl
                border
                p-3
                text-left
                transition-colors

                ${
                  active
                    ? classes.active
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900/70'
                }
              `}
            >
              <div
                className="
                  min-w-0
                "
              >
                <p
                  className="
                    truncate
                    text-xs
                    font-black
                    text-slate-900

                    dark:text-white
                  "
                >
                  {item.chapter}
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-slate-500
                  "
                >
                  {item.subject}
                </p>
              </div>

              <div
                className={`
                  shrink-0
                  rounded-xl
                  px-2.5
                  py-1.5
                  text-[10px]
                  font-black

                  ${classes.badge}
                `}
              >
                {item.accuracy}%
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorkflowStep({
  number,
  icon: Icon,
  title,
  description,
  completed,
  locked = false,
  children
}) {
  return (
    <div
      className={`
        rounded-[22px]
        border
        p-5

        ${
          completed
            ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5'
            : locked
              ? 'border-slate-200 bg-slate-50/70 opacity-70 dark:border-slate-800 dark:bg-slate-900/40'
              : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40'
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
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl

            ${
              completed
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
            }
          `}
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>

        <div
          className="
            min-w-0
            flex-1
          "
        >
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <span
              className="
                text-[10px]
                font-black
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              Step {number}
            </span>

            {locked && (
              <span
                className="
                  rounded-full
                  bg-slate-200
                  px-2
                  py-1
                  text-[9px]
                  font-black
                  uppercase
                  text-slate-500

                  dark:bg-slate-800
                  dark:text-slate-400
                "
              >
                Locked
              </span>
            )}

            {completed && (
              <span
                className="
                  rounded-full
                  bg-emerald-100
                  px-2
                  py-1
                  text-[9px]
                  font-black
                  uppercase
                  text-emerald-700

                  dark:bg-emerald-500/10
                  dark:text-emerald-300
                "
              >
                Complete
              </span>
            )}
          </div>

          <h3
            className="
              mt-1
              text-base
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
              leading-5
              text-slate-500

              dark:text-slate-400
            "
          >
            {description}
          </p>

          <div
            className="
              mt-4
            "
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
