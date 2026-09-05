import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  InlineMath,
  BlockMath,
} from "react-katex";

import "katex/dist/katex.min.css";

const PREPARATION_OPTIONS = {
  Physics: {
    NEET: {
      title: "NEET",
      description: "Medical entrance exam preparation",
      icon: "🩺",
    },
    JEE: {
      title: "JEE",
      description: "JEE entrance exam preparation",
      icon: "🚀",
    },
    Boards: {
      title: "Boards",
      description: "School board examination preparation",
      icon: "📚",
    },
  },
  Chemistry: {
    NEET: {
      title: "NEET",
      description: "Medical entrance exam preparation",
      icon: "🩺",
    },
    JEE: {
      title: "JEE",
      description: "JEE entrance exam preparation",
      icon: "🚀",
    },
    Boards: {
      title: "Boards",
      description: "School board examination preparation",
      icon: "📚",
    },
  },
  Maths: {
    JEE: {
      title: "JEE",
      description: "JEE entrance exam preparation",
      icon: "🚀",
    },
    Boards: {
      title: "Boards",
      description: "School board examination preparation",
      icon: "📚",
    },
  },
  Biology: {
    NEET: {
      title: "NEET",
      description: "Medical entrance exam preparation",
      icon: "🩺",
    },
    Boards: {
      title: "Boards",
      description: "School board examination preparation",
      icon: "📚",
    },
  },
};

const CLASSES = ["Class 11", "Class 12"];

const CHAPTERS = {
  Physics: {
    "Class 11": [
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
      "Semiconductor Electronics",
    ],
  },
  Chemistry: {
    "Class 11": [
      "Some Basic Concepts of Chemistry",
      "Structure of Atom",
      "Classification of Elements and Periodicity in Properties",
      "Chemical Bonding and Molecular Structure",
      "Thermodynamics",
      "Equilibrium",
      "Redox Reactions",
      "Organic Chemistry: Some Basic Principles and Techniques",
      "Hydrocarbons",
    ],
    "Class 12": [
      "Solutions",
      "Electrochemistry",
      "Chemical Kinetics",
      "The d- and f-Block Elements",
      "Coordination Compounds",
      "Haloalkanes and Haloarenes",
      "Alcohols, Phenols and Ethers",
      "Aldehydes, Ketones and Carboxylic Acids",
      "Amines",
      "Biomolecules",
    ],
  },
  Maths: {
    "Class 11": [
      "Sets",
      "Relations and Functions",
      "Trigonometric Functions",
      "Complex Numbers and Quadratic Equations",
      "Linear Inequalities",
      "Permutations and Combinations",
      "Binomial Theorem",
      "Sequences and Series",
      "Straight Lines",
      "Conic Sections",
      "Introduction to Three Dimensional Geometry",
      "Limits and Derivatives",
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
      "Microbes in Human Welfare",
      "Biotechnology: Principles and Processes",
      "Biotechnology and its Applications",
      "Organisms and Populations",
      "Ecosystem",
      "Biodiversity and Conservation",
    ],
  },
};

const DIFFICULTY_INFO = {
  Easy: { icon: "🌱", description: "Build your fundamentals" },
  Medium: { icon: "⚡", description: "Exam-level practice" },
  Hard: { icon: "🔥", description: "Advanced questions" },
};

const QUESTION_TYPE_INFO = {
  mcq: {
    title: "MCQ / Option",
    icon: "✅",
    description: "Choose one correct option",
    minutesPerQuestion: 1,
  },
  short: {
    title: "Short Answer",
    icon: "✍️",
    description: "Write a concise board-style answer",
    minutesPerQuestion: 3,
  },
  long: {
    title: "Long Answer",
    icon: "📝",
    description: "Write a detailed board-style answer",
    minutesPerQuestion: 6,
  },
};

const TEST_CONFIG = {
  NEET: {
    mcq: { minutesPerQuestion: 1, durations: [10, 15, 20, 30, 45, 60] },
  },
  JEE: {
    mcq: { minutesPerQuestion: 2, durations: [10, 20, 30, 40, 60, 90] },
  },
  Boards: {
    mcq: { minutesPerQuestion: 1, durations: [10, 15, 20, 30, 45, 60] },
    short: { minutesPerQuestion: 3, durations: [15, 30, 45, 60, 90] },
    long: { minutesPerQuestion: 6, durations: [30, 60, 90, 120, 180] },
  },
};

const BOSS_SIZES = {
  15: {
    name: "Quick Boss",
    icon: "⚡",
    description: "Fast multi-chapter challenge",
    targets: { Easy: 5, Medium: 6, Hard: 4 },
  },
  30: {
    name: "Major Boss",
    icon: "⚔",
    description: "Serious exam-style battle",
    targets: { Easy: 9, Medium: 12, Hard: 9 },
  },
  50: {
    name: "Final Boss",
    icon: "👑",
    description: "The ultimate endurance test",
    targets: { Easy: 15, Medium: 20, Hard: 15 },
  },
};

const BOSS_WIN_PERCENTAGE = 70;

function getQuestionCount(preparation, questionType, duration) {
  const config = TEST_CONFIG[preparation]?.[questionType];
  if (!config || !duration) return 0;
  return Math.floor(Number(duration) / config.minutesPerQuestion);
}

function getQuestionTypeLabel(questionType) {
  return QUESTION_TYPE_INFO[questionType]?.title || "MCQ / Option";
}

function getBossRank(percentage) {
  if (percentage >= 90) return { rank: "S", label: "Legendary Victory", icon: "👑" };
  if (percentage >= 80) return { rank: "A", label: "Dominant Victory", icon: "🏆" };
  if (percentage >= 70) return { rank: "B", label: "Boss Defeated", icon: "⚔" };
  return { rank: "LOST", label: "Revenge Unlocked", icon: "💀" };
}

function formatSolveTime(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes === 0) return `${remaining}s`;
  return `${minutes}m ${String(remaining).padStart(2, "0")}s`;
}

// =====================================================
// NAVTA RELIABLE MATH RENDERER
// =====================================================
//
// Important:
// - Text stays text.
// - $...$ / $$...$$ are parsed explicitly.
// - Matrix / determinant environments are NOT sent as
//   one fragile string. They are converted to rows/cells.
// - Each cell is rendered with KaTeX.
// - This prevents students seeing \begin{bmatrix},
//   \cos, \theta, &, or \\ as raw text.
// =====================================================

function normaliseNavtaLatex(input = "") {
  return String(input ?? "")
    .replace(/```(?:latex|tex|math)?/gi, "")
    .replace(/```/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")

    // ==========================================
    // FIX GEMINI DOUBLE-ESCAPED LATEX COMMANDS
    // ==========================================
    //
    // Examples:
    //
    // \\sum   -> \sum
    // \\cdot  -> \cdot
    // \\theta -> \theta
    //
    // Matrix row separators \\ are preserved
    // because they are not directly followed by
    // one of the supported command names below.
    //
    .replace(
      /\\\\(?=(?:begin|end|sum|prod|int|iint|iiint|lim|frac|dfrac|tfrac|sqrt|binom|cdot|times|div|alpha|beta|gamma|delta|epsilon|varepsilon|theta|vartheta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|varphi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|sin|cos|tan|cot|sec|csc|log|ln|det|text|mathrm|mathbf|mathit|mathbb|mathcal|left|right|neq|ne|leq|geq|approx|equiv|pm|mp|infty|vec|hat|bar|dot|ddot|partial|nabla|rightarrow|leftarrow|leftrightarrow|Rightarrow|therefore|because|in|notin|subset|subseteq|supset|supseteq|cup|cap|emptyset|forall|exists|degree|circ|angle|perp|parallel)\b)/g,
      "\\"
    )

    // Remove accidental spaces after a LaTeX slash.
    // Example:
    // \ sum -> \sum
    .replace(
      /\\\s+(?=[A-Za-z])/g,
      "\\"
    )

    .trim();
}

function renderNavtaInlineMath(math, key) {
  const cleaned = normaliseNavtaLatex(math).trim();

  if (!cleaned) return null;

  return (
    <InlineMath
      key={key}
      math={cleaned}
      renderError={() => (
        <span key={key}>{cleaned}</span>
      )}
    />
  );
}

function renderNavtaBlockMath(math, key) {
  const cleaned = normaliseNavtaLatex(math).trim();

  if (!cleaned) return null;

  return (
    <div
      key={key}
      style={{
        overflowX: "auto",
        maxWidth: "100%",
        margin: "8px 0",
      }}
    >
      <BlockMath
        math={cleaned}
        renderError={() => (
          <div>{cleaned}</div>
        )}
      />
    </div>
  );
}

const NAVTA_MATRIX_REGEX =
  /\\begin\{(matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix)\}([\s\S]*?)\\end\{\1\}/g;

function NavtaMatrix({
  environment = "matrix",
  body = "",
}) {
  const rows = String(body || "")
    .split(/\\\\/)
    .map((row) =>
      row
        .split("&")
        .map((cell) =>
          normaliseNavtaLatex(cell).trim()
        )
    )
    .filter((row) =>
      row.some((cell) => cell)
    );

  if (!rows.length) {
    return null;
  }

  const columns = Math.max(
    1,
    ...rows.map((row) => row.length)
  );

  const wrapperMap = {
    pmatrix: ["(", ")"],
    bmatrix: ["[", "]"],
    Bmatrix: ["{", "}"],
    vmatrix: ["|", "|"],
    Vmatrix: ["‖", "‖"],
    matrix: ["", ""],
  };

  const [left, right] =
    wrapperMap[environment] ||
    ["", ""];

  return (
    <span
      className="navta-matrix-renderer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
        margin: "2px 6px",
        maxWidth: "100%",
      }}
    >
      {left ? (
        <span
          aria-hidden="true"
          style={{
            fontFamily: "Georgia, serif",
            fontSize:
              rows.length >= 3
                ? "2.8em"
                : "2.25em",
            lineHeight: 0.8,
            fontWeight:
              environment === "Vmatrix"
                ? 700
                : 400,
          }}
        >
          {left}
        </span>
      ) : null}

      <span
        style={{
          display: "grid",
          gridTemplateColumns:
            `repeat(${columns}, max-content)`,
          columnGap: "12px",
          rowGap: "4px",
          alignItems: "center",
          justifyItems: "center",
          padding: "3px 6px",
        }}
      >
        {rows.flatMap(
          (row, rowIndex) =>
            Array.from(
              { length: columns },
              (_, columnIndex) => {
                const cell =
                  row[columnIndex] || "";

                return (
                  <span
                    key={`${rowIndex}-${columnIndex}`}
                    style={{
                      minWidth: "16px",
                      textAlign: "center",
                    }}
                  >
                    {cell
                      ? renderNavtaInlineMath(
                          cell,
                          `matrix-cell-${rowIndex}-${columnIndex}`
                        )
                      : "\u00a0"}
                  </span>
                );
              }
            )
        )}
      </span>

      {right ? (
        <span
          aria-hidden="true"
          style={{
            fontFamily: "Georgia, serif",
            fontSize:
              rows.length >= 3
                ? "2.8em"
                : "2.25em",
            lineHeight: 0.8,
            fontWeight:
              environment === "Vmatrix"
                ? 700
                : 400,
          }}
        >
          {right}
        </span>
      ) : null}
    </span>
  );
}

function renderNavtaMathExpression(
  math = "",
  keyPrefix = "math"
) {
  const source =
    normaliseNavtaLatex(math);

  if (!source) return null;

  const output = [];
  let cursor = 0;
  let serial = 0;

  NAVTA_MATRIX_REGEX.lastIndex = 0;

  let match;

  while (
    (match =
      NAVTA_MATRIX_REGEX.exec(source)) !==
    null
  ) {
    const before =
      source
        .slice(cursor, match.index)
        .trim();

    if (before) {
      output.push(
        renderNavtaInlineMath(
          before,
          `${keyPrefix}-before-${serial++}`
        )
      );
    }

    output.push(
      <NavtaMatrix
        key={`${keyPrefix}-matrix-${serial++}`}
        environment={match[1]}
        body={match[2]}
      />
    );

    cursor =
      match.index +
      match[0].length;
  }

  const after =
    source.slice(cursor).trim();

  if (after) {
    output.push(
      renderNavtaInlineMath(
        after,
        `${keyPrefix}-after-${serial++}`
      )
    );
  }

  if (output.length) {
    return output;
  }

  return renderNavtaInlineMath(
    source,
    `${keyPrefix}-single`
  );
}

function renderNavtaBareMatrices(
  text = "",
  keyPrefix = "text"
) {
  const source =
    normaliseNavtaLatex(text);

  if (!source) return null;

  const output = [];
  let cursor = 0;
  let serial = 0;

  NAVTA_MATRIX_REGEX.lastIndex = 0;

  let match;

  while (
    (match =
      NAVTA_MATRIX_REGEX.exec(source)) !==
    null
  ) {
    if (match.index > cursor) {
      output.push(
        <React.Fragment
          key={`${keyPrefix}-plain-${serial++}`}
        >
          {source.slice(
            cursor,
            match.index
          )}
        </React.Fragment>
      );
    }

    output.push(
      <NavtaMatrix
        key={`${keyPrefix}-matrix-${serial++}`}
        environment={match[1]}
        body={match[2]}
      />
    );

    cursor =
      match.index +
      match[0].length;
  }

  if (cursor < source.length) {
    output.push(
      <React.Fragment
        key={`${keyPrefix}-plain-${serial++}`}
      >
        {source.slice(cursor)}
      </React.Fragment>
    );
  }

  return output.length
    ? output
    : source;
}

function renderNavtaContent(input = "") {
  let value =
    normaliseNavtaLatex(input);

  if (!value) return null;

  // Standard TeX wrappers -> NAVTA delimiters.
  value = value
    .replace(
      /\\\[([\s\S]*?)\\\]/g,
      (_, math) =>
        `$$${math}$$`
    )
    .replace(
      /\\\(([\s\S]*?)\\\)/g,
      (_, math) =>
        `$${math}$`
    );

  // Split explicit math from prose.
  const parts = value.split(
    /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g
  );

  return parts.map(
    (part, index) => {
      if (!part) return null;

      if (
        part.startsWith("$$") &&
        part.endsWith("$$")
      ) {
        const math =
          part.slice(2, -2);

        const containsMatrix =
          /\\begin\{(?:matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix)\}/.test(
            math
          );

        if (containsMatrix) {
          return (
            <div
              key={`block-matrix-${index}`}
              style={{
                overflowX: "auto",
                margin: "8px 0",
              }}
            >
              {renderNavtaMathExpression(
                math,
                `block-${index}`
              )}
            </div>
          );
        }

        return renderNavtaBlockMath(
          math,
          `block-${index}`
        );
      }

      if (
        part.startsWith("$") &&
        part.endsWith("$")
      ) {
        const math =
          part.slice(1, -1);

        return (
          <React.Fragment
            key={`inline-${index}`}
          >
            {renderNavtaMathExpression(
              math,
              `inline-${index}`
            )}
          </React.Fragment>
        );
      }

      // If Gemini omitted $ delimiters around a matrix,
      // still render the matrix instead of raw \begin...
      return (
        <React.Fragment
          key={`text-${index}`}
        >
          {renderNavtaBareMatrices(
            part,
            `text-${index}`
          )}
        </React.Fragment>
      );
    }
  );
}


