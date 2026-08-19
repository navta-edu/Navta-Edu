import React, { useEffect, useMemo, useState } from 'react';
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
  ArrowLeft,
  Search,
  BookMarked
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| SUBJECT CONFIGURATION
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
| CHAPTER DATABASE
|--------------------------------------------------------------------------
|
| These are the chapters supplied for Navta Study Notes.
|
| They are common for the applicable examinations.
|
|--------------------------------------------------------------------------
*/

const STUDY_CHAPTERS = {

  Physics: {

    'Class 11': [
      'Physical World',
      'Units and Measurements',
      'Motion in a Straight Line',
      'Motion in a Plane',
      'Laws of Motion',
      'Work, Energy and Power',
      'System of Particles and Rotational Motion',
      'Gravitation',
      'Mechanical Properties of Solids',
      'Mechanical Properties of Fluids',
      'Thermal Properties of Matter',
      'Thermodynamics',
      'Kinetic Theory',
      'Oscillations',
      'Waves'
    ],

    'Class 12': [
      'Electric Charges and Fields',
      'Electrostatic Potential and Capacitance',
      'Current Electricity',
      'Moving Charges and Magnetism',
      'Magnetism and Matter',
      'Electromagnetic Induction',
      'Alternating Current',
      'Electromagnetic Waves',
      'Ray Optics and Optical Instruments',
      'Wave Optics',
      'Dual Nature of Radiation and Matter',
      'Atoms',
      'Nuclei',
      'Semiconductor Electronics: Materials, Devices and Simple Circuits'
    ]

  },


  Chemistry: {

    'Class 11': [
      'Some Basic Concepts of Chemistry',
      'Structure of Atom',
      'States of Matter',
      'Thermodynamics',
      'Equilibrium',
      'Redox Reactions',
      'Classification of Elements and Periodicity in Properties',
      'Chemical Bonding and Molecular Structure',
      'Hydrogen',
      'The s-Block Elements',
      'Organic Chemistry – Some Basic Principles and Techniques',
      'Hydrocarbons',
      'Environmental Chemistry'
    ],

    'Class 12': [
      'Solid State',
      'Solutions',
      'Electrochemistry',
      'Chemical Kinetics',
      'Surface Chemistry',
      'General Principles and Processes of Isolation of Elements',
      'p-Block Elements',
      'd- and f-Block Elements',
      'Coordination Compounds',
      'Haloalkanes and Haloarenes',
      'Alcohols, Phenols and Ethers',
      'Aldehydes, Ketones and Carboxylic Acids',
      'Amines',
      'Biomolecules',
      'Polymers',
      'Chemistry in Everyday Life'
    ]

  },


  Mathematics: {

    'Class 11': [
      'Sets',
      'Relations and Functions',
      'Trigonometric Functions',
      'Principle of Mathematical Induction',
      'Complex Numbers and Quadratic Equations',
      'Linear Inequalities',
      'Permutations and Combinations',
      'Binomial Theorem',
      'Sequences and Series',
      'Straight Lines',
      'Conic Sections',
      'Introduction to Three Dimensional Geometry',
      'Limits and Derivatives',
      'Mathematical Reasoning',
      'Statistics',
      'Probability'
    ],

    'Class 12': [
      'Relations and Functions',
      'Inverse Trigonometric Functions',
      'Matrices',
      'Determinants',
      'Continuity and Differentiability',
      'Applications of Derivatives',
      'Integrals',
      'Applications of Integrals',
      'Differential Equations',
      'Vector Algebra',
      'Three Dimensional Geometry',
      'Linear Programming',
      'Probability'
    ]

  },


  Biology: {

    'Class 11': [
      'The Living World',
      'Biological Classification',
      'Plant Kingdom',
      'Animal Kingdom',
      'Morphology of Flowering Plants',
      'Anatomy of Flowering Plants',
      'Structural Organisation in Animals',
      'Cell: The Unit of Life',
      'Biomolecules',
      'Cell Cycle and Cell Division',
      'Photosynthesis in Higher Plants',
      'Respiration in Plants',
      'Plant Growth and Development',
      'Breathing and Exchange of Gases',
      'Body Fluids and Circulation',
      'Excretory Products and their Elimination',
      'Locomotion and Movement',
      'Neural Control and Coordination',
      'Chemical Coordination and Integration'
    ],

    'Class 12': [
      'Sexual Reproduction in Flowering Plants',
      'Human Reproduction',
      'Reproductive Health',
      'Principles of Inheritance and Variation',
      'Molecular Basis of Inheritance',
      'Evolution',
      'Human Health and Disease',
      'Strategies for Enhancement in Food Production',
      'Microbes in Human Welfare',
      'Biotechnology: Principles and Processes',
      'Biotechnology and its Applications',
      'Organisms and Populations',
      'Ecosystem',
      'Biodiversity and Conservation',
      'Environmental Issues'
    ]

  }

};


