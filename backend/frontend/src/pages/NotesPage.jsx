import React, { useEffect, useMemo, useRef, useState } from "react";
import { contentAPI } from "../utils/api";
import { Link, useLocation } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

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
  BookMarked,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| SUBJECT CONFIGURATION
|--------------------------------------------------------------------------
*/


const SUBJECT_CONFIG = {
  Physics: {
    icon: Atom,
    color: "blue",
    exams: ["JEE Mains", "NEET", "Boards"],
  },

  Chemistry: {
    icon: FlaskConical,
    color: "purple",
    exams: ["JEE Mains", "NEET", "Boards"],
  },

  Mathematics: {
    icon: Calculator,
    color: "green",
    exams: ["JEE Mains", "Boards"],
  },

  Biology: {
    icon: Dna,
    color: "pink",
    exams: ["NEET", "Boards"],
  },
};

const CLASSES = ["Class 11", "Class 12"];

// Backend may return "Maths", "Math", or "Mathematics".
// Study Notes uses "Mathematics" as the canonical local key.
const getSubjectConfigKey = (subjectName = "") => {
  const value = String(subjectName || "").trim().toLowerCase();

  if (
    value === "maths" ||
    value === "math" ||
    value === "mathematics"
  ) {
    return "Mathematics";
  }

  const matchingKey = Object.keys(SUBJECT_CONFIG).find(
    (key) => key.toLowerCase() === value
  );

  return matchingKey || String(subjectName || "").trim();
};

/*
|--------------------------------------------------------------------------
| CHAPTER DATABASE
|--------------------------------------------------------------------------
*/

const STUDY_CHAPTERS = {
  Physics: {
    "Class 11": [
      "Physical World",
      "Units and Measurements",
      "Motion in a Straight Line",
      "Motion in a Plane",
      "Laws of Motion",
      "Work, Energy and Power",
      "System of Particles and Rotational Motion",
      "Gravitation",
      "Mechanical Properties of Solids",
      "Mechanical Properties of Fluids",
      "Thermal Properties of Matter",
      "Thermodynamics",
      "Kinetic Theory",
      "Oscillations",
      "Waves",
    ],

    "Class 12": [
      "Electric Charges and Fields",
      "Electrostatic Potential and Capacitance",
      "Current Electricity",
      "Moving Charges and Magnetism",
      "Magnetism and Matter",
      "Electromagnetic Induction",
      "Alternating Current",
      "Electromagnetic Waves",
      "Ray Optics and Optical Instruments",
      "Wave Optics",
      "Dual Nature of Radiation and Matter",
      "Atoms",
      "Nuclei",
      "Semiconductor Electronics: Materials, Devices and Simple Circuits",
    ],
  },

  Chemistry: {
    "Class 11": [
      "Some Basic Concepts of Chemistry",
      "Structure of Atom",
      "States of Matter",
      "Thermodynamics",
      "Equilibrium",
      "Redox Reactions",
      "Classification of Elements and Periodicity in Properties",
      "Chemical Bonding and Molecular Structure",
      "Hydrogen",
      "The s-Block Elements",
      "Organic Chemistry – Some Basic Principles and Techniques",
      "Hydrocarbons",
      "Environmental Chemistry",
    ],

    "Class 12": [
      "Solid State",
      "Solutions",
      "Electrochemistry",
      "Chemical Kinetics",
      "Surface Chemistry",
      "General Principles and Processes of Isolation of Elements",
      "p-Block Elements",
      "d- and f-Block Elements",
      "Coordination Compounds",
      "Haloalkanes and Haloarenes",
      "Alcohols, Phenols and Ethers",
      "Aldehydes, Ketones and Carboxylic Acids",
      "Amines",
      "Biomolecules",
      "Polymers",
      "Chemistry in Everyday Life",
    ],
  },

  Mathematics: {
    "Class 11": [
      "Sets",
      "Relations and Functions",
      "Trigonometric Functions",
      "Principle of Mathematical Induction",
      "Complex Numbers and Quadratic Equations",
      "Linear Inequalities",
      "Permutations and Combinations",
      "Binomial Theorem",
      "Sequences and Series",
      "Straight Lines",
      "Conic Sections",
      "Introduction to Three Dimensional Geometry",
      "Limits and Derivatives",
      "Mathematical Reasoning",
      "Statistics",
      "Probability",
    ],

    "Class 12": [
      "Relations and Functions",
      "Inverse Trigonometric Functions",
      "Matrices",
      "Determinants",
      "Continuity and Differentiability",
      "Applications of Derivatives",
      "Integrals",
      "Applications of Integrals",
      "Differential Equations",
      "Vector Algebra",
      "Three Dimensional Geometry",
      "Linear Programming",
      "Probability",
    ],
  },

  Biology: {
    "Class 11": [
      "The Living World",
      "Biological Classification",
      "Plant Kingdom",
      "Animal Kingdom",
      "Morphology of Flowering Plants",
      "Anatomy of Flowering Plants",
      "Structural Organisation in Animals",
      "Cell: The Unit of Life",
      "Biomolecules",
      "Cell Cycle and Cell Division",
      "Photosynthesis in Higher Plants",
      "Respiration in Plants",
      "Plant Growth and Development",
      "Breathing and Exchange of Gases",
      "Body Fluids and Circulation",
      "Excretory Products and their Elimination",
      "Locomotion and Movement",
      "Neural Control and Coordination",
      "Chemical Coordination and Integration",
    ],

    "Class 12": [
      "Sexual Reproduction in Flowering Plants",
      "Human Reproduction",
      "Reproductive Health",
      "Principles of Inheritance and Variation",
      "Molecular Basis of Inheritance",
      "Evolution",
      "Human Health and Disease",
      "Strategies for Enhancement in Food Production",
      "Microbes in Human Welfare",
      "Biotechnology: Principles and Processes",
      "Biotechnology and its Applications",
      "Organisms and Populations",
      "Ecosystem",
      "Biodiversity and Conservation",
      "Environmental Issues",
    ],
  },
};

