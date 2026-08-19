import React, { useEffect, useMemo, useState } from 'react';
import { studentAPI } from '../utils/api';
import Card from '../components/Card';

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Target,
  Trophy,
  ClipboardCheck,
  Clock3,
  Brain,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Minus,
  RefreshCw,
  Award,
  XCircle,
  CircleHelp,
  Activity,
  Layers,
  GraduationCap
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const SUBJECTS = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology'
];


const DEFAULT_SUBJECTS = SUBJECTS.map((subject) => ({
  subject,
  avgPercentage: 0,
  testCount: 0,
  attempted: 0,
  correct: 0,
  incorrect: 0,
  skipped: 0,
  totalQuestions: 0,
  strength: 'No Data'
}));


const getNumber = (...values) => {

  for (const value of values) {

    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }

  }

  return 0;
};


const getArray = (...values) => {

  for (const value of values) {

    if (Array.isArray(value)) {
      return value;
    }

  }

  return [];

};


const getObject = (...values) => {

  for (const value of values) {

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return value;
    }

  }

  return {};

};


const getPercentage = (value) => {

  const number = getNumber(value);

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(number * 10) / 10
    )
  );

};


const formatNumber = (value) => {

  const number = getNumber(value);

  return Number.isInteger(number)
    ? number
    : number.toFixed(1);

};


const getStrength = (percentage) => {

  const score = getNumber(percentage);

  if (score >= 80) return 'Strong';

  if (score >= 60) return 'Average';

  if (score > 0) return 'Needs Focus';

  return 'No Data';

};


const getStrengthClasses = (strength) => {

  switch (strength) {

    case 'Strong':
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';

    case 'Average':
      return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';

    case 'Needs Focus':
      return 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';

    default:
      return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';

  }

};


const getSubjectColor = (subject) => {

  switch (subject) {

    case 'Physics':
      return '#3b82f6';

    case 'Chemistry':
      return '#f43f5e';

    case 'Mathematics':
      return '#10b981';

    case 'Biology':
      return '#8b5cf6';

    default:
      return '#0ea5e9';

  }

};


