import React from 'react';
import Card from '../components/Card';
import { ShieldCheck, Target, Heart, GraduationCap } from 'lucide-react';

export default function About() {
  const values = [
    { icon: Target, title: 'Focused Learning', desc: 'Break down subjects into digestible chapters, helping students focus and retain concepts systematically.', color: 'text-blue-500' },
    { icon: GraduationCap, title: 'Gamified Motivation', desc: 'We believe learning is most effective when engaging. Daily streaks and reward coins keep students consistently studying.', color: 'text-amber-500' },
    { icon: ShieldCheck, title: 'Quality Resources', desc: 'All materials, notes, and assessments are designed and reviewed by verified academic educators.', color: 'text-emerald-500' },
    { icon: Heart, title: 'Accessibility First', desc: 'Built responsively to ensure students can access learning material anywhere: mobile, tablet, or desktop.', color: 'text-rose-500' }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-grid-pattern relative">
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary-400/5 blur-[100px]" />
      
      {/* Title block */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-5xl">
          Empowering Education Through{' '}
          <span className="bg-gradient-to-r from-primary-500 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Technology
          </span>
        </h1>
        <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
          Navta is a modern full-stack virtual library and assessment portal designed to bridge the gap between structured curriculum and active student engagement.
        </p>
      </div>

      {/* Grid of Values */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
        {values.map((v, index) => {
          const Icon = v.icon;
          return (
            <Card key={index} className="text-center flex flex-col items-center">
              <Icon className={`w-8 h-8 ${v.color} mb-4`} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{v.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{v.desc}</p>
            </Card>
          );
        })}
      </div>

      {/* Narrative Section */}
      <div className="glass rounded-3xl p-8 md:p-12 border border-slate-100 dark:border-slate-800/40 relative overflow-hidden shadow-sm">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">How Navta Works</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
              For **Students**, Navta offers structured study sheets, past year exams (PYQ) libraries, and chapter quiz sessions. Every action yields XP and coins, which unlock virtual achievements and store vouchers. Analytics provide a summary showing strong topics and chapters that need focus.
            </p>
            <p className="text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
              For **Teachers**, Navta serves as a digital classroom manager. Educators upload lecture notes, create multiple-choice questions, and assemble full tests. The dashboard gives access to classroom statistics, including student streaks, averages, and grading scales.
            </p>
          </div>
          <div className="bg-primary-500/10 dark:bg-primary-950/20 rounded-2xl p-6 border border-primary-500/20 dark:border-primary-800/30">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Core Capabilities</h3>
            <ul className="space-y-3">
              {[
                'Stateful profile authentication (JWT-based)',
                'Personalized analytics dashboards for teachers & students',
                'Chapter-wise testing suite with instant correction guides',
                'Streaks indicators and leaderboard triggers',
                'Custom administrative user profile audits'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
