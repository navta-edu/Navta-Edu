import React, { useEffect, useState } from 'react';
import { studentAPI } from '../utils/api';
import Card from '../components/Card';
import { BarChart3, TrendingUp, AlertCircle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getAnalytics().then((res) => {
      setStats(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const subjectData = stats?.subjectStats?.length > 0
    ? stats.subjectStats
    : [
        { subject: 'Physics', avgPercentage: 70, strength: 'Average' },
        { subject: 'Chemistry', avgPercentage: 45, strength: 'Needs Focus' },
        { subject: 'Mathematics', avgPercentage: 85, strength: 'Strong' }
      ];

  const suggestionsList = stats?.summary?.suggestions?.length > 0
    ? stats.summary.suggestions
    : [
        'Attempt additional quizzes in Chemistry to reinforce atomic structure core topics.',
        'Take timed mock assessments for Mathematics to improve response speeds.'
      ];

  // Colors for strength segments
  const COLORS = {
    Strong: '#10b981', // emerald
    Average: '#3b82f6', // blue
    'Needs Focus': '#f43f5e' // rose
  };

  return (
    <div className="space-y-6">
      {/* Title Details */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary-500" />
          Performance Analytics
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Deep-dive analysis of your strength, accuracy, and study gaps.
        </p>
      </div>

      {/* Analytics Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Bar Chart */}
        <Card className="lg:col-span-2" title="Subject Accuracy Comparison" subtitle="Average percentages attained across quiz submissions">
          <div className="h-72 mt-6 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" className="hidden dark:block" />
                <XAxis dataKey="subject" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="avgPercentage" radius={[10, 10, 0, 0]} barSize={40}>
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.strength] || '#0ea5e9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Actionable tips / suggestions */}
        <Card title="Tailored Recommendations" subtitle="Study guidance compiled from your quiz outcomes">
          <div className="space-y-4 mt-4">
            {suggestionsList.map((tip, idx) => (
              <div key={idx} className="flex gap-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/30">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Subject Statistics Detailed breakdown table */}
      <Card title="Detailed Subject Breakdown" subtitle="Accuracy rating and weakness definitions per curriculum topic">
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                <th className="pb-3">Subject</th>
                <th className="pb-3">Assessments</th>
                <th className="pb-3">Avg Score</th>
                <th className="pb-3">Strength Rating</th>
                <th className="pb-3 text-right">Outcomes Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
              {subjectData.map((sub, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white">{sub.subject}</td>
                  <td className="py-3.5">{sub.testCount || 1} Completed</td>
                  <td className="py-3.5 font-extrabold text-primary-500">{sub.avgPercentage}%</td>
                  <td className="py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      sub.strength === 'Strong'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : sub.strength === 'Average'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {sub.strength}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-semibold">
                    {sub.strength === 'Strong' ? (
                      <span className="flex items-center gap-1 justify-end text-emerald-500 text-xs">
                        <CheckCircle2 className="w-4 h-4" /> Mastery
                      </span>
                    ) : sub.strength === 'Average' ? (
                      <span className="flex items-center gap-1 justify-end text-blue-500 text-xs">
                        <TrendingUp className="w-4 h-4" /> Good Progress
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 justify-end text-rose-500 text-xs">
                        <AlertCircle className="w-4 h-4 animate-pulse" /> Focus Needed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
