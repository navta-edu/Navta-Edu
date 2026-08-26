import React, { useState } from "react";

const SUBJECT_EXAMS = {
  Physics: ["NEET", "JEE", "Boards"],
  Chemistry: ["NEET", "JEE", "Boards"],
  Maths: ["JEE", "Boards"],
  Biology: ["NEET", "Boards"],
};

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

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

const emptyForm = {
  subject: "",
  exam: "",
  classLevel: "",
  chapter: "",
  difficulty: "",
  questionType: "mcq",
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "",
  modelAnswer: "",
  keyPoints: "",
  maxMarks: "",
  evaluationInstructions: "",
  explanation: "",
};

export default function AdminNavtaTest() {
  const [form, setForm] = useState(emptyForm);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");

  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubjectChange = (value) => {
    setForm((previous) => ({
      ...previous,
      subject: value,
      exam: "",
      classLevel: "",
      chapter: "",
    }));

    setMessage("");
  };

  const handleClassChange = (value) => {
    setForm((previous) => ({
      ...previous,
      classLevel: value,
      chapter: "",
    }));
  };

  const handleExamChange = (value) => {
    setForm((previous) => ({
      ...previous,
      exam: value,
      questionType: value === "Boards" ? "mcq" : "mcq",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      modelAnswer: "",
      keyPoints: "",
      maxMarks: "",
      evaluationInstructions: "",
    }));
  };

  const availableExams = form.subject
    ? SUBJECT_EXAMS[form.subject] || []
    : [];

  const availableChapters =
    form.subject && form.classLevel
      ? CHAPTERS[form.subject]?.[form.classLevel] || []
      : [];

  const submitQuestion = async (event) => {
    event.preventDefault();

    setLoading(true);

    setMessage("");

    setMessageType("");

    try {
      const response = await fetch(
        "/api/navta-test/questions",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            subject: form.subject,
            exam: form.exam,
            classLevel: form.classLevel,
            chapter: form.chapter,
            difficulty: form.difficulty,
            questionType:
              form.exam === "Boards"
                ? form.questionType
                : "mcq",

            question: form.question.trim(),

            options:
              form.exam !== "Boards" ||
              form.questionType === "mcq"
                ? [
                    form.optionA.trim(),
                    form.optionB.trim(),
                    form.optionC.trim(),
                    form.optionD.trim(),
                  ]
                : [],

            correctAnswer:
              form.exam !== "Boards" ||
              form.questionType === "mcq"
                ? Number(form.correctAnswer)
                : undefined,

            modelAnswer:
              form.exam === "Boards" &&
              form.questionType !== "mcq"
                ? form.modelAnswer.trim()
                : "",

            keyPoints:
              form.exam === "Boards" &&
              form.questionType !== "mcq"
                ? form.keyPoints
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [],

            maxMarks:
              form.exam === "Boards" &&
              form.questionType !== "mcq"
                ? Number(form.maxMarks)
                : undefined,

            evaluationInstructions:
              form.exam === "Boards" &&
              form.questionType !== "mcq"
                ? form.evaluationInstructions.trim()
                : "",

            explanation: form.explanation.trim(),
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
            "Failed to add question. Please try again."
        );
      }

      setMessage("Question added successfully!");

      setMessageType("success");

      setForm(emptyForm);
    } catch (error) {
      console.error("Navta TEST admin error:", error);

      setMessage(
        error.message ||
          "Unable to add question."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-navta-test-page {
          min-height: 100vh;
          padding: 40px 24px;
          background: #0b1220;
          color: #ffffff;
        }

        .admin-navta-test-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .admin-navta-test-title {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
        }

        .admin-navta-test-subtitle {
          margin-top: 8px;
          margin-bottom: 32px;
          color: #94a3b8;
          line-height: 1.6;
        }

        .admin-navta-test-card {
          padding: 30px;
          border: 1px solid #243047;
          border-radius: 18px;
          background: #111827;
        }

        .admin-navta-form-section {
          margin-bottom: 30px;
        }

        .admin-navta-section-title {
          margin: 0 0 16px;
          font-size: 17px;
          color: #e2e8f0;
        }

        .admin-navta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .admin-navta-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-navta-field.full {
          grid-column: 1 / -1;
        }

        .admin-navta-label {
          font-size: 13px;
          font-weight: 700;
          color: #cbd5e1;
        }

        .admin-navta-input,
        .admin-navta-select,
        .admin-navta-textarea {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #334155;
          border-radius: 10px;
          outline: none;
          background: #0f172a;
          color: #ffffff;
          font-size: 15px;
          transition: border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .admin-navta-input:focus,
        .admin-navta-select:focus,
        .admin-navta-textarea:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
        }

        .admin-navta-select:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .admin-navta-textarea {
          min-height: 120px;
          resize: vertical;
          font-family: inherit;
        }

        .admin-navta-explanation {
          min-height: 100px;
        }

        .admin-navta-submit {
          width: 100%;
          margin-top: 6px;
          padding: 15px 20px;
          border: none;
          border-radius: 11px;
          background: #079de0;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s ease,
            background 0.2s ease;
        }

        .admin-navta-submit:hover:not(:disabled) {
          background: #0284c7;
          transform: translateY(-1px);
        }

        .admin-navta-submit:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .admin-navta-message {
          margin-top: 20px;
          padding: 14px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
        }

        .admin-navta-message.success {
          border: 1px solid rgba(34, 197, 94, 0.35);
          background: rgba(34, 197, 94, 0.12);
          color: #86efac;
        }

        .admin-navta-message.error {
          border: 1px solid rgba(239, 68, 68, 0.35);
          background: rgba(239, 68, 68, 0.12);
          color: #fca5a5;
        }

        .admin-navta-info {
          margin-bottom: 25px;
          padding: 14px 16px;
          border: 1px solid #243047;
          border-radius: 10px;
          background: #0f172a;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 700px) {
          .admin-navta-test-page {
            padding: 22px 14px;
          }

          .admin-navta-test-title {
            font-size: 26px;
          }

          .admin-navta-test-card {
            padding: 20px 15px;
          }

          .admin-navta-grid {
            grid-template-columns: 1fr;
          }

          .admin-navta-field.full {
            grid-column: auto;
          }
        }
      `}</style>

      <div className="admin-navta-test-page">
        <div className="admin-navta-test-container">

          <h1 className="admin-navta-test-title">
            Navta TEST - Admin
          </h1>

          <p className="admin-navta-test-subtitle">
            Add questions to the Navta TEST question bank.
            Questions will later be automatically matched
            with the student's subject, preparation,
            class, chapter and difficulty.
          </p>

          <div className="admin-navta-info">
            Select Subject → Preparation → Class → Chapter → Difficulty.
            For Boards, you can then choose MCQ, Short Answer or Long Answer.
            MCQ uses 1 minute/question, Short Answer uses 3 minutes/question,
            and Long Answer uses 6 minutes/question.
          </div>

          <div className="admin-navta-test-card">

            <form onSubmit={submitQuestion}>

              <div className="admin-navta-form-section">

                <h2 className="admin-navta-section-title">
                  Question Classification
                </h2>

                <div className="admin-navta-grid">

                  <div className="admin-navta-field">
                    <label className="admin-navta-label">
                      Subject
                    </label>

                    <select
                      className="admin-navta-select"
                      value={form.subject}
                      onChange={(e) =>
                        handleSubjectChange(
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Select Subject
                      </option>

                      {Object.keys(SUBJECT_EXAMS).map(
                        (subject) => (
                          <option
                            key={subject}
                            value={subject}
                          >
                            {subject}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="admin-navta-field">
                    <label className="admin-navta-label">
                      Preparation
                    </label>

                    <select
                      className="admin-navta-select"
                      value={form.exam}
                      onChange={(e) =>
                        handleExamChange(
                          e.target.value
                        )
                      }
                      disabled={!form.subject}
                      required
                    >
                      <option value="">
                        Select Preparation
                      </option>

                      {availableExams.map((exam) => (
                        <option
                          key={exam}
                          value={exam}
                        >
                          {exam}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-navta-field">
                    <label className="admin-navta-label">
                      Class
                    </label>

                    <select
                      className="admin-navta-select"
                      value={form.classLevel}
                      onChange={(e) =>
                        handleClassChange(
                          e.target.value
                        )
                      }
                      disabled={!form.subject}
                      required
                    >
                      <option value="">
                        Select Class
                      </option>

                      {CLASSES.map((item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-navta-field">
                    <label className="admin-navta-label">
                      Chapter
                    </label>

                    <select
                      className="admin-navta-select"
                      value={form.chapter}
                      onChange={(e) =>
                        updateField(
                          "chapter",
                          e.target.value
                        )
                      }
                      disabled={
                        !form.subject ||
                        !form.classLevel
                      }
                      required
                    >
                      <option value="">
                        Select Chapter
                      </option>

                      {availableChapters.map(
                        (chapter) => (
                          <option
                            key={chapter}
                            value={chapter}
                          >
                            {chapter}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="admin-navta-field full">
                    <label className="admin-navta-label">
                      Difficulty
                    </label>

                    <select
                      className="admin-navta-select"
                      value={form.difficulty}
                      onChange={(e) =>
                        updateField(
                          "difficulty",
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Select Difficulty
                      </option>

                      {DIFFICULTIES.map((level) => (
                        <option
                          key={level}
                          value={level}
                        >
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.exam === "Boards" && (
                    <div className="admin-navta-field full">
                      <label className="admin-navta-label">
                        Question Type
                      </label>

                      <select
                        className="admin-navta-select"
                        value={form.questionType}
                        onChange={(e) =>
                          updateField(
                            "questionType",
                            e.target.value
                          )
                        }
                        required
                      >
                        <option value="mcq">
                          MCQ / Option — 1 min per question
                        </option>
                        <option value="short">
                          Short Answer — 3 min per question
                        </option>
                        <option value="long">
                          Long Answer — 6 min per question
                        </option>
                      </select>
                    </div>
                  )}

                </div>
              </div>

              <div className="admin-navta-form-section">

                <h2 className="admin-navta-section-title">
                  Question
                </h2>

                <div className="admin-navta-grid">

                  <div className="admin-navta-field full">
                    <label className="admin-navta-label">
                      Question
                    </label>

                    <textarea
                      className="admin-navta-textarea"
                      placeholder="Enter the complete question"
                      value={form.question}
                      onChange={(e) =>
                        updateField(
                          "question",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  {(form.exam !== "Boards" ||
                    form.questionType === "mcq") && (
                    <>
                      <div className="admin-navta-field">
                        <label className="admin-navta-label">
                          Option A
                        </label>

                        <input
                          className="admin-navta-input"
                          placeholder="Enter Option A"
                          value={form.optionA}
                          onChange={(e) =>
                            updateField(
                              "optionA",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className="admin-navta-field">
                        <label className="admin-navta-label">
                          Option B
                        </label>

                        <input
                          className="admin-navta-input"
                          placeholder="Enter Option B"
                          value={form.optionB}
                          onChange={(e) =>
                            updateField(
                              "optionB",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className="admin-navta-field">
                        <label className="admin-navta-label">
                          Option C
                        </label>

                        <input
                          className="admin-navta-input"
                          placeholder="Enter Option C"
                          value={form.optionC}
                          onChange={(e) =>
                            updateField(
                              "optionC",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className="admin-navta-field">
                        <label className="admin-navta-label">
                          Option D
                        </label>

                        <input
                          className="admin-navta-input"
                          placeholder="Enter Option D"
                          value={form.optionD}
                          onChange={(e) =>
                            updateField(
                              "optionD",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>

                      <div className="admin-navta-field full">
                        <label className="admin-navta-label">
                          Correct Answer
                        </label>

                        <select
                          className="admin-navta-select"
                          value={form.correctAnswer}
                          onChange={(e) =>
                            updateField(
                              "correctAnswer",
                              e.target.value
                            )
                          }
                          required
                        >
                          <option value="">
                            Select Correct Answer
                          </option>

                          <option value="0">
                            Option A
                          </option>

                          <option value="1">
                            Option B
                          </option>

                          <option value="2">
                            Option C
                          </option>

                          <option value="3">
                            Option D
                          </option>
                        </select>
                      </div>
                    </>
                  )}

                  {form.exam === "Boards" &&
                    form.questionType !== "mcq" && (
                      <>
                        <div className="admin-navta-field full">
                          <label className="admin-navta-label">
                            Model Answer
                          </label>

                          <textarea
                            className="admin-navta-textarea"
                            placeholder="Enter the model / ideal answer"
                            value={form.modelAnswer}
                            onChange={(e) =>
                              updateField(
                                "modelAnswer",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div className="admin-navta-field full">
                          <label className="admin-navta-label">
                            Key Points
                          </label>

                          <textarea
                            className="admin-navta-textarea"
                            placeholder={
                              "Enter one key point per line\nExample:\nDefinition\nFormula\nCorrect unit"
                            }
                            value={form.keyPoints}
                            onChange={(e) =>
                              updateField(
                                "keyPoints",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div className="admin-navta-field">
                          <label className="admin-navta-label">
                            Maximum Marks
                          </label>

                          <input
                            type="number"
                            min="1"
                            className="admin-navta-input"
                            placeholder="e.g. 3 or 5"
                            value={form.maxMarks}
                            onChange={(e) =>
                              updateField(
                                "maxMarks",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div className="admin-navta-field">
                          <label className="admin-navta-label">
                            Evaluation Instructions
                          </label>

                          <input
                            className="admin-navta-input"
                            placeholder="Optional AI marking guidance"
                            value={
                              form.evaluationInstructions
                            }
                            onChange={(e) =>
                              updateField(
                                "evaluationInstructions",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </>
                    )}

                  <div className="admin-navta-field full">
                    <label className="admin-navta-label">
                      Explanation / Feedback
                    </label>

                    <textarea
                      className="admin-navta-textarea admin-navta-explanation"
                      placeholder={
                        form.exam === "Boards" &&
                        form.questionType !== "mcq"
                          ? "Feedback shown after AI evaluation"
                          : "Shown to the student only after a wrong MCQ answer"
                      }
                      value={form.explanation}
                      onChange={(e) =>
                        updateField(
                          "explanation",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                </div>
              </div>

              <button
                type="submit"
                className="admin-navta-submit"
                disabled={loading}
              >
                {loading
                  ? "Adding Question..."
                  : "Add Question"}
              </button>

            </form>

            {message && (
              <div
                className={`admin-navta-message ${messageType}`}
              >
                {message}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
