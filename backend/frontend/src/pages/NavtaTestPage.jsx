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

const BIOLOGY_CLASSES = {
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
};

const SUBJECTS = {
  Physics: [
    "Units and Measurements",
    "Kinematics",
    "Laws of Motion",
    "Work, Energy and Power",
    "Gravitation",
    "Thermodynamics",
    "Waves",
    "Current Electricity",
  ],

  Chemistry: [
    "Some Basic Concepts of Chemistry",
    "Atomic Structure",
    "Chemical Bonding",
    "Thermodynamics",
    "Equilibrium",
    "Redox Reactions",
    "Organic Chemistry",
    "Hydrocarbons",
  ],

  Maths: [
    "Sets and Relations",
    "Quadratic Equations",
    "Sequences and Series",
    "Trigonometry",
    "Straight Lines",
    "Limits and Derivatives",
    "Probability",
    "Statistics",
    "Inverse Trigonometry Functions",
  ],

  Biology: [],
};

const QUESTIONS = {
  Physics: {
    "Units and Measurements": {
      Easy: [
        {
          question: "What is the SI unit of length?",
          options: ["Centimetre", "Metre", "Kilometre", "Millimetre"],
          answer: 1,
        },
        {
          question:
            "Which instrument is commonly used to measure very small lengths?",
          options: [
            "Ruler",
            "Vernier calipers",
            "Thermometer",
            "Barometer",
          ],
          answer: 1,
        },
      ],

      Medium: [
        {
          question: "The dimensional formula of velocity is:",
          options: ["[LT⁻¹]", "[LT]", "[L²T⁻¹]", "[MLT⁻¹]"],
          answer: 0,
        },
      ],

      Hard: [
        {
          question: "Which quantity has dimensions [ML²T⁻²]?",
          options: ["Force", "Power", "Energy", "Pressure"],
          answer: 2,
        },
      ],
    },

    Kinematics: {
      Easy: [
        {
          question: "What is the SI unit of acceleration?",
          options: ["m/s", "m/s²", "km/h", "N"],
          answer: 1,
        },
      ],

      Medium: [
        {
          question: "The slope of a velocity-time graph represents:",
          options: ["Distance", "Displacement", "Acceleration", "Speed"],
          answer: 2,
        },
      ],

      Hard: [
        {
          question: "For uniformly accelerated motion, which equation is correct?",
          options: [
            "v = u + at",
            "v = u - at²",
            "s = ut²",
            "a = uv",
          ],
          answer: 0,
        },
      ],
    },
  },

  Chemistry: {
    "Atomic Structure": {
      Easy: [
        {
          question: "Who proposed the nuclear model of the atom?",
          options: ["Bohr", "Rutherford", "Dalton", "Thomson"],
          answer: 1,
        },
      ],

      Medium: [
        {
          question: "The maximum number of electrons in the second shell is:",
          options: ["2", "4", "8", "18"],
          answer: 2,
        },
      ],

      Hard: [
        {
          question: "The number of orbitals in a p-subshell is:",
          options: ["1", "2", "3", "5"],
          answer: 2,
        },
      ],
    },

    "Chemical Bonding": {
      Easy: [
        {
          question: "Which bond is formed by sharing electrons?",
          options: ["Ionic", "Covalent", "Metallic", "Hydrogen"],
          answer: 1,
        },
      ],

      Medium: [
        {
          question: "What is the shape of a methane molecule?",
          options: ["Linear", "Trigonal planar", "Tetrahedral", "Bent"],
          answer: 2,
        },
      ],

      Hard: [
        {
          question: "The hybridisation of carbon in methane is:",
          options: ["sp", "sp²", "sp³", "dsp²"],
          answer: 2,
        },
      ],
    },
  },

  Maths: {
    "Quadratic Equations": {
      Easy: [
        {
          question: "What is the degree of a quadratic equation?",
          options: ["1", "2", "3", "4"],
          answer: 1,
        },
      ],

      Medium: [
        {
          question: "The roots of x² - 5x + 6 = 0 are:",
          options: ["1, 6", "2, 3", "-2, -3", "3, 4"],
          answer: 1,
        },
      ],

      Hard: [
        {
          question: "For ax² + bx + c = 0, the discriminant is:",
          options: [
            "b² + 4ac",
            "b² - 4ac",
            "a² - 4bc",
            "c² - 4ab",
          ],
          answer: 1,
        },
      ],
    },

    Trigonometry: {
      Easy: [
        {
          question: "What is sin 90°?",
          options: ["0", "1", "-1", "1/2"],
          answer: 1,
        },
      ],

      Medium: [
        {
          question: "What is cos 0°?",
          options: ["0", "1", "-1", "1/2"],
          answer: 1,
        },
      ],

      Hard: [
        {
          question: "Which identity is correct?",
          options: [
            "sin²θ + cos²θ = 1",
            "sinθ + cosθ = 1",
            "tan²θ = sinθ",
            "cos²θ - sin²θ = 1",
          ],
          answer: 0,
        },
      ],
    },
  },

  Biology: {
    "The Living World": {
      Easy: [
        {
          question: "The basic unit of classification is:",
          options: ["Genus", "Species", "Family", "Order"],
          answer: 1,
        },
      ],

      Medium: [
        {
          question:
            "Which taxonomic category comes immediately above species?",
          options: ["Family", "Genus", "Order", "Class"],
          answer: 1,
        },
      ],

      Hard: [
        {
          question: "Binomial nomenclature was popularized by:",
          options: [
            "Charles Darwin",
            "Carolus Linnaeus",
            "Gregor Mendel",
            "Robert Hooke",
          ],
          answer: 1,
        },
      ],
    },
  },
};

