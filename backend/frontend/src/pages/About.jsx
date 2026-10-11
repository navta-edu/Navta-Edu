
import React from 'react';
import Card from '../components/Card';
import {
  ShieldCheck,
  Target,
  Heart,
  GraduationCap,
  Code2,
  Users,
  ExternalLink,
} from 'lucide-react';

const teamMembers = [
  {
    name: 'Hardik Sahu',
    role: 'Developer',
    description:
      'Responsible for developing and building the Navta platform, creating a modern and accessible learning experience.',
    linkedin: 'https://www.linkedin.com/in/hardik-sahu-9797h1608p/',
    icon: Code2,
    initials: 'HS',
  },
  {
    name: 'Harshit Vashisht',
    role: 'Head of Management',
    description:
      'Responsible for management, coordination, and helping drive the vision and growth of Navta.',
    linkedin: 'https://www.linkedin.com/in/harshit-vashisht-rjvns/',
    icon: Users,
    initials: 'HV',
  },
];

export default function About() {
  const values = [
    {
      icon: Target,
      title: 'Focused Learning',
      desc: 'Break down subjects into digestible chapters, helping students focus and retain concepts systematically.',
      color: 'text-blue-500',
    },
    {
      icon: GraduationCap,
      title: 'Gamified Motivation',
      desc: 'We believe learning is most effective when engaging. Daily streaks and reward coins keep students consistently studying.',
      color: 'text-amber-500',
    },
    {
      icon: ShieldCheck,
      title: 'Quality Resources',
      desc: 'All materials, notes, and assessments are designed and reviewed by verified academic educators.',
      color: 'text-emerald-500',
    },
    {
      icon: Heart,
      title: 'Accessibility First',
      desc: 'Built responsively to ensure students can access learning material anywhere: mobile, tablet, or desktop.',
      color: 'text-rose-500',
    },
  ];

  const capabilities = [
    'Stateful profile authentication (JWT-based)',
    'Personalized analytics dashboards for teachers and students',
    'Chapter-wise testing with instant correction guides',
    'Streak indicators and leaderboard features',
    'Administrative user profile management',
  ];

  return (
    <main className="relative mx-auto max-w-7xl bg-grid-pattern px-4 py-16 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/4 top-0 -z-10 h-96 w-96 rounded-full bg-primary-400/5 blur-[100px]"
      />

      {/* About introduction */}
      <section className="mx-auto mb-16 max-w-3xl text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-primary-500">
          About Navta
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Empowering Education Through{' '}
          <span className="bg-gradient-to-r from-primary-500 to-indigo-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-indigo-400">
            Technology
          </span>
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-slate-500 dark:text-slate-400">
          Navta is a modern full-stack virtual library and assessment portal
          designed to bridge the gap between structured curriculum and active
          student engagement.
        </p>
      </section>

      {/* Core values */}
      <section
        aria-label="Navta core values"
        className="mb-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4"
      >
        {values.map((value) => {
          const Icon = value.icon;

          return (
            <Card
              key={value.title}
              className="flex flex-col items-center text-center"
            >
              <Icon className={`mb-4 h-8 w-8 ${value.color}`} />

              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {value.title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {value.desc}
              </p>
            </Card>
          );
        })}
      </section>

      {/* How Navta works */}
      <section className="glass relative mb-20 overflow-hidden rounded-3xl border border-slate-100 p-8 shadow-sm dark:border-slate-800/40 md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
              How Navta Works
            </h2>

            <p className="mt-4 leading-relaxed text-slate-500 dark:text-slate-400">
              For <strong>Students</strong>, Navta offers structured study
              sheets, past year question (PYQ) libraries, and chapter quiz
              sessions. Every action can earn XP and coins, unlocking virtual
              achievements and rewards. Analytics help students identify
              strengths and chapters that need more attention.
            </p>

            <p className="mt-4 leading-relaxed text-slate-500 dark:text-slate-400">
              For <strong>Teachers</strong>, Navta serves as a digital
              classroom manager. Educators can upload lecture notes, create
              multiple-choice questions, and assemble tests. The dashboard
              provides classroom statistics, including student streaks,
              averages, and grading information.
            </p>
          </div>

          <div className="rounded-2xl border border-primary-500/20 bg-primary-500/10 p-6 dark:border-primary-800/30 dark:bg-primary-950/20">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
              Core Capabilities
            </h3>

            <ul className="space-y-3">
              {capabilities.map((item, index) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                    {index + 1}
                  </span>

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Meet the team */}
      <section
        aria-labelledby="team-heading"
        className="mb-8"
      >
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-primary-500">
            The People Behind Navta
          </p>

          <h2
            id="team-heading"
            className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          >
            Meet the Team
          </h2>

          <p className="mt-4 leading-relaxed text-slate-500 dark:text-slate-400">
            Meet the people working to make learning more accessible,
            engaging, and effective.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {teamMembers.map((member) => {
            const Icon = member.icon;

            return (
              <article
                key={member.name}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/40 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-950/50 sm:p-9"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl transition-colors group-hover:bg-primary-500/20"
                />

                <div className="relative">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10">
                      <span className="text-xl font-extrabold tracking-wide text-primary-600 dark:text-primary-400">
                        {member.initials}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {member.name}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <p className="min-h-[72px] text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {member.description}
                  </p>

                  <div className="my-6 h-px bg-slate-200 dark:bg-slate-800" />

                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${member.name}'s LinkedIn profile`}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary-500/30 bg-primary-500/5 px-4 py-3 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-500/10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:text-primary-400 dark:focus:ring-offset-slate-950"
                  >
                    <Icon className="h-4 w-4" />
                    Connect on LinkedIn
                    <ExternalLink
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
