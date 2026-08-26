import React, {
  useMemo,
  useState
} from "react";

// =====================================================
// NAVTA CLASSIFICATION DATA
// =====================================================

const SUBJECT_EXAMS = {
  Physics: ["NEET", "JEE", "Boards"],
  Chemistry: ["NEET", "JEE", "Boards"],
  Maths: ["JEE", "Boards"],
  Biology: ["NEET", "Boards"],
};

const DIFFICULTIES = [
  "Easy",
  "Medium",
  "Hard",
];

const CLASSES = [
  "Class 11",
  "Class 12",
];

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

// =====================================================
// EMPTY MANUAL QUESTION FORM
// =====================================================

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

// =====================================================
// EMPTY AI IMPORT HINTS
// =====================================================

const emptyImportHints = {
  subject: "",
  exam: "",
  classLevel: "",
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function AdminNavtaTest() {
  // ===================================================
  // MANUAL QUESTION STATE
  // ===================================================

  const [form, setForm] =
    useState(emptyForm);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // ===================================================
  // AI IMPORT STATE
  // ===================================================

  const [importFile, setImportFile] =
    useState(null);

  const [
    importHints,
    setImportHints
  ] = useState(
    emptyImportHints
  );

  const [
    importLoading,
    setImportLoading
  ] = useState(false);

  const [
    approveLoading,
    setApproveLoading
  ] = useState(false);

  const [
    importMessage,
    setImportMessage
  ] = useState("");

  const [
    importMessageType,
    setImportMessageType
  ] = useState("");

  const [
    acceptedQuestions,
    setAcceptedQuestions
  ] = useState([]);

  const [
    droppedQuestions,
    setDroppedQuestions
  ] = useState([]);

  const [
    importSummary,
    setImportSummary
  ] = useState({
    detected: 0,
    accepted: 0,
    dropped: 0,
  });

  const [
    activeImportTab,
    setActiveImportTab
  ] = useState("accepted");

  // ===================================================
  // MANUAL FORM HELPERS
  // ===================================================

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubjectChange = (
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      subject: value,
      exam: "",
      classLevel: "",
      chapter: "",
    }));

    setMessage("");
  };

  const handleClassChange = (
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      classLevel: value,
      chapter: "",
    }));
  };

  const handleExamChange = (
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      exam: value,
      questionType: "mcq",
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

  const availableExams =
    form.subject
      ? SUBJECT_EXAMS[
          form.subject
        ] || []
      : [];

  const availableChapters =
    form.subject &&
    form.classLevel
      ? CHAPTERS[
          form.subject
        ]?.[
          form.classLevel
        ] || []
      : [];

  // ===================================================
  // MANUAL QUESTION SUBMIT
  // ===================================================

  const submitQuestion =
    async (event) => {
      event.preventDefault();

      setLoading(true);
      setMessage("");
      setMessageType("");

      try {
        const response =
          await fetch(
            "/api/navta-test/questions",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  subject:
                    form.subject,

                  exam:
                    form.exam,

                  classLevel:
                    form.classLevel,

                  chapter:
                    form.chapter,

                  difficulty:
                    form.difficulty,

                  questionType:
                    form.exam ===
                    "Boards"
                      ? form.questionType
                      : "mcq",

                  question:
                    form.question.trim(),

                  options:
                    form.exam !==
                      "Boards" ||
                    form.questionType ===
                      "mcq"
                      ? [
                          form.optionA.trim(),
                          form.optionB.trim(),
                          form.optionC.trim(),
                          form.optionD.trim(),
                        ]
                      : [],

                  correctAnswer:
                    form.exam !==
                      "Boards" ||
                    form.questionType ===
                      "mcq"
                      ? Number(
                          form.correctAnswer
                        )
                      : undefined,

                  modelAnswer:
                    form.exam ===
                      "Boards" &&
                    form.questionType !==
                      "mcq"
                      ? form.modelAnswer.trim()
                      : "",

                  keyPoints:
                    form.exam ===
                      "Boards" &&
                    form.questionType !==
                      "mcq"
                      ? form.keyPoints
                          .split(
                            "\n"
                          )
                          .map(
                            (
                              item
                            ) =>
                              item.trim()
                          )
                          .filter(
                            Boolean
                          )
                      : [],

                  maxMarks:
                    form.exam ===
                      "Boards" &&
                    form.questionType !==
                      "mcq"
                      ? Number(
                          form.maxMarks
                        )
                      : undefined,

                  evaluationInstructions:
                    form.exam ===
                      "Boards" &&
                    form.questionType !==
                      "mcq"
                      ? form.evaluationInstructions.trim()
                      : "",

                  explanation:
                    form.explanation.trim(),
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
              "Failed to add question. Please try again."
          );
        }

        setMessage(
          "Question added successfully!"
        );

        setMessageType(
          "success"
        );

        setForm(
          emptyForm
        );
      } catch (error) {
        console.error(
          "Navta TEST admin error:",
          error
        );

        setMessage(
          error.message ||
            "Unable to add question."
        );

        setMessageType(
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

  // ===================================================
  // AI IMPORT HELPERS
  // ===================================================

  const updateImportHint = (
    field,
    value
  ) => {
    setImportHints(
      (previous) => {
        if (
          field ===
          "subject"
        ) {
          return {
            ...previous,
            subject:
              value,
            exam: "",
          };
        }

        return {
          ...previous,
          [field]:
            value,
        };
      }
    );
  };

  const availableImportExams =
    importHints.subject
      ? SUBJECT_EXAMS[
          importHints.subject
        ] || []
      : [];

  // ===================================================
  // AI ANALYZE FILE
  // ===================================================

  const analyzeImportFile =
    async () => {
      if (!importFile) {
        setImportMessage(
          "Please choose a PDF, DOCX or TXT file."
        );

        setImportMessageType(
          "error"
        );

        return;
      }

      setImportLoading(true);

      setImportMessage("");

      setImportMessageType(
        ""
      );

      setAcceptedQuestions(
        []
      );

      setDroppedQuestions(
        []
      );

      setImportSummary({
        detected: 0,
        accepted: 0,
        dropped: 0,
      });

      try {
        const formData =
          new FormData();

        formData.append(
          "file",
          importFile
        );

        if (
          importHints.subject
        ) {
          formData.append(
            "subject",
            importHints.subject
          );
        }

        if (
          importHints.exam
        ) {
          formData.append(
            "exam",
            importHints.exam
          );
        }

        if (
          importHints.classLevel
        ) {
          formData.append(
            "classLevel",
            importHints.classLevel
          );
        }

        const response =
          await fetch(
            "/api/navta-test/import",
            {
              method:
                "POST",

              body:
                formData,
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
              "AI analysis failed."
          );
        }

        const accepted =
          Array.isArray(
            data.acceptedQuestions
          )
            ? data.acceptedQuestions
            : [];

        const dropped =
          Array.isArray(
            data.droppedQuestions
          )
            ? data.droppedQuestions
            : [];

        setAcceptedQuestions(
          accepted
        );

        setDroppedQuestions(
          dropped
        );

        setImportSummary({
          detected:
            data.summary
              ?.detected ??
            accepted.length +
              dropped.length,

          accepted:
            data.summary
              ?.accepted ??
            accepted.length,

          dropped:
            data.summary
              ?.dropped ??
            dropped.length,
        });

        setActiveImportTab(
          accepted.length > 0
            ? "accepted"
            : "dropped"
        );

        setImportMessage(
          data.message ||
            "AI analysis completed."
        );

        setImportMessageType(
          "success"
        );
      } catch (error) {
        console.error(
          "NAVTA AI import error:",
          error
        );

        setImportMessage(
          error.message ||
            "Unable to analyse the uploaded file."
        );

        setImportMessageType(
          "error"
        );
      } finally {
        setImportLoading(
          false
        );
      }
    };

  // ===================================================
  // UPDATE ACCEPTED AI QUESTION
  // ===================================================

  const updateAcceptedQuestion =
    (
      index,
      field,
      value
    ) => {
      setAcceptedQuestions(
        (previous) =>
          previous.map(
            (
              question,
              questionIndex
            ) => {
              if (
                questionIndex !==
                index
              ) {
                return question;
              }

              let updated = {
                ...question,
                [field]: value,
              };

              if (
                field ===
                "subject"
              ) {
                updated = {
                  ...updated,
                  exam: "",
                  classLevel:
                    "",
                  chapter: "",
                };
              }

              if (
                field ===
                "classLevel"
              ) {
                updated = {
                  ...updated,
                  chapter: "",
                };
              }

              if (
                field ===
                  "exam" &&
                value !==
                  "Boards"
              ) {
                updated = {
                  ...updated,
                  questionType:
                    "mcq",
                  modelAnswer:
                    "",
                  keyPoints:
                    [],
                };
              }

              return updated;
            }
          )
      );
    };

  // ===================================================
  // UPDATE AI OPTION
  // ===================================================

  const updateAcceptedOption =
    (
      questionIndex,
      optionIndex,
      value
    ) => {
      setAcceptedQuestions(
        (previous) =>
          previous.map(
            (
              question,
              index
            ) => {
              if (
                index !==
                questionIndex
              ) {
                return question;
              }

              const options =
                Array.isArray(
                  question.options
                )
                  ? [
                      ...question.options,
                    ]
                  : [
                      "",
                      "",
                      "",
                      "",
                    ];

              options[
                optionIndex
              ] = value;

              return {
                ...question,
                options,
              };
            }
          )
      );
    };

  // ===================================================
  // REMOVE ACCEPTED QUESTION
  // ===================================================

  const removeAcceptedQuestion =
    (index) => {
      const removed =
        acceptedQuestions[
          index
        ];

      setAcceptedQuestions(
        (previous) =>
          previous.filter(
            (
              _,
              questionIndex
            ) =>
              questionIndex !==
              index
          )
      );

      setDroppedQuestions(
        (previous) => [
          ...previous,
          {
            ...removed,
            drop: true,
            dropReason:
              "Removed manually by admin during review.",
          },
        ]
      );

      setImportSummary(
        (previous) => ({
          detected:
            previous.detected,

          accepted:
            Math.max(
              0,
              previous.accepted -
                1
            ),

          dropped:
            previous.dropped +
            1,
        })
      );
    };

  // ===================================================
  // APPROVE ACCEPTED QUESTIONS
  // ===================================================

  const approveAcceptedQuestions =
    async () => {
      if (
        acceptedQuestions.length ===
        0
      ) {
        setImportMessage(
          "There are no accepted questions to approve."
        );

        setImportMessageType(
          "error"
        );

        return;
      }

      setApproveLoading(
        true
      );

      setImportMessage(
        ""
      );

      try {
        const response =
          await fetch(
            "/api/navta-test/import/confirm",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  questions:
                    acceptedQuestions,
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
              "Failed to import approved questions."
          );
        }

        const rejected =
          Array.isArray(
            data.rejectedQuestions
          )
            ? data.rejectedQuestions
            : [];

        if (
          rejected.length > 0
        ) {
          setDroppedQuestions(
            (previous) => [
              ...previous,
              ...rejected.map(
                (item) => ({
                  question:
                    item.question ||
                    "",

                  drop: true,

                  dropReason:
                    item.reason ||
                    "Rejected during final validation.",
                })
              ),
            ]
          );
        }

        setAcceptedQuestions(
          []
        );

        setImportSummary(
          (previous) => ({
            detected:
              previous.detected,

            accepted: 0,

            dropped:
              previous.dropped +
              rejected.length,
          })
        );

        setImportMessage(
          data.message ||
            "Questions imported successfully."
        );

        setImportMessageType(
          "success"
        );
      } catch (error) {
        console.error(
          "NAVTA AI confirm error:",
          error
        );

        setImportMessage(
          error.message ||
            "Unable to import approved questions."
        );

        setImportMessageType(
          "error"
        );
      } finally {
        setApproveLoading(
          false
        );
      }
    };

  // ===================================================
  // RESET AI IMPORT
  // ===================================================

  const resetAIImport = () => {
    setImportFile(
      null
    );

    setImportHints(
      emptyImportHints
    );

    setAcceptedQuestions(
      []
    );

    setDroppedQuestions(
      []
    );

    setImportSummary({
      detected: 0,
      accepted: 0,
      dropped: 0,
    });

    setImportMessage(
      ""
    );

    setImportMessageType(
      ""
    );

    setActiveImportTab(
      "accepted"
    );
  };

  // ===================================================
  // IMPORT REVIEW AVAILABLE?
  // ===================================================

  const hasImportResults =
    useMemo(
      () =>
        acceptedQuestions.length >
          0 ||
        droppedQuestions.length >
          0 ||
        importSummary.detected >
          0,
      [
        acceptedQuestions,
        droppedQuestions,
        importSummary,
      ]
    );

  // ===================================================
  // RENDER
  // ===================================================

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
          max-width: 1100px;
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
          margin-bottom: 28px;
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

        .admin-navta-grid.three {
          grid-template-columns: repeat(3, minmax(0, 1fr));
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
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .admin-navta-input:focus,
        .admin-navta-select:focus,
        .admin-navta-textarea:focus {
          border-color: #0ea5e9;
          box-shadow:
            0 0 0 3px rgba(14, 165, 233, 0.12);
        }

        .admin-navta-select:disabled,
        .admin-navta-input:disabled {
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
          transition:
            transform 0.2s ease,
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

        .admin-navta-secondary-button {
          padding: 12px 18px;
          border: 1px solid #334155;
          border-radius: 10px;
          background: #0f172a;
          color: #cbd5e1;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-navta-secondary-button:hover {
          border-color: #0ea5e9;
          color: #ffffff;
        }

        .admin-navta-danger-button {
          padding: 9px 12px;
          border: 1px solid rgba(239, 68, 68, 0.35);
          border-radius: 9px;
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          font-weight: 700;
          cursor: pointer;
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

        .admin-navta-ai-card {
          position: relative;
          overflow: hidden;
          border-color: rgba(14, 165, 233, 0.35);
          background:
            radial-gradient(
              circle at top right,
              rgba(14, 165, 233, 0.14),
              transparent 35%
            ),
            #111827;
        }

        .admin-navta-ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(14, 165, 233, 0.12);
          color: #7dd3fc;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .admin-navta-file-box {
          padding: 18px;
          border: 1px dashed #475569;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.72);
        }

        .admin-navta-file-input {
          width: 100%;
          color: #cbd5e1;
        }

        .admin-navta-file-name {
          margin-top: 10px;
          color: #7dd3fc;
          font-size: 13px;
          font-weight: 700;
        }

        .admin-navta-import-actions {
          display: flex;
          gap: 12px;
          margin-top: 18px;
          flex-wrap: wrap;
        }

        .admin-navta-ai-button {
          flex: 1;
          min-width: 220px;
          padding: 14px 18px;
          border: none;
          border-radius: 11px;
          background:
            linear-gradient(
              135deg,
              #0284c7,
              #7c3aed
            );
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .admin-navta-ai-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .admin-navta-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 22px;
        }

        .admin-navta-summary-box {
          padding: 16px;
          border: 1px solid #334155;
          border-radius: 12px;
          background: #0f172a;
          text-align: center;
        }

        .admin-navta-summary-label {
          margin: 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          font-weight: 800;
        }

        .admin-navta-summary-value {
          margin: 6px 0 0;
          font-size: 24px;
          font-weight: 900;
          color: #ffffff;
        }

        .admin-navta-summary-value.accepted {
          color: #4ade80;
        }

        .admin-navta-summary-value.dropped {
          color: #fb7185;
        }

        .admin-navta-tabs {
          display: flex;
          gap: 8px;
          margin-top: 24px;
          border-bottom: 1px solid #334155;
          overflow-x: auto;
        }

        .admin-navta-tab {
          padding: 11px 14px;
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: #94a3b8;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .admin-navta-tab.active {
          color: #ffffff;
          border-bottom-color: #0ea5e9;
        }

        .admin-navta-review-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 20px;
        }

        .admin-navta-review-question {
          padding: 20px;
          border: 1px solid #334155;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.72);
        }

        .admin-navta-review-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .admin-navta-review-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 30px;
          height: 30px;
          padding: 0 8px;
          border-radius: 9px;
          background: #0284c7;
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
        }

        .admin-navta-review-text {
          margin: 0;
          flex: 1;
          color: #f8fafc;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.6;
        }

        .admin-navta-option-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .admin-navta-drop-card {
          padding: 18px;
          border: 1px solid rgba(239, 68, 68, 0.28);
          border-radius: 13px;
          background: rgba(127, 29, 29, 0.12);
        }

        .admin-navta-drop-question {
          margin: 0;
          color: #f8fafc;
          font-weight: 700;
          line-height: 1.6;
        }

        .admin-navta-drop-reason {
          margin: 10px 0 0;
          color: #fca5a5;
          font-size: 13px;
          line-height: 1.5;
        }

        .admin-navta-approve {
          width: 100%;
          margin-top: 22px;
          padding: 15px 18px;
          border: none;
          border-radius: 11px;
          background: #16a34a;
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
        }

        .admin-navta-approve:hover:not(:disabled) {
          background: #15803d;
        }

        .admin-navta-approve:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .admin-navta-empty-state {
          padding: 30px;
          text-align: center;
          color: #64748b;
          border: 1px dashed #334155;
          border-radius: 12px;
          margin-top: 18px;
        }

        @media (max-width: 800px) {
          .admin-navta-grid,
          .admin-navta-grid.three,
          .admin-navta-summary-grid,
          .admin-navta-option-grid {
            grid-template-columns: 1fr;
          }

          .admin-navta-field.full {
            grid-column: auto;
          }

          .admin-navta-review-header {
            flex-direction: column;
          }
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
        }
      `}</style>

      <div className="admin-navta-test-page">
        <div className="admin-navta-test-container">

          <h1 className="admin-navta-test-title">
            Navta TEST - Admin
          </h1>

          <p className="admin-navta-test-subtitle">
            Add questions manually or upload a PDF, DOCX or TXT file and let NAVTA AI classify, explain and organise the questions automatically.
          </p>

          {/* =================================================
              AI IMPORT
          ================================================= */}

          <div className="admin-navta-test-card admin-navta-ai-card">

            <div className="admin-navta-ai-badge">
              ✨ NAVTA AI QUESTION IMPORT
            </div>

            <h2 className="admin-navta-section-title">
              Upload Question File
            </h2>

            <div className="admin-navta-info">
              NAVTA AI will detect questions, assign Subject → Preparation → Class → Chapter → Difficulty, detect MCQ / Short / Long type, add answers and explanations, and drop questions that do not belong to an approved NAVTA chapter.
            </div>

            <div className="admin-navta-file-box">

              <label className="admin-navta-label">
                Select PDF, DOCX or TXT
              </label>

              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="admin-navta-file-input"
                onChange={(event) => {
                  const file =
                    event.target.files?.[0] ||
                    null;

                  setImportFile(
                    file
                  );

                  setImportMessage(
                    ""
                  );
                }}
              />

              {importFile && (
                <div className="admin-navta-file-name">
                  Selected: {importFile.name}
                </div>
              )}
            </div>

            <div
              className="admin-navta-grid three"
              style={{
                marginTop: "18px",
              }}
            >

              <div className="admin-navta-field">
                <label className="admin-navta-label">
                  Subject Hint
                </label>

                <select
                  className="admin-navta-select"
                  value={
                    importHints.subject
                  }
                  onChange={(event) =>
                    updateImportHint(
                      "subject",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Auto Detect
                  </option>

                  {Object.keys(
                    SUBJECT_EXAMS
                  ).map(
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
                  Preparation Hint
                </label>

                <select
                  className="admin-navta-select"
                  value={
                    importHints.exam
                  }
                  onChange={(event) =>
                    updateImportHint(
                      "exam",
                      event.target.value
                    )
                  }
                  disabled={
                    !importHints.subject
                  }
                >
                  <option value="">
                    Auto Detect
                  </option>

                  {availableImportExams.map(
                    (exam) => (
                      <option
                        key={exam}
                        value={exam}
                      >
                        {exam}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="admin-navta-field">
                <label className="admin-navta-label">
                  Class Hint
                </label>

                <select
                  className="admin-navta-select"
                  value={
                    importHints.classLevel
                  }
                  onChange={(event) =>
                    updateImportHint(
                      "classLevel",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Auto Detect
                  </option>

                  {CLASSES.map(
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

            </div>

            <div className="admin-navta-import-actions">

              <button
                type="button"
                className="admin-navta-ai-button"
                onClick={
                  analyzeImportFile
                }
                disabled={
                  importLoading ||
                  !importFile
                }
              >
                {importLoading
                  ? "NAVTA AI is analysing..."
                  : "Analyse with NAVTA AI"}
              </button>

              <button
                type="button"
                className="admin-navta-secondary-button"
                onClick={
                  resetAIImport
                }
              >
                Reset Import
              </button>

            </div>

            {importMessage && (
              <div
                className={`admin-navta-message ${importMessageType}`}
              >
                {importMessage}
              </div>
            )}

            {/* =============================================
                IMPORT SUMMARY
            ============================================= */}

            {hasImportResults && (
              <>
                <div className="admin-navta-summary-grid">

                  <div className="admin-navta-summary-box">
                    <p className="admin-navta-summary-label">
                      Detected
                    </p>

                    <p className="admin-navta-summary-value">
                      {
                        importSummary.detected
                      }
                    </p>
                  </div>

                  <div className="admin-navta-summary-box">
                    <p className="admin-navta-summary-label">
                      Accepted
                    </p>

                    <p className="admin-navta-summary-value accepted">
                      {
                        acceptedQuestions.length
                      }
                    </p>
                  </div>

                  <div className="admin-navta-summary-box">
                    <p className="admin-navta-summary-label">
                      Dropped
                    </p>

                    <p className="admin-navta-summary-value dropped">
                      {
                        droppedQuestions.length
                      }
                    </p>
                  </div>

                </div>

                <div className="admin-navta-tabs">

                  <button
                    type="button"
                    className={`admin-navta-tab ${
                      activeImportTab ===
                      "accepted"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setActiveImportTab(
                        "accepted"
                      )
                    }
                  >
                    Accepted Questions (
                    {
                      acceptedQuestions.length
                    }
                    )
                  </button>

                  <button
                    type="button"
                    className={`admin-navta-tab ${
                      activeImportTab ===
                      "dropped"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setActiveImportTab(
                        "dropped"
                      )
                    }
                  >
                    Dropped Questions (
                    {
                      droppedQuestions.length
                    }
                    )
                  </button>

                </div>

                {/* =========================================
                    ACCEPTED QUESTIONS
                ========================================= */}

                {activeImportTab ===
                  "accepted" && (
                  <>
                    {acceptedQuestions.length ===
                    0 ? (
                      <div className="admin-navta-empty-state">
                        No accepted questions are waiting for approval.
                      </div>
                    ) : (
                      <div className="admin-navta-review-list">

                        {acceptedQuestions.map(
                          (
                            question,
                            index
                          ) => {
                            const questionExams =
                              question.subject
                                ? SUBJECT_EXAMS[
                                    question.subject
                                  ] || []
                                : [];

                            const questionChapters =
                              question.subject &&
                              question.classLevel
                                ? CHAPTERS[
                                    question.subject
                                  ]?.[
                                    question.classLevel
                                  ] || []
                                : [];

                            const type =
                              question.questionType ||
                              "mcq";

                            return (
                              <div
                                key={
                                  `${question.question}-${index}`
                                }
                                className="admin-navta-review-question"
                              >

                                <div className="admin-navta-review-header">

                                  <span className="admin-navta-review-number">
                                    {index + 1}
                                  </span>

                                  <p className="admin-navta-review-text">
                                    {
                                      question.question
                                    }
                                  </p>

                                  <button
                                    type="button"
                                    className="admin-navta-danger-button"
                                    onClick={() =>
                                      removeAcceptedQuestion(
                                        index
                                      )
                                    }
                                  >
                                    Drop
                                  </button>

                                </div>

                                <div className="admin-navta-grid three">

                                  <div className="admin-navta-field">
                                    <label className="admin-navta-label">
                                      Subject
                                    </label>

                                    <select
                                      className="admin-navta-select"
                                      value={
                                        question.subject ||
                                        ""
                                      }
                                      onChange={(event) =>
                                        updateAcceptedQuestion(
                                          index,
                                          "subject",
                                          event.target.value
                                        )
                                      }
                                    >
                                      <option value="">
                                        Select Subject
                                      </option>

                                      {Object.keys(
                                        SUBJECT_EXAMS
                                      ).map(
                                        (
                                          subject
                                        ) => (
                                          <option
                                            key={
                                              subject
                                            }
                                            value={
                                              subject
                                            }
                                          >
                                            {
                                              subject
                                            }
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
                                      value={
                                        question.exam ||
                                        ""
                                      }
                                      onChange={(event) =>
                                        updateAcceptedQuestion(
                                          index,
                                          "exam",
                                          event.target.value
                                        )
                                      }
                                      disabled={
                                        !question.subject
                                      }
                                    >
                                      <option value="">
                                        Select Preparation
                                      </option>

                                      {questionExams.map(
                                        (
                                          exam
                                        ) => (
                                          <option
                                            key={
                                              exam
                                            }
                                            value={
                                              exam
                                            }
                                          >
                                            {
                                              exam
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </div>

                                  <div className="admin-navta-field">
                                    <label className="admin-navta-label">
                                      Class
                                    </label>

                                    <select
                                      className="admin-navta-select"
                                      value={
                                        question.classLevel ||
                                        ""
                                      }
                                      onChange={(event) =>
                                        updateAcceptedQuestion(
                                          index,
                                          "classLevel",
                                          event.target.value
                                        )
                                      }
                                    >
                                      <option value="">
                                        Select Class
                                      </option>

                                      {CLASSES.map(
                                        (
                                          item
                                        ) => (
                                          <option
                                            key={
                                              item
                                            }
                                            value={
                                              item
                                            }
                                          >
                                            {
                                              item
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </div>

                                  <div className="admin-navta-field">
                                    <label className="admin-navta-label">
                                      Chapter
                                    </label>

                                    <select
                                      className="admin-navta-select"
                                      value={
                                        question.chapter ||
                                        ""
                                      }
                                      onChange={(event) =>
                                        updateAcceptedQuestion(
                                          index,
                                          "chapter",
                                          event.target.value
                                        )
                                      }
                                      disabled={
                                        !question.subject ||
                                        !question.classLevel
                                      }
                                    >
                                      <option value="">
                                        Select Chapter
                                      </option>

                                      {questionChapters.map(
                                        (
                                          chapter
                                        ) => (
                                          <option
                                            key={
                                              chapter
                                            }
                                            value={
                                              chapter
                                            }
                                          >
                                            {
                                              chapter
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </div>

                                  <div className="admin-navta-field">
                                    <label className="admin-navta-label">
                                      Difficulty
                                    </label>

                                    <select
                                      className="admin-navta-select"
                                      value={
                                        question.difficulty ||
                                        ""
                                      }
                                      onChange={(event) =>
                                        updateAcceptedQuestion(
                                          index,
                                          "difficulty",
                                          event.target.value
                                        )
                                      }
                                    >
                                      <option value="">
                                        Select Difficulty
                                      </option>

                                      {DIFFICULTIES.map(
                                        (
                                          level
                                        ) => (
                                          <option
                                            key={
                                              level
                                            }
                                            value={
                                              level
                                            }
                                          >
                                            {
                                              level
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>
                                  </div>

                                  <div className="admin-navta-field">
                                    <label className="admin-navta-label">
                                      Question Type
                                    </label>

                                    <select
                                      className="admin-navta-select"
                                      value={
                                        type
                                      }
                                      onChange={(event) =>
                                        updateAcceptedQuestion(
                                          index,
                                          "questionType",
                                          event.target.value
                                        )
                                      }
                                      disabled={
                                        question.exam !==
                                        "Boards"
                                      }
                                    >
                                      <option value="mcq">
                                        MCQ
                                      </option>

                                      <option value="short">
                                        Short Answer
                                      </option>

                                      <option value="long">
                                        Long Answer
                                      </option>
                                    </select>
                                  </div>

                                </div>

                                <div
                                  className="admin-navta-field full"
                                  style={{
                                    marginTop:
                                      "16px",
                                  }}
                                >
                                  <label className="admin-navta-label">
                                    Question Text
                                  </label>

                                  <textarea
                                    className="admin-navta-textarea"
                                    value={
                                      question.question ||
                                      ""
                                    }
                                    onChange={(event) =>
                                      updateAcceptedQuestion(
                                        index,
                                        "question",
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>

                                {/* MCQ */}

                                {type ===
                                  "mcq" && (
                                  <>
                                    <div className="admin-navta-option-grid">

                                      {[0, 1, 2, 3].map(
                                        (
                                          optionIndex
                                        ) => (
                                          <div
                                            key={
                                              optionIndex
                                            }
                                            className="admin-navta-field"
                                          >
                                            <label className="admin-navta-label">
                                              Option{" "}
                                              {String.fromCharCode(
                                                65 +
                                                  optionIndex
                                              )}
                                            </label>

                                            <input
                                              className="admin-navta-input"
                                              value={
                                                question
                                                  .options?.[
                                                  optionIndex
                                                ] ||
                                                ""
                                              }
                                              onChange={(event) =>
                                                updateAcceptedOption(
                                                  index,
                                                  optionIndex,
                                                  event
                                                    .target
                                                    .value
                                                )
                                              }
                                            />
                                          </div>
                                        )
                                      )}

                                    </div>

                                    <div
                                      className="admin-navta-field"
                                      style={{
                                        marginTop:
                                          "14px",
                                      }}
                                    >
                                      <label className="admin-navta-label">
                                        Correct Answer
                                      </label>

                                      <select
                                        className="admin-navta-select"
                                        value={
                                          Number.isInteger(
                                            Number(
                                              question.correctAnswer
                                            )
                                          )
                                            ? String(
                                                question.correctAnswer
                                              )
                                            : ""
                                        }
                                        onChange={(event) =>
                                          updateAcceptedQuestion(
                                            index,
                                            "correctAnswer",
                                            Number(
                                              event.target.value
                                            )
                                          )
                                        }
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

                                {/* WRITTEN */}

                                {type !==
                                  "mcq" && (
                                  <>
                                    <div
                                      className="admin-navta-field"
                                      style={{
                                        marginTop:
                                          "14px",
                                      }}
                                    >
                                      <label className="admin-navta-label">
                                        Model Answer
                                      </label>

                                      <textarea
                                        className="admin-navta-textarea"
                                        value={
                                          question.modelAnswer ||
                                          ""
                                        }
                                        onChange={(event) =>
                                          updateAcceptedQuestion(
                                            index,
                                            "modelAnswer",
                                            event.target.value
                                          )
                                        }
                                      />
                                    </div>

                                    <div
                                      className="admin-navta-field"
                                      style={{
                                        marginTop:
                                          "14px",
                                      }}
                                    >
                                      <label className="admin-navta-label">
                                        Key Points
                                      </label>

                                      <textarea
                                        className="admin-navta-textarea"
                                        value={
                                          Array.isArray(
                                            question.keyPoints
                                          )
                                            ? question.keyPoints.join(
                                                "\n"
                                              )
                                            : ""
                                        }
                                        onChange={(event) =>
                                          updateAcceptedQuestion(
                                            index,
                                            "keyPoints",
                                            event.target.value
                                              .split(
                                                "\n"
                                              )
                                              .map(
                                                (
                                                  item
                                                ) =>
                                                  item.trim()
                                              )
                                              .filter(
                                                Boolean
                                              )
                                          )
                                        }
                                      />
                                    </div>

                                    <div
                                      className="admin-navta-field"
                                      style={{
                                        marginTop:
                                          "14px",
                                      }}
                                    >
                                      <label className="admin-navta-label">
                                        Maximum Marks
                                      </label>

                                      <input
                                        type="number"
                                        min="1"
                                        className="admin-navta-input"
                                        value={
                                          question.maxMarks ||
                                          ""
                                        }
                                        onChange={(event) =>
                                          updateAcceptedQuestion(
                                            index,
                                            "maxMarks",
                                            Number(
                                              event.target.value
                                            )
                                          )
                                        }
                                      />
                                    </div>
                                  </>
                                )}

                                <div
                                  className="admin-navta-field"
                                  style={{
                                    marginTop:
                                      "14px",
                                  }}
                                >
                                  <label className="admin-navta-label">
                                    AI Explanation / Feedback
                                  </label>

                                  <textarea
                                    className="admin-navta-textarea admin-navta-explanation"
                                    value={
                                      question.explanation ||
                                      ""
                                    }
                                    onChange={(event) =>
                                      updateAcceptedQuestion(
                                        index,
                                        "explanation",
                                        event.target.value
                                      )
                                    }
                                  />
                                </div>

                                <div
                                  style={{
                                    marginTop:
                                      "12px",
                                    color:
                                      "#64748b",
                                    fontSize:
                                      "12px",
                                  }}
                                >
                                  Chapter confidence:{" "}
                                  {question.chapterConfidence
                                    ? `${Math.round(
                                        Number(
                                          question.chapterConfidence
                                        ) *
                                          100
                                      )}%`
                                    : "N/A"}
                                  {" • "}
                                  Difficulty confidence:{" "}
                                  {question.difficultyConfidence
                                    ? `${Math.round(
                                        Number(
                                          question.difficultyConfidence
                                        ) *
                                          100
                                      )}%`
                                    : "N/A"}
                                </div>

                              </div>
                            );
                          }
                        )}

                      </div>
                    )}

                    <button
                      type="button"
                      className="admin-navta-approve"
                      onClick={
                        approveAcceptedQuestions
                      }
                      disabled={
                        approveLoading ||
                        acceptedQuestions.length ===
                          0
                      }
                    >
                      {approveLoading
                        ? "Importing Approved Questions..."
                        : `Approve & Import ${acceptedQuestions.length} Questions`}
                    </button>
                  </>
                )}

                {/* =========================================
                    DROPPED QUESTIONS
                ========================================= */}

                {activeImportTab ===
                  "dropped" && (
                  <>
                    {droppedQuestions.length ===
                    0 ? (
                      <div className="admin-navta-empty-state">
                        No questions were dropped.
                      </div>
                    ) : (
                      <div className="admin-navta-review-list">

                        {droppedQuestions.map(
                          (
                            question,
                            index
                          ) => (
                            <div
                              key={
                                `${question.question}-${index}`
                              }
                              className="admin-navta-drop-card"
                            >
                              <p className="admin-navta-drop-question">
                                {index + 1}.{" "}
                                {question.question ||
                                  "Unrecognised question"}
                              </p>

                              <p className="admin-navta-drop-reason">
                                <strong>
                                  Reason:
                                </strong>{" "}
                                {question.dropReason ||
                                  question.reason ||
                                  "Question failed NAVTA validation."}
                              </p>
                            </div>
                          )
                        )}

                      </div>
                    )}
                  </>
                )}

              </>
            )}

          </div>

          {/* =================================================
              MANUAL ENTRY
          ================================================= */}

          <div className="admin-navta-info">
            Manual Entry: Select Subject → Preparation → Class → Chapter → Difficulty. For Boards, choose MCQ, Short Answer or Long Answer.
          </div>

          <div className="admin-navta-test-card">

            <form
              onSubmit={
                submitQuestion
              }
            >

              <div className="admin-navta-form-section">

                <h2 className="admin-navta-section-title">
                  Manual Question Classification
                </h2>

                <div className="admin-navta-grid">

                  <div className="admin-navta-field">
                    <label className="admin-navta-label">
                      Subject
                    </label>

                    <select
                      className="admin-navta-select"
                      value={
                        form.subject
                      }
                      onChange={(event) =>
                        handleSubjectChange(
                          event.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Select Subject
                      </option>

                      {Object.keys(
                        SUBJECT_EXAMS
                      ).map(
                        (
                          subject
                        ) => (
                          <option
                            key={
                              subject
                            }
                            value={
                              subject
                            }
                          >
                            {
                              subject
                            }
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
                      value={
                        form.exam
                      }
                      onChange={(event) =>
                        handleExamChange(
                          event.target.value
                        )
                      }
                      disabled={
                        !form.subject
                      }
                      required
                    >
                      <option value="">
                        Select Preparation
                      </option>

                      {availableExams.map(
                        (
                          exam
                        ) => (
                          <option
                            key={
                              exam
                            }
                            value={
                              exam
                            }
                          >
                            {
                              exam
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="admin-navta-field">
                    <label className="admin-navta-label">
                      Class
                    </label>

                    <select
                      className="admin-navta-select"
                      value={
                        form.classLevel
                      }
                      onChange={(event) =>
                        handleClassChange(
                          event.target.value
                        )
                      }
                      disabled={
                        !form.subject
                      }
                      required
                    >
                      <option value="">
                        Select Class
                      </option>

                      {CLASSES.map(
                        (
                          item
                        ) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            {
                              item
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="admin-navta-field">
                    <label className="admin-navta-label">
                      Chapter
                    </label>

                    <select
                      className="admin-navta-select"
                      value={
                        form.chapter
                      }
                      onChange={(event) =>
                        updateField(
                          "chapter",
                          event.target.value
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
                        (
                          chapter
                        ) => (
                          <option
                            key={
                              chapter
                            }
                            value={
                              chapter
                            }
                          >
                            {
                              chapter
                            }
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
                      value={
                        form.difficulty
                      }
                      onChange={(event) =>
                        updateField(
                          "difficulty",
                          event.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        Select Difficulty
                      </option>

                      {DIFFICULTIES.map(
                        (
                          level
                        ) => (
                          <option
                            key={
                              level
                            }
                            value={
                              level
                            }
                          >
                            {
                              level
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {form.exam ===
                    "Boards" && (
                    <div className="admin-navta-field full">
                      <label className="admin-navta-label">
                        Question Type
                      </label>

                      <select
                        className="admin-navta-select"
                        value={
                          form.questionType
                        }
                        onChange={(event) =>
                          updateField(
                            "questionType",
                            event.target.value
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

              {/* QUESTION */}

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
                      value={
                        form.question
                      }
                      onChange={(event) =>
                        updateField(
                          "question",
                          event.target.value
                        )
                      }
                      required
                    />
                  </div>

                  {(form.exam !==
                    "Boards" ||
                    form.questionType ===
                      "mcq") && (
                    <>
                      {[
                        "A",
                        "B",
                        "C",
                        "D",
                      ].map(
                        (
                          letter
                        ) => {
                          const key =
                            `option${letter}`;

                          return (
                            <div
                              key={
                                letter
                              }
                              className="admin-navta-field"
                            >
                              <label className="admin-navta-label">
                                Option{" "}
                                {
                                  letter
                                }
                              </label>

                              <input
                                className="admin-navta-input"
                                placeholder={`Enter Option ${letter}`}
                                value={
                                  form[
                                    key
                                  ]
                                }
                                onChange={(event) =>
                                  updateField(
                                    key,
                                    event.target.value
                                  )
                                }
                                required
                              />
                            </div>
                          );
                        }
                      )}

                      <div className="admin-navta-field full">
                        <label className="admin-navta-label">
                          Correct Answer
                        </label>

                        <select
                          className="admin-navta-select"
                          value={
                            form.correctAnswer
                          }
                          onChange={(event) =>
                            updateField(
                              "correctAnswer",
                              event.target.value
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

                  {form.exam ===
                    "Boards" &&
                    form.questionType !==
                      "mcq" && (
                      <>
                        <div className="admin-navta-field full">
                          <label className="admin-navta-label">
                            Model Answer
                          </label>

                          <textarea
                            className="admin-navta-textarea"
                            placeholder="Enter the model / ideal answer"
                            value={
                              form.modelAnswer
                            }
                            onChange={(event) =>
                              updateField(
                                "modelAnswer",
                                event.target.value
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
                            value={
                              form.keyPoints
                            }
                            onChange={(event) =>
                              updateField(
                                "keyPoints",
                                event.target.value
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
                            value={
                              form.maxMarks
                            }
                            onChange={(event) =>
                              updateField(
                                "maxMarks",
                                event.target.value
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
                            onChange={(event) =>
                              updateField(
                                "evaluationInstructions",
                                event.target.value
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
                        form.exam ===
                          "Boards" &&
                        form.questionType !==
                          "mcq"
                          ? "Feedback shown after AI evaluation"
                          : "Shown to the student only after a wrong MCQ answer"
                      }
                      value={
                        form.explanation
                      }
                      onChange={(event) =>
                        updateField(
                          "explanation",
                          event.target.value
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
                disabled={
                  loading
                }
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