function getQuestions(subject, chapter, difficulty) {
  const chapterQuestions = QUESTIONS[subject]?.[chapter]?.[difficulty];

  if (chapterQuestions?.length) {
    return chapterQuestions;
  }

  return [
    {
      question: `Sample ${difficulty} question for ${subject} - ${chapter}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      answer: 0,
    },
  ];
}

export default function NavtaTestPage() {
  const [step, setStep] = useState("subject");
  const [subject, setSubject] = useState("");
  const [preparation, setPreparation] = useState("");
  const [biologyClass, setBiologyClass] = useState("");
  const [chapter, setChapter] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [submitted, setSubmitted] = useState(false);

  const startTest = () => {
    const testQuestions = getQuestions(subject, chapter, difficulty);

    setQuestions(testQuestions);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(30 * 60);
    setSubmitted(false);
    setStep("test");
  };

  useEffect(() => {
    if (step !== "test" || submitted) return;

    if (timeLeft <= 0) {
      setSubmitted(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, submitted, timeLeft]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }, [timeLeft]);

  const selectAnswer = (answerIndex) => {
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion]: answerIndex,
    }));
  };

  const score = useMemo(() => {
    return questions.reduce((total, question, index) => {
      return total + (answers[index] === question.answer ? 1 : 0);
    }, 0);
  }, [answers, questions]);

  const resetTest = () => {
    setStep("subject");
    setSubject("");
    setPreparation("");
    setBiologyClass("");
    setChapter("");
    setDifficulty("");
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(30 * 60);
    setSubmitted(false);
  };

  const goToPreparation = () => {
    setPreparation("");
    setBiologyClass("");
    setChapter("");
    setDifficulty("");
    setStep("preparation");
  };

  const goToSubjects = () => {
    setSubject("");
    setPreparation("");
    setBiologyClass("");
    setChapter("");
    setDifficulty("");
    setStep("subject");
  };

  const goToChapter = () => {
    setChapter("");
    setDifficulty("");
    setStep("chapter");
  };

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
          font-size: 32px;
          line-height: 1.2;
          margin: 0;
        }

        .navta-subtitle {
          color: #94a3b8;
          margin-top: 8px;
          line-height: 1.5;
        }

        .navta-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .navta-preparation-grid {
          max-width: 900px;
          margin: 40px auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .navta-class-grid {
          max-width: 900px;
          margin: 40px auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .navta-chapter-grid {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .navta-difficulty-grid {
          max-width: 900px;
          margin: 40px auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
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

        .navta-navigation {
          max-width: 1000px;
          margin: 20px auto;
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .navta-result-card {
          max-width: 600px;
          margin: 100px auto;
          padding: 50px;
          border-radius: 20px;
          background: #151d2d;
          text-align: center;
        }

        @media (max-width: 768px) {
          .navta-test-page {
            padding: 20px 14px;
          }

          .navta-header {
            margin-bottom: 25px;
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }

          .navta-title {
            font-size: 27px;
          }

          .navta-subtitle {
            font-size: 14px;
            margin-bottom: 0;
          }

          .navta-back-button {
            width: 100%;
            text-align: center;
          }

          .navta-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .navta-preparation-grid {
            grid-template-columns: 1fr;
            gap: 14px;
            margin: 25px auto;
          }

          .navta-class-grid {
            grid-template-columns: 1fr;
            gap: 14px;
            margin: 25px auto;
          }

          .navta-chapter-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .navta-difficulty-grid {
            grid-template-columns: 1fr;
            gap: 14px;
            margin: 25px auto;
          }

          .navta-test-header {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }

          .navta-timer {
            width: 100%;
            text-align: center;
          }

          .navta-question-card {
            padding: 20px 15px;
            border-radius: 14px;
          }

          .navta-question {
            font-size: 19px !important;
            line-height: 1.5;
            word-break: break-word;
          }

          .navta-option {
            font-size: 14px !important;
            padding: 14px !important;
            line-height: 1.45;
            word-break: break-word;
          }

          .navta-navigation {
            flex-direction: column;
            gap: 10px;
          }

          .navta-navigation button {
            width: 100%;
          }

          .navta-result-card {
            margin: 40px auto;
            padding: 30px 18px;
          }

          .navta-score {
            font-size: 48px !important;
          }
        }

        @media (max-width: 400px) {
          .navta-test-page {
            padding: 16px 10px;
          }

          .navta-title {
            font-size: 24px;
          }

          .navta-subject-card,
          .navta-preparation-card,
          .navta-class-card {
            padding: 22px !important;
          }

          .navta-question-card {
            padding: 17px 12px;
          }

          .navta-option {
            gap: 10px !important;
            padding: 12px !important;
          }

          .navta-timer {
            font-size: 20px !important;
          }
        }
      `}</style>

      {step === "subject" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">Navta TEST</h1>

              <p className="navta-subtitle">
                Choose a subject to begin your test.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="navta-back-button"
              style={styles.backButton}
            >
              ← Dashboard
            </Link>
          </div>

          <div className="navta-grid">
            {Object.keys(SUBJECTS).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setSubject(item);
                  setPreparation("");
                  setBiologyClass("");
                  setChapter("");
                  setDifficulty("");
                  setStep("preparation");
                }}
                className="navta-subject-card"
                style={styles.subjectCard}
              >
                <div style={styles.subjectIcon}>
                  {item === "Physics" && "⚡"}
                  {item === "Chemistry" && "🧪"}
                  {item === "Maths" && "∑"}
                  {item === "Biology" && "🧬"}
                </div>

                <h2>{item}</h2>

                <p>
                  {item === "Biology"
                    ? "Choose NEET or Boards"
                    : `${SUBJECTS[item].length} chapters available`}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "preparation" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">{subject} Preparation</h1>

              <p className="navta-subtitle">
                What are you preparing for?
              </p>
            </div>

            <button
              onClick={goToSubjects}
              className="navta-back-button"
              style={styles.backButton}
            >
              ← Subjects
            </button>
          </div>

          <div className="navta-preparation-grid">
            {Object.entries(PREPARATION_OPTIONS[subject]).map(
              ([key, option]) => (
                <button
                  key={key}
                  onClick={() => {
                    setPreparation(key);

                    if (subject === "Biology") {
                      setBiologyClass("");
                      setStep("biologyClass");
                    } else {
                      setChapter("");
                      setStep("chapter");
                    }
                  }}
                  className="navta-preparation-card"
                  style={styles.preparationCard}
                >
                  <div style={styles.preparationIcon}>
                    {option.icon}
                  </div>

                  <h2>{option.title}</h2>

                  <p>{option.description}</p>

                  <span style={styles.continueText}>
                    Continue →
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {step === "biologyClass" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">Choose Class</h1>

              <p className="navta-subtitle">
                Biology → {preparation}
              </p>
            </div>

            <button
              onClick={goToPreparation}
              className="navta-back-button"
              style={styles.backButton}
            >
              ← Preparation
            </button>
          </div>

          <div className="navta-class-grid">
            {Object.entries(BIOLOGY_CLASSES).map(
              ([className, chapters]) => (
                <button
                  key={className}
                  onClick={() => {
                    setBiologyClass(className);
                    setChapter("");
                    setStep("chapter");
                  }}
                  className="navta-class-card"
                  style={styles.classCard}
                >
                  <div style={styles.classIcon}>🧬</div>

                  <h2>{className}</h2>

                  <p>{chapters.length} chapters</p>

                  <span style={styles.continueText}>
                    View Chapters →
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {step === "chapter" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">{subject}</h1>

              <p className="navta-subtitle">
                {subject === "Biology"
                  ? `${preparation} → ${biologyClass}`
                  : `${preparation} Preparation`}
              </p>
            </div>

            <button
              onClick={
                subject === "Biology"
                  ? () => setStep("biologyClass")
                  : goToPreparation
              }
              className="navta-back-button"
              style={styles.backButton}
            >
              ← Back
            </button>
          </div>

          <div className="navta-chapter-grid">
            {(subject === "Biology"
              ? BIOLOGY_CLASSES[biologyClass] || []
              : SUBJECTS[subject] || []
            ).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setChapter(item);
                  setDifficulty("");
                  setStep("difficulty");
                }}
                style={styles.chapterCard}
              >
                <span>{item}</span>
                <span>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "difficulty" && (
        <div className="navta-test-page">
          <div className="navta-header">
            <div>
              <h1 className="navta-title">Select Difficulty</h1>

              <p className="navta-subtitle">
                {subject}
                {subject === "Biology" ? ` → ${biologyClass}` : ""}
                {" → "}
                {chapter}
              </p>
            </div>

            <button
              onClick={goToChapter}
              className="navta-back-button"
              style={styles.backButton}
            >
              ← Chapters
            </button>
          </div>

          <div className="navta-difficulty-grid">
            {["Easy", "Medium", "Hard"].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                style={{
                  ...styles.difficultyCard,
                  ...(difficulty === level
                    ? styles.selectedDifficulty
                    : {}),
                }}
              >
                <h2>{level}</h2>
                <p>30 minute test</p>
              </button>
            ))}
          </div>

          <button
            disabled={!difficulty}
            onClick={startTest}
            style={{
              ...styles.startButton,
              opacity: difficulty ? 1 : 0.5,
            }}
          >
            Start Navta TEST →
          </button>
        </div>
      )}

      {step === "test" && !submitted && questions.length > 0 && (
        <div className="navta-test-page">
          <div className="navta-test-header">
            <div>
              <h1 className="navta-title">Navta TEST</h1>

              <p className="navta-subtitle">
                {subject} → {chapter} → {difficulty}
              </p>
            </div>

            <div
              className="navta-timer"
              style={{
                ...styles.timer,
                ...(timeLeft <= 60 ? styles.dangerTimer : {}),
              }}
            >
              ⏱ {formattedTime}
            </div>
          </div>

          <div style={styles.progress}>
            Question {currentQuestion + 1} of {questions.length}
          </div>

          <div className="navta-question-card">
            <h2 className="navta-question" style={styles.question}>
              {questions[currentQuestion].question}
            </h2>

            <div>
              {questions[currentQuestion].options.map(
                (option, index) => (
                  <button
                    key={option}
                    onClick={() => selectAnswer(index)}
                    className="navta-option"
                    style={{
                      ...styles.option,
                      ...(answers[currentQuestion] === index
                        ? styles.selectedOption
                        : {}),
                    }}
                  >
                    <span style={styles.optionLetter}>
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span>{option}</span>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="navta-navigation">
            <button
              disabled={currentQuestion === 0}
              onClick={() =>
                setCurrentQuestion(
                  (previous) => previous - 1
                )
              }
              style={{
                ...styles.navButton,
                opacity: currentQuestion === 0 ? 0.5 : 1,
              }}
            >
              ← Previous
            </button>

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentQuestion(
                    (previous) => previous + 1
                  )
                }
                style={styles.nextButton}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => setSubmitted(true)}
                style={styles.submitButton}
              >
                Submit Test
              </button>
            )}
          </div>
        </div>
      )}

      {step === "test" && submitted && (
        <div className="navta-test-page">
          <div className="navta-result-card">
            <div style={styles.resultIcon}>✓</div>

            <h1>Test Completed!</h1>

            <p style={styles.resultSubject}>
              {subject} → {chapter} → {difficulty}
            </p>

            <div className="navta-score" style={styles.score}>
              {score}/{questions.length}
            </div>

            <p style={styles.resultText}>
              You answered {score} question
              {score !== 1 ? "s" : ""} correctly.
            </p>

            <button
              onClick={resetTest}
              style={styles.startButton}
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
        </div>
      )}
    </>
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
  },

  subjectCard: {
    padding: "35px",
    borderRadius: "18px",
    border: "1px solid #243047",
    background: "#151d2d",
    color: "#ffffff",
    cursor: "pointer",
    textAlign: "left",
  },

  subjectIcon: {
    fontSize: "42px",
    marginBottom: "20px",
  },

  preparationCard: {
    padding: "35px",
    borderRadius: "18px",
    border: "1px solid #243047",
    background: "#151d2d",
    color: "#ffffff",
    cursor: "pointer",
    textAlign: "left",
  },

  preparationIcon: {
    fontSize: "45px",
    marginBottom: "15px",
  },

  classCard: {
    padding: "35px",
    borderRadius: "18px",
    border: "1px solid #243047",
    background: "#151d2d",
    color: "#ffffff",
    cursor: "pointer",
    textAlign: "left",
  },

  classIcon: {
    fontSize: "45px",
    marginBottom: "15px",
  },

  continueText: {
    display: "block",
    marginTop: "20px",
    color: "#38bdf8",
    fontWeight: "700",
  },

  chapterCard: {
    padding: "20px",
    minWidth: 0,
    borderRadius: "12px",
    border: "1px solid #243047",
    background: "#151d2d",
    color: "#ffffff",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "left",
    fontSize: "16px",
    gap: "12px",
    overflowWrap: "anywhere",
  },

  difficultyCard: {
    padding: "35px",
    borderRadius: "18px",
    border: "2px solid #334155",
    background: "#151d2d",
    color: "#ffffff",
    cursor: "pointer",
  },

  selectedDifficulty: {
    border: "2px solid #00a8ff",
    background: "#102a43",
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

  question: {
    fontSize: "22px",
    marginBottom: "30px",
  },

  option: {
    width: "100%",
    minWidth: 0,
    padding: "17px",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    overflowWrap: "anywhere",
  },

  selectedOption: {
    border: "2px solid #079de0",
    background: "#102f49",
  },

  optionLetter: {
    minWidth: "25px",
    flexShrink: 0,
    fontWeight: "800",
  },

  navButton: {
    padding: "13px 20px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#151d2d",
    color: "#ffffff",
    cursor: "pointer",
  },

  nextButton: {
    padding: "13px 24px",
    borderRadius: "10px",
    border: "none",
    background: "#079de0",
    color: "#ffffff",
    cursor: "pointer",
  },

  submitButton: {
    padding: "13px 24px",
    borderRadius: "10px",
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    cursor: "pointer",
  },

  resultIcon: {
    fontSize: "50px",
    color: "#22c55e",
  },

  resultSubject: {
    color: "#94a3b8",
  },

  score: {
    fontSize: "60px",
    fontWeight: "800",
    margin: "30px",
  },

  resultText: {
    color: "#94a3b8",
  },

  dashboardLink: {
    display: "block",
    color: "#38bdf8",
    marginTop: "20px",
    textDecoration: "none",
  },
};
