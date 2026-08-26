import React, { useEffect, useMemo, useState } from "react";
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
  Easy: {
    icon: "🌱",
    description: "Build your fundamentals",
  },
  Medium: {
    icon: "⚡",
    description: "Exam-level practice",
  },
  Hard: {
    icon: "🔥",
    description: "Advanced questions",
  },
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
    mcq: {
      minutesPerQuestion: 1,
      durations: [10, 15, 20, 30, 45, 60],
    },
  },

  JEE: {
    mcq: {
      minutesPerQuestion: 2,
      durations: [10, 20, 30, 40, 60, 90],
    },
  },

  Boards: {
    mcq: {
      minutesPerQuestion: 1,
      durations: [10, 15, 20, 30, 45, 60],
    },

    short: {
      minutesPerQuestion: 3,
      durations: [15, 30, 45, 60, 90],
    },

    long: {
      minutesPerQuestion: 6,
      durations: [30, 60, 90, 120, 180],
    },
  },
};

function getQuestionCount(preparation, questionType, duration) {
  const config = TEST_CONFIG[preparation]?.[questionType];

  if (!config || !duration) {
    return 0;
  }

  return Math.floor(
    Number(duration) / config.minutesPerQuestion
  );
}

function getQuestionTypeLabel(questionType) {
  return QUESTION_TYPE_INFO[questionType]?.title || "MCQ / Option";
}

