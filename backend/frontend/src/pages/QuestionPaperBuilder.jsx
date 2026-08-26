import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Search,
  FileText,
  CheckCircle2,
  Circle,
  X,
  ArrowUp,
  ArrowDown,
  Printer,
  RotateCcw,
  BookOpen,
  SlidersHorizontal,
  ClipboardList,
  GraduationCap,
  Clock3,
  Award,
  Database,
  ChevronDown
} from 'lucide-react';

// =====================================================
// CONSTANTS
// =====================================================

const SUBJECTS = [
  'Physics',
  'Chemistry',
  'Maths',
  'Biology'
];

const EXAMS = [
  'NEET',
  'JEE',
  'Boards'
];

const CLASSES = [
  'Class 11',
  'Class 12'
];

const DIFFICULTIES = [
  'Easy',
  'Medium',
  'Hard'
];

const QUESTION_TYPES = [
  {
    value: 'mcq',
    label: 'MCQ / Objective'
  },
  {
    value: 'short',
    label: 'Short Answer'
  },
  {
    value: 'long',
    label: 'Long Answer'
  }
];

// =====================================================
// HELPERS
// =====================================================

function normalizeQuestionType(type) {
  if (!type) return 'mcq';

  const value = String(type)
    .trim()
    .toLowerCase();

  if (
    value === 'short' ||
    value === 'short_answer' ||
    value === 'short-answer' ||
    value === 'short answer'
  ) {
    return 'short';
  }

  if (
    value === 'long' ||
    value === 'long_answer' ||
    value === 'long-answer' ||
    value === 'long answer'
  ) {
    return 'long';
  }

  return 'mcq';
}

function getQuestionTypeLabel(type) {
  const normalized =
    normalizeQuestionType(type);

  if (normalized === 'short') {
    return 'Short Answer';
  }

  if (normalized === 'long') {
    return 'Long Answer';
  }

  return 'MCQ';
}

