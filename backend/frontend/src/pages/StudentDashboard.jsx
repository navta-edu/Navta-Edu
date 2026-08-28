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
  ShieldCheck,
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

  const [mistakeStats, setMistakeStats] =
    useState({
      totalMistakes: 0,
      needRevision: 0,
      mastered: 0,
      masteryPercentage: 0
    });

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

          // ===========================================
          // MISTAKE NOTEBOOK STATS
          // ===========================================

          try {
            const token =
              localStorage.getItem('token') ||
              localStorage.getItem('authToken') ||
              localStorage.getItem('accessToken');

            const mistakeResponse =
              await fetch(
                '/api/mistake-notebook/stats',
                {
                  method: 'GET',
                  credentials: 'include',
                  headers: token
                    ? {
                        Authorization:
                          `Bearer ${token}`
                      }
                    : {}
                }
              );

            if (mistakeResponse.ok) {
              const mistakeData =
                await mistakeResponse.json();

              setMistakeStats({
                totalMistakes:
                  Number(
                    mistakeData?.stats
                      ?.totalMistakes || 0
                  ),
                needRevision:
                  Number(
                    mistakeData?.stats
                      ?.needRevision || 0
                  ),
                mastered:
                  Number(
                    mistakeData?.stats
                      ?.mastered || 0
                  ),
                masteryPercentage:
                  Number(
                    mistakeData?.stats
                      ?.masteryPercentage || 0
                  )
              });
            } else {
              console.error(
                'Failed to load Mistake Notebook stats:',
                mistakeResponse.status
              );
            }
          } catch (mistakeError) {
            console.error(
              'Failed to load Mistake Notebook stats:',
              mistakeError
            );
          }
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
  // CHART DATA
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

      return [];
    }, [analytics]);

  // ===================================================
  // LIVE COIN BALANCE
  // ===================================================

  const coinBalance =
    Number(
      analytics?.coinBalance ??
      profile?.coins ??
      0
    );

  // ===================================================
  // NAVTA TEST STREAK
  // ===================================================

  const navtaStreak =
    analytics?.streak || {};

  const currentStreak =
    Number(
      navtaStreak?.currentStreak ??
      streak?.currentStreak ??
      0
    );

  const longestStreak =
    Number(
      navtaStreak?.longestStreak ??
      0
    );

  const recoveryActive =
    Boolean(
      navtaStreak?.recoveryActive
    );

  const recoveryRequired =
    Number(
      navtaStreak?.recoveryRequired ??
      0
    );

  const recoveryCompleted =
    Number(
      navtaStreak?.recoveryCompleted ??
      0
    );

  const recoveryRemaining =
    Number(
      navtaStreak?.recoveryRemaining ??
      Math.max(
        0,
        recoveryRequired -
          recoveryCompleted
      )
    );

  const streakSubtext =
    recoveryActive
      ? `Recovery ${recoveryCompleted}/${recoveryRequired} • ${recoveryRemaining} day${recoveryRemaining === 1 ? '' : 's'} left`
      : currentStreak > 0
        ? `Best ${longestStreak || currentStreak} • Complete a NAVTA TEST today`
        : 'Complete a NAVTA TEST to start your streak';

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
        recoveryActive
          ? `Complete NAVTA TEST recovery day ${Math.min(
              recoveryCompleted + 1,
              recoveryRequired || 1
            )}/${recoveryRequired || 1}`
          : 'Complete a NAVTA TEST for your streak',
      reward:
        recoveryActive
          ? 'Streak Protection'
          : 'Streak Progress',
      done: false
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
              text-slate-500
              dark:text-slate-400
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
        text-slate-900
        dark:text-white
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

          {/* =================================================
              HERO
          ================================================= */}

          <div
            className="
              relative
              overflow-hidden
              rounded-[28px]
              border
              border-slate-200/70
              bg-white/85
              shadow-[0_20px_70px_rgba(15,23,42,0.10)]
              backdrop-blur-2xl

              dark:border-sky-500/20
              dark:bg-[#071224]/92
              dark:shadow-[0_24px_90px_rgba(2,132,199,0.14)]
            "
          >

            {/* LIGHT MODE GLOW */}

            <div
              className="
                pointer-events-none
                absolute
                -right-24
                -top-24
                h-80
                w-80
                rounded-full
                bg-sky-300/20
                blur-[110px]

                dark:bg-blue-500/18
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
                bg-violet-300/15
                blur-[100px]

                dark:bg-violet-500/14
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
                    border-sky-200
                    bg-sky-50/90
                    px-3
                    py-1.5
                    text-xs
                    font-bold
                    text-sky-700

                    dark:border-sky-500/20
                    dark:bg-sky-500/10
                    dark:text-sky-300
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
                    text-slate-950
                    sm:text-4xl
                    xl:text-5xl
                    2xl:text-[52px]
                    leading-[1.05]

                    dark:text-white
                  "
                >
                  Let&apos;s continue your
                  <br />

                  <span
                    className="
                      bg-gradient-to-r
                      from-sky-500
                      via-blue-500
                      to-violet-600
                      bg-clip-text
                      text-transparent

                      dark:from-sky-400
                      dark:via-blue-400
                      dark:to-violet-400
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
                    text-slate-600
                    sm:text-base

                    dark:text-slate-400
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

                    dark:text-slate-500
                  "
                >
                  Welcome,{' '}

                  <span
                    className="
                      font-bold
                      text-slate-700

                      dark:text-slate-300
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
                        border-slate-300
                        bg-white/80
                        px-5
                        py-3
                        text-sm
                        font-bold
                        text-slate-800
                        shadow-sm
                        transition
                        hover:border-sky-400
                        hover:bg-sky-50
                        sm:w-auto

                        dark:border-slate-700
                        dark:bg-slate-950/60
                        dark:text-white
                        dark:hover:border-sky-500
                        dark:hover:bg-sky-500/10
                      "
                    >
                      Explore NAVTA TEST
                    </button>
                  </Link>
                </div>

              </div>

              {/* =================================================
                  RIGHT SNAPSHOT
              ================================================= */}

              <div
                className="
                  rounded-[24px]
                  border
                  border-slate-200
                  bg-white/82
                  p-4
                  shadow-[0_16px_50px_rgba(15,23,42,0.09)]
                  backdrop-blur-xl

                  dark:border-slate-800
                  dark:bg-slate-950/74
                  dark:shadow-2xl
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
                        text-sky-600

                        dark:text-sky-400
                      "
                    >
                      NAVTA Intelligence
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        font-bold
                        text-slate-900

                        dark:text-white
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
                      bg-violet-100

                      dark:bg-violet-500/10
                    "
                  >
                    <BrainCircuit
                      className="
                        h-5
                        w-5
                        text-violet-600

                        dark:text-violet-400
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
                    border-slate-200
                    bg-slate-50/85
                    p-4

                    dark:border-slate-800
                    dark:bg-slate-900/75
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
                          text-slate-500

                          dark:text-slate-400
                        "
                      >
                        Weekly Progress
                      </p>

                      <p
                        className="
                          mt-1
                          text-xl
                          font-black
                          text-sky-600

                          dark:text-sky-400
                        "
                      >
                        {levelProgress}%
                      </p>
                    </div>

                    <LineChart
                      className="
                        h-6
                        w-6
                        text-sky-500

                        dark:text-sky-400
                      "
                    />
                  </div>

                  <div
                    className="
                      mt-3
                      h-2
                      overflow-hidden
                      rounded-full
                      bg-slate-200

                      dark:bg-slate-800
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

                      dark:text-slate-500
                    "
                  >
                    {currentXP} /{' '}
                    {xpPerLevel} XP
                  </p>
                </div>

              </div>

            </div>
          </div>

          {/* =================================================
              UPCOMING
          ================================================= */}

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
                      hover:border-slate-200
                      hover:bg-slate-50/80

                      dark:hover:border-slate-800
                      dark:hover:bg-white/[0.02]
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
                        bg-violet-100

                        dark:bg-violet-500/10
                      "
                    >
                      <CalendarDays
                        className="
                          h-5
                          w-5
                          text-violet-600

                          dark:text-violet-400
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
                          text-slate-400

                          dark:text-slate-500
                        "
                      >
                        {item.time}
                      </p>

                      <p
                        className="
                          truncate
                          text-sm
                          font-bold
                          text-slate-900

                          dark:text-white
                        "
                      >
                        {item.title}
                      </p>

                      <p
                        className="
                          truncate
                          text-xs
                          text-slate-500

                          dark:text-slate-500
                        "
                      >
                        {item.subtitle}
                      </p>
                    </div>

                    <ChevronRight
                      className="
                        h-4
                        w-4
                        text-slate-400
                        transition
                        group-hover:text-sky-500

                        dark:text-slate-600
                        dark:group-hover:text-sky-400
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
            icon={
              recoveryActive
                ? ShieldCheck
                : Flame
            }
            value={currentStreak}
            label={
              recoveryActive
                ? "Streak Recovery"
                : "Day Streak"
            }
            subtext={streakSubtext}
            iconClass={
              recoveryActive
                ? "text-sky-500"
                : "text-orange-500"
            }
            iconBg={
              recoveryActive
                ? "bg-sky-100 dark:bg-sky-500/10"
                : "bg-orange-100 dark:bg-orange-500/10"
            }
          />

          <MetricCard
            icon={Coins}
            value={coinBalance}
            label="Coins Balance"
            subtext=">80%: +1 under 30 min • +2 from 30 min"
            iconClass="text-yellow-500"
            iconBg="bg-yellow-100 dark:bg-yellow-500/10"
          />

          {/* LEVEL */}

          <div
            className="
              rounded-[22px]
              border
              border-slate-200/80
              bg-white/88
              p-5
              shadow-[0_14px_40px_rgba(15,23,42,0.08)]
              backdrop-blur-xl

              dark:border-slate-800
              dark:bg-[#081326]/92
              dark:shadow-xl
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
                  bg-violet-100

                  dark:bg-violet-500/10
                "
              >
                <Award
                  className="
                    h-5
                    w-5
                    text-violet-600

                    dark:text-violet-400
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
                    text-slate-950

                    dark:text-white
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
                    text-slate-400

                    dark:text-slate-500
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
                    bg-slate-200

                    dark:bg-slate-800
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
                    text-sky-600

                    dark:text-sky-400
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
            iconClass="text-emerald-500"
            iconBg="bg-emerald-100 dark:bg-emerald-500/10"
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
            subtitle="Daily average of your NAVTA TEST scores"
          >
            <div
              className="
                mt-5
                h-[320px]
                w-full
              "
            >
              {chartData.length > 0 ? (
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
                    bottom: 55
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
                    stroke="#cbd5e1"
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    height={70}
                    angle={-90}
                    textAnchor="end"
                    tickMargin={8}
                  />

                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[
                      0,
                      100
                    ]}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${value}%`,
                      'Daily Average'
                    ]}
                    labelFormatter={(_, payload) => {
                      const item =
                        payload?.[0]?.payload;

                      if (!item) {
                        return '';
                      }

                      return `${item.fullDate || item.date} • ${item.testCount || 0} test${Number(item.testCount) === 1 ? '' : 's'}`;
                    }}
                    contentStyle={{
                      background:
                        '#ffffff',
                      border:
                        '1px solid #e2e8f0',
                      borderRadius:
                        '12px',
                      color:
                        '#0f172a',
                      boxShadow:
                        '0 10px 30px rgba(15,23,42,0.10)'
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    fill="url(#navtaScoreGradient)"
                    dot={{
                      r: 4,
                      fill: '#0ea5e9',
                      strokeWidth: 2
                    }}
                    activeDot={{
                      r: 6
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              ) : (
                <div
                  className="
                    flex
                    h-full
                    flex-col
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-200
                    bg-slate-50/60
                    px-6
                    text-center

                    dark:border-slate-800
                    dark:bg-slate-950/30
                  "
                >
                  <BarChart3
                    className="
                      h-9
                      w-9
                      text-slate-300

                      dark:text-slate-700
                    "
                  />

                  <p
                    className="
                      mt-3
                      text-sm
                      font-black
                      text-slate-700

                      dark:text-slate-300
                    "
                  >
                    No NAVTA TEST performance yet
                  </p>

                  <p
                    className="
                      mt-1
                      max-w-sm
                      text-[10px]
                      leading-5
                      text-slate-500
                    "
                  >
                    Complete a NAVTA TEST and your daily average
                    will automatically appear here.
                  </p>

                  <Link
                    to="/navta-test"
                    className="
                      mt-4
                      inline-flex
                      items-center
                      gap-1
                      text-xs
                      font-black
                      text-sky-600
                      hover:underline

                      dark:text-sky-400
                    "
                  >
                    Take NAVTA TEST
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </DashboardPanel>

          {/* DAILY GOALS */}

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
                      border-slate-200
                      bg-slate-50/75
                      p-3

                      dark:border-slate-800/70
                      dark:bg-slate-950/35
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
                            ? 'bg-emerald-100 dark:bg-emerald-500/10'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }
                      `}
                    >
                      {goal.done ? (
                        <CheckCircle2
                          className="
                            h-5
                            w-5
                            text-emerald-500

                            dark:text-emerald-400
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
                              ? 'text-slate-400 line-through dark:text-slate-500'
                              : 'text-slate-700 dark:text-slate-200'
                          }
                        `}
                      >
                        {goal.title}
                      </p>

                      <p
                        className="
                          mt-1
                          text-[9px]
                          text-sky-600

                          dark:text-sky-400
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

          {/* MISTAKE NOTEBOOK */}

          <DashboardPanel
            title="Mistake Notebook"
            subtitle="Turn wrong answers into strengths"
          >
            <div
              className="
                mt-4
                space-y-4
              "
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-rose-200
                  bg-gradient-to-br
                  from-rose-50
                  via-white
                  to-orange-50
                  p-4

                  dark:border-rose-500/20
                  dark:from-rose-500/10
                  dark:via-slate-950/40
                  dark:to-orange-500/10
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
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-rose-100

                      dark:bg-rose-500/10
                    "
                  >
                    <BookOpen
                      className="
                        h-5
                        w-5
                        text-rose-600

                        dark:text-rose-400
                      "
                    />
                  </div>

                  <span
                    className="
                      rounded-full
                      border
                      border-rose-200
                      bg-white/80
                      px-2.5
                      py-1
                      text-[9px]
                      font-black
                      uppercase
                      tracking-wider
                      text-rose-600

                      dark:border-rose-500/20
                      dark:bg-slate-950/50
                      dark:text-rose-300
                    "
                  >
                    Personal Revision
                  </span>
                </div>

                <p
                  className="
                    mt-4
                    text-3xl
                    font-black
                    text-slate-950

                    dark:text-white
                  "
                >
                  {mistakeStats.totalMistakes}
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    font-semibold
                    text-slate-500

                    dark:text-slate-400
                  "
                >
                  Saved mistakes
                </p>

                <div
                  className="
                    mt-4
                    grid
                    grid-cols-2
                    gap-2
                  "
                >
                  <div
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-white/80
                      p-3

                      dark:border-slate-800
                      dark:bg-slate-950/40
                    "
                  >
                    <p
                      className="
                        text-lg
                        font-black
                        text-amber-600

                        dark:text-amber-400
                      "
                    >
                      {mistakeStats.needRevision}
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                      "
                    >
                      Need Revision
                    </p>
                  </div>

                  <div
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-white/80
                      p-3

                      dark:border-slate-800
                      dark:bg-slate-950/40
                    "
                  >
                    <p
                      className="
                        text-lg
                        font-black
                        text-emerald-600

                        dark:text-emerald-400
                      "
                    >
                      {mistakeStats.mastered}
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                      "
                    >
                      Mastered
                    </p>
                  </div>
                </div>

                {mistakeStats.totalMistakes > 0 ? (
                  <div className="mt-4">
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                      "
                    >
                      <p
                        className="
                          text-[10px]
                          font-bold
                          text-slate-500

                          dark:text-slate-400
                        "
                      >
                        Mastery progress
                      </p>

                      <p
                        className="
                          text-[10px]
                          font-black
                          text-emerald-600

                          dark:text-emerald-400
                        "
                      >
                        {mistakeStats.masteryPercentage}%
                      </p>
                    </div>

                    <div
                      className="
                        mt-2
                        h-1.5
                        overflow-hidden
                        rounded-full
                        bg-slate-200

                        dark:bg-slate-800
                      "
                    >
                      <div
                        className="
                          h-full
                          rounded-full
                          bg-gradient-to-r
                          from-rose-500
                          via-amber-500
                          to-emerald-500
                        "
                        style={{
                          width:
                            `${Math.min(
                              100,
                              Math.max(
                                0,
                                mistakeStats
                                  .masteryPercentage
                              )
                            )}%`
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p
                    className="
                      mt-4
                      text-[10px]
                      leading-5
                      text-slate-500

                      dark:text-slate-400
                    "
                  >
                    No mistakes saved yet.
                    Incorrect NAVTA TEST
                    questions you choose to save
                    will appear here.
                  </p>
                )}
              </div>

              <Link
                to="/mistake-notebook"
                className="
                  group
                  flex
                  items-center
                  justify-between
                  gap-3
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50/80
                  px-4
                  py-3
                  text-xs
                  font-black
                  text-slate-700
                  transition
                  hover:border-rose-300
                  hover:bg-rose-50
                  hover:text-rose-600

                  dark:border-slate-800
                  dark:bg-slate-950/35
                  dark:text-slate-300
                  dark:hover:border-rose-500/30
                  dark:hover:bg-rose-500/5
                  dark:hover:text-rose-300
                "
              >
                Open Mistake Notebook

                <ArrowRight
                  className="
                    h-4
                    w-4
                    transition
                    group-hover:translate-x-1
                  "
                />
              </Link>
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
                color="text-sky-500"
                background="bg-sky-100 dark:bg-sky-500/10"
              />

              <QuickAction
                to="/navta-test"
                icon={Target}
                title="NAVTA TEST"
                desc="Timed smart tests"
                color="text-violet-500"
                background="bg-violet-100 dark:bg-violet-500/10"
              />

              <QuickAction
                to="/pyqs"
                icon={FileText}
                title="PYQ Papers"
                desc="Past-year papers"
                color="text-pink-500"
                background="bg-pink-100 dark:bg-pink-500/10"
              />

              <QuickAction
                to="/assessments"
                icon={ClipboardCheck}
                title="Assessments"
                desc="Practice quizzes"
                color="text-yellow-500"
                background="bg-yellow-100 dark:bg-yellow-500/10"
              />

              <QuickAction
                to="/analytics"
                icon={BarChart3}
                title="Analytics"
                desc="Track progress"
                color="text-cyan-500"
                background="bg-cyan-100 dark:bg-cyan-500/10"
              />
            </div>
          </DashboardPanel>

          {/* QUOTE */}

          <div
            className="
              relative
              overflow-hidden
              rounded-[24px]
              border
              border-violet-200
              bg-gradient-to-br
              from-violet-50
              via-white
              to-sky-50
              p-6
              shadow-[0_18px_55px_rgba(99,102,241,0.10)]

              dark:border-violet-500/20
              dark:from-[#0b1530]
              dark:via-[#111743]
              dark:to-[#170b3c]
              dark:shadow-xl
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
                bg-violet-300/20
                blur-[70px]

                dark:bg-violet-500/20
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
                  text-violet-300

                  dark:text-violet-500/40
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
                  text-slate-900

                  dark:text-white
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
                  text-violet-600

                  dark:text-violet-300
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
                      border-slate-200
                      bg-slate-50/75
                      p-4
                      sm:flex-row
                      sm:items-center
                      sm:justify-between

                      dark:border-slate-800
                      dark:bg-slate-950/35
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
                          bg-sky-100

                          dark:bg-sky-500/10
                        "
                      >
                        <GraduationCap
                          className="
                            h-5
                            w-5
                            text-sky-500

                            dark:text-sky-400
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
                            text-slate-900

                            dark:text-white
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
                              ? 'text-emerald-500'
                              : 'text-rose-500'
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
                            border-slate-300
                            bg-white
                            px-3
                            py-2
                            text-xs
                            font-bold
                            text-slate-700
                            transition
                            hover:border-sky-400
                            hover:text-sky-600

                            dark:border-slate-700
                            dark:bg-transparent
                            dark:text-slate-300
                            dark:hover:border-sky-500
                            dark:hover:text-white
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
                    text-slate-300

                    dark:text-slate-700
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
                    text-sky-600
                    hover:underline

                    dark:text-sky-400
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
        border-slate-200/80
        bg-white/88
        p-5
        shadow-[0_18px_55px_rgba(15,23,42,0.08)]
        backdrop-blur-xl
        sm:p-6

        dark:border-slate-800
        dark:bg-[#081326]/92
        dark:shadow-[0_20px_60px_rgba(0,0,0,0.20)]

        ${className}
      `}
    >
      <h2
        className="
          text-base
          font-black
          text-slate-950
          sm:text-lg

          dark:text-white
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

            dark:text-slate-500
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
        border-slate-200/80
        bg-white/88
        p-4
        shadow-[0_14px_40px_rgba(15,23,42,0.08)]
        backdrop-blur-xl
        sm:p-5

        dark:border-slate-800
        dark:bg-[#081326]/92
        dark:shadow-xl
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
              text-slate-950
              sm:text-2xl

              dark:text-white
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
              text-slate-400

              dark:text-slate-500
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1
              hidden
              text-[9px]
              text-slate-400
              sm:block

              dark:text-slate-600
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
          border-slate-200
          bg-slate-50/75
          p-4
          transition
          duration-200
          hover:-translate-y-1
          hover:border-sky-300
          hover:bg-sky-50

          dark:border-slate-800
          dark:bg-slate-950/35
          dark:hover:border-sky-500/40
          dark:hover:bg-sky-500/[0.04]
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
            text-slate-900

            dark:text-white
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
            text-slate-400
            transition
            group-hover:translate-x-1
            group-hover:text-sky-500

            dark:text-slate-600
            dark:group-hover:text-sky-400
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
            text-slate-700

            dark:text-slate-300
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
          bg-slate-200

          dark:bg-slate-800
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
        border-slate-200
        bg-slate-50/85
        p-3

        dark:border-slate-800
        dark:bg-slate-900/75
      "
    >
      <Icon
        className="
          h-4
          w-4
          text-sky-500

          dark:text-sky-400
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
          mt-0.5
          text-[9px]
          uppercase
          tracking-wider
          text-slate-400

          dark:text-slate-500
        "
      >
        {label}
      </p>
    </div>
  );
}
