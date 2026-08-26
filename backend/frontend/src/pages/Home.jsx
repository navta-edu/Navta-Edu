import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  Zap,
  Flame,
  Trophy,
  BarChart3,
  BookOpen,
  Users
} from 'lucide-react';

import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: 'Chapter-wise Notes',
      desc: 'Comprehensive study materials prepared by subject-expert teachers.',
      color:
        'text-blue-500 bg-blue-50/90 dark:bg-blue-950/20'
    },
    {
      icon: Zap,
      title: 'Assessments & PYQs',
      desc: 'Attempt topic-wise quizzes and browse past years board and entrance exam papers.',
      color:
        'text-amber-500 bg-amber-50/90 dark:bg-amber-950/20'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      desc: 'Detailed tracking of your subject-wise strong and weak areas with target summaries.',
      color:
        'text-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/20'
    },
    {
      icon: Flame,
      title: 'Study Streaks',
      desc: 'Earn reward coins by keeping up daily learning goals and streaks.',
      color:
        'text-orange-500 bg-orange-50/90 dark:bg-orange-950/20'
    },
    {
      icon: Trophy,
      title: 'Earn Rewards',
      desc: 'Redeem coins earned from quizzes for badges, premium files, and merch.',
      color:
        'text-yellow-500 bg-yellow-50/90 dark:bg-yellow-950/20'
    },
    {
      icon: Users,
      title: 'Class Monitoring',
      desc: 'Teachers track class averages, grade distributions, and generate reports.',
      color:
        'text-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/20'
    }
  ];

  const stats = [
    {
      value: '15,000+',
      label: 'Active Learners'
    },
    {
      value: '250+',
      label: 'Subject Courses'
    },
    {
      value: '98%',
      label: 'Pass Rate'
    },
    {
      value: '500,000+',
      label: 'Quizzes Solved'
    }
  ];

  const dashboardPath = user
    ? user.role === 'student'
      ? '/dashboard'
      : user.role === 'teacher'
        ? '/teacher'
        : user.role === 'external_teacher'
          ? '/external-teacher'
          : '/admin'
    : '/signup';

  return (
    <div
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-transparent
        pb-16
      "
    >
      {/* =====================================================
          SUBTLE DECORATIVE OVERLAY
          Transparent so global NAVTA background remains visible.
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          bg-gradient-to-b
          from-white/15
          via-transparent
          to-white/20
          dark:from-transparent
          dark:via-transparent
          dark:to-transparent
        "
      />

      {/* =====================================================
          SOFT PREMIUM GLOWS
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          top-0
          left-1/4
          -z-10
          h-[500px]
          w-[500px]
          rounded-full
          bg-primary-400/8
          blur-[120px]
          dark:bg-primary-500/5
          pulse-glow
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          top-1/3
          right-1/4
          -z-10
          h-[600px]
          w-[600px]
          rounded-full
          bg-indigo-400/8
          blur-[130px]
          dark:bg-indigo-500/5
          pulse-glow
        "
      />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        className="
          mx-auto
          max-w-7xl
          px-4
          pt-16
          sm:px-6
          lg:px-8
          text-center
        "
      >
        <div
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-full
            px-3.5
            py-1.5
            mb-6
            text-xs
            font-semibold
            bg-white/75
            dark:bg-primary-950/40
            text-primary-600
            dark:text-primary-400
            border
            border-primary-200/50
            dark:border-primary-800/40
            backdrop-blur-md
            shadow-sm
          "
        >
          <GraduationCap className="w-4.5 h-4.5" />

          The Smart Learning Companion
        </div>

        <h1
          className="
            text-4xl
            font-extrabold
            tracking-tight
            sm:text-6xl
            text-slate-900
            dark:text-white
            max-w-4xl
            mx-auto
            leading-tight
          "
        >
          Accelerate Your Academic Journey with{' '}

          <span
            className="
              bg-gradient-to-r
              from-primary-500
              to-indigo-600
              dark:from-primary-400
              dark:to-indigo-400
              bg-clip-text
              text-transparent
            "
          >
            Navta
          </span>
        </h1>

        <p
          className="
            mx-auto
            mt-6
            max-w-2xl
            text-lg
            text-slate-600
            dark:text-slate-400
            leading-relaxed
          "
        >
          A gamified, interactive portal where students study
          notes, solve PYQs, track strengths and weaknesses, and
          redeem premium milestones. Built for educators and
          learners.
        </p>

        <div
          className="
            mt-10
            flex
            flex-col
            sm:flex-row
            justify-center
            gap-4
          "
        >
          {user ? (
            <Link
              to={dashboardPath}
              className="w-full sm:w-auto"
            >
              <Button
                icon={ArrowRight}
                className="w-full sm:w-auto justify-center"
              >
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="w-full sm:w-auto"
              >
                <Button
                  icon={ArrowRight}
                  className="w-full sm:w-auto justify-center"
                >
                  Get Started Free
                </Button>
              </Link>

              <Link
                to="/about"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto justify-center"
                >
                  Learn More
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section
        className="
          mx-auto
          max-w-7xl
          px-4
          mt-20
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            grid
            grid-cols-2
            md:grid-cols-4
            gap-4
            sm:gap-6
          "
        >
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="
                rounded-3xl
                p-5
                sm:p-6
                text-center
                border
                border-white/50
                dark:border-slate-800/50
                bg-white/72
                dark:bg-slate-900/45
                backdrop-blur-xl
                shadow-[0_10px_35px_rgba(15,23,42,0.08)]
              "
            >
              <p
                className="
                  text-2xl
                  sm:text-3xl
                  font-extrabold
                  text-primary-500
                  dark:text-primary-400
                "
              >
                {stat.value}
              </p>

              <p
                className="
                  text-[10px]
                  sm:text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-500
                  uppercase
                  tracking-wider
                  mt-1
                "
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section
        className="
          mx-auto
          max-w-7xl
          px-4
          mt-24
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            text-center
            max-w-2xl
            mx-auto
            mb-16
          "
        >
          <h2
            className="
              text-3xl
              font-bold
              text-slate-900
              dark:text-white
              tracking-tight
            "
          >
            Everything you need to succeed
          </h2>

          <p
            className="
              text-slate-600
              dark:text-slate-400
              mt-3
              leading-relaxed
            "
          >
            Navta combines structured study materials with
            engaging gamification triggers to lock-in learning
            success.
          </p>
        </div>

        <div
          className="
            grid
            md:grid-cols-3
            gap-8
          "
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;

            return (
              <Card
                key={idx}
                className="
                  hover:-translate-y-1
                  transition-all
                  duration-200
                  bg-white/72
                  dark:bg-slate-900/50
                  backdrop-blur-xl
                "
              >
                <div
                  className={`
                    p-3
                    rounded-2xl
                    w-fit
                    ${feature.color}
                    mb-4
                  `}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <h3
                  className="
                    text-lg
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {feature.title}
                </h3>

                <p
                  className="
                    text-sm
                    text-slate-600
                    dark:text-slate-400
                    mt-2
                    leading-relaxed
                  "
                >
                  {feature.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          TEACHER CTA
      ===================================================== */}

      <section
        className="
          mx-auto
          max-w-7xl
          px-4
          mt-24
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            rounded-3xl
            p-8
            md:p-12
            border
            border-white/50
            dark:border-slate-800/40
            bg-white/72
            dark:bg-slate-900/45
            backdrop-blur-xl
            relative
            overflow-hidden
            flex
            flex-col
            md:flex-row
            items-center
            justify-between
            gap-8
            shadow-[0_12px_40px_rgba(15,23,42,0.08)]
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              top-0
              right-0
              -z-10
              h-72
              w-72
              rounded-full
              bg-indigo-500/10
              blur-[80px]
              dark:bg-indigo-500/5
            "
          />

          <div
            className="
              max-w-xl
              text-center
              md:text-left
            "
          >
            <h2
              className="
                text-2xl
                md:text-3xl
                font-bold
                text-slate-900
                dark:text-white
                tracking-tight
              "
            >
              Are you an Educator?
            </h2>

            <p
              className="
                text-slate-600
                dark:text-slate-400
                mt-3
                leading-relaxed
              "
            >
              Create a teacher account to upload your notes,
              construct chapter-wise quizzes, track scores, review
              class completion metrics, and customize gamified
              rewards.
            </p>
          </div>

          <Link
            to="/signup"
            state={{
              role: 'teacher'
            }}
            className="w-full md:w-auto"
          >
            <Button
              variant="secondary"
              className="
                w-full
                md:w-auto
                justify-center
                px-8
                py-3
                bg-white/85
                dark:bg-slate-800
                hover:bg-white
                dark:hover:bg-slate-700
                border
                border-slate-200
                dark:border-slate-700
              "
            >
              Join as a Teacher
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
