import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Upload,
  GraduationCap,
  Target,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  ChevronDown
} from 'lucide-react';


/*
|--------------------------------------------------------------------------
| Study Notes Configuration
|--------------------------------------------------------------------------
*/

const SUBJECT_RULES = {
  Physics: ['JEE Mains', 'NEET', 'Boards'],
  Chemistry: ['JEE Mains', 'NEET', 'Boards'],
  Mathematics: ['JEE Mains', 'Boards'],
  Maths: ['JEE Mains', 'Boards'],
  Biology: ['NEET', 'Boards']
};

const CLASS_OPTIONS = ['Class 11', 'Class 12'];


/*
|--------------------------------------------------------------------------
| Common input styles
|--------------------------------------------------------------------------
*/

const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-primary-500';

const labelClass =
  'block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2';


function NavtaAdminSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option',
  disabled = false
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const closeOnOutsidePress = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsidePress);
    document.addEventListener('touchstart', closeOnOutsidePress, {
      passive: true
    });

    return () => {
      document.removeEventListener('mousedown', closeOnOutsidePress);
      document.removeEventListener('touchstart', closeOnOutsidePress);
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const selectedOption =
    options.find(
      (option) =>
        String(option.value) === String(value)
    ) || null;

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!disabled) {
            setOpen((previous) => !previous);
          }
        }}
        className={`w-full min-h-[48px] px-3 py-2.5 rounded-xl border text-sm text-left flex items-center justify-between gap-3 transition-colors focus:outline-none focus:border-primary-500 ${
          disabled
            ? 'cursor-not-allowed opacity-55 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
            : 'cursor-pointer bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && !disabled && (
        <div
          role="listbox"
          className="absolute z-[100] left-0 right-0 top-[calc(100%+8px)] max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-2xl p-1.5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-400">
              No options available
            </div>
          ) : (
            options.map((option) => {
              const active =
                String(option.value) === String(value);

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-3 rounded-lg text-sm text-left flex items-center justify-between gap-3 transition-colors ${
                    active
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    {option.label}
                  </span>

                  {active && (
                    <Check className="w-4 h-4 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function AdminDashboard() {

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();


  /*
  |--------------------------------------------------------------------------
  | Main Dashboard State
  |--------------------------------------------------------------------------
  */

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeSection, setActiveSection] = useState('stats');


  /*
  |--------------------------------------------------------------------------
  | Student Edit
  |--------------------------------------------------------------------------
  */

  const [editingStudent, setEditingStudent] = useState(null);
  const [editCoins, setEditCoins] = useState('');
  const [editXp, setEditXp] = useState('');
  const [editLevel, setEditLevel] = useState('');


  /*
  |--------------------------------------------------------------------------
  | User Form
  |--------------------------------------------------------------------------
  */

  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPassword, setUPassword] = useState('');
  const [uRole, setURole] = useState('student');


  /*
  |--------------------------------------------------------------------------
  | Subject Form
  |--------------------------------------------------------------------------
  */

  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subCat, setSubCat] = useState('Science');


  /*
  |--------------------------------------------------------------------------
  | Reward Form
  |--------------------------------------------------------------------------
  */

  const [rewTitle, setRewTitle] = useState('');
  const [rewDesc, setRewDesc] = useState('');
  const [rewCoins, setRewCoins] = useState('');
  const [rewBadge, setRewBadge] = useState('star');
  const [rewType, setRewType] = useState('badge');


  /*
  |--------------------------------------------------------------------------
  | Question Form
  |--------------------------------------------------------------------------
  */

  const [qType, setQType] = useState('mcq');
  const [qText, setQText] = useState('');
  const [qSubj, setQSubj] = useState('');
  const [qChap, setQChap] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qCorrectAnswer, setQCorrectAnswer] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qDifficulty, setQDifficulty] = useState('medium');


  /*
  |--------------------------------------------------------------------------
  | Study Material / Chapter State
  |--------------------------------------------------------------------------
  */

  const [chapters, setChapters] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');


  /*
  |--------------------------------------------------------------------------
  | Note Upload State
  |--------------------------------------------------------------------------
  */

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Local PDF file
  const [notePdfFile, setNotePdfFile] = useState(null);

  // Kept for compatibility with the old system.
  // If a URL is provided, it can still be saved.
  const [notePdfUrl, setNotePdfUrl] = useState('');

  const [noteUploading, setNoteUploading] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Chapter Form
  |--------------------------------------------------------------------------
  */

  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterNum, setChapterNum] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');


  /*
  |--------------------------------------------------------------------------
  | PYQ
  |--------------------------------------------------------------------------
  */

  const [pyqYear, setPyqYear] = useState('');
  const [pyqExam, setPyqExam] = useState('');
  const [pyqTitle, setPyqTitle] = useState('');
  const [pyqPdf, setPyqPdf] = useState('');


  /*
  |--------------------------------------------------------------------------
  | Quiz
  |--------------------------------------------------------------------------
  */

  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizDuration, setQuizDuration] = useState('');
  const [quizPass, setQuizPass] = useState('');

  const [quizQuestions, setQuizQuestions] = useState([
    {
      questionType: 'mcq',
      text: '',
      options: ['', '', '', ''],
      correctOption: 0,
      correctAnswer: '',
      explanation: ''
    }
  ]);


  /*
  |--------------------------------------------------------------------------
  | Load Dashboard Data
  |--------------------------------------------------------------------------
  */

const fetchData = async () => {
  setLoading(true);

  // ===================================================
  // LOAD EACH ADMIN RESOURCE INDEPENDENTLY
  // ===================================================
  //
  // IMPORTANT:
  // One failed API must NOT stop Subjects from loading.
  // ===================================================

  const [
    statsResult,
    usersResult,
    subjectsResult,
    questionsResult
  ] = await Promise.allSettled([
    adminAPI.getDashboardStats(),
    adminAPI.getUsers(),
    contentAPI.getSubjects(),
    adminAPI.getQuestions()
  ]);

  // ===================================================
  // DASHBOARD STATS
  // ===================================================

  if (statsResult.status === 'fulfilled') {
    const response = statsResult.value;

    console.log(
      'NAVTA admin stats response:',
      response
    );

    setStats(
      response?.stats ||
      response?.data?.stats ||
      response?.data ||
      null
    );
  } else {
    console.error(
      'Failed to load dashboard stats:',
      statsResult.reason
    );

    setStats(null);
  }

  // ===================================================
  // USERS
  // ===================================================

  if (usersResult.status === 'fulfilled') {
    const response = usersResult.value;

    console.log(
      'NAVTA admin users response:',
      response
    );

    const userData =
      Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.users)
            ? response.users
            : [];

    setUsers(userData);
  } else {
    console.error(
      'Failed to load admin users:',
      usersResult.reason
    );

    setUsers([]);
  }

  // ===================================================
  // SUBJECTS
  // ===================================================

  if (subjectsResult.status === 'fulfilled') {
    const response = subjectsResult.value;

    console.log(
      'NAVTA SUBJECT API RESPONSE:',
      response
    );

    // Supports all common backend response formats:
    //
    // [...]
    //
    // { data: [...] }
    //
    // { subjects: [...] }
    //
    // { success: true, data: [...] }

    let subjectData = [];

    if (Array.isArray(response)) {
      subjectData = response;
    } else if (
      Array.isArray(response?.data)
    ) {
      subjectData = response.data;
    } else if (
      Array.isArray(response?.subjects)
    ) {
      subjectData = response.subjects;
    } else if (
      Array.isArray(response?.data?.subjects)
    ) {
      subjectData =
        response.data.subjects;
    }

    console.log(
      `NAVTA loaded ${subjectData.length} subject(s):`,
      subjectData
    );

    setSubjects(subjectData);

    if (
      subjectData.length > 0
    ) {
      setSelectedSubject(
        (currentSubject) => {
          // Keep current selection if it is valid.
          const exists =
            subjectData.some(
              (subject) =>
                String(
                  subject._id ||
                  subject.id
                ) ===
                String(currentSubject)
            );

          if (
            currentSubject &&
            exists
          ) {
            return currentSubject;
          }

          return (
            subjectData[0]._id ||
            subjectData[0].id ||
            ''
          );
        }
      );
    } else {
      setSelectedSubject('');

      console.error(
        'NAVTA SUBJECT ERROR: API succeeded but returned zero subjects.'
      );
    }
  } else {
    console.error(
      'Failed to load NAVTA subjects:',
      subjectsResult.reason
    );

    setSubjects([]);
    setSelectedSubject('');
  }

  // ===================================================
  // QUESTIONS
  // ===================================================

  if (
    questionsResult.status ===
    'fulfilled'
  ) {
    const response =
      questionsResult.value;

    console.log(
      'NAVTA admin questions response:',
      response
    );

    const questionData =
      Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(
                response?.questions
              )
            ? response.questions
            : [];

    setQuestions(
      questionData
    );
  } else {
    console.error(
      'Failed to load admin questions:',
      questionsResult.reason
    );

    setQuestions([]);
  }

  setLoading(false);
};
  useEffect(() => {
  fetchData();
}, []);


  /*
  |--------------------------------------------------------------------------
  | URL Hash Navigation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const hash =
      location.hash.replace('#', '');

    const validSections = [
      'stats',
      'users',
      'studyMaterial',
      'chapter',
      'note',
      'pyq',
      'quiz',
      'reward',
      'questions'
    ];

    if (validSections.includes(hash)) {

      setActiveSection(hash);

    } else if (!hash) {

      setActiveSection('stats');

    }

  }, [location.hash]);


  /*
  |--------------------------------------------------------------------------
  | Fetch Chapters
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const fetchChapters = async () => {

      if (!selectedSubject) {

        setChapters([]);
        setSelectedChapter('');

        return;
      }

      try {

        const res =
          await contentAPI.getChapters(
            selectedSubject
          );

const chapterData =
  Array.isArray(res)
    ? res
    : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.chapters)
        ? res.chapters
        : Array.isArray(
              res?.data?.chapters
            )
          ? res.data.chapters
          : [];

setChapters(
  chapterData
);

if (
  chapterData.length > 0
) {
  setSelectedChapter(
    chapterData[0]._id ||
    chapterData[0].id ||
    ''
  );
} else {
  setSelectedChapter('');
}

      } catch (err) {

        console.error(
          'Failed to load chapters:',
          err
        );

        setChapters([]);
        setSelectedChapter('');

      }
    };

    fetchChapters();

  }, [selectedSubject]);


  /*
  |--------------------------------------------------------------------------
  | Subject Helper
  |--------------------------------------------------------------------------
  */

  const getSelectedSubjectObject = () => {

    return subjects.find(
      (subject) =>
        (subject._id || subject.id) ===
        selectedSubject
    );

  };


  const selectedSubjectObject =
    getSelectedSubjectObject();


  const availableExams =
    SUBJECT_RULES[
      selectedSubjectObject?.name
    ] || [];


  /*
  |--------------------------------------------------------------------------
  | Subject Change
  |--------------------------------------------------------------------------
  */

  const handleSubjectChange = (value) => {

    setSelectedSubject(value);

    setSelectedExam('');
    setSelectedClass('');
    setSelectedChapter('');

    setNotePdfFile(null);

  };


  /*
  |--------------------------------------------------------------------------
  | Exam Change
  |--------------------------------------------------------------------------
  */

  const handleExamChange = (value) => {

    setSelectedExam(value);
    setSelectedClass('');
    setSelectedChapter('');

  };


  /*
  |--------------------------------------------------------------------------
  | File Selection
  |--------------------------------------------------------------------------
  */

  const handleNoteFileChange = (e) => {

    const file = e.target.files?.[0];

    if (!file) {

      setNotePdfFile(null);
      return;

    }

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {

      alert('Please select a PDF file only.');

      e.target.value = '';
      setNotePdfFile(null);

      return;
    }

    const maxSize =
      25 * 1024 * 1024;

    if (file.size > maxSize) {

      alert(
        'PDF size must be less than 25 MB.'
      );

      e.target.value = '';
      setNotePdfFile(null);

      return;
    }

    setNotePdfFile(file);

  };


  /*
  |--------------------------------------------------------------------------
  | User Functions
  |--------------------------------------------------------------------------
  */

  const handleToggleVerify = async (u) => {

    try {

      await adminAPI.updateUser(
        u._id || u.id,
        {
          isVerified: !u.isVerified
        }
      );

      alert(
        'User verification status updated!'
      );

      fetchData();

    } catch (err) {

      alert(err.message);

    }
  };


  const handleDeleteUser = async (userId) => {

    if (
      !window.confirm(
        'Are you sure you want to permanently delete this user account?'
      )
    ) {
      return;
    }

    try {

      await adminAPI.deleteUser(userId);

      alert(
        'User account deleted successfully.'
      );

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

      alert(
        'User created successfully!'
      );

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

      if (editCoins !== '')
        payload.coins =
          Number(editCoins);

      if (editXp !== '')
        payload.xp =
          Number(editXp);

      if (editLevel !== '')
        payload.level =
          Number(editLevel);

      await adminAPI.updateStudentProfile(
        editingStudent._id ||
        editingStudent.id,
        payload
      );

      alert(
        'Student account updated successfully!'
      );

      setEditingStudent(null);
      setEditCoins('');
      setEditXp('');
      setEditLevel('');

      fetchData();

    } catch (err) {

      alert(err.message);

    }
  };


  /*
  |--------------------------------------------------------------------------
  | Subject Functions
  |--------------------------------------------------------------------------
  */

  const handleAddSubject = async (e) => {

    e.preventDefault();

    try {

      await adminAPI.createSubject({
        name: subName,
        code: subCode,
        description: subDesc,
        category: subCat
      });

      alert(
        'Subject added successfully!'
      );

      setSubName('');
      setSubCode('');
      setSubDesc('');

      fetchData();

    } catch (err) {

      alert(err.message);

    }
  };


  const handleDeleteSubject = async (subId) => {

    if (
      !window.confirm(
        'Are you sure you want to delete this subject?'
      )
    ) {
      return;
    }

    try {

      await adminAPI.deleteSubject(subId);

      alert(
        'Subject deleted successfully.'
      );

      fetchData();

    } catch (err) {

      alert(err.message);

    }
  };


  /*
  |--------------------------------------------------------------------------
  | Reward
  |--------------------------------------------------------------------------
  */

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

      alert(
        'Reward catalog item created successfully!'
      );

      setRewTitle('');
      setRewDesc('');
      setRewCoins('');

      fetchData();

    } catch (err) {

      alert(err.message);

    }
  };


  /*
  |--------------------------------------------------------------------------
  | Question Bank
  |--------------------------------------------------------------------------
  */

  const handleAddQuestion = async (e) => {

    e.preventDefault();

    try {

      await adminAPI.createQuestion({

        questionType: qType,

        text: qText,

        subject:
          qSubj ||
          undefined,

        chapter:
          qChap ||
          undefined,

        options:
          qType === 'mcq'
            ? qOptions
            : undefined,

        correctOption:
          qType === 'mcq'
            ? Number(qCorrectIndex)
            : undefined,

        correctAnswer:
          qType !== 'mcq'
            ? qCorrectAnswer
            : undefined,

        explanation:
          qExplanation,

        difficulty:
          qDifficulty

      });

      alert(
        'Question added successfully!'
      );

      setQText('');
      setQExplanation('');
      setQCorrectAnswer('');
      setQOptions([
        '',
        '',
        '',
        ''
      ]);
      setQCorrectIndex(0);

      fetchData();

    } catch (err) {

      alert(err.message);

    }
  };


  const handleDeleteQuestion =
    async (id) => {

      if (
        !window.confirm(
          'Delete this question?'
        )
      ) {
        return;
      }

      try {

        await adminAPI.deleteQuestion(id);

        alert(
          'Question deleted.'
        );

        fetchData();

      } catch (err) {

        alert(err.message);

      }
    };


  /*
  |--------------------------------------------------------------------------
  | Chapter Creation
  |--------------------------------------------------------------------------
  */

  const handleAddChapter = async (e) => {

    e.preventDefault();

    if (!selectedSubject) {

      alert(
        'Please select a subject first.'
      );

      return;
    }

    if (!selectedExam) {

      alert(
        'Please select an examination.'
      );

      return;
    }

    if (!selectedClass) {

      alert(
        'Please select a class.'
      );

      return;
    }

    try {

      /*
       * The backend should accept these additional
       * fields after we update the Chapter model.
       */

      await adminAPI.createChapter({

        subjectId:
          selectedSubject,

        exam:
          selectedExam,

        className:
          selectedClass,

        title:
          chapterTitle,

        chapterNumber:
          Number(chapterNum),

        description:
          chapterDesc

      });

      alert(
        'Chapter created successfully!'
      );

      setChapterTitle('');
      setChapterNum('');
      setChapterDesc('');

      fetchData();

    } catch (err) {

      alert(err.message);

    }
  };


  /*
  |--------------------------------------------------------------------------
  | REAL STUDY NOTE SUBMISSION
  |--------------------------------------------------------------------------
  */

  const handleAddNote = async (e) => {

    e.preventDefault();


    if (!selectedSubject) {

      alert(
        'Please select a subject.'
      );

      return;
    }


    if (!selectedExam) {

      alert(
        'Please select an examination.'
      );

      return;
    }


    if (!selectedClass) {

      alert(
        'Please select a class.'
      );

      return;
    }


    if (!selectedChapter) {

      alert(
        'Please select a chapter.'
      );

      return;
    }


    if (!noteTitle.trim()) {

      alert(
        'Please enter a note title.'
      );

      return;
    }


    if (!noteContent.trim()) {

      alert(
        'Please enter the note content.'
      );

      return;
    }


    if (
      !notePdfFile &&
      !notePdfUrl.trim()
    ) {

      alert(
        'Please select a PDF file or provide a PDF URL.'
      );

      return;
    }


    try {

      setNoteUploading(true);


      /*
       * IMPORTANT:
       *
       * adminAPI.createNote must be updated
       * to accept FormData.
       *
       * We send both the metadata and PDF file.
       */

      const formData =
        new FormData();


      formData.append(
        'chapterId',
        selectedChapter
      );

      formData.append(
        'subjectId',
        selectedSubject
      );

      formData.append(
        'exam',
        selectedExam
      );

      formData.append(
        'className',
        selectedClass
      );

      formData.append(
        'title',
        noteTitle
      );

      formData.append(
        'content',
        noteContent
      );


      if (notePdfFile) {

        formData.append(
          'pdf',
          notePdfFile
        );

      } else if (notePdfUrl) {

        formData.append(
          'pdfUrl',
          notePdfUrl
        );

      }


      await adminAPI.createNote(
        formData
      );


      alert(
        'Study note uploaded successfully!'
      );


      setNoteTitle('');
      setNoteContent('');
      setNotePdfFile(null);
      setNotePdfUrl('');


      const fileInput =
        document.getElementById(
          'study-note-pdf'
        );

      if (fileInput) {

        fileInput.value = '';

      }


    } catch (err) {

      console.error(
        'Study note upload failed:',
        err
      );

      alert(
        err.message ||
        'Failed to upload study note.'
      );

    } finally {

      setNoteUploading(false);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | PYQ
  |--------------------------------------------------------------------------
  */

  const handleAddPYQ = async (e) => {

    e.preventDefault();

    try {

      await adminAPI.createPYQ({

        subjectId:
          selectedSubject,

        chapterId:
          selectedChapter ||
          undefined,

        year:
          pyqYear,

        examName:
          pyqExam,

        title:
          pyqTitle,

        pdfUrl:
          pyqPdf

      });

      alert(
        'PYQ paper added successfully!'
      );

      setPyqYear('');
      setPyqExam('');
      setPyqTitle('');
      setPyqPdf('');

    } catch (err) {

      alert(err.message);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | Quiz
  |--------------------------------------------------------------------------
  */

  const handleQuizQuestionChange =
    (
      index,
      field,
      value,
      optIdx = null
    ) => {

      const updated =
        [...quizQuestions];

      if (optIdx !== null) {

        updated[index]
          .options[optIdx] =
          value;

      } else {

        updated[index][field] =
          value;

      }

      setQuizQuestions(updated);

    };


  const addQuestionField = () => {

    setQuizQuestions([

      ...quizQuestions,

      {
        questionType: 'mcq',
        text: '',
        options: [
          '',
          '',
          '',
          ''
        ],
        correctOption: 0,
        correctAnswer: '',
        explanation: ''
      }

    ]);

  };


  const handleCreateQuiz =
    async (e) => {

      e.preventDefault();

      try {

        await adminAPI.createTest({

          title:
            quizTitle,

          description:
            quizDesc,

          subjectId:
            selectedSubject,

          chapterId:
            selectedChapter ||
            undefined,

          duration:
            quizDuration,

          type:
            'Quiz',

          questions:
            quizQuestions,

          passingScore:
            quizPass

        });

        alert(
          'Interactive Quiz created successfully!'
        );

        setQuizTitle('');
        setQuizDesc('');

        setQuizQuestions([
          {
            questionType: 'mcq',
            text: '',
            options: [
              '',
              '',
              '',
              ''
            ],
            correctOption: 0,
            correctAnswer: '',
            explanation: ''
          }
        ]);

      } catch (err) {

        alert(err.message);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | Loading Screen
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (

      <div className="flex h-[80vh] items-center justify-center">

        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />

      </div>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  return (

    <div className="space-y-6">


      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="glass rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800/40 relative overflow-hidden shadow-sm">

        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">

          <Settings className="w-8 h-8 text-primary-500" />

          Navta Administrative Hub

        </h1>


        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">

          Manage students, subjects, chapters, study notes,
          PDFs, PYQs, quizzes, rewards and questions.

        </p>

      </div>


      {/* ================================================================
          KPI
      ================================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

        {[
          {
            label: 'Students',
            value:
              stats?.studentsCount || 0,
            icon: Users,
            color:
              'text-blue-500 bg-blue-50 dark:bg-blue-950/20'
          },

          {
            label: 'Teachers',
            value:
              stats?.teachersCount || 0,
            icon: ShieldCheck,
            color:
              'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
          },

          {
            label: 'Subjects',
            value:
              stats?.subjectsCount || 0,
            icon: PlusSquare,
            color:
              'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
          },

          {
            label: 'Quizzes Taken',
            value:
              stats?.resultsCount || 0,
            icon: TrendingUp,
            color:
              'text-amber-500 bg-amber-50 dark:bg-amber-950/20'
          },

          {
            label: 'Class Avg',
            value:
              `${stats?.averageScore || 0}%`,
            icon: Award,
            color:
              'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
          }

        ].map(
          (item, idx) => {

            const Icon =
              item.icon;

            return (

              <Card
                key={idx}
                className="p-4 flex items-center gap-3"
              >

                <div
                  className={`p-2.5 rounded-xl ${item.color}`}
                >

                  <Icon className="w-5 h-5" />

                </div>

                <div>

                  <p className="text-lg font-black text-slate-900 dark:text-white">

                    {item.value}

                  </p>

                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">

                    {item.label}

                  </p>

                </div>

              </Card>

            );

          }
        )}

      </div>


      {/* ================================================================
          TABS
      ================================================================= */}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">

        {[
          {
            id: 'stats',
            label: 'Overview Metrics',
            icon: TrendingUp
          },

          {
            id: 'users',
            label: 'User Auditing',
            icon: Users
          },

          {
            id: 'studyMaterial',
            label: 'Study Material',
            icon: BookOpen
          },

          {
            id: 'chapter',
            label: 'Add Chapter',
            icon: PlusCircle
          },

          {
            id: 'note',
            label: 'Upload Study Note',
            icon: Upload
          },

          {
            id: 'pyq',
            label: 'Upload PYQ',
            icon: FileText
          },

          {
            id: 'quiz',
            label: 'Build Quiz',
            icon: HelpCircle
          },

          {
            id: 'reward',
            label: 'Reward Catalog',
            icon: Award
          },

          {
            id: 'questions',
            label: 'Question Bank',
            icon: PlusSquare
          },

          {
            id: 'navtaTest',
            label: 'Navta TEST',
            icon: Target,
            isRoute: true
          }

        ].map(
          (tab) => {

            const Icon =
              tab.icon;

            return (

              <button
                key={tab.id}
                onClick={() => {
                  if (tab.isRoute) {
                    navigate('/admin/navta-test');
                    return;
                  }

                  window.location.hash =
                    tab.id;
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  activeSection === tab.id
                    ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >

                <Icon className="w-4 h-4" />

                {tab.label}

              </button>

            );

          }
        )}

      </div>


      {/* ================================================================
          OVERVIEW
      ================================================================= */}

      {activeSection === 'stats' && (

        <div className="grid md:grid-cols-2 gap-6">

          <Card
            title="System Health Logs"
            subtitle="General system status"
          >

            <div className="space-y-4 mt-4 text-sm">

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/40">

                <span className="text-slate-500">
                  Database Connection
                </span>

                <span className="text-emerald-500 font-bold flex items-center gap-1">

                  <Check className="w-4 h-4" />

                  Connected

                </span>

              </div>


              <div className="flex justify-between py-2">

                <span className="text-slate-500">
                  Admin
                </span>

                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {user?.name || 'Administrator'}
                </span>

              </div>

            </div>

          </Card>


          <Card
            title="Study Notes Structure"
            subtitle="New notes hierarchy"
          >

            <div className="space-y-3 mt-4 text-sm">

              <div className="flex items-center gap-2">

                <BookOpen className="w-4 h-4 text-primary-500" />

                Subject

              </div>

              <div className="pl-6 text-slate-500">
                ↓ Examination
              </div>

              <div className="pl-6 text-slate-500">
                ↓ Class 11 / Class 12
              </div>

              <div className="pl-6 text-slate-500">
                ↓ Chapter
              </div>

              <div className="pl-6 text-slate-500">
                ↓ Study Note + PDF
              </div>

            </div>

          </Card>

        </div>

      )}


      {/* ================================================================
          USERS
      ================================================================= */}

      {activeSection === 'users' && (

        <div className="space-y-6">

          <Card
            title="Add New User"
            subtitle="Create a student or teacher account"
          >

            <form
              onSubmit={handleAddUser}
              className="space-y-4 mt-4 max-w-xl"
            >

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className={labelClass}>
                    Name
                  </label>

                  <input
                    type="text"
                    required
                    value={uName}
                    onChange={(e) =>
                      setUName(e.target.value)
                    }
                    className={inputClass}
                  />

                </div>


                <div>

                  <label className={labelClass}>
                    Email
                  </label>

                  <input
                    type="email"
                    required
                    value={uEmail}
                    onChange={(e) =>
                      setUEmail(e.target.value)
                    }
                    className={inputClass}
                  />

                </div>

              </div>


              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className={labelClass}>
                    Password
                  </label>

                  <input
                    type="password"
                    required
                    value={uPassword}
                    onChange={(e) =>
                      setUPassword(e.target.value)
                    }
                    className={inputClass}
                  />

                </div>


                <div>

                  <label className={labelClass}>
                    Role
                  </label>

                  <select
                    value={uRole}
                    onChange={(e) =>
                      setURole(e.target.value)
                    }
                    className={inputClass}
                  >

                    <option value="student">
                      Student
                    </option>

                    <option value="teacher">
                      Teacher
                    </option>

                    <option value="external_teacher">
                      External Teacher
                    </option>

                    <option value="admin">
                      Admin
                    </option>

                  </select>

                </div>

              </div>


              <Button
                type="submit"
                icon={PlusSquare}
              >
                Create User
              </Button>

            </form>

          </Card>


          <Card
            title="User Registry"
            subtitle="Manage registered users"
          >

            <div className="overflow-x-auto mt-4">

              <table className="w-full text-left text-sm">

                <thead>

                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">

                    <th className="pb-3">
                      Name
                    </th>

                    <th className="pb-3">
                      Email
                    </th>

                    <th className="pb-3">
                      Role
                    </th>

                    <th className="pb-3">
                      Verified
                    </th>

                    <th className="pb-3 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">

                  {users.map((u) => (

                    <tr key={u._id || u.id}>

                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {u.name}
                      </td>

                      <td className="py-3">
                        {u.email}
                      </td>

                      <td className="py-3 capitalize">
                        {u.role?.replace('_', ' ')}
                      </td>

                      <td className="py-3">

                        <button
                          onClick={() =>
                            handleToggleVerify(u)
                          }
                          className={
                            u.isVerified
                              ? 'text-emerald-500'
                              : 'text-slate-400'
                          }
                        >

                          {u.isVerified
                            ? 'Verified'
                            : 'Pending'}

                        </button>

                      </td>

                      <td className="py-3 text-right">

                        <button
                          onClick={() =>
                            handleDeleteUser(
                              u._id || u.id
                            )
                          }
                          className="p-1.5 text-red-500"
                        >

                          <Trash2 className="w-4 h-4" />

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </Card>

        </div>

      )}


      {/* ================================================================
          SUBJECTS
      ================================================================= */}

      {activeSection === 'studyMaterial' && (

        <div className="space-y-6">

          <Card
            title="Manage Subjects"
            subtitle="Physics, Chemistry, Mathematics and Biology"
          >

            <div className="overflow-x-auto mt-4">

              <table className="w-full text-left text-sm">

                <thead>

                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">

                    <th className="pb-3">
                      Code
                    </th>

                    <th className="pb-3">
                      Subject
                    </th>

                    <th className="pb-3">
                      Category
                    </th>

                    <th className="pb-3 text-right">
                      Delete
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {subjects.map((s) => (

                    <tr
                      key={s._id || s.id}
                      className="border-b border-slate-100 dark:border-slate-800/40"
                    >

                      <td className="py-3 text-primary-500 font-bold">
                        {s.code}
                      </td>

                      <td className="py-3 font-semibold">
                        {s.name}
                      </td>

                      <td className="py-3">
                        {s.category}
                      </td>

                      <td className="py-3 text-right">

                        <button
                          onClick={() =>
                            handleDeleteSubject(
                              s._id || s.id
                            )
                          }
                          className="text-red-500"
                        >

                          <Trash2 className="w-4 h-4" />

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </Card>


          <Card
            title="Add Subject"
            subtitle="Create a new subject module"
          >

            <form
              onSubmit={handleAddSubject}
              className="space-y-4 max-w-xl"
            >

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className={labelClass}>
                    Subject Name
                  </label>

                  <input
                    required
                    value={subName}
                    onChange={(e) =>
                      setSubName(e.target.value)
                    }
                    placeholder="Physics"
                    className={inputClass}
                  />

                </div>


                <div>

                  <label className={labelClass}>
                    Code
                  </label>

                  <input
                    required
                    value={subCode}
                    onChange={(e) =>
                      setSubCode(e.target.value)
                    }
                    placeholder="PHY101"
                    className={inputClass}
                  />

                </div>

              </div>


              <div>

                <label className={labelClass}>
                  Category
                </label>

                <select
                  value={subCat}
                  onChange={(e) =>
                    setSubCat(e.target.value)
                  }
                  className={inputClass}
                >

                  <option value="Science">
                    Science
                  </option>

                  <option value="Commerce">
                    Commerce
                  </option>

                  <option value="Arts">
                    Arts
                  </option>

                  <option value="General">
                    General
                  </option>

                </select>

              </div>


              <div>

                <label className={labelClass}>
                  Description
                </label>

                <textarea
                  required
                  rows="3"
                  value={subDesc}
                  onChange={(e) =>
                    setSubDesc(e.target.value)
                  }
                  className={inputClass}
                />

              </div>


              <Button
                type="submit"
                icon={PlusSquare}
              >
                Create Subject
              </Button>

            </form>

          </Card>

        </div>

      )}


      {/* ================================================================
          CREATE CHAPTER
      ================================================================= */}

      {activeSection === 'chapter' && (

        <Card
          title="Create Chapter"
          subtitle="Create a chapter under Subject → Exam → Class"
        >

          <form
            onSubmit={handleAddChapter}
            className="space-y-5 mt-4 max-w-2xl"
          >

            <div className="grid md:grid-cols-3 gap-4">

              <div>

                <label className={labelClass}>
                  Subject
                </label>

                <select
                  value={selectedSubject}
                  onChange={(e) =>
                    handleSubjectChange(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >

                  <option value="">
                    Select Subject
                  </option>

                  {subjects.map((s) => (

                    <option
                      key={s._id || s.id}
                      value={s._id || s.id}
                    >
                      {s.name}
                    </option>

                  ))}

                </select>

              </div>


              <div>

                <label className={labelClass}>
                  Examination
                </label>

                <select
                  value={selectedExam}
                  onChange={(e) =>
                    handleExamChange(
                      e.target.value
                    )
                  }
                  disabled={
                    !selectedSubject
                  }
                  className={inputClass}
                >

                  <option value="">
                    Select Exam
                  </option>

                  {availableExams.map(
                    (exam) => (

                      <option
                        key={exam}
                        value={exam}
                      >
                        {exam}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div>

                <label className={labelClass}>
                  Class
                </label>

                <select
                  value={selectedClass}
                  onChange={(e) =>
                    setSelectedClass(
                      e.target.value
                    )
                  }
                  disabled={
                    !selectedExam
                  }
                  className={inputClass}
                >

                  <option value="">
                    Select Class
                  </option>

                  {CLASS_OPTIONS.map(
                    (item) => (

                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>


            <div className="grid grid-cols-3 gap-4">

              <div className="col-span-2">

                <label className={labelClass}>
                  Chapter Title
                </label>

                <input
                  required
                  value={chapterTitle}
                  onChange={(e) =>
                    setChapterTitle(
                      e.target.value
                    )
                  }
                  placeholder="Laws of Motion"
                  className={inputClass}
                />

              </div>


              <div>

                <label className={labelClass}>
                  Chapter Number
                </label>

                <input
                  type="number"
                  min="1"
                  required
                  value={chapterNum}
                  onChange={(e) =>
                    setChapterNum(
                      e.target.value
                    )
                  }
                  placeholder="1"
                  className={inputClass}
                />

              </div>

            </div>


            <div>

              <label className={labelClass}>
                Chapter Description
              </label>

              <textarea
                required
                rows="3"
                value={chapterDesc}
                onChange={(e) =>
                  setChapterDesc(
                    e.target.value
                  )
                }
                placeholder="Brief chapter description..."
                className={inputClass}
              />

            </div>


            <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/20">

              <p className="text-xs font-semibold text-primary-500">

                {selectedSubjectObject?.name ||
                  'Subject'}

                {' → '}

                {selectedExam ||
                  'Exam'}

                {' → '}

                {selectedClass ||
                  'Class'}

              </p>

            </div>


            <Button
              type="submit"
              icon={PlusCircle}
            >
              Create Chapter
            </Button>

          </form>

        </Card>

      )}


      {/* ================================================================
          UPLOAD STUDY NOTE
      ================================================================= */}

      {activeSection === 'note' && (

        <Card
          title="Upload Study Note"
          subtitle="Upload a PDF and attach it to Subject → Exam → Class → Chapter"
        >

          <form
            onSubmit={handleAddNote}
            className="space-y-6 mt-4"
          >


            {/* Hierarchy */}

            <div className="grid md:grid-cols-3 gap-4">

              <div>

                <label className={labelClass}>
                  1. Subject
                </label>

                <NavtaAdminSelect
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  placeholder="Select Subject"
                  options={subjects.map((s) => ({
                    value: s._id || s.id,
                    label: s.name
                  }))}
                />

              </div>


              <div>

                <label className={labelClass}>
                  2. Examination
                </label>

                <NavtaAdminSelect
                  value={selectedExam}
                  onChange={handleExamChange}
                  placeholder="Select Examination"
                  disabled={!selectedSubject}
                  options={availableExams.map((exam) => ({
                    value: exam,
                    label: exam
                  }))}
                />

              </div>


              <div>

                <label className={labelClass}>
                  3. Class
                </label>

                <NavtaAdminSelect
                  value={selectedClass}
                  onChange={(value) => {
                    setSelectedClass(value);
                    setSelectedChapter('');
                  }}
                  placeholder="Select Class"
                  disabled={!selectedExam}
                  options={CLASS_OPTIONS.map((item) => ({
                    value: item,
                    label: item
                  }))}
                />

              </div>

            </div>


            {/* Chapter */}

            <div>

              <label className={labelClass}>
                4. Chapter
              </label>

              <NavtaAdminSelect
                value={selectedChapter}
                onChange={setSelectedChapter}
                placeholder={
                  chapters.length === 0
                    ? 'No chapters available'
                    : 'Select Chapter'
                }
                disabled={
                  !selectedClass ||
                  chapters.length === 0
                }
                options={chapters.map((chapter) => ({
                  value: chapter._id || chapter.id,
                  label: `Ch ${chapter.chapterNumber} — ${chapter.title}`
                }))}
              />

            </div>


            {/* Selected Path */}

            <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/20">

              <div className="flex flex-wrap items-center gap-2 text-xs">

                <BookOpen className="w-4 h-4 text-primary-500" />

                <span className="font-semibold text-primary-500">

                  {selectedSubjectObject?.name ||
                    'Subject'}

                </span>

                <span className="text-slate-400">
                  →
                </span>

                <span>
                  {selectedExam ||
                    'Exam'}
                </span>

                <span className="text-slate-400">
                  →
                </span>

                <span>
                  {selectedClass ||
                    'Class'}
                </span>

              </div>

            </div>


            {/* Note title */}

            <div>

              <label className={labelClass}>
                5. Note Title
              </label>

              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) =>
                  setNoteTitle(
                    e.target.value
                  )
                }
                placeholder="Newton's Laws Complete Notes"
                className={inputClass}
              />

            </div>


            {/* Content */}

            <div>

              <label className={labelClass}>
                6. Note Content
              </label>

              <textarea
                required
                rows="8"
                value={noteContent}
                onChange={(e) =>
                  setNoteContent(
                    e.target.value
                  )
                }
                placeholder={`Write the study note here...

You can use:

## Newton's First Law

An object remains at rest...

### Important Formula

F = ma

- Point 1
- Point 2
- Point 3`}
                className={inputClass}
              />

              <p className="text-[11px] text-slate-500 mt-2">
                Markdown-style headings and bullet points
                are supported by the Study Notes reader.
              </p>

            </div>


            {/* PDF Upload */}

            <div>

              <label className={labelClass}>
                7. Upload PDF
              </label>


              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-primary-500 transition-colors">

                <div className="flex flex-col items-center justify-center text-center">

                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-3">

                    <Upload className="w-6 h-6 text-primary-500" />

                  </div>


                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">

                    {notePdfFile
                      ? notePdfFile.name
                      : 'Choose your PDF file'}

                  </p>


                  <p className="text-xs text-slate-400 mt-1">
                    PDF only • Maximum 25 MB
                  </p>


                  <label className="mt-4 cursor-pointer">

                    <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-bold hover:bg-primary-600 transition-colors">

                      <Upload className="w-4 h-4" />

                      {notePdfFile
                        ? 'Change PDF'
                        : 'Choose PDF'}

                    </span>


                    <input
                      id="study-note-pdf"
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={
                        handleNoteFileChange
                      }
                      className="hidden"
                    />

                  </label>


                  {notePdfFile && (

                    <button
                      type="button"
                      onClick={() =>
                        setNotePdfFile(null)
                      }
                      className="mt-3 text-xs text-red-500 hover:text-red-600"
                    >
                      Remove selected PDF
                    </button>

                  )}

                </div>

              </div>

            </div>


            {/* Optional URL */}

            <details className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">

              <summary className="cursor-pointer text-xs font-bold text-slate-500">
                Or use an existing PDF URL
              </summary>


              <div className="mt-4">

                <input
                  type="url"
                  value={notePdfUrl}
                  onChange={(e) =>
                    setNotePdfUrl(
                      e.target.value
                    )
                  }
                  placeholder="https://example.com/notes.pdf"
                  className={inputClass}
                />

                <p className="text-[11px] text-slate-500 mt-2">
                  You normally don't need this. Use
                  "Choose PDF" when uploading a file from
                  your computer.
                </p>

              </div>

            </details>


            {/* Submit */}

            <div className="flex items-center gap-3 pt-2">

              <Button
                type="submit"
                icon={Upload}
                disabled={noteUploading}
              >

                {noteUploading
                  ? 'Uploading...'
                  : 'Upload Study Note'}

              </Button>


              <button
                type="button"
                onClick={() => {
                  setNoteTitle('');
                  setNoteContent('');
                  setNotePdfFile(null);
                  setNotePdfUrl('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Clear
              </button>

            </div>

          </form>

        </Card>

      )}


      {/* ================================================================
          PYQ
      ================================================================= */}

      {activeSection === 'pyq' && (

        <Card
          title="Upload PYQ Paper"
          subtitle="Add previous-year examination papers"
        >

          <form
            onSubmit={handleAddPYQ}
            className="space-y-5 mt-4 max-w-2xl"
          >

            <div className="grid md:grid-cols-2 gap-4">

              <div>

                <label className={labelClass}>
                  Subject
                </label>

                <select
                  value={selectedSubject}
                  onChange={(e) =>
                    handleSubjectChange(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >

                  {subjects.map((s) => (

                    <option
                      key={s._id || s.id}
                      value={s._id || s.id}
                    >
                      {s.name}
                    </option>

                  ))}

                </select>

              </div>


              <div>

                <label className={labelClass}>
                  Chapter
                </label>

                <select
                  value={selectedChapter}
                  onChange={(e) =>
                    setSelectedChapter(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >

                  <option value="">
                    None
                  </option>

                  {chapters.map((c) => (

                    <option
                      key={
                        c._id || c.id
                      }
                      value={
                        c._id || c.id
                      }
                    >
                      Ch {c.chapterNumber}: {c.title}
                    </option>

                  ))}

                </select>

              </div>

            </div>


            <div className="grid md:grid-cols-2 gap-4">

              <div>

                <label className={labelClass}>
                  Exam Year
                </label>

                <input
                  type="number"
                  required
                  value={pyqYear}
                  onChange={(e) =>
                    setPyqYear(
                      e.target.value
                    )
                  }
                  placeholder="2026"
                  className={inputClass}
                />

              </div>


              <div>

                <label className={labelClass}>
                  Exam Name
                </label>

                <input
                  required
                  value={pyqExam}
                  onChange={(e) =>
                    setPyqExam(
                      e.target.value
                    )
                  }
                  placeholder="JEE Mains"
                  className={inputClass}
                />

              </div>

            </div>


            <div>

              <label className={labelClass}>
                Paper Title
              </label>

              <input
                required
                value={pyqTitle}
                onChange={(e) =>
                  setPyqTitle(
                    e.target.value
                  )
                }
                placeholder="JEE Mains Physics 2026"
                className={inputClass}
              />

            </div>


            <div>

              <label className={labelClass}>
                PDF URL
              </label>

              <input
                type="url"
                required
                value={pyqPdf}
                onChange={(e) =>
                  setPyqPdf(
                    e.target.value
                  )
                }
                placeholder="https://example.com/paper.pdf"
                className={inputClass}
              />

            </div>


            <Button
              type="submit"
              icon={Upload}
            >
              Upload PYQ
            </Button>

          </form>

        </Card>

      )}


      {/* ================================================================
          QUIZ
      ================================================================= */}

      {activeSection === 'quiz' && (

        <Card
          title="Build Interactive Quiz"
          subtitle="Create MCQ and answer-based assessments"
        >

          <form
            onSubmit={handleCreateQuiz}
            className="space-y-6 mt-4"
          >

            <div className="grid md:grid-cols-2 gap-4">

              <div>

                <label className={labelClass}>
                  Subject
                </label>

                <select
                  value={selectedSubject}
                  onChange={(e) =>
                    handleSubjectChange(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >

                  {subjects.map((s) => (

                    <option
                      key={
                        s._id || s.id
                      }
                      value={
                        s._id || s.id
                      }
                    >
                      {s.name}
                    </option>

                  ))}

                </select>

              </div>


              <div>

                <label className={labelClass}>
                  Chapter
                </label>

                <select
                  value={selectedChapter}
                  onChange={(e) =>
                    setSelectedChapter(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >

                  <option value="">
                    Subject-wide Quiz
                  </option>

                  {chapters.map((c) => (

                    <option
                      key={
                        c._id || c.id
                      }
                      value={
                        c._id || c.id
                      }
                    >
                      Ch {c.chapterNumber}: {c.title}
                    </option>

                  ))}

                </select>

              </div>

            </div>


            <div className="grid md:grid-cols-3 gap-4">

              <div>

                <label className={labelClass}>
                  Quiz Title
                </label>

                <input
                  required
                  value={quizTitle}
                  onChange={(e) =>
                    setQuizTitle(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />

              </div>


              <div>

                <label className={labelClass}>
                  Duration (Minutes)
                </label>

                <input
                  type="number"
                  required
                  value={quizDuration}
                  onChange={(e) =>
                    setQuizDuration(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />

              </div>


              <div>

                <label className={labelClass}>
                  Passing Score %
                </label>

                <input
                  type="number"
                  required
                  value={quizPass}
                  onChange={(e) =>
                    setQuizPass(
                      e.target.value
                    )
                  }
                  className={inputClass}
                />

              </div>

            </div>


            <div>

              <label className={labelClass}>
                Description
              </label>

              <textarea
                rows="3"
                value={quizDesc}
                onChange={(e) =>
                  setQuizDesc(
                    e.target.value
                  )
                }
                className={inputClass}
              />

            </div>


            <div className="space-y-5 border-t border-slate-200 dark:border-slate-800 pt-5">

              <div className="flex items-center justify-between">

                <h3 className="font-bold text-slate-900 dark:text-white">
                  Questions
                </h3>

                <Button
                  type="button"
                  variant="secondary"
                  icon={PlusCircle}
                  onClick={addQuestionField}
                >
                  Add Question
                </Button>

              </div>


              {quizQuestions.map(
                (q, index) => (

                  <div
                    key={index}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
                  >

                    <p className="text-sm font-bold text-primary-500">
                      Question #{index + 1}
                    </p>


                    <textarea
                      required
                      rows="2"
                      value={q.text}
                      onChange={(e) =>
                        handleQuizQuestionChange(
                          index,
                          'text',
                          e.target.value
                        )
                      }
                      placeholder="Question text..."
                      className={inputClass}
                    />


                    <select
                      value={
                        q.questionType
                      }
                      onChange={(e) =>
                        handleQuizQuestionChange(
                          index,
                          'questionType',
                          e.target.value
                        )
                      }
                      className={inputClass}
                    >

                      <option value="mcq">
                        Multiple Choice
                      </option>

                      <option value="short">
                        Short Answer
                      </option>

                      <option value="long">
                        Long Answer
                      </option>

                    </select>


                    {q.questionType ===
                    'mcq' ? (

                      <div className="grid md:grid-cols-2 gap-3">

                        {q.options.map(
                          (option, optIndex) => (

                            <div
                              key={optIndex}
                              className="flex items-center gap-2"
                            >

                              <input
                                type="radio"
                                checked={
                                  q.correctOption ===
                                  optIndex
                                }
                                onChange={() =>
                                  handleQuizQuestionChange(
                                    index,
                                    'correctOption',
                                    optIndex
                                  )
                                }
                              />

                              <input
                                required
                                value={option}
                                onChange={(e) =>
                                  handleQuizQuestionChange(
                                    index,
                                    'options',
                                    e.target.value,
                                    optIndex
                                  )
                                }
                                placeholder={`Option ${optIndex + 1}`}
                                className={inputClass}
                              />

                            </div>

                          )
                        )}

                      </div>

                    ) : (

                      <textarea
                        required
                        rows="2"
                        value={
                          q.correctAnswer
                        }
                        onChange={(e) =>
                          handleQuizQuestionChange(
                            index,
                            'correctAnswer',
                            e.target.value
                          )
                        }
                        placeholder="Correct answer"
                        className={inputClass}
                      />

                    )}


                    <input
                      value={
                        q.explanation
                      }
                      onChange={(e) =>
                        handleQuizQuestionChange(
                          index,
                          'explanation',
                          e.target.value
                        )
                      }
                      placeholder="Explanation"
                      className={inputClass}
                    />


                    {quizQuestions.length >
                      1 && (

                      <button
                        type="button"
                        onClick={() => {

                          const updated =
                            [...quizQuestions];

                          updated.splice(
                            index,
                            1
                          );

                          setQuizQuestions(
                            updated
                          );

                        }}
                        className="text-xs font-bold text-red-500"
                      >
                        Remove Question
                      </button>

                    )}

                  </div>

                )
              )}

            </div>


            <Button
              type="submit"
              icon={PlusCircle}
            >
              Compile and Save Quiz
            </Button>

          </form>

        </Card>

      )}


      {/* ================================================================
          REWARD
      ================================================================= */}

      {activeSection === 'reward' && (

        <Card
          title="Reward Catalogue"
          subtitle="Create rewards for students"
        >

          <form
            onSubmit={handleAddReward}
            className="space-y-4 mt-4 max-w-xl"
          >

            <input
              required
              value={rewTitle}
              onChange={(e) =>
                setRewTitle(
                  e.target.value
                )
              }
              placeholder="Reward Title"
              className={inputClass}
            />


            <input
              type="number"
              required
              value={rewCoins}
              onChange={(e) =>
                setRewCoins(
                  e.target.value
                )
              }
              placeholder="Coins"
              className={inputClass}
            />


            <select
              value={rewType}
              onChange={(e) =>
                setRewType(
                  e.target.value
                )
              }
              className={inputClass}
            >

              <option value="badge">
                Badge
              </option>

              <option value="coupon">
                Coupon
              </option>

              <option value="resource">
                Resource
              </option>

            </select>


            <select
              value={rewBadge}
              onChange={(e) =>
                setRewBadge(
                  e.target.value
                )
              }
              className={inputClass}
            >

              <option value="star">
                Star
              </option>

              <option value="crown">
                Crown
              </option>

              <option value="award">
                Award
              </option>

            </select>


            <textarea
              required
              rows="3"
              value={rewDesc}
              onChange={(e) =>
                setRewDesc(
                  e.target.value
                )
              }
              placeholder="Reward description"
              className={inputClass}
            />


            <Button
              type="submit"
              icon={Award}
            >
              Create Reward
            </Button>

          </form>

        </Card>

      )}


      {/* ================================================================
          QUESTIONS
      ================================================================= */}

      {activeSection === 'questions' && (

        <div className="space-y-6">

          <Card
            title="Add Question"
            subtitle="Add questions to the question bank"
          >

            <form
              onSubmit={handleAddQuestion}
              className="space-y-4 mt-4 max-w-2xl"
            >

              <div className="grid md:grid-cols-2 gap-4">

                <select
                  value={qType}
                  onChange={(e) =>
                    setQType(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >

                  <option value="mcq">
                    Multiple Choice
                  </option>

                  <option value="short">
                    Short Answer
                  </option>

                  <option value="long">
                    Long Answer
                  </option>

                </select>


                <select
                  value={qSubj}
                  onChange={(e) =>
                    setQSubj(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >

                  <option value="">
                    General
                  </option>

                  {subjects.map((s) => (

                    <option
                      key={
                        s._id || s.id
                      }
                      value={
                        s._id || s.id
                      }
                    >
                      {s.name}
                    </option>

                  ))}

                </select>

              </div>


              <textarea
                required
                rows="3"
                value={qText}
                onChange={(e) =>
                  setQText(
                    e.target.value
                  )
                }
                placeholder="Question text..."
                className={inputClass}
              />


              {qType === 'mcq' ? (

                <div className="space-y-3">

                  {qOptions.map(
                    (option, index) => (

                      <div
                        key={index}
                        className="flex gap-2 items-center"
                      >

                        <input
                          type="radio"
                          checked={
                            qCorrectIndex ===
                            index
                          }
                          onChange={() =>
                            setQCorrectIndex(
                              index
                            )
                          }
                        />

                        <input
                          required
                          value={option}
                          onChange={(e) => {

                            const updated =
                              [...qOptions];

                            updated[index] =
                              e.target.value;

                            setQOptions(
                              updated
                            );

                          }}
                          placeholder={`Option ${index + 1}`}
                          className={inputClass}
                        />

                      </div>

                    )
                  )}

                </div>

              ) : (

                <textarea
                  required
                  rows="3"
                  value={qCorrectAnswer}
                  onChange={(e) =>
                    setQCorrectAnswer(
                      e.target.value
                    )
                  }
                  placeholder="Correct answer"
                  className={inputClass}
                />

              )}


              <select
                value={qDifficulty}
                onChange={(e) =>
                  setQDifficulty(
                    e.target.value
                  )
                }
                className={inputClass}
              >

                <option value="easy">
                  Easy
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="hard">
                  Hard
                </option>

              </select>


              <textarea
                rows="2"
                value={qExplanation}
                onChange={(e) =>
                  setQExplanation(
                    e.target.value
                  )
                }
                placeholder="Explanation"
                className={inputClass}
              />


              <Button
                type="submit"
                icon={PlusSquare}
              >
                Add Question
              </Button>

            </form>

          </Card>


          <Card
            title="Question Bank"
            subtitle="Existing questions"
          >

            <div className="overflow-x-auto">

              <table className="w-full text-left text-sm">

                <thead>

                  <tr className="border-b border-slate-200 dark:border-slate-800">

                    <th className="py-3">
                      Type
                    </th>

                    <th className="py-3">
                      Question
                    </th>

                    <th className="py-3">
                      Subject
                    </th>

                    <th className="py-3 text-right">
                      Delete
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {questions.map(
                    (q) => (

                      <tr
                        key={
                          q._id ||
                          q.id
                        }
                        className="border-b border-slate-100 dark:border-slate-800/40"
                      >

                        <td className="py-3 uppercase text-xs">
                          {q.questionType}
                        </td>

                        <td className="py-3 max-w-md truncate">
                          {q.text}
                        </td>

                        <td className="py-3">
                          {q.subject?.name ||
                            'General'}
                        </td>

                        <td className="py-3 text-right">

                          <button
                            onClick={() =>
                              handleDeleteQuestion(
                                q._id ||
                                q.id
                              )
                            }
                            className="text-red-500"
                          >

                            <Trash2 className="w-4 h-4" />

                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </Card>

        </div>

      )}


      {/* ================================================================
          STUDENT EDIT MODAL
      ================================================================= */}

      {editingStudent && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">

          <Card
            className="w-full max-w-md relative"
            title={`Manage Student: ${editingStudent.name}`}
          >

            <button
              onClick={() =>
                setEditingStudent(null)
              }
              className="absolute top-4 right-4 text-slate-400"
            >

              <X className="w-5 h-5" />

            </button>


            <form
              onSubmit={
                handleUpdateStudent
              }
              className="space-y-4 mt-4"
            >

              <input
                type="number"
                value={editCoins}
                onChange={(e) =>
                  setEditCoins(
                    e.target.value
                  )
                }
                placeholder="Coins"
                className={inputClass}
              />


              <input
                type="number"
                value={editXp}
                onChange={(e) =>
                  setEditXp(
                    e.target.value
                  )
                }
                placeholder="XP"
                className={inputClass}
              />


              <input
                type="number"
                value={editLevel}
                onChange={(e) =>
                  setEditLevel(
                    e.target.value
                  )
                }
                placeholder="Level"
                className={inputClass}
              />


              <div className="flex justify-end gap-2">

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setEditingStudent(
                      null
                    )
                  }
                >
                  Cancel
                </Button>

                <Button type="submit">
                  Save Changes
                </Button>

              </div>

            </form>

          </Card>

        </div>

      )}

    </div>

  );

}
