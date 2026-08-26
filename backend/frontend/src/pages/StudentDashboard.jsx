import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  useAuth
} from '../context/AuthContext';

import {
  studentAPI
} from '../utils/api';

import Button from '../components/Button';

import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Coins,
  FileText,
  Flame,
  GraduationCap,
  LineChart,
  Sparkles,
  Target,
  Trophy,
  Zap
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

// =====================================================
// FALLBACK DATA
// =====================================================

const FALLBACK_CHART = [
  {
    date: 'Mon',
    score: 48
  },
  {
    date: 'Tue',
    score: 64
  },
  {
    date: 'Wed',
    score: 52
  },
  {
    date: 'Thu',
    score: 73
  },
  {
    date: 'Fri',
    score: 82
  },
  {
    date: 'Sat',
    score: 78
  },
  {
    date: 'Sun',
    score: 86
  }
];

const UPCOMING = [
  {
    title: 'Chemistry Quiz',
    subtitle: 'Organic Chemistry',
    time: 'Today, 6:00 PM'
  },
  {
    title: 'Physics Test',
    subtitle: 'Mechanics',
    time: 'Tomorrow, 5:00 PM'
  },
  {
    title: 'Maths Practice',
    subtitle: 'Trigonometry',
    time: 'Next session'
  }
];

