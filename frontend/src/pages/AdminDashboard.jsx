import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, contentAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  Users,
  Settings,
  PlusSquare,
  Award,
  ShieldCheck,
  TrendingUp,
  Trash2,
  Check,
  X,
  BookOpen,
  PlusCircle,
  FileText,
  HelpCircle,
  Upload
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('stats'); // 'stats', 'users', 'studyMaterial', 'reward', 'questions'
  
  // Student Edit State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editCoins, setEditCoins] = useState('');
  const [editXp, setEditXp] = useState('');
  const [editLevel, setEditLevel] = useState('');

  // User Form
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState('student');

  // Subject Form
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subCat, setSubCat] = useState('Science');

  // Reward Form
  const [rewTitle, setRewTitle] = useState('');
  const [rewDesc, setRewDesc] = useState('');
  const [rewCoins, setRewCoins] = useState('');
  const [rewBadge, setRewBadge] = useState('star');
  const [rewType, setRewType] = useState('badge');

  // Question Form
  const [qType, setQType] = useState('mcq');
  const [qText, setQText] = useState('');
  const [qSubj, setQSubj] = useState('');
  const [qChap, setQChap] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qCorrectAnswer, setQCorrectAnswer] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState('medium');

  // Note Form
  const [chapters, setChapters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
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
  const [quizDuration, setQuizDuration] = useState('');
  const [quizPass, setQuizPass] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([
    { questionType: 'mcq', text: '', options: ['', '', '', ''], correctOption: 0, correctAnswer: '', explanation: '' }
  ]);

  const fetchData = async () => {
    try {
      const statsRes = await adminAPI.getDashboardStats();
      setStats(statsRes.stats);

      const usersRes = await adminAPI.getUsers();
      setUsers(usersRes.data || []);
      
      const subRes = await contentAPI.getSubjects();
      setSubjects(subRes.data || []);
      if (subRes.data?.length > 0) {
        setSelectedSubject(subRes.data[0]._id || subRes.data[0].id);
      }
      
      const qRes = await adminAPI.getQuestions();
      setQuestions(qRes.data || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedSubject) {
        setChapters([]);
        return;
      }
      try {
        const res = await contentAPI.getChapters(selectedSubject);
        setChapters(res.data || []);
        if (res.data?.length > 0) {
          setSelectedChapter(res.data[0]._id || res.data[0].id);
        } else {
          setSelectedChapter('');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchChapters();
  }, [selectedSubject]);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['stats', 'users', 'studyMaterial', 'reward', 'questions', 'note', 'chapter', 'pyq', 'quiz'].includes(hash)) {
      setActiveSection(hash);
    } else if (!hash) {
      setActiveSection('stats');
    }
  }, [location.hash]);

  const handleToggleVerify = async (u) => {
    try {
      await adminAPI.updateUser(u._id || u.id, { isVerified: !u.isVerified });
      alert(`User verification status updated!`);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await adminAPI.deleteUser(userId);
      alert('User account deleted successfully.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser({
        name: uName,
        email: uEmail,
        password: uPassword,
        role: uRole
      });
      alert('User created successfully!');
      setUName('');
      setUEmail('');
      setUPassword('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const payload = {};
      if (editCoins !== '') payload.coins = Number(editCoins);
      if (editXp !== '') payload.xp = Number(editXp);
      if (editLevel !== '') payload.level = Number(editLevel);
      
      await adminAPI.updateStudentProfile(editingStudent._id || editingStudent.id, payload);
      alert('Student account updated successfully!');
      setEditingStudent(null);
      setEditCoins('');
      setEditXp('');
      setEditLevel('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createSubject({
        name: subName,
        code: subCode,
        description: subDesc,
        category: subCat
      });
      alert('Subject code added to database successfully!');
      setSubName('');
      setSubCode('');
      setSubDesc('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSubject = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await adminAPI.deleteSubject(subId);
      alert('Subject deleted successfully.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddReward = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createReward({
        title: rewTitle,
        description: rewDesc,
        costCoins: rewCoins,
        badgeImage: rewBadge,
        type: rewType
      });
      alert('Reward catalog item created successfully!');
      setRewTitle('');
      setRewDesc('');
      setRewCoins('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createQuestion({
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
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await adminAPI.deleteQuestion(id);
      alert('Question deleted');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedChapter) {
      alert('Please select a subject and a chapter first.');
      return;
    }
    try {
      await adminAPI.createNote({
        chapterId: selectedChapter,
        title: noteTitle,
        content: noteContent,
        pdfUrl: notePdf
      });
      alert('Note uploaded successfully!');
      setNoteTitle('');
      setNoteContent('');
      setNotePdf('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!selectedSubject) {
      alert('Please select a subject first.');
      return;
    }
    try {
      await adminAPI.createChapter({
        subjectId: selectedSubject,
        title: chapterTitle,
        chapterNumber: Number(chapterNum),
        description: chapterDesc
      });
      alert('Chapter created successfully!');
      setChapterTitle('');
      setChapterNum('');
      setChapterDesc('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddPYQ = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createPYQ({
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
    setQuizQuestions([...quizQuestions, { questionType: 'mcq', text: '', options: ['', '', '', ''], correctOption: 0, correctAnswer: '', explanation: '' }]);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createTest({
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
      setQuizQuestions([{ questionType: 'mcq', text: '', options: ['', '', '', ''], correctOption: 0, correctAnswer: '', explanation: '' }]);
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
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary-500 animate-spin-slow" />
          Navta Administrative Hub
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Manage system global parameters, audit user credentials, update validation statuses, and index course modules.
        </p>
      </div>

      {/* Admin KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Students', value: stats?.studentsCount || 0, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Teachers', value: stats?.teachersCount || 0, icon: ShieldCheck, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
          { label: 'Subjects', value: stats?.subjectsCount || 0, icon: PlusSquare, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
          { label: 'Quizzes Taken', value: stats?.resultsCount || 0, icon: TrendingUp, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
          { label: 'Class Avg', value: `${stats?.averageScore || 0}%`, icon: Award, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white">{item.value}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Action Toggles */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'stats', label: 'Overview Metrics', icon: TrendingUp },
          { id: 'users', label: 'User Auditing', icon: Users },
          { id: 'studyMaterial', label: 'Study Material', icon: BookOpen },
          { id: 'chapter', label: 'Add Chapter', icon: PlusCircle },
          { id: 'note', label: 'Upload Note', icon: BookOpen },
          { id: 'pyq', label: 'Upload PYQ Paper', icon: FileText },
          { id: 'quiz', label: 'Build Quiz', icon: HelpCircle },
          { id: 'reward', label: 'Reward Catalog', icon: Award },
          { id: 'questions', label: 'Question Bank', icon: PlusSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                window.location.hash = tab.id;
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                activeSection === tab.id
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

      {/* DYNAMIC SECTIONS */}

      {/* Overview Stats Section */}
      {activeSection === 'stats' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card title="System Health Logs" subtitle="General status indicator summary">
            <div className="space-y-4 mt-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/40">
                <span className="text-slate-500 dark:text-slate-400">Database Connection</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Connected
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/40">
                <span className="text-slate-500 dark:text-slate-400">Total Catalog Items</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{stats?.rewardsCount || 0} Rewards</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Environment Node</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">Development / Stateful Mock</span>
              </div>
            </div>
          </Card>

          <Card title="Database Seed Shortcut" subtitle="Restore default test databases">
            <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 leading-relaxed">
              If running in stateful browser mode, you can wipe local databases and reload base subjects, chapters, questions, and rewards by refreshing the browser or resetting cookies.
            </p>
            <div className="mt-6">
              <Button variant="secondary" onClick={() => { localStorage.clear(); alert('Local storage database cleared. Refresh the page to reload seed items!'); window.location.reload(); }}>
                Restore Seed Databases
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* User Auditing Section */}
      {activeSection === 'users' && (
        <div className="space-y-6">
          <Card title="Add New User" subtitle="Create a new student or teacher account">
            <form onSubmit={handleAddUser} className="space-y-4 mt-4 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Name</label>
                  <input type="text" required value={uName} onChange={(e) => setUName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Email</label>
                  <input type="email" required value={uEmail} onChange={(e) => setUEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Password</label>
                  <input type="password" required value={uPassword} onChange={(e) => setUPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Role</label>
                  <select value={uRole} onChange={(e) => setURole(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="external_teacher">External Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <Button type="submit" icon={PlusSquare}>Create User</Button>
            </form>
          </Card>

          <Card title="User Registry Audit Log" subtitle="Modify user roles, trigger verification states, or delete profiles">
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Verified</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                {users.map((u) => (
                  <tr key={u._id || u.id}>
                    <td className="py-3.5 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-3.5">{u.email}</td>
                    <td className="py-3.5 capitalize">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-rose-50 text-rose-600' : u.role === 'teacher' ? 'bg-indigo-50 text-indigo-600' : u.role === 'external_teacher' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <button
                        onClick={() => handleToggleVerify(u)}
                        className={`flex items-center gap-1 font-semibold text-xs ${
                          u.isVerified ? 'text-emerald-500' : 'text-slate-400'
                        }`}
                      >
                        {u.isVerified ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {u.isVerified ? 'Verified' : 'Pending'}
                      </button>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        {u.role === 'student' && (
                          <button
                            onClick={() => setEditingStudent(u)}
                            className="text-primary-500 hover:text-primary-700 transition-colors p-1.5 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-xl"
                            title="Manage Account"
                          >
                            <Settings className="w-4.5 h-4.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u._id || u.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                          title="Delete User"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md relative" title={`Manage Student: ${editingStudent.name}`}>
              <button onClick={() => setEditingStudent(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <form onSubmit={handleUpdateStudent} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Update Coins (Leave blank to keep current)</label>
                  <input type="number" value={editCoins} onChange={(e) => setEditCoins(e.target.value)} placeholder="e.g. 500" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Update XP (Leave blank to keep current)</label>
                  <input type="number" value={editXp} onChange={(e) => setEditXp(e.target.value)} placeholder="e.g. 1500" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Update Level (Leave blank to keep current)</label>
                  <input type="number" value={editLevel} onChange={(e) => setEditLevel(e.target.value)} placeholder="e.g. 5" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950" />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={() => setEditingStudent(null)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </Card>
          </div>
        )}
        </div>
      )}

      {/* Study Material Section */}
      {activeSection === 'studyMaterial' && (
        <div className="space-y-6">
          <Card title="Manage Subjects" subtitle="View and delete existing subjects">
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                    <th className="pb-3">Code</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                  {subjects.map((s) => (
                    <tr key={s._id}>
                      <td className="py-3.5 font-bold text-primary-500">{s.code}</td>
                      <td className="py-3.5 font-semibold text-slate-900 dark:text-white">{s.name}</td>
                      <td className="py-3.5">{s.category}</td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteSubject(s._id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {subjects.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-slate-500">No subjects found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Add Subject Module" subtitle="Create core classes to categorize quizzes and notes">
          <form onSubmit={handleAddSubject} className="space-y-4 mt-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Astrophysics"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Code Symbol</label>
                <input
                  type="text"
                  required
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  placeholder="e.g. AST101"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Category stream</label>
                <select
                  value={subCat}
                  onChange={(e) => setSubCat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                >
                  <option value="Science">Science (PCB / PCM)</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts">Arts</option>
                  <option value="General">General Study</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Subject Description</label>
              <textarea
                required
                rows="3"
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                placeholder="Give a short overview of the curriculum content..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <Button type="submit" icon={PlusSquare}>Create Subject</Button>
          </form>
        </Card>
        </div>
      )}

      {/* Chapter Upload Tab */}
      {activeSection === 'chapter' && (
        <Card title="Create New Chapter Module" subtitle="Chapters organize course content and exams">
          <form onSubmit={handleAddChapter} className="space-y-4 mt-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              >
                {subjects.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name} ({s.code})</option>)}
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
      {activeSection === 'note' && (
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
                  {subjects.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Chapter Module</label>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                  disabled={chapters.length === 0}
                >
                  {chapters.length === 0 && <option value="">No chapters found...</option>}
                  {chapters.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>)}
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
                placeholder="e.g. Newton's 1st Law Details"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Text Content Summary</label>
              <textarea
                required
                rows="4"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Markdown or plain text summary of the topic..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">PDF Document Link (Optional)</label>
              <input
                type="url"
                value={notePdf}
                onChange={(e) => setNotePdf(e.target.value)}
                placeholder="e.g. https://storage.example.com/note1.pdf"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <Button type="submit" icon={BookOpen}>Publish Note to Chapter</Button>
          </form>
        </Card>
      )}

      {/* PYQ Upload Tab */}
      {activeSection === 'pyq' && (
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
                  {subjects.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
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
                  {chapters.map(c => <option key={c._id || c.id} value={c._id || c.id}>Ch {c.chapterNumber}: {c.title}</option>)}
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
      {activeSection === 'quiz' && (
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
                    {subjects.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
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
                    {chapters.map(c => <option key={c._id || c.id} value={c._id || c.id}>Ch {c.chapterNumber}: {c.title}</option>)}
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
                    <textarea
                      required
                      rows="2"
                      value={q.text}
                      onChange={(e) => handleQuizQuestionChange(qIdx, 'text', e.target.value)}
                      placeholder="Enter question text..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Question Type</label>
                      <select
                        value={q.questionType || 'mcq'}
                        onChange={(e) => handleQuizQuestionChange(qIdx, 'questionType', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                      >
                        <option value="mcq">Multiple Choice</option>
                        <option value="short">Short Answer</option>
                        <option value="long">Long Answer</option>
                      </select>
                    </div>
                  </div>

                  {(!q.questionType || q.questionType === 'mcq') ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correctOpt-${qIdx}`}
                            checked={q.correctOption === optIdx}
                            onChange={() => handleQuizQuestionChange(qIdx, 'correctOption', optIdx)}
                            className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                          />
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => handleQuizQuestionChange(qIdx, 'options', e.target.value, optIdx)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Correct Answer / Keyword(s)</label>
                      <textarea
                        required
                        rows="2"
                        value={q.correctAnswer || ''}
                        onChange={(e) => handleQuizQuestionChange(qIdx, 'correctAnswer', e.target.value)}
                        placeholder="Enter the exact answer expected..."
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Explanation (Optional)</label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => handleQuizQuestionChange(qIdx, 'explanation', e.target.value)}
                      placeholder="Why is this the correct answer?"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                    />
                  </div>

                  {quizQuestions.length > 1 && (
                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...quizQuestions];
                          updated.splice(qIdx, 1);
                          setQuizQuestions(updated);
                        }}
                        className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                      >
                        Remove Question
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" icon={PlusCircle}>Compile and Save Quiz</Button>
          </form>
        </Card>
      )}

      {/* Add Reward Store Section */}
      {activeSection === 'reward' && (
        <Card title="Add Reward Catalogue Entry" subtitle="Reward store items are claimable by students using quiz coins">
          <form onSubmit={handleAddReward} className="space-y-4 mt-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Reward Title</label>
                <input
                  type="text"
                  required
                  value={rewTitle}
                  onChange={(e) => setRewTitle(e.target.value)}
                  placeholder="e.g. Navta Premium Coffee Mug"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Coins Redemption Cost</label>
                <input
                  type="number"
                  required
                  value={rewCoins}
                  onChange={(e) => setRewCoins(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Item Type</label>
                <select
                  value={rewType}
                  onChange={(e) => setRewType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                >
                  <option value="badge">Digital Badge Milestone</option>
                  <option value="coupon">Discount Voucher / Coupon</option>
                  <option value="resource">Mentorship Session / PDF File</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Icon (Lucide name)</label>
                <select
                  value={rewBadge}
                  onChange={(e) => setRewBadge(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                >
                  <option value="star">Star Icon</option>
                  <option value="crown">Crown Icon</option>
                  <option value="shirt">Shirt Icon</option>
                  <option value="phone-call">Phone Consultation Icon</option>
                  <option value="award">Award Medal Icon</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Description Summary</label>
              <textarea
                required
                rows="3"
                value={rewDesc}
                onChange={(e) => setRewDesc(e.target.value)}
                placeholder="Give details about what the voucher, badge, or physical mug delivers..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
              />
            </div>

            <Button type="submit" icon={Award}>Create Reward Item</Button>
          </form>
        </Card>
      )}

      {/* Question Bank Section */}
      {activeSection === 'questions' && (
        <div className="space-y-6">
          <Card title="Add New Question" subtitle="Create questions to be assigned to topics or stored generally">
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

          <Card title="Question Bank" subtitle="Manage all created questions">
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Question</th>
                    <th className="pb-3">Subject</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                  {questions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-slate-500">No questions found</td>
                    </tr>
                  ) : (
                    questions.map((q) => (
                      <tr key={q._id || q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 font-medium uppercase text-xs">{q.questionType || 'MCQ'}</td>
                        <td className="py-3 truncate max-w-xs">{q.text}</td>
                        <td className="py-3">{q.subject?.name || q.subject || 'General'}</td>
                        <td className="py-3 text-right">
                          <button onClick={() => handleDeleteQuestion(q._id || q.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
