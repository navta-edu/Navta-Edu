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
  ChevronDown,
  RefreshCw
} from 'lucide-react';

// =====================================================
// FILTER VALUES
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
  if (!type) {
    return 'mcq';
  }

  const value =
    String(type)
      .trim()
      .toLowerCase();

  if (
    [
      'short',
      'short answer',
      'short-answer',
      'short_answer'
    ].includes(value)
  ) {
    return 'short';
  }

  if (
    [
      'long',
      'long answer',
      'long-answer',
      'long_answer'
    ].includes(value)
  ) {
    return 'long';
  }

  return 'mcq';
}

function getQuestionTypeLabel(type) {
  const value =
    normalizeQuestionType(type);

  if (value === 'short') {
    return 'Short Answer';
  }

  if (value === 'long') {
    return 'Long Answer';
  }

  return 'MCQ';
}

function getDefaultMarks(question) {
  const marks =
    Number(question?.maxMarks);

  if (
    Number.isFinite(marks) &&
    marks > 0
  ) {
    return marks;
  }

  const type =
    normalizeQuestionType(
      question?.questionType
    );

  if (type === 'short') {
    return 3;
  }

  if (type === 'long') {
    return 5;
  }

  return 1;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll(
      "'",
      '&#039;'
    );
}

// NAVTA TEST-compatible LaTeX normalization and question visual helpers.
// Keep these transformations aligned with NavtaTestPage.jsx so the teacher
// paper uses the same saved question content and common LaTeX repairs.
const NAVTA_LATEX_COMMANDS =
  "begin|end|sum|prod|int|iint|iiint|oint|lim|frac|dfrac|tfrac|sqrt|binom|cdot|times|div|alpha|beta|gamma|delta|epsilon|varepsilon|theta|vartheta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|varphi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|sin|cos|tan|cot|sec|csc|log|ln|exp|det|text|mathrm|mathbf|mathit|mathbb|mathcal|left|right|neq|ne|leq|geq|approx|equiv|sim|propto|pm|mp|infty|vec|overrightarrow|overleftarrow|hat|bar|dot|ddot|partial|nabla|rightarrow|leftarrow|leftrightarrow|Rightarrow|Leftarrow|Leftrightarrow|therefore|because|in|notin|subset|subseteq|supset|supseteq|cup|cap|emptyset|forall|exists|degree|circ|angle|perp|parallel|ce|pu";

