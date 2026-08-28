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
  Users,
  BrainCircuit,
  Target,
  Sparkles,
  ShieldCheck,
  Clock3,
  TrendingUp,
  FileText,
  CheckCircle2
} from 'lucide-react';

import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  const dashboardPath = user
    ? user.role === 'student'
      ? '/dashboard'
      : user.role === 'teacher'
        ? '/teacher'
        : user.role === 'external_teacher'
          ? '/external-teacher'
          : '/admin'
    : '/signup';

  const stats = [
    { value: '15K+', label: 'Active Learners' },
    { value: '250+', label: 'Learning Resources' },
    { value: '500K+', label: 'Questions Practised' },
    { value: '98%', label: 'Goal Completion' }
  ];

  const features = [
    {
      icon: BookOpen,
      title: 'Chapter-wise Learning',
      desc: 'Structured notes and focused revision paths for Class 11 and Class 12.',
      accent: 'from-sky-500/20 to-cyan-500/5',
      iconClass: 'text-sky-500'
    },
    {
      icon: Target,
      title: 'NAVTA TEST',
      desc: 'Difficulty-based tests for NEET, JEE and Boards with intelligent time allocation.',
      accent: 'from-violet-500/20 to-fuchsia-500/5',
      iconClass: 'text-violet-500'
    },
    {
      icon: BrainCircuit,
      title: 'AI Answer Evaluation',
      desc: 'Boards short and long answers can receive marks, feedback and missing key points.',
      accent: 'from-emerald-500/20 to-teal-500/5',
      iconClass: 'text-emerald-500'
    },
    {
      icon: FileText,
      title: 'PYQs & Assessments',
      desc: 'Practise previous-year papers and chapter-level quizzes from one place.',
      accent: 'from-amber-500/20 to-orange-500/5',
      iconClass: 'text-amber-500'
    },
    {
      icon: BarChart3,
      title: 'Performance Intelligence',
      desc: 'Track score trends, identify weak areas and turn analytics into an action plan.',
      accent: 'from-indigo-500/20 to-blue-500/5',
      iconClass: 'text-indigo-500'
    },
    {
      icon: Trophy,
      title: 'Streaks, Levels & Rewards',
      desc: 'Build consistency with streaks, XP, levels, coins and meaningful achievements.',
      accent: 'from-rose-500/20 to-pink-500/5',
      iconClass: 'text-rose-500'
    }
  ];

  const journey = [
    { step: '01', title: 'Learn', text: 'Study chapter-wise notes' },
    { step: '02', title: 'Practise', text: 'Solve PYQs and quizzes' },
    { step: '03', title: 'Test', text: 'Take NAVTA TEST' },
    { step: '04', title: 'Analyse', text: 'See your performance' },
    { step: '05', title: 'Improve', text: 'Fix weak concepts' },
    { step: '06', title: 'Earn', text: 'Build streaks and rewards' }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent pb-20">

      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-16 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10" />

        <div className="absolute right-[6%] top-[28rem] h-96 w-96 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/10" />

        <div className="absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/5" />
      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16">

        <div
          className="
            relative
            overflow-hidden
            rounded-[30px]
            border
            border-slate-200/80
            bg-white/80
            shadow-xl
            supports-[backdrop-filter]:backdrop-blur-sm

            dark:border-slate-700/50
            dark:bg-slate-950/78
            dark:shadow-xl
          "
        >

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-br
              from-white/80
              via-transparent
              to-sky-100/40

              dark:from-slate-900/50
              dark:via-transparent
              dark:to-indigo-950/20
            "
          />

          <div className="relative grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-12 lg:py-14">

            <div>

              <div
                className="
                  mb-5
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-sky-200/70
                  bg-sky-50/90
                  px-3.5
                  py-2
                  text-xs
                  font-extrabold
                  text-sky-700
                  shadow-sm

                  dark:border-sky-800/50
                  dark:bg-sky-950/40
                  dark:text-sky-300
                "
              >
                <Sparkles className="h-4 w-4" />
                NAVTA • Smart Learning Platform
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
                Study smarter.
                <br />

                Test better.
                <br />

                <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-violet-600 bg-clip-text text-transparent">
                  Improve every day.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                One intelligent workspace for Class 11 and 12 students preparing for
                NEET, JEE and Boards — with notes, PYQs, adaptive practice, NAVTA TEST,
                AI-assisted written-answer feedback and performance analytics.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                {user ? (
                  <Link
                    to={dashboardPath}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      icon={ArrowRight}
                      className="w-full justify-center sm:w-auto"
                    >
                      Open My Dashboard
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
                        className="w-full justify-center sm:w-auto"
                      >
                        Start Learning Free
                      </Button>
                    </Link>

                    <Link
                      to="/navta-test"
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="secondary"
                        className="w-full justify-center sm:w-auto"
                      >
                        Explore NAVTA TEST
                      </Button>
                    </Link>
                  </>
                )}

              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">

                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Student-focused
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4 text-violet-500" />
                  AI feedback
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-sky-500" />
                  Progress tracking
                </span>

              </div>

            </div>

            {/* =================================================
                PRODUCT PREVIEW
            ================================================= */}

            <div className="relative">

              <div className="absolute -inset-6 -z-10 rounded-[34px] bg-gradient-to-br from-sky-400/20 via-indigo-500/10 to-violet-500/20 blur-2xl" />

              <div
                className="
                  rounded-[26px]
                  border
                  border-slate-200/90
                  bg-white/90
                  p-4
                  shadow-lg
                  supports-[backdrop-filter]:backdrop-blur-sm

                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:shadow-2xl
                "
              >

                <div className="mb-4 flex items-center justify-between">

                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
                      Student Intelligence
                    </p>

                    <h3 className="mt-1 text-lg font-extrabold text-slate-950 dark:text-white">
                      Your learning command centre
                    </h3>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 dark:bg-sky-500/15">
                    <BrainCircuit className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                  </div>

                </div>

                <div className="grid grid-cols-3 gap-3">
                  <MiniMetric icon={Flame} label="Streak" value="12 days" />
                  <MiniMetric icon={Trophy} label="Level" value="08" />
                  <MiniMetric icon={BarChart3} label="Avg Score" value="82%" />
                </div>

                <div
                  className="
                    mt-3
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50/90
                    p-4

                    dark:border-slate-800
                    dark:bg-slate-900/80
                  "
                >

                  <div className="flex items-center justify-between gap-3">

                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        NAVTA TEST
                      </p>

                      <p className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">
                        Biology • NEET • Medium
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-right">

                      <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                        Ready
                      </p>

                      <p className="text-sm font-black text-slate-950 dark:text-white">
                        30 Q
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-sky-500 to-violet-500" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Difficulty: Medium
                    </span>

                    <span>
                      30 min
                    </span>
                  </div>

                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <PreviewTile
                    icon={BookOpen}
                    title="Study Notes"
                    value="14 chapters"
                  />

                  <PreviewTile
                    icon={BrainCircuit}
                    title="AI Feedback"
                    value="Actionable"
                  />
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          TRUST / METRICS
      ===================================================== */}

      <section className="navta-lazy-section mx-auto mt-7 max-w-7xl px-4 sm:px-6 lg:px-8">

        <div
          className="
            grid
            grid-cols-2
            gap-3
            rounded-[26px]
            border
            border-slate-200/80
            bg-white/80
            p-3
            shadow-md
            supports-[backdrop-filter]:backdrop-blur-sm
            md:grid-cols-4

            dark:border-slate-800/50
            dark:bg-slate-950/60
          "
        >

          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl px-4 py-5 text-center"
            >

              <p className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                {stat.value}
              </p>

              <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
                {stat.label}
              </p>

            </div>
          ))}

        </div>

      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section className="navta-lazy-section mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">

        <SectionHeading
          eyebrow="One learning system"
          title="Everything students need to move forward"
          text="NAVTA brings study, practice, testing, analytics and motivation into one focused academic experience."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="
                  navta-lazy-section
                  group
                  relative
                  overflow-hidden
                  rounded-[24px]
                  border
                  border-slate-200/80
                  bg-white/82
                  p-6
                  shadow-md
                  supports-[backdrop-filter]:backdrop-blur-sm
                  transition-shadow
                  duration-200
                  hover:shadow-lg

                  dark:border-slate-800/60
                  dark:bg-slate-950/65
                "
              >

                <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${feature.accent} opacity-80`} />

                <div className="relative">

                  <div
                    className="
                      mb-5
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      shadow-sm

                      dark:border-slate-700
                      dark:bg-slate-900
                    "
                  >
                    <Icon className={`h-6 w-6 ${feature.iconClass}`} />
                  </div>

                  <h3 className="text-lg font-black text-slate-950 dark:text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {feature.desc}
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-sky-600 dark:text-sky-400">
                    Explore capability

                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>

                </div>

              </article>
            );
          })}

        </div>

      </section>

      {/* =====================================================
          NAVTA TEST SPOTLIGHT
      ===================================================== */}

      <section className="navta-lazy-section mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">

        <div
          className="
            relative
            overflow-hidden
            rounded-[30px]
            border
            border-slate-200/90
            bg-white/90
            shadow-xl
            supports-[backdrop-filter]:backdrop-blur-sm

            dark:border-slate-800
            dark:bg-slate-950
            dark:shadow-xl
          "
        >

          {/* Light mode ambient gradient */}
          <div
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-br
              from-sky-50/80
              via-white/20
              to-violet-50/70

              dark:from-sky-950/10
              dark:via-transparent
              dark:to-violet-950/10
            "
          />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">

            <div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-sky-200
                  bg-sky-50
                  px-3
                  py-2
                  text-xs
                  font-extrabold
                  text-sky-700

                  dark:border-transparent
                  dark:bg-sky-500/10
                  dark:text-sky-400
                "
              >
                <Zap className="h-4 w-4" />
                NAVTA TEST
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                A test engine built around how students actually prepare.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-400">
                Select subject, preparation, class, chapter and difficulty.
                NAVTA then builds a focused test with timing logic matched to
                the exam mode.
              </p>

              <div className="mt-7 space-y-3">

                <SpotlightRow
                  icon={Clock3}
                  text="NEET • 1 minute per MCQ"
                />

                <SpotlightRow
                  icon={Clock3}
                  text="JEE • 2 minutes per MCQ"
                />

                <SpotlightRow
                  icon={BrainCircuit}
                  text="Boards • MCQ, Short Answer and Long Answer with AI feedback"
                />

              </div>

              <Link
                to="/navta-test"
                className="mt-8 inline-block"
              >
                <Button icon={ArrowRight}>
                  Open NAVTA TEST
                </Button>
              </Link>

            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:self-center">

              <ModeCard
                title="NEET"
                subtitle="Fast recall"
                detail="1 min / question"
                icon="🩺"
                bullets={[
                  'MCQ',
                  'Easy / Medium / Hard',
                  'Chapter-wise'
                ]}
              />

              <ModeCard
                title="JEE"
                subtitle="Problem solving"
                detail="2 min / question"
                icon="🚀"
                bullets={[
                  'MCQ',
                  'Timed practice',
                  'Chapter-wise'
                ]}
              />

              <ModeCard
                title="Boards"
                subtitle="Written mastery"
                detail="AI-assisted"
                icon="📚"
                bullets={[
                  'MCQ',
                  'Short answer',
                  'Long answer'
                ]}
              />

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          JOURNEY
      ===================================================== */}

      <section className="navta-lazy-section mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">

        <SectionHeading
          eyebrow="Student journey"
          title="A clear loop from learning to improvement"
          text="Every NAVTA feature connects to the next so students always know what to do after studying."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">

          {journey.map((item, index) => (
            <div
              key={item.step}
              className="
                relative
                rounded-[22px]
                border
                border-slate-200/80
                bg-white/80
                p-5
                text-center
                shadow-sm
                supports-[backdrop-filter]:backdrop-blur-sm

                dark:border-slate-800/50
                dark:bg-slate-950/60
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-sky-500
                  text-xs
                  font-black
                  text-white
                  shadow-lg
                  shadow-sky-500/20

                  dark:bg-sky-500
                "
              >
                {item.step}
              </div>

              <h3 className="mt-4 text-sm font-black text-slate-950 dark:text-white">
                {item.title}
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {item.text}
              </p>

              {index < journey.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-sky-400 lg:block" />
              )}

            </div>
          ))}

        </div>

      </section>

      {/* =====================================================
          EDUCATOR + FINAL CTA
      ===================================================== */}

      <section className="navta-lazy-section mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">

          {/* EDUCATOR */}

          <div
            className="
              rounded-[28px]
              border
              border-slate-200/80
              bg-white/82
              p-7
              shadow-md
              supports-[backdrop-filter]:backdrop-blur-sm

              dark:border-slate-800/50
              dark:bg-slate-950/65

              sm:p-8
            "
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Users className="h-6 w-6 text-emerald-500" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
              Built for educators too.
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
              Upload study material, build question banks, manage NAVTA TEST
              content and track student performance from one administrative workflow.
            </p>

            <Link
              to="/signup"
              state={{ role: 'teacher' }}
              className="mt-6 inline-block"
            >
              <Button variant="secondary">
                Join as an Educator
              </Button>
            </Link>

          </div>

          {/* FINAL CTA */}

          <div
            className="
              relative
              overflow-hidden
              rounded-[28px]
              border
              border-sky-200/80
              bg-gradient-to-br
              from-white
              via-sky-50
              to-violet-50
              p-7
              shadow-lg

              dark:border-sky-400/20
              dark:from-slate-950
              dark:via-[#07182b]
              dark:to-[#102a43]
              dark:shadow-xl

              sm:p-8
            "
          >

            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/20" />

            <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/20" />

            <div className="relative">

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-sky-200/70
                  bg-white/70
                  px-3
                  py-2
                  text-xs
                  font-bold
                  text-sky-700

                  dark:border-transparent
                  dark:bg-white/5
                  dark:text-sky-300
                "
              >
                <GraduationCap className="h-4 w-4" />
                Start your next study session
              </div>

              <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                Turn every study session into measurable progress.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
                Learn, practise, test, analyse and improve — without switching
                between five different platforms.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">

                <Link
                  to={user ? dashboardPath : '/signup'}
                  className="w-full sm:w-auto"
                >
                  <Button
                    icon={ArrowRight}
                    className="w-full justify-center sm:w-auto"
                  >
                    {user
                      ? 'Continue Learning'
                      : 'Create Free Account'}
                  </Button>
                </Link>

                <Link
                  to="/about"
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="secondary"
                    className="w-full justify-center sm:w-auto"
                  >
                    Learn More
                  </Button>
                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

// =====================================================
// MINI METRIC
// =====================================================

function MiniMetric({
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
        bg-slate-50/90
        p-3

        dark:border-slate-800
        dark:bg-slate-900/80
      "
    >

      <Icon className="h-4 w-4 text-sky-500 dark:text-sky-400" />

      <p className="mt-3 text-sm font-black text-slate-950 dark:text-white">
        {value}
      </p>

      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

    </div>
  );
}

// =====================================================
// PREVIEW TILE
// =====================================================

function PreviewTile({
  icon: Icon,
  title,
  value
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-slate-50/90
        p-3

        dark:border-slate-800
        dark:bg-slate-900/80
      "
    >

      <div className="flex items-center gap-2">

        <Icon className="h-4 w-4 text-violet-500 dark:text-violet-400" />

        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </p>

      </div>

      <p className="mt-2 text-sm font-extrabold text-slate-950 dark:text-white">
        {value}
      </p>

    </div>
  );
}

// =====================================================
// SECTION HEADING
// =====================================================

function SectionHeading({
  eyebrow,
  title,
  text
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">

      <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
        {title}
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-400">
        {text}
      </p>

    </div>
  );
}

// =====================================================
// SPOTLIGHT ROW
// =====================================================

function SpotlightRow({
  icon: Icon,
  text
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
        rounded-2xl
        border
        border-slate-200
        bg-white/70
        p-3
        shadow-sm

        dark:border-slate-800
        dark:bg-white/[0.03]
        dark:shadow-none
      "
    >

      <div
        className="
          mt-0.5
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-sky-100

          dark:bg-sky-500/10
        "
      >
        <Icon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
      </div>

      <p className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
        {text}
      </p>

    </div>
  );
}

// =====================================================
// MODE CARD
// =====================================================

function ModeCard({
  title,
  subtitle,
  detail,
  icon,
  bullets
}) {
  return (
    <div
      className="
        navta-lazy-section
        rounded-[24px]
        border
        border-slate-200
        bg-white/80
        p-5
        shadow-sm
        supports-[backdrop-filter]:backdrop-blur-sm

        dark:border-slate-800
        dark:bg-slate-900/75
        dark:shadow-none
      "
    >

      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-2xl
          bg-slate-100
          text-2xl

          dark:bg-slate-800
        "
      >
        {icon}
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {subtitle}
      </p>

      <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm font-extrabold text-sky-600 dark:text-sky-400">
        {detail}
      </p>

      <div className="mt-5 space-y-2">

        {bullets.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
          >

            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />

            {item}

          </div>
        ))}

      </div>

    </div>
  );
}
