import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  ShieldCheck,
  Sparkles,
  Trophy
} from 'lucide-react';

import {
  studentAPI
} from '../utils/api';

export default function StreakPage() {
  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const loadStreak =
      async () => {
        try {
          setLoading(true);
          setError('');

          const response =
            await studentAPI.getAnalytics();

          const data =
            response?.data ||
            response ||
            null;

          setAnalytics(data);
        } catch (err) {
          console.error(
            'Failed to load streak:',
            err
          );

          setError(
            err?.message ||
            'Failed to load your streak.'
          );
        } finally {
          setLoading(false);
        }
      };

    loadStreak();
  }, []);

  const streak =
    analytics?.streak || {};

  const currentStreak =
    Number(
      streak?.currentStreak || 0
    );

  const longestStreak =
    Number(
      streak?.longestStreak || 0
    );

  const recoveryActive =
    Boolean(
      streak?.recoveryActive
    );

  const recoveryRequired =
    Number(
      streak?.recoveryRequired || 0
    );

  const recoveryCompleted =
    Number(
      streak?.recoveryCompleted || 0
    );

  const recoveryRemaining =
    Number(
      streak?.recoveryRemaining ??
      Math.max(
        0,
        recoveryRequired -
          recoveryCompleted
      )
    );

  const lastNavtaTestDate =
    streak?.lastNavtaTestDate ||
    null;

  const status =
    streak?.status ||
    '';

  const completedToday =
    useMemo(() => {
      return (
        status === 'same-day' ||
        status ===
          'consecutive-day' ||
        status ===
          'streak-started' ||
        status ===
          'recovery-started' ||
        status ===
          'recovery-progress' ||
        status ===
          'recovery-completed' ||
        status ===
          'recovery-restarted'
      );
    }, [status]);

  const recoveryPercentage =
    recoveryRequired > 0
      ? Math.min(
          100,
          Math.round(
            (
              recoveryCompleted /
              recoveryRequired
            ) * 100
          )
        )
      : 0;

  const streakMessage =
    recoveryActive
      ? `Complete ${recoveryRemaining} more recovery day${
          recoveryRemaining === 1
            ? ''
            : 's'
        } to protect your streak.`
      : currentStreak > 0
        ? 'Complete at least one NAVTA TEST today to keep your streak moving.'
        : 'Complete your first NAVTA TEST to begin your streak.';

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[75vh]
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
              border-orange-500
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
            Loading your streak...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="
          mx-auto
          max-w-3xl
          p-5
        "
      >
        <Link
          to="/dashboard"
          className="
            mb-5
            inline-flex
            items-center
            gap-2
            text-sm
            font-bold
            text-sky-600

            dark:text-sky-400
          "
        >
          <ArrowLeft
            className="h-4 w-4"
          />

          Back to Dashboard
        </Link>

        <div
          className="
            rounded-3xl
            border
            border-rose-200
            bg-rose-50
            p-6

            dark:border-rose-500/20
            dark:bg-rose-500/10
          "
        >
          <p
            className="
              font-bold
              text-rose-700

              dark:text-rose-300
            "
          >
            {error}
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
          max-w-[1250px]
          space-y-5
        "
      >
        {/* ==============================================
            BACK
        ============================================== */}

        <Link
          to="/dashboard"
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white/80
            px-4
            py-2
            text-xs
            font-bold
            text-slate-600
            shadow-sm
            transition

            hover:border-sky-300
            hover:text-sky-600

            dark:border-slate-800
            dark:bg-slate-950/70
            dark:text-slate-300
            dark:hover:border-sky-500
            dark:hover:text-sky-400
          "
        >
          <ArrowLeft
            className="h-4 w-4"
          />

          Dashboard
        </Link>

        {/* ==============================================
            HERO
        ============================================== */}

        <section
          className="
            relative
            overflow-hidden
            rounded-[30px]
            border
            border-orange-200/70
            bg-gradient-to-br
            from-orange-50
            via-white
            to-amber-50
            shadow-[0_25px_80px_rgba(15,23,42,0.10)]

            dark:border-orange-500/20
            dark:from-orange-500/10
            dark:via-[#081326]
            dark:to-amber-500/5
          "
        >
          <div
            className="
              absolute
              -right-20
              -top-20
              h-64
              w-64
              rounded-full
              bg-orange-300/20
              blur-3xl

              dark:bg-orange-500/10
            "
          />

          <div
            className="
              absolute
              -bottom-24
              left-20
              h-64
              w-64
              rounded-full
              bg-amber-300/20
              blur-3xl

              dark:bg-amber-500/10
            "
          />

          <div
            className="
              relative
              grid
              gap-8
              p-6
              sm:p-8
              lg:grid-cols-[minmax(0,1fr)_340px]
              lg:items-center
            "
          >
            <div>
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-orange-200
                  bg-white/70
                  px-3
                  py-1.5
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.16em]
                  text-orange-600

                  dark:border-orange-500/20
                  dark:bg-orange-500/10
                  dark:text-orange-300
                "
              >
                <Flame
                  className="h-4 w-4"
                />

                NAVTA Streak
              </div>

              <h1
                className="
                  mt-5
                  text-4xl
                  font-black
                  tracking-tight
                  text-slate-950
                  sm:text-5xl

                  dark:text-white
                "
              >
                Build consistency.
                <br />

                <span
                  className="
                    bg-gradient-to-r
                    from-orange-500
                    via-amber-500
                    to-yellow-500
                    bg-clip-text
                    text-transparent
                  "
                >
                  One test at a time.
                </span>
              </h1>

              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-600
                  sm:text-base

                  dark:text-slate-400
                "
              >
                Complete at least one NAVTA
                TEST each day to grow your
                learning streak.
              </p>

              <p
                className="
                  mt-2
                  text-xs
                  font-semibold
                  text-orange-600

                  dark:text-orange-300
                "
              >
                {streakMessage}
              </p>
            </div>

            <div
              className="
                rounded-[26px]
                border
                border-white/80
                bg-white/75
                p-6
                text-center
                shadow-xl
                backdrop-blur-xl

                dark:border-slate-800
                dark:bg-slate-950/70
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-20
                  w-20
                  items-center
                  justify-center
                  rounded-3xl
                  bg-orange-100

                  dark:bg-orange-500/10
                "
              >
                <Flame
                  className="
                    h-10
                    w-10
                    text-orange-500
                  "
                />
              </div>

              <p
                className="
                  mt-5
                  text-5xl
                  font-black
                  text-slate-950

                  dark:text-white
                "
              >
                {currentStreak}
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-slate-400
                "
              >
                Day Streak
              </p>
            </div>
          </div>
        </section>

        {/* ==============================================
            STATS
        ============================================== */}

        <section
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <StatCard
            icon={Flame}
            title="Current Streak"
            value={`${currentStreak} ${
              currentStreak === 1
                ? 'Day'
                : 'Days'
            }`}
            subtitle="Your active NAVTA TEST streak"
            iconClass="text-orange-500"
            iconBg="bg-orange-100 dark:bg-orange-500/10"
          />

          <StatCard
            icon={Trophy}
            title="Longest Streak"
            value={`${longestStreak} ${
              longestStreak === 1
                ? 'Day'
                : 'Days'
            }`}
            subtitle="Your personal best"
            iconClass="text-yellow-500"
            iconBg="bg-yellow-100 dark:bg-yellow-500/10"
          />

          <StatCard
            icon={
              completedToday
                ? CheckCircle2
                : Clock3
            }
            title="Today's Status"
            value={
              completedToday
                ? 'Completed'
                : 'Pending'
            }
            subtitle={
              completedToday
                ? 'NAVTA TEST completed today'
                : 'Complete a NAVTA TEST today'
            }
            iconClass={
              completedToday
                ? 'text-emerald-500'
                : 'text-sky-500'
            }
            iconBg={
              completedToday
                ? 'bg-emerald-100 dark:bg-emerald-500/10'
                : 'bg-sky-100 dark:bg-sky-500/10'
            }
          />

          <StatCard
            icon={CalendarDays}
            title="Last Activity"
            value={
              lastNavtaTestDate ||
              'No test yet'
            }
            subtitle="India calendar date"
            iconClass="text-violet-500"
            iconBg="bg-violet-100 dark:bg-violet-500/10"
          />
        </section>

        {/* ==============================================
            RECOVERY
        ============================================== */}

        <section
          className="
            grid
            grid-cols-1
            gap-5
            lg:grid-cols-[minmax(0,1fr)_360px]
          "
        >
          <div
            className="
              rounded-[26px]
              border
              border-slate-200/80
              bg-white/88
              p-6
              shadow-[0_18px_55px_rgba(15,23,42,0.08)]
              backdrop-blur-xl

              dark:border-slate-800
              dark:bg-[#081326]/92
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.16em]
                    text-sky-600

                    dark:text-sky-400
                  "
                >
                  Streak Protection
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-black
                    text-slate-950

                    dark:text-white
                  "
                >
                  Recovery Status
                </h2>
              </div>

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-sky-100

                  dark:bg-sky-500/10
                "
              >
                <ShieldCheck
                  className="
                    h-6
                    w-6
                    text-sky-500
                  "
                />
              </div>
            </div>

            {recoveryActive ? (
              <>
                <div
                  className="
                    mt-6
                    rounded-2xl
                    border
                    border-sky-200
                    bg-sky-50
                    p-5

                    dark:border-sky-500/20
                    dark:bg-sky-500/10
                  "
                >
                  <div
                    className="
                      flex
                      items-end
                      justify-between
                      gap-4
                    "
                  >
                    <div>
                      <p
                        className="
                          text-3xl
                          font-black
                          text-sky-600

                          dark:text-sky-300
                        "
                      >
                        {recoveryCompleted}/
                        {recoveryRequired}
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
                        Recovery days completed
                      </p>
                    </div>

                    <p
                      className="
                        text-xs
                        font-black
                        text-sky-600

                        dark:text-sky-300
                      "
                    >
                      {recoveryRemaining}{' '}
                      remaining
                    </p>
                  </div>

                  <div
                    className="
                      mt-4
                      h-2.5
                      overflow-hidden
                      rounded-full
                      bg-sky-100

                      dark:bg-slate-800
                    "
                  >
                    <div
                      className="
                        h-full
                        rounded-full
                        bg-gradient-to-r
                        from-sky-500
                        to-blue-500
                        transition-all
                      "
                      style={{
                        width:
                          `${recoveryPercentage}%`
                      }}
                    />
                  </div>
                </div>

                <p
                  className="
                    mt-4
                    text-sm
                    leading-6
                    text-slate-600

                    dark:text-slate-400
                  "
                >
                  Your streak is currently
                  protected while you complete
                  the required recovery days.
                  Recovery days do not increase
                  the streak number.
                </p>
              </>
            ) : (
              <div
                className="
                  mt-6
                  rounded-2xl
                  border
                  border-emerald-200
                  bg-emerald-50
                  p-5

                  dark:border-emerald-500/20
                  dark:bg-emerald-500/10
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <CheckCircle2
                    className="
                      h-6
                      w-6
                      text-emerald-500
                    "
                  />

                  <div>
                    <p
                      className="
                        font-black
                        text-emerald-700

                        dark:text-emerald-300
                      "
                    >
                      No recovery required
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-slate-500

                        dark:text-slate-400
                      "
                    >
                      Keep completing NAVTA TEST
                      daily to continue your
                      streak.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================
              CTA
          ============================================ */}

          <div
            className="
              rounded-[26px]
              border
              border-orange-200
              bg-gradient-to-br
              from-orange-50
              via-white
              to-yellow-50
              p-6
              shadow-[0_18px_55px_rgba(15,23,42,0.08)]

              dark:border-orange-500/20
              dark:from-orange-500/10
              dark:via-[#081326]
              dark:to-yellow-500/5
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-orange-100

                dark:bg-orange-500/10
              "
            >
              <Sparkles
                className="
                  h-6
                  w-6
                  text-orange-500
                "
              />
            </div>

            <h3
              className="
                mt-5
                text-xl
                font-black
                text-slate-950

                dark:text-white
              "
            >
              Keep the flame alive
            </h3>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500

                dark:text-slate-400
              "
            >
              Complete one NAVTA TEST today.
              Standard Test, Boss Battle and
              Revenge Battle all count.
            </p>

            <Link
              to="/navta-test"
              className="
                mt-6
                inline-flex
                w-full
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-r
                from-orange-500
                to-amber-500
                px-5
                py-3
                text-sm
                font-black
                text-white
                shadow-lg
                transition

                hover:-translate-y-0.5
                hover:shadow-xl
              "
            >
              Take NAVTA TEST
            </Link>
          </div>
        </section>

        {/* ==============================================
            HOW IT WORKS
        ============================================== */}

        <section
          className="
            rounded-[26px]
            border
            border-slate-200/80
            bg-white/88
            p-6
            shadow-[0_18px_55px_rgba(15,23,42,0.08)]
            backdrop-blur-xl

            dark:border-slate-800
            dark:bg-[#081326]/92
          "
        >
          <h2
            className="
              text-xl
              font-black
              text-slate-950

              dark:text-white
            "
          >
            How NAVTA Streak Works
          </h2>

          <p
            className="
              mt-1
              text-xs
              text-slate-500

              dark:text-slate-400
            "
          >
            Your streak is based on completed
            NAVTA TEST activity.
          </p>

          <div
            className="
              mt-6
              grid
              grid-cols-1
              gap-4
              md:grid-cols-2
              xl:grid-cols-4
            "
          >
            <RuleCard
              number="01"
              title="Complete one test"
              text="At least one completed NAVTA TEST on an India calendar day counts as streak activity."
            />

            <RuleCard
              number="02"
              title="One count per day"
              text="Taking multiple NAVTA TESTS on the same day does not increase the streak more than once."
            />

            <RuleCard
              number="03"
              title="Recovery"
              text="Miss 1 day and complete 1 recovery day. Miss 2 days and complete 2 recovery days."
            />

            <RuleCard
              number="04"
              title="Three-day reset"
              text="Missing 3 consecutive full days ends the old streak. Your next test starts a new streak at 1."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
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
        p-5
        shadow-[0_14px_40px_rgba(15,23,42,0.08)]
        backdrop-blur-xl

        dark:border-slate-800
        dark:bg-[#081326]/92
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
          className={`
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-2xl
            ${iconBg}
          `}
        >
          <Icon
            className={`
              h-6
              w-6
              ${iconClass}
            `}
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
              text-xl
              font-black
              text-slate-950

              dark:text-white
            "
          >
            {value}
          </p>

          <p
            className="
              text-[9px]
              font-black
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            {title}
          </p>

          <p
            className="
              mt-1
              text-[10px]
              leading-4
              text-slate-500

              dark:text-slate-500
            "
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   RULE CARD
===================================================== */

function RuleCard({
  number,
  title,
  text
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-slate-50/75
        p-5

        dark:border-slate-800
        dark:bg-slate-950/45
      "
    >
      <div
        className="
          inline-flex
          rounded-lg
          bg-orange-100
          px-2.5
          py-1
          text-[10px]
          font-black
          text-orange-600

          dark:bg-orange-500/10
          dark:text-orange-300
        "
      >
        {number}
      </div>

      <h3
        className="
          mt-4
          text-sm
          font-black
          text-slate-900

          dark:text-white
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-2
          text-xs
          leading-5
          text-slate-500

          dark:text-slate-400
        "
      >
        {text}
      </p>
    </div>
  );
}
