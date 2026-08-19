import React, { useEffect, useState } from 'react';
import { contentAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  BookOpen,
  Download,
  User,
  Info,
  FileText,
  Atom,
  FlaskConical,
  Calculator,
  Dna,
  GraduationCap,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| Study Notes Configuration
|--------------------------------------------------------------------------
*/

const SUBJECT_CONFIG = {
  Physics: {
    icon: Atom,
    color: 'blue',
    exams: ['JEE Mains', 'NEET', 'Boards']
  },

  Chemistry: {
    icon: FlaskConical,
    color: 'purple',
    exams: ['JEE Mains', 'NEET', 'Boards']
  },

  Mathematics: {
    icon: Calculator,
    color: 'green',
    exams: ['JEE Mains', 'Boards']
  },

  Biology: {
    icon: Dna,
    color: 'pink',
    exams: ['NEET', 'Boards']
  }
};

const CLASSES = ['Class 11', 'Class 12'];

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function NotesPage() {
  const [subjects, setSubjects] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Fetch Subjects
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    contentAPI.getSubjects()
      .then((res) => {
        setSubjects(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load subjects:', err);
        setLoading(false);
      });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Fetch Chapters
  |--------------------------------------------------------------------------
  |
  | At this stage we fetch chapters using the existing API.
  |
  | Later, the backend can be updated to support:
  |
  | getChapters(subjectId, exam, className)
  |
  */

  useEffect(() => {
    if (!selectedSubject || !selectedExam || !selectedClass) {
      setChapters([]);
      setSelectedChapter('');
      setNotes([]);
      setSelectedNote(null);
      return;
    }

    setChaptersLoading(true);

    contentAPI.getChapters(selectedSubject._id)
      .then((res) => {
        let chapterData = res.data || [];

        /*
        |--------------------------------------------------------------------------
        | If your backend already contains exam/class fields,
        | filter them here.
        |
        | Supported possible field names:
        | exam
        | className
        | class
        |--------------------------------------------------------------------------
        */

        chapterData = chapterData.filter((chapter) => {
          const chapterExam =
            chapter.exam ||
            chapter.examType ||
            chapter.examination;

          const chapterClass =
            chapter.className ||
            chapter.class ||
            chapter.classLevel;

          /*
          | If backend does not yet contain these fields,
          | don't filter anything. This keeps the existing
          | chapters working until backend changes are made.
          */

          const examMatches =
            !chapterExam || chapterExam === selectedExam;

          const classMatches =
            !chapterClass || chapterClass === selectedClass;

          return examMatches && classMatches;
        });

        setChapters(chapterData);

        if (chapterData.length > 0) {
          setSelectedChapter(chapterData[0]._id);
        } else {
          setSelectedChapter('');
          setNotes([]);
          setSelectedNote(null);
        }

        setChaptersLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load chapters:', err);
        setChapters([]);
        setSelectedChapter('');
        setChaptersLoading(false);
      });
  }, [selectedSubject, selectedExam, selectedClass]);

  /*
  |--------------------------------------------------------------------------
  | Fetch Notes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!selectedChapter) {
      setNotes([]);
      setSelectedNote(null);
      return;
    }

    contentAPI.getNotes(selectedChapter)
      .then((res) => {
        const noteData = res.data || [];

        setNotes(noteData);

        if (noteData.length > 0) {
          setSelectedNote(noteData[0]);
        } else {
          setSelectedNote(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load notes:', err);
        setNotes([]);
        setSelectedNote(null);
      });
  }, [selectedChapter]);

  /*
  |--------------------------------------------------------------------------
  | Subject Selection
  |--------------------------------------------------------------------------
  */

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setSelectedExam('');
    setSelectedClass('');
    setChapters([]);
    setSelectedChapter('');
    setNotes([]);
    setSelectedNote(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Exam Selection
  |--------------------------------------------------------------------------
  */

  const handleExamSelect = (exam) => {
    setSelectedExam(exam);
    setSelectedClass('');
    setChapters([]);
    setSelectedChapter('');
    setNotes([]);
    setSelectedNote(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Class Selection
  |--------------------------------------------------------------------------
  */

  const handleClassSelect = (className) => {
    setSelectedClass(className);
    setSelectedChapter('');
    setNotes([]);
    setSelectedNote(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Go Back
  |--------------------------------------------------------------------------
  */

  const resetSelection = () => {
    setSelectedSubject(null);
    setSelectedExam('');
    setSelectedClass('');
    setChapters([]);
    setSelectedChapter('');
    setNotes([]);
    setSelectedNote(null);
  };

  const goBackToSubjects = () => {
    setSelectedSubject(null);
    setSelectedExam('');
    setSelectedClass('');
    setChapters([]);
    setSelectedChapter('');
    setNotes([]);
    setSelectedNote(null);
  };

  const goBackToExams = () => {
    setSelectedExam('');
    setSelectedClass('');
    setChapters([]);
    setSelectedChapter('');
    setNotes([]);
    setSelectedNote(null);
  };

  const goBackToClasses = () => {
    setSelectedClass('');
    setChapters([]);
    setSelectedChapter('');
    setNotes([]);
    setSelectedNote(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Render Note Content
  |--------------------------------------------------------------------------
  */

  const renderNoteContent = (content) => {
    if (!content) return '';

    return content.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h3
            key={idx}
            className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2"
          >
            {line.replace('### ', '')}
          </h3>
        );
      }

      if (line.startsWith('## ')) {
        return (
          <h2
            key={idx}
            className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2"
          >
            {line.replace('## ', '')}
          </h2>
        );
      }

      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc text-sm text-slate-600 dark:text-slate-400 my-1"
          >
            {line.substring(2)}
          </li>
        );
      }

      if (line.match(/^\d+\.\s/)) {
        return (
          <li
            key={idx}
            className="ml-4 list-decimal text-sm text-slate-600 dark:text-slate-400 my-1"
          >
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p
          key={idx}
          className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed my-2"
        >
          {line}
        </p>
      );
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
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
  | Main Page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">

        <div className="flex items-center gap-3">

          <div className="p-2.5 rounded-xl bg-primary-500/10">
            <BookOpen className="w-6 h-6 text-primary-500" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Study Notes Library
            </h1>

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Select your subject, examination, class and chapter.
            </p>
          </div>

        </div>

      </div>


      {/* ================================================================
          BREADCRUMB
      ================================================================= */}

      {selectedSubject && (
        <div className="flex flex-wrap items-center gap-2 text-xs">

          <button
            onClick={goBackToSubjects}
            className="text-primary-500 hover:text-primary-400 font-semibold"
          >
            Subjects
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />

          <span className="text-slate-700 dark:text-slate-300 font-semibold">
            {selectedSubject.name}
          </span>

          {selectedExam && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />

              <button
                onClick={goBackToExams}
                className="text-primary-500 hover:text-primary-400 font-semibold"
              >
                {selectedExam}
              </button>
            </>
          )}

          {selectedClass && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />

              <button
                onClick={goBackToClasses}
                className="text-primary-500 hover:text-primary-400 font-semibold"
              >
                {selectedClass}
              </button>
            </>
          )}

          {selectedChapter && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />

              <span className="text-slate-500">
                Chapter
              </span>
            </>
          )}

        </div>
      )}


      {/* ================================================================
          STEP 1 — SUBJECT
      ================================================================= */}

      {!selectedSubject && (
        <div className="space-y-4">

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Step 1
            </p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Select Subject
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose the subject for which you want to access study notes.
            </p>
          </div>


          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {subjects.map((subject) => {

              const config =
                SUBJECT_CONFIG[subject.name] ||
                SUBJECT_CONFIG[
                  Object.keys(SUBJECT_CONFIG).find(
                    key =>
                      key.toLowerCase() ===
                      subject.name?.toLowerCase()
                  )
                ];

              const Icon = config?.icon || BookOpen;

              return (
                <button
                  key={subject._id}
                  onClick={() => handleSubjectSelect(subject)}
                  className="group text-left p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-primary-500 hover:bg-primary-500/5 transition-all duration-200"
                >

                  <div className="flex items-center justify-between">

                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-500" />
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />

                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4">
                    {subject.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Study notes and chapter resources
                  </p>

                </button>
              );
            })}

          </div>

        </div>
      )}


      {/* ================================================================
          STEP 2 — EXAM
      ================================================================= */}

      {selectedSubject && !selectedExam && (
        <div className="space-y-4">

          <button
            onClick={goBackToSubjects}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subjects
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Step 2
            </p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Select Examination
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose the examination for {selectedSubject.name}.
            </p>
          </div>


          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {(SUBJECT_CONFIG[selectedSubject.name]?.exams || []).map(
              (exam) => (

                <button
                  key={exam}
                  onClick={() => handleExamSelect(exam)}
                  className="group text-left p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-primary-500 hover:bg-primary-500/5 transition-all"
                >

                  <div className="flex items-center justify-between">

                    <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary-500" />
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />

                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4">
                    {exam}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedSubject.name} preparation
                  </p>

                </button>

              )
            )}

          </div>

        </div>
      )}


      {/* ================================================================
          STEP 3 — CLASS
      ================================================================= */}

      {selectedSubject && selectedExam && !selectedClass && (
        <div className="space-y-4">

          <button
            onClick={goBackToExams}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Examinations
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Step 3
            </p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Select Class
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {selectedSubject.name} • {selectedExam}
            </p>
          </div>


          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">

            {CLASSES.map((className) => (

              <button
                key={className}
                onClick={() => handleClassSelect(className)}
                className="group text-left p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-primary-500 hover:bg-primary-500/5 transition-all"
              >

                <div className="flex items-center justify-between">

                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-primary-500" />
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />

                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">
                  {className}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  View {className} {selectedSubject.name} chapters
                </p>

              </button>

            ))}

          </div>

        </div>
      )}


      {/* ================================================================
          STEP 4 — CHAPTERS + NOTES
      ================================================================= */}

      {selectedSubject && selectedExam && selectedClass && (
        <div className="space-y-5">

          <button
            onClick={goBackToClasses}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-500"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </button>


          {/* Selected path */}

          <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/20">

            <div className="flex flex-wrap items-center gap-2">

              <span className="text-xs font-semibold text-primary-500">
                {selectedSubject.name}
              </span>

              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

              <span className="text-xs font-semibold text-primary-500">
                {selectedExam}
              </span>

              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

              <span className="text-xs font-semibold text-primary-500">
                {selectedClass}
              </span>

            </div>

          </div>


          <div className="grid lg:grid-cols-4 gap-6">

            {/* ==========================================================
                CHAPTERS
            =========================================================== */}

            <div className="lg:col-span-1 space-y-4">

              <div>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                  Chapters
                </h3>

                <p className="text-[11px] text-slate-500 mt-1 pl-1">
                  Select a chapter to view notes.
                </p>
              </div>


              <div className="space-y-1 bg-white/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/40">

                {chaptersLoading ? (

                  <div className="flex justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                  </div>

                ) : chapters.length > 0 ? (

                  chapters.map((chapter) => (

                    <button
                      key={chapter._id}
                      onClick={() => setSelectedChapter(chapter._id)}
                      className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                        selectedChapter === chapter._id
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >

                      <span className="shrink-0 opacity-80">
                        Ch {chapter.chapterNumber}
                      </span>

                      <span className="truncate">
                        {chapter.title}
                      </span>

                    </button>

                  ))

                ) : (

                  <div className="text-center py-8 px-3">

                    <FileText className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600 mb-2" />

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      No chapters available for this selection.
                    </p>

                  </div>

                )}

              </div>


              {/* Notes List */}

              {notes.length > 0 && (

                <>

                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 mt-4">
                    Notes List
                  </h3>

                  <div className="space-y-1 bg-white/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/40">

                    {notes.map((note) => (

                      <button
                        key={note._id}
                        onClick={() => setSelectedNote(note)}
                        className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                          selectedNote?._id === note._id
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 border-l-4 border-primary-500'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >

                        <FileText className="w-3.5 h-3.5 shrink-0" />

                        <span className="truncate">
                          {note.title}
                        </span>

                      </button>

                    ))}

                  </div>

                </>

              )}

            </div>


            {/* ==========================================================
                NOTE READER
            =========================================================== */}

            <div className="lg:col-span-3">

              {selectedNote ? (

                <Card
                  className="min-h-[500px]"
                  title={selectedNote.title}
                  subtitle={
                    selectedNote.chapter?.title
                      ? `Chapter: ${selectedNote.chapter.title}`
                      : ''
                  }
                  action={
                    selectedNote.pdfUrl && (
                      <a
                        href={selectedNote.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button
                          variant="secondary"
                          className="px-3.5 py-2 text-xs"
                          icon={Download}
                        >
                          Download PDF
                        </Button>
                      </a>
                    )
                  }
                >

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800/20 w-fit px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800/40">

                    <User className="w-3 h-3" />

                    <span>
                      Uploaded by{' '}
                      {selectedNote.uploadedBy?.name || 'Educator'}
                    </span>

                  </div>


                  <div className="border-t border-slate-100 dark:border-slate-800/40 pt-4">

                    {renderNoteContent(selectedNote.content)}

                  </div>

                </Card>

              ) : (

                <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 bg-white/20 dark:bg-slate-900/10">

                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-650 mb-2" />

                  <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                    Select a Chapter
                  </p>

                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center">
                    Select a chapter from the left to view available study notes.
                  </p>

                </div>

              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
