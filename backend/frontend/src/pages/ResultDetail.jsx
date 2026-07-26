import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { Award, Timer, ArrowLeft, Check, X, HelpCircle } from 'lucide-react';

export default function ResultDetail() {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resultId) {
      studentAPI.getResultDetail(resultId).then((res) => {
        setResult(res.data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [resultId]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!result || !result.test) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500 dark:text-slate-400">Scorecard details could not be loaded.</p>
        <Link to="/dashboard" className="text-xs text-primary-500 mt-2 block font-bold">Back to Dashboard</Link>
      </div>
    );
  }

  const test = result.test;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      {/* Header back button */}
      <div className="flex items-center gap-2">
        <Link to="/dashboard">
          <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Scorecard Details</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-wide">{test.title}</p>
        </div>
      </div>

      {/* Accuracy metrics card */}
      <Card className="text-center p-8">
        <div className="inline-flex p-4 rounded-full bg-primary-50 dark:bg-primary-950/20 text-primary-500 mb-4">
          <Award className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review Summary</h2>
        <p className="text-xs text-slate-400 mt-1 capitalize">{test.type || 'Quiz'} scorecard details</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto mt-6">
          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
            <p className={`text-2xl font-black ${result.isPassed ? 'text-emerald-500' : 'text-rose-500'}`}>{result.percentage}%</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Score Percent</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
            <p className="text-2xl font-black text-slate-700 dark:text-slate-200">{result.correctAnswers} / {result.totalQuestions}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Correct Answers</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
            <p className="text-2xl font-black text-slate-700 dark:text-slate-200">{Math.round(result.timeTaken / 60)}m</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Time Taken</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
            <p className={`text-2xl font-black ${result.isPassed ? 'text-emerald-500' : 'text-rose-550'}`}>
              {result.isPassed ? 'PASSED' : 'FAILED'}
            </p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Status</p>
          </div>
        </div>
      </Card>

      {/* Answer checklist details */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white pl-1">Explanations Breakdown</h3>
      <div className="space-y-4">
        {test.questions?.map((q, idx) => {
          const userAnswer = result.answers.find(a => a.question === q._id);
          const isCorrect = userAnswer?.isCorrect;
          
          return (
            <Card key={q._id} className="p-6">
              <div className="flex justify-between items-start gap-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                  Q{idx + 1}. {q.text}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 mt-0.5 ${
                  isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3 mt-4">
                {q.options.map((opt, oIdx) => {
                  const isCorrectOption = q.correctOption === oIdx;
                  const isUserChoice = userAnswer?.selectedOption === oIdx;

                  let borderStyles = 'border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 text-slate-655 dark:text-slate-400';
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