const SUBJECT_PROGRESS = [
  {
    subject: 'Physics',
    value: 72
  },
  {
    subject: 'Chemistry',
    value: 64
  },
  {
    subject: 'Mathematics',
    value: 70
  },
  {
    subject: 'Biology',
    value: 68
  }
];

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function StudentDashboard() {
  const {
    user,
    profile,
    streak
  } = useAuth();

  const [results, setResults] =
    useState([]);

  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ===================================================
  // LOAD DATA
  // ===================================================

  useEffect(() => {
    const loadDashboard =
      async () => {
        try {
          const resultResponse =
            await studentAPI.getResults();

          setResults(
            resultResponse?.data ||
              []
          );

          const analyticsResponse =
            await studentAPI.getAnalytics();

          setAnalytics(
            analyticsResponse?.data ||
              analyticsResponse ||
              null
          );
        } catch (error) {
          console.error(
            'Failed to load student dashboard:',
            error
          );
        } finally {
          setLoading(false);
        }
      };

    loadDashboard();
  }, []);

  // ===================================================
  // LEVEL
  // ===================================================

  const totalXP =
    Number(
      profile?.xp || 0
    );

  const level =
    Number(
      profile?.level || 1
    );

  const xpPerLevel = 500;

  const currentXP =
    totalXP %
    xpPerLevel;

  const levelProgress =
    Math.min(
      100,
      Math.round(
        (
          currentXP /
          xpPerLevel
        ) * 100
      )
    );

  // ===================================================
  // AVERAGE SCORE
  // ===================================================

  const averageScore =
    useMemo(() => {
      if (
        !results.length
      ) {
        return 0;
      }

      const total =
        results.reduce(
          (
            sum,
            result
          ) =>
            sum +
            Number(
              result?.percentage ||
                0
            ),
          0
        );

      return Math.round(
        total /
          results.length
      );
    }, [results]);

  // ===================================================
  // CHART
  // ===================================================

  const chartData =
    useMemo(() => {
      const progression =
        analytics?.progression;

      if (
        Array.isArray(
          progression
        ) &&
        progression.length
      ) {
        return progression;
      }

      return FALLBACK_CHART;
    }, [analytics]);

  // ===================================================
  // DAILY GOALS
  // ===================================================

  const dailyGoals = [
    {
      title:
        'Read one chapter summary',
      reward: '+10 XP',
      done: true
    },
    {
      title:
        'Score 70% or more on a chapter quiz',
      reward: '+20 XP',
      done: false
    },
    {
      title:
        'Maintain your login streak',
      reward: '+30 XP',
      done:
        Number(
          streak?.currentStreak ||
            0
        ) > 0
    }
  ];

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div
        className="
          min-h-[75vh]
          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-4
          "
        >
          <div
            className="
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-sky-500
              border-t-transparent
            "
          />

          <p
            className="
              text-sm
              font-semibold
              text-slate-400
            "
          >
            Preparing your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        relative
        w-full
        min-w-0
        overflow-x-hidden
        text-white
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1380px]
          space-y-5
        "
      >

        {/* =================================================
            HERO + UPCOMING
        ================================================= */}

        <section
          className="
            grid
            grid-cols-1
            gap-5
            2xl:grid-cols-[minmax(0,1fr)_290px]
          "
        >

          {/* HERO */}

          <div
            className="
              relative
              overflow-hidden
              rounded-[26px]
              border
              border-sky-500/25
              bg-[#071224]/92
              shadow-[0_24px_90px_rgba(2,132,199,0.14)]
              backdrop-blur-xl
            "
          >

            <div
              className="
                pointer-events-none
                absolute
                -right-24
                -top-24
                h-80
                w-80
                rounded-full
                bg-blue-500/18
                blur-[110px]
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                bottom-0
                right-[15%]
                h-60
                w-60
                rounded-full
                bg-violet-500/14
                blur-[100px]
              "
            />

            <div
              className="
                relative
                grid
                gap-7
                p-6
                sm:p-7
                xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.85fr)]
                xl:items-center
                xl:p-8
              "
            >

              {/* LEFT */}

              <div className="min-w-0">

                <div
                  className="
                    mb-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-sky-500/20
                    bg-sky-500/10
                    px-3
                    py-1.5
                    text-xs
                    font-bold
                    text-sky-300
                  "
                >
                  <Sparkles
                    className="
                      h-4
                      w-4
                    "
                  />

                  Welcome back
                </div>

                <h1
                  className="
                    max-w-2xl
                    text-3xl
                    font-black
                    tracking-tight
                    text-white
                    sm:text-4xl
                    xl:text-5xl
                    2xl:text-[52px]
                    leading-[1.05]
                  "
                >
                  Let&apos;s continue your
                  <br />

                  <span
                    className="
                      bg-gradient-to-r
                      from-sky-400
                      via-blue-400
                      to-violet-400
                      bg-clip-text
                      text-transparent
                    "
                  >
                    learning journey!
                  </span>
                </h1>

                <p
                  className="
                    mt-4
                    max-w-xl
                    text-sm
                    leading-6
                    text-slate-400
                    sm:text-base
                  "
                >
                  Learn. Practise.
                  Test. Analyse.
                  Improve. Earn.
                </p>

                <p
                  className="
                    mt-2
                    text-xs
                    text-slate-500
                  "
                >
                  Welcome,{' '}

                  <span
                    className="
                      font-bold
                      text-slate-300
                    "
                  >
                    {user?.name ||
                      'Student'}
                  </span>

                  {' • '}

                  {profile?.stream ||
                    'Science'}
                </p>

                <div
                  className="
                    mt-7
                    flex
                    flex-col
                    gap-3
                    sm:flex-row
                  "
                >
                  <Link
                    to="/assessments"
                    className="
                      w-full
                      sm:w-auto
                    "
                  >
                    <Button
                      icon={
                        ArrowRight
                      }
                      className="
                        w-full
                        justify-center
                        sm:w-auto
                      "
                    >
                      Resume Study
                    </Button>
                  </Link>

                  <Link
                    to="/navta-test"
                    className="
                      w-full
                      sm:w-auto
                    "
                  >
                    <button
                      type="button"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-slate-700
                        bg-slate-950/60
                        px-5
                        py-3
                        text-sm
                        font-bold
                        text-white
                        transition
                        hover:border-sky-500
                        hover:bg-sky-500/10
                        sm:w-auto
                      "
                    >
                      Explore NAVTA TEST
                    </button>
                  </Link>
                </div>

              </div>

              {/* RIGHT SNAPSHOT */}

              <div
                className="
                  rounded-[22px]
                  border
                  border-slate-800
                  bg-slate-950/74
                  p-4
                  shadow-2xl
                "
              >

                <div
                  className="
                    flex
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
                        tracking-[0.18em]
                        text-sky-400
                      "
                    >
                      NAVTA Intelligence
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        font-bold
                        text-white
                      "
                    >
                      Your learning
                      snapshot
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-violet-500/10
                    "
                  >
                    <BrainCircuit
                      className="
                        h-5
                        w-5
                        text-violet-400
                      "
                    />
                  </div>
                </div>

                <div
                  className="
                    mt-4
                    grid
                    grid-cols-2
                    gap-3
                  "
                >
                  <MiniHeroCard
                    label="Current Level"
                    value={`Level ${level}`}
                    icon={Award}
                  />

                  <MiniHeroCard
                    label="Average Score"
                    value={`${averageScore}%`}
                    icon={Zap}
                  />
                </div>

                <div
                  className="
                    mt-3
                    rounded-2xl
                    border
                    border-slate-800
                    bg-slate-900/75
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <div>
                      <p
                        className="
                          text-xs
                          font-bold
                          text-slate-400
                        "
                      >
                        Weekly Progress
                      </p>

                      <p
                        className="
                          mt-1
                          text-xl
                          font-black
                          text-sky-400
                        "
                      >
                        {levelProgress}%
                      </p>
                    </div>

                    <LineChart
                      className="
                        h-6
                        w-6
                        text-sky-400
                      "
                    />
                  </div>

                  <div
                    className="
                      mt-3
                      h-2
                      overflow-hidden
                      rounded-full
                      bg-slate-800
                    "
                  >
                    <div
                      className="
                        h-full
                        rounded-full
                        bg-gradient-to-r
                        from-sky-500
                        to-violet-500
                      "
                      style={{
                        width:
                          `${levelProgress}%`
                      }}
                    />
                  </div>

                  <p
                    className="
                      mt-2
                      text-[10px]
                      text-slate-500
                    "
                  >
                    {currentXP} /{' '}
                    {xpPerLevel} XP
                  </p>
                </div>

              </div>

            </div>
          </div>

          {/* UPCOMING */}

          <DashboardPanel
            title="Upcoming"
            subtitle="Your next activities"
            className="h-full"
          >
            <div
              className="
                mt-3
                space-y-2
              "
            >
              {UPCOMING.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={index}
                    className="
                      group
                      flex
                      items-center
                      gap-3
                      rounded-2xl
                      border
                      border-transparent
                      p-3
                      transition
                      hover:border-slate-800
                      hover:bg-white/[0.02]
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
                        bg-violet-500/10
                      "
                    >
                      <CalendarDays
                        className="
                          h-5
                          w-5
                          text-violet-400
                        "
                      />
                    </div>

                    <div
                      className="
                        min-w-0
                        flex-1
                      "
                    >
                      <p
                        className="
                          text-[9px]
                          text-slate-500
                        "
                      >
                        {item.time}
                      </p>

                      <p
                        className="
                          truncate
                          text-sm
                          font-bold
                          text-white
                        "
                      >
                        {item.title}
                      </p>

                      <p
                        className="
                          truncate
                          text-xs
                          text-slate-500
                        "
                      >
                        {item.subtitle}
                      </p>
                    </div>

                    <ChevronRight
                      className="
                        h-4
                        w-4
                        text-slate-600
                        transition
                        group-hover:text-sky-400
                      "
                    />
                  </div>
                )
              )}
            </div>
          </DashboardPanel>

        </section>

        {/* =================================================
            METRICS
        ================================================= */}

        <section
          className="
            grid
            grid-cols-2
            gap-3
            xl:grid-cols-4
          "
        >
          <MetricCard
            icon={Flame}
            value={
              streak?.currentStreak ||
              1
            }
            label="Day Streak"
            subtext="Keep it going!"
            iconClass="text-orange-400"
            iconBg="bg-orange-500/10"
          />

          <MetricCard
            icon={Coins}
            value={
              profile?.coins ??
              0
            }
            label="Coins Balance"
            subtext="Earn more by learning"
            iconClass="text-yellow-400"
            iconBg="bg-yellow-500/10"
          />

          <div
            className="
              rounded-[22px]
              border
              border-slate-800
              bg-[#081326]/92
              p-5
              shadow-xl
              backdrop-blur-xl
            "
          >
            <div
              className="
                flex
                items-center
                gap-4
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-500/10
                "
              >
                <Award
                  className="
                    h-5
                    w-5
                    text-violet-400
                  "
                />
              </div>

              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <p
                  className="
                    text-xl
                    font-black
                    text-white
                  "
                >
                  Level {level}
                </p>

                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  Current Level
                </p>

                <div
                  className="
                    mt-3
                    h-1.5
                    overflow-hidden
                    rounded-full
                    bg-slate-800
                  "
                >
                  <div
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-sky-500
                      to-violet-500
                    "
                    style={{
                      width:
                        `${levelProgress}%`
                    }}
                  />
                </div>

                <p
                  className="
                    mt-1.5
                    text-[9px]
                    text-sky-400
                  "
                >
                  {currentXP} /{' '}
                  {xpPerLevel} XP
                </p>
              </div>
            </div>
          </div>

          <MetricCard
            icon={BarChart3}
            value={`${averageScore}%`}
            label="Average Score"
            subtext={
              averageScore > 0
                ? 'Keep improving'
                : 'Take your first quiz'
            }
            iconClass="text-emerald-400"
            iconBg="bg-emerald-500/10"
          />

        </section>

        {/* =================================================
            PERFORMANCE / GOALS / SUBJECTS
        ================================================= */}

        <section
          className="
            grid
            grid-cols-1
            gap-5
            2xl:grid-cols-[minmax(0,1.55fr)_minmax(250px,0.75fr)_minmax(240px,0.7fr)]
          "
        >

          <DashboardPanel
            title="Your Performance Overview"
            subtitle="Score trend over recent activity"
          >
            <div
              className="
                mt-5
                h-[280px]
                w-full
              "
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
              >
                <AreaChart
                  data={
                    chartData
                  }
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}
                >
                  <defs>
                    <linearGradient
                      id="navtaScoreGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#0ea5e9"
                        stopOpacity={0.35}
                      />

                      <stop
                        offset="95%"
                        stopColor="#0ea5e9"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[
                      0,
                      100
                    ]}
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        '#081326',
                      border:
                        '1px solid #1e293b',
                      borderRadius:
                        '12px',
                      color:
                        '#ffffff'
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    fill="url(#navtaScoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Daily Goals"
            subtitle="Complete goals to earn more"
          >
            <div
              className="
                mt-3
                space-y-3
              "
            >
              {dailyGoals.map(
                (
                  goal,
                  index
                ) => (
                  <div
                    key={index}
                    className="
                      flex
                      gap-3
                      rounded-2xl
                      border
                      border-slate-800/70
                      bg-slate-950/35
                      p-3
                    "
                  >
                    <div
                      className={`
                        mt-0.5
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        ${
                          goal.done
                            ? 'bg-emerald-500/10'
                            : 'bg-slate-800'
                        }
                      `}
                    >
                      {goal.done ? (
                        <CheckCircle2
                          className="
                            h-5
                            w-5
                            text-emerald-400
                          "
                        />
                      ) : (
                        <Target
                          className="
                            h-5
                            w-5
                            text-slate-500
                          "
                        />
                      )}
                    </div>

                    <div
                      className="
                        min-w-0
                      "
                    >
                      <p
                        className={`
                          text-xs
                          font-semibold
                          leading-5
                          ${
                            goal.done
                              ? 'text-slate-500 line-through'
                              : 'text-slate-200'
                          }
                        `}
                      >
                        {goal.title}
                      </p>

                      <p
                        className="
                          mt-1
                          text-[9px]
                          text-sky-400
                        "
                      >
                        Earn{' '}
                        {goal.reward}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Top Subjects"
            subtitle="Your current progress"
          >
            <div
              className="
                mt-4
                space-y-5
              "
            >
              {SUBJECT_PROGRESS.map(
                (
                  item
                ) => (
                  <SubjectProgress
                    key={
                      item.subject
                    }
                    subject={
                      item.subject
                    }
                    value={
                      item.value
                    }
                  />
                )
              )}
            </div>
          </DashboardPanel>

        </section>

        {/* =================================================
            QUICK ACTIONS + QUOTE
        ================================================= */}

        <section
          className="
            grid
            grid-cols-1
            gap-5
            2xl:grid-cols-[minmax(0,1fr)_280px]
          "
        >
          <DashboardPanel
            title="What would you like to do today?"
            subtitle="Jump directly into your learning tools"
          >
            <div
              className="
                mt-4
                grid
                grid-cols-2
                gap-3
                md:grid-cols-3
                2xl:grid-cols-5
              "
            >
              <QuickAction
                to="/notes"
                icon={BookOpen}
                title="Study Notes"
                desc="Explore chapters"
                color="text-sky-400"
                background="bg-sky-500/10"
              />

              <QuickAction
                to="/navta-test"
                icon={Target}
                title="NAVTA TEST"
                desc="Timed smart tests"
                color="text-violet-400"
                background="bg-violet-500/10"
              />

              <QuickAction
                to="/pyqs"
                icon={FileText}
                title="PYQ Papers"
                desc="Past-year papers"
                color="text-pink-400"
                background="bg-pink-500/10"
              />

              <QuickAction
                to="/assessments"
                icon={ClipboardCheck}
                title="Assessments"
                desc="Practice quizzes"
                color="text-yellow-400"
                background="bg-yellow-500/10"
              />

              <QuickAction
                to="/analytics"
                icon={BarChart3}
                title="Analytics"
                desc="Track progress"
                color="text-cyan-400"
                background="bg-cyan-500/10"
              />
            </div>
          </DashboardPanel>

          <div
            className="
              relative
              overflow-hidden
              rounded-[24px]
              border
              border-violet-500/20
              bg-gradient-to-br
              from-[#0b1530]
              via-[#111743]
              to-[#170b3c]
              p-6
              shadow-xl
            "
          >
            <div
              className="
                pointer-events-none
                absolute
                -right-12
                -top-12
                h-40
                w-40
                rounded-full
                bg-violet-500/20
                blur-[70px]
              "
            />

            <div
              className="
                relative
              "
            >
              <p
                className="
                  text-5xl
                  font-black
                  leading-none
                  text-violet-500/40
                "
              >
                “
              </p>

              <p
                className="
                  mt-2
                  text-xl
                  font-black
                  leading-8
                  text-white
                "
              >
                Discipline today
                leads to success
                tomorrow.
              </p>

              <p
                className="
                  mt-5
                  text-xs
                  font-bold
                  uppercase
                  tracking-widest
                  text-violet-300
                "
              >
                — NAVTA
              </p>
            </div>
          </div>

        </section>

        {/* =================================================
            RECENT RESULTS
        ================================================= */}

        <DashboardPanel
          title="Recent Quiz Attempts"
          subtitle="Review your latest performance"
        >
          <div
            className="
              mt-4
              space-y-3
            "
          >
            {results
              .slice(
                0,
                3
              )
              .map(
                (
                  result
                ) => (
                  <div
                    key={
                      result._id
                    }
                    className="
                      flex
                      flex-col
                      gap-3
                      rounded-2xl
                      border
                      border-slate-800
                      bg-slate-950/35
                      p-4
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "
                  >
                    <div
                      className="
                        flex
                        min-w-0
                        items-center
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
                          bg-sky-500/10
                        "
                      >
                        <GraduationCap
                          className="
                            h-5
                            w-5
                            text-sky-400
                          "
                        />
                      </div>

                      <div
                        className="
                          min-w-0
                        "
                      >
                        <p
                          className="
                            truncate
                            text-sm
                            font-bold
                            text-white
                          "
                        >
                          {result.test?.title ||
                            'Chapter Quiz'}
                        </p>

                        <p
                          className="
                            mt-0.5
                            text-[10px]
                            text-slate-500
                          "
                        >
                          {result.correctAnswers ||
                            0}{' '}
                          /{' '}
                          {result.totalQuestions ||
                            0}{' '}
                          correct
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-4
                        sm:justify-end
                      "
                    >
                      <p
                        className={`
                          text-lg
                          font-black
                          ${
                            result.isPassed
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }
                        `}
                      >
                        {result.percentage ||
                          0}
                        %
                      </p>

                      <Link
                        to={`/results/${result._id}`}
                      >
                        <button
                          type="button"
                          className="
                            rounded-lg
                            border
                            border-slate-700
                            px-3
                            py-2
                            text-xs
                            font-bold
                            text-slate-300
                            transition
                            hover:border-sky-500
                            hover:text-white
                          "
                        >
                          Review
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              )}

            {results.length ===
              0 && (
              <div
                className="
                  py-10
                  text-center
                "
              >
                <Trophy
                  className="
                    mx-auto
                    h-9
                    w-9
                    text-slate-700
                  "
                />

                <p
                  className="
                    mt-3
                    text-sm
                    text-slate-500
                  "
                >
                  No assessments
                  taken yet.
                </p>

                <Link
                  to="/assessments"
                  className="
                    mt-3
                    inline-flex
                    items-center
                    gap-1
                    text-xs
                    font-bold
                    text-sky-400
                    hover:underline
                  "
                >
                  Take your first quiz

                  <ArrowRight
                    className="
                      h-3
                      w-3
                    "
                  />
                </Link>
              </div>
            )}
          </div>
        </DashboardPanel>

      </div>
    </div>
  );
}

// =====================================================
// PANEL
// =====================================================

function DashboardPanel({
  title,
  subtitle,
  children,
  className = ''
}) {
  return (
    <div
      className={`
        rounded-[24px]
        border
        border-slate-800
        bg-[#081326]/92
        p-5
        shadow-[0_20px_60px_rgba(0,0,0,0.20)]
        backdrop-blur-xl
        sm:p-6
        ${className}
      `}
    >
      <h2
        className="
          text-base
          font-black
          text-white
          sm:text-lg
        "
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className="
            mt-1
            text-[10px]
            text-slate-500
            sm:text-xs
          "
        >
          {subtitle}
        </p>
      )}

      {children}
    </div>
  );
}

// =====================================================
// METRIC CARD
// =====================================================

function MetricCard({
  icon: Icon,
  value,
  label,
  subtext,
  iconClass,
  iconBg
}) {
  return (
    <div
      className="
        rounded-[22px]
        border
        border-slate-800
        bg-[#081326]/92
        p-4
        shadow-xl
        backdrop-blur-xl
        sm:p-5
      "
    >
      <div
        className="
          flex
          items-center
          gap-3
          sm:gap-4
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
            rounded-xl
            ${iconBg}
          `}
        >
          <Icon
            className={`
              h-5
              w-5
              ${iconClass}
            `}
          />
        </div>

        <div className="min-w-0">

          <p
            className="
              text-xl
              font-black
              text-white
              sm:text-2xl
            "
          >
            {value}
          </p>

          <p
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-wider
              text-slate-500
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1
              hidden
              text-[9px]
              text-slate-600
              sm:block
            "
          >
            {subtext}
          </p>

        </div>
      </div>
    </div>
  );
}

// =====================================================
// QUICK ACTION
// =====================================================

function QuickAction({
  to,
  icon: Icon,
  title,
  desc,
  color,
  background
}) {
  return (
    <Link
      to={to}
      className="
        group
        min-w-0
      "
    >
      <div
        className="
          h-full
          rounded-2xl
          border
          border-slate-800
          bg-slate-950/35
          p-4
          transition
          duration-200
          hover:-translate-y-1
          hover:border-sky-500/40
          hover:bg-sky-500/[0.04]
        "
      >
        <div
          className={`
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            ${background}
          `}
        >
          <Icon
            className={`
              h-5
              w-5
              ${color}
            `}
          />
        </div>

        <p
          className="
            mt-4
            text-sm
            font-bold
            text-white
          "
        >
          {title}
        </p>

        <p
          className="
            mt-1
            text-[10px]
            text-slate-500
          "
        >
          {desc}
        </p>

        <ArrowRight
          className="
            mt-4
            h-4
            w-4
            text-slate-600
            transition
            group-hover:translate-x-1
            group-hover:text-sky-400
          "
        />
      </div>
    </Link>
  );
}

// =====================================================
// SUBJECT PROGRESS
// =====================================================

function SubjectProgress({
  subject,
  value
}) {
  return (
    <div>
      <div
        className="
          mb-2
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <p
          className="
            text-xs
            font-bold
            text-slate-300
          "
        >
          {subject}
        </p>

        <p
          className="
            text-xs
            font-bold
            text-slate-500
          "
        >
          {value}%
        </p>
      </div>

      <div
        className="
          h-1.5
          overflow-hidden
          rounded-full
          bg-slate-800
        "
      >
        <div
          className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-sky-500
            to-violet-500
          "
          style={{
            width:
              `${value}%`
          }}
        />
      </div>
    </div>
  );
}

// =====================================================
// HERO MINI CARD
// =====================================================

function MiniHeroCard({
  icon: Icon,
  label,
  value
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-800
        bg-slate-900/75
        p-3
      "
    >
      <Icon
        className="
          h-4
          w-4
          text-sky-400
        "
      />

      <p
        className="
          mt-3
          text-sm
          font-black
          text-white
        "
      >
        {value}
      </p>

      <p
        className="
          mt-0.5
          text-[9px]
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