/*
|--------------------------------------------------------------------------
| HELPER
|--------------------------------------------------------------------------
*/

const normalizeName = (name = '') => {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[–—-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};


/*
|--------------------------------------------------------------------------
| COMPONENT
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

  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | FETCH SUBJECTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const fetchSubjects = async () => {

      try {

        const res = await contentAPI.getSubjects();

        setSubjects(res.data || []);

      } catch (err) {

        console.error('Failed to load subjects:', err);

      } finally {

        setLoading(false);

      }

    };

    fetchSubjects();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | LOAD CHAPTERS
  |--------------------------------------------------------------------------
  |
  | First we use the chapters defined above.
  |
  | Then we try to match them with chapters coming from
  | the backend so that existing database IDs can be used
  | to load notes.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!selectedSubject || !selectedExam || !selectedClass) {

      setChapters([]);
      setSelectedChapter('');
      setNotes([]);
      setSelectedNote(null);

      return;

    }

    const loadChapters = async () => {

      setChaptersLoading(true);

      try {

        const subjectName = selectedSubject.name;

        const localChapterNames =
          STUDY_CHAPTERS[subjectName]?.[selectedClass] || [];


        /*
        |--------------------------------------------------------------------------
        | Try to get chapters from backend
        |--------------------------------------------------------------------------
        */

        let backendChapters = [];

        try {

          const res = await contentAPI.getChapters(selectedSubject._id);

          backendChapters = res.data || [];

        } catch (backendError) {

          console.warn(
            'Backend chapters could not be loaded. Using local chapter list.',
            backendError
          );

        }


        /*
        |--------------------------------------------------------------------------
        | Create chapter objects
        |--------------------------------------------------------------------------
        */

        const finalChapters = localChapterNames.map(
          (chapterName, index) => {

            const matchingBackendChapter =
              backendChapters.find((chapter) => {

                const backendTitle =
                  chapter.title ||
                  chapter.name ||
                  '';

                const backendClass =
                  chapter.className ||
                  chapter.class ||
                  chapter.classLevel;

                const titleMatches =
                  normalizeName(backendTitle) ===
                  normalizeName(chapterName);

                const classMatches =
                  !backendClass ||
                  backendClass === selectedClass ||
                  backendClass === selectedClass.replace('Class ', '');

                return titleMatches && classMatches;

              });


            /*
            |--------------------------------------------------------------------------
            | If backend chapter exists, use its real ID.
            |
            | Otherwise create a frontend-only ID.
            |--------------------------------------------------------------------------
            */

            return {

              _id:
                matchingBackendChapter?._id ||
                `local-${subjectName}-${selectedClass}-${index + 1}`,

              chapterNumber: index + 1,

              title: chapterName,

              subject: subjectName,

              exam: selectedExam,

              className: selectedClass,

              isLocalChapter: !matchingBackendChapter

            };

          }
        );


        setChapters(finalChapters);


        if (finalChapters.length > 0) {

          setSelectedChapter(finalChapters[0]._id);

        } else {

          setSelectedChapter('');
          setNotes([]);
          setSelectedNote(null);

        }

      } catch (err) {

        console.error('Failed to prepare chapters:', err);

        setChapters([]);
        setSelectedChapter('');

      } finally {

        setChaptersLoading(false);

      }

    };


    loadChapters();

  }, [selectedSubject, selectedExam, selectedClass]);


  /*
  |--------------------------------------------------------------------------
  | FETCH NOTES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!selectedChapter) {

      setNotes([]);
      setSelectedNote(null);

      return;

    }


    /*
    |--------------------------------------------------------------------------
    | Local chapter does not have a backend ID.
    |
    | Therefore there cannot be notes attached to it yet.
    |--------------------------------------------------------------------------
    */

    if (selectedChapter.startsWith('local-')) {

      setNotes([]);
      setSelectedNote(null);

      return;

    }


    const fetchNotes = async () => {

      setNotesLoading(true);

      try {

        const res =
          await contentAPI.getNotes(selectedChapter);

        const noteData = res.data || [];

        setNotes(noteData);

        if (noteData.length > 0) {

          setSelectedNote(noteData[0]);

        } else {

          setSelectedNote(null);

        }

      } catch (err) {

        console.error('Failed to load notes:', err);

        setNotes([]);
        setSelectedNote(null);

      } finally {

        setNotesLoading(false);

      }

    };


    fetchNotes();

  }, [selectedChapter]);


  /*
  |--------------------------------------------------------------------------
  | SUBJECT SELECTION
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

    setSearchTerm('');

  };


  /*
  |--------------------------------------------------------------------------
  | EXAM SELECTION
  |--------------------------------------------------------------------------
  */

  const handleExamSelect = (exam) => {

    setSelectedExam(exam);

    setSelectedClass('');

    setChapters([]);
    setSelectedChapter('');

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm('');

  };


  /*
  |--------------------------------------------------------------------------
  | CLASS SELECTION
  |--------------------------------------------------------------------------
  */

  const handleClassSelect = (className) => {

    setSelectedClass(className);

    setSelectedChapter('');

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm('');

  };


  /*
  |--------------------------------------------------------------------------
  | BACK TO SUBJECTS
  |--------------------------------------------------------------------------
  */

  const goBackToSubjects = () => {

    setSelectedSubject(null);

    setSelectedExam('');
    setSelectedClass('');

    setChapters([]);
    setSelectedChapter('');

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm('');

  };


  /*
  |--------------------------------------------------------------------------
  | BACK TO EXAMS
  |--------------------------------------------------------------------------
  */

  const goBackToExams = () => {

    setSelectedExam('');

    setSelectedClass('');

    setChapters([]);
    setSelectedChapter('');

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm('');

  };


  /*
  |--------------------------------------------------------------------------
  | BACK TO CLASSES
  |--------------------------------------------------------------------------
  */

  const goBackToClasses = () => {

    setSelectedClass('');

    setChapters([]);
    setSelectedChapter('');

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm('');

  };


  /*
  |--------------------------------------------------------------------------
  | FILTERED CHAPTERS
  |--------------------------------------------------------------------------
  */

  const filteredChapters = useMemo(() => {

    if (!searchTerm.trim()) {

      return chapters;

    }

    const search = searchTerm.toLowerCase();

    return chapters.filter((chapter) =>
      chapter.title.toLowerCase().includes(search)
    );

  }, [chapters, searchTerm]);


  /*
  |--------------------------------------------------------------------------
  | RENDER NOTE CONTENT
  |--------------------------------------------------------------------------
  */

  const renderNoteContent = (content) => {

    if (!content) {

      return (
        <div className="text-sm text-slate-400">
          No text content available for this note.
        </div>
      );

    }


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


      if (
        line.startsWith('* ') ||
        line.startsWith('- ')
      ) {

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

        return (
          <div
            key={idx}
            className="h-2"
          />
        );

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
  | LOADING SCREEN
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
  | MAIN UI
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

              Select subject, examination, class and chapter to access your study notes.

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

        <div className="space-y-5">

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


              const Icon =
                config?.icon || BookOpen;


              return (

                <button
                  key={subject._id || subject.id}
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

        <div className="space-y-5">

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

      {selectedSubject &&
        selectedExam &&
        !selectedClass && (

          <div className="space-y-5">

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

      {selectedSubject &&
        selectedExam &&
        selectedClass && (

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


            {/* Search */}

            <div className="relative max-w-md">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="Search chapter..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500"
              />

            </div>


            <div className="grid lg:grid-cols-4 gap-6">


              {/* ========================================================
                  CHAPTERS
              ========================================================= */}

              <div className="lg:col-span-1 space-y-4">

                <div>

                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">

                    Chapters

                  </h3>


                  <p className="text-[11px] text-slate-500 mt-1 pl-1">

                    {chapters.length} chapters available

                  </p>

                </div>


                <div className="space-y-1 bg-white/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/40 max-h-[650px] overflow-y-auto">

                  {chaptersLoading ? (

                    <div className="flex justify-center py-8">

                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />

                    </div>

                  ) : filteredChapters.length > 0 ? (

                    filteredChapters.map((chapter) => (

                      <button
                        key={chapter._id}
                        onClick={() =>
                          setSelectedChapter(chapter._id)
                        }
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

                        No chapter found.

                      </p>

                    </div>

                  )}

                </div>


                {/* ======================================================
                    NOTES LIST
                ====================================================== */}

                {notes.length > 0 && (

                  <>

                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 mt-4">

                      Notes List

                    </h3>


                    <div className="space-y-1 bg-white/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/40">

                      {notes.map((note) => (

                        <button
                          key={note._id}
                          onClick={() =>
                            setSelectedNote(note)
                          }
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


              {/* ========================================================
                  NOTE READER
              ========================================================= */}

              <div className="lg:col-span-3">

                {notesLoading ? (

                  <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">

                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mb-3" />

                    <p className="text-sm text-slate-500">

                      Loading notes...

                    </p>

                  </div>

                ) : selectedNote ? (

                  <Card
                    className="min-h-[500px]"
                    title={selectedNote.title}
                    subtitle={
                      selectedNote.chapter?.title
                        ? `Chapter: ${selectedNote.chapter.title}`
                        : `${selectedSubject.name} • ${selectedClass}`
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

                        {selectedNote.uploadedBy?.name ||
                          'Educator'}

                      </span>

                    </div>


                    <div className="border-t border-slate-100 dark:border-slate-800/40 pt-4">

                      {renderNoteContent(
                        selectedNote.content
                      )}

                    </div>

                  </Card>

                ) : (

                  <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 bg-white/20 dark:bg-slate-900/10">

                    <BookMarked className="w-10 h-10 text-slate-300 dark:text-slate-650 mb-3" />


                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">

                      {selectedChapter?.startsWith('local-')
                        ? 'No Notes Uploaded Yet'
                        : 'Select a Chapter'}

                    </p>


                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center max-w-md">

                      {selectedChapter?.startsWith('local-')
                        ? 'This chapter is available in the Study Notes library, but notes have not been uploaded for it yet.'
                        : 'Select a chapter from the left to view available study notes.'}

                    </p>


                    {selectedChapter?.startsWith('local-') && (

                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">

                        <Info className="w-4 h-4" />

                        <span>
                          Notes will appear here after they are uploaded from the Admin Dashboard.
                        </span>

                      </div>

                    )}

                  </div>

                )}

              </div>

            </div>

          </div>

        )}

    </div>

  );

}
