import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { contentAPI, studentAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import {
  ClipboardCheck,
  Timer,
  Award,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  HelpCircle,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

export default function AssessmentPage() {
  const { updateProfileStats } = useAuth();
  
  // Browsing states
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active testing states
  const [activeTest, setActiveTest] = useState(null); // Hydrated test details with questions
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({}); // { questionId: optionIndex }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [timerIntervalId, setTimerIntervalId] = useState(null);

  // Results display state
  const [scoreResult, setScoreResult] = useState(null); // Graded result scorecard from API

  useEffect(() => {
    contentAPI.getSubjects().then((res) => {
      setSubjects(res.data || []);
      if (res.data?.length > 0) {
        setSelectedSubject(res.data[0]._id);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      contentAPI.getTests(selectedSubject).then((res) => {
        setTests(res.data || []);
      }).catch(err => console.error(err));
    }
  }, [selectedSubject]);

  // Handle countdown timer ticks
  useEffect(() => {
    if (isTestRunning && timeLeft > 0) {
      const id = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(id);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerIntervalId(id);
      return () => clearInterval(id);
    }
  }, [isTestRunning, timeLeft]);

  const handleStartTest = async (testId) => {
    try {
      setLoading(true);
      const res = await contentAPI.getTestDetail(testId);
      const testDetail = res.data;
      
      setActiveTest(testDetail);
      setCurrentQIdx(0);
      setSelectedOptions({});
      setTimeLeft(testDetail.duration * 60);
      setIsTestRunning(true);
      setScoreResult(null);
    } catch (err) {
      alert('Failed to load quiz detail: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qId, optIdx) => {
    setSelectedOptions({
      ...selectedOptions,
      [qId]: optIdx
    });
  };

  const handleNextQuestion = () => {
    if (currentQIdx < activeTest.questions.length - 1) {
      setCurrentQIdx(currentQIdx + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQIdx > 0) {
      setCurrentQIdx(currentQIdx - 1);
    }
  };

  const handleAutoSubmit = () => {
    alert('Time limit reached! Submitting answers automatically...');
    submitTestAnswers();
  };

  const submitTestAnswers = async () => {
    if (timerIntervalId) clearInterval(timerIntervalId);
    
    const formattedAnswers = activeTest.questions.map((q) => ({
      questionId: q._id,
      selectedOption: selectedOptions[q._id] !== undefined ? selectedOptions[q._id] : null
    }));

    const timeTaken = (activeTest.duration * 60) - timeLeft;

    try {
      setLoading(true);
      const response = await studentAPI.submitTest(activeTest._id, formattedAnswers, timeTaken);
      setScoreResult(response.data);
      setIsTestRunning(false);
      
      // Update global context coin/XP states
      if (response.data.newCoins !== undefined) {
        updateProfileStats(response.data.newCoins, response.data.newXp, response.data.newLevel);
      }
    } catch (err) {
      alert('Submission failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExitTest = () => {
    if (window.confirm('Are you sure you want to exit? Your progress on this quiz session will be lost.')) {
      setIsTestRunning(false);
      setActiveTest(null);
      setScoreResult(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  // 1. DISTRACTION-FREE QUIZ RUNNER INTERFACE
  if (isTestRunning && activeTest) {
    const currentQuestion = activeTest.questions[currentQIdx];
    const totalQ = activeTest.questions.length;
    const progressPercent = Math.round(((currentQIdx + 1) / totalQ) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn py-6">
        {/* Header timer card */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white truncate max-w-[250px]">{activeTest.title}</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Question {currentQIdx + 1} of {totalQ}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 font-mono text-sm font-bold border border-rose-100 dark:border-rose-900/30">
            <Timer className="w-4 h-4 animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar value={currentQIdx + 1} max={totalQ} color="bg-primary-500" />

        {/* Question Panel */}
        <Card className="p-6">
          <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-2">Difficulty: {currentQuestion.difficulty || 'medium'}</p>
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed mb-6">
            {currentQuestion.text}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOptions[currentQuestion._id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(currentQuestion._id, idx)}
                  className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all duration-150 flex items-center gap-3 ${
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-500 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500/10'
                      : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className={`w-6 h-6 flex items-center justify-center rounded-xl font-black text-xs ${
                    isSelected ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button variant="secondary" onClick={handleExitTest} className="text-xs">Quit Quiz</Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentQIdx === 0}
              onClick={handlePrevQuestion}
              icon={ArrowLeft}
              className="text-xs"
            >
              Previous
            </Button>

            {currentQIdx < totalQ - 1 ? (
              <Button
                onClick={handleNextQuestion}
                icon={ArrowRight}
                className="text-xs"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={() => {
                  if (window.confirm('Submit your answers now for evaluation?')) submitTestAnswers();
                }}
                icon={ClipboardCheck}
                className="text-xs"
              >
                Submit Test
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. DETAILED GRADING REVIEW SCREEN
  if (scoreResult && activeTest) {
    const { result, xpEarned, coinsEarned } = scoreResult;
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn py-6">
        {/* Score summary panel */}
        <Card className="text-center p-8 border border-slate-100 dark:border-slate-800">
          <div className="inline-flex p-4 rounded-full bg-primary-50 dark:bg-primary-950/20 text-primary-500 mb-4 animate-bounce">
            <Award className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Assessment Submitted!</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{activeTest.title}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto mt-8">
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
              <p className={`text-2xl font-black ${result.isPassed ? 'text-emerald-500' : 'text-rose-500'}`}>{result.percentage}%</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Your Score</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
              <p className="text-2xl font-black text-slate-700 dark:text-slate-200">{result.correctAnswers} / {result.totalQuestions}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Accuracy</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
              <p className="text-2xl font-black text-primary-500">+{xpEarned}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">XP Points</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
              <p className="text-2xl font-black text-yellow-500">+{coinsEarned}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Coins Earned</p>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => { setActiveTest(null); setScoreResult(null); }} variant="secondary">Back to Quizzes</Button>
            <Button onClick={() => handleStartTest(activeTest._id)} variant="outline" icon={RotateCcw}>Retake Quiz</Button>
          </div>
        </Card>

        {/* Detailed question-by-question explanations review */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white pl-1 mt-8">Review Answers Explanation</h3>
        <div className="space-y-4">
          {activeTest.questions.map((q, idx) => {
            const userAnswer = result.answers.find(a => a.question === q._id);
            const isCorrect = userAnswer?.isCorrect;
            
            return (
              <Card key={q._id} className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                    Q{idx + 1}. {q.text}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 mt-1 ${
                    isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                {/* Options List */}
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  {q.options.map((opt, oIdx) => {
                    const isCorrectOption = q.correctOption === oIdx;
                    const isUserChoice = userAnswer?.selectedOption === oIdx;
                    
                    let borderStyles = 'border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400';
                    if (isCorrectOption) {
                      borderStyles = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold';
                    } else if (isUserChoice && !isCorrect) {
                      borderStyles = 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold';
                    }

                    return (
                      <div key={oIdx} className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${borderStyles}`}>
                        <span>{opt}</span>
                        {isCorrectOption && <Check className="w-4 h-4 text-emerald-500" />}
                        {isUserChoice && !isCorrect && <X className="w-4 h-4 text-rose-500" />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanatory notes */}
                {q.explanation && (
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800/40 leading-relaxed flex items-start gap-2">
                    <HelpCircle className="w-4.5 h-4.5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-slate-700 dark:text-slate-350">Explanation:</span> {q.explanation}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. CORE QUIZ BROWSER INDEX
  return (
    <div className="space-y-6">
      {/* Title Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary-500" />
            Chapter Assessments
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Browse and attempt chapter quizzes and mock tests.
          </p>
        </div>

        <div className="w-full md:w-56">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-primary-500"
          >
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Test cards grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((t) => (
          <Card key={t._id} className="hover:-translate-y-1 transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 text-[9px] font-black uppercase tracking-wider">
                {t.type}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-1 truncate">{t.title}</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">{t.description}</p>

            {t.chapter?.title && (
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-2">Chapter: {t.chapter.title}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-6 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-slate-350" />
                <span>{t.duration} Mins</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <TrendingUp className="w-3.5 h-3.5 text-slate-350" />
                <span>Pass: {t.passingScore}%</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40">
              {t.questions?.length > 0 ? (
                <Button onClick={() => handleStartTest(t._id)} className="w-full text-xs py-2">
                  Start Assessment
                </Button>
              ) : (
                <Button disabled className="w-full text-xs py-2">
                  Empty test
                </Button>
              )}
            </div>
          </Card>
        ))}

        {tests.length === 0 && (
          <div className="col-span-full text-center py-12">
            <AlertTriangle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No Assessments Listed</p>
            <p className="text-xs text-slate-455 mt-1">Check back later for tests or quizzes uploaded in this subject.</p>
          </div>
        )}
      </div>
    </div>
  );
}