/*
|--------------------------------------------------------------------------
| HELPER
|--------------------------------------------------------------------------
*/

const normalizeName = (name = "") => {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[–—-]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeExamName = (exam = "") => {
  const value = String(exam || "").trim();

  if (value === "JEE") {
    return "JEE Mains";
  }

  return value;
};

const chapterNamesMatch = (left = "", right = "") => {
  const clean = (value) =>
    normalizeName(value)
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const a = clean(left);
  const b = clean(right);

  if (!a || !b) {
    return false;
  }

  if (a === b || a.includes(b) || b.includes(a)) {
    return true;
  }

  const stopWords = new Set([
    "and",
    "of",
    "the",
    "in",
    "on",
    "to",
    "a",
    "an",
    "some",
    "simple",
  ]);

  const aTokens = a
    .split(" ")
    .filter(
      (token) =>
        token.length > 2 &&
        !stopWords.has(token)
    );

  const bTokens = b
    .split(" ")
    .filter(
      (token) =>
        token.length > 2 &&
        !stopWords.has(token)
    );

  if (
    aTokens.length === 0 ||
    bTokens.length === 0
  ) {
    return false;
  }

  const smaller =
    aTokens.length <= bTokens.length
      ? aTokens
      : bTokens;

  const larger = new Set(
    aTokens.length <= bTokens.length
      ? bTokens
      : aTokens
  );

  const overlap = smaller.filter(
    (token) => larger.has(token)
  ).length;

  return overlap / smaller.length >= 0.6;
};

const findClassForChapter = (
  subjectName,
  chapterName
) => {
  const subjectData =
    STUDY_CHAPTERS[getSubjectConfigKey(subjectName)];

  if (!subjectData) {
    return "";
  }

  for (const className of CLASSES) {
    const list =
      subjectData[className] || [];

    if (
      list.some((chapter) =>
        chapterNamesMatch(
          chapter,
          chapterName
        )
      )
    ) {
      return className;
    }
  }

  return "";
};

/*
|--------------------------------------------------------------------------
| PDF FIRST PAGE PREVIEW
|--------------------------------------------------------------------------
*/

function PdfFirstPagePreview({ pdfUrl }) {
  const previewRef = useRef(null);
  const [previewWidth, setPreviewWidth] = useState(700);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    setPreviewLoading(true);
    setPreviewError(false);
  }, [pdfUrl]);

  useEffect(() => {
    const element = previewRef.current;

    if (!element) {
      return undefined;
    }

    const updateWidth = () => {
      const width = element.getBoundingClientRect().width;

      if (width > 0) {
        setPreviewWidth(Math.max(240, Math.min(width - 24, 760)));
      }
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);

      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (!pdfUrl) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800/40">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            PDF Preview
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
            Previewing page 1 only
          </p>
        </div>

        <span className="rounded-full border border-primary-500/20 bg-primary-500/5 px-2.5 py-1 text-[10px] font-bold text-primary-500">
          PAGE 1
        </span>
      </div>

      <div
        ref={previewRef}
        className="relative flex min-h-[220px] w-full min-w-0 justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/70 p-3 dark:border-slate-700 dark:bg-slate-950/40 sm:p-4"
      >
        {previewLoading && !previewError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[1px] dark:bg-slate-950/80">
            <div className="flex flex-col items-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Loading PDF preview...
              </p>
            </div>
          </div>
        )}

        {previewError ? (
          <div className="flex min-h-[220px] w-full flex-col items-center justify-center px-4 text-center">
            <FileText className="mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Preview unavailable
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              The PDF could not be rendered here. You can still use the Download PDF button above.
            </p>
          </div>
        ) : (
          <Document
            file={pdfUrl}
            loading={null}
            error={null}
            onLoadSuccess={() => {
              setPreviewLoading(false);
              setPreviewError(false);
            }}
            onLoadError={(error) => {
              console.error("Failed to load PDF preview:", error);
              setPreviewLoading(false);
              setPreviewError(true);
            }}
          >
            <Page
              pageNumber={1}
              width={previewWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={null}
              onRenderSuccess={() => setPreviewLoading(false)}
              className="overflow-hidden rounded-xl bg-white shadow-sm"
            />
          </Document>
        )}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function NotesPage() {
  const location = useLocation();

  const panicState =
    location.state?.panicMode
      ? location.state
      : null;

  const panicSubject =
    panicState?.subject || "";

  const panicChapter =
    panicState?.chapter || "";

  const panicClassLevel =
    CLASSES.includes(
      panicState?.classLevel
    )
      ? panicState.classLevel
      : "";

  const panicExam =
    normalizeExamName(
      panicState?.exam || ""
    );

  const panicChapterId =
    panicState?.panicChapterId || "";

  const panicAutoOpenAttempted =
    useRef(false);

  const [subjects, setSubjects] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

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
        console.error("Failed to load subjects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PANIC MODE AUTO-OPEN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !panicState ||
      panicAutoOpenAttempted.current ||
      subjects.length === 0
    ) {
      return;
    }

    const matchingSubject =
      subjects.find((subject) => {
        const backendName =
          subject?.name || "";

        const a =
          normalizeName(
            backendName
          );

        const b =
          normalizeName(
            panicSubject
          );

        if (a === b) {
          return true;
        }

        const mathAliases =
          new Set([
            "math",
            "maths",
            "mathematics",
          ]);

        return (
          mathAliases.has(a) &&
          mathAliases.has(b)
        );
      });

    if (!matchingSubject) {
      return;
    }

    const subjectName =
      matchingSubject.name;

    const inferredClass =
      panicClassLevel ||
      findClassForChapter(
        subjectName,
        panicChapter
      );

    const config =
      SUBJECT_CONFIG[
        getSubjectConfigKey(subjectName)
      ];

    let examForNotes =
      panicExam;

    if (
      !examForNotes ||
      !config?.exams?.includes(
        examForNotes
      )
    ) {
      examForNotes =
        config?.exams?.[0] || "";
    }

    setSelectedSubject(
      matchingSubject
    );

    setSelectedExam(
      examForNotes
    );

    if (inferredClass) {
      setSelectedClass(
        inferredClass
      );
    }

    panicAutoOpenAttempted.current =
      true;
  }, [
    subjects,
    panicState,
    panicSubject,
    panicChapter,
    panicClassLevel,
    panicExam,
  ]);

  /*
  |--------------------------------------------------------------------------
  | LOAD CHAPTERS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!selectedSubject || !selectedExam || !selectedClass) {
      setChapters([]);
      setSelectedChapter("");
      setNotes([]);
      setSelectedNote(null);
      return;
    }

    const loadChapters = async () => {
      setChaptersLoading(true);

      try {
        const subjectName = selectedSubject.name;

        const localChapterNames =
          STUDY_CHAPTERS[getSubjectConfigKey(subjectName)]?.[selectedClass] || [];

        let backendChapters = [];

        try {
          const res = await contentAPI.getChapters(selectedSubject._id);

          backendChapters = res.data || [];
        } catch (backendError) {
          console.warn(
            "Backend chapters could not be loaded. Using local chapter list.",
            backendError
          );
        }

        const finalChapters = localChapterNames.map(
          (chapterName, index) => {
            const matchingBackendChapter = backendChapters.find(
              (chapter) => {
                const backendTitle =
                  chapter.title || chapter.name || "";

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
                  backendClass ===
                    selectedClass.replace("Class ", "");

                return titleMatches && classMatches;
              }
            );

            return {
              _id:
                matchingBackendChapter?._id ||
                `local-${subjectName}-${selectedClass}-${index + 1}`,

              chapterNumber: index + 1,

              title: chapterName,

              subject: subjectName,

              exam: selectedExam,

              className: selectedClass,

              isLocalChapter: !matchingBackendChapter,
            };
          }
        );

        setChapters(finalChapters);

        if (finalChapters.length > 0) {
          const panicTarget =
            panicState
              ? finalChapters.find(
                  (chapter) =>
                    chapterNamesMatch(
                      chapter.title,
                      panicChapter
                    )
                )
              : null;

          setSelectedChapter(
            panicTarget?._id ||
              finalChapters[0]._id
          );
        } else {
          setSelectedChapter("");
          setNotes([]);
          setSelectedNote(null);
        }
      } catch (err) {
        console.error("Failed to prepare chapters:", err);

        setChapters([]);
        setSelectedChapter("");
      } finally {
        setChaptersLoading(false);
      }
    };

    loadChapters();
  }, [
    selectedSubject,
    selectedExam,
    selectedClass,
    panicState,
    panicChapter,
  ]);

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

  const fetchNotes = async () => {
    setNotesLoading(true);

    try {
      const currentChapter =
        chapters.find(
          (chapter) =>
            String(chapter._id) ===
            String(selectedChapter)
        );

      if (!currentChapter) {
        setNotes([]);
        setSelectedNote(null);
        return;
      }

      console.log(
        'NAVTA loading Study Notes:',
        {
          chapterId:
            currentChapter._id,

          chapterName:
            currentChapter.title,

          subjectName:
            selectedSubject?.name,

          className:
            selectedClass,

          exam:
            selectedExam
        }
      );

      const res =
        await contentAPI.getNotes(
          currentChapter._id,
          {
            chapterName:
              currentChapter.title,

            subjectName:
              selectedSubject?.name ||
              currentChapter.subject ||
              '',

            className:
              selectedClass ||
              currentChapter.className ||
              '',

            classLevel:
              selectedClass ||
              currentChapter.className ||
              '',

            exam:
              selectedExam ||
              currentChapter.exam ||
              ''
          }
        );

      const noteData =
        Array.isArray(res?.data)
          ? res.data
          : [];

      console.log(
        'NAVTA Study Notes returned:',
        noteData
      );

      setNotes(noteData);

      if (noteData.length > 0) {
        setSelectedNote(
          noteData[0]
        );
      } else {
        setSelectedNote(null);
      }

    } catch (err) {
      console.error(
        'Failed to load notes:',
        err
      );

      setNotes([]);
      setSelectedNote(null);

    } finally {
      setNotesLoading(false);
    }
  };

  fetchNotes();

}, [
  selectedChapter,
  chapters,
  selectedSubject,
  selectedClass,
  selectedExam
]);

  /*
  |--------------------------------------------------------------------------
  | SUBJECT SELECTION
  |--------------------------------------------------------------------------
  */

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);

    setSelectedExam("");
    setSelectedClass("");

    setChapters([]);
    setSelectedChapter("");

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm("");
  };

  /*
  |--------------------------------------------------------------------------
  | EXAM SELECTION
  |--------------------------------------------------------------------------
  */

  const handleExamSelect = (exam) => {
    setSelectedExam(exam);

    setSelectedClass("");

    setChapters([]);
    setSelectedChapter("");

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm("");
  };

  /*
  |--------------------------------------------------------------------------
  | CLASS SELECTION
  |--------------------------------------------------------------------------
  */

  const handleClassSelect = (className) => {
    setSelectedClass(className);

    setSelectedChapter("");

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm("");
  };

  /*
  |--------------------------------------------------------------------------
  | BACK FUNCTIONS
  |--------------------------------------------------------------------------
  */

  const goBackToSubjects = () => {
    setSelectedSubject(null);

    setSelectedExam("");
    setSelectedClass("");

    setChapters([]);
    setSelectedChapter("");

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm("");
  };

  const goBackToExams = () => {
    setSelectedExam("");

    setSelectedClass("");

    setChapters([]);
    setSelectedChapter("");

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm("");
  };

  const goBackToClasses = () => {
    setSelectedClass("");

    setChapters([]);
    setSelectedChapter("");

    setNotes([]);
    setSelectedNote(null);

    setSearchTerm("");
  };

  /*
  |--------------------------------------------------------------------------
  | FILTER CHAPTERS
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

    return content.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h3
            key={idx}
            className="mt-4 mb-2 text-base font-bold text-slate-900 dark:text-white break-words"
          >
            {line.replace("### ", "")}
          </h3>
        );
      }

      if (line.startsWith("## ")) {
        return (
          <h2
            key={idx}
            className="mt-5 mb-2 text-lg font-bold text-slate-900 dark:text-white break-words"
          >
            {line.replace("## ", "")}
          </h2>
        );
      }

      if (line.startsWith("* ") || line.startsWith("- ")) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc text-sm text-slate-600 dark:text-slate-400 my-1 break-words"
          >
            {line.substring(2)}
          </li>
        );
      }

      if (line.match(/^\d+\.\s/)) {
        return (
          <li
            key={idx}
            className="ml-4 list-decimal text-sm text-slate-600 dark:text-slate-400 my-1 break-words"
          >
            {line.replace(/^\d+\.\s/, "")}
          </li>
        );
      }

      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p
          key={idx}
          className="my-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed break-words"
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
      <div className="flex min-h-[60vh] items-center justify-center px-4">
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
    <div className="w-full max-w-full min-w-0 space-y-5 sm:space-y-6 overflow-x-hidden">

      {/* HEADER */}

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 sm:pb-5">

        <div className="flex items-start gap-3 min-w-0">

          <div className="shrink-0 rounded-xl bg-primary-500/10 p-2.5">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
          </div>

          <div className="min-w-0">

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
              Study Notes Library
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
              Select subject, examination, class and chapter to access your
              study notes.
            </p>

          </div>

        </div>

      </div>

      {panicState && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-500/20 dark:bg-rose-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-500">
                🚨 Panic Mode Revision
              </p>

              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white break-words">
                {panicChapter
                  ? `Revise: ${panicChapter}${
                      panicClassLevel
                        ? ` • ${panicClassLevel}`
                        : ""
                    }`
                  : "Revise your selected weak chapter"}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                NAVTA opened the closest matching Study Notes chapter automatically.
                Review the notes, then return to Panic Mode for targeted practice.
              </p>
            </div>

            <Link
              to="/panic-mode"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/20 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Panic Mode
            </Link>
          </div>
        </div>
      )}

      {/* BREADCRUMB */}

      {selectedSubject && (
        <div className="flex max-w-full flex-wrap items-center gap-1.5 text-xs overflow-hidden">

          <button
            onClick={goBackToSubjects}
            className="font-semibold text-primary-500 hover:text-primary-400"
          >
            Subjects
          </button>

          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />

          <span className="max-w-[150px] truncate font-semibold text-slate-700 dark:text-slate-300">
            {selectedSubject.name}
          </span>

          {selectedExam && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />

              <button
                onClick={goBackToExams}
                className="max-w-[130px] truncate font-semibold text-primary-500 hover:text-primary-400"
              >
                {selectedExam}
              </button>
            </>
          )}

          {selectedClass && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />

              <button
                onClick={goBackToClasses}
                className="font-semibold text-primary-500 hover:text-primary-400"
              >
                {selectedClass}
              </button>
            </>
          )}

          {selectedChapter && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />

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
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Step 1
            </p>

            <h2 className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Select Subject
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Choose the subject for which you want to access study notes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">

            {subjects.map((subject) => {

              const config =
                SUBJECT_CONFIG[
                  getSubjectConfigKey(subject.name)
                ];

              const Icon = config?.icon || BookOpen;

              return (
                <button
                  key={subject._id || subject.id}
                  onClick={() => handleSubjectSelect(subject)}
                  className="group w-full min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 sm:p-5 text-left transition-all duration-200 hover:border-primary-500 hover:bg-primary-500/5"
                >

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-primary-500" />

                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white break-words">
                    {subject.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
            <ArrowLeft className="h-4 w-4" />
            Back to Subjects
          </button>

          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Step 2
            </p>

            <h2 className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Select Examination
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Choose the examination for {selectedSubject.name}.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">

            {(SUBJECT_CONFIG[getSubjectConfigKey(selectedSubject.name)]?.exams || []).map(
              (exam) => (
                <button
                  key={exam}
                  onClick={() => handleExamSelect(exam)}
                  className="group w-full min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5 sm:p-6 text-left transition-all hover:border-primary-500 hover:bg-primary-500/5"
                >

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
                      <GraduationCap className="h-5 w-5 text-primary-500" />
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-primary-500" />

                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white break-words">
                    {exam}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
              <ArrowLeft className="h-4 w-4" />
              Back to Examinations
            </button>

            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Step 3
              </p>

              <h2 className="mt-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Select Class
              </h2>

              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {selectedSubject.name} • {selectedExam}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 max-w-2xl">

              {CLASSES.map((className) => (
                <button
                  key={className}
                  onClick={() => handleClassSelect(className)}
                  className="group w-full min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5 sm:p-6 text-left transition-all hover:border-primary-500 hover:bg-primary-500/5"
                >

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
                      <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
                    </div>

                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-primary-500" />

                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                    {className}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
          <div className="space-y-5 min-w-0">

            <button
              onClick={goBackToClasses}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Classes
            </button>

            {/* SELECTED PATH */}

            <div className="w-full min-w-0 rounded-2xl border border-primary-500/20 bg-primary-500/5 p-3 sm:p-4">

              <div className="flex flex-wrap items-center gap-1.5">

                <span className="max-w-[130px] truncate text-xs font-semibold text-primary-500">
                  {selectedSubject.name}
                </span>

                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                <span className="max-w-[130px] truncate text-xs font-semibold text-primary-500">
                  {selectedExam}
                </span>

                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                <span className="text-xs font-semibold text-primary-500">
                  {selectedClass}
                </span>

              </div>

            </div>

            {/* SEARCH */}

            <div className="relative w-full max-w-md">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chapter..."
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-9 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />

            </div>

            {/* ==========================================================
                RESPONSIVE CHAPTER + NOTE LAYOUT
            ========================================================== */}

            <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-4 lg:gap-6">

              {/* CHAPTERS */}

              <div className="min-w-0 space-y-4 lg:col-span-1">

                <div>

                  <h3 className="pl-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Chapters
                  </h3>

                  <p className="mt-1 pl-1 text-[11px] text-slate-500">
                    {chapters.length} chapters available
                  </p>

                </div>

                <div className="max-h-[360px] min-w-0 space-y-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white/50 p-2 dark:border-slate-800/40 dark:bg-slate-900/30 sm:max-h-[450px] lg:max-h-[650px]">

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
                        className={`flex w-full min-w-0 items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-semibold transition-all ${
                          selectedChapter === chapter._id
                            ? "bg-primary-500 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                        }`}
                      >

                        <span className="shrink-0 opacity-80">
                          Ch {chapter.chapterNumber}
                        </span>

                        <span className="min-w-0 flex-1 break-words">
                          {chapter.title}
                        </span>

                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-8 text-center">

                      <FileText className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />

                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        No chapter found.
                      </p>

                    </div>
                  )}

                </div>

                {/* NOTES LIST */}

                {notes.length > 0 && (
                  <div className="space-y-3">

                    <h3 className="mt-4 pl-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Notes List
                    </h3>

                    <div className="max-h-[300px] space-y-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white/50 p-2 dark:border-slate-800/40 dark:bg-slate-900/30">

                      {notes.map((note) => (
                        <button
                          key={note._id}
                          onClick={() => setSelectedNote(note)}
                          className={`flex w-full min-w-0 items-center gap-2 rounded-xl px-3.5 py-3 text-left text-xs font-semibold transition-all ${
                            selectedNote?._id === note._id
                              ? "border-l-4 border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                          }`}
                        >

                          <FileText className="h-3.5 w-3.5 shrink-0" />

                          <span className="min-w-0 flex-1 break-words">
                            {note.title}
                          </span>

                        </button>
                      ))}

                    </div>

                  </div>
                )}

              </div>

              {/* NOTE READER */}

              <div className="min-w-0 lg:col-span-3">

                {notesLoading ? (
                  <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 px-5 dark:border-slate-800 sm:min-h-[400px]">

                    <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />

                    <p className="text-sm text-slate-500">
                      Loading notes...
                    </p>

                  </div>
                ) : selectedNote ? (

                  <Card
                    className="min-w-0 overflow-hidden"
                    title={selectedNote.title}
                    subtitle={
                      selectedNote.chapter?.title
                        ? `Chapter: ${selectedNote.chapter.title}`
                        : `${selectedSubject.name} • ${selectedClass}`
                    }
                    action={
                      selectedNote.pdfUrl ? (
                        <a
                          href={selectedNote.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block max-w-full"
                        >
                          <Button
                            variant="secondary"
                            className="w-full px-3 py-2 text-xs sm:w-auto"
                            icon={Download}
                          >
                            Download PDF
                          </Button>
                        </a>
                      ) : null
                    }
                  >

                    {/* UPLOADER */}

                    <div className="mb-5 flex max-w-full items-center gap-2 overflow-hidden rounded-full border border-slate-100 bg-slate-50 px-3 py-1 dark:border-slate-800/40 dark:bg-slate-800/20 sm:mb-6 sm:w-fit">

                      <User className="h-3 w-3 shrink-0 text-slate-400" />

                      <span className="truncate text-[10px] text-slate-400">
                        Uploaded by{" "}
                        {selectedNote.uploadedBy?.name || "Educator"}
                      </span>

                    </div>

                    {/* NOTE CONTENT */}

                    <div className="min-w-0 border-t border-slate-100 pt-4 dark:border-slate-800/40">

                      <div className="min-w-0 max-w-full overflow-hidden">
                        {renderNoteContent(selectedNote.content)}
                      </div>

                    </div>

                    <PdfFirstPagePreview pdfUrl={selectedNote.pdfUrl} />

                    {panicState && (
                      <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800/40">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            Finished revising?
                          </p>

                          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            Return to Panic Mode, mark this chapter as revised,
                            then start the targeted practice set.
                          </p>

                          <Link
                            to="/panic-mode"
                            state={{
                              fromNotes: true,
                              panicChapterId,
                              exam:
                                panicState?.exam || "",
                              subject: panicSubject,
                              classLevel:
                                panicClassLevel,
                              chapter: panicChapter,
                            }}
                            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-emerald-700"
                          >
                            Continue Panic Mode
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    )}

                  </Card>

                ) : (

                  <div className="flex min-h-[350px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/20 p-5 text-center dark:border-slate-800 dark:bg-slate-900/10 sm:min-h-[400px] sm:p-6">

                    <BookMarked className="mb-3 h-9 w-9 text-slate-300 dark:text-slate-600 sm:h-10 sm:w-10" />

                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {selectedChapter?.startsWith("local-")
                        ? "No Notes Uploaded Yet"
                        : "Select a Chapter"}
                    </p>

                    <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                      {selectedChapter?.startsWith("local-")
                        ? "This chapter is available in the Study Notes library, but notes have not been uploaded for it yet."
                        : "Select a chapter from the left to view available study notes."}
                    </p>

                    {selectedChapter?.startsWith("local-") && (
                      <div className="mt-4 flex max-w-md items-start gap-2 text-left text-xs text-slate-400">

                        <Info className="mt-0.5 h-4 w-4 shrink-0" />

                        <span>
                          Notes will appear here after they are uploaded from
                          the Admin Dashboard.
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
