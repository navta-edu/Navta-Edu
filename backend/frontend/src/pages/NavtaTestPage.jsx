import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

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

function getQuestionCount(preparation, questionType, duration) {
  const config = TEST_CONFIG[preparation]?.[questionType];
  if (!config || !duration) return 0;
  return Math.floor(Number(duration) / config.minutesPerQuestion);
}

function getQuestionTypeLabel(questionType) {
  return QUESTION_TYPE_INFO[questionType]?.title || "MCQ / Option";
}

function getBossRank(percentage) {
  if (percentage >= 90) return { rank: "S", label: "Legendary", icon: "👑" };
  if (percentage >= 80) return { rank: "A", label: "Elite", icon: "⚔" };
  if (percentage >= 70) return { rank: "B", label: "Strong", icon: "🔥" };
  if (percentage >= 60) return { rank: "C", label: "Cleared", icon: "✅" };
  return { rank: "Retry", label: "Train and return", icon: "🔁" };
}

function formatSolveTime(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes === 0) return `${remaining}s`;
  return `${minutes}m ${String(remaining).padStart(2, "0")}s`;
}

export default function NavtaTestPage() {
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

  const isBoss = testMode === "boss";

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

    if (timeLeft <= 0) {
      setQuestionTimes((previous) => {
        if (previous[currentQuestion] !== undefined) return previous;

        const startedAt = questionStartedAtRef.current;
        if (!startedAt) return previous;

        return {
          ...previous,
          [currentQuestion]: Math.max(
            1,
            Math.ceil((Date.now() - startedAt) / 1000)
          ),
        };
      });

      setSubmitted(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearInterval(timer);
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
    setGeneratingTest(false);
    setGenerationError("");
    setEvaluatingAnswer(false);
    setEvaluationError("");
    setQuestionTimes({});
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
      questionStartedAtRef.current = Date.now();
      setTimeLeft(
        Number(
          data?.test?.durationSeconds ||
            Number(selectedDuration) * 60
        )
      );
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
      setQuestions(generatedQuestions);
      setCurrentQuestion(0);
      setAnswers({});
      setAnswerFeedback({});
      setWrittenAnswers({});
      setWrittenFeedback({});
      setQuestionTimes({});
      questionStartedAtRef.current = Date.now();
      setTimeLeft(returnedSeconds || fallbackSeconds);
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
          backdrop-filter: blur(14px);
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
                Fight a mixed-difficulty test across multiple
                chapters and earn a Boss Rank.
              </p>

              <div className="navta-mode-features">
                <span>⚔ Multiple chapters</span>
                <span>⚡ Automatic difficulty mix</span>
                <span>👑 15 / 30 / 50 question battles</span>
                <span>🏆 S, A, B, C and Retry ranks</span>
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
                {isBoss ? "⚔ Boss Battle" : "Navta TEST"}
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
            ⚔ Boss Battle is MCQ-only. Questions are mixed
            automatically across Easy, Medium and Hard.
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
                  {isBoss ? "⚔ Boss Battle" : "Navta TEST"}
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
                  {BOSS_SIZES[bossSize]?.name || "Boss Battle"}
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
            </div>

            {resolvedQuestionType === "mcq" && (
              <>
                <div className="navta-question-card">
                  <h2 className="navta-question">
                    {currentTestQuestion.question}
                  </h2>

                  <div>
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

                            <span>{option}</span>
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

                      <p
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
                        .{" "}
                        {
                          currentTestQuestion.options[
                            answerFeedback[currentQuestion]
                              .correctAnswer
                          ]
                        }
                      </p>

                      <p
                        style={{
                          color: "var(--nt-soft-text)",
                          lineHeight: 1.65,
                        }}
                      >
                        <strong>Explanation: </strong>
                        {currentTestQuestion.explanation ||
                          "Explanation is not available for this question yet."}
                      </p>

                      <button
                        type="button"
                        style={styles.nextButton}
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

                  <h2 className="navta-question">
                    {currentTestQuestion.question}
                  </h2>

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
                {bossRank.icon}
              </div>

              <h1>Boss Battle Complete!</h1>

              <p style={{ color: "#94a3b8" }}>
                {subject} → {preparation} → {classLevel}
              </p>

              <div className="navta-rank">
                {bossRank.rank}
              </div>

              <div
                style={{
                  color: "var(--nt-boss-text)",
                  fontWeight: 800,
                  marginTop: "-12px",
                }}
              >
                {bossRank.label}
              </div>

              <div className="navta-result-score">
                {mcqScore}/{questions.length}
              </div>

              <p style={{ color: "var(--nt-muted)" }}>
                {bossPercentage}% accuracy
              </p>

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

              <div className="navta-actions">
                <button
                  type="button"
                  style={styles.bossButton}
                  onClick={() => {
                    clearTestRun();
                    setStep("bossSummary");
                  }}
                >
                  ⚔ Retry Battle
                </button>

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