function normaliseNavtaLatex(input = '') {
  let value = String(input ?? '')
    .replace(/```(?:latex|tex|math)?/gi, '')
    .replace(/```/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();

  if (!value) return '';

  // Repair double-escaped LaTeX copied through JSON/API serialization.
  // Collapse doubled slashes before commands and math delimiters, while leaving
  // matrix line breaks and other intentional \ separators alone.
  value = value
    .replace(/\\\\(?=[A-Za-z])/g, '\\')
    .replace(/\\\\(?=[()[\]])/g, '\\')
    .replace(/\\\\(?=\$)/g, '\\');
  value = value.replace(/\\\s+(?=[A-Za-z])/g, '\\');
  value = value
    .replace(/\\cdotp\b/g, '\\cdot')
    .replace(/\\operatorname\s*\{C\}/g, 'C')
    .replace(/\\operatorname\s*\{sin\}/gi, '\\sin')
    .replace(/\\operatorname\s*\{cos\}/gi, '\\cos')
    .replace(/\\operatorname\s*\{tan\}/gi, '\\tan')
    .replace(/\\operatorname\s*\{cot\}/gi, '\\cot');

  // Match NAVTA TEST's combinations notation repairs.
  value = value
    .replace(/\{\}\^\{?([A-Za-z0-9+\-]+)\}?\s*C_\{([^{}]+)\}/g, '\\binom{$1}{$2}')
    .replace(/\{\}\^\{?([A-Za-z0-9+\-]+)\}?\s*C_([A-Za-z0-9+\-]+)/g, '\\binom{$1}{$2}')
    .replace(/\^\{?([A-Za-z0-9+\-]+)\}?\s*C_\{([^{}]+)\}/g, '\\binom{$1}{$2}')
    .replace(/\^\{?([A-Za-z0-9+\-]+)\}?\s*C_([A-Za-z0-9+\-]+)/g, '\\binom{$1}{$2}')
    .replace(/\b([A-Za-z0-9]+)\s*C_\{([^{}]+)\}/g, '\\binom{$1}{$2}')
    .replace(/\b([A-Za-z0-9]+)\s*C_([A-Za-z0-9+\-]+)/g, '\\binom{$1}{$2}')
    .replace(/\^\\([A-Za-z]+)\b/g, '^{\\$1}')
    .replace(/_\\([A-Za-z]+)\b/g, '_{\\$1}');

  // Repair unambiguous common OCR shorthand fractions only. Do not guess at
  // damaged expressions such as frac-x where the intended denominator is unknown.
  const commonFractions = {
    frac12: '\\frac{1}{2}', frac13: '\\frac{1}{3}', frac14: '\\frac{1}{4}',
    frac23: '\\frac{2}{3}', frac34: '\\frac{3}{4}', frac16: '\\frac{1}{6}',
    fracπ2: '\\frac{\\pi}{2}', fracpi2: '\\frac{\\pi}{2}',
    fracπ3: '\\frac{\\pi}{3}', fracπ4: '\\frac{\\pi}{4}'
  };
  for (const [bad, good] of Object.entries(commonFractions)) {
    value = value.replace(new RegExp(`(?<![A-Za-z])\\\\?${bad}(?![A-Za-z0-9])`, 'g'), good);
  }

  // Standardize MathJax delimiter variants while retaining existing $ delimiters.
  value = value
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
    .replace(/\\dfrac\b/g, '\\frac')
    .replace(/\\tfrac\b/g, '\\frac');

  // MathJax reports a visible "Missing or unrecognized delimiter for \right"
  // when imported questions contain malformed sizing commands. The sizing is
  // optional, so remove these commands while preserving the delimiters themselves.
  value = value
    .replace(/\\left\s*/g, '')
    .replace(/\\right\s*/g, '')
    .replace(/\\middle\s*/g, '');

  // Repair common unescaped fraction spellings from OCR/imported records.
  value = value
    .replace(/(^|[^\\A-Za-z])frac(?=\s*\{)/g, '$1\\frac')
    .replace(/\\dfrac\b/g, '\\frac')
    .replace(/\\tfrac\b/g, '\\frac');

  return value.trim();
}

function getQuestionImage(question) {
  // Keep the same image field priority as NAVTA TEST, while tolerating older
  // question-bank records and alternate API serialization shapes.
  const candidates = [
    question?.questionImage?.url,
    question?.questionImage?.src,
    question?.questionImage?.data,
    question?.questionImage?.imageUrl,
    question?.questionImage?.path,
    question?.questionImage?.secure_url,
    question?.questionImage?.image,
    question?.questionImageUrl,
    question?.image_url,
    question?.diagram_url,
    question?.fileUrl,
    question?.fileURL,
    question?.file_url,
    question?.publicUrl,
    question?.secure_url,
    question?.imageData,
    question?.imageBase64,
    question?.questionImageData,
    ...(Array.isArray(question?.questionImages)
      ? question.questionImages.flatMap((item) => [
          item?.url, item?.src, item?.data, item?.imageUrl,
          item?.path, item?.secure_url, item?.image
        ])
      : []),
    question?.imageUrl,
    question?.imageURL,
    question?.diagramUrl,
    question?.diagramURL,
    question?.visualUrl,
    question?.visualURL,
    question?.visualImage?.url,
    question?.visualImage?.src,
    question?.diagramImage?.url,
    question?.diagramImage?.src,
    question?.image?.url,
    question?.image?.src,
    question?.image?.data,
    question?.image?.imageUrl,
    question?.image?.path,
    question?.diagram?.url,
    question?.diagram?.src,
    question?.diagram?.data,
    question?.visual?.url,
    question?.visual?.src,
    question?.visual?.data,
    question?.imageData,
    question?.diagramData,
    question?.visualData,
    question?.imageBase64,
    question?.questionImageData,
    question?.screenshotUrl,
    question?.questionScreenshot,
    question?.croppedImageUrl,
    question?.cropImage?.url,
    question?.sourceImage?.url
  ];

  const toUsableUrl = (value) => {
    if (typeof value !== 'string') return '';
    const candidate = value.trim();
    if (!candidate || /^\[+\s*NAVTA[\s_-]*VISUAL\s*\]+$/i.test(candidate)) return '';
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(candidate)) return candidate;
    if (/^[A-Za-z0-9+/=\r\n]+$/.test(candidate) && candidate.length > 300) {
      return `data:image/png;base64,${candidate.replace(/\s/g, '')}`;
    }
    // Resolve root-relative and relative upload paths against the current host.
    if (/^(\/|\.\/|\.\.\/|uploads\/|upload\/|images\/|storage\/)/i.test(candidate)) {
      try { return new URL(candidate, window.location.origin).href; } catch { return ''; }
    }
    return '';
  };

  for (const item of candidates) {
    const values = item && typeof item === 'object'
      ? [item.url, item.src, item.data, item.imageUrl, item.path, item.secure_url, item.image]
      : [item];
    for (const value of values) {
      const url = toUsableUrl(value);
      if (url) return url;
    }
  }

  // Last-resort lookup for API versions that wrap image metadata differently.
  // Restrict recursion to image-related property names to avoid mistaking text
  // or unrelated document URLs for a question diagram.
  const seen = new Set();
  const visit = (value, depth = 0) => {
    if (!value || typeof value !== 'object' || depth > 4 || seen.has(value)) return '';
    seen.add(value);
    for (const [key, child] of Object.entries(value)) {
      if (/(image|diagram|visual|screenshot|crop|figure|illustration)/i.test(key)) {
        const direct = toUsableUrl(typeof child === 'string' ? child : '');
        if (direct) return direct;
        if (child && typeof child === 'object') {
          for (const nested of [child.url, child.src, child.data, child.imageUrl, child.path, child.secure_url]) {
            const url = toUsableUrl(nested);
            if (url) return url;
          }
          const deep = visit(child, depth + 1);
          if (deep) return deep;
        }
      } else if (child && typeof child === 'object') {
        const deep = visit(child, depth + 1);
        if (deep) return deep;
      }
    }
    return '';
  };
  return visit(question);
}

function renderPaperText(value = '') {
  let text = normaliseNavtaLatex(String(value ?? ''));
  // Hide the internal marker only; the saved diagram is inserted separately.
  text = text.replace(/\[+\s*NAVTA[\s_-]*VISUAL\s*\]+/gi, '');
  text = text.replace(/<br\s*\/?\s*>/gi, '\n');

  // Imported question-bank strings sometimes contain TeX commands without math
  // delimiters, or have only one side of a \( ... \) delimiter. Repair those
  // cases before HTML escaping so MathJax receives a balanced math expression.
  const hasLatexCommand = /\\(?:frac|dfrac|tfrac|sqrt|root|text|mathrm|mathbf|mathit|mathbb|mathcal|operatorname|left|right|middle|sin|cos|tan|cot|sec|csc|log|ln|int|sum|prod|binom|cdot|times|pi|theta|alpha|beta|gamma|infty|lim|neq|leq|geq|approx|pm|mp|overline|underline|vec|partial|nabla|begin|end)\b/i.test(text);
  const hasDollarDelimiter = /\$\$?[\s\S]*?\$\$?/.test(text);
  const hasParenDelimiter = /\\\(|\\\)/.test(text);
  const hasBracketDelimiter = /\\\[|\\\]/.test(text);

  if (hasParenDelimiter) {
    const opens = (text.match(/\\\(/g) || []).length;
    const closes = (text.match(/\\\)/g) || []).length;
    if (opens > closes) text += '\\)'.repeat(opens - closes);
    else if (closes > opens) text = '\\('.repeat(closes - opens) + text;
  } else if (hasBracketDelimiter) {
    const opens = (text.match(/\\\[/g) || []).length;
    const closes = (text.match(/\\\]/g) || []).length;
    if (opens > closes) text += '\\]'.repeat(opens - closes);
    else if (closes > opens) text = '\\['.repeat(closes - opens) + text;
  } else if (hasLatexCommand && !hasDollarDelimiter) {
    // Options are usually short math expressions. Wrapping the whole option is
    // safer than rendering only a leading fraction and leaving trailing terms raw.
    text = `\\(${text}\\)`;
  }

  // Convert bare common fraction spellings even if the source omitted the slash.
  text = text
    .replace(/(^|[^\\A-Za-z])frac(?=\s*\{)/g, '$1\\frac')
    .replace(/\\\\(?=(?:frac|sqrt|left|right|text|mathrm|sin|cos|tan|log|ln)\b)/g, '\\');

  return escapeHtml(text).replace(/\r?\n/g, '<br />');
}

// =====================================================
// AUTH HEADER
//
// This supports common NAVTA local-storage token names.
// If your API utility already injects Authorization,
// you can later move this into utils/api.js.
// =====================================================

function getAuthHeaders() {
  const token =
    localStorage.getItem(
      'token'
    ) ||
    localStorage.getItem(
      'authToken'
    ) ||
    localStorage.getItem(
      'accessToken'
    );

  const headers = {
    Accept:
      'application/json'
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  return headers;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function QuestionPaperBuilder() {
  const [
    questions,
    setQuestions
  ] = useState([]);

  const [
    chapters,
    setChapters
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState('');

  const [
    selectedQuestions,
    setSelectedQuestions
  ] = useState([]);

  const [
    filters,
    setFilters
  ] = useState({
    subject: '',
    exam: '',
    classLevel: '',
    chapter: '',
    difficulty: '',
    questionType: '',
    search: ''
  });

  const [
    paperDetails,
    setPaperDetails
  ] = useState({
    instituteName:
      'NAVTA',

    title:
      'Question Paper',

    examName: '',

    subject: '',

    classLevel: '',

    date: '',

    duration: '60',

    instructions:
      'Attempt all questions. Read each question carefully before answering.'
  });

  // ===================================================
  // LOAD QUESTION BANK
  // ===================================================

  const loadQuestionBank =
    async () => {
      try {
        setLoading(true);
        setError('');

        const params =
          new URLSearchParams();

        if (filters.subject) {
          params.set(
            'subject',
            filters.subject
          );
        }

        if (filters.exam) {
          params.set(
            'exam',
            filters.exam
          );
        }

        if (
          filters.classLevel
        ) {
          params.set(
            'classLevel',
            filters.classLevel
          );
        }

        if (filters.chapter) {
          params.set(
            'chapter',
            filters.chapter
          );
        }

        if (
          filters.difficulty
        ) {
          params.set(
            'difficulty',
            filters.difficulty
          );
        }

        if (
          filters.questionType
        ) {
          params.set(
            'questionType',
            filters.questionType
          );
        }

        if (
          filters.search.trim()
        ) {
          params.set(
            'search',
            filters.search.trim()
          );
        }

        const query =
          params.toString();

        const url =
          query
            ? `/api/teacher/question-bank?${query}`
            : '/api/teacher/question-bank';

        const response =
          await fetch(
            url,
            {
              method: 'GET',

              credentials:
                'include',

              headers:
                getAuthHeaders()
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
              'Unable to load NAVTA question bank.'
          );
        }

        setQuestions(
          Array.isArray(
            data.questions
          )
            ? data.questions
            : []
        );

        setChapters(
          Array.isArray(
            data.chapters
          )
            ? data.chapters
            : []
        );
      } catch (error) {
        console.error(
          'PAPER BUILDER ERROR:',
          error
        );

        setQuestions([]);
        setChapters([]);

        setError(
          error.message ||
            'Unable to load NAVTA question bank.'
        );
      } finally {
        setLoading(false);
      }
    };

  // ===================================================
  // AUTOMATIC REFRESH
  // ===================================================

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadQuestionBank();
      }, 250);

    return () =>
      clearTimeout(timer);
  }, [
    filters.subject,
    filters.exam,
    filters.classLevel,
    filters.chapter,
    filters.difficulty,
    filters.questionType,
    filters.search
  ]);

  // ===================================================
  // FILTER CHANGE
  // ===================================================

  const setFilter = (
    key,
    value
  ) => {
    setFilters(
      (previous) => ({
        ...previous,
        [key]: value
      })
    );
  };

  const setPrimaryFilter = (
    key,
    value
  ) => {
    setFilters(
      (previous) => ({
        ...previous,
        [key]: value,
        chapter: ''
      })
    );
  };

  const resetFilters = () => {
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
  // SELECT QUESTION
  // ===================================================

  const isSelected = (id) =>
    selectedQuestions.some(
      (question) =>
        question._id === id
    );

  const toggleQuestion = (
    question
  ) => {
    setSelectedQuestions(
      (previous) => {
        if (
          previous.some(
            (item) =>
              item._id ===
              question._id
          )
        ) {
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

  const selectAll = () => {
    setSelectedQuestions(
      (previous) => {
        const ids =
          new Set(
            previous.map(
              (item) =>
                item._id
            )
          );

        const additional =
          questions
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
          ...additional
        ];
      }
    );
  };

  const removeQuestion = (
    id
  ) => {
    setSelectedQuestions(
      (previous) =>
        previous.filter(
          (item) =>
            item._id !== id
        )
    );
  };

  const clearSelected =
    () => {
      setSelectedQuestions([]);
    };

  // ===================================================
  // REORDER
  // ===================================================

  const moveQuestion = (
    index,
    direction
  ) => {
    setSelectedQuestions(
      (previous) => {
        const nextIndex =
          index + direction;

        if (
          nextIndex < 0 ||
          nextIndex >=
            previous.length
        ) {
          return previous;
        }

        const copy = [
          ...previous
        ];

        [
          copy[index],
          copy[nextIndex]
        ] = [
          copy[nextIndex],
          copy[index]
        ];

        return copy;
      }
    );
  };

  // ===================================================
  // MARKS
  // ===================================================

  const updateMarks = (
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

  const totalMarks =
    useMemo(
      () =>
        selectedQuestions.reduce(
          (
            total,
            question
          ) =>
            total +
            (
              Number(
                question.paperMarks
              ) || 0
            ),
          0
        ),
      [selectedQuestions]
    );

  // ===================================================
  // PAPER DETAILS
  // ===================================================

  const updatePaperDetail =
    (
      key,
      value
    ) => {
      setPaperDetails(
        (previous) => ({
          ...previous,
          [key]: value
        })
      );
    };

  const useFiltersForPaper =
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
  // GENERATE STUDENT PDF
  // ===================================================

  const generateStudentPDF =
    () => {
      if (
        selectedQuestions.length ===
        0
      ) {
        window.alert(
          'Select at least one question first.'
        );

        return;
      }

      const printWindow =
        window.open(
          '',
          '_blank',
          'width=1000,height=850'
        );

      if (!printWindow) {
        window.alert(
          'Please allow popups for NAVTA.'
        );

        return;
      }

      const questionHtml =
        selectedQuestions
          .map(
            (
              question,
              index
            ) => {
              const type =
                normalizeQuestionType(
                  question.questionType
                );
              const questionImage = getQuestionImage(question);

              let optionsHtml =
                '';

              if (
                type === 'mcq' &&
                Array.isArray(
                  question.options
                )
              ) {
                optionsHtml = `
                  <div class="options">

                    ${question.options
                      .map(
                        (
                          option,
                          optionIndex
                        ) => `
                          <div class="option">

                            <strong>
                              ${String.fromCharCode(
                                65 +
                                  optionIndex
                              )}.
                            </strong>

                            ${renderPaperText(option)}

                          </div>
                        `
                      )
                      .join('')}

                  </div>
                `;
              }

              return `
                <div class="question">

                  <div class="question-row">

                    <div class="question-text">

                      <strong>
                        ${index + 1}.
                      </strong>

                      ${renderPaperText(question.question)}

                    </div>

                    <div class="marks">

                      [${
                        question.paperMarks
                      } ${
                        Number(
                          question.paperMarks
                        ) === 1
                          ? 'Mark'
                          : 'Marks'
                      }]

                    </div>

                  </div>

                  ${questionImage ? `<div class="question-image-wrap"><img class="question-image" src="${escapeHtml(questionImage)}" alt="Question diagram" /></div>` : ''}

                  ${optionsHtml}

                </div>
              `;
            }
          )
          .join('');

      printWindow.document.write(`
        <!DOCTYPE html>

        <html>

        <head>

          <meta charset="UTF-8" />

          <title>
            ${escapeHtml(
              paperDetails.title
            )}
          </title>

          <script>
            window.MathJax = {
              tex: {
                inlineMath: [['$','$'], ['\\(','\\)']],
                displayMath: [['$$','$$'], ['\\[','\\]']],
                processEscapes: true,
                packages: {'[+]': ['ams', 'mhchem']}
              },
              options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
              startup: { typeset: false }
            };
          </script>
          <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

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

            .brand {
              text-align: center;

              font-size: 28px;

              font-weight: 800;
            }

            .school {
              text-align: center;

              font-size: 14px;

              margin-top: 3px;
            }

            .paper-title {
              text-align: center;

              font-size: 19px;

              font-weight: 700;

              margin-top: 10px;
            }

            .meta {
              margin-top: 18px;

              padding:
                10px 0;

              border-top:
                1px solid #111827;

              border-bottom:
                1px solid #111827;

              display: grid;

              grid-template-columns:
                1fr 1fr;

              gap:
                6px 20px;
            }

            .right {
              text-align: right;
            }

            .instructions {
              margin-top: 15px;

              padding-bottom:
                14px;

              border-bottom:
                1px solid #d1d5db;
            }

            .questions {
              margin-top: 22px;
            }

            .question {
              margin-bottom: 22px;

              page-break-inside:
                avoid;
            }

            .question-row {
              display: flex;

              gap: 20px;

              justify-content:
                space-between;

              align-items:
                flex-start;
            }

            .question-text {
              flex: 1;
            }

            .marks {
              white-space:
                nowrap;

              font-weight: 700;
            }

            .options {
              display: grid;

              grid-template-columns:
                1fr 1fr;

              gap:
                8px 20px;

              margin:
                10px 0 0 25px;
            }

            .question-image-wrap {
              margin: 10px 0 0 25px;
              max-width: 100%;
            }

            .question-image {
              display: block;
              max-width: 100%;
              max-height: 420px;
              height: auto;
              object-fit: contain;
            }

            .question-text, .option {
              overflow-wrap: anywhere;
              white-space: normal;
            }

            mjx-container {
              max-width: 100%;
              overflow-x: auto;
              overflow-y: hidden;
            }

            .footer {
              margin-top: 40px;

              text-align: center;

              color: #6b7280;

              font-size: 10px;
            }

          </style>

        </head>

        <body>

          <div class="brand">
            NAVTA
          </div>

          <div class="school">
            ${escapeHtml(
              paperDetails.instituteName
            )}
          </div>

          <div class="paper-title">
            ${escapeHtml(
              paperDetails.title
            )}
          </div>

          <div class="meta">

            <div>

              <strong>
                Exam:
              </strong>

              ${
                escapeHtml(
                  paperDetails.examName
                ) ||
                '-'
              }

            </div>

            <div class="right">

              <strong>
                Time:
              </strong>

              ${
                escapeHtml(
                  paperDetails.duration
                ) ||
                '-'
              } Minutes

            </div>

            <div>

              <strong>
                Subject:
              </strong>

              ${
                escapeHtml(
                  paperDetails.subject
                ) ||
                '-'
              }

            </div>

            <div class="right">

              <strong>
                Maximum Marks:
              </strong>

              ${totalMarks}

            </div>

            <div>

              <strong>
                Class:
              </strong>

              ${
                escapeHtml(
                  paperDetails.classLevel
                ) ||
                '-'
              }

            </div>

            <div class="right">

              <strong>
                Date:
              </strong>

              ${
                escapeHtml(
                  paperDetails.date
                ) ||
                '-'
              }

            </div>

          </div>

          ${
            paperDetails.instructions
              ? `
                <div class="instructions">

                  <strong>
                    General Instructions
                  </strong>

                  <p>
                    ${escapeHtml(
                      paperDetails.instructions
                    )}
                  </p>

                </div>
              `
              : ''
          }

          <div class="questions">

            ${questionHtml}

          </div>

          <div class="footer">
            Generated using NAVTA Paper Builder
          </div>

          <script>
            (function () {
              let printed = false;
              function printWhenReady() {
                if (printed) return;
                printed = true;
                const images = Array.from(document.images || []);
                Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                  setTimeout(resolve, 2500);
                }))).then(() => {
                  const typeset = window.MathJax && window.MathJax.typesetPromise
                    ? window.MathJax.typesetPromise().catch(() => {})
                    : Promise.resolve();
                  return typeset;
                }).then(() => setTimeout(() => window.print(), 250));
              }
              window.addEventListener('load', () => {
                if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
                  window.MathJax.startup.promise.then(printWhenReady).catch(printWhenReady);
                } else {
                  setTimeout(printWhenReady, 1200);
                }
              });
              setTimeout(printWhenReady, 5000);
            })();
          </script>

        </body>

        </html>
      `);

      printWindow.document.close();
    };

  // ===================================================
  // UI
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
      {/* HEADER */}

      <div
        className="
          navta-premium-panel
          p-6
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
                px-3
                py-1.5
                rounded-full
                bg-primary-500/10
                text-primary-500
                text-xs
                font-bold
              "
            >
              <FileText
                className="
                  w-4
                  h-4
                "
              />

              NAVTA PAPER BUILDER
            </div>

            <h1
              className="
                mt-4
                text-3xl
                sm:text-4xl
                font-extrabold
                text-slate-900
                dark:text-white
              "
            >
              Build your question paper
            </h1>

            <p
              className="
                mt-2
                max-w-3xl
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Every question uploaded through
              Admin → Navta TEST automatically
              becomes available here.
            </p>

          </div>

          <div
            className="
              flex
              gap-3
              flex-wrap
            "
          >
            <HeaderStat
              label="Question Bank"
              value={
                questions.length
              }
            />

            <HeaderStat
              label="Selected"
              value={
                selectedQuestions.length
              }
              blue
            />

            <HeaderStat
              label="Total Marks"
              value={
                totalMarks
              }
              green
            />
          </div>
        </div>
      </div>

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-[minmax(0,1fr)_390px]
          gap-6
          items-start
        "
      >
        {/* LEFT */}

        <div
          className="
            space-y-6
            min-w-0
          "
        >
          {/* FILTERS */}

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
                    bg-sky-500/10
                    text-sky-500
                    flex
                    items-center
                    justify-center
                  "
                >
                  <SlidersHorizontal
                    className="
                      w-5
                      h-5
                    "
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
                    "
                  >
                    Chapters update automatically from Navta TEST.
                  </p>

                </div>
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={
                    loadQuestionBank
                  }
                  className="
                    text-slate-500
                    hover:text-primary-500
                  "
                >
                  <RefreshCw
                    className="
                      w-4
                      h-4
                    "
                  />
                </button>

                <button
                  type="button"
                  onClick={
                    resetFilters
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-bold
                    text-slate-500
                    hover:text-primary-500
                  "
                >
                  <RotateCcw
                    className="
                      w-4
                      h-4
                    "
                  />

                  Reset
                </button>
              </div>
            </div>

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
                value={
                  filters.search
                }
                onChange={
                  (event) =>
                    setFilter(
                      'search',
                      event.target.value
                    )
                }
                placeholder="Search question..."
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
                "
              />
            </div>

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
                options={
                  SUBJECTS
                }
                onChange={
                  (value) =>
                    setPrimaryFilter(
                      'subject',
                      value
                    )
                }
              />

              <FilterSelect
                label="Exam"
                value={
                  filters.exam
                }
                options={
                  EXAMS
                }
                onChange={
                  (value) =>
                    setPrimaryFilter(
                      'exam',
                      value
                    )
                }
              />

              <FilterSelect
                label="Class"
                value={
                  filters.classLevel
                }
                options={
                  CLASSES
                }
                onChange={
                  (value) =>
                    setPrimaryFilter(
                      'classLevel',
                      value
                    )
                }
              />

              <FilterSelect
                label="Chapter"
                value={
                  filters.chapter
                }
                options={
                  chapters
                }
                onChange={
                  (value) =>
                    setFilter(
                      'chapter',
                      value
                    )
                }
              />

              <FilterSelect
                label="Difficulty"
                value={
                  filters.difficulty
                }
                options={
                  DIFFICULTIES
                }
                onChange={
                  (value) =>
                    setFilter(
                      'difficulty',
                      value
                    )
                }
              />

              <FilterSelect
                label="Question Type"
                value={
                  filters.questionType
                }
                options={
                  QUESTION_TYPES
                }
                objectOptions
                onChange={
                  (value) =>
                    setFilter(
                      'questionType',
                      value
                    )
                }
              />
            </div>
          </div>

          {/* QUESTION BANK */}

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
                    bg-violet-500/10
                    text-violet-500
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Database
                    className="
                      w-5
                      h-5
                    "
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
                    "
                  >
                    {questions.length}
                    {' '}
                    matching questions
                  </p>

                </div>
              </div>

              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={
                    selectAll
                  }
                  className="
                    px-4
                    py-2
                    rounded-xl
                    bg-primary-500/10
                    text-primary-500
                    text-xs
                    font-bold
                  "
                >
                  Select All
                </button>
              )}
            </div>

            {loading && (
              <div
                className="
                  py-14
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
                  Loading questions...
                </p>
              </div>
            )}

            {!loading &&
              error && (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-500/30
                    bg-red-500/5
                    p-4
                  "
                >
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-red-500
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
                      text-sm
                      font-bold
                      text-primary-500
                    "
                  >
                    Try Again
                  </button>
                </div>
              )}

            {!loading &&
              !error &&
              questions.length ===
                0 && (
                <div
                  className="
                    py-14
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

                  <p
                    className="
                      mt-4
                      font-bold
                      text-slate-800
                      dark:text-white
                    "
                  >
                    No matching questions
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    Remove filters or add a question through Admin → Navta TEST.
                  </p>
                </div>
              )}

            {!loading &&
              !error &&
              questions.length >
                0 && (
                <div
                  className="
                    space-y-3
                  "
                >
                  {questions.map(
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
                          onClick={
                            () =>
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
                            transition

                            ${
                              selected
                                ? `
                                  border-primary-400
                                  bg-primary-500/5
                                `
                                : `
                                  border-slate-200
                                  dark:border-slate-700
                                  bg-white/40
                                  dark:bg-slate-900/35
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
                            {selected ? (
                              <CheckCircle2
                                className="
                                  w-5
                                  h-5
                                  mt-0.5
                                  text-primary-500
                                  shrink-0
                                "
                              />
                            ) : (
                              <Circle
                                className="
                                  w-5
                                  h-5
                                  mt-0.5
                                  text-slate-300
                                  dark:text-slate-600
                                  shrink-0
                                "
                              />
                            )}

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
                                  gap-2
                                  mb-2
                                "
                              >
                                <Tag>
                                  {question.subject}
                                </Tag>

                                <Tag>
                                  {question.exam}
                                </Tag>

                                <Tag>
                                  {question.classLevel}
                                </Tag>

                                <Tag>
                                  {question.chapter}
                                </Tag>

                                <Tag>
                                  {question.difficulty}
                                </Tag>

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
                                  text-slate-900
                                  dark:text-white
                                "
                              >
                                {index + 1}.{' '}
                                {question.question}
                              </p>

                              {normalizeQuestionType(
                                question.questionType
                              ) ===
                                'mcq' &&
                                Array.isArray(
                                  question.options
                                ) && (
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
                                            bg-slate-100/70
                                            dark:bg-slate-800/60
                                            px-3
                                            py-2
                                            text-xs
                                            text-slate-700
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

        {/* RIGHT */}

        <div
          className="
            space-y-5
            xl:sticky
            xl:top-20
          "
        >
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
              <ClipboardList
                className="
                  w-5
                  h-5
                  text-emerald-500
                "
              />

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
                onChange={
                  (value) =>
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
                onChange={
                  (value) =>
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
                onChange={
                  (value) =>
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
                onChange={
                  (value) =>
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
                onChange={
                  (value) =>
                    updatePaperDetail(
                      'classLevel',
                      value
                    )
                }
              />

              <PaperInput
                label="Duration (minutes)"
                type="number"
                value={
                  paperDetails.duration
                }
                onChange={
                  (value) =>
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
                onChange={
                  (value) =>
                    updatePaperDetail(
                      'date',
                      value
                    )
                }
              />

              <textarea
                value={
                  paperDetails.instructions
                }
                onChange={
                  (event) =>
                    updatePaperDetail(
                      'instructions',
                      event.target.value
                    )
                }
                rows={4}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  dark:border-slate-700
                  bg-white/70
                  dark:bg-slate-900/60
                  px-3
                  py-3
                  text-sm
                  text-slate-900
                  dark:text-white
                "
              />

              <button
                type="button"
                onClick={
                  useFiltersForPaper
                }
                className="
                  w-full
                  rounded-xl
                  bg-slate-100
                  dark:bg-slate-800
                  py-2.5
                  text-xs
                  font-bold
                  text-slate-700
                  dark:text-white
                "
              >
                Use Selected Filters
              </button>
            </div>
          </div>

          {/* SELECTED QUESTIONS */}

          <div
            className="
              navta-card-surface
              p-5
            "
          >
            <div
              className="
                flex
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
                  "
                >
                  {selectedQuestions.length}
                  {' '}
                  questions •
                  {' '}
                  {totalMarks}
                  {' '}
                  marks
                </p>

              </div>

              {selectedQuestions.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    clearSelected
                  }
                  className="
                    text-xs
                    font-bold
                    text-red-500
                  "
                >
                  Clear
                </button>
              )}
            </div>

            <div
              className="
                space-y-2
                max-h-[420px]
                overflow-y-auto
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
                      p-3
                    "
                  >
                    <div
                      className="
                        flex
                        gap-2
                      "
                    >
                      <span
                        className="
                          w-6
                          h-6
                          rounded-lg
                          bg-primary-500
                          text-white
                          text-[11px]
                          font-bold
                          flex
                          items-center
                          justify-center
                          shrink-0
                        "
                      >
                        {index + 1}
                      </span>

                      <p
                        className="
                          flex-1
                          text-xs
                          font-semibold
                          text-slate-700
                          dark:text-slate-200
                        "
                      >
                        {question.question}
                      </p>

                      <button
                        type="button"
                        onClick={
                          () =>
                            removeQuestion(
                              question._id
                            )
                        }
                      >
                        <X
                          className="
                            w-4
                            h-4
                            text-slate-400
                          "
                        />
                      </button>
                    </div>

                    <div
                      className="
                        mt-3
                        flex
                        items-center
                        justify-between
                      "
                    >
                      <div
                        className="
                          flex
                          gap-1
                        "
                      >
                        <button
                          type="button"
                          disabled={
                            index === 0
                          }
                          onClick={
                            () =>
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
                            disabled:opacity-30
                          "
                        >
                          <ArrowUp
                            className="
                              w-3.5
                              h-3.5
                            "
                          />
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                            selectedQuestions.length -
                              1
                          }
                          onClick={
                            () =>
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
                            disabled:opacity-30
                          "
                        >
                          <ArrowDown
                            className="
                              w-3.5
                              h-3.5
                            "
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
                            text-xs
                            text-slate-500
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
                          onChange={
                            (event) =>
                              updateMarks(
                                question._id,
                                event.target.value
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
                          "
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div
              className="
                mt-5
                pt-4
                border-t
                border-slate-200
                dark:border-slate-700
              "
            >
              <button
                type="button"
                disabled={
                  selectedQuestions.length ===
                  0
                }
                onClick={
                  generateStudentPDF
                }
                className="
                  w-full
                  rounded-xl
                  bg-primary-500
                  hover:bg-primary-600
                  disabled:bg-slate-300
                  dark:disabled:bg-slate-700
                  text-white
                  py-3
                  text-sm
                  font-bold
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >
                <Printer
                  className="
                    w-4
                    h-4
                  "
                />

                Generate Student PDF
              </button>
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
  options,
  onChange,
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
          value={
            value
          }
          onChange={
            (event) =>
              onChange(
                event.target.value
              )
          }
          className="
            appearance-none
            w-full
            rounded-xl
            border
            border-slate-200
            dark:border-slate-700
            bg-white/70
            dark:bg-slate-900/60
            px-3
            pr-9
            py-3
            text-sm
            text-slate-800
            dark:text-white
          "
        >
          <option value="">
            All {label}
          </option>

          {options.map(
            (option) =>
              objectOptions ? (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {option.label}
                </option>
              ) : (
                <option
                  key={
                    option
                  }
                  value={
                    option
                  }
                >
                  {option}
                </option>
              )
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
          mb-1.5
        "
      >
        {label}
      </label>

      <input
        type={
          type
        }
        value={
          value
        }
        onChange={
          (event) =>
            onChange(
              event.target.value
            )
        }
        className="
          w-full
          rounded-xl
          border
          border-slate-200
          dark:border-slate-700
          bg-white/70
          dark:bg-slate-900/60
          px-3
          py-2.5
          text-sm
          text-slate-900
          dark:text-white
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
// HEADER STAT
// =====================================================

function HeaderStat({
  label,
  value,
  blue = false,
  green = false
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        dark:border-slate-700
        bg-white/50
        dark:bg-slate-900/40
        px-4
        py-3
      "
    >
      <p
        className="
          text-[10px]
          font-bold
          uppercase
          text-slate-400
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-1
          text-xl
          font-extrabold

          ${
            blue
              ? 'text-sky-500'
              : green
                ? 'text-emerald-500'
                : 'text-slate-900 dark:text-white'
          }
        `}
      >
        {value}
      </p>
    </div>
  );
}
