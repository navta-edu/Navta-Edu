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
  BookOpen,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  FileText,
  Calendar
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function StudentDashboard() {
  const { user, profile, streak } = useAuth();
  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resList = await studentAPI.getResults();
        setResults(resList.data || []);
        
        const anal = await studentAPI.getAnalytics();
        setAnalytics(anal);
      } catch (err) {
        console.error('Failed to load student data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalXP = profile?.xp || 0;
  const currentXPInLevel = totalXP % 500;
  const xpNeededForNextLevel = 500;
  const level = profile?.level || 1;

  // Mock checklist items for study goals
  const dailyGoals = [
    { text: 'Read one chapter summary note', done: true },
    { text: 'Score 70% or more on a Chapter Quiz', done: false },
    { text: 'Keep up login streak milestones', done: true }
  ];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  // Chart data formatting
  const chartData = analytics?.progression?.length > 0
    ? analytics.progression
    : [
        { date: 'Mon', score: 40 },
        { date: 'Tue', score: 65 },
        { date: 'Wed', score: 50 },
        { date: 'Thu', score: 75 },
        { date: 'Fri', score: 80 }
      ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800/40 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-primary-500/10 blur-[80px] dark:bg-primary-500/5" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Stream: <span className="font-bold text-slate-700 dark:text-slate-200">{profile?.stream || 'Science'}</span>. Let's finish your daily quizzes to earn rewards today.
            </p>
          </div>
          <Link to="/assessments">
            <Button icon={ArrowRight}>Resume Study Quizzes</Button>
          </Link>
        </div>
      </div>

      {/* Gamified Stat Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Streak */}
        <Card className="flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
            <Flame className="w-6 h-6 fill-amber-500 animate-bounce" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{streak?.currentStreak || 1}</p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Streak</p>
          </div>
        </Card>

        {/* Coins */}
        <Card className="flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{profile?.coins ?? 0}</p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Coins Balance</p>
          </div>
        </Card>

        {/* Levels */}
        <Card className="flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
            <Award className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black text-slate-900 dark:text-white">Level {level}</p>
            <ProgressBar value={currentXPInLevel} max={xpNeededForNextLevel} color="bg-indigo-500" className="mt-1" />
            <p className="text-[10px] text-slate-400 mt-1 truncate">{currentXPInLevel} / {xpNeededForNextLevel} XP to Level {level + 1}</p>
          </div>
        </Card>

        {/* Avg Performance */}
        <Card className="flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {results.length > 0
                ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length)
                : 0}%
            </p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Average Score</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Charts & Daily Goals */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <Card className="lg:col-span-2" title="Score History Progression" subtitle="Visualizing your exam percentages over time">
          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" className="hidden dark:block" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Daily Goals */}
        <Card title="Daily Study Goals" subtitle="Consistent actions yield higher badges">
          <div className="space-y-4 mt-4">
            {dailyGoals.map((g, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
                {g.done ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Calendar className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${g.done ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{g.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{g.done ? 'Earned +10 XP' : 'Incomplete'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Recent Test Submissions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Recent Quiz Attempts" subtitle="Check score details and solutions">
          <div className="mt-4 space-y-3">
            {results.slice(0, 3).map((r) => (
              <div key={r._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${r.isPassed ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' : 'bg-red-50 dark:bg-red-950/20 text-red-500'}`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[200px] md:max-w-[300px]">
                      {r.test?.title || 'Laws of Motion Quiz'}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{r.test?.type || 'Quiz'} • Scorecard</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm font-extrabold ${r.isPassed ? 'text-emerald-500' : 'text-rose-500'}`}>{r.percentage}%</p>
                    <p className="text-[9px] text-slate-400">{r.correctAnswers}/{r.totalQuestions} Correct</p>
                  </div>
                  <Link to={`/results/${r._id}`}>
                    <Button variant="secondary" className="px-3 py-1.5 text-xs">Review</Button>
                  </Link>
                </div>
              </div>
            ))}

            {results.length === 0 && (
              <div className="text-center py-8">
                <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No assessments taken yet.</p>
                <Link to="/assessments" className="text-xs text-primary-500 font-bold mt-1 inline-block hover:underline">
                  Take a practice quiz now
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Badges card showcase */}
        <Card title="Achievement Badges" subtitle="Show off your learning accomplishments">
          <div className="grid grid-cols-3 gap-4 mt-4">
            {profile?.badges?.map((badge, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40" title={`Earned on ${new Date(badge.earnedAt).toLocaleDateString()}`}>
                <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-500 mb-2">
                  <Award className="w-5 h-5 fill-primary-400" />
                </div>
                <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 line-clamp-1 truncate w-full">{badge.name}</p>
              </div>
            ))}

            {(!profile?.badges || profile.badges.length === 0) && (
              <div className="col-span-3 text-center py-6">
                <p className="text-xs text-slate-400">Lock-in streaks to win your first badge!</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
