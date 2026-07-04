import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherAPI, contentAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  Users,
  CheckCircle,
  FileSpreadsheet,
  PlusCircle,
  BookOpen,
  FileText,
  HelpCircle,
  Upload,
  UserCheck
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'chapter', 'note', 'pyq', 'quiz'

  // Form states
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  
  // Note Form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notePdf, setNotePdf] = useState('');

  // Chapter Form
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterNum, setChapterNum] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');

  // PYQ Form
  const [pyqYear, setPyqYear] = useState('');
  const [pyqExam, setPyqExam] = useState('');
  const [pyqTitle, setPyqTitle] = useState('');
  const [pyqPdf, setPyqPdf] = useState('');

  // Quiz Form
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizDuration, setQuizDuration] = useState('10');
  const [quizPass, setQuizPass] = useState('40');
  const [quizQuestions, setQuizQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctOption: 0, explanation: '' }
  ]);

  const fetchMetrics = async () => {
    try {
      const res = await teacherAPI.getStudentMetrics();
      setMetrics(res.data);
      
      const subs = await contentAPI.getSubjects();
      setSubjects(subs.data || []);
      if (subs.data?.length > 0) {
        setSelectedSubject(subs.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Update chapters when subject changes
  useEffect(() => {
    if (selectedSubject) {
      contentAPI.getChapters(selectedSubject).then(res => {
        setChapters(res.data || []);
        if (res.data?.length > 0) {
          setSelectedChapter(res.data[0]._id);
        } else {
          setSelectedChapter('');
        }
      });
    }
  }, [selectedSubject]);

  const handleAddChapter = async (e) => {
    e.preventDefault();
    try {
      await teacherAPI.createChapter({
        subjectId: selectedSubject,
        title: chapterTitle,
        chapterNumber: chapterNum,
        description: chapterDesc
      });
      alert('Chapter created successfully!');
      setChapterTitle('');
      setChapterNum('');
      setChapterDesc('');
      fetchMetrics();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedChapter) {
      alert('Please select a chapter first.');
      return;
    }
    try {
      await teacherAPI.createNote({
        chapterId: selectedChapter,
        title: noteTitle,
        content: noteContent,
        pdfUrl: notePdf
      });
      alert('Study Notes uploaded successfully!');
      setNoteTitle('');
      setNoteContent('');
      setNotePdf('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddPYQ = async (e) => {
    e.preventDefault();
    try {
      await teacherAPI.createPYQ({
        subjectId: selectedSubject,
        chapterId: selectedChapter || undefined,
        year: pyqYear,
        examName: pyqExam,
        title: pyqTitle,
        pdfUrl: pyqPdf
      });
      alert('PYQ paper added successfully!');
      setPyqYear('');
      setPyqExam('');
      setPyqTitle('');
      setPyqPdf('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuizQuestionChange = (index, field, value, optIdx = null) => {
    const updated = [...quizQuestions];
    if (optIdx !== null) {
      updated[index].options[optIdx] = value;
    } else {
      updated[index][field] = value;
    }
    setQuizQuestions(updated);
  };

  const addQuestionField = () => {
    setQuizQuestions([...quizQuestions, { text: '', options: ['', '', '', ''], correctOption: 0, explanation: '' }]);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      await teacherAPI.createTest({
        title: quizTitle,
        description: quizDesc,
        subjectId: selectedSubject,
        chapterId: selectedChapter || undefined,
        duration: quizDuration,
        type: 'Quiz',
        questions: quizQuestions,
        passingScore: quizPass
      });
      alert('Interactive Quiz created successfully!');
      setQuizTitle('');
      setQuizDesc('');
      setQuizQuestions([{ text: '', options: ['', '', '', ''], correctOption: 0, explanation: '' }]);
      fetchMetrics();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome details */}
      <div className="glass rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800/40 relative overflow-hidden shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome back, Educator {user?.name}!
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Manage notes repositories, draft chapter questions, structure assessment times, and monitor student metrics.
        </p>
      </div>

      {/* Classroom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics?.studentsCount || 0}</p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Students Enrolled</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics?.totalSubmissions || 0}</p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Submissions Evaluated</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics?.passPercentage || 0}%</p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Classroom Pass Rate</p>
          </div>
        </Card>
      </div>

      {/* Upload Shortcuts & Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'stats', label: 'Student Performance', icon: UserCheck },
          { id: 'chapter', label: 'Add Chapter', icon: PlusCircle },
          { id: 'note', label: 'Upload Note', icon: BookOpen },
          { id: 'pyq', label: 'Upload PYQ Paper', icon: FileText },
          { id: 'quiz', label: 'Build Quiz', icon: HelpCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/10'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* DYNAMIC TAB CONTROLLERS */}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" title="Class Enrolment Logs" subtitle="Lists overall XP metrics and levels reached">
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">XP Points</th>
                    <th className="pb-3">Milestone Level</th>
                    <th className="pb-3 text-right">Badges Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                  {metrics?.students?.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{s.name}</td>
                      <td className="py-3">{s.xp} XP</td>
                      <td className="py-3">Level {s.level}</td>
                      <td className="py-3 text-right font-bold">{s.badgesCount} Badges</td>
                    </tr>
                  ))}
                  {(!metrics?.students || metrics.students.length === 0) && (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400">No students registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Recent Quiz Attempts" subtitle="Live feed of student evaluations">
            <div className="mt-4 space-y-4">
              {metrics?.recentSubmissions?.map((sub) => (
                <div key={sub.id} className="text-xs p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/40">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-white">{sub.studentName}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${sub.isPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {sub.isPassed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">{sub.testTitle} • {sub.percentage}%</p>
                  <p className="text-[10px] text-slate-400 mt-1">{sub.date}</p>
                </div>
              ))}
              {(!metrics?.recentSubmissions || metrics.recentSubmissions.length === 0) && (
                <p className="text-xs text-center text-slate-400 py-6">No test submissions evaluated yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Chapter Upload Tab */}
      {activeTab === 'chapter' && (
        <Card title="Create New Chapter Module" subtitle="Chapters organize course content and exams">
          <form onSubmit={handleAddChapter} className="space-y-4 mt-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              >
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Chapter Title</label>
                <input
                  type="text"
                  required
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="e.g. Laws of Motion"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Number</label>
                <input
                  type="number"
                  required
                  value={chapterNum}
                  onChange={(e) => setChapterNum(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Description Summary</label>
              <textarea
                required
                rows="3"
                value={chapterDesc}
                onChange={(e) => setChapterDesc(e.target.value)}
                placeholder="Give a brief summary of what this chapter covers..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <Button type="submit" icon={PlusCircle}>Create Chapter</Button>
          </form>
        </Card>
      )}

      {/* Note Upload Tab */}
      {activeTab === 'note' && (
        <Card title="Upload Study Note Material" subtitle="Upload reference text summaries and PDF attachments">
          <form onSubmit={handleAddNote} className="space-y-4 mt-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                >
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Chapter Link</label>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                >
                  {chapters.map(c => <option key={c._id} value={c._id}>Ch {c.chapterNumber}: {c.title}</option>)}
                  {chapters.length === 0 && <option value="">No chapters found</option>}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Note Title</label>
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. Newton's Laws Summary Sheet"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Notes Text Content (Markdown / HTML supported)</label>
              <textarea
                required
                rows="5"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write detailed reference guidelines or formulas here..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">PDF Download Link (Optional)</label>
              <input
                type="url"
                value={notePdf}
                onChange={(e) => setNotePdf(e.target.value)}
                placeholder="https://example.com/notes.pdf"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <Button type="submit" icon={Upload}>Upload Study Note</Button>
          </form>
        </Card>
      )}

      {/* PYQ Upload Tab */}
      {activeTab === 'pyq' && (
        <Card title="Upload Past Year Exam Paper (PYQ)" subtitle="Provide question sheets from past CBSE, JEE, or NEET examinations">
          <form onSubmit={handleAddPYQ} className="space-y-4 mt-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                >
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Chapter Link (Optional)</label>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                >
                  <option value="">None (Subject-wide paper)</option>
                  {chapters.map(c => <option key={c._id} value={c._id}>Ch {c.chapterNumber}: {c.title}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Exam Year</label>
                <input
                  type="number"
                  required
                  value={pyqYear}
                  onChange={(e) => setPyqYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Exam Board / Name</label>
                <input
                  type="text"
                  required
                  value={pyqExam}
                  onChange={(e) => setPyqExam(e.target.value)}
                  placeholder="e.g. CBSE Boards, JEE Mains"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Paper Title</label>
              <input
                type="text"
                required
                value={pyqTitle}
                onChange={(e) => setPyqTitle(e.target.value)}
                placeholder="e.g. CBSE Chemistry XII 2024 Final Paper"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Paper PDF Link</label>
              <input
                type="url"
                required
                value={pyqPdf}
                onChange={(e) => setPyqPdf(e.target.value)}
                placeholder="https://example.com/pyq.pdf"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <Button type="submit" icon={Upload}>Upload PYQ paper</Button>
          </form>
        </Card>
      )}

      {/* Quiz Creator Tab */}
      {activeTab === 'quiz' && (
        <Card title="Build Interactive Assessment Quiz" subtitle="Add multiple-choice questions with answer keys and timers">
          <form onSubmit={handleCreateQuiz} className="space-y-6 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                  >
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Quiz Title</label>
                  <input
                    type="text"
                    required
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="e.g. Laws of Motion Quiz"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Chapter Link</label>
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="">None (Subject-wide Quiz)</option>
                    {chapters.map(c => <option key={c._id} value={c._id}>Ch {c.chapterNumber}: {c.title}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                    <input
                      type="number"
                      required
                      value={quizDuration}
                      onChange={(e) => setQuizDuration(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Passing Score (%)</label>
                    <input
                      type="number"
                      required
                      value={quizPass}
                      onChange={(e) => setQuizPass(e.target.value)}
                      placeholder="40"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Quiz Description</label>
              <textarea
                rows="2"
                value={quizDesc}
                onChange={(e) => setQuizDesc(e.target.value)}
                placeholder="Give descriptive rules or tips for taking this assessment..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            {/* Questions Builder list */}
            <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Questions List</h3>
                <Button variant="secondary" onClick={addQuestionField} className="px-3 py-1.5 text-xs" icon={PlusCircle}>
                  Add Question
                </Button>
              </div>

              {quizQuestions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/50 space-y-4">
                  <p className="text-sm font-bold text-primary-500">Question #{qIdx + 1}</p>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Question Text</label>
                    <input
                      type="text"
                      required
                      value={q.text}
                      onChange={(e) => handleQuizQuestionChange(qIdx, 'text', e.target.value)}
                      placeholder="Write the question prompt..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx}>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Option {String.fromCharCode(65 + oIdx)}</label>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleQuizQuestionChange(qIdx, 'options', e.target.value, oIdx)}
                          placeholder={`Option ${oIdx + 1}`}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Correct Answer Index</label>
                      <select
                        value={q.correctOption}
                        onChange={(e) => handleQuizQuestionChange(qIdx, 'correctOption', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                      >
                        <option value="0">Option A</option>
                        <option value="1">Option B</option>
                        <option value="2">Option C</option>
                        <option value="3">Option D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Explanation Description</label>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => handleQuizQuestionChange(qIdx, 'explanation', e.target.value)}
                        placeholder="Explain why this option is correct..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" icon={PlusCircle}>Compile and Save Quiz</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
