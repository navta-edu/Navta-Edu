import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../utils/api';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

import {
  Flame,
  Coins,
  Award,
  Zap,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Calendar,
  BookOpen
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

export default function StudentDashboard() {
  const { user, profile, streak } = useAuth();

  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | FETCH STUDENT DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resList = await studentAPI.getResults();
        setResults(resList?.data || []);

        const anal = await studentAPI.getAnalytics();

        /*
         * Some APIs return:
         *   response.data
         *
         * Some return:
         *   response
         *
         * Support both.
         */

        setAnalytics(anal?.data || anal || null);
      } catch (err) {
        console.error('Failed to load student data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | XP / LEVEL
  |--------------------------------------------------------------------------
  */

  const totalXP = Number(profile?.xp || 0);

  const currentXPInLevel = totalXP % 500;

  const xpNeededForNextLevel = 500;

  const level = Number(profile?.level || 1);

  /*
  |--------------------------------------------------------------------------
  | AVERAGE SCORE
  |--------------------------------------------------------------------------
  */

  const averageScore =
    results.length > 0
      ? Math.round(
          results.reduce(
            (acc, curr) => acc + Number(curr?.percentage || 0),
            0
          ) / results.length
        )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | DAILY GOALS
  |--------------------------------------------------------------------------
  */

  const dailyGoals = [
    {
      text: 'Read one chapter summary note',
      done: true
    },
    {
      text: 'Score 70% or more on a Chapter Quiz',
      done: false
    },
    {
      text: 'Keep up login streak milestones',
      done: true
    }
  ];

  /*
  |--------------------------------------------------------------------------
  | CHART DATA
  |--------------------------------------------------------------------------
  */

  const progression = Array.isArray(analytics?.progression)
    ? analytics.progression
    : [];

  const chartData =
    progression.length > 0
      ? progression
      : [
          { date: 'Mon', score: 40 },
          { date: 'Tue', score: 65 },
          { date: 'Wed', score: 50 },
          { date: 'Thu', score: 75 },
          { date: 'Fri', score: 80 }
        ];

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN DASHBOARD
  |--------------------------------------------------------------------------
  */

  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <div className="w-full max-w-[1600px] mx-auto space-y-5 sm:space-y-6">

        {/* ================================================================
            WELCOME BANNER
        ================================================================= */}

        <section className="relative overflow-hidden glass rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800/40 shadow-sm">

          {/* Background decoration */}

          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-primary-500/10 blur-[70px] dark:bg-primary-500/5" />

          <div className="relative p-4 sm:p-6 lg:p-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-8">

              {/* Welcome text */}

              <div className="min-w-0 flex-1">

                <div className="flex items-center gap-2 mb-2">

                  <div className="p-2 rounded-xl bg-primary-500/10 shrink-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-primary-500">
                    Student Dashboard
                  </span>

                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
                  Welcome back, {user?.name || 'Student'}!
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-2xl">
                  Stream:{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {profile?.stream || 'Science'}
                  </span>
                  . Let's finish your daily quizzes to earn rewards today.
                </p>

              </div>

              {/* CTA */}

              <div className="w-full lg:w-auto shrink-0">

                <Link
                  to="/assessments"
                  className="block w-full lg:w-auto"
                >
                  <Button
                    icon={ArrowRight}
                    className="w-full lg:w-auto justify-center"
                  >
                    Resume Study Quizzes
                  </Button>
                </Link>

              </div>

            </div>

          </div>

        </section>


        {/* ================================================================
            STAT CARDS
        ================================================================= */}

        <section className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">

          {/* --------------------------------------------------------------
              STREAK
          -------------------------------------------------------------- */}

          <Card className="min-w-0 h-full">
            <div className="flex items-center gap-3 sm:gap-4">

              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 shrink-0">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-500 animate-bounce" />
              </div>

              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {streak?.currentStreak || 1}
                </p>

                <p className="text-[9px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">
                  Active Streak
                </p>
              </div>

            </div>
          </Card>


          {/* --------------------------------------------------------------
              COINS
          -------------------------------------------------------------- */}

          <Card className="min-w-0 h-full">
            <div className="flex items-center gap-3 sm:gap-4">

              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500 shrink-0">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {profile?.coins ?? 0}
                </p>

                <p className="text-[9px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">
                  Coins Balance
                </p>
              </div>

            </div>
          </Card>


          {/* --------------------------------------------------------------
              LEVEL
          -------------------------------------------------------------- */}

          <Card className="min-w-0 h-full">
            <div className="flex items-center gap-3 sm:gap-4">

              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 shrink-0">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="flex-1 min-w-0">

                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Level {level}
                </p>

                <ProgressBar
                  value={currentXPInLevel}
                  max={xpNeededForNextLevel}
                  color="bg-indigo-500"
                  className="mt-1.5"
                />

                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 truncate">
                  {currentXPInLevel} / {xpNeededForNextLevel} XP
                </p>

              </div>

            </div>
          </Card>


          {/* --------------------------------------------------------------
              AVERAGE PERFORMANCE
          -------------------------------------------------------------- */}

          <Card className="min-w-0 h-full">
            <div className="flex items-center gap-3 sm:gap-4">

              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="min-w-0">

                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {averageScore}%
                </p>

                <p className="text-[9px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">
                  Average Score
                </p>

              </div>

            </div>
          </Card>

        </section>


        {/* ================================================================
            CHART + DAILY GOALS
        ================================================================= */}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">

          {/* --------------------------------------------------------------
              SCORE CHART
          -------------------------------------------------------------- */}

          <Card
            className="lg:col-span-2 min-w-0 overflow-hidden"
            title="Score History Progression"
            subtitle="Visualizing your exam percentages over time"
          >

            <div className="mt-4 w-full min-w-0">

              {/* Chart wrapper has explicit responsive heights */}

              <div className="h-[220px] sm:h-[260px] lg:h-[300px] w-full min-w-0">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                >

                  <AreaChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 8,
                      left: -22,
                      bottom: 0
                    }}
                  >

                    <defs>

                      <linearGradient
                        id="colorScore"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >

                        <stop
                          offset="5%"
                          stopColor="#0ea5e9"
                          stopOpacity={0.2}
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
                      stroke="#E2E8F0"
                      className="dark:hidden"
                    />

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#334155"
                      className="hidden dark:block"
                    />


                    <XAxis
                      dataKey="date"
                      stroke="#94A3B8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={15}
                    />

                    <YAxis
                      stroke="#94A3B8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      width={32}
                    />


                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />


                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                    />

                  </AreaChart>

                </ResponsiveContainer>

              </div>

            </div>

          </Card>


          {/* --------------------------------------------------------------
              DAILY GOALS
          -------------------------------------------------------------- */}

          <Card
            className="min-w-0"
            title="Daily Study Goals"
            subtitle="Consistent actions yield higher badges"
          >

            <div className="space-y-3 sm:space-y-4 mt-4">

              {dailyGoals.map((goal, idx) => (

                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl sm:rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40"
                >

                  {goal.done ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Calendar className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                  )}

                  <div className="min-w-0">

                    <p
                      className={`text-xs sm:text-sm font-semibold leading-relaxed ${
                        goal.done
                          ? 'text-slate-400 dark:text-slate-500 line-through'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {goal.text}
                    </p>

                    <p className="text-[10px] text-slate-400 mt-1">
                      {goal.done ? 'Earned +10 XP' : 'Incomplete'}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </Card>

        </section>


        {/* ================================================================
            RECENT QUIZ + BADGES
        ================================================================= */}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">

          {/* --------------------------------------------------------------
              RECENT QUIZ ATTEMPTS
          -------------------------------------------------------------- */}

          <Card
            className="lg:col-span-2 min-w-0 overflow-hidden"
            title="Recent Quiz Attempts"
            subtitle="Check score details and solutions"
          >

            <div className="mt-4 space-y-3">

              {results.slice(0, 3).map((result) => (

                <div
                  key={result._id}
                  className="rounded-xl sm:rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40 p-3 sm:p-4"
                >

                  {/* Mobile and desktop layout */}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    {/* Quiz information */}

                    <div className="flex items-center gap-3 min-w-0">

                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          result.isPassed
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'
                            : 'bg-red-50 dark:bg-red-950/20 text-red-500'
                        }`}
                      >

                        <CheckCircle className="w-5 h-5" />

                      </div>


                      <div className="min-w-0">

                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                          {result.test?.title || 'Laws of Motion Quiz'}
                        </h4>

                        <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                          {result.test?.type || 'Quiz'} • Scorecard
                        </p>

                      </div>

                    </div>


                    {/* Score + review */}

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">

                      <div className="text-left sm:text-right">

                        <p
                          className={`text-sm font-extrabold ${
                            result.isPassed
                              ? 'text-emerald-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {result.percentage}%
                        </p>

                        <p className="text-[9px] text-slate-400">
                          {result.correctAnswers}/{result.totalQuestions} Correct
                        </p>

                      </div>


                      <Link
                        to={`/results/${result._id}`}
                        className="shrink-0"
                      >
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5 text-xs whitespace-nowrap"
                        >
                          Review
                        </Button>
                      </Link>

                    </div>

                  </div>

                </div>

              ))}


              {/* No results */}

              {results.length === 0 && (

                <div className="text-center py-8 sm:py-10 px-4">

                  <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No assessments taken yet.
                  </p>

                  <Link
                    to="/assessments"
                    className="text-xs text-primary-500 font-bold mt-2 inline-block hover:underline"
                  >
                    Take a practice quiz now
                  </Link>

                </div>

              )}

            </div>

          </Card>


          {/* --------------------------------------------------------------
              BADGES
          -------------------------------------------------------------- */}

          <Card
            className="min-w-0"
            title="Achievement Badges"
            subtitle="Show off your learning accomplishments"
          >

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 mt-4">

              {profile?.badges?.map((badge, idx) => (

                <div
                  key={idx}
                  className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40 min-w-0"
                  title={
                    badge.earnedAt
                      ? `Earned on ${new Date(
                          badge.earnedAt
                        ).toLocaleDateString()}`
                      : badge.name
                  }
                >

                  <div className="p-2.5 sm:p-3 rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-500 mb-2">

                    <Award className="w-4 h-4 sm:w-5 sm:h-5 fill-primary-400" />

                  </div>

                  <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-700 dark:text-slate-300 line-clamp-2 break-words w-full">
                    {badge.name}
                  </p>

                </div>

              ))}


              {(!profile?.badges || profile.badges.length === 0) && (

                <div className="col-span-full text-center py-6 px-3">

                  <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-3">

                    <Award className="w-6 h-6 text-primary-500" />

                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Lock-in streaks to win your first badge!
                  </p>

                </div>

              )}

            </div>

          </Card>

        </section>


        {/* ================================================================
            QUICK ACTIONS
        ================================================================= */}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

          <Link
            to="/assessments"
            className="group"
          >

            <div className="h-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-primary-500 hover:bg-primary-500/5 transition-all">

              <div className="flex items-center justify-between gap-3">

                <div className="min-w-0">

                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Practice Tests
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Test your preparation
                  </p>

                </div>

                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0" />

              </div>

            </div>

          </Link>


          <Link
            to="/notes"
            className="group"
          >

            <div className="h-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-primary-500 hover:bg-primary-500/5 transition-all">

              <div className="flex items-center justify-between gap-3">

                <div className="min-w-0">

                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Study Notes
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Revise your chapters
                  </p>

                </div>

                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0" />

              </div>

            </div>

          </Link>


          <Link
            to="/results"
            className="group sm:col-span-2 lg:col-span-1"
          >

            <div className="h-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-primary-500 hover:bg-primary-500/5 transition-all">

              <div className="flex items-center justify-between gap-3">

                <div className="min-w-0">

                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    My Results
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    View your performance
                  </p>

                </div>

                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0" />

              </div>

            </div>

          </Link>

        </section>

      </div>
    </div>
  );
}