export default function NavtaTestPage() {
  const [step, setStep] = useState("subject");

  const [subject, setSubject] = useState("");
  const [preparation, setPreparation] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [chapter, setChapter] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [questionType, setQuestionType] = useState("mcq");
  const [selectedDuration, setSelectedDuration] = useState(null);

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

  const resolvedQuestionType =
    preparation === "Boards"
      ? questionType
      : "mcq";

  const currentConfig =
    TEST_CONFIG[preparation]?.[resolvedQuestionType];

  const requestedQuestionCount = useMemo(() => {
    return getQuestionCount(
      preparation,
      resolvedQuestionType,
      selectedDuration
    );
  }, [
    preparation,
    resolvedQuestionType,
    selectedDuration,
  ]);

  const minutesPerQuestion =
    currentConfig?.minutesPerQuestion || 0;

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }, [timeLeft]);

  const currentTestQuestion =
    questions[currentQuestion];

  // ============================================
  // TIMER
  // ============================================

  useEffect(() => {
    if (
      step !== "test" ||
      submitted ||
      questions.length === 0
    ) {
      return;
    }

    if (timeLeft <= 0) {
      setSubmitted(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) =>
        Math.max(0, previous - 1)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [
    step,
    submitted,
    timeLeft,
    questions.length,
  ]);

  // ============================================
  // RESET HELPERS
  // ============================================

  const resetAfterSubject = () => {
    setPreparation("");
    setClassLevel("");
    setChapter("");
    setDifficulty("");
    setQuestionType("mcq");
    setSelectedDuration(null);
    setGenerationError("");
  };

  const resetAfterPreparation = () => {
    setClassLevel("");
    setChapter("");
    setDifficulty("");
    setQuestionType("mcq");
    setSelectedDuration(null);
    setGenerationError("");
  };

  const resetAfterClass = () => {
    setChapter("");
    setDifficulty("");
    setQuestionType("mcq");
    setSelectedDuration(null);
    setGenerationError("");
  };

  const resetTest = () => {
    setStep("subject");

    setSubject("");
    setPreparation("");
    setClassLevel("");
    setChapter("");
    setDifficulty("");

    setQuestionType("mcq");
    setSelectedDuration(null);

    setQuestions([]);
    setCurrentQuestion(0);

    setAnswers({});
    setAnswerFeedback({});

    setWrittenAnswers({});
    setWrittenFeedback({});

    setTimeLeft(0);
    setSubmitted(false);

    setGeneratingTest(false);
    setGenerationError("");

    setEvaluatingAnswer(false);
    setEvaluationError("");
  };

  // ============================================
  // GENERATE TEST FROM ADMIN QUESTION BANK
  // ============================================

  const startTest = async () => {
    if (
      !subject ||
      !preparation ||
      !classLevel ||
      !chapter ||
      !difficulty ||
      !selectedDuration
    ) {
      setGenerationError(
        "Please complete all test selections first."
      );

      return;
    }

    setGeneratingTest(true);
    setGenerationError("");

    try {
      const response = await fetch(
        "/api/navta-test/generate",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            subject,
            exam: preparation,
            classLevel,
            chapter,
            difficulty,

            questionType:
              resolvedQuestionType,

            duration:
              selectedDuration,
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
        if (
          data.required !== undefined &&
          data.available !== undefined
        ) {
          throw new Error(
            `${data.message || "Not enough questions."} Required: ${
              data.required
            }, available: ${data.available}.`
          );
        }

        throw new Error(
          data.message ||
            "Unable to generate this test."
        );
      }

      const generatedQuestions =
        data?.test?.questions || [];

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

      setTimeLeft(
        Number(
          data?.test?.durationSeconds ||
            selectedDuration * 60
        )
      );

      setSubmitted(false);
      setEvaluationError("");
      setStep("test");
    } catch (error) {
      console.error(
        "Navta TEST generation error:",
        error
      );

      setGenerationError(
        error.message ||
          "Unable to generate the test."
      );
    } finally {
      setGeneratingTest(false);
    }
  };

  // ============================================
  // MCQ LOGIC
  // ============================================

  const getCorrectAnswerIndex = (question) => {
    if (
      typeof question?.correctAnswer ===
      "number"
    ) {
      return question.correctAnswer;
    }

    if (
      typeof question?.answer === "number"
    ) {
      return question.answer;
    }

    return Number(
      question?.correctAnswer
    );
  };

  const goForwardAfterAnswer = () => {
    setEvaluationError("");

    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) => previous + 1
      );
    } else {
      setSubmitted(true);
    }
  };

  const selectAnswer = (
    answerIndex
  ) => {
    if (
      answerFeedback[
        currentQuestion
      ]
    ) {
      return;
    }

    const question =
      questions[currentQuestion];

    const correctAnswer =
      getCorrectAnswerIndex(
        question
      );

    const isCorrect =
      answerIndex === correctAnswer;

    setAnswers((previous) => ({
      ...previous,

      [currentQuestion]:
        answerIndex,
    }));

    setAnswerFeedback(
      (previous) => ({
        ...previous,

        [currentQuestion]: {
          isCorrect,

          selectedAnswer:
            answerIndex,

          correctAnswer,
        },
      })
    );

    // Correct MCQ:
    // no explanation is displayed.
    // Move directly to the next question.
    if (isCorrect) {
      setTimeout(() => {
        if (
          currentQuestion <
          questions.length - 1
        ) {
          setCurrentQuestion(
            (previous) =>
              previous + 1
          );
        } else {
          setSubmitted(true);
        }
      }, 300);
    }
  };

  // ============================================
  // BOARDS WRITTEN ANSWER AI EVALUATION
  // ============================================

  const evaluateWrittenAnswer =
    async () => {
      const question =
        questions[currentQuestion];

      const studentAnswer =
        String(
          writtenAnswers[
            currentQuestion
          ] || ""
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

      setEvaluatingAnswer(true);
      setEvaluationError("");

      try {
        const response =
          await fetch(
            "/api/navta-test/evaluate-answer",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  questionId:
                    question._id,

                  studentAnswer,
                }),
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
              "AI could not evaluate this answer."
          );
        }

        setWrittenFeedback(
          (previous) => ({
            ...previous,

            [currentQuestion]:
              data.evaluation,
          })
        );
      } catch (error) {
        console.error(
          "Written answer evaluation error:",
          error
        );

        setEvaluationError(
          error.message ||
            "Unable to evaluate the answer."
        );
      } finally {
        setEvaluatingAnswer(
          false
        );
      }
    };

  // ============================================
  // RESULT CALCULATIONS
  // ============================================

  const mcqScore = useMemo(() => {
    if (
      resolvedQuestionType !==
      "mcq"
    ) {
      return 0;
    }

    return questions.reduce(
      (
        total,
        question,
        index
      ) => {
        return (
          total +
          (answers[index] ===
          getCorrectAnswerIndex(
            question
          )
            ? 1
            : 0)
        );
      },
      0
    );
  }, [
    answers,
    questions,
    resolvedQuestionType,
  ]);

  const writtenMarks = useMemo(() => {
    if (
      resolvedQuestionType ===
      "mcq"
    ) {
      return {
        awarded: 0,
        maximum: 0,
      };
    }

    return questions.reduce(
      (result, question, index) => {
        const feedback =
          writtenFeedback[index];

        result.maximum +=
          Number(
            question.maxMarks || 0
          );

        if (feedback) {
          result.awarded +=
            Number(
              feedback.marksAwarded ||
                0
            );
        }

        return result;
      },
      {
        awarded: 0,
        maximum: 0,
      }
    );
  }, [
    questions,
    writtenFeedback,
    resolvedQuestionType,
  ]);

  // ============================================
  // NAVIGATION
  // ============================================

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

    if (
      preparation === "Boards"
    ) {
      setStep("questionType");
    } else {
      setStep("difficulty");
    }
  };

  // ============================================
  // UI
  // ============================================

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .navta-test-page {
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          background: #0b1220;
          color: #ffffff;
          padding: 40px;
        }

        .navta-header {
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
          color: #94a3b8;
          line-height: 1.5;
        }

        .navta-grid,
        .navta-preparation-grid,
        .navta-difficulty-grid,
        .navta-question-type-grid,
        .navta-duration-grid {
          max-width: 1000px;
          margin: 30px auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
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

        .navta-card {
          min-width: 0;
          padding: 28px;
          border-radius: 18px;
          border: 1px solid #243047;
          background: #151d2d;
          color: #ffffff;
          cursor: pointer;
          text-align: left;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .navta-card:hover {
          transform: translateY(-2px);
          border-color: #0ea5e9;
        }

        .navta-card.active {
          border: 2px solid #0ea5e9;
          background: #102a43;
        }

        .navta-card-icon {
          margin-bottom: 14px;
          font-size: 36px;
        }

        .navta-card h2 {
          margin: 0 0 8px;
          font-size: 21px;
        }

        .navta-card p {
          margin: 0;
          color: #94a3b8;
          line-height: 1.5;
        }

        .navta-continue {
          display: block;
          margin-top: 18px;
          color: #38bdf8;
          font-weight: 700;
        }

        .navta-chapter-card {
          width: 100%;
          min-width: 0;
          padding: 18px;
          border-radius: 12px;
          border: 1px solid #243047;
          background: #151d2d;
          color: #ffffff;
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
          border-color: #0ea5e9;
        }

        .navta-duration-card {
          min-height: 120px;
          padding: 22px;
          border-radius: 16px;
          border: 2px solid #334155;
          background: #151d2d;
          color: #ffffff;
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
          border-color: #0ea5e9;
        }

        .navta-duration-card.active {
          border-color: #0ea5e9;
          background: #102a43;
          box-shadow: 0 0 0 1px #0ea5e9;
        }

        .navta-duration-time {
          font-size: 20px;
          font-weight: 800;
        }

        .navta-duration-questions {
          color: #94a3b8;
          font-size: 14px;
        }

        .navta-rule-banner {
          max-width: 900px;
          margin: 0 auto 10px;
          padding: 14px 18px;
          border: 1px solid #243047;
          border-radius: 12px;
          background: #111827;
          color: #cbd5e1;
          text-align: center;
          line-height: 1.5;
        }

        .navta-summary-card {
          max-width: 760px;
          margin: 35px auto;
          padding: 28px;
          border-radius: 18px;
          background: #151d2d;
          border: 1px solid #243047;
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
          background: #0f172a;
          border: 1px solid #243047;
        }

        .navta-summary-label {
          display: block;
          margin-bottom: 5px;
          color: #94a3b8;
          font-size: 12px;
        }

        .navta-summary-value {
          font-weight: 700;
          color: #ffffff;
        }

        .navta-error {
          max-width: 760px;
          margin: 18px auto;
          padding: 14px 16px;
          border: 1px solid rgba(239, 68, 68, 0.45);
          border-radius: 12px;
          background: rgba(127, 29, 29, 0.2);
          color: #fca5a5;
          line-height: 1.5;
          text-align: center;
        }

        .navta-test-header {
          max-width: 1000px;
          margin: 0 auto 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .navta-question-card {
          max-width: 1000px;
          margin: 0 auto;
          padding: 35px;
          border-radius: 18px;
          background: #151d2d;
          border: 1px solid #243047;
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
          border: 1px solid #334155;
          background: #0f172a;
          color: #ffffff;
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
          border: 1px solid #334155;
          background: #111827;
        }

        .navta-answer-feedback.wrong {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(127, 29, 29, 0.2);
        }

        .navta-written-feedback.correct {
          border-color: rgba(34, 197, 94, 0.5);
          background: rgba(20, 83, 45, 0.22);
        }

        .navta-written-feedback.partial {
          border-color: rgba(245, 158, 11, 0.5);
          background: rgba(120, 53, 15, 0.2);
        }

        .navta-written-feedback.incorrect {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(127, 29, 29, 0.2);
        }

        .navta-written-answer {
          width: 100%;
          min-height: 220px;
          padding: 16px;
          border: 1px solid #334155;
          border-radius: 12px;
          background: #0f172a;
          color: #ffffff;
          font: inherit;
          line-height: 1.65;
          resize: vertical;
          outline: none;
        }

        .navta-written-answer:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
        }

        .navta-written-answer:disabled {
          opacity: 0.75;
          cursor: default;
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
          max-width: 640px;
          margin: 80px auto;
          padding: 45px;
          border-radius: 20px;
          background: #151d2d;
          border: 1px solid #243047;
          text-align: center;
        }

        .navta-result-score {
          margin: 26px 0;
          font-size: 56px;
          font-weight: 900;
        }

        .navta-status-pill {
          display: inline-block;
          margin-bottom: 12px;
          padding: 7px 12px;
          border-radius: 999px;
          background: #0f172a;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
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

          .navta-grid,
          .navta-preparation-grid,
          .navta-difficulty-grid,
          .navta-question-type-grid {
            grid-template-columns: 1fr;
          }

          .navta-class-grid {
            grid-template-columns: 1fr;
          }

          .navta-chapter-grid {
            grid-template-columns: 1fr;
          }

          .navta-duration-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .navta-summary-grid {
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
            margin: 40px auto;
            padding: 30px 18px;
          }

          .navta-result-score {
            font-size: 46px;
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

      {/* ============================================
          SUBJECT
      ============================================ */}

      {step === "subject" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">
                Navta TEST
              </h1>

              <p className="navta-subtitle">
                Choose a subject to begin your test.
              </p>
            </div>

            <Link
              to="/dashboard"
              style={styles.backButton}
            >
              ← Dashboard
            </Link>
          </div>

          <div className="navta-grid">
            {Object.keys(
              PREPARATION_OPTIONS
            ).map((item) => (
              <button
                key={item}
                type="button"
                className="navta-card"
                onClick={() => {
                  setSubject(item);
                  resetAfterSubject();
                  setStep(
                    "preparation"
                  );
                }}
              >
                <div className="navta-card-icon">
                  {item ===
                    "Physics" && "⚡"}
                  {item ===
                    "Chemistry" && "🧪"}
                  {item ===
                    "Maths" && "∑"}
                  {item ===
                    "Biology" && "🧬"}
                </div>

                <h2>{item}</h2>

                <p>
                  Class 11 and Class 12
                  chapter-wise tests
                </p>

                <span className="navta-continue">
                  Continue →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============================================
          PREPARATION
      ============================================ */}

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
              PREPARATION_OPTIONS[
                subject
              ] || {}
            ).map(
              ([key, option]) => (
                <button
                  key={key}
                  type="button"
                  className="navta-card"
                  onClick={() => {
                    setPreparation(
                      key
                    );

                    resetAfterPreparation();

                    setStep("class");
                  }}
                >
                  <div className="navta-card-icon">
                    {option.icon}
                  </div>

                  <h2>
                    {option.title}
                  </h2>

                  <p>
                    {
                      option.description
                    }
                  </p>

                  <span className="navta-continue">
                    Continue →
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* ============================================
          CLASS
      ============================================ */}

      {step === "class" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">
                Choose Class
              </h1>

              <p className="navta-subtitle">
                {subject} →{" "}
                {preparation}
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={
                goBackFromClass
              }
            >
              ← Preparation
            </button>
          </div>

          <div className="navta-class-grid">
            {CLASSES.map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  className="navta-card"
                  onClick={() => {
                    setClassLevel(
                      item
                    );

                    resetAfterClass();

                    setStep(
                      "chapter"
                    );
                  }}
                >
                  <div className="navta-card-icon">
                    🎓
                  </div>

                  <h2>{item}</h2>

                  <p>
                    {
                      (
                        CHAPTERS[
                          subject
                        ]?.[item] ||
                        []
                      ).length
                    }{" "}
                    chapters
                  </p>

                  <span className="navta-continue">
                    View Chapters →
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* ============================================
          CHAPTER
      ============================================ */}

      {step === "chapter" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">
                {subject}
              </h1>

              <p className="navta-subtitle">
                {preparation} →{" "}
                {classLevel}
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={
                goBackFromChapter
              }
            >
              ← Class
            </button>
          </div>

          <div className="navta-chapter-grid">
            {(
              CHAPTERS[
                subject
              ]?.[
                classLevel
              ] || []
            ).map((item) => (
              <button
                key={item}
                type="button"
                className="navta-chapter-card"
                onClick={() => {
                  setChapter(item);
                  setDifficulty("");
                  setQuestionType(
                    "mcq"
                  );
                  setSelectedDuration(
                    null
                  );
                  setGenerationError(
                    ""
                  );
                  setStep(
                    "difficulty"
                  );
                }}
              >
                <span>{item}</span>
                <span>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============================================
          DIFFICULTY
      ============================================ */}

      {step === "difficulty" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">
                Select Difficulty
              </h1>

              <p className="navta-subtitle">
                {subject} →{" "}
                {classLevel} →{" "}
                {chapter}
              </p>
            </div>

            <button
              type="button"
              style={styles.backButton}
              onClick={
                goBackFromDifficulty
              }
            >
              ← Chapters
            </button>
          </div>

          <div className="navta-difficulty-grid">
            {Object.entries(
              DIFFICULTY_INFO
            ).map(
              ([level, info]) => (
                <button
                  key={level}
                  type="button"
                  className={`navta-card${
                    difficulty ===
                    level
                      ? " active"
                      : ""
                  }`}
                  onClick={() => {
                    setDifficulty(
                      level
                    );
                    setSelectedDuration(
                      null
                    );
                    setGenerationError(
                      ""
                    );
                  }}
                >
                  <div className="navta-card-icon">
                    {info.icon}
                  </div>

                  <h2>{level}</h2>

                  <p>
                    {
                      info.description
                    }
                  </p>
                </button>
              )
            )}
          </div>

          {difficulty && (
            <button
              type="button"
              style={styles.startButton}
              onClick={() => {
                if (
                  preparation ===
                  "Boards"
                ) {
                  setStep(
                    "questionType"
                  );
                } else {
                  setQuestionType(
                    "mcq"
                  );
                  setStep(
                    "duration"
                  );
                }
              }}
            >
              {preparation ===
              "Boards"
                ? "Choose Question Type →"
                : "Choose Test Duration →"}
            </button>
          )}
        </div>
      )}

      {/* ============================================
          BOARDS QUESTION TYPE
      ============================================ */}

      {step ===
        "questionType" &&
        preparation ===
          "Boards" && (
          <div className="navta-test-page">
            <div className="navta-header">
              <div>
                <h1 className="navta-title">
                  Choose Question Type
                </h1>

                <p className="navta-subtitle">
                  {subject} →{" "}
                  {classLevel} →{" "}
                  {chapter} →{" "}
                  {difficulty}
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.backButton
                }
                onClick={
                  goBackFromQuestionType
                }
              >
                ← Difficulty
              </button>
            </div>

            <div className="navta-question-type-grid">
              {Object.entries(
                QUESTION_TYPE_INFO
              ).map(
                ([type, info]) => (
                  <button
                    key={type}
                    type="button"
                    className={`navta-card${
                      questionType ===
                      type
                        ? " active"
                        : ""
                    }`}
                    onClick={() => {
                      setQuestionType(
                        type
                      );

                      setSelectedDuration(
                        null
                      );

                      setGenerationError(
                        ""
                      );
                    }}
                  >
                    <div className="navta-card-icon">
                      {info.icon}
                    </div>

                    <h2>
                      {info.title}
                    </h2>

                    <p>
                      {
                        info.description
                      }
                    </p>

                    <span className="navta-continue">
                      {
                        info.minutesPerQuestion
                      }{" "}
                      minute
                      {info.minutesPerQuestion !==
                      1
                        ? "s"
                        : ""}{" "}
                      / question
                    </span>
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              style={
                styles.startButton
              }
              onClick={() =>
                setStep(
                  "duration"
                )
              }
            >
              Choose Test Duration →
            </button>
          </div>
        )}

      {/* ============================================
          DURATION
      ============================================ */}

      {step === "duration" &&
        currentConfig && (
          <div className="navta-test-page">
            <div className="navta-header">
              <div>
                <h1 className="navta-title">
                  Select Test Duration
                </h1>

                <p className="navta-subtitle">
                  {subject} →{" "}
                  {preparation} →{" "}
                  {classLevel} →{" "}
                  {chapter}
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.backButton
                }
                onClick={
                  goBackFromDuration
                }
              >
                ← Back
              </button>
            </div>

            <div className="navta-rule-banner">
              {preparation ===
                "NEET" &&
                "NEET Mode • 1 minute allocated per MCQ"}

              {preparation ===
                "JEE" &&
                "JEE Mode • 2 minutes allocated per MCQ"}

              {preparation ===
                "Boards" &&
                `Boards • ${getQuestionTypeLabel(
                  resolvedQuestionType
                )} • ${minutesPerQuestion} minute${
                  minutesPerQuestion !==
                  1
                    ? "s"
                    : ""
                } per question`}
            </div>

            <div className="navta-duration-grid">
              {currentConfig.durations.map(
                (duration) => {
                  const count =
                    getQuestionCount(
                      preparation,
                      resolvedQuestionType,
                      duration
                    );

                  return (
                    <button
                      key={duration}
                      type="button"
                      className={`navta-duration-card${
                        selectedDuration ===
                        duration
                          ? " active"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedDuration(
                          duration
                        );

                        setGenerationError(
                          ""
                        );
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
                }
              )}
            </div>

            <button
              type="button"
              disabled={
                !selectedDuration
              }
              style={{
                ...styles.startButton,

                opacity:
                  selectedDuration
                    ? 1
                    : 0.5,
              }}
              onClick={() =>
                setStep(
                  "summary"
                )
              }
            >
              Review Test →
            </button>
          </div>
        )}

      {/* ============================================
          SUMMARY
      ============================================ */}

      {step === "summary" &&
        selectedDuration && (
          <div className="navta-test-page">
            <div className="navta-header">
              <div>
                <h1 className="navta-title">
                  Test Summary
                </h1>

                <p className="navta-subtitle">
                  Check your setup
                  before starting.
                </p>
              </div>

              <button
                type="button"
                style={
                  styles.backButton
                }
                onClick={() =>
                  setStep(
                    "duration"
                  )
                }
              >
                ← Duration
              </button>
            </div>

            <div className="navta-summary-card">
              <h2
                style={{
                  marginTop: 0,
                }}
              >
                Navta TEST
              </h2>

              <div className="navta-summary-grid">
                <SummaryItem
                  label="Subject"
                  value={subject}
                />

                <SummaryItem
                  label="Preparation"
                  value={
                    preparation
                  }
                />

                <SummaryItem
                  label="Class"
                  value={
                    classLevel
                  }
                />

                <SummaryItem
                  label="Chapter"
                  value={
                    chapter
                  }
                />

                <SummaryItem
                  label="Difficulty"
                  value={
                    difficulty
                  }
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
                    minutesPerQuestion !==
                    1
                      ? "s"
                      : ""
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
              disabled={
                generatingTest
              }
              style={{
                ...styles.startButton,

                opacity:
                  generatingTest
                    ? 0.65
                    : 1,
              }}
              onClick={
                startTest
              }
            >
              {generatingTest
                ? "Generating Test..."
                : "Start Navta TEST →"}
            </button>
          </div>
        )}

      {/* ============================================
          TEST
      ============================================ */}

      {step === "test" &&
        !submitted &&
        currentTestQuestion && (
          <div className="navta-test-page">
            <div className="navta-test-header">
              <div>
                <h1 className="navta-title">
                  Navta TEST
                </h1>

                <p className="navta-subtitle">
                  {subject} →{" "}
                  {classLevel} →{" "}
                  {chapter} →{" "}
                  {difficulty}
                </p>
              </div>

              <div
                style={{
                  ...styles.timer,

                  ...(timeLeft <=
                  60
                    ? styles.dangerTimer
                    : {}),
                }}
              >
                ⏱ {formattedTime}
              </div>
            </div>

            <div style={styles.progress}>
              Question{" "}
              {currentQuestion + 1}{" "}
              of {questions.length}
              {" • "}
              {getQuestionTypeLabel(
                resolvedQuestionType
              )}
            </div>

            {/* MCQ */}

            {resolvedQuestionType ===
              "mcq" && (
              <>
                <div className="navta-question-card">
                  <h2 className="navta-question">
                    {
                      currentTestQuestion.question
                    }
                  </h2>

                  <div>
                    {(
                      currentTestQuestion.options ||
                      []
                    ).map(
                      (
                        option,
                        index
                      ) => {
                        const feedback =
                          answerFeedback[
                            currentQuestion
                          ];

                        const correctAnswer =
                          getCorrectAnswerIndex(
                            currentTestQuestion
                          );

                        const isSelected =
                          answers[
                            currentQuestion
                          ] === index;

                        const showWrongSelected =
                          feedback &&
                          !feedback.isCorrect &&
                          isSelected;

                        const showCorrectAnswer =
                          feedback &&
                          !feedback.isCorrect &&
                          index ===
                            correctAnswer;

                        return (
                          <button
                            key={`${currentQuestion}-${index}`}
                            type="button"
                            disabled={Boolean(
                              feedback
                            )}
                            className="navta-option"
                            onClick={() =>
                              selectAnswer(
                                index
                              )
                            }
                            style={{
                              ...(isSelected &&
                              !feedback
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
                            <span
                              style={
                                styles.optionLetter
                              }
                            >
                              {String.fromCharCode(
                                65 +
                                  index
                              )}
                            </span>

                            <span>
                              {
                                option
                              }
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {answerFeedback[
                  currentQuestion
                ] &&
                  !answerFeedback[
                    currentQuestion
                  ].isCorrect && (
                    <div className="navta-answer-feedback wrong">
                      <h3
                        style={{
                          marginTop:
                            0,
                          color:
                            "#fca5a5",
                        }}
                      >
                        ✕ Incorrect
                      </h3>

                      <p
                        style={{
                          color:
                            "#d1fae5",
                          fontWeight:
                            700,
                        }}
                      >
                        Correct
                        Answer:{" "}
                        {String.fromCharCode(
                          65 +
                            answerFeedback[
                              currentQuestion
                            ]
                              .correctAnswer
                        )}
                        .{" "}
                        {
                          currentTestQuestion
                            .options[
                            answerFeedback[
                              currentQuestion
                            ]
                              .correctAnswer
                          ]
                        }
                      </p>

                      <p
                        style={{
                          color:
                            "#e2e8f0",
                          lineHeight:
                            1.65,
                        }}
                      >
                        <strong>
                          Explanation:{" "}
                        </strong>

                        {currentTestQuestion.explanation ||
                          "Explanation is not available for this question yet."}
                      </p>

                      <button
                        type="button"
                        style={
                          styles.nextButton
                        }
                        onClick={
                          goForwardAfterAnswer
                        }
                      >
                        {currentQuestion <
                        questions.length -
                          1
                          ? "Next Question →"
                          : "Finish Test"}
                      </button>
                    </div>
                  )}

                <div className="navta-navigation">
                  <span
                    style={{
                      color:
                        "#94a3b8",
                    }}
                  >
                    {answerFeedback[
                      currentQuestion
                    ]
                      ? answerFeedback[
                          currentQuestion
                        ]
                          .isCorrect
                        ? "✓ Correct — moving to next question..."
                        : "Review the explanation, then continue."
                      : "Select one answer"}
                  </span>
                </div>
              </>
            )}

            {/* WRITTEN ANSWER */}

            {resolvedQuestionType !==
              "mcq" && (
              <>
                <div className="navta-question-card">
                  <span className="navta-status-pill">
                    {resolvedQuestionType ===
                    "short"
                      ? "Short Answer"
                      : "Long Answer"}
                  </span>

                  <h2 className="navta-question">
                    {
                      currentTestQuestion.question
                    }
                  </h2>

                  <p
                    style={{
                      color:
                        "#94a3b8",
                      marginTop:
                        "-15px",
                      marginBottom:
                        "18px",
                    }}
                  >
                    Maximum Marks:{" "}
                    {currentTestQuestion.maxMarks ||
                      "-"}
                  </p>

                  <textarea
                    className="navta-written-answer"
                    placeholder={
                      resolvedQuestionType ===
                      "short"
                        ? "Write your short answer here..."
                        : "Write your detailed answer here..."
                    }
                    value={
                      writtenAnswers[
                        currentQuestion
                      ] || ""
                    }
                    disabled={Boolean(
                      writtenFeedback[
                        currentQuestion
                      ]
                    )}
                    onChange={(e) => {
                      setWrittenAnswers(
                        (previous) => ({
                          ...previous,

                          [currentQuestion]:
                            e.target
                              .value,
                        })
                      );

                      setEvaluationError(
                        ""
                      );
                    }}
                  />

                  {!writtenFeedback[
                    currentQuestion
                  ] && (
                    <button
                      type="button"
                      disabled={
                        evaluatingAnswer
                      }
                      style={{
                        ...styles.startButton,
                        margin:
                          "20px 0 0",

                        opacity:
                          evaluatingAnswer
                            ? 0.65
                            : 1,
                      }}
                      onClick={
                        evaluateWrittenAnswer
                      }
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

                {writtenFeedback[
                  currentQuestion
                ] && (
                  <WrittenFeedback
                    feedback={
                      writtenFeedback[
                        currentQuestion
                      ]
                    }
                    onNext={
                      goForwardAfterAnswer
                    }
                    isLast={
                      currentQuestion ===
                      questions.length -
                        1
                    }
                  />
                )}
              </>
            )}
          </div>
        )}

      {/* ============================================
          RESULT
      ============================================ */}

      {step === "test" &&
        submitted && (
          <div className="navta-test-page">
            <div className="navta-result-card">
              <div
                style={
                  styles.resultIcon
                }
              >
                ✓
              </div>

              <h1>
                Test Completed!
              </h1>

              <p
                style={{
                  color:
                    "#94a3b8",
                }}
              >
                {subject} →{" "}
                {classLevel} →{" "}
                {chapter} →{" "}
                {difficulty}
              </p>

              {resolvedQuestionType ===
              "mcq" ? (
                <>
                  <div className="navta-result-score">
                    {mcqScore}/
                    {
                      questions.length
                    }
                  </div>

                  <p
                    style={{
                      color:
                        "#94a3b8",
                    }}
                  >
                    You answered{" "}
                    {mcqScore} of{" "}
                    {
                      questions.length
                    }{" "}
                    questions correctly.
                  </p>
                </>
              ) : (
                <>
                  <div className="navta-result-score">
                    {
                      writtenMarks.awarded
                    }
                    /
                    {
                      writtenMarks.maximum
                    }
                  </div>

                  <p
                    style={{
                      color:
                        "#94a3b8",
                    }}
                  >
                    AI-evaluated board
                    answer score
                  </p>
                </>
              )}

              <button
                type="button"
                style={
                  styles.startButton
                }
                onClick={
                  resetTest
                }
              >
                Take Another Test
              </button>

              <Link
                to="/dashboard"
                style={
                  styles.dashboardLink
                }
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
    </>
  );
}

function SummaryItem({
  label,
  value,
}) {
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
  const status =
    feedback?.status ||
    "incorrect";

  const className =
    status === "correct"
      ? "correct"
      : status ===
          "partially_correct"
        ? "partial"
        : "incorrect";

  const title =
    status === "correct"
      ? "✓ Correct"
      : status ===
          "partially_correct"
        ? "△ Partially Correct"
        : "✕ Incorrect";

  return (
    <div
      className={`navta-written-feedback ${className}`}
    >
      <h3
        style={{
          marginTop: 0,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "20px",
          fontWeight: 800,
        }}
      >
        Marks:{" "}
        {feedback?.marksAwarded ??
          0}
        /
        {feedback?.maxMarks ??
          0}
      </p>

      {feedback?.feedback && (
        <p
          style={{
            color:
              "#e2e8f0",
            lineHeight: 1.65,
          }}
        >
          <strong>
            AI Feedback:{" "}
          </strong>

          {
            feedback.feedback
          }
        </p>
      )}

      {Array.isArray(
        feedback?.missingPoints
      ) &&
        feedback.missingPoints
          .length > 0 && (
          <div
            style={{
              marginTop:
                "15px",
            }}
          >
            <strong>
              Points to improve:
            </strong>

            <ul
              style={{
                color:
                  "#cbd5e1",
                lineHeight:
                  1.7,
              }}
            >
              {feedback.missingPoints.map(
                (
                  point,
                  index
                ) => (
                  <li
                    key={`${point}-${index}`}
                  >
                    {point}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

      <button
        type="button"
        style={
          styles.nextButton
        }
        onClick={
          onNext
        }
      >
        {isLast
          ? "Finish Test"
          : "Next Question →"}
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
    border: "1px solid #334155",
    background: "#111827",
    color: "#ffffff",
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

  timer: {
    padding: "14px 22px",
    borderRadius: "12px",
    background: "#132238",
    color: "#00c6ff",
    fontSize: "24px",
    fontWeight: "800",
    whiteSpace: "nowrap",
  },

  dangerTimer: {
    background: "#451a1a",
    color: "#ff5555",
  },

  progress: {
    maxWidth: "1000px",
    margin: "0 auto 15px",
    color: "#94a3b8",
  },

  selectedOption: {
    border: "2px solid #079de0",
    background: "#102f49",
  },

  wrongOption: {
    border: "2px solid #ef4444",
    background: "#3f171c",
  },

  correctOption: {
    border: "2px solid #22c55e",
    background: "#123524",
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
    color: "#38bdf8",
    marginTop: "20px",
    textDecoration: "none",
  },
};
