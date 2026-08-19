import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Atom,
  FlaskConical,
  Calculator,
  Dna,
  GraduationCap,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Layers
} from 'lucide-react';

import { adminAPI } from '../utils/api';


/*
|--------------------------------------------------------------------------
| STUDY NOTES DATA
|--------------------------------------------------------------------------
*/

const STUDY_DATA = {
  Physics: {
    exams: ['JEE Mains', 'NEET', 'Boards'],

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
    exams: ['JEE Mains', 'NEET', 'Boards'],

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
    exams: ['JEE Mains', 'Boards'],

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
    exams: ['NEET', 'Boards'],

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
| SUBJECT ICONS
|--------------------------------------------------------------------------
*/

const SUBJECT_ICONS = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Biology: Dna
};


/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function StudyNotesManager() {

  const [subject, setSubject] = useState('Physics');
  const [exam, setExam] = useState('JEE Mains');
  const [className, setClassName] = useState('Class 11');

  const [creating, setCreating] = useState(false);

  const [createdCount, setCreatedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [progress, setProgress] = useState(0);


  /*
  |--------------------------------------------------------------------------
  | CURRENT CHAPTERS
  |--------------------------------------------------------------------------
  */

  const chapters = useMemo(() => {

    return STUDY_DATA[subject]?.[className] || [];

  }, [subject, className]);


  /*
  |--------------------------------------------------------------------------
  | EXAM CHANGE
  |--------------------------------------------------------------------------
  */

  const handleSubjectChange = (value) => {

    setSubject(value);

    const availableExams =
      STUDY_DATA[value]?.exams || [];

    setExam(availableExams[0] || '');

    setCreatedCount(0);
    setFailedCount(0);
    setMessage('');
    setErrorMessage('');
    setProgress(0);

  };


  /*
  |--------------------------------------------------------------------------
  | CREATE ONE CHAPTER
  |--------------------------------------------------------------------------
  */

  const createChapter = async (
    chapterTitle,
    chapterNumber
  ) => {

    /*
     * IMPORTANT:
     *
     * We send the new fields:
     *
     * exam
     * className
     *
     * along with your existing fields.
     */

    return adminAPI.createChapter({

      subjectName: subject,

      subjectId: undefined,

      title: chapterTitle,

      chapterNumber,

      description:
        `${chapterTitle} — ${subject}, ${className}, ${exam} Study Notes`,

      exam,

      className,

      classLevel: className,

      examType: exam

    });

  };


  /*
  |--------------------------------------------------------------------------
  | CREATE ALL CHAPTERS
  |--------------------------------------------------------------------------
  */

  const handleCreateAll = async () => {

    if (!subject || !exam || !className) {

      alert(
        'Please select Subject, Examination and Class.'
      );

      return;

    }


    if (chapters.length === 0) {

      alert('No chapters found for this selection.');

      return;

    }


    const confirmed = window.confirm(

      `Create all ${chapters.length} chapters?\n\n` +

      `${subject}\n` +
      `${exam}\n` +
      `${className}\n\n` +

      `Existing chapters may be rejected by the backend if duplicates are not allowed.`

    );


    if (!confirmed) return;


    setCreating(true);

    setCreatedCount(0);

    setFailedCount(0);

    setProgress(0);

    setMessage('');

    setErrorMessage('');


    let successful = 0;

    let failed = 0;


    for (let i = 0; i < chapters.length; i++) {

      const chapterTitle = chapters[i];

      try {

        await createChapter(
          chapterTitle,
          i + 1
        );

        successful++;

        setCreatedCount(successful);

      } catch (error) {

        failed++;

        setFailedCount(failed);

        console.error(
          `Failed to create ${chapterTitle}:`,
          error
        );

      }


      setProgress(
        Math.round(
          ((i + 1) / chapters.length) * 100
        )
      );

    }


    setCreating(false);


    if (failed === 0) {

      setMessage(
        `Successfully created all ${successful} chapters.`
      );

    } else {

      setMessage(
        `Finished. ${successful} chapters created and ${failed} failed.`
      );

      setErrorMessage(
        'Some chapters could not be created. Check the browser console/backend response for details.'
      );

    }

  };


  /*
  |--------------------------------------------------------------------------
  | CREATE SINGLE CHAPTER
  |--------------------------------------------------------------------------
  */

  const handleCreateSingle = async (
    chapterTitle,
    chapterNumber
  ) => {

    try {

      await createChapter(
        chapterTitle,
        chapterNumber
      );

      alert(
        `Chapter "${chapterTitle}" created successfully.`
      );

    } catch (error) {

      console.error(error);

      alert(
        error?.message ||
        `Failed to create "${chapterTitle}".`
      );

    }

  };


  /*
  |--------------------------------------------------------------------------
  | ICON
  |--------------------------------------------------------------------------
  */

  const SubjectIcon =
    SUBJECT_ICONS[subject] || BookOpen;


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (

    <div className="space-y-6">


      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="glass rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800/40">

        <div className="flex items-start gap-4">

          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center shrink-0">

            <BookOpen className="w-6 h-6 text-primary-500" />

          </div>


          <div>

            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">

              Study Notes Manager

            </h2>


            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">

              Create the complete Study Notes chapter structure for
              Physics, Chemistry, Mathematics and Biology.

            </p>

          </div>

        </div>

      </div>


      {/* ================================================================
          SELECTORS
      ================================================================= */}

      <div className="grid md:grid-cols-3 gap-4">


        {/* SUBJECT */}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">

            Subject

          </label>


          <select
            value={subject}
            onChange={(e) =>
              handleSubjectChange(e.target.value)
            }
            disabled={creating}
            className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          >

            {Object.keys(STUDY_DATA).map(
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


        {/* EXAM */}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">

            Examination

          </label>


          <select
            value={exam}
            onChange={(e) =>
              setExam(e.target.value)
            }
            disabled={creating}
            className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          >

            {(STUDY_DATA[subject]?.exams || []).map(
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


        {/* CLASS */}

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">

            Class

          </label>


          <select
            value={className}
            onChange={(e) =>
              setClassName(e.target.value)
            }
            disabled={creating}
            className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500"
          >

            <option value="Class 11">
              Class 11
            </option>

            <option value="Class 12">
              Class 12
            </option>

          </select>

        </div>

      </div>


      {/* ================================================================
          SUMMARY
      ================================================================= */}

      <div className="bg-primary-500/5 border border-primary-500/20 rounded-2xl p-5">

        <div className="flex flex-wrap items-center gap-4">


          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">

            <SubjectIcon className="w-6 h-6 text-primary-500" />

          </div>


          <div className="flex-1">

            <h3 className="font-bold text-slate-900 dark:text-white">

              {subject}

            </h3>


            <p className="text-xs text-slate-500 dark:text-slate-400">

              {exam} • {className}

            </p>

          </div>


          <div className="text-right">

            <p className="text-2xl font-extrabold text-primary-500">

              {chapters.length}

            </p>


            <p className="text-[10px] uppercase font-bold text-slate-400">

              Chapters

            </p>

          </div>

        </div>

      </div>


      {/* ================================================================
          CREATE ALL BUTTON
      ================================================================= */}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">


          <div>

            <h3 className="font-bold text-slate-900 dark:text-white">

              Create Complete Chapter Structure

            </h3>


            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">

              This will create all {chapters.length} chapters
              for {subject} — {exam} — {className}.

            </p>

          </div>


          <button
            onClick={handleCreateAll}
            disabled={creating || chapters.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
          >

            {creating ? (

              <>

                <Loader2 className="w-4 h-4 animate-spin" />

                Creating...

              </>

            ) : (

              <>

                <PlusCircle className="w-4 h-4" />

                Create All {chapters.length} Chapters

              </>

            )}

          </button>

        </div>


        {/* PROGRESS */}

        {creating && (

          <div className="mt-5">

            <div className="flex justify-between text-xs mb-2">

              <span className="text-slate-500">

                Creating chapters...

              </span>


              <span className="font-bold text-primary-500">

                {progress}%

              </span>

            </div>


            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">

              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{
                  width: `${progress}%`
                }}
              />

            </div>

          </div>

        )}

      </div>


      {/* ================================================================
          RESULT
      ================================================================= */}

      {(message || errorMessage) && (

        <div className="space-y-2">


          {message && (

            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">

              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />

              <p className="text-sm text-emerald-600 dark:text-emerald-400">

                {message}

              </p>

            </div>

          )}


          {errorMessage && (

            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">

              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />

              <p className="text-sm text-red-600 dark:text-red-400">

                {errorMessage}

              </p>

            </div>

          )}

        </div>

      )}


      {/* ================================================================
          CHAPTER LIST
      ================================================================= */}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">


        <div className="p-5 border-b border-slate-100 dark:border-slate-800">

          <div className="flex items-center gap-2">

            <Layers className="w-5 h-5 text-primary-500" />

            <h3 className="font-bold text-slate-900 dark:text-white">

              Chapter List

            </h3>

          </div>

        </div>


        <div className="divide-y divide-slate-100 dark:divide-slate-800">

          {chapters.map(
            (chapter, index) => (

              <div
                key={chapter}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >

                <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">

                  <span className="text-xs font-bold text-primary-500">

                    {index + 1}

                  </span>

                </div>


                <div className="flex-1 min-w-0">

                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">

                    {chapter}

                  </p>


                  <p className="text-[10px] text-slate-400 mt-0.5">

                    {subject} • {exam} • {className}

                  </p>

                </div>


                <button
                  onClick={() =>
                    handleCreateSingle(
                      chapter,
                      index + 1
                    )
                  }
                  disabled={creating}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-primary-500 hover:text-primary-500 disabled:opacity-50"
                >

                  <PlusCircle className="w-3.5 h-3.5" />

                  Create

                </button>

              </div>

            )
          )}

        </div>

      </div>


      {/* ================================================================
          INFORMATION
      ================================================================= */}

      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">

        <div className="flex gap-3">

          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />

          <div>

            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">

              Important

            </p>


            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 leading-relaxed">

              Creating chapters only creates the chapter structure.
              You will still upload the actual Study Notes/PDF
              separately for each chapter from the Notes Upload section.

            </p>

          </div>

        </div>

      </div>

    </div>

  );

}
