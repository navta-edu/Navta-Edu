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

const SUBJECTS = {
  Physics: {
    chapters: [
      "Units and Measurements",
      "Kinematics",
      "Laws of Motion",
      "Work, Energy and Power",
      "Gravitation",
      "Thermodynamics",
      "Waves",
      "Current Electricity",
    ],
  },
  Chemistry: {
    chapters: [
      "Some Basic Concepts of Chemistry",
      "Atomic Structure",
      "Chemical Bonding",
      "Thermodynamics",
      "Equilibrium",
      "Redox Reactions",
      "Organic Chemistry",
      "Hydrocarbons",
    ],
  },
  Maths: {
    chapters: [
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
  },
 Biology: {
  chapters: [
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
          question: "Which instrument is commonly used to measure very small lengths?",
          options: ["Ruler", "Vernier calipers", "Thermometer", "Barometer"],
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
        question: "Which taxonomic category comes immediately above species?",
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

  // Fallback question so every chapter can start a test.
  return [
    {
      question: `Sample ${difficulty} question for ${subject} - ${chapter}`,
      options: [
        "Option A",
        "Option B",
        "Option C",
        "Option D",
      ],
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
    setChapter("");
    setDifficulty("");
    setQuestions([]);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(30 * 60);
    setSubmitted(false);
  };

  if (step === "subject") {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Navta TEST</h1>
            <p style={styles.subtitle}>
              Choose a subject to begin your test.
            </p>
          </div>

          <Link to="/dashboard" style={styles.backButton}>
            ← Dashboard
          </Link>
        </div>

        <div style={styles.grid}>
          {Object.keys(SUBJECTS).map((item) => (
            <button
              key={item}
onClick={() => {
  setSubject(item);
  setPreparation("");
  setStep("preparation");
}}
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
                {SUBJECTS[item].chapters.length} chapters available
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

if (step === "preparation") {
  const options = PREPARATION_OPTIONS[subject];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {subject} Preparation
          </h1>

          <p style={styles.subtitle}>
            What are you preparing for?
          </p>
        </div>

        <button
          onClick={() => {
            setSubject("");
            setPreparation("");
            setStep("subject");
          }}
          style={styles.backButton}
        >
          ← Subjects
        </button>
      </div>

      <div style={styles.preparationGrid}>
        {Object.entries(options).map(([key, option]) => (
          <button
            key={key}
onClick={() => {
  setPreparation(key);

  if (subject === "Biology") {
    setStep("biologyClass");
  } else {
    setStep("chapter");
  }
}}
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
        ))}
      </div>
    </div>
  );
}
if (step === "chapter") {
  return (
    <div>
      <h1 style={styles.title}>
        {subject}
      </h1>

      <p style={styles.subtitle}>
        {subject === "Biology"
          ? `${preparation} → ${biologyClass}`
          : `${preparation} Preparation`}
      </p>

      <div style={styles.classGrid}>
        {/* Your chapter buttons/content go here */}
      </div>

      <button
        onClick={() => {
          setPreparation("");
          setBiologyClass("");
          setStep("preparation");
        }}
        style={styles.backButton}
      >
        ← Back
      </button>
    </div>
  );
}
<div>
        <button
          onClick={() => {
            setPreparation("");
            setBiologyClass("");
            setStep("preparation");
          }}
          style={styles.backButton}
        >
          ← Preparation
        </button>
      </div>

      <div style={styles.classGrid}>
        {Object.keys(BIOLOGY_CLASSES).map((className) => (
          <button
            key={className}
            onClick={() => {
              setBiologyClass(className);
              setStep("chapter");
            }}
            style={styles.classCard}
          >
            <div style={styles.classIcon}>
              🧬
            </div>

            <h2>{className}</h2>

            <p>
              {BIOLOGY_CLASSES[className].length} chapters
            </p>

            <span style={styles.continueText}>
              View Chapters →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
<h1 style={styles.title}>{subject}</h1>

<p style={styles.subtitle}>
  {preparation
    ? `${preparation} Preparation`
    : "Select a chapter."}
</p>
          </div>

          <button
            onClick={() => setStep("subject")}
            style={styles.backButton}
          >
            ← Subjects
          </button>
        </div>

        <div style={styles.chapterGrid}>
          {subject === "Biology"
  ? BIOLOGY_CLASSES[biologyClass].map((item) => (
      <button
        key={item}
        onClick={() => {
          setChapter(item);
          setStep("difficulty");
        }}
        style={styles.chapterCard}
      >
        {item}
        <span>→</span>
      </button>
    ))
  : SUBJECTS[subject].chapters.map((item) => (
      <button
        key={item}
        onClick={() => {
          setChapter(item);
          setStep("difficulty");
        }}
        style={styles.chapterCard}
      >
        {item}
        <span>→</span>
      </button>
    ))}
            <button
              key={item}
              onClick={() => {
                setChapter(item);
                setStep("difficulty");
              }}
              style={styles.chapterCard}
            >
              {item}
              <span>→</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "difficulty") {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Select Difficulty</h1>
            <p style={styles.subtitle}>
              {subject} → {chapter}
            </p>
          </div>
        </div>

        <div style={styles.difficultyGrid}>
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
    );
  }

  if (step === "test" && !submitted) {
    const question = questions[currentQuestion];

    return (
      <div style={styles.page}>
        <div style={styles.testHeader}>
          <div>
            <h1 style={styles.title}>Navta TEST</h1>
            <p style={styles.subtitle}>
              {subject} → {chapter} → {difficulty}
            </p>
          </div>

          <div
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

        <div style={styles.questionCard}>
          <h2 style={styles.question}>
            {question.question}
          </h2>

          <div>
            {question.options.map((option, index) => (
              <button
                key={option}
                onClick={() => selectAnswer(index)}
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

                {option}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.navigation}>
          <button
            disabled={currentQuestion === 0}
            onClick={() =>
              setCurrentQuestion((previous) => previous - 1)
            }
            style={styles.navButton}
          >
            ← Previous
          </button>

          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={() =>
                setCurrentQuestion((previous) => previous + 1)
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
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.resultCard}>
        <div style={styles.resultIcon}>✓</div>

        <h1>Test Completed!</h1>

        <p style={styles.resultSubject}>
          {subject} → {chapter} → {difficulty}
        </p>

        <div style={styles.score}>
          {score}/{questions.length}
        </div>

        <p style={styles.resultText}>
          You answered {score} question
          {score !== 1 ? "s" : ""} correctly.
        </p>

        <button onClick={resetTest} style={styles.startButton}>
          Take Another Test
        </button>

        <Link to="/dashboard" style={styles.dashboardLink}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    color: "#ffffff",
    padding: "40px",
    boxSizing: "border-box",
  },

  header: {
    maxWidth: "1100px",
    margin: "0 auto 35px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  title: {
    fontSize: "32px",
    margin: 0,
  },

  subtitle: {
    color: "#94a3b8",
    marginTop: "8px",
  },

  backButton: {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    cursor: "pointer",
  },

classGrid: {
  maxWidth: "900px",
  margin: "40px auto",
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "24px",
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

  grid: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
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

  preparationGrid: {
  maxWidth: "900px",
  margin: "40px auto",
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "24px",
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

  preparationGrid: {
  maxWidth: "900px",
  margin: "40px auto",
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "24px",
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

preparationGrid: {
  maxWidth: "900px",
  margin: "40px auto",
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "24px",
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

continueText: {
  display: "block",
  marginTop: "20px",
  color: "#38bdf8",
  fontWeight: "700",
},

continueText: {
  display: "block",
  marginTop: "20px",
  color: "#38bdf8",
  fontWeight: "700",
},

continueText: {
  display: "block",
  marginTop: "20px",
  color: "#38bdf8",
  fontWeight: "700",
},
  chapterGrid: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
  },

  chapterCard: {
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #243047",
    background: "#151d2d",
    color: "#ffffff",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    textAlign: "left",
    fontSize: "16px",
  },

  difficultyGrid: {
    maxWidth: "900px",
    margin: "40px auto",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
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

  testHeader: {
    maxWidth: "1000px",
    margin: "0 auto 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  timer: {
    padding: "14px 22px",
    borderRadius: "12px",
    background: "#132238",
    color: "#00c6ff",
    fontSize: "24px",
    fontWeight: "800",
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

  questionCard: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "35px",
    borderRadius: "18px",
    background: "#151d2d",
    border: "1px solid #243047",
  },

  question: {
    fontSize: "22px",
    marginBottom: "30px",
  },

  option: {
    width: "100%",
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
  },

  selectedOption: {
    border: "2px solid #079de0",
    background: "#102f49",
  },

  optionLetter: {
    fontWeight: "800",
  },

  navigation: {
    maxWidth: "1000px",
    margin: "20px auto",
    display: "flex",
    justifyContent: "space-between",
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

  resultCard: {
    maxWidth: "600px",
    margin: "100px auto",
    padding: "50px",
    borderRadius: "20px",
    background: "#151d2d",
    textAlign: "center",
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