const getStatus = (percentage) => {

  const score = getNumber(percentage);

  if (score >= 80) {
    return {
      label: 'Excellent Performance',
      description: 'You are performing at a strong level.',
      icon: Trophy,
      className:
        'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    };
  }

  if (score >= 60) {
    return {
      label: 'Good Progress',
      description: 'Your fundamentals are developing well.',
      icon: TrendingUp,
      className:
        'text-blue-500 bg-blue-500/10 border-blue-500/20'
    };
  }

  if (score > 0) {
    return {
      label: 'Needs Improvement',
      description: 'Focus on weak subjects and chapters.',
      icon: AlertCircle,
      className:
        'text-rose-500 bg-rose-500/10 border-rose-500/20'
    };
  }

  return {
    label: 'Start Your First Navta TEST',
    description: 'Complete a test to generate your performance analysis.',
    icon: Target,
    className:
      'text-amber-500 bg-amber-500/10 border-amber-500/20'
  };

};


/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function AnalyticsPage() {

  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');


  /*
  |--------------------------------------------------------------------------
  | LOAD ANALYTICS
  |--------------------------------------------------------------------------
  */

  const loadAnalytics = async () => {

    try {

      setError('');

      const response = await studentAPI.getAnalytics();

      /*
       * Supports both:
       *
       * response
       *
       * and:
       *
       * response.data
       */

      const data =
        response?.data &&
        typeof response.data === 'object'
          ? response.data
          : response;

      setStats(data || {});

    } catch (err) {

      console.error(
        'Analytics loading error:',
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load your analytics.'
      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  };


  useEffect(() => {

    loadAnalytics();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {

    setRefreshing(true);

    await loadAnalytics();

  };


  /*
  |--------------------------------------------------------------------------
  | OVERVIEW
  |--------------------------------------------------------------------------
  */

  const overview = useMemo(() => {

    const source = getObject(
      stats?.overview,
      stats?.summary,
      stats?.overall,
      stats
    );

    const totalTests = getNumber(
      source.totalTests,
      source.testsAttempted,
      source.testsCompleted,
      stats?.totalTests,
      stats?.testsAttempted,
      stats?.testsCompleted
    );


    const totalQuestions = getNumber(
      source.totalQuestions,
      source.questionsAttempted,
      stats?.totalQuestions
    );


    const attempted = getNumber(
      source.attempted,
      source.questionsAttempted,
      stats?.attempted
    );


    const correct = getNumber(
      source.correct,
      source.correctAnswers,
      stats?.correct
    );


    const incorrect = getNumber(
      source.incorrect,
      source.wrong,
      source.wrongAnswers,
      stats?.incorrect
    );


    const skipped = getNumber(
      source.skipped,
      source.unanswered,
      stats?.skipped
    );


    const averageScore = getPercentage(
      source.averageScore,
      source.avgScore,
      source.avgPercentage,
      stats?.averageScore,
      stats?.avgScore,
      stats?.avgPercentage
    );


    const accuracyFromData =
      attempted > 0
        ? (correct / attempted) * 100
        : 0;


    const accuracy = getPercentage(
      source.accuracy,
      stats?.accuracy,
      accuracyFromData
    );


    const bestScore = getPercentage(
      source.bestScore,
      source.highestScore,
      stats?.bestScore
    );


    const totalTime = getNumber(
      source.totalTime,
      source.timeSpent,
      stats?.totalTime
    );


    return {
      totalTests,
      totalQuestions,
      attempted,
      correct,
      incorrect,
      skipped,
      averageScore,
      accuracy,
      bestScore,
      totalTime
    };

  }, [stats]);


  /*
  |--------------------------------------------------------------------------
  | SUBJECT DATA
  |--------------------------------------------------------------------------
  */

  const subjectData = useMemo(() => {

    const raw = getArray(
      stats?.subjectStats,
      stats?.subjects,
      stats?.subjectPerformance
    );


    const normalized = SUBJECTS.map((subjectName) => {

      const found = raw.find((item) => {

        const name =
          item?.subject ||
          item?.name ||
          item?.subjectName ||
          '';

        return (
          String(name).toLowerCase() ===
          subjectName.toLowerCase()
        );

      });


      if (!found) {

        return {
          ...DEFAULT_SUBJECTS.find(
            (item) => item.subject === subjectName
          )
        };

      }


      const attempted = getNumber(
        found.attempted,
        found.questionsAttempted
      );


      const correct = getNumber(
        found.correct,
        found.correctAnswers
      );


      const accuracy = getPercentage(
        found.avgPercentage,
        found.averagePercentage,
        found.accuracy,
        found.score,
        attempted > 0
          ? (correct / attempted) * 100
          : 0
      );


      return {
        subject: subjectName,

        avgPercentage: accuracy,

        testCount: getNumber(
          found.testCount,
          found.tests,
          found.assessments,
          found.attempts
        ),

        attempted,

        correct,

        incorrect: getNumber(
          found.incorrect,
          found.wrong,
          found.wrongAnswers
        ),

        skipped: getNumber(
          found.skipped,
          found.unanswered
        ),

        totalQuestions: getNumber(
          found.totalQuestions
        ),

        strength:
          found.strength ||
          getStrength(accuracy)
      };

    });


    /*
     * If API contains subjects not in our standard list,
     * keep them as well.
     */

    const extraSubjects = raw
      .filter((item) => {

        const name =
          item?.subject ||
          item?.name ||
          item?.subjectName ||
          '';

        return !SUBJECTS.some(
          (subject) =>
            subject.toLowerCase() ===
            String(name).toLowerCase()
        );

      })
      .map((item) => {

        const name =
          item.subject ||
          item.name ||
          item.subjectName ||
          'Other';

        const attempted = getNumber(
          item.attempted,
          item.questionsAttempted
        );

        const correct = getNumber(
          item.correct,
          item.correctAnswers
        );

        const accuracy = getPercentage(
          item.avgPercentage,
          item.averagePercentage,
          item.accuracy,
          attempted > 0
            ? (correct / attempted) * 100
            : 0
        );

        return {
          subject: name,
          avgPercentage: accuracy,
          testCount: getNumber(
            item.testCount,
            item.tests,
            item.assessments
          ),
          attempted,
          correct,
          incorrect: getNumber(
            item.incorrect,
            item.wrong
          ),
          skipped: getNumber(
            item.skipped,
            item.unanswered
          ),
          totalQuestions: getNumber(
            item.totalQuestions
          ),
          strength:
            item.strength ||
            getStrength(accuracy)
        };

      });


    return [
      ...normalized,
      ...extraSubjects
    ];

  }, [stats]);


  /*
  |--------------------------------------------------------------------------
  | TREND DATA
  |--------------------------------------------------------------------------
  */

  const trendData = useMemo(() => {

    const raw = getArray(
      stats?.trend,
      stats?.performanceTrend,
      stats?.scoreTrend,
      stats?.history
    );


    return raw.map((item, index) => {

      return {
        name:
          item?.name ||
          item?.testName ||
          item?.label ||
          `Test ${index + 1}`,

        score: getPercentage(
          item?.score,
          item?.percentage,
          item?.avgPercentage,
          item?.accuracy
        ),

        accuracy: getPercentage(
          item?.accuracy,
          item?.percentage,
          item?.score
        )
      };

    });

  }, [stats]);


  /*
  |--------------------------------------------------------------------------
  | CHAPTER DATA
  |--------------------------------------------------------------------------
  */

  const chapterData = useMemo(() => {

    const raw = getArray(
      stats?.chapterStats,
      stats?.chapters,
      stats?.chapterPerformance
    );


    return raw.map((item) => {

      const attempted = getNumber(
        item?.attempted,
        item?.questionsAttempted
      );


      const correct = getNumber(
        item?.correct,
        item?.correctAnswers
      );


      const accuracy = getPercentage(
        item?.accuracy,
        item?.percentage,
        item?.avgPercentage,
        attempted > 0
          ? (correct / attempted) * 100
          : 0
      );


      return {
        chapter:
          item?.chapter ||
          item?.chapterName ||
          item?.title ||
          'Unknown Chapter',

        subject:
          item?.subject ||
          item?.subjectName ||
          '',

        accuracy,

        attempted,

        correct,

        incorrect: getNumber(
          item?.incorrect,
          item?.wrong
        )
      };

    });

  }, [stats]);


  /*
  |--------------------------------------------------------------------------
  | STRONG / WEAK CHAPTERS
  |--------------------------------------------------------------------------
  */

  const strongestChapters = useMemo(() => {

    return [...chapterData]
      .filter((item) => item.accuracy > 0)
      .sort(
        (a, b) =>
          b.accuracy - a.accuracy
      )
      .slice(0, 5);

  }, [chapterData]);


  const weakestChapters = useMemo(() => {

    return [...chapterData]
      .filter((item) => item.accuracy > 0)
      .sort(
        (a, b) =>
          a.accuracy - b.accuracy
      )
      .slice(0, 5);

  }, [chapterData]);


  /*
  |--------------------------------------------------------------------------
  | DIFFICULTY
  |--------------------------------------------------------------------------
  */

  const difficultyData = useMemo(() => {

    const raw = getObject(
      stats?.difficultyStats,
      stats?.difficulty,
      stats?.difficultyAnalysis
    );


    const levels = [
      'Easy',
      'Medium',
      'Hard'
    ];


    return levels.map((level) => {

      const item =
        raw?.[level] ||
        raw?.[level.toLowerCase()] ||
        {};


      const accuracy = getPercentage(
        item?.accuracy,
        item?.percentage,
        typeof item === 'number'
          ? item
          : 0
      );


      return {
        difficulty: level,
        accuracy
      };

    });

  }, [stats]);


  /*
  |--------------------------------------------------------------------------
  | EXAM DATA
  |--------------------------------------------------------------------------
  */

  const examData = useMemo(() => {

    const raw = getArray(
      stats?.examStats,
      stats?.examPerformance,
      stats?.exams
    );


    return raw.map((item) => {

      return {
        exam:
          item?.exam ||
          item?.examName ||
          item?.name ||
          'Exam',

        accuracy: getPercentage(
          item?.accuracy,
          item?.percentage,
          item?.avgPercentage,
          item?.score
        ),

        tests: getNumber(
          item?.tests,
          item?.testCount,
          item?.attempts
        )
      };

    });

  }, [stats]);


  /*
  |--------------------------------------------------------------------------
  | RECENT TESTS
  |--------------------------------------------------------------------------
  */

  const recentTests = useMemo(() => {

    const raw = getArray(
      stats?.recentTests,
      stats?.recentAssessments,
      stats?.testHistory,
      stats?.history
    );


    return raw
      .slice(0, 10)
      .map((item, index) => {

        const percentage = getPercentage(
          item?.percentage,
          item?.score,
          item?.avgPercentage
        );


        return {
          id:
            item?._id ||
            item?.id ||
            index,

          title:
            item?.title ||
            item?.testTitle ||
            item?.name ||
            `Navta TEST ${index + 1}`,

          subject:
            item?.subject ||
            item?.subjectName ||
            'General',

          percentage,

          score:
            item?.score ??
            percentage,

          date:
            item?.date ||
            item?.submittedAt ||
            item?.createdAt ||
            '',

          passed:
            item?.passed ??
            item?.status === 'Passed' ??
            percentage >= 40
        };

      });

  }, [stats]);


  /*
  |--------------------------------------------------------------------------
  | RECOMMENDATIONS
  |--------------------------------------------------------------------------
  */

  const recommendations = useMemo(() => {

    const apiSuggestions = getArray(
      stats?.summary?.suggestions,
      stats?.suggestions,
      stats?.recommendations
    );


    if (apiSuggestions.length > 0) {

      return apiSuggestions.slice(0, 6);

    }


    const generated = [];


    const weakSubjects = subjectData
      .filter(
        (item) =>
          item.avgPercentage > 0 &&
          item.avgPercentage < 60
      )
      .sort(
        (a, b) =>
          a.avgPercentage -
          b.avgPercentage
      );


    weakSubjects.forEach((item) => {

      generated.push(
        `Focus on ${item.subject}. Your current accuracy is ${item.avgPercentage}%.`
      );

    });


    weakestChapters
      .slice(0, 3)
      .forEach((item) => {

        generated.push(
          `Revise ${item.chapter}${item.subject ? ` (${item.subject})` : ''}. Your chapter accuracy is ${item.accuracy}%.`
        );

      });


    if (
      overview.totalTests > 0 &&
      overview.totalTests < 3
    ) {

      generated.push(
        'Take more Navta TESTs to generate a more reliable performance trend.'
      );

    }


    if (
      overview.attempted > 0 &&
      overview.skipped > 0
    ) {

      generated.push(
        'Try to reduce skipped questions by improving time management during tests.'
      );

    }


    if (generated.length === 0) {

      generated.push(
        'Complete a Navta TEST to generate personalized recommendations.'
      );

    }


    return generated.slice(0, 6);

  }, [
    stats,
    subjectData,
    weakestChapters,
    overview
  ]);


  /*
  |--------------------------------------------------------------------------
  | OVERALL STATUS
  |--------------------------------------------------------------------------
  */

  const status = getStatus(
    overview.averageScore ||
    overview.accuracy
  );


  const StatusIcon = status.icon;


  /*
  |--------------------------------------------------------------------------
  | PIE DATA
  |--------------------------------------------------------------------------
  */

  const answerDistribution = [
    {
      name: 'Correct',
      value: overview.correct
    },
    {
      name: 'Wrong',
      value: overview.incorrect
    },
    {
      name: 'Skipped',
      value: overview.skipped
    }
  ].filter(
    (item) => item.value > 0
  );


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (

      <div className="flex h-[80vh] items-center justify-center">

        <div className="text-center">

          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto" />

          <p className="text-xs text-slate-400 mt-4">

            Analysing your Navta TEST performance...

          </p>

        </div>

      </div>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {

    return (

      <div className="space-y-6">

        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">

            <BarChart3 className="w-6 h-6 text-primary-500" />

            Performance Analytics

          </h1>

          <p className="text-xs text-slate-400 mt-1">

            Complete Navta TEST performance analysis.

          </p>

        </div>


        <div className="flex flex-col items-center justify-center min-h-[350px] rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/10 p-8 text-center">

          <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">

            Unable to load analytics

          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">

            {error}

          </p>

          <button
            onClick={handleRefresh}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-bold"
          >

            <RefreshCw className="w-4 h-4" />

            Try Again

          </button>

        </div>

      </div>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | MAIN UI
  |--------------------------------------------------------------------------
  */

  return (

    <div className="space-y-6 pb-10">


      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          <div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">

              <BarChart3 className="w-6 h-6 text-primary-500" />

              Navta TEST Analytics

            </h1>


            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">

              Complete analysis of your tests, subjects, chapters,
              accuracy and study gaps.

            </p>

          </div>


          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-primary-500 hover:text-primary-500 disabled:opacity-50"
          >

            <RefreshCw
              className={`w-4 h-4 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh Analysis

          </button>

        </div>

      </div>


      {/* ================================================================
          PERFORMANCE STATUS
      ================================================================= */}

      <div
        className={`rounded-2xl border p-5 ${status.className}`}
      >

        <div className="flex items-center gap-4">

          <div className="w-11 h-11 rounded-xl bg-white/50 dark:bg-black/10 flex items-center justify-center">

            <StatusIcon className="w-6 h-6" />

          </div>


          <div>

            <h2 className="font-extrabold text-sm">

              {status.label}

            </h2>


            <p className="text-xs opacity-80 mt-1">

              {status.description}

            </p>

          </div>

        </div>

      </div>


      {/* ================================================================
          OVERVIEW CARDS
      ================================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">


        <Card>

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs text-slate-400 font-semibold">

                Tests Completed

              </p>

              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">

                {formatNumber(
                  overview.totalTests
                )}

              </p>

            </div>


            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">

              <ClipboardCheck className="w-5 h-5 text-primary-500" />

            </div>

          </div>

        </Card>


        <Card>

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs text-slate-400 font-semibold">

                Average Score

              </p>

              <p className="text-2xl font-extrabold text-primary-500 mt-1">

                {formatNumber(
                  overview.averageScore
                )}%

              </p>

            </div>


            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">

              <Target className="w-5 h-5 text-blue-500" />

            </div>

          </div>

        </Card>


        <Card>

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs text-slate-400 font-semibold">

                Accuracy

              </p>

              <p className="text-2xl font-extrabold text-emerald-500 mt-1">

                {formatNumber(
                  overview.accuracy
                )}%

              </p>

            </div>


            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">

              <CheckCircle2 className="w-5 h-5 text-emerald-500" />

            </div>

          </div>

        </Card>


        <Card>

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs text-slate-400 font-semibold">

                Best Score

              </p>

              <p className="text-2xl font-extrabold text-amber-500 mt-1">

                {formatNumber(
                  overview.bestScore
                )}%

              </p>

            </div>


            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">

              <Trophy className="w-5 h-5 text-amber-500" />

            </div>

          </div>

        </Card>

      </div>


      {/* ================================================================
          QUESTION SUMMARY
      ================================================================= */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">


        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">

          <div className="flex items-center gap-2 text-xs text-slate-400">

            <Layers className="w-4 h-4" />

            Total Questions

          </div>


          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">

            {formatNumber(
              overview.totalQuestions
            )}

          </p>

        </div>


        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10 p-4">

          <div className="flex items-center gap-2 text-xs text-emerald-500">

            <CheckCircle2 className="w-4 h-4" />

            Correct

          </div>


          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">

            {formatNumber(
              overview.correct
            )}

          </p>

        </div>


        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/10 p-4">

          <div className="flex items-center gap-2 text-xs text-rose-500">

            <XCircle className="w-4 h-4" />

            Wrong

          </div>


          <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">

            {formatNumber(
              overview.incorrect
            )}

          </p>

        </div>


        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 p-4">

          <div className="flex items-center gap-2 text-xs text-amber-500">

            <CircleHelp className="w-4 h-4" />

            Skipped

          </div>


          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">

            {formatNumber(
              overview.skipped
            )}

          </p>

        </div>

      </div>


      {/* ================================================================
          TREND + ANSWER DISTRIBUTION
      ================================================================= */}

      <div className="grid lg:grid-cols-3 gap-6">


        <Card
          className="lg:col-span-2"
          title="Navta TEST Performance Trend"
          subtitle="Your score progression across recent tests"
        >

          <div className="h-72 mt-6">

            {trendData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={trendData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#334155"
                    opacity={0.3}
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    domain={[0, 100]}
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

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{
                      r: 4
                    }}
                    activeDot={{
                      r: 6
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            ) : (

              <div className="h-full flex flex-col items-center justify-center text-center">

                <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />

                <p className="text-sm font-semibold text-slate-500">

                  No performance trend yet

                </p>

                <p className="text-xs text-slate-400 mt-1">

                  Complete Navta TESTs to see your progress.

                </p>

              </div>

            )}

          </div>

        </Card>


        <Card
          title="Answer Analysis"
          subtitle="Correct, wrong and skipped questions"
        >

          <div className="h-72">

            {answerDistribution.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={answerDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >

                    {answerDistribution.map(
                      (entry, index) => (

                        <Cell
                          key={entry.name}
                          fill={
                            index === 0
                              ? '#10b981'
                              : index === 1
                              ? '#f43f5e'
                              : '#f59e0b'
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: '11px'
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>

            ) : (

              <div className="h-full flex items-center justify-center text-center">

                <p className="text-xs text-slate-400">

                  No question data available yet.

                </p>

              </div>

            )}

          </div>

        </Card>

      </div>


      {/* ================================================================
          SUBJECT PERFORMANCE
      ================================================================= */}

      <Card
        title="Subject Performance"
        subtitle="Complete subject-wise analysis from your Navta TEST attempts"
      >

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">

          {subjectData.map((subject) => (

            <div
              key={subject.subject}
              className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/30"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-bold text-slate-900 dark:text-white">

                    {subject.subject}

                  </p>

                  <p className="text-[10px] text-slate-400 mt-1">

                    {formatNumber(
                      subject.testCount
                    )} tests completed

                  </p>

                </div>


                <span
                  className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${getStrengthClasses(subject.strength)}`}
                >

                  {subject.strength}

                </span>

              </div>


              <div className="mt-5">

                <div className="flex items-end justify-between">

                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">

                    {formatNumber(
                      subject.avgPercentage
                    )}%

                  </span>


                  <span className="text-[10px] text-slate-400">

                    Accuracy

                  </span>

                </div>


                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-3 overflow-hidden">

                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${subject.avgPercentage}%`,
                      backgroundColor:
                        getSubjectColor(
                          subject.subject
                        )
                    }}
                  />

                </div>

              </div>


              <div className="grid grid-cols-3 gap-2 mt-5 text-center">

                <div>

                  <p className="text-sm font-bold text-emerald-500">

                    {formatNumber(
                      subject.correct
                    )}

                  </p>

                  <p className="text-[9px] text-slate-400 uppercase">

                    Correct

                  </p>

                </div>


                <div>

                  <p className="text-sm font-bold text-rose-500">

                    {formatNumber(
                      subject.incorrect
                    )}

                  </p>

                  <p className="text-[9px] text-slate-400 uppercase">

                    Wrong

                  </p>

                </div>


                <div>

                  <p className="text-sm font-bold text-amber-500">

                    {formatNumber(
                      subject.skipped
                    )}

                  </p>

                  <p className="text-[9px] text-slate-400 uppercase">

                    Skipped

                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

      </Card>


      {/* ================================================================
          SUBJECT BAR CHART
      ================================================================= */}

      <Card
        title="Subject Accuracy Comparison"
        subtitle="Average accuracy across Navta TEST submissions"
      >

        <div className="h-72 mt-5">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={subjectData}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 0
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#334155"
                opacity={0.3}
              />

              <XAxis
                dataKey="subject"
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
              />

              <YAxis
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                domain={[0, 100]}
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

              <Bar
                dataKey="avgPercentage"
                radius={[
                  10,
                  10,
                  0,
                  0
                ]}
                barSize={42}
              >

                {subjectData.map(
                  (entry) => (

                    <Cell
                      key={entry.subject}
                      fill={getSubjectColor(
                        entry.subject
                      )}
                    />

                  )
                )}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>

      </Card>


      {/* ================================================================
          CHAPTER ANALYSIS
      ================================================================= */}

      <div className="grid lg:grid-cols-2 gap-6">


        {/* STRONG CHAPTERS */}

        <Card
          title="Strongest Chapters"
          subtitle="Topics where you are performing well"
        >

          <div className="space-y-3 mt-4">

            {strongestChapters.length > 0 ? (

              strongestChapters.map(
                (chapter, index) => (

                  <div
                    key={`${chapter.chapter}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
                  >

                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">

                      <Award className="w-4 h-4 text-emerald-500" />

                    </div>


                    <div className="flex-1 min-w-0">

                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">

                        {chapter.chapter}

                      </p>


                      <p className="text-[10px] text-slate-400">

                        {chapter.subject || 'General'}

                      </p>

                    </div>


                    <p className="text-sm font-extrabold text-emerald-500">

                      {chapter.accuracy}%

                    </p>

                  </div>

                )
              )

            ) : (

              <div className="py-8 text-center">

                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />

                <p className="text-xs text-slate-400">

                  Chapter analysis will appear after test attempts.

                </p>

              </div>

            )}

          </div>

        </Card>


        {/* WEAK CHAPTERS */}

        <Card
          title="Chapters Needing Attention"
          subtitle="Topics that should be prioritized for revision"
        >

          <div className="space-y-3 mt-4">

            {weakestChapters.length > 0 ? (

              weakestChapters.map(
                (chapter, index) => (

                  <div
                    key={`${chapter.chapter}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10"
                  >

                    <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center">

                      <AlertCircle className="w-4 h-4 text-rose-500" />

                    </div>


                    <div className="flex-1 min-w-0">

                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">

                        {chapter.chapter}

                      </p>


                      <p className="text-[10px] text-slate-400">

                        {chapter.subject || 'General'}

                      </p>

                    </div>


                    <p className="text-sm font-extrabold text-rose-500">

                      {chapter.accuracy}%

                    </p>

                  </div>

                )
              )

            ) : (

              <div className="py-8 text-center">

                <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />

                <p className="text-xs text-slate-400">

                  Chapter analysis will appear after test attempts.

                </p>

              </div>

            )}

          </div>

        </Card>

      </div>


      {/* ================================================================
          DIFFICULTY ANALYSIS
      ================================================================= */}

      <Card
        title="Difficulty Analysis"
        subtitle="How you perform across different question difficulty levels"
      >

        <div className="grid md:grid-cols-3 gap-5 mt-5">

          {difficultyData.map((item) => {

            const color =
              item.difficulty === 'Easy'
                ? '#10b981'
                : item.difficulty === 'Medium'
                ? '#f59e0b'
                : '#f43f5e';


            return (

              <div
                key={item.difficulty}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800"
              >

                <div className="flex justify-between items-center">

                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">

                    {item.difficulty}

                  </span>


                  <span
                    className="text-lg font-extrabold"
                    style={{
                      color
                    }}
                  >

                    {item.accuracy}%

                  </span>

                </div>


                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">

                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.accuracy}%`,
                      backgroundColor: color
                    }}
                  />

                </div>


                <p className="text-[10px] text-slate-400 mt-3">

                  {item.accuracy >= 80
                    ? 'Excellent control'
                    : item.accuracy >= 60
                    ? 'Room for improvement'
                    : item.accuracy > 0
                    ? 'Needs focused practice'
                    : 'No data available'}

                </p>

              </div>

            );

          })}

        </div>

      </Card>


      {/* ================================================================
          EXAM ANALYSIS
      ================================================================= */}

      {examData.length > 0 && (

        <Card
          title="Exam-wise Analysis"
          subtitle="Performance across your target examinations"
        >

          <div className="grid md:grid-cols-3 gap-4 mt-5">

            {examData.map((exam) => (

              <div
                key={exam.exam}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800"
              >

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">

                    <GraduationCap className="w-5 h-5 text-primary-500" />

                  </div>


                  <div>

                    <p className="font-bold text-sm text-slate-900 dark:text-white">

                      {exam.exam}

                    </p>


                    <p className="text-[10px] text-slate-400">

                      {exam.tests} tests

                    </p>

                  </div>

                </div>


                <p className="text-2xl font-extrabold text-primary-500 mt-5">

                  {exam.accuracy}%

                </p>


                <p className="text-[10px] text-slate-400">

                  Average accuracy

                </p>

              </div>

            ))}

          </div>

        </Card>

      )}


      {/* ================================================================
          RECOMMENDATIONS
      ================================================================= */}

      <Card
        title="Navta Recommendations"
        subtitle="Personalized study guidance based on your test outcomes"
      >

        <div className="grid md:grid-cols-2 gap-4 mt-5">

          {recommendations.map(
            (recommendation, index) => (

              <div
                key={index}
                className="flex gap-3 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/30"
              >

                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">

                  <Lightbulb className="w-5 h-5 text-amber-500" />

                </div>


                <div>

                  <p className="text-[10px] font-black uppercase text-amber-500">

                    Recommendation {index + 1}

                  </p>


                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-relaxed mt-1">

                    {recommendation}

                  </p>

                </div>

              </div>

            )
          )}

        </div>

      </Card>


      {/* ================================================================
          RECENT TESTS
      ================================================================= */}

      <Card
        title="Recent Navta TESTs"
        subtitle="Your latest completed assessments"
      >

        {recentTests.length > 0 ? (

          <div className="overflow-x-auto mt-4">

            <table className="w-full text-left text-sm">

              <thead>

                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">

                  <th className="pb-3">
                    Test
                  </th>

                  <th className="pb-3">
                    Subject
                  </th>

                  <th className="pb-3">
                    Score
                  </th>

                  <th className="pb-3">
                    Date
                  </th>

                  <th className="pb-3 text-right">
                    Status
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">

                {recentTests.map(
                  (test) => (

                    <tr key={test.id}>

                      <td className="py-4">

                        <p className="font-bold text-slate-800 dark:text-slate-200">

                          {test.title}

                        </p>

                      </td>


                      <td className="py-4 text-slate-500">

                        {test.subject}

                      </td>


                      <td className="py-4">

                        <span className="font-extrabold text-primary-500">

                          {test.percentage}%

                        </span>

                      </td>


                      <td className="py-4 text-xs text-slate-400">

                        {test.date
                          ? new Date(
                              test.date
                            ).toLocaleDateString()
                          : '—'}

                      </td>


                      <td className="py-4 text-right">

                        {test.passed ? (

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">

                            <CheckCircle2 className="w-4 h-4" />

                            Passed

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500">

                            <AlertCircle className="w-4 h-4" />

                            Needs Practice

                          </span>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        ) : (

          <div className="py-12 text-center">

            <ClipboardCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />

            <p className="text-sm font-semibold text-slate-500">

              No completed Navta TESTs yet

            </p>


            <p className="text-xs text-slate-400 mt-1">

              Your recent tests will appear here.

            </p>

          </div>

        )}

      </Card>


      {/* ================================================================
          FINAL SUMMARY
      ================================================================= */}

      <div className="rounded-3xl bg-gradient-to-br from-primary-500/10 to-blue-500/5 border border-primary-500/10 p-6">

        <div className="flex items-start gap-4">

          <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">

            <Brain className="w-6 h-6 text-primary-500" />

          </div>


          <div>

            <h3 className="font-extrabold text-slate-900 dark:text-white">

              Your Navta TEST Summary

            </h3>


            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">

              {overview.totalTests > 0
                ? `You have completed ${overview.totalTests} Navta TEST${overview.totalTests === 1 ? '' : 's'} with an average score of ${overview.averageScore}%. Your current accuracy is ${overview.accuracy}%. Use the chapter and subject analysis above to focus your preparation.`
                : 'Complete your first Navta TEST to start building your personalized performance analytics.'}

            </p>

          </div>

        </div>

      </div>

    </div>

  );

}