function getDefaultMarks(question) {
  const existingMarks =
    Number(question?.maxMarks);

  if (
    Number.isFinite(existingMarks) &&
    existingMarks > 0
  ) {
    return existingMarks;
  }

  const type =
    normalizeQuestionType(
      question?.questionType
    );

  if (type === 'long') {
    return 5;
  }

  if (type === 'short') {
    return 3;
  }

  return 1;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function QuestionPaperBuilder() {
  // ===================================================
  // QUESTION BANK
  // ===================================================

  const [questions, setQuestions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  // ===================================================
  // FILTERS
  // ===================================================

  const [filters, setFilters] =
    useState({
      subject: '',
      exam: '',
      classLevel: '',
      chapter: '',
      difficulty: '',
      questionType: '',
      search: ''
    });

  // ===================================================
  // SELECTED QUESTIONS
  // ===================================================

  const [
    selectedQuestions,
    setSelectedQuestions
  ] = useState([]);

  // ===================================================
  // PAPER INFORMATION
  // ===================================================

  const [paperDetails, setPaperDetails] =
    useState({
      instituteName: 'NAVTA',
      title: 'Question Paper',
      examName: '',
      subject: '',
      classLevel: '',
      date: '',
      duration: '60',
      instructions:
        'Attempt all questions. Read each question carefully before answering.'
    });

  // ===================================================
  // LOAD QUESTIONS
  // ===================================================

  useEffect(() => {
    loadQuestionBank();
  }, []);

  const loadQuestionBank =
    async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await fetch(
            '/api/teacher/question-bank',
            {
              method: 'GET',
              credentials: 'include',
              headers: {
                Accept:
                  'application/json'
              }
            }
          );

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load NAVTA question bank.'
          );
        }

        setQuestions(
          Array.isArray(
            data.questions
          )
            ? data.questions
            : []
        );
      } catch (err) {
        console.error(
          'QUESTION BANK ERROR:',
          err
        );

        setError(
          err.message ||
            'Unable to load questions.'
        );
      } finally {
        setLoading(false);
      }
    };

  // ===================================================
  // UPDATE FILTER
  // ===================================================

  const updateFilter = (
    field,
    value
  ) => {
    setFilters(
      (previous) => ({
        ...previous,
        [field]: value
      })
    );
  };

  // ===================================================
  // UPDATE PAPER DETAILS
  // ===================================================

  const updatePaperDetail = (
    field,
    value
  ) => {
    setPaperDetails(
      (previous) => ({
        ...previous,
        [field]: value
      })
    );
  };

  // ===================================================
  // CHAPTER LIST
  // ===================================================

  const chapters = useMemo(() => {
    let source = questions;

    if (filters.subject) {
      source = source.filter(
        (question) =>
          question.subject ===
          filters.subject
      );
    }

    if (filters.exam) {
      source = source.filter(
        (question) =>
          question.exam ===
          filters.exam
      );
    }

    if (filters.classLevel) {
      source = source.filter(
        (question) =>
          question.classLevel ===
          filters.classLevel
      );
    }

    return [
      ...new Set(
        source
          .map(
            (question) =>
              question.chapter
          )
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [
    questions,
    filters.subject,
    filters.exam,
    filters.classLevel
  ]);

  // ===================================================
  // FILTER QUESTIONS
  // ===================================================

  const filteredQuestions =
    useMemo(() => {
      const search =
        filters.search
          .trim()
          .toLowerCase();

      return questions.filter(
        (question) => {
          if (
            filters.subject &&
            question.subject !==
              filters.subject
          ) {
            return false;
          }

          if (
            filters.exam &&
            question.exam !==
              filters.exam
          ) {
            return false;
          }

          if (
            filters.classLevel &&
            question.classLevel !==
              filters.classLevel
          ) {
            return false;
          }

          if (
            filters.chapter &&
            question.chapter !==
              filters.chapter
          ) {
            return false;
          }

          if (
            filters.difficulty &&
            question.difficulty !==
              filters.difficulty
          ) {
            return false;
          }

          if (
            filters.questionType &&
            normalizeQuestionType(
              question.questionType
            ) !==
              filters.questionType
          ) {
            return false;
          }

          if (search) {
            const searchableText = [
              question.question,
              question.subject,
              question.exam,
              question.classLevel,
              question.chapter,
              question.difficulty
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            if (
              !searchableText.includes(
                search
              )
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [questions, filters]);

  // ===================================================
  // QUESTION SELECTED?
  // ===================================================

  const isSelected = (id) =>
    selectedQuestions.some(
      (question) =>
        question._id === id
    );

  // ===================================================
  // SELECT / REMOVE QUESTION
  // ===================================================

  const toggleQuestion = (
    question
  ) => {
    setSelectedQuestions(
      (previous) => {
        const exists =
          previous.some(
            (item) =>
              item._id ===
              question._id
          );

        if (exists) {
          return previous.filter(
            (item) =>
              item._id !==
              question._id
          );
        }

        return [
          ...previous,
          {
            ...question,
            paperMarks:
              getDefaultMarks(
                question
              )
          }
        ];
      }
    );
  };

  // ===================================================
  // SELECT ALL FILTERED
  // ===================================================

  const selectAllFiltered = () => {
    setSelectedQuestions(
      (previous) => {
        const ids =
          new Set(
            previous.map(
              (question) =>
                question._id
            )
          );

        const newQuestions =
          filteredQuestions
            .filter(
              (question) =>
                !ids.has(
                  question._id
                )
            )
            .map(
              (question) => ({
                ...question,
                paperMarks:
                  getDefaultMarks(
                    question
                  )
              })
            );

        return [
          ...previous,
          ...newQuestions
        ];
      }
    );
  };

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const clearFilters = () => {
    setFilters({
      subject: '',
      exam: '',
      classLevel: '',
      chapter: '',
      difficulty: '',
      questionType: '',
      search: ''
    });
  };

  // ===================================================
  // REMOVE SELECTED QUESTION
  // ===================================================

  const removeQuestion = (id) => {
    setSelectedQuestions(
      (previous) =>
        previous.filter(
          (question) =>
            question._id !== id
        )
    );
  };

  // ===================================================
  // MOVE QUESTION
  // ===================================================

  const moveQuestion = (
    index,
    direction
  ) => {
    setSelectedQuestions(
      (previous) => {
        const newIndex =
          index + direction;

        if (
          newIndex < 0 ||
          newIndex >=
            previous.length
        ) {
          return previous;
        }

        const copy = [
          ...previous
        ];

        [
          copy[index],
          copy[newIndex]
        ] = [
          copy[newIndex],
          copy[index]
        ];

        return copy;
      }
    );
  };

  // ===================================================
  // UPDATE QUESTION MARKS
  // ===================================================

  const updateQuestionMarks = (
    id,
    value
  ) => {
    const marks =
      Math.max(
        0,
        Number(value) || 0
      );

    setSelectedQuestions(
      (previous) =>
        previous.map(
          (question) =>
            question._id === id
              ? {
                  ...question,
                  paperMarks:
                    marks
                }
              : question
        )
    );
  };

  // ===================================================
  // TOTAL MARKS
  // ===================================================

  const totalMarks =
    useMemo(() => {
      return selectedQuestions.reduce(
        (total, question) =>
          total +
          (
            Number(
              question.paperMarks
            ) || 0
          ),
        0
      );
    }, [selectedQuestions]);

  // ===================================================
  // CLEAR PAPER
  // ===================================================

  const clearPaper = () => {
    setSelectedQuestions([]);
  };

  // ===================================================
  // SYNC PAPER DETAILS FROM FILTERS
  // ===================================================

  const useCurrentFiltersForPaper =
    () => {
      setPaperDetails(
        (previous) => ({
          ...previous,

          subject:
            filters.subject ||
            previous.subject,

          examName:
            filters.exam ||
            previous.examName,

          classLevel:
            filters.classLevel ||
            previous.classLevel
        })
      );
    };

  // ===================================================
  // GENERATE STUDENT PAPER
  // Browser print -> Save as PDF
  // ===================================================

  const generateStudentPDF = () => {
    if (
      selectedQuestions.length ===
      0
    ) {
      window.alert(
        'Please select at least one question first.'
      );

      return;
    }

    const printWindow =
      window.open(
        '',
        '_blank',
        'width=1000,height=800'
      );

    if (!printWindow) {
      window.alert(
        'Your browser blocked the print window. Please allow popups for NAVTA.'
      );

      return;
    }

    const questionsHtml =
      selectedQuestions
        .map(
          (question, index) => {
            const type =
              normalizeQuestionType(
                question.questionType
              );

            const options =
              Array.isArray(
                question.options
              )
                ? question.options
                : [];

            let optionsHtml = '';

            if (
              type === 'mcq' &&
              options.length
            ) {
              optionsHtml = `
                <div class="options">
                  ${options
                    .map(
                      (
                        option,
                        optionIndex
                      ) => `
                        <div class="option">
                          <span class="option-letter">
                            ${String.fromCharCode(
                              65 +
                                optionIndex
                            )}.
                          </span>

                          ${escapeHtml(
                            option
                          )}
                        </div>
                      `
                    )
                    .join('')}
                </div>
              `;
            }

            return `
              <div class="question">
                <div class="question-header">
                  <div class="question-text">
                    <strong>
                      ${index + 1}.
                    </strong>

                    ${escapeHtml(
                      question.question
                    )}
                  </div>

                  <div class="marks">
                    [${
                      Number(
                        question.paperMarks
                      ) || 0
                    } ${
                      Number(
                        question.paperMarks
                      ) === 1
                        ? 'Mark'
                        : 'Marks'
                    }]
                  </div>
                </div>

                ${optionsHtml}
              </div>
            `;
          }
        )
        .join('');

    const instructions =
      paperDetails.instructions
        .split('\n')
        .map(
          (line) =>
            line.trim()
        )
        .filter(Boolean)
        .map(
          (line, index) => `
            <div>
              ${index + 1}. ${escapeHtml(
                line
              )}
            </div>
          `
        )
        .join('');

    printWindow.document.write(`
      <!DOCTYPE html>

      <html>
        <head>
          <title>
            ${escapeHtml(
              paperDetails.title ||
                'NAVTA Question Paper'
            )}
          </title>

          <meta charset="UTF-8" />

          <style>
            @page {
              size: A4;
              margin: 16mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              color: #111827;
              background: white;
              font-size: 14px;
              line-height: 1.55;
            }

            .paper {
              width: 100%;
            }

            .brand {
              text-align: center;
              font-size: 28px;
              font-weight: 800;
              letter-spacing: 1px;
            }

            .institute {
              text-align: center;
              font-size: 14px;
              margin-top: 2px;
            }

            .title {
              text-align: center;
              font-size: 20px;
              font-weight: 700;
              margin-top: 12px;
            }

            .meta {
              margin-top: 18px;
              border-top: 1px solid #111827;
              border-bottom: 1px solid #111827;
              padding: 10px 0;
              display: grid;
              grid-template-columns:
                1fr 1fr;
              gap: 6px 20px;
            }

            .meta-right {
              text-align: right;
            }

            .instructions {
              margin-top: 16px;
              padding-bottom: 14px;
              border-bottom:
                1px solid #d1d5db;
            }

            .instructions-title {
              font-weight: 700;
              margin-bottom: 5px;
            }

            .questions {
              margin-top: 20px;
            }

            .question {
              margin-bottom: 22px;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .question-header {
              display: flex;
              align-items: flex-start;
              justify-content:
                space-between;
              gap: 20px;
            }

            .question-text {
              flex: 1;
            }

            .marks {
              white-space: nowrap;
              font-weight: 700;
            }

            .options {
              margin-top: 10px;
              margin-left: 25px;
              display: grid;
              grid-template-columns:
                1fr 1fr;
              gap: 7px 24px;
            }

            .option-letter {
              font-weight: 700;
              margin-right: 5px;
            }

            .footer {
              margin-top: 35px;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }

            @media print {
              body {
                -webkit-print-color-adjust:
                  exact;
                print-color-adjust:
                  exact;
              }
            }
          </style>
        </head>

        <body>
          <div class="paper">

            <div class="brand">
              NAVTA
            </div>

            <div class="institute">
              ${escapeHtml(
                paperDetails.instituteName ||
                  'NAVTA'
              )}
            </div>

            <div class="title">
              ${escapeHtml(
                paperDetails.title ||
                  'Question Paper'
              )}
            </div>

            <div class="meta">

              <div>
                <strong>
                  Exam:
                </strong>

                ${escapeHtml(
                  paperDetails.examName ||
                    '-'
                )}
              </div>

              <div class="meta-right">
                <strong>
                  Time:
                </strong>

                ${escapeHtml(
                  paperDetails.duration ||
                    '-'
                )} Minutes
              </div>

              <div>
                <strong>
                  Subject:
                </strong>

                ${escapeHtml(
                  paperDetails.subject ||
                    '-'
                )}
              </div>

              <div class="meta-right">
                <strong>
                  Maximum Marks:
                </strong>

                ${totalMarks}
              </div>

              <div>
                <strong>
                  Class:
                </strong>

                ${escapeHtml(
                  paperDetails.classLevel ||
                    '-'
                )}
              </div>

              <div class="meta-right">
                <strong>
                  Date:
                </strong>

                ${escapeHtml(
                  paperDetails.date ||
                    '-'
                )}
              </div>

            </div>

            ${
              instructions
                ? `
                  <div class="instructions">
                    <div class="instructions-title">
                      General Instructions
                    </div>

                    ${instructions}
                  </div>
                `
                : ''
            }

            <div class="questions">
              ${questionsHtml}
            </div>

            <div class="footer">
              Generated using NAVTA Paper Builder
            </div>

          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      className="
        w-full
        max-w-[1500px]
        mx-auto
        pb-16
      "
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          navta-premium-panel
          p-5
          sm:p-6
          lg:p-8
          mb-6
        "
      >
        <div
          className="
            flex
            flex-col
            xl:flex-row
            xl:items-center
            xl:justify-between
            gap-5
          "
        >
          <div>
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-primary-500/10
                text-primary-600
                dark:text-primary-400
                px-3
                py-1.5
                text-xs
                font-bold
                mb-3
              "
            >
              <FileText
                className="w-4 h-4"
              />

              NAVTA PAPER BUILDER
            </div>

            <h1
              className="
                text-2xl
                sm:text-3xl
                lg:text-4xl
                font-extrabold
                text-slate-900
                dark:text-white
                tracking-tight
              "
            >
              Build your question paper
            </h1>

            <p
              className="
                mt-2
                max-w-3xl
                text-sm
                sm:text-base
                text-slate-500
                dark:text-slate-400
              "
            >
              Select questions directly
              from the NAVTA Admin Question
              Bank, arrange them, assign
              marks and create a printable
              student question paper.
            </p>
          </div>

          <div
            className="
              flex
              flex-wrap
              gap-3
            "
          >
            <div
              className="
                navta-card-surface
                px-4
                py-3
              "
            >
              <p
                className="
                  text-xs
                  text-slate-400
                  font-semibold
                  uppercase
                "
              >
                Question Bank
              </p>

              <p
                className="
                  text-xl
                  font-extrabold
                  text-slate-900
                  dark:text-white
                "
              >
                {questions.length}
              </p>
            </div>

            <div
              className="
                navta-card-surface
                px-4
                py-3
              "
            >
              <p
                className="
                  text-xs
                  text-slate-400
                  font-semibold
                  uppercase
                "
              >
                Selected
              </p>

              <p
                className="
                  text-xl
                  font-extrabold
                  text-primary-500
                "
              >
                {
                  selectedQuestions.length
                }
              </p>
            </div>

            <div
              className="
                navta-card-surface
                px-4
                py-3
              "
            >
              <p
                className="
                  text-xs
                  text-slate-400
                  font-semibold
                  uppercase
                "
              >
                Total Marks
              </p>

              <p
                className="
                  text-xl
                  font-extrabold
                  text-emerald-500
                "
              >
                {totalMarks}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN GRID
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-[minmax(0,1fr)_390px]
          gap-6
          items-start
        "
      >
        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div
          className="
            min-w-0
            space-y-6
          "
        >
          {/* ===============================================
              FILTER PANEL
          =============================================== */}

          <div
            className="
              navta-card-surface
              p-5
              sm:p-6
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-4
                mb-5
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-primary-500/10
                    text-primary-500
                    flex
                    items-center
                    justify-center
                  "
                >
                  <SlidersHorizontal
                    className="w-5 h-5"
                  />
                </div>

                <div>
                  <h2
                    className="
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    Find Questions
                  </h2>

                  <p
                    className="
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    Filter the NAVTA question bank.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-bold
                  text-slate-500
                  dark:text-slate-400
                  hover:text-primary-500
                  transition
                "
              >
                <RotateCcw
                  className="w-4 h-4"
                />

                Reset
              </button>
            </div>

            {/* SEARCH */}

            <div
              className="
                relative
                mb-4
              "
            >
              <Search
                className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  w-4
                  h-4
                  text-slate-400
                "
              />

              <input
                type="text"
                value={filters.search}
                onChange={(event) =>
                  updateFilter(
                    'search',
                    event.target.value
                  )
                }
                placeholder="Search questions..."
                className="
                  w-full
                  pl-11
                  pr-4
                  py-3
                  rounded-xl
                  bg-white/70
                  dark:bg-slate-900/60
                  border
                  border-slate-200
                  dark:border-slate-700
                  text-sm
                  text-slate-900
                  dark:text-white
                  placeholder:text-slate-400
                  focus:border-primary-400
                  transition
                "
              />
            </div>

            {/* FILTERS */}

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                gap-3
              "
            >
              <FilterSelect
                label="Subject"
                value={
                  filters.subject
                }
                onChange={(value) => {
                  setFilters(
                    (previous) => ({
                      ...previous,
                      subject: value,
                      chapter: ''
                    })
                  );
                }}
                options={SUBJECTS}
              />

              <FilterSelect
                label="Exam"
                value={
                  filters.exam
                }
                onChange={(value) => {
                  setFilters(
                    (previous) => ({
                      ...previous,
                      exam: value,
                      chapter: ''
                    })
                  );
                }}
                options={EXAMS}
              />

              <FilterSelect
                label="Class"
                value={
                  filters.classLevel
                }
                onChange={(value) => {
                  setFilters(
                    (previous) => ({
                      ...previous,
                      classLevel:
                        value,
                      chapter: ''
                    })
                  );
                }}
                options={CLASSES}
              />

              <FilterSelect
                label="Chapter"
                value={
                  filters.chapter
                }
                onChange={(value) =>
                  updateFilter(
                    'chapter',
                    value
                  )
                }
                options={chapters}
              />

              <FilterSelect
                label="Difficulty"
                value={
                  filters.difficulty
                }
                onChange={(value) =>
                  updateFilter(
                    'difficulty',
                    value
                  )
                }
                options={
                  DIFFICULTIES
                }
              />

              <FilterSelect
                label="Question Type"
                value={
                  filters.questionType
                }
                onChange={(value) =>
                  updateFilter(
                    'questionType',
                    value
                  )
                }
                options={
                  QUESTION_TYPES
                }
                objectOptions
              />
            </div>
          </div>

          {/* ===============================================
              QUESTION BANK
          =============================================== */}

          <div
            className="
              navta-card-surface
              p-5
              sm:p-6
            "
          >
            <div
              className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
                mb-5
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-violet-500/10
                    text-violet-500
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Database
                    className="w-5 h-5"
                  />
                </div>

                <div>
                  <h2
                    className="
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    NAVTA Question Bank
                  </h2>

                  <p
                    className="
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    {
                      filteredQuestions.length
                    }{' '}
                    matching questions
                  </p>
                </div>
              </div>

              {filteredQuestions.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    selectAllFiltered
                  }
                  className="
                    px-4
                    py-2.5
                    rounded-xl
                    bg-primary-500/10
                    text-primary-600
                    dark:text-primary-400
                    text-xs
                    font-bold
                    hover:bg-primary-500/15
                    transition
                  "
                >
                  Select All Filtered
                </button>
              )}
            </div>

            {/* LOADING */}

            {loading && (
              <div
                className="
                  py-16
                  text-center
                "
              >
                <div
                  className="
                    w-8
                    h-8
                    mx-auto
                    rounded-full
                    border-4
                    border-primary-500
                    border-t-transparent
                    animate-spin
                  "
                />

                <p
                  className="
                    mt-4
                    text-sm
                    text-slate-500
                  "
                >
                  Loading NAVTA question bank...
                </p>
              </div>
            )}

            {/* ERROR */}

            {!loading &&
              error && (
                <div
                  className="
                    rounded-2xl
                    border
                    border-red-200
                    dark:border-red-900/50
                    bg-red-50
                    dark:bg-red-950/20
                    p-5
                  "
                >
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-red-600
                      dark:text-red-400
                    "
                  >
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={
                      loadQuestionBank
                    }
                    className="
                      mt-3
                      text-xs
                      font-bold
                      text-primary-500
                    "
                  >
                    Try Again
                  </button>
                </div>
              )}

            {/* EMPTY */}

            {!loading &&
              !error &&
              filteredQuestions.length ===
                0 && (
                <div
                  className="
                    py-16
                    text-center
                  "
                >
                  <BookOpen
                    className="
                      w-10
                      h-10
                      mx-auto
                      text-slate-300
                      dark:text-slate-600
                    "
                  />

                  <h3
                    className="
                      mt-4
                      font-bold
                      text-slate-800
                      dark:text-white
                    "
                  >
                    No questions found
                  </h3>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    Change the filters or ask
                    the NAVTA admin to add
                    questions for this selection.
                  </p>
                </div>
              )}

            {/* QUESTIONS */}

            {!loading &&
              !error && (
                <div
                  className="
                    space-y-3
                  "
                >
                  {filteredQuestions.map(
                    (
                      question,
                      index
                    ) => {
                      const selected =
                        isSelected(
                          question._id
                        );

                      return (
                        <button
                          type="button"
                          key={
                            question._id
                          }
                          onClick={() =>
                            toggleQuestion(
                              question
                            )
                          }
                          className={`
                            w-full
                            text-left
                            rounded-2xl
                            border
                            p-4
                            sm:p-5
                            transition-all
                            duration-200

                            ${
                              selected
                                ? `
                                  border-primary-400
                                  bg-primary-50/70
                                  dark:bg-primary-950/20
                                  shadow-sm
                                `
                                : `
                                  border-slate-200
                                  dark:border-slate-700/70
                                  bg-white/55
                                  dark:bg-slate-900/35
                                  hover:border-primary-300
                                  dark:hover:border-primary-700
                                `
                            }
                          `}
                        >
                          <div
                            className="
                              flex
                              items-start
                              gap-3
                            "
                          >
                            <div
                              className="
                                mt-0.5
                                shrink-0
                              "
                            >
                              {selected ? (
                                <CheckCircle2
                                  className="
                                    w-5
                                    h-5
                                    text-primary-500
                                  "
                                />
                              ) : (
                                <Circle
                                  className="
                                    w-5
                                    h-5
                                    text-slate-300
                                    dark:text-slate-600
                                  "
                                />
                              )}
                            </div>

                            <div
                              className="
                                min-w-0
                                flex-1
                              "
                            >
                              <div
                                className="
                                  flex
                                  flex-wrap
                                  items-center
                                  gap-2
                                  mb-2
                                "
                              >
                                <span
                                  className="
                                    text-xs
                                    font-bold
                                    text-slate-400
                                  "
                                >
                                  Q{index + 1}
                                </span>

                                <Tag>
                                  {
                                    question.subject
                                  }
                                </Tag>

                                <Tag>
                                  {
                                    question.exam
                                  }
                                </Tag>

                                <Tag>
                                  {
                                    question.classLevel
                                  }
                                </Tag>

                                <DifficultyTag
                                  difficulty={
                                    question.difficulty
                                  }
                                />

                                <Tag>
                                  {getQuestionTypeLabel(
                                    question.questionType
                                  )}
                                </Tag>
                              </div>

                              <p
                                className="
                                  text-sm
                                  sm:text-[15px]
                                  font-semibold
                                  leading-6
                                  text-slate-800
                                  dark:text-slate-100
                                "
                              >
                                {
                                  question.question
                                }
                              </p>

                              {question.chapter && (
                                <p
                                  className="
                                    mt-2
                                    text-xs
                                    text-slate-500
                                    dark:text-slate-400
                                  "
                                >
                                  Chapter:{' '}
                                  <span
                                    className="
                                      font-semibold
                                    "
                                  >
                                    {
                                      question.chapter
                                    }
                                  </span>
                                </p>
                              )}

                              {normalizeQuestionType(
                                question.questionType
                              ) ===
                                'mcq' &&
                                Array.isArray(
                                  question.options
                                ) &&
                                question.options
                                  .length >
                                  0 && (
                                  <div
                                    className="
                                      mt-3
                                      grid
                                      grid-cols-1
                                      sm:grid-cols-2
                                      gap-2
                                    "
                                  >
                                    {question.options.map(
                                      (
                                        option,
                                        optionIndex
                                      ) => (
                                        <div
                                          key={
                                            optionIndex
                                          }
                                          className="
                                            rounded-lg
                                            bg-slate-50/80
                                            dark:bg-slate-800/50
                                            px-3
                                            py-2
                                            text-xs
                                            text-slate-600
                                            dark:text-slate-300
                                          "
                                        >
                                          <strong>
                                            {String.fromCharCode(
                                              65 +
                                                optionIndex
                                            )}
                                            .
                                          </strong>{' '}
                                          {option}
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
          </div>
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div
          className="
            xl:sticky
            xl:top-20
            space-y-5
          "
        >
          {/* ===============================================
              PAPER SETTINGS
          =============================================== */}

          <div
            className="
              navta-card-surface
              p-5
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
                mb-5
              "
            >
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-emerald-500/10
                  text-emerald-500
                  flex
                  items-center
                  justify-center
                "
              >
                <ClipboardList
                  className="w-5 h-5"
                />
              </div>

              <div>
                <h2
                  className="
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Paper Details
                </h2>

                <p
                  className="
                    text-xs
                    text-slate-500
                  "
                >
                  Information shown on PDF
                </p>
              </div>
            </div>

            <div
              className="
                space-y-3
              "
            >
              <PaperInput
                label="Institute / School"
                value={
                  paperDetails.instituteName
                }
                onChange={(value) =>
                  updatePaperDetail(
                    'instituteName',
                    value
                  )
                }
              />

              <PaperInput
                label="Paper Title"
                value={
                  paperDetails.title
                }
                onChange={(value) =>
                  updatePaperDetail(
                    'title',
                    value
                  )
                }
              />

              <PaperInput
                label="Exam"
                value={
                  paperDetails.examName
                }
                onChange={(value) =>
                  updatePaperDetail(
                    'examName',
                    value
                  )
                }
              />

              <PaperInput
                label="Subject"
                value={
                  paperDetails.subject
                }
                onChange={(value) =>
                  updatePaperDetail(
                    'subject',
                    value
                  )
                }
              />

              <PaperInput
                label="Class"
                value={
                  paperDetails.classLevel
                }
                onChange={(value) =>
                  updatePaperDetail(
                    'classLevel',
                    value
                  )
                }
              />

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <PaperInput
                  label="Duration (min)"
                  type="number"
                  value={
                    paperDetails.duration
                  }
                  onChange={(value) =>
                    updatePaperDetail(
                      'duration',
                      value
                    )
                  }
                />

                <PaperInput
                  label="Date"
                  type="date"
                  value={
                    paperDetails.date
                  }
                  onChange={(value) =>
                    updatePaperDetail(
                      'date',
                      value
                    )
                  }
                />
              </div>

              <div>
                <label
                  className="
                    block
                    text-xs
                    font-bold
                    text-slate-500
                    dark:text-slate-400
                    mb-1.5
                  "
                >
                  Instructions
                </label>

                <textarea
                  rows={4}
                  value={
                    paperDetails.instructions
                  }
                  onChange={(event) =>
                    updatePaperDetail(
                      'instructions',
                      event.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    bg-white/70
                    dark:bg-slate-900/60
                    border
                    border-slate-200
                    dark:border-slate-700
                    px-3
                    py-2.5
                    text-sm
                    text-slate-900
                    dark:text-white
                    resize-none
                    focus:border-primary-400
                  "
                />
              </div>

              <button
                type="button"
                onClick={
                  useCurrentFiltersForPaper
                }
                className="
                  w-full
                  py-2.5
                  rounded-xl
                  bg-slate-100
                  dark:bg-slate-800
                  text-slate-700
                  dark:text-slate-200
                  text-xs
                  font-bold
                  hover:bg-slate-200
                  dark:hover:bg-slate-700
                  transition
                "
              >
                Use Current Filters
              </button>
            </div>
          </div>

          {/* ===============================================
              SELECTED QUESTIONS
          =============================================== */}

          <div
            className="
              navta-card-surface
              p-5
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
                mb-4
              "
            >
              <div>
                <h2
                  className="
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Selected Paper
                </h2>

                <p
                  className="
                    text-xs
                    text-slate-500
                    mt-0.5
                  "
                >
                  {
                    selectedQuestions.length
                  }{' '}
                  questions •{' '}
                  {totalMarks} marks
                </p>
              </div>

              {selectedQuestions.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    clearPaper
                  }
                  className="
                    text-xs
                    font-bold
                    text-red-500
                    hover:text-red-600
                  "
                >
                  Clear
                </button>
              )}
            </div>

            {selectedQuestions.length ===
            0 ? (
              <div
                className="
                  py-10
                  text-center
                "
              >
                <FileText
                  className="
                    w-9
                    h-9
                    mx-auto
                    text-slate-300
                    dark:text-slate-600
                  "
                />

                <p
                  className="
                    mt-3
                    text-sm
                    font-semibold
                    text-slate-500
                  "
                >
                  No questions selected
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Click questions from the
                  bank to add them here.
                </p>
              </div>
            ) : (
              <div
                className="
                  space-y-2
                  max-h-[430px]
                  overflow-y-auto
                  pr-1
                "
              >
                {selectedQuestions.map(
                  (
                    question,
                    index
                  ) => (
                    <div
                      key={
                        question._id
                      }
                      className="
                        rounded-xl
                        border
                        border-slate-200
                        dark:border-slate-700
                        bg-white/55
                        dark:bg-slate-900/40
                        p-3
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          gap-2
                        "
                      >
                        <div
                          className="
                            w-6
                            h-6
                            shrink-0
                            rounded-lg
                            bg-primary-500
                            text-white
                            text-[11px]
                            font-bold
                            flex
                            items-center
                            justify-center
                          "
                        >
                          {index + 1}
                        </div>

                        <p
                          className="
                            flex-1
                            text-xs
                            leading-5
                            font-semibold
                            text-slate-700
                            dark:text-slate-200
                            line-clamp-3
                          "
                        >
                          {
                            question.question
                          }
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            removeQuestion(
                              question._id
                            )
                          }
                          className="
                            text-slate-400
                            hover:text-red-500
                            transition
                          "
                        >
                          <X
                            className="w-4 h-4"
                          />
                        </button>
                      </div>

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                          gap-2
                          mt-3
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-1
                          "
                        >
                          <button
                            type="button"
                            disabled={
                              index === 0
                            }
                            onClick={() =>
                              moveQuestion(
                                index,
                                -1
                              )
                            }
                            className="
                              w-7
                              h-7
                              rounded-lg
                              bg-slate-100
                              dark:bg-slate-800
                              flex
                              items-center
                              justify-center
                              text-slate-500
                              disabled:opacity-30
                            "
                          >
                            <ArrowUp
                              className="w-3.5 h-3.5"
                            />
                          </button>

                          <button
                            type="button"
                            disabled={
                              index ===
                              selectedQuestions.length -
                                1
                            }
                            onClick={() =>
                              moveQuestion(
                                index,
                                1
                              )
                            }
                            className="
                              w-7
                              h-7
                              rounded-lg
                              bg-slate-100
                              dark:bg-slate-800
                              flex
                              items-center
                              justify-center
                              text-slate-500
                              disabled:opacity-30
                            "
                          >
                            <ArrowDown
                              className="w-3.5 h-3.5"
                            />
                          </button>
                        </div>

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <span
                            className="
                              text-[11px]
                              font-semibold
                              text-slate-400
                            "
                          >
                            Marks
                          </span>

                          <input
                            type="number"
                            min="0"
                            value={
                              question.paperMarks
                            }
                            onChange={(
                              event
                            ) =>
                              updateQuestionMarks(
                                question._id,
                                event.target
                                  .value
                              )
                            }
                            className="
                              w-14
                              rounded-lg
                              border
                              border-slate-200
                              dark:border-slate-700
                              bg-white
                              dark:bg-slate-900
                              px-2
                              py-1
                              text-center
                              text-xs
                              font-bold
                              text-slate-800
                              dark:text-white
                            "
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* SUMMARY */}

            <div
              className="
                mt-5
                pt-4
                border-t
                border-slate-200
                dark:border-slate-700
              "
            >
              <div
                className="
                  grid
                  grid-cols-3
                  gap-2
                  mb-4
                "
              >
                <SummaryBox
                  icon={
                    GraduationCap
                  }
                  label="Questions"
                  value={
                    selectedQuestions.length
                  }
                />

                <SummaryBox
                  icon={Award}
                  label="Marks"
                  value={
                    totalMarks
                  }
                />

                <SummaryBox
                  icon={Clock3}
                  label="Minutes"
                  value={
                    paperDetails.duration ||
                    '-'
                  }
                />
              </div>

              <button
                type="button"
                onClick={
                  generateStudentPDF
                }
                disabled={
                  selectedQuestions.length ===
                  0
                }
                className="
                  navta-button-glow
                  w-full
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-primary-500
                  hover:bg-primary-600
                  disabled:bg-slate-300
                  dark:disabled:bg-slate-700
                  disabled:cursor-not-allowed
                  text-white
                  px-4
                  py-3
                  text-sm
                  font-bold
                  transition
                "
              >
                <Printer
                  className="w-4 h-4"
                />

                Generate Student PDF
              </button>

              <p
                className="
                  text-[10px]
                  leading-4
                  text-center
                  text-slate-400
                  mt-2
                "
              >
                Your browser print window
                will open. Choose “Save as
                PDF” to download the paper.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// FILTER SELECT
// =====================================================

function FilterSelect({
  label,
  value,
  onChange,
  options,
  objectOptions = false
}) {
  return (
    <div>
      <label
        className="
          block
          text-xs
          font-bold
          text-slate-500
          dark:text-slate-400
          mb-1.5
        "
      >
        {label}
      </label>

      <div
        className="
          relative
        "
      >
        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="
            appearance-none
            w-full
            rounded-xl
            bg-white/70
            dark:bg-slate-900/60
            border
            border-slate-200
            dark:border-slate-700
            px-3
            pr-9
            py-3
            text-sm
            text-slate-700
            dark:text-slate-200
            focus:border-primary-400
            transition
          "
        >
          <option value="">
            All {label}
          </option>

          {options.map(
            (option) => {
              if (objectOptions) {
                return (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                );
              }

              return (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              );
            }
          )}
        </select>

        <ChevronDown
          className="
            pointer-events-none
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            w-4
            h-4
            text-slate-400
          "
        />
      </div>
    </div>
  );
}

// =====================================================
// PAPER INPUT
// =====================================================

function PaperInput({
  label,
  value,
  onChange,
  type = 'text'
}) {
  return (
    <div>
      <label
        className="
          block
          text-xs
          font-bold
          text-slate-500
          dark:text-slate-400
          mb-1.5
        "
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          w-full
          rounded-xl
          bg-white/70
          dark:bg-slate-900/60
          border
          border-slate-200
          dark:border-slate-700
          px-3
          py-2.5
          text-sm
          text-slate-900
          dark:text-white
          focus:border-primary-400
          transition
        "
      />
    </div>
  );
}

// =====================================================
// TAG
// =====================================================

function Tag({
  children
}) {
  if (!children) {
    return null;
  }

  return (
    <span
      className="
        inline-flex
        rounded-full
        bg-slate-100
        dark:bg-slate-800
        px-2
        py-1
        text-[10px]
        font-bold
        text-slate-500
        dark:text-slate-300
      "
    >
      {children}
    </span>
  );
}

// =====================================================
// DIFFICULTY TAG
// =====================================================

function DifficultyTag({
  difficulty
}) {
  if (!difficulty) {
    return null;
  }

  let className =
    'bg-slate-100 text-slate-500';

  if (
    difficulty === 'Easy'
  ) {
    className =
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  }

  if (
    difficulty === 'Medium'
  ) {
    className =
      'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }

  if (
    difficulty === 'Hard'
  ) {
    className =
      'bg-red-500/10 text-red-600 dark:text-red-400';
  }

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-2
        py-1
        text-[10px]
        font-bold
        ${className}
      `}
    >
      {difficulty}
    </span>
  );
}

// =====================================================
// SUMMARY BOX
// =====================================================

function SummaryBox({
  icon: Icon,
  label,
  value
}) {
  return (
    <div
      className="
        rounded-xl
        bg-slate-50/80
        dark:bg-slate-900/50
        p-2.5
        text-center
      "
    >
      <Icon
        className="
          w-4
          h-4
          mx-auto
          text-primary-500
          mb-1
        "
      />

      <p
        className="
          text-sm
          font-extrabold
          text-slate-800
          dark:text-white
        "
      >
        {value}
      </p>

      <p
        className="
          text-[9px]
          uppercase
          font-bold
          tracking-wide
          text-slate-400
        "
      >
        {label}
      </p>
    </div>
  );
}
