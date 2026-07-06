import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { teacherAPI, contentAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { BookOpen, FileText, HelpCircle, Eye, ArrowLeft, PlusSquare } from 'lucide-react';

export default function ExternalTeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('dashboard');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  // Question Form State
  const [qType, setQType] = useState('mcq');
  const [qSubj, setQSubj] = useState('');
  const [qChap, setQChap] = useState('');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qCorrectAnswer, setQCorrectAnswer] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState('medium');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await teacherAPI.getQuestions();
      setQuestions(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    contentAPI.getSubjects().then(res => setSubjects(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeView === 'questions') {
      fetchQuestions();
    }
  }, [activeView]);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await teacherAPI.createQuestion({
        questionType: qType,
        text: qText,
        subject: qSubj || undefined,
        chapter: qChap || undefined,
        options: qType === 'mcq' ? qOptions : undefined,
        correctOption: qType === 'mcq' ? Number(qCorrectIndex) : undefined,
        correctAnswer: qType !== 'mcq' ? qCorrectAnswer : undefined,
        explanation: qExplanation,
        difficulty: qDifficulty
      });
      alert('Question added successfully!');
      setQText('');
      setQExplanation('');
      setQCorrectAnswer('');
      setQOptions(['', '', '', '']);
      setQCorrectIndex(0);
      fetchQuestions();
    } catch (err) {
      alert(err.message);
    }
  };

  const resources = [
    {
      title: 'Study Notes & Materials',
      description: 'View chapters, markdown notes, and PDF summaries uploaded by internal faculty.',
      icon: BookOpen,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
      action: () => navigate('/notes')
    },
    {
      title: 'PYQ Papers',
      description: 'Browse past year exam papers linked to subjects and chapters.',
      icon: FileText,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20',
      action: () => navigate('/pyqs')
    },
    {
      title: 'Question Bank',
      description: 'View the centralized repository and frame new MCQs, short, and long questions.',
      icon: HelpCircle,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20',
      action: () => setActiveView('questions')
    }
  ];

  if (activeView === 'questions') {
    return (
      <div className="space-y-6">
        <button onClick={() => setActiveView('dashboard')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        
        <Card title="Add New Question" subtitle="Frame questions to be assigned to topics or stored generally">
          <form onSubmit={handleAddQuestion} className="space-y-4 mt-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Question Type</label>
                <select
                  value={qType}
                  onChange={(e) => setQType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="short">Short Answer</option>
                  <option value="long">Long Answer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Subject (Optional)</label>
                <select
                  value={qSubj}
                  onChange={(e) => setQSubj(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                >
                  <option value="">General (No Subject)</option>
                  {subjects.map((sub) => (
                    <option key={sub._id || sub.id} value={sub._id || sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Question Text</label>
              <textarea
                required
                rows="3"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Enter the question here..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            {qType === 'mcq' ? (
              <div className="space-y-3 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">MCQ Options</label>
                {qOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={qCorrectIndex === i}
                      onChange={() => setQCorrectIndex(i)}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...qOptions];
                        newOpts[i] = e.target.value;
                        setQOptions(newOpts);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-500">Select the radio button next to the correct option.</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Correct Answer / Marking Key</label>
                <textarea
                  required
                  rows="3"
                  value={qCorrectAnswer}
                  onChange={(e) => setQCorrectAnswer(e.target.value)}
                  placeholder="Enter the expected answer or marking key..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Difficulty</label>
                <select
                  value={qDifficulty}
                  onChange={(e) => setQDifficulty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Explanation (Optional)</label>
              <textarea
                rows="2"
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="Explain the answer..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <Button type="submit" icon={PlusSquare}>Add Question</Button>
          </form>
        </Card>

        <Card title="Question Bank" subtitle="Browse all created questions in the repository">
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading questions...</div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Question</th>
                    <th className="pb-3">Subject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                  {questions.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-slate-500">No questions found</td>
                    </tr>
                  ) : (
                    questions.map((q) => (
                      <tr key={q._id || q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 font-medium uppercase text-xs">{q.questionType || 'MCQ'}</td>
                        <td className="py-3 truncate max-w-xl">{q.text}</td>
                        <td className="py-3">{q.subject?.name || q.subject || 'General'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800/40 relative overflow-hidden shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Eye className="w-8 h-8 text-primary-500" />
          Welcome, {user?.name || 'Guest Faculty'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          As an external teacher, you have access to browse Navta's extensive study material, past year papers, and frame questions in the question bank. Select a module below to get started.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        {resources.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx} 
              onClick={item.action}
              className="group cursor-pointer bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:border-primary-100 dark:hover:border-primary-900/50 transition-all duration-300"
            >
              <div className={`p-3 rounded-2xl w-fit ${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
                Browse Content →
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
