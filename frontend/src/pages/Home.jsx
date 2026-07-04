import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Zap, Flame, Trophy, BarChart3, BookOpen, Users } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  const features = [
    { icon: BookOpen, title: 'Chapter-wise Notes', desc: 'Comprehensive study materials prepared by subject-expert teachers.', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { icon: Zap, title: 'Assessments & PYQs', desc: 'Attempt topic-wise quizzes and browse past years board and entrance exam papers.', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { icon: BarChart3, title: 'Performance Analytics', desc: 'Detailed tracking of your subject-wise strong and weak areas with target summaries.', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { icon: Flame, title: 'Study Streaks', desc: 'Earn reward coins by keeping up daily learning goals and streaks.', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' },
    { icon: Trophy, title: 'Earn Rewards', desc: 'Redeem coins earned from quizzes for badges, premium files, and merch.', color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' },
    { icon: Users, title: 'Class Monitoring', desc: 'Teachers track class averages, grade distributions, and generate reports.', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' }
  ];

  return (
    <div className="relative overflow-hidden bg-grid-pattern pb-16">
      {/* Background radial highlights */}
      <div className="absolute top-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-primary-400/10 blur-[120px] dark:bg-primary-500/5 pulse-glow" />
      <div className="absolute top-1/3 right-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-indigo-400/10 blur-[130px] dark:bg-indigo-500/5 pulse-glow" />

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200/40 dark:border-primary-800/40 mb-6">
          <GraduationCap className="w-4.5 h-4.5" />
          The Smart Learning Companion
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          Accelerate Your Academic Journey with{' '}
          <span className="bg-gradient-to-r from-primary-500 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Navta
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
          A gamified, interactive portal where students study notes, solve PYQs, track strengths and weaknesses, and redeem premium milestones. Built for educators and learners.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          {user ? (
            <Link to={user.role === 'student' ? '/dashboard' : user.role === 'teacher' ? '/teacher' : '/admin'}>
              <Button icon={ArrowRight}>Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/signup">
                <Button icon={ArrowRight}>Get Started Free</Button>
              </Link>
              <Link to="/about">
                <Button variant="secondary">Learn More</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="mx-auto max-w-7xl px-4 mt-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '15,000+', label: 'Active Learners' },
            { value: '250+', label: 'Subject Courses' },
            { value: '98%', label: 'Pass Rate' },
            { value: '500,000+', label: 'Quizzes Solved' }
          ].map((stat, idx) => (
            <div key={idx} className="glass rounded-3xl p-6 text-center border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <p className="text-3xl font-extrabold text-primary-500 dark:text-primary-400">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-7xl px-4 mt-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Everything you need to succeed</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3">Navta combines structured study materials with engaging gamification triggers to lock-in learning success.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <Card key={idx} className="hover:-translate-y-1 transition-all duration-200">
                <div className={`p-3 rounded-2xl w-fit ${f.color} mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{f.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Teacher CTA Section */}
      <div className="mx-auto max-w-7xl px-4 mt-24 sm:px-6 lg:px-8">
        <div className="glass rounded-3xl p-8 md:p-12 border border-slate-100 dark:border-slate-800/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="absolute top-0 right-0 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[80px] dark:bg-indigo-500/5" />
          
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Are you an Educator?</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
              Create a teacher account to upload your notes, construct chapter-wise quizzes, track scores, review class completion metrics, and customize gamified rewards.
            </p>
          </div>
          
          <Link to="/signup" state={{ role: 'teacher' }}>
            <Button variant="secondary" className="px-8 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700">
              Join as a Teacher
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