function getNavtaQuestionImage(question) {
  const primaryUrl = String(
    question?.questionImage?.url || ""
  ).trim();

  if (primaryUrl) {
    return {
      url: primaryUrl,
      altText:
        String(
          question?.questionImage?.altText ||
            question?.questionNumber ||
            "NAVTA question"
        ).trim() || "NAVTA question",
    };
  }

  const firstImage = Array.isArray(
    question?.questionImages
  )
    ? question.questionImages.find(
        (image) =>
          image &&
          typeof image === "object" &&
          String(image.url || "").trim()
      )
    : null;

  if (firstImage) {
    return {
      url: String(firstImage.url || "").trim(),
      altText:
        String(
          firstImage.altText ||
            question?.questionNumber ||
            "NAVTA question"
        ).trim() || "NAVTA question",
    };
  }

  return null;
}

function shouldUseNavtaQuestionScreenshot(question) {
  return Boolean(getNavtaQuestionImage(question));
}

function NavtaQuestionBody({ question }) {
  const image = getNavtaQuestionImage(question);

  if (image?.url) {
    return (
      <div className="navta-question-image-shell">
        <img
          src={image.url}
          alt={image.altText}
          className="navta-question-image"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <h2 className="navta-question">
      {renderNavtaContent(question?.question || "")}
    </h2>
  );
}

export default function NavtaTestPage() {
  const {
    updateCoinBalance,
    updateStreak,
  } = useAuth();

  const [step, setStep] = useState("mode");
  const [testMode, setTestMode] = useState("");

  const [subject, setSubject] = useState("");
  const [preparation, setPreparation] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [chapter, setChapter] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [questionType, setQuestionType] = useState("mcq");
  const [selectedDuration, setSelectedDuration] = useState(null);

  const [selectedChapters, setSelectedChapters] = useState([]);
  const [bossSize, setBossSize] = useState(15);
  const [bossMeta, setBossMeta] = useState(null);
  const [battleVariant, setBattleVariant] = useState("boss");
  const [revengeAttempt, setRevengeAttempt] = useState(0);
  const [originalBossPercentage, setOriginalBossPercentage] = useState(null);
  const [previousBattlePercentage, setPreviousBattlePercentage] = useState(null);
  const [revengeMeta, setRevengeMeta] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answers, setAnswers] = useState({});
  const [answerFeedback, setAnswerFeedback] = useState({});
  const [writtenAnswers, setWrittenAnswers] = useState({});
  const [writtenFeedback, setWrittenFeedback] = useState({});

  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [generatingTest, setGeneratingTest] = useState(false);
  const [generationError, setGenerationError] = useState("");

  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  const [questionTimes, setQuestionTimes] = useState({});
  const questionStartedAtRef = useRef(null);

  const [mistakeNotes, setMistakeNotes] = useState({});
  const [mistakeSaveState, setMistakeSaveState] = useState({});
  const [mistakeSaveMessage, setMistakeSaveMessage] = useState({});

  // =====================================================
  // NAVTA PERFORMANCE + COIN RESULT SAVING
  // =====================================================

  const [testDurationSeconds, setTestDurationSeconds] = useState(0);
  const [resultSaveStatus, setResultSaveStatus] = useState("idle");
  const [resultSaveMessage, setResultSaveMessage] = useState("");
  const [coinsAwarded, setCoinsAwarded] = useState(0);
  const [updatedCoinBalance, setUpdatedCoinBalance] = useState(null);

  const attemptIdRef = useRef("");
  const completionSubmitKeyRef = useRef("");

  const isBoss = testMode === "boss";
  const isRevenge = isBoss && battleVariant === "revenge";

  const resolvedQuestionType = isBoss
    ? "mcq"
    : preparation === "Boards"
      ? questionType
      : "mcq";

  const currentConfig =
    TEST_CONFIG[preparation]?.[resolvedQuestionType];

  const requestedQuestionCount = useMemo(() => {
    if (isBoss) return bossSize;
    return getQuestionCount(
      preparation,
      resolvedQuestionType,
      selectedDuration
    );
  }, [
    isBoss,
    bossSize,
    preparation,
    resolvedQuestionType,
    selectedDuration,
  ]);

  const minutesPerQuestion = isBoss
    ? preparation === "JEE"
      ? 2
      : 1
    : currentConfig?.minutesPerQuestion || 0;

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [timeLeft]);

  const currentTestQuestion = questions[currentQuestion];

  useEffect(() => {
    if (
      step === "test" &&
      !submitted &&
      questions.length > 0
    ) {
      questionStartedAtRef.current = Date.now();
    }
  }, [step, currentQuestion, questions.length, submitted]);

  useEffect(() => {
    if (
      step !== "test" ||
      submitted ||
      questions.length === 0
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    step,
    submitted,
    questions.length,
  ]);

  useEffect(() => {
    if (
      step !== "test" ||
      submitted ||
      questions.length === 0 ||
      timeLeft > 0
    ) {
      return;
    }

    setQuestionTimes((previous) => {
      if (previous[currentQuestion] !== undefined) {
        return previous;
      }

      const startedAt = questionStartedAtRef.current;

      if (!startedAt) {
        return previous;
      }

      return {
        ...previous,
        [currentQuestion]: Math.max(
          1,
          Math.ceil((Date.now() - startedAt) / 1000)
        ),
      };
    });

    setSubmitted(true);
  }, [
    step,
    submitted,
    timeLeft,
    questions.length,
    currentQuestion,
  ]);

  const clearTestRun = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers({});
    setAnswerFeedback({});
    setWrittenAnswers({});
    setWrittenFeedback({});
    setTimeLeft(0);
    setSubmitted(false);
    setBossMeta(null);
    setBattleVariant("boss");
    setRevengeAttempt(0);
    setOriginalBossPercentage(null);
    setPreviousBattlePercentage(null);
    setRevengeMeta(null);
    setGeneratingTest(false);
    setGenerationError("");
    setEvaluatingAnswer(false);
    setEvaluationError("");
    setQuestionTimes({});
    setMistakeNotes({});
    setMistakeSaveState({});
    setMistakeSaveMessage({});
    setTestDurationSeconds(0);
    setResultSaveStatus("idle");
    setResultSaveMessage("");
    setCoinsAwarded(0);
    setUpdatedCoinBalance(null);
    attemptIdRef.current = "";
    completionSubmitKeyRef.current = "";
    questionStartedAtRef.current = null;
  };

  const resetAfterSubject = () => {
    setPreparation("");
    setClassLevel("");
    setChapter("");
    setDifficulty("");
    setQuestionType("mcq");
    setSelectedDuration(null);
    setSelectedChapters([]);
    setGenerationError("");
  };

  const resetAfterPreparation = () => {
    setClassLevel("");
    setChapter("");
    setDifficulty("");
    setQuestionType("mcq");
    setSelectedDuration(null);
    setSelectedChapters([]);
    setGenerationError("");
  };

  const resetAfterClass = () => {
    setChapter("");
    setDifficulty("");
    setQuestionType("mcq");
    setSelectedDuration(null);
    setSelectedChapters([]);
    setGenerationError("");
  };

  const resetTest = () => {
    clearTestRun();
    setStep("mode");
    setTestMode("");
    setSubject("");
    setPreparation("");
    setClassLevel("");
    setChapter("");
    setDifficulty("");
    setQuestionType("mcq");
    setSelectedDuration(null);
    setSelectedChapters([]);
    setBossSize(15);
  };

  const chooseMode = (mode) => {
    clearTestRun();
    setTestMode(mode);
    setSubject("");
    setPreparation("");
    setClassLevel("");
    setChapter("");
    setDifficulty("");
    setQuestionType("mcq");
    setSelectedDuration(null);
    setSelectedChapters([]);
    setBossSize(15);
    setStep("subject");
  };

  const getCorrectAnswerIndex = (question) => {
    if (typeof question?.correctAnswer === "number") {
      return question.correctAnswer;
    }

    if (typeof question?.answer === "number") {
      return question.answer;
    }

    return Number(question?.correctAnswer);
  };

  const getMistakeSource = () => {
    if (isRevenge) return "revenge";
    if (isBoss) return "boss";
    return "standard";
  };

  const getStoredAuthToken = () => {
    if (typeof window === "undefined") return "";

    return (
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("authToken") ||
      window.localStorage.getItem("accessToken") ||
      ""
    );
  };

  const createAttemptId = () => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return `navta-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 12)}`;
  };

  const beginTrackedAttempt = (durationSeconds) => {
    const safeDurationSeconds = Math.max(
      0,
      Math.round(Number(durationSeconds) || 0)
    );

    attemptIdRef.current = createAttemptId();
    completionSubmitKeyRef.current = "";

    setTestDurationSeconds(safeDurationSeconds);
    setResultSaveStatus("idle");
    setResultSaveMessage("");
    setCoinsAwarded(0);
    setUpdatedCoinBalance(null);
  };

  const saveMistakeToNotebook = async (questionIndex) => {
    const question = questions[questionIndex];
    const selectedAnswer = answers[questionIndex];

    if (!question?._id) {
      setMistakeSaveState((previous) => ({
        ...previous,
        [questionIndex]: "error",
      }));
      setMistakeSaveMessage((previous) => ({
        ...previous,
        [questionIndex]:
          "This question cannot be saved because its question ID is missing.",
      }));
      return;
    }

    const correctAnswer = getCorrectAnswerIndex(question);

    if (
      selectedAnswer === undefined ||
      selectedAnswer === null ||
      selectedAnswer === correctAnswer
    ) {
      setMistakeSaveState((previous) => ({
        ...previous,
        [questionIndex]: "error",
      }));
      setMistakeSaveMessage((previous) => ({
        ...previous,
        [questionIndex]:
          "Only an incorrectly answered question can be added to the Mistake Notebook.",
      }));
      return;
    }

    setMistakeSaveState((previous) => ({
      ...previous,
      [questionIndex]: "saving",
    }));

    setMistakeSaveMessage((previous) => ({
      ...previous,
      [questionIndex]: "",
    }));

    try {
      const token = getStoredAuthToken();

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/mistake-notebook", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          questionId: question._id,
          selectedAnswer,
          note: String(mistakeNotes[questionIndex] || "").trim(),
          source: getMistakeSource(),
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save this question to your Mistake Notebook."
        );
      }

      setMistakeSaveState((previous) => ({
        ...previous,
        [questionIndex]: "saved",
      }));

      setMistakeSaveMessage((previous) => ({
        ...previous,
        [questionIndex]:
          data.message || "Added to your Mistake Notebook.",
      }));
    } catch (error) {
      console.error("Mistake Notebook save error:", error);

      setMistakeSaveState((previous) => ({
        ...previous,
        [questionIndex]: "error",
      }));

      setMistakeSaveMessage((previous) => ({
        ...previous,
        [questionIndex]:
          error.message ||
          "Unable to save this question to your Mistake Notebook.",
      }));
    }
  };

  const startStandardTest = async () => {
    if (
      !subject ||
      !preparation ||
      !classLevel ||
      !chapter ||
      !difficulty ||
      !selectedDuration
    ) {
      setGenerationError("Please complete all test selections first.");
      return;
    }

    setGeneratingTest(true);
    setGenerationError("");

    try {
      const response = await fetch("/api/navta-test/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          exam: preparation,
          classLevel,
          chapter,
          difficulty,
          questionType: resolvedQuestionType,
          duration: selectedDuration,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        if (
          data.required !== undefined &&
          data.available !== undefined
        ) {
          throw new Error(
            `${data.message || "Not enough questions."} Required: ${data.required}, available: ${data.available}.`
          );
        }

        throw new Error(data.message || "Unable to generate this test.");
      }

      const generatedQuestions = data?.test?.questions || [];

      if (generatedQuestions.length === 0) {
        throw new Error(
          "No matching questions were returned from the question bank."
        );
      }

      setQuestions(generatedQuestions);
      setCurrentQuestion(0);
      setAnswers({});
      setAnswerFeedback({});
      setWrittenAnswers({});
      setWrittenFeedback({});
      setQuestionTimes({});
      setMistakeNotes({});
      setMistakeSaveState({});
      setMistakeSaveMessage({});
      questionStartedAtRef.current = Date.now();

      const standardDurationSeconds =
        Number(
          data?.test?.durationSeconds ||
            Number(selectedDuration) * 60
        );

      beginTrackedAttempt(standardDurationSeconds);
      setTimeLeft(standardDurationSeconds);
      setSubmitted(false);
      setEvaluationError("");
      setStep("test");
    } catch (error) {
      console.error("Navta TEST generation error:", error);
      setGenerationError(
        error.message || "Unable to generate the test."
      );
    } finally {
      setGeneratingTest(false);
    }
  };

  const startBossBattle = async () => {
    if (
      !subject ||
      !preparation ||
      !classLevel
    ) {
      setGenerationError("Please complete the Boss Battle setup.");
      return;
    }

    if (selectedChapters.length < 2) {
      setGenerationError(
        "Select at least 2 chapters for Boss Battle."
      );
      return;
    }

    if (selectedChapters.length > bossSize) {
      setGenerationError(
        `A ${bossSize}-question Boss Battle cannot include more than ${bossSize} chapters.`
      );
      return;
    }

    setGeneratingTest(true);
    setGenerationError("");

    try {
      const response = await fetch("/api/navta-test/boss-battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          exam: preparation,
          classLevel,
          chapters: selectedChapters,
          totalQuestions: bossSize,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const unavailable = Array.isArray(data?.unavailableChapters)
          ? ` Missing question coverage: ${data.unavailableChapters.join(", ")}.`
          : "";

        const availability =
          data.required !== undefined &&
          data.available !== undefined
            ? ` Required: ${data.required}, available: ${data.available}.`
            : "";

        throw new Error(
          `${data.message || "Unable to generate Boss Battle."}${availability}${unavailable}`
        );
      }

      const battle = data?.bossBattle || {};
      const generatedQuestions = battle?.questions || [];

      if (generatedQuestions.length === 0) {
        throw new Error(
          "No Boss Battle questions were returned from the question bank."
        );
      }

      const returnedMinutes =
        Number(battle?.durationMinutes) ||
        Number(battle?.timer?.durationMinutes) ||
        Number(battle?.timer?.minutes);

      const returnedSeconds =
        Number(battle?.durationSeconds) ||
        Number(battle?.timer?.durationSeconds) ||
        (returnedMinutes ? returnedMinutes * 60 : 0);

      const fallbackSeconds =
        generatedQuestions.length *
        (preparation === "JEE" ? 2 : 1) *
        60;

      setBossMeta(battle);
      setBattleVariant("boss");
      setRevengeAttempt(0);
      setOriginalBossPercentage(null);
      setPreviousBattlePercentage(null);
      setRevengeMeta(null);
      setQuestions(generatedQuestions);
      setCurrentQuestion(0);
      setAnswers({});
      setAnswerFeedback({});
      setWrittenAnswers({});
      setWrittenFeedback({});
      setQuestionTimes({});
      setMistakeNotes({});
      setMistakeSaveState({});
      setMistakeSaveMessage({});
      questionStartedAtRef.current = Date.now();

      const bossDurationSeconds =
        returnedSeconds || fallbackSeconds;

      beginTrackedAttempt(bossDurationSeconds);
      setTimeLeft(bossDurationSeconds);
      setSubmitted(false);
      setEvaluationError("");
      setQuestionType("mcq");
      setStep("test");
    } catch (error) {
      console.error("Boss Battle generation error:", error);
      setGenerationError(
        error.message || "Unable to generate Boss Battle."
      );
    } finally {
      setGeneratingTest(false);
    }
  };

  const startRevengeBattle = async () => {
    if (!isBoss || questions.length === 0) return;

    if (bossPercentage >= BOSS_WIN_PERCENTAGE) {
      setGenerationError("You already defeated the Boss. Start a new Boss Battle instead.");
      return;
    }

    const nextAttempt = isRevenge ? revengeAttempt + 1 : 1;
    const baseOriginalPercentage =
      originalBossPercentage === null
        ? bossPercentage
        : originalBossPercentage;

    setGeneratingTest(true);
    setGenerationError("");

    try {
      const response = await fetch("/api/navta-test/revenge-battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          exam: preparation,
          classLevel,
          chapters: selectedChapters,
          totalQuestions: bossSize,
          previousQuestionIds: questions
            .map((question) => question?._id)
            .filter(Boolean),
          answers: questions.map((question, index) => ({
            questionId: question?._id,
            selectedAnswer:
              answers[index] !== undefined ? answers[index] : null,
          })),
          revengeAttempt: nextAttempt,
          previousPercentage: bossPercentage,
          originalPercentage: baseOriginalPercentage,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const availability =
          data.required !== undefined && data.available !== undefined
            ? ` Required: ${data.required}, available: ${data.available}.`
            : "";

        throw new Error(
          `${data.message || "Unable to generate Revenge Battle."}${availability}`
        );
      }

      const battle = data?.revengeBattle || {};
      const generatedQuestions = battle?.questions || [];

      if (generatedQuestions.length === 0) {
        throw new Error(
          "No Revenge Battle questions were returned from the question bank."
        );
      }

      const returnedSeconds =
        Number(battle?.durationSeconds) ||
        Number(battle?.durationMinutes) * 60 ||
        generatedQuestions.length * (preparation === "JEE" ? 2 : 1) * 60;

      setOriginalBossPercentage(baseOriginalPercentage);
      setPreviousBattlePercentage(bossPercentage);
      setRevengeAttempt(nextAttempt);
      setBattleVariant("revenge");
      setRevengeMeta(battle);
      setBossMeta(battle);

      setQuestions(generatedQuestions);
      setCurrentQuestion(0);
      setAnswers({});
      setAnswerFeedback({});
      setWrittenAnswers({});
      setWrittenFeedback({});
      setQuestionTimes({});
      setMistakeNotes({});
      setMistakeSaveState({});
      setMistakeSaveMessage({});
      questionStartedAtRef.current = Date.now();

      beginTrackedAttempt(returnedSeconds);
      setTimeLeft(returnedSeconds);
      setSubmitted(false);
      setEvaluationError("");
      setQuestionType("mcq");
      setStep("test");
    } catch (error) {
      console.error("Revenge Battle generation error:", error);
      setGenerationError(
        error.message || "Unable to generate Revenge Battle."
      );
    } finally {
      setGeneratingTest(false);
    }
  };

  const recordCurrentQuestionTime = () => {
    if (questionTimes[currentQuestion] !== undefined) return;

    const startedAt = questionStartedAtRef.current;
    if (!startedAt) return;

    const elapsedSeconds = Math.max(
      1,
      Math.ceil((Date.now() - startedAt) / 1000)
    );

    setQuestionTimes((previous) => ({
      ...previous,
      [currentQuestion]:
        previous[currentQuestion] ?? elapsedSeconds,
    }));
  };

  const goForwardAfterAnswer = () => {
    setEvaluationError("");

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
    } else {
      setSubmitted(true);
    }
  };

  const selectAnswer = (answerIndex) => {
    if (answerFeedback[currentQuestion]) return;

    recordCurrentQuestionTime();

    const question = questions[currentQuestion];
    const correctAnswer = getCorrectAnswerIndex(question);
    const isCorrect = answerIndex === correctAnswer;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion]: answerIndex,
    }));

    setAnswerFeedback((previous) => ({
      ...previous,
      [currentQuestion]: {
        isCorrect,
        selectedAnswer: answerIndex,
        correctAnswer,
      },
    }));

    if (isCorrect) {
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((previous) => previous + 1);
        } else {
          setSubmitted(true);
        }
      }, 300);
    }
  };

  const evaluateWrittenAnswer = async () => {
    const question = questions[currentQuestion];
    const studentAnswer = String(
      writtenAnswers[currentQuestion] || ""
    ).trim();

    if (!studentAnswer) {
      setEvaluationError(
        "Please write your answer before submitting it."
      );
      return;
    }

    if (!question?._id) {
      setEvaluationError(
        "This question cannot be evaluated because its question ID is missing."
      );
      return;
    }

    recordCurrentQuestionTime();

    setEvaluatingAnswer(true);
    setEvaluationError("");

    try {
      const response = await fetch(
        "/api/navta-test/evaluate-answer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId: question._id,
            studentAnswer,
          }),
        }
      );

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message || "AI could not evaluate this answer."
        );
      }

      setWrittenFeedback((previous) => ({
        ...previous,
        [currentQuestion]: data.evaluation,
      }));
    } catch (error) {
      console.error("Written answer evaluation error:", error);
      setEvaluationError(
        error.message || "Unable to evaluate the answer."
      );
    } finally {
      setEvaluatingAnswer(false);
    }
  };

  const mcqScore = useMemo(() => {
    if (resolvedQuestionType !== "mcq") return 0;

    return questions.reduce((total, question, index) => {
      return (
        total +
        (answers[index] === getCorrectAnswerIndex(question) ? 1 : 0)
      );
    }, 0);
  }, [answers, questions, resolvedQuestionType]);

  const writtenMarks = useMemo(() => {
    if (resolvedQuestionType === "mcq") {
      return { awarded: 0, maximum: 0 };
    }

    return questions.reduce(
      (result, question, index) => {
        const feedback = writtenFeedback[index];

        result.maximum += Number(question.maxMarks || 0);

        if (feedback) {
          result.awarded += Number(feedback.marksAwarded || 0);
        }

        return result;
      },
      { awarded: 0, maximum: 0 }
    );
  }, [questions, writtenFeedback, resolvedQuestionType]);

  const resultAccuracy = useMemo(() => {
    if (questions.length === 0) return 0;

    if (resolvedQuestionType === "mcq") {
      return Math.round((mcqScore / questions.length) * 100);
    }

    if (writtenMarks.maximum <= 0) return 0;

    return Math.round(
      (writtenMarks.awarded / writtenMarks.maximum) * 100
    );
  }, [
    questions.length,
    resolvedQuestionType,
    mcqScore,
    writtenMarks,
  ]);

  const speedBenchmarkSeconds = useMemo(() => {
    return Math.max(1, Number(minutesPerQuestion || 1) * 60);
  }, [minutesPerQuestion]);

  const bossPercentage = useMemo(() => {
    if (!isBoss || questions.length === 0) return 0;
    return Math.round((mcqScore / questions.length) * 100);
  }, [isBoss, mcqScore, questions.length]);

  const bossRank = useMemo(
    () => getBossRank(bossPercentage),
    [bossPercentage]
  );

  const bossWon = isBoss && bossPercentage >= BOSS_WIN_PERCENTAGE;

  // =====================================================
  // SAVE COMPLETED NAVTA TEST
  // =====================================================

  const saveCompletedNavtaResult = async () => {
    if (
      !submitted ||
      step !== "test" ||
      questions.length === 0 ||
      !attemptIdRef.current
    ) {
      return;
    }

    const attemptId = attemptIdRef.current;

    if (completionSubmitKeyRef.current === attemptId) {
      return;
    }

    completionSubmitKeyRef.current = attemptId;
    setResultSaveStatus("saving");
    setResultSaveMessage("");

    const selectedDurationForReward = Math.max(
      1,
      Math.ceil(
        Number(
          isBoss
            ? testDurationSeconds / 60
            : selectedDuration
        ) || 0
      )
    );

    const timeTaken = Math.max(
      0,
      Number(testDurationSeconds || 0) -
        Number(timeLeft || 0)
    );

    const submissionAnswers = questions.map(
      (question, index) => ({
        questionId: question?._id,
        selectedOption:
          answers[index] !== undefined
            ? answers[index]
            : null,
        textAnswer:
          writtenAnswers[index] !== undefined
            ? String(writtenAnswers[index])
            : "",
        evaluation:
          writtenFeedback[index] || null,
      })
    );

    try {
      const token = getStoredAuthToken();

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        "/api/navta-test/complete",
        {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            attemptId,
            testType: isRevenge
              ? "revenge"
              : isBoss
                ? "boss"
                : "standard",
            subject,
            exam: preparation,
            classLevel,
            chapter: isBoss ? "" : chapter,
            chapters: isBoss
              ? selectedChapters
              : chapter
                ? [chapter]
                : [],
            difficulty: isBoss ? "" : difficulty,
            questionType: resolvedQuestionType,
            selectedDuration: selectedDurationForReward,
            timeTaken,
            answers: submissionAnswers,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Your score could not be saved."
        );
      }

      const reward =
        Number(
          data?.data?.coinsEarned ??
            data?.coinsEarned ??
            0
        ) || 0;

      const balanceValue =
        data?.data?.coinBalance ??
        data?.data?.newCoins ??
        data?.coinBalance ??
        null;

      const streakValue =
        data?.data?.streak ??
        data?.streak ??
        null;

      setCoinsAwarded(reward);

      if (
        balanceValue !== null &&
        balanceValue !== undefined
      ) {
        const nextCoinBalance =
          Number(balanceValue) || 0;

        setUpdatedCoinBalance(
          nextCoinBalance
        );

        updateCoinBalance(
          nextCoinBalance
        );
      }

      if (streakValue) {
        updateStreak(
          streakValue
        );
      }

      setResultSaveStatus("saved");

      if (reward === 2) {
        setResultSaveMessage(
          "Excellent work — you earned 2 coins for scoring above 80% on a 30-minute-or-longer test."
        );
      } else if (reward === 1) {
        setResultSaveMessage(
          "Excellent work — you earned 1 coin for scoring above 80% on a test under 30 minutes."
        );
      } else {
        setResultSaveMessage(
          "Result saved. Score above 80% to earn NAVTA Test coins."
        );
      }
    } catch (error) {
      console.error(
        "NAVTA result save error:",
        error
      );

      completionSubmitKeyRef.current = "";
      setResultSaveStatus("error");
      setResultSaveMessage(
        error.message ||
          "Your test is complete, but the result could not be saved."
      );
    }
  };

  useEffect(() => {
    if (
      submitted &&
      step === "test" &&
      questions.length > 0 &&
      attemptIdRef.current
    ) {
      saveCompletedNavtaResult();
    }
    // The attempt ID guard prevents duplicate rewards/submissions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const difficultyPerformance = useMemo(() => {
    if (!isBoss) return {};

    return questions.reduce((result, question, index) => {
      const level = question?.difficulty || "Unknown";

      if (!result[level]) {
        result[level] = { correct: 0, total: 0 };
      }

      result[level].total += 1;

      if (
        answers[index] ===
        getCorrectAnswerIndex(question)
      ) {
        result[level].correct += 1;
      }

      return result;
    }, {});
  }, [isBoss, questions, answers]);

  const chapterPerformance = useMemo(() => {
    if (!isBoss) return {};

    return questions.reduce((result, question, index) => {
      const name = question?.chapter || "Unknown Chapter";

      if (!result[name]) {
        result[name] = { correct: 0, total: 0 };
      }

      result[name].total += 1;

      if (
        answers[index] ===
        getCorrectAnswerIndex(question)
      ) {
        result[name].correct += 1;
      }

      return result;
    }, {});
  }, [isBoss, questions, answers]);

  const toggleBossChapter = (item) => {
    setGenerationError("");

    setSelectedChapters((previous) => {
      if (previous.includes(item)) {
        return previous.filter((chapterName) => chapterName !== item);
      }

      if (previous.length >= bossSize) {
        return previous;
      }

      return [...previous, item];
    });
  };

  const goBackFromClass = () => {
    resetAfterPreparation();
    setStep("preparation");
  };

  const goBackFromChapter = () => {
    resetAfterClass();
    setStep("class");
  };

  const goBackFromDifficulty = () => {
    setDifficulty("");
    setQuestionType("mcq");
    setSelectedDuration(null);
    setGenerationError("");
    setStep("chapter");
  };

  const goBackFromQuestionType = () => {
    setQuestionType("mcq");
    setSelectedDuration(null);
    setGenerationError("");
    setStep("difficulty");
  };

  const goBackFromDuration = () => {
    setSelectedDuration(null);
    setGenerationError("");

    if (preparation === "Boards") {
      setStep("questionType");
    } else {
      setStep("difficulty");
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .navta-test-page {
          --nt-page-bg: rgba(248, 250, 252, 0.82);
          --nt-card-bg: rgba(255, 255, 255, 0.88);
          --nt-card-bg-strong: #ffffff;
          --nt-surface: #f8fafc;
          --nt-surface-2: #f1f5f9;
          --nt-border: #dbe3ee;
          --nt-border-strong: #cbd5e1;
          --nt-text: #0f172a;
          --nt-muted: #64748b;
          --nt-soft-text: #475569;
          --nt-accent: #0284c7;
          --nt-accent-soft: #e0f2fe;
          --nt-accent-text: #0369a1;
          --nt-boss-bg: rgba(255, 247, 237, 0.92);
          --nt-boss-soft: rgba(245, 158, 11, 0.12);
          --nt-boss-text: #b45309;
          --nt-danger-bg: #fef2f2;
          --nt-danger-text: #dc2626;
          --nt-danger-border: rgba(220, 38, 38, 0.3);
          --nt-success-bg: #f0fdf4;
          --nt-success-text: #15803d;
          --nt-success-border: rgba(22, 163, 74, 0.3);

          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          background: var(--nt-page-bg);
          color: var(--nt-text);
          padding: 40px;
          transition: background 0.25s ease, color 0.25s ease;
        }

        html.dark .navta-test-page {
          --nt-page-bg: rgba(11, 18, 32, 0.94);
          --nt-card-bg: #151d2d;
          --nt-card-bg-strong: #151d2d;
          --nt-surface: #0f172a;
          --nt-surface-2: #111827;
          --nt-border: #243047;
          --nt-border-strong: #334155;
          --nt-text: #ffffff;
          --nt-muted: #94a3b8;
          --nt-soft-text: #cbd5e1;
          --nt-accent: #0ea5e9;
          --nt-accent-soft: #102a43;
          --nt-accent-text: #38bdf8;
          --nt-boss-bg: rgba(120, 53, 15, 0.22);
          --nt-boss-soft: rgba(245, 158, 11, 0.16);
          --nt-boss-text: #fbbf24;
          --nt-danger-bg: rgba(127, 29, 29, 0.2);
          --nt-danger-text: #fca5a5;
          --nt-danger-border: rgba(239, 68, 68, 0.45);
          --nt-success-bg: rgba(20, 83, 45, 0.22);
          --nt-success-text: #86efac;
          --nt-success-border: rgba(34, 197, 94, 0.5);
        }

        .navta-card,
        .navta-mode-card,
        .navta-duration-card,
        .navta-summary-card,
        .navta-question-card,
        .navta-result-card {
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          backdrop-filter: blur(8px);
        }

        html.dark .navta-card,
        html.dark .navta-mode-card,
        html.dark .navta-duration-card,
        html.dark .navta-summary-card,
        html.dark .navta-question-card,
        html.dark .navta-result-card {
          box-shadow: none;
        }

        .navta-written-answer,
        .navta-option {
          background: var(--nt-surface);
          color: var(--nt-text);
        }

        .navta-header,
        .navta-test-header {
          max-width: 1100px;
          margin: 0 auto 35px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .navta-title {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
        }

        .navta-subtitle {
          margin-top: 8px;
          margin-bottom: 0;
          color: var(--nt-muted);
          line-height: 1.5;
        }

        .navta-mode-grid,
        .navta-grid,
        .navta-preparation-grid,
        .navta-difficulty-grid,
        .navta-question-type-grid,
        .navta-duration-grid,
        .navta-boss-grid {
          max-width: 1000px;
          margin: 30px auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .navta-mode-grid {
          max-width: 900px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .navta-class-grid {
          max-width: 900px;
          margin: 30px auto;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .navta-chapter-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .navta-card,
        .navta-mode-card {
          min-width: 0;
          padding: 28px;
          border-radius: 18px;
          border: 1px solid var(--nt-border);
          background: var(--nt-card-bg);
          color: var(--nt-text);
          cursor: pointer;
          text-align: left;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .navta-mode-card {
          min-height: 260px;
          position: relative;
          overflow: hidden;
        }

        .navta-mode-card.standard {
          border-color: #334155;
        }

        .navta-mode-card.boss {
          border-color: rgba(245, 158, 11, 0.45);
          background:
            radial-gradient(circle at top right, var(--nt-boss-soft), transparent 40%),
            var(--nt-card-bg);
        }

        .navta-card:hover,
        .navta-mode-card:hover {
          transform: translateY(-3px);
          border-color: var(--nt-accent);
        }

        .navta-mode-card.boss:hover {
          border-color: #f59e0b;
        }

        .navta-card.active {
          border: 2px solid var(--nt-accent);
          background: var(--nt-accent-soft);
        }

        .navta-card-icon {
          margin-bottom: 14px;
          font-size: 36px;
        }

        .navta-mode-icon {
          font-size: 48px;
          margin-bottom: 18px;
        }

        .navta-card h2,
        .navta-mode-card h2 {
          margin: 0 0 8px;
          font-size: 21px;
        }

        .navta-card p,
        .navta-mode-card p {
          margin: 0;
          color: var(--nt-muted);
          line-height: 1.5;
        }

        .navta-mode-features {
          display: grid;
          gap: 8px;
          margin: 20px 0 0;
          color: var(--nt-soft-text);
          font-size: 14px;
        }

        .navta-continue {
          display: block;
          margin-top: 18px;
          color: var(--nt-accent-text);
          font-weight: 700;
        }

        .navta-boss-continue {
          color: var(--nt-boss-text);
        }

        .navta-chapter-card {
          width: 100%;
          min-width: 0;
          padding: 18px;
          border-radius: 12px;
          border: 1px solid var(--nt-border);
          background: var(--nt-card-bg);
          color: var(--nt-text);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          text-align: left;
          font-size: 15px;
          overflow-wrap: anywhere;
        }

        .navta-chapter-card:hover {
          border-color: var(--nt-accent);
        }

        .navta-chapter-card.selected {
          border-color: #f59e0b;
          background: var(--nt-boss-bg);
        }

        .navta-check {
          width: 24px;
          height: 24px;
          flex: 0 0 24px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          border: 1px solid #475569;
          color: transparent;
        }

        .navta-chapter-card.selected .navta-check {
          background: #f59e0b;
          border-color: #f59e0b;
          color: #111827;
          font-weight: 900;
        }

        .navta-duration-card {
          min-height: 120px;
          padding: 22px;
          border-radius: 16px;
          border: 2px solid var(--nt-border-strong);
          background: var(--nt-card-bg);
          color: var(--nt-text);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: 0.2s ease;
        }

        .navta-duration-card:hover {
          transform: translateY(-2px);
          border-color: var(--nt-accent);
        }

        .navta-duration-card.active {
          border-color: var(--nt-accent);
          background: var(--nt-accent-soft);
          box-shadow: 0 0 0 1px var(--nt-accent);
        }

        .navta-boss-card.active {
          border-color: #f59e0b;
          background: var(--nt-boss-bg);
          box-shadow: 0 0 0 1px #f59e0b;
        }

        .navta-duration-time {
          font-size: 20px;
          font-weight: 800;
        }

        .navta-duration-questions {
          color: var(--nt-muted);
          font-size: 14px;
        }

        .navta-rule-banner {
          max-width: 900px;
          margin: 0 auto 10px;
          padding: 14px 18px;
          border: 1px solid var(--nt-border);
          border-radius: 12px;
          background: var(--nt-surface-2);
          color: var(--nt-soft-text);
          text-align: center;
          line-height: 1.5;
        }

        .navta-boss-banner {
          border-color: rgba(245, 158, 11, 0.35);
          background: var(--nt-boss-bg);
        }

        .navta-selection-count {
          max-width: 1100px;
          margin: 0 auto 18px;
          padding: 14px 18px;
          border-radius: 12px;
          border: 1px solid rgba(245, 158, 11, 0.35);
          background: var(--nt-boss-bg);
          color: var(--nt-boss-text);
          font-weight: 700;
        }

        .navta-mix-grid {
          max-width: 760px;
          margin: 22px auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .navta-mix-item {
          padding: 16px;
          border-radius: 14px;
          border: 1px solid var(--nt-border-strong);
          background: var(--nt-surface);
          text-align: center;
        }

        .navta-mix-item strong {
          display: block;
          margin-top: 6px;
          font-size: 22px;
        }

        .navta-summary-card {
          max-width: 760px;
          margin: 35px auto;
          padding: 28px;
          border-radius: 18px;
          background: var(--nt-card-bg);
          border: 1px solid var(--nt-border);
        }

        .navta-summary-card.boss {
          border-color: rgba(245, 158, 11, 0.42);
          background:
            radial-gradient(circle at top right, var(--nt-boss-soft), transparent 38%),
            var(--nt-card-bg);
        }

        .navta-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 20px;
        }

        .navta-summary-item {
          padding: 14px;
          border-radius: 12px;
          background: var(--nt-surface);
          border: 1px solid var(--nt-border);
        }

        .navta-summary-label {
          display: block;
          margin-bottom: 5px;
          color: var(--nt-muted);
          font-size: 12px;
        }

        .navta-summary-value {
          font-weight: 700;
          color: var(--nt-text);
          overflow-wrap: anywhere;
        }

        .navta-error {
          max-width: 760px;
          margin: 18px auto;
          padding: 14px 16px;
          border: 1px solid var(--nt-danger-border);
          border-radius: 12px;
          background: var(--nt-danger-bg);
          color: var(--nt-danger-text);
          line-height: 1.5;
          text-align: center;
        }

        .navta-reward-result {
          margin: 20px auto;
          padding: 16px 18px;
          border-radius: 14px;
          border: 1px solid var(--nt-border);
          background: var(--nt-surface);
          text-align: left;
        }

        .navta-reward-result.saved {
          border-color: var(--nt-success-border);
          background: var(--nt-success-bg);
        }

        .navta-reward-result.error {
          border-color: var(--nt-danger-border);
          background: var(--nt-danger-bg);
        }

        .navta-reward-result strong {
          display: block;
          margin-bottom: 5px;
          color: var(--nt-text);
        }

        .navta-reward-result p {
          margin: 0;
          color: var(--nt-muted);
          line-height: 1.5;
          font-size: 13px;
        }

        .navta-reward-coins {
          margin-top: 10px;
          font-size: 24px;
          font-weight: 900;
          color: #ca8a04;
        }

        .navta-reward-balance {
          margin-top: 4px;
          color: var(--nt-soft-text);
          font-size: 12px;
          font-weight: 700;
        }

        .navta-retry-save {
          margin-top: 12px;
          padding: 9px 13px;
          border: 1px solid var(--nt-border-strong);
          border-radius: 9px;
          background: var(--nt-card-bg);
          color: var(--nt-text);
          font-weight: 800;
          cursor: pointer;
        }

        .navta-test-header {
          margin-bottom: 20px;
        }

        .navta-question-card {
          max-width: 1000px;
          margin: 0 auto;
          padding: 35px;
          border-radius: 18px;
          background: var(--nt-card-bg);
          border: 1px solid var(--nt-border);
        }

        .navta-boss-question-meta {
          max-width: 1000px;
          margin: 0 auto 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .navta-tag {
          padding: 6px 10px;
          border-radius: 999px;
          background: var(--nt-surface-2);
          border: 1px solid var(--nt-border-strong);
          color: var(--nt-soft-text);
          font-size: 12px;
          font-weight: 700;
        }

        .navta-tag.boss {
          border-color: rgba(245, 158, 11, 0.38);
          color: var(--nt-boss-text);
        }

        .navta-question {
          margin: 0 0 30px;
          font-size: 22px;
          line-height: 1.5;
        }

        .navta-option {
          width: 100%;
          min-width: 0;
          padding: 17px;
          margin-bottom: 12px;
          border-radius: 10px;
          border: 1px solid var(--nt-border-strong);
          background: var(--nt-surface);
          color: var(--nt-text);
          text-align: left;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 15px;
          overflow-wrap: anywhere;
        }

        .navta-option:disabled {
          opacity: 1;
        }

        .navta-answer-feedback,
        .navta-written-feedback {
          max-width: 1000px;
          margin: 18px auto 0;
          padding: 18px;
          border-radius: 14px;
          border: 1px solid var(--nt-border-strong);
          background: var(--nt-surface-2);
        }

        .navta-answer-feedback.wrong {
          border-color: rgba(239, 68, 68, 0.5);
          background: var(--nt-danger-bg);
        }

        .navta-mistake-box {
          margin-top: 18px;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid var(--nt-border-strong);
          background: var(--nt-card-bg);
        }

        .navta-mistake-box h4 {
          margin: 0 0 6px;
          color: var(--nt-text);
          font-size: 16px;
        }

        .navta-mistake-box p {
          margin: 0 0 12px;
          color: var(--nt-muted);
          line-height: 1.5;
          font-size: 13px;
        }

        .navta-mistake-note {
          width: 100%;
          min-height: 92px;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid var(--nt-border-strong);
          background: var(--nt-surface);
          color: var(--nt-text);
          font: inherit;
          line-height: 1.5;
          resize: vertical;
          outline: none;
        }

        .navta-mistake-note:focus {
          border-color: var(--nt-accent);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
        }

        .navta-mistake-actions {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .navta-mistake-button {
          border: 0;
          border-radius: 10px;
          padding: 11px 15px;
          background: #b45309;
          color: #ffffff;
          font-weight: 800;
          cursor: pointer;
        }

        .navta-mistake-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .navta-mistake-message {
          font-size: 13px;
          font-weight: 700;
          color: var(--nt-muted);
        }

        .navta-mistake-message.saved {
          color: var(--nt-success-text);
        }

        .navta-mistake-message.error {
          color: var(--nt-danger-text);
        }

        .navta-written-feedback.correct {
          border-color: rgba(34, 197, 94, 0.5);
          background: var(--nt-success-bg);
        }

        .navta-written-feedback.partial {
          border-color: rgba(245, 158, 11, 0.5);
          background: var(--nt-boss-bg);
        }

        .navta-written-feedback.incorrect {
          border-color: rgba(239, 68, 68, 0.5);
          background: var(--nt-danger-bg);
        }

        .navta-written-answer {
          width: 100%;
          min-height: 220px;
          padding: 16px;
          border: 1px solid var(--nt-border-strong);
          border-radius: 12px;
          background: var(--nt-surface);
          color: var(--nt-text);
          font: inherit;
          line-height: 1.65;
          resize: vertical;
          outline: none;
        }

        .navta-written-answer:focus {
          border-color: var(--nt-accent);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
        }

        .navta-navigation {
          max-width: 1000px;
          margin: 20px auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .navta-result-card {
          max-width: 760px;
          margin: 60px auto;
          padding: 40px;
          border-radius: 20px;
          background: var(--nt-card-bg);
          border: 1px solid var(--nt-border);
          text-align: center;
        }

        .navta-result-card.boss {
          border-color: rgba(245, 158, 11, 0.5);
          background:
            radial-gradient(circle at top, var(--nt-boss-soft), transparent 34%),
            var(--nt-card-bg);
        }

        .navta-result-score {
          margin: 22px 0;
          font-size: 56px;
          font-weight: 900;
        }

        .navta-rank {
          margin: 18px auto;
          font-size: 70px;
          font-weight: 900;
          color: var(--nt-boss-text);
          letter-spacing: -2px;
        }

        .navta-performance-section {
          margin-top: 28px;
          text-align: left;
        }

        .navta-performance-section h3 {
          margin-bottom: 12px;
        }

        .navta-performance-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #243047;
          color: var(--nt-soft-text);
        }


        .navta-question-image-shell {
          width: 100%;
          margin: 0 0 24px;
          padding: 14px;
          border: 1px solid var(--nt-border);
          border-radius: 18px;
          background: #ffffff;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .navta-question-image {
          display: block;
          width: auto;
          max-width: 100%;
          height: auto;
          max-height: 72vh;
          object-fit: contain;
          object-position: center;
          border-radius: 10px;
        }

        html.dark .navta-question-image-shell {
          background: #ffffff;
          border-color: rgba(148, 163, 184, 0.35);
        }

        .navta-image-answer-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 8px;
        }

        .navta-image-answer-grid .navta-option {
          min-height: 58px;
          justify-content: center;
          text-align: center;
          padding: 12px;
        }

        .navta-image-answer-grid .navta-option-content {
          display: none;
        }

        .navta-status-pill {
          display: inline-block;
          margin-bottom: 12px;
          padding: 7px 12px;
          border-radius: 999px;
          background: var(--nt-surface);
          color: var(--nt-soft-text);
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .navta-actions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 26px;
        }

        .navta-speed-card {
          margin-top: 30px;
          padding: 22px;
          border-radius: 18px;
          border: 1px solid var(--nt-border);
          background: var(--nt-surface);
          text-align: left;
        }

        .navta-speed-card h3 {
          margin: 0 0 6px;
        }

        .navta-speed-subtitle {
          margin: 0 0 18px;
          color: var(--nt-muted);
          line-height: 1.5;
        }

        .navta-speed-overview {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .navta-speed-stat {
          padding: 16px;
          border-radius: 14px;
          border: 1px solid var(--nt-border);
          background: var(--nt-card-bg);
        }

        .navta-speed-stat span {
          display: block;
          color: var(--nt-muted);
          font-size: 12px;
          margin-bottom: 6px;
        }

        .navta-speed-stat strong {
          font-size: 20px;
          color: var(--nt-text);
        }

        .navta-speed-table {
          display: grid;
          gap: 8px;
        }

        .navta-speed-row {
          display: grid;
          grid-template-columns: 54px minmax(0, 1.6fr) 100px 90px 100px;
          gap: 10px;
          align-items: center;
          padding: 11px 12px;
          border-radius: 12px;
          border: 1px solid var(--nt-border);
          background: var(--nt-card-bg);
          font-size: 13px;
        }

        .navta-speed-row.header {
          background: var(--nt-surface-2);
          color: var(--nt-muted);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .navta-speed-good {
          color: var(--nt-success-text);
          font-weight: 800;
        }

        .navta-speed-slow {
          color: var(--nt-danger-text);
          font-weight: 800;
        }

        .navta-revenge-panel {
          margin-top: 24px;
          padding: 22px;
          border-radius: 18px;
          border: 1px solid rgba(239, 68, 68, 0.35);
          background:
            radial-gradient(circle at top right, rgba(239, 68, 68, 0.08), transparent 45%),
            var(--nt-surface);
          text-align: left;
        }

        .navta-revenge-panel h3 {
          margin: 0 0 8px;
          color: var(--nt-danger-text);
        }

        .navta-revenge-panel p {
          margin: 0 0 18px;
          color: var(--nt-soft-text);
          line-height: 1.6;
        }

        .navta-revenge-panel small {
          display: block;
          margin-top: 14px;
          color: var(--nt-muted);
          line-height: 1.5;
        }

        .navta-revenge-focus-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .navta-revenge-focus-grid > div {
          display: grid;
          gap: 8px;
          padding: 14px;
          border-radius: 12px;
          border: 1px solid var(--nt-border);
          background: var(--nt-card-bg);
        }

        .navta-revenge-focus-grid span {
          color: var(--nt-soft-text);
          font-size: 13px;
          line-height: 1.4;
        }

        .navta-revenge-comparison {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin: 20px 0;
        }

        .navta-revenge-comparison > div {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid var(--nt-border);
          background: var(--nt-surface);
        }

        .navta-revenge-comparison span {
          display: block;
          color: var(--nt-muted);
          font-size: 11px;
          margin-bottom: 6px;
        }

        .navta-revenge-comparison strong {
          color: var(--nt-text);
          font-size: 18px;
        }

        /* ===================================================
   NAVTA UNIVERSAL QUESTION ALIGNMENT
   Physics • Chemistry • Maths • Biology
=================================================== */

.navta-math-inline {
  display: inline;
  max-width: 100%;
  vertical-align: baseline;
}

.navta-math-inline .katex {
  display: inline;
  white-space: normal;
}

.navta-math-inline .katex-html {
  white-space: nowrap;
}

.navta-question .navta-math-inline,
.navta-option-content .navta-math-inline,
.navta-answer-feedback .navta-math-inline,
.navta-written-feedback .navta-math-inline {
  display: inline;
}

.navta-question .katex-display,
.navta-option-content .katex-display {
  margin: 0;
}

        /* ===================================================
   NAVTA QUESTION ALIGNMENT
=================================================== */

.navta-question-card {
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 32px;
  border-radius: 18px;
  background: var(--nt-card-bg);
  border: 1px solid var(--nt-border);
  overflow: hidden;
}

.navta-question {
  width: 100%;
  margin: 0 0 28px;
  padding: 0;
  font-size: 22px;
  line-height: 1.65;
  text-align: left;
  color: var(--nt-text);
  overflow-wrap: anywhere;
  word-break: normal;
}

.navta-question > * {
  max-width: 100%;
}

/* ===================================================
   UNIVERSAL KATEX ALIGNMENT
=================================================== */

.navta-question .katex {
  font-size: 1em;
}

.navta-math-block {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 18px 0;
  padding: 10px 0;
  overflow-x: auto;
  overflow-y: hidden;
  text-align: left;
  -webkit-overflow-scrolling: touch;
}

.navta-math-block .katex-display {
  width: 100%;
  margin: 0;
  text-align: left;
}

.navta-math-block .katex-display > .katex {
  display: inline-block;
  text-align: left;
}

/* Matrix / determinant questions imported without $ delimiters */
.navta-matrix-display {
  margin: 14px 0 18px;
  padding: 10px 0;
  text-align: left;
}

.navta-matrix-display .katex-display {
  margin: 0;
  text-align: left;
}

.navta-matrix-display .katex {
  font-size: 1.08em;
}


/* ===================================================
   OPTIONS
=================================================== */

.navta-option {
  width: 100%;
  min-width: 0;
  min-height: 54px;
  padding: 15px 18px;
  margin-bottom: 12px;

  border-radius: 10px;
  border: 1px solid var(--nt-border-strong);

  background: var(--nt-surface);
  color: var(--nt-text);

  display: flex;
  align-items: center;
  justify-content: flex-start;

  gap: 14px;

  text-align: left;
  font-size: 16px;
  line-height: 1.55;

  cursor: pointer;

  overflow: hidden;
}

.navta-option-content {
  flex: 1;
  min-width: 0;
  width: 100%;

  display: inline;

  text-align: left;
  line-height: 1.6;

  overflow-wrap: anywhere;
  word-break: normal;
}

.navta-option-content .katex {
  font-size: 1em;
}

/* A / B / C / D */

.navta-option > span:first-child {
  flex: 0 0 26px;
  width: 26px;
  min-width: 26px;

  display: inline-flex;
  justify-content: center;
  align-items: center;

  font-weight: 800;
  line-height: 1.55;
}

/* ===================================================
   ANSWER FEEDBACK
=================================================== */

.navta-answer-feedback {
  width: 100%;
  max-width: 1000px;
  margin: 18px auto 0;

  text-align: left;
}

.navta-answer-feedback p {
  text-align: left;
  overflow-wrap: anywhere;
}

.navta-answer-feedback .katex {
  font-size: 1em;
}

/* Keep imported question text, equations and options inside the card. */
.navta-question,
.navta-option-content,
.navta-answer-feedback,
.navta-written-feedback {
  max-width: 100%;
  white-space: normal;
}

.navta-question img,
.navta-option-content img,
.navta-answer-feedback img,
.navta-written-feedback img {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  margin: 14px auto;
}

.navta-question .katex,
.navta-option-content .katex,
.navta-answer-feedback .katex,
.navta-written-feedback .katex {
  max-width: 100%;
}

/* Explicit block equations remain scrollable instead of breaking layout. */
.navta-math-block {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

/* Explicit block equations remain scrollable instead of breaking layout. */
        .navta-math-block {
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .navta-exact-matrix {
          width: 100%;
          margin: 18px 0 22px;
          padding: 12px 0;
          overflow-x: auto;
          overflow-y: hidden;
          text-align: left;
        }

        .navta-exact-matrix .katex-display {
          margin: 0;
          text-align: left;
        }

        .navta-exact-matrix .katex-display > .katex {
          display: inline-block;
          text-align: left;
          font-size: 1.18em;
        }

        .navta-exact-equation {
          width: 100%;
          margin: 10px 0;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .navta-exact-equation .katex-display {
          margin: 0;
          text-align: left;
        }

        .navta-question .katex {
          color: inherit;
        }

/* ===================================================
   MOBILE
=================================================== */

@media (max-width: 768px) {
  .navta-question-card {
    padding: 22px 18px;
  }

  .navta-question {
    font-size: 19px;
    line-height: 1.6;
    margin-bottom: 22px;
  }

  .navta-option {
    padding: 14px;
    gap: 11px;
    font-size: 15px;
  }

  .navta-math-block {
    margin: 14px 0;
    padding: 8px 0;
  }

  .navta-question .katex,
  .navta-option-content .katex {
    font-size: 0.96em;
  }
}

@media (max-width: 420px) {
  .navta-question-card {
    padding: 18px 14px;
  }

  .navta-question {
    font-size: 18px;
  }

  .navta-option {
    padding: 12px;
  }

  .navta-option > span:first-child {
    flex-basis: 22px;
    width: 22px;
    min-width: 22px;
  }
}

        @media (max-width: 768px) {
          .navta-test-page {
            padding: 20px 14px;
          }

          .navta-header,
          .navta-test-header {
            flex-direction: column;
            align-items: stretch;
          }

          .navta-title {
            font-size: 27px;
          }

          .navta-mode-grid,
          .navta-grid,
          .navta-preparation-grid,
          .navta-difficulty-grid,
          .navta-question-type-grid,
          .navta-boss-grid,
          .navta-class-grid,
          .navta-chapter-grid {
            grid-template-columns: 1fr;
          }

          .navta-duration-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .navta-summary-grid,
          .navta-mix-grid {
            grid-template-columns: 1fr;
          }

          .navta-revenge-focus-grid,
          .navta-revenge-comparison {
            grid-template-columns: 1fr;
          }

          .navta-question-image-shell {
            padding: 8px;
            margin-bottom: 18px;
            border-radius: 14px;
          }

          .navta-question-image {
            max-height: 62vh;
            border-radius: 8px;
          }

          .navta-image-answer-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .navta-question-card {
            padding: 20px 15px;
          }

          .navta-question {
            font-size: 19px;
          }

          .navta-option {
            padding: 14px;
            font-size: 14px;
          }

          .navta-navigation {
            flex-direction: column;
            align-items: stretch;
          }

          .navta-navigation button {
            width: 100%;
          }

          .navta-result-card {
            margin: 30px auto;
            padding: 28px 16px;
          }

          .navta-result-score {
            font-size: 46px;
          }

          .navta-rank {
            font-size: 56px;
          }

          .navta-speed-overview {
            grid-template-columns: 1fr;
          }

          .navta-speed-row {
            grid-template-columns: 42px 1fr 74px;
          }

          .navta-speed-row .speed-hide-mobile {
            display: none;
          }
        }

        @media (max-width: 420px) {
          .navta-test-page {
            padding: 16px 10px;
          }

          .navta-title {
            font-size: 24px;
          }

          .navta-duration-grid {
            grid-template-columns: 1fr;
          }
        }
      
        /* =====================================================
           NAVTA TEST PERFORMANCE
        ===================================================== */

        .navta-test-page {
          min-width: 0;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .navta-question-card,
        .navta-result-card,
        .navta-performance-section,
        .navta-revenge-panel,
        .navta-revenge-comparison {
          contain: layout paint;
        }

        .navta-performance-section,
        .navta-revenge-panel,
        .navta-revenge-comparison {
          content-visibility: auto;
          contain-intrinsic-size: 1px 420px;
        }

        .navta-options,
        .navta-navigation {
          touch-action: pan-y;
        }

        @media (max-width: 768px) {
          .navta-test-page * {
            -webkit-tap-highlight-color: transparent;
          }

          .navta-question-card,
          .navta-result-card,
          .navta-performance-section,
          .navta-revenge-panel,
          .navta-revenge-comparison {
            box-shadow: none;
          }
        }

      `}</style>

      {step === "mode" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">Navta TEST</h1>
              <p className="navta-subtitle">
                Choose how you want to practise.
              </p>
            </div>

            <Link to="/dashboard" style={styles.backButton}>
              ← Dashboard
            </Link>
          </div>

          <div className="navta-mode-grid">
            <button
              type="button"
              className="navta-mode-card standard"
              onClick={() => chooseMode("standard")}
            >
              <div className="navta-mode-icon">📝</div>
              <h2>Standard Test</h2>
              <p>
                Focus on one chapter with your own difficulty,
                question type and duration.
              </p>

              <div className="navta-mode-features">
                <span>✓ Single chapter practice</span>
                <span>✓ Easy / Medium / Hard</span>
                <span>✓ Custom duration</span>
                <span>✓ Boards written-answer support</span>
              </div>

              <span className="navta-continue">
                Start Standard Test →
              </span>
            </button>

            <button
              type="button"
              className="navta-mode-card boss"
              onClick={() => chooseMode("boss")}
            >
              <div className="navta-mode-icon">⚔</div>
              <h2>Boss Battle</h2>
              <p>
                Fight a mixed-difficulty test across multiple chapters.
                Score 70% or higher to defeat the Boss. Score below 70%
                and you unlock a targeted Revenge Battle.
              </p>

              <div className="navta-mode-features">
                <span>⚔ Multiple chapters</span>
                <span>⚡ Automatic Easy / Medium / Hard mix</span>
                <span>👑 15 / 30 / 50 question battles</span>
                <span>🏆 Score 70%+ to defeat the Boss</span>
                <span>🔥 Below 70% unlocks Revenge Battle</span>
              </div>

              <span className="navta-continue navta-boss-continue">
                Enter Boss Battle →
              </span>
            </button>
          </div>
        </div>
      )}

      {step === "subject" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">
                {isBoss ? (isRevenge ? `🔥 Revenge Battle #${revengeAttempt}` : "⚔ Boss Battle") : "Navta TEST"}
              </h1>
              <p className="navta-subtitle">
                Choose a subject to begin your{" "}
                {isBoss ? "battle" : "test"}.
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={() => {
                resetTest();
              }}
            >
              ← Test Mode
            </button>
          </div>

          <div className="navta-grid">
            {Object.keys(PREPARATION_OPTIONS).map((item) => (
              <button
                key={item}
                type="button"
                className="navta-card"
                onClick={() => {
                  setSubject(item);
                  resetAfterSubject();
                  setStep("preparation");
                }}
              >
                <div className="navta-card-icon">
                  {item === "Physics" && "⚡"}
                  {item === "Chemistry" && "🧪"}
                  {item === "Maths" && "∑"}
                  {item === "Biology" && "🧬"}
                </div>

                <h2>{item}</h2>
                <p>Class 11 and Class 12 chapter-wise tests</p>
                <span className="navta-continue">
                  Continue →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "preparation" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">
                {subject} Preparation
              </h1>
              <p className="navta-subtitle">
                What are you preparing for?
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={() => {
                setSubject("");
                resetAfterSubject();
                setStep("subject");
              }}
            >
              ← Subjects
            </button>
          </div>

          <div className="navta-preparation-grid">
            {Object.entries(
              PREPARATION_OPTIONS[subject] || {}
            ).map(([key, option]) => (
              <button
                key={key}
                type="button"
                className="navta-card"
                onClick={() => {
                  setPreparation(key);
                  resetAfterPreparation();
                  setStep("class");
                }}
              >
                <div className="navta-card-icon">
                  {option.icon}
                </div>
                <h2>{option.title}</h2>
                <p>{option.description}</p>
                <span className="navta-continue">
                  Continue →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "class" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">Choose Class</h1>
              <p className="navta-subtitle">
                {subject} → {preparation}
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={goBackFromClass}
            >
              ← Preparation
            </button>
          </div>

          <div className="navta-class-grid">
            {CLASSES.map((item) => (
              <button
                key={item}
                type="button"
                className="navta-card"
                onClick={() => {
                  setClassLevel(item);
                  resetAfterClass();
                  setStep(isBoss ? "bossChapters" : "chapter");
                }}
              >
                <div className="navta-card-icon">🎓</div>
                <h2>{item}</h2>
                <p>
                  {(CHAPTERS[subject]?.[item] || []).length} chapters
                </p>
                <span className="navta-continue">
                  {isBoss ? "Select Chapters →" : "View Chapters →"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "chapter" && !isBoss && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">{subject}</h1>
              <p className="navta-subtitle">
                {preparation} → {classLevel}
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={goBackFromChapter}
            >
              ← Class
            </button>
          </div>

          <div className="navta-chapter-grid">
            {(CHAPTERS[subject]?.[classLevel] || []).map((item) => (
              <button
                key={item}
                type="button"
                className="navta-chapter-card"
                onClick={() => {
                  setChapter(item);
                  setDifficulty("");
                  setQuestionType("mcq");
                  setSelectedDuration(null);
                  setGenerationError("");
                  setStep("difficulty");
                }}
              >
                <span>{item}</span>
                <span>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "bossChapters" && isBoss && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">
                ⚔ Select Battle Chapters
              </h1>
              <p className="navta-subtitle">
                {subject} → {preparation} → {classLevel}
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={() => {
                setSelectedChapters([]);
                setGenerationError("");
                setStep("class");
              }}
            >
              ← Class
            </button>
          </div>

          <div className="navta-selection-count">
            {selectedChapters.length} chapter
            {selectedChapters.length !== 1 ? "s" : ""} selected
            {" • "}Choose at least 2.
          </div>

          <div className="navta-chapter-grid">
            {(CHAPTERS[subject]?.[classLevel] || []).map((item) => {
              const selected = selectedChapters.includes(item);

              return (
                <button
                  key={item}
                  type="button"
                  className={`navta-chapter-card${
                    selected ? " selected" : ""
                  }`}
                  onClick={() => toggleBossChapter(item)}
                >
                  <span>{item}</span>
                  <span className="navta-check">
                    {selected ? "✓" : "✓"}
                  </span>
                </button>
              );
            })}
          </div>

          {generationError && (
            <div className="navta-error">
              {generationError}
            </div>
          )}

          <button
            type="button"
            disabled={selectedChapters.length < 2}
            style={{
              ...styles.bossButton,
              opacity: selectedChapters.length >= 2 ? 1 : 0.5,
            }}
            onClick={() => {
              if (selectedChapters.length < 2) {
                setGenerationError(
                  "Select at least 2 chapters for Boss Battle."
                );
                return;
              }

              setGenerationError("");
              setStep("bossSize");
            }}
          >
            Choose Boss Size →
          </button>
        </div>
      )}

      {step === "bossSize" && isBoss && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">
                Choose Your Boss
              </h1>
              <p className="navta-subtitle">
                {selectedChapters.length} chapters selected
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={() => {
                setGenerationError("");
                setStep("bossChapters");
              }}
            >
              ← Chapters
            </button>
          </div>

          <div className="navta-rule-banner navta-boss-banner">
            ⚔ Boss Battle is MCQ-only. Questions are mixed automatically
            across Easy, Medium and Hard. Score 70% or higher to defeat
            the Boss. Below 70% unlocks a targeted 🔥 Revenge Battle.
          </div>

          <div className="navta-boss-grid">
            {Object.entries(BOSS_SIZES).map(([size, info]) => {
              const numericSize = Number(size);

              return (
                <button
                  key={size}
                  type="button"
                  className={`navta-duration-card navta-boss-card${
                    bossSize === numericSize ? " active" : ""
                  }`}
                  onClick={() => {
                    setBossSize(numericSize);
                    setGenerationError("");
                  }}
                >
                  <span style={{ fontSize: "32px" }}>
                    {info.icon}
                  </span>
                  <span className="navta-duration-time">
                    {info.name}
                  </span>
                  <span className="navta-duration-questions">
                    {numericSize} Questions
                  </span>
                  <span className="navta-duration-questions">
                    {info.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="navta-summary-card boss">
            <h2 style={{ marginTop: 0 }}>
              Automatic Difficulty Mix
            </h2>

            <div className="navta-mix-grid">
              {Object.entries(
                BOSS_SIZES[bossSize].targets
              ).map(([level, count]) => (
                <div
                  key={level}
                  className="navta-mix-item"
                >
                  <span>
                    {level === "Easy"
                      ? "🌱"
                      : level === "Medium"
                        ? "⚡"
                        : "🔥"}{" "}
                    {level}
                  </span>
                  <strong>{count}</strong>
                  <span style={{ color: "var(--nt-muted)", fontSize: "12px" }}>
                    target questions
                  </span>
                </div>
              ))}
            </div>

            <div className="navta-summary-grid">
              <SummaryItem
                label="Chapters"
                value={`${selectedChapters.length} selected`}
              />
              <SummaryItem
                label="Questions"
                value={`${bossSize} Questions`}
              />
              <SummaryItem
                label="Time per Question"
                value={`${preparation === "JEE" ? 2 : 1} minute${
                  preparation === "JEE" ? "s" : ""
                }`}
              />
              <SummaryItem
                label="Estimated Duration"
                value={`${
                  bossSize * (preparation === "JEE" ? 2 : 1)
                } Minutes`}
              />
              <SummaryItem
                label="Victory Requirement"
                value="70% or higher"
              />
              <SummaryItem
                label="If You Score Below 70%"
                value="🔥 Revenge Battle unlocks"
              />
            </div>
          </div>

          <button
            type="button"
            style={styles.bossButton}
            onClick={() => setStep("bossSummary")}
          >
            Review Boss Battle →
          </button>
        </div>
      )}

      {step === "bossSummary" && isBoss && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">
                ⚔ Boss Battle Summary
              </h1>
              <p className="navta-subtitle">
                Check your battle setup before starting.
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={() => {
                setGenerationError("");
                setStep("bossSize");
              }}
            >
              ← Boss Size
            </button>
          </div>

          <div className="navta-summary-card boss">
            <h2 style={{ marginTop: 0 }}>
              {BOSS_SIZES[bossSize].icon}{" "}
              {BOSS_SIZES[bossSize].name}
            </h2>

            <div className="navta-summary-grid">
              <SummaryItem label="Subject" value={subject} />
              <SummaryItem
                label="Preparation"
                value={preparation}
              />
              <SummaryItem label="Class" value={classLevel} />
              <SummaryItem
                label="Question Type"
                value="MCQ / Option"
              />
              <SummaryItem
                label="Questions"
                value={`${bossSize} Questions`}
              />
              <SummaryItem
                label="Duration"
                value={`${
                  bossSize * (preparation === "JEE" ? 2 : 1)
                } Minutes`}
              />
            </div>

            <div style={{ marginTop: "20px" }}>
              <span className="navta-summary-label">
                Selected Chapters
              </span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                {selectedChapters.map((item) => (
                  <span key={item} className="navta-tag boss">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {generationError && (
            <div className="navta-error">
              {generationError}
            </div>
          )}

          <button
            type="button"
            disabled={generatingTest}
            style={{
              ...styles.bossButton,
              opacity: generatingTest ? 0.65 : 1,
            }}
            onClick={startBossBattle}
          >
            {generatingTest
              ? "Preparing Boss Battle..."
              : "⚔ Start Boss Battle"}
          </button>
        </div>
      )}

      {step === "difficulty" && !isBoss && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">
                Select Difficulty
              </h1>
              <p className="navta-subtitle">
                {subject} → {classLevel} → {chapter}
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={goBackFromDifficulty}
            >
              ← Chapters
            </button>
          </div>

          <div className="navta-difficulty-grid">
            {Object.entries(DIFFICULTY_INFO).map(
              ([level, info]) => (
                <button
                  key={level}
                  type="button"
                  className={`navta-card${
                    difficulty === level ? " active" : ""
                  }`}
                  onClick={() => {
                    setDifficulty(level);
                    setSelectedDuration(null);
                    setGenerationError("");
                  }}
                >
                  <div className="navta-card-icon">
                    {info.icon}
                  </div>
                  <h2>{level}</h2>
                  <p>{info.description}</p>
                </button>
              )
            )}
          </div>

          {difficulty && (
            <button
              type="button"
              style={styles.startButton}
              onClick={() => {
                if (preparation === "Boards") {
                  setStep("questionType");
                } else {
                  setQuestionType("mcq");
                  setStep("duration");
                }
              }}
            >
              {preparation === "Boards"
                ? "Choose Question Type →"
                : "Choose Test Duration →"}
            </button>
          )}
        </div>
      )}

      {step === "questionType" &&
        !isBoss &&
        preparation === "Boards" && (
          <div className="navta-test-page">
            <div className="navta-header">
              <div>
                <h1 className="navta-title">
                  Choose Question Type
                </h1>
                <p className="navta-subtitle">
                  {subject} → {classLevel} → {chapter} →{" "}
                  {difficulty}
                </p>
              </div>

              <button
                type="button"
                style={styles.backButton}
                onClick={goBackFromQuestionType}
              >
                ← Difficulty
              </button>
            </div>

            <div className="navta-question-type-grid">
              {Object.entries(QUESTION_TYPE_INFO).map(
                ([type, info]) => (
                  <button
                    key={type}
                    type="button"
                    className={`navta-card${
                      questionType === type ? " active" : ""
                    }`}
                    onClick={() => {
                      setQuestionType(type);
                      setSelectedDuration(null);
                      setGenerationError("");
                    }}
                  >
                    <div className="navta-card-icon">
                      {info.icon}
                    </div>
                    <h2>{info.title}</h2>
                    <p>{info.description}</p>
                    <span className="navta-continue">
                      {info.minutesPerQuestion} minute
                      {info.minutesPerQuestion !== 1 ? "s" : ""} / question
                    </span>
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              style={styles.startButton}
              onClick={() => setStep("duration")}
            >
              Choose Test Duration →
            </button>
          </div>
        )}

      {step === "duration" &&
        !isBoss &&
        currentConfig && (
          <div className="navta-test-page">
            <div className="navta-header">
              <div>
                <h1 className="navta-title">
                  Select Test Duration
                </h1>
                <p className="navta-subtitle">
                  {subject} → {preparation} → {classLevel} →{" "}
                  {chapter}
                </p>
              </div>

              <button
                type="button"
                style={styles.backButton}
                onClick={goBackFromDuration}
              >
                ← Back
              </button>
            </div>

            <div className="navta-rule-banner">
              {preparation === "NEET" &&
                "NEET Mode • 1 minute allocated per MCQ"}

              {preparation === "JEE" &&
                "JEE Mode • 2 minutes allocated per MCQ"}

              {preparation === "Boards" &&
                `Boards • ${getQuestionTypeLabel(
                  resolvedQuestionType
                )} • ${minutesPerQuestion} minute${
                  minutesPerQuestion !== 1 ? "s" : ""
                } per question`}
            </div>

            <div className="navta-duration-grid">
              {currentConfig.durations.map((duration) => {
                const count = getQuestionCount(
                  preparation,
                  resolvedQuestionType,
                  duration
                );

                return (
                  <button
                    key={duration}
                    type="button"
                    className={`navta-duration-card${
                      selectedDuration === duration ? " active" : ""
                    }`}
                    onClick={() => {
                      setSelectedDuration(duration);
                      setGenerationError("");
                    }}
                  >
                    <span className="navta-duration-time">
                      ⏱ {duration} Minutes
                    </span>
                    <span className="navta-duration-questions">
                      {count} Questions
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!selectedDuration}
              style={{
                ...styles.startButton,
                opacity: selectedDuration ? 1 : 0.5,
              }}
              onClick={() => setStep("summary")}
            >
              Review Test →
            </button>
          </div>
        )}

      {step === "summary" &&
        !isBoss &&
        selectedDuration && (
          <div className="navta-test-page">
            <div className="navta-header">
              <div>
                <h1 className="navta-title">
                  Test Summary
                </h1>
                <p className="navta-subtitle">
                  Check your setup before starting.
                </p>
              </div>

              <button
                type="button"
                style={styles.backButton}
                onClick={() => setStep("duration")}
              >
                ← Duration
              </button>
            </div>

            <div className="navta-summary-card">
              <h2 style={{ marginTop: 0 }}>
                Navta TEST
              </h2>

              <div className="navta-summary-grid">
                <SummaryItem label="Subject" value={subject} />
                <SummaryItem
                  label="Preparation"
                  value={preparation}
                />
                <SummaryItem label="Class" value={classLevel} />
                <SummaryItem label="Chapter" value={chapter} />
                <SummaryItem
                  label="Difficulty"
                  value={difficulty}
                />
                <SummaryItem
                  label="Question Type"
                  value={getQuestionTypeLabel(
                    resolvedQuestionType
                  )}
                />
                <SummaryItem
                  label="Duration"
                  value={`${selectedDuration} Minutes`}
                />
                <SummaryItem
                  label="Questions"
                  value={`${requestedQuestionCount} Questions`}
                />
                <SummaryItem
                  label="Time Allocation"
                  value={`${minutesPerQuestion} minute${
                    minutesPerQuestion !== 1 ? "s" : ""
                  } / question`}
                />
              </div>
            </div>

            {generationError && (
              <div className="navta-error">
                {generationError}
              </div>
            )}

            <button
              type="button"
              disabled={generatingTest}
              style={{
                ...styles.startButton,
                opacity: generatingTest ? 0.65 : 1,
              }}
              onClick={startStandardTest}
            >
              {generatingTest
                ? "Generating Test..."
                : "Start Navta TEST →"}
            </button>
          </div>
        )}

      {step === "test" &&
        !submitted &&
        currentTestQuestion && (
          <div className="navta-test-page">
            <div className="navta-test-header">
              <div>
                <h1 className="navta-title">
                  {isBoss ? (isRevenge ? `🔥 Revenge Battle #${revengeAttempt}` : "⚔ Boss Battle") : "Navta TEST"}
                </h1>

                <p className="navta-subtitle">
                  {subject} → {classLevel}
                  {!isBoss && ` → ${chapter} → ${difficulty}`}
                </p>
              </div>

              <div
                style={{
                  ...styles.timer,
                  ...(timeLeft <= 60
                    ? styles.dangerTimer
                    : {}),
                }}
              >
                ⏱ {formattedTime}
              </div>
            </div>

            {isBoss && (
              <div className="navta-boss-question-meta">
                <span className="navta-tag boss">
                  {isRevenge
                    ? `🔥 Revenge #${revengeAttempt}`
                    : BOSS_SIZES[bossSize]?.name || "Boss Battle"}
                </span>
                <span className="navta-tag">
                  {currentTestQuestion.chapter || "Mixed Chapter"}
                </span>
                <span className="navta-tag">
                  {currentTestQuestion.difficulty || "Mixed"}
                </span>
              </div>
            )}

            <div style={styles.progress}>
              Question {currentQuestion + 1} of {questions.length}
              {" • "}
              {getQuestionTypeLabel(resolvedQuestionType)}
              {shouldUseNavtaQuestionScreenshot(
                currentTestQuestion
              )
                ? " • Original Question Image"
                : ""}
            </div>

            {resolvedQuestionType === "mcq" && (
              <>
                <div className="navta-question-card">
                  <NavtaQuestionBody
                    question={currentTestQuestion}
                  />

                  <div
                    className={
                      shouldUseNavtaQuestionScreenshot(
                        currentTestQuestion
                      )
                        ? "navta-image-answer-grid"
                        : ""
                    }
                  >
                    {(currentTestQuestion.options || []).map(
                      (option, index) => {
                        const feedback =
                          answerFeedback[currentQuestion];

                        const correctAnswer =
                          getCorrectAnswerIndex(
                            currentTestQuestion
                          );

                        const isSelected =
                          answers[currentQuestion] === index;

                        const showWrongSelected =
                          feedback &&
                          !feedback.isCorrect &&
                          isSelected;

                        const showCorrectAnswer =
                          feedback &&
                          !feedback.isCorrect &&
                          index === correctAnswer;

                        return (
                          <button
                            key={`${currentQuestion}-${index}`}
                            type="button"
                            disabled={Boolean(feedback)}
                            className="navta-option"
                            onClick={() => selectAnswer(index)}
                            style={{
                              ...(isSelected && !feedback
                                ? styles.selectedOption
                                : {}),
                              ...(showWrongSelected
                                ? styles.wrongOption
                                : {}),
                              ...(showCorrectAnswer
                                ? styles.correctOption
                                : {}),
                            }}
                          >
                            <span style={styles.optionLetter}>
                              {String.fromCharCode(65 + index)}
                            </span>

                            {!shouldUseNavtaQuestionScreenshot(
                              currentTestQuestion
                            ) && (
                              <span className="navta-option-content">
                                {renderNavtaContent(option)}
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {answerFeedback[currentQuestion] &&
                  !answerFeedback[currentQuestion].isCorrect && (
                    <div className="navta-answer-feedback wrong">
                      <h3
                        style={{
                          marginTop: 0,
                          color: "var(--nt-danger-text)",
                        }}
                      >
                        ✕ Incorrect
                      </h3>

                      <div
                        style={{
                          color: "var(--nt-success-text)",
                          fontWeight: 700,
                        }}
                      >
                        Correct Answer:{" "}
                        {String.fromCharCode(
                          65 +
                            answerFeedback[currentQuestion]
                              .correctAnswer
                        )}
                        {!shouldUseNavtaQuestionScreenshot(
                          currentTestQuestion
                        ) && (
                          <>
                            .{" "}
                            {renderNavtaContent(
                              currentTestQuestion.options[
                                answerFeedback[currentQuestion]
                                  .correctAnswer
                              ]
                            )}
                          </>
                        )}
                      </div>

                      <div
                        style={{
                          color: "var(--nt-soft-text)",
                          lineHeight: 1.65,
                        }}
                      >
                        <strong>
                          Explanation:{" "}
                        </strong>

                        {renderNavtaContent(
                          currentTestQuestion.explanation ||
                            "Explanation is not available for this question yet."
                        )}
                      </div>

                      <div className="navta-mistake-box">
                        <h4>📕 Add to Mistake Notebook</h4>

                        <p>
                          Save this incorrect question for revision. You can
                          also write a personal note about what confused you.
                        </p>

                        <textarea
                          className="navta-mistake-note"
                          maxLength={2000}
                          value={mistakeNotes[currentQuestion] || ""}
                          onChange={(event) => {
                            const value = event.target.value;

                            setMistakeNotes((previous) => ({
                              ...previous,
                              [currentQuestion]: value,
                            }));

                            if (
                              mistakeSaveState[currentQuestion] === "saved"
                            ) {
                              setMistakeSaveState((previous) => ({
                                ...previous,
                                [currentQuestion]: "changed",
                              }));

                              setMistakeSaveMessage((previous) => ({
                                ...previous,
                                [currentQuestion]:
                                  "Note changed — save again to update your notebook.",
                              }));
                            }
                          }}
                          placeholder="Optional note: Why did I get this wrong? What should I remember next time?"
                        />

                        <div className="navta-mistake-actions">
                          <button
                            type="button"
                            className="navta-mistake-button"
                            disabled={
                              mistakeSaveState[currentQuestion] === "saving"
                            }
                            onClick={() =>
                              saveMistakeToNotebook(currentQuestion)
                            }
                          >
                            {mistakeSaveState[currentQuestion] === "saving"
                              ? "Saving..."
                              : mistakeSaveState[currentQuestion] === "saved"
                                ? "✓ Saved to Notebook"
                                : mistakeSaveState[currentQuestion] ===
                                    "changed"
                                  ? "Update Notebook"
                                  : "📕 Save to Mistake Notebook"}
                          </button>

                          <span
                            className={`navta-mistake-message ${
                              mistakeSaveState[currentQuestion] === "saved"
                                ? "saved"
                                : mistakeSaveState[currentQuestion] === "error"
                                  ? "error"
                                  : ""
                            }`}
                          >
                            {mistakeSaveMessage[currentQuestion] || ""}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          ...styles.nextButton,
                          marginTop: 16,
                        }}
                        onClick={goForwardAfterAnswer}
                      >
                        {currentQuestion <
                        questions.length - 1
                          ? "Next Question →"
                          : isBoss
                            ? "Finish Battle"
                            : "Finish Test"}
                      </button>
                    </div>
                  )}

                <div className="navta-navigation">
                  <span style={{ color: "#94a3b8" }}>
                    {answerFeedback[currentQuestion]
                      ? answerFeedback[currentQuestion]
                          .isCorrect
                        ? "✓ Correct — moving to next question..."
                        : "Review the explanation, then continue."
                      : "Select one answer"}
                  </span>
                </div>
              </>
            )}

            {resolvedQuestionType !== "mcq" && (
              <>
                <div className="navta-question-card">
                  <span className="navta-status-pill">
                    {resolvedQuestionType === "short"
                      ? "Short Answer"
                      : "Long Answer"}
                  </span>

                  <NavtaQuestionBody
                    question={currentTestQuestion}
                  />

                  <p
                    style={{
                      color: "var(--nt-muted)",
                      marginTop: "-15px",
                      marginBottom: "18px",
                    }}
                  >
                    Maximum Marks:{" "}
                    {currentTestQuestion.maxMarks || "-"}
                  </p>

                  <textarea
                    className="navta-written-answer"
                    placeholder={
                      resolvedQuestionType === "short"
                        ? "Write your short answer here..."
                        : "Write your detailed answer here..."
                    }
                    value={
                      writtenAnswers[currentQuestion] || ""
                    }
                    disabled={Boolean(
                      writtenFeedback[currentQuestion]
                    )}
                    onChange={(e) => {
                      setWrittenAnswers((previous) => ({
                        ...previous,
                        [currentQuestion]: e.target.value,
                      }));
                      setEvaluationError("");
                    }}
                  />

                  {!writtenFeedback[currentQuestion] && (
                    <button
                      type="button"
                      disabled={evaluatingAnswer}
                      style={{
                        ...styles.startButton,
                        margin: "20px 0 0",
                        opacity: evaluatingAnswer ? 0.65 : 1,
                      }}
                      onClick={evaluateWrittenAnswer}
                    >
                      {evaluatingAnswer
                        ? "AI is checking your answer..."
                        : "Submit Answer for AI Check"}
                    </button>
                  )}
                </div>

                {evaluationError && (
                  <div className="navta-error">
                    {evaluationError}
                  </div>
                )}

                {writtenFeedback[currentQuestion] && (
                  <WrittenFeedback
                    feedback={
                      writtenFeedback[currentQuestion]
                    }
                    onNext={goForwardAfterAnswer}
                    isLast={
                      currentQuestion ===
                      questions.length - 1
                    }
                  />
                )}
              </>
            )}
          </div>
        )}

      {step === "test" && submitted && (
        <div className="navta-test-page">
          {isBoss ? (
            <div className="navta-result-card boss">
              <div style={{ fontSize: "48px" }}>
                {bossWon ? (isRevenge ? "👑" : bossRank.icon) : "💀"}
              </div>

              <h1>
                {bossWon
                  ? isRevenge
                    ? "Revenge Complete!"
                    : "Boss Defeated!"
                  : isRevenge
                    ? "The Boss Survived!"
                    : "The Boss Defeated You"}
              </h1>

              <p style={{ color: "var(--nt-muted)" }}>
                {subject} → {preparation} → {classLevel}
              </p>

              <div className="navta-rank">
                {bossWon ? bossRank.rank : "LOST"}
              </div>

              <div
                style={{
                  color: bossWon
                    ? "var(--nt-success-text)"
                    : "var(--nt-danger-text)",
                  fontWeight: 800,
                  marginTop: "-12px",
                }}
              >
                {bossWon
                  ? isRevenge
                    ? "Vengeance Complete — Boss Defeated"
                    : bossRank.label
                  : "You need 70% to defeat the Boss"}
              </div>

              <div className="navta-result-score">
                {mcqScore}/{questions.length}
              </div>

              <p style={{ color: "var(--nt-muted)" }}>
                {bossPercentage}% accuracy
              </p>

              <div
                className={`navta-reward-result ${
                  resultSaveStatus === "saved"
                    ? "saved"
                    : resultSaveStatus === "error"
                      ? "error"
                      : ""
                }`}
              >
                <strong>
                  {resultSaveStatus === "saving"
                    ? "Saving performance..."
                    : resultSaveStatus === "saved"
                      ? "NAVTA Performance Saved"
                      : resultSaveStatus === "error"
                        ? "Performance Save Needs Retry"
                        : "Finalising performance..."}
                </strong>

                <p>
                  {resultSaveStatus === "saving"
                    ? "Your daily performance and coin reward are being updated."
                    : resultSaveMessage ||
                      "Your result will be added to your daily Performance Overview."}
                </p>

                {resultSaveStatus === "saved" && (
                  <>
                    <div className="navta-reward-coins">
                      🪙 +{coinsAwarded}{" "}
                      {coinsAwarded === 1 ? "coin" : "coins"}
                    </div>

                    {updatedCoinBalance !== null && (
                      <div className="navta-reward-balance">
                        Coin Balance: {updatedCoinBalance}
                      </div>
                    )}
                  </>
                )}

                {resultSaveStatus === "error" && (
                  <button
                    type="button"
                    className="navta-retry-save"
                    onClick={saveCompletedNavtaResult}
                  >
                    Retry Saving Result
                  </button>
                )}
              </div>

              {isRevenge && (
                <div className="navta-revenge-comparison">
                  <div>
                    <span>Original Boss</span>
                    <strong>{originalBossPercentage ?? 0}%</strong>
                  </div>
                  <div>
                    <span>Previous Battle</span>
                    <strong>{previousBattlePercentage ?? 0}%</strong>
                  </div>
                  <div>
                    <span>Current Revenge</span>
                    <strong>{bossPercentage}%</strong>
                  </div>
                  <div>
                    <span>Improvement</span>
                    <strong>
                      {bossPercentage - Number(originalBossPercentage || 0) >= 0
                        ? "+"
                        : ""}
                      {bossPercentage - Number(originalBossPercentage || 0)}%
                    </strong>
                  </div>
                </div>
              )}

              {!bossWon && (
                <div className="navta-revenge-panel">
                  <h3>🔥 Revenge Available</h3>
                  <p>
                    NAVTA will build your next battle around the chapters
                    and difficulty levels where you struggled most. It will
                    avoid repeating questions whenever enough unused questions
                    are available.
                  </p>

                  <div className="navta-revenge-focus-grid">
                    <div>
                      <strong>Weak Chapters</strong>
                      {Object.entries(chapterPerformance)
                        .map(([name, result]) => ({
                          name,
                          percentage:
                            result.total > 0
                              ? Math.round((result.correct / result.total) * 100)
                              : 0,
                        }))
                        .sort((a, b) => a.percentage - b.percentage)
                        .slice(0, 3)
                        .map((item) => (
                          <span key={item.name}>
                            {item.name} • {item.percentage}%
                          </span>
                        ))}
                    </div>

                    <div>
                      <strong>Weak Difficulty</strong>
                      {Object.entries(difficultyPerformance)
                        .map(([name, result]) => ({
                          name,
                          percentage:
                            result.total > 0
                              ? Math.round((result.correct / result.total) * 100)
                              : 0,
                        }))
                        .sort((a, b) => a.percentage - b.percentage)
                        .map((item) => (
                          <span key={item.name}>
                            {item.name} • {item.percentage}%
                          </span>
                        ))}
                    </div>
                  </div>

                  {revengeMeta?.repeatedQuestionCount > 0 && (
                    <small>
                      Question bank note: {revengeMeta.repeatedQuestionCount} previous
                      question(s) had to be reused because there were not enough unused
                      questions available.
                    </small>
                  )}
                </div>
              )}

              <SpeedAccuracyAnalytics
                questions={questions}
                questionTimes={questionTimes}
                answers={answers}
                writtenFeedback={writtenFeedback}
                getCorrectAnswerIndex={getCorrectAnswerIndex}
                accuracy={resultAccuracy}
                benchmarkSeconds={speedBenchmarkSeconds}
                questionType={resolvedQuestionType}
              />

              <div className="navta-performance-section">
                <h3>Difficulty Performance</h3>

                {["Easy", "Medium", "Hard"].map((level) => {
                  const result =
                    difficultyPerformance[level] || {
                      correct: 0,
                      total: 0,
                    };

                  return (
                    <div
                      key={level}
                      className="navta-performance-row"
                    >
                      <span>{level}</span>
                      <strong>
                        {result.correct}/{result.total}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <div className="navta-performance-section">
                <h3>Chapter Performance</h3>

                {Object.entries(chapterPerformance).map(
                  ([name, result]) => {
                    const percentage =
                      result.total > 0
                        ? Math.round(
                            (result.correct /
                              result.total) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={name}
                        className="navta-performance-row"
                      >
                        <span>{name}</span>
                        <strong>
                          {result.correct}/{result.total}
                          {" • "}
                          {percentage}%
                        </strong>
                      </div>
                    );
                  }
                )}
              </div>

              {generationError && (
                <div className="navta-error" style={{ marginTop: "22px" }}>
                  {generationError}
                </div>
              )}

              <div className="navta-actions">
                {!bossWon ? (
                  <button
                    type="button"
                    disabled={generatingTest}
                    style={{
                      ...styles.revengeButton,
                      opacity: generatingTest ? 0.65 : 1,
                    }}
                    onClick={startRevengeBattle}
                  >
                    {generatingTest
                      ? "Preparing Revenge..."
                      : isRevenge
                        ? `🔥 Revenge Again (#${revengeAttempt + 1})`
                        : "🔥 Take Revenge"}
                  </button>
                ) : (
                  <button
                    type="button"
                    style={styles.bossButtonNoMargin}
                    onClick={() => {
                      clearTestRun();
                      setStep("bossSummary");
                    }}
                  >
                    ⚔ Fight Another Boss
                  </button>
                )}

                <button
                  type="button"
                  style={styles.startButtonNoMargin}
                  onClick={resetTest}
                >
                  Choose Another Test
                </button>
              </div>

              <Link
                to="/dashboard"
                style={styles.dashboardLink}
              >
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <div className="navta-result-card">
              <div style={styles.resultIcon}>✓</div>

              <h1>Test Completed!</h1>

              <p style={{ color: "#94a3b8" }}>
                {subject} → {classLevel} → {chapter} →{" "}
                {difficulty}
              </p>

              {resolvedQuestionType === "mcq" ? (
                <>
                  <div className="navta-result-score">
                    {mcqScore}/{questions.length}
                  </div>

                  <p style={{ color: "#94a3b8" }}>
                    You answered {mcqScore} of{" "}
                    {questions.length} questions correctly.
                  </p>
                </>
              ) : (
                <>
                  <div className="navta-result-score">
                    {writtenMarks.awarded}/
                    {writtenMarks.maximum}
                  </div>

                  <p style={{ color: "#94a3b8" }}>
                    AI-evaluated board answer score
                  </p>
                </>
              )}

              <div
                className={`navta-reward-result ${
                  resultSaveStatus === "saved"
                    ? "saved"
                    : resultSaveStatus === "error"
                      ? "error"
                      : ""
                }`}
              >
                <strong>
                  {resultSaveStatus === "saving"
                    ? "Saving performance..."
                    : resultSaveStatus === "saved"
                      ? "NAVTA Performance Saved"
                      : resultSaveStatus === "error"
                        ? "Performance Save Needs Retry"
                        : "Finalising performance..."}
                </strong>

                <p>
                  {resultSaveStatus === "saving"
                    ? "Your daily performance and coin reward are being updated."
                    : resultSaveMessage ||
                      "Your result will be added to your daily Performance Overview."}
                </p>

                {resultSaveStatus === "saved" && (
                  <>
                    <div className="navta-reward-coins">
                      🪙 +{coinsAwarded}{" "}
                      {coinsAwarded === 1 ? "coin" : "coins"}
                    </div>

                    {updatedCoinBalance !== null && (
                      <div className="navta-reward-balance">
                        Coin Balance: {updatedCoinBalance}
                      </div>
                    )}
                  </>
                )}

                {resultSaveStatus === "error" && (
                  <button
                    type="button"
                    className="navta-retry-save"
                    onClick={saveCompletedNavtaResult}
                  >
                    Retry Saving Result
                  </button>
                )}
              </div>

              <SpeedAccuracyAnalytics
                questions={questions}
                questionTimes={questionTimes}
                answers={answers}
                writtenFeedback={writtenFeedback}
                getCorrectAnswerIndex={getCorrectAnswerIndex}
                accuracy={resultAccuracy}
                benchmarkSeconds={speedBenchmarkSeconds}
                questionType={resolvedQuestionType}
              />

              <button
                type="button"
                style={styles.startButton}
                onClick={resetTest}
              >
                Take Another Test
              </button>

              <Link
                to="/dashboard"
                style={styles.dashboardLink}
              >
                Back to Dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function SpeedAccuracyAnalytics({
  questions,
  questionTimes,
  answers,
  writtenFeedback,
  getCorrectAnswerIndex,
  accuracy,
  benchmarkSeconds,
  questionType,
}) {
  const rows = questions.map((question, index) => {
    const seconds = Number(questionTimes[index] || 0);

    let status = "Unanswered";
    let isCorrect = false;

    if (questionType === "mcq") {
      const hasAnswer = answers[index] !== undefined;
      isCorrect =
        hasAnswer &&
        answers[index] === getCorrectAnswerIndex(question);
      status = hasAnswer
        ? isCorrect
          ? "Correct"
          : "Wrong"
        : "Unanswered";
    } else {
      const feedback = writtenFeedback[index];
      if (feedback) {
        status =
          feedback.status === "correct"
            ? "Correct"
            : feedback.status === "partially_correct"
              ? "Partial"
              : "Wrong";
        isCorrect = feedback.status === "correct";
      }
    }

    return {
      index,
      seconds,
      status,
      isCorrect,
      chapter: question?.chapter || "Current chapter",
      difficulty: question?.difficulty || "-",
    };
  });

  const timedRows = rows.filter((row) => row.seconds > 0);
  const totalSeconds = timedRows.reduce(
    (sum, row) => sum + row.seconds,
    0
  );
  const averageSeconds = timedRows.length
    ? Math.round(totalSeconds / timedRows.length)
    : 0;
  const fastestSeconds = timedRows.length
    ? Math.min(...timedRows.map((row) => row.seconds))
    : 0;
  const slowestSeconds = timedRows.length
    ? Math.max(...timedRows.map((row) => row.seconds))
    : 0;

  const paceLabel =
    averageSeconds === 0
      ? "No timing data"
      : averageSeconds <= benchmarkSeconds * 0.75
        ? "Excellent pace"
        : averageSeconds <= benchmarkSeconds
          ? "On exam pace"
          : "Needs more speed";

  return (
    <div className="navta-speed-card">
      <h3>⏱ Speed vs Accuracy</h3>
      <p className="navta-speed-subtitle">
        See how quickly you solved each question and whether your
        pace matches the target time.
      </p>

      <div className="navta-speed-overview">
        <div className="navta-speed-stat">
          <span>Accuracy</span>
          <strong>{accuracy}%</strong>
        </div>

        <div className="navta-speed-stat">
          <span>Average / Question</span>
          <strong>{formatSolveTime(averageSeconds)}</strong>
        </div>

        <div className="navta-speed-stat">
          <span>Pace</span>
          <strong>{paceLabel}</strong>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
          color: "var(--nt-muted)",
          fontSize: "13px",
        }}
      >
        <span>
          Target: {formatSolveTime(benchmarkSeconds)} / question
        </span>
        <span>•</span>
        <span>Fastest: {formatSolveTime(fastestSeconds)}</span>
        <span>•</span>
        <span>Slowest: {formatSolveTime(slowestSeconds)}</span>
        <span>•</span>
        <span>Total solving time: {formatSolveTime(totalSeconds)}</span>
      </div>

      <div className="navta-speed-table">
        <div className="navta-speed-row header">
          <span>Q</span>
          <span>Chapter</span>
          <span className="speed-hide-mobile">Difficulty</span>
          <span>Result</span>
          <span>Time</span>
        </div>

        {rows.map((row) => {
          const onPace =
            row.seconds > 0 && row.seconds <= benchmarkSeconds;

          return (
            <div
              key={`speed-${row.index}`}
              className="navta-speed-row"
            >
              <strong>{row.index + 1}</strong>
              <span>{row.chapter}</span>
              <span className="speed-hide-mobile">
                {row.difficulty}
              </span>
              <span
                className={
                  row.status === "Correct"
                    ? "navta-speed-good"
                    : row.status === "Wrong"
                      ? "navta-speed-slow"
                      : ""
                }
              >
                {row.status}
              </span>
              <span
                className={
                  onPace
                    ? "navta-speed-good"
                    : row.seconds > 0
                      ? "navta-speed-slow"
                      : ""
                }
              >
                {row.seconds > 0
                  ? formatSolveTime(row.seconds)
                  : "-"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="navta-summary-item">
      <span className="navta-summary-label">
        {label}
      </span>
      <span className="navta-summary-value">
        {value}
      </span>
    </div>
  );
}

function WrittenFeedback({
  feedback,
  onNext,
  isLast,
}) {
  const status = feedback?.status || "incorrect";

  const className =
    status === "correct"
      ? "correct"
      : status === "partially_correct"
        ? "partial"
        : "incorrect";

  const title =
    status === "correct"
      ? "✓ Correct"
      : status === "partially_correct"
        ? "△ Partially Correct"
        : "✕ Incorrect";

  return (
    <div
      className={`navta-written-feedback ${className}`}
    >
      <h3 style={{ marginTop: 0 }}>
        {title}
      </h3>

      <p
        style={{
          fontSize: "20px",
          fontWeight: 800,
        }}
      >
        Marks: {feedback?.marksAwarded ?? 0}/
        {feedback?.maxMarks ?? 0}
      </p>

      {feedback?.feedback && (
        <p
          style={{
            color: "var(--nt-soft-text)",
            lineHeight: 1.65,
          }}
        >
          <strong>AI Feedback: </strong>
          {feedback.feedback}
        </p>
      )}

      {Array.isArray(feedback?.missingPoints) &&
        feedback.missingPoints.length > 0 && (
          <div style={{ marginTop: "15px" }}>
            <strong>Points to improve:</strong>

            <ul
              style={{
                color: "var(--nt-soft-text)",
                lineHeight: 1.7,
              }}
            >
              {feedback.missingPoints.map(
                (point, index) => (
                  <li key={`${point}-${index}`}>
                    {point}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

      <button
        type="button"
        style={styles.nextButton}
        onClick={onNext}
      >
        {isLast ? "Finish Test" : "Next Question →"}
      </button>
    </div>
  );
}

const styles = {
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid var(--nt-border-strong)",
    background: "var(--nt-surface-2)",
    color: "var(--nt-text)",
    textDecoration: "none",
    cursor: "pointer",
    font: "inherit",
  },

  startButton: {
    display: "block",
    margin: "30px auto",
    padding: "15px 28px",
    border: "none",
    borderRadius: "10px",
    background: "#079de0",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  startButtonNoMargin: {
    padding: "15px 28px",
    border: "none",
    borderRadius: "10px",
    background: "#079de0",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },

  bossButton: {
    display: "block",
    margin: "30px auto",
    padding: "15px 28px",
    border: "1px solid rgba(245, 158, 11, 0.55)",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #d97706, #f59e0b)",
    color: "#111827",
    fontSize: "16px",
    fontWeight: "900",
    cursor: "pointer",
  },

  bossButtonNoMargin: {
    padding: "15px 28px",
    border: "1px solid rgba(245, 158, 11, 0.55)",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #d97706, #f59e0b)",
    color: "#111827",
    fontSize: "16px",
    fontWeight: "900",
    cursor: "pointer",
  },

  revengeButton: {
    padding: "15px 28px",
    border: "1px solid rgba(239, 68, 68, 0.55)",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #dc2626, #f97316)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 10px 28px rgba(220, 38, 38, 0.18)",
  },

  timer: {
    padding: "14px 22px",
    borderRadius: "12px",
    background: "var(--nt-accent-soft)",
    color: "var(--nt-accent)",
    fontSize: "24px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  dangerTimer: {
    background: "var(--nt-danger-bg)",
    color: "var(--nt-danger-text)",
  },

  progress: {
    maxWidth: "1000px",
    margin: "0 auto 15px",
    color: "var(--nt-muted)",
  },

  selectedOption: {
    border: "2px solid #079de0",
    background: "var(--nt-accent-soft)",
  },

  wrongOption: {
    border: "2px solid #ef4444",
    background: "var(--nt-danger-bg)",
  },

  correctOption: {
    border: "2px solid #22c55e",
    background: "var(--nt-success-bg)",
  },

  optionLetter: {
    minWidth: "25px",
    flexShrink: 0,
    fontWeight: "800",
  },

  nextButton: {
    padding: "13px 24px",
    borderRadius: "10px",
    border: "none",
    background: "#079de0",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },

  resultIcon: {
    fontSize: "50px",
    color: "#22c55e",
  },

  dashboardLink: {
    display: "block",
    color: "var(--nt-accent-text)",
    marginTop: "20px",
    textDecoration: "none",
  },
};
