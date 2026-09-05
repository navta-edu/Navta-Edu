const path = require("path");

const { processNavtaDocument } = require("./navtaDocumentService");
const { renderPdfPages } = require("./navtaPdfVisualService");
const {
  analyseRenderedPages,
  analyseTextQuestions,
  solveQuestionFromImage,
} = require("./navtaAIQuestionService");
const { createQuestionDiagram } = require("./navtaDiagramCropService");
const { uploadQuestionImage } = require("./navtaImageService");

const VALID_SUBJECTS = new Set([
  "Physics",
  "Chemistry",
  "Maths",
  "Biology",
]);

const VALID_EXAMS = new Set(["NEET", "JEE", "Boards"]);
const VALID_CLASSES = new Set(["Class 11", "Class 12"]);
const VALID_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const VALID_QUESTION_TYPES = new Set(["mcq", "short", "long"]);

const MAX_PDF_PAGES_PER_IMPORT = Math.max(
  1,
  Number(process.env.NAVTA_AI_MAX_PDF_PAGES || 100) || 100
);

const cleanString = (value = "") => String(value ?? "").trim();
const safeArray = (value) => (Array.isArray(value) ? value : []);

const getFileType = (fileName = "") =>
  path.extname(fileName).toLowerCase().replace(".", "");

const normalizeSubject = (value) => {
  const text = cleanString(value).toLowerCase();
  if (text === "physics") return "Physics";
  if (text === "chemistry") return "Chemistry";
  if (["math", "maths", "mathematics"].includes(text)) return "Maths";
  if (text === "biology") return "Biology";
  return "";
};

const normalizeExam = (value) => {
  const text = cleanString(value).toLowerCase();
  if (text.includes("neet")) return "NEET";
  if (text.includes("jee")) return "JEE";
  if (text.includes("board") || text.includes("cbse")) return "Boards";
  return "";
};

const normalizeClassLevel = (value) => {
  const text = cleanString(value).toLowerCase();
  if (text.includes("11") || text === "xi") return "Class 11";
  if (text.includes("12") || text === "xii") return "Class 12";
  return "";
};

const validateDetectedQuestion = (
  rawQuestion,
  { requireCorrectAnswer = true, requireScreenshot = false } = {}
) => {
  const question = {
    ...rawQuestion,
    question: cleanString(rawQuestion?.question),
    subject: normalizeSubject(rawQuestion?.subject),
    exam: normalizeExam(rawQuestion?.exam),
    classLevel: normalizeClassLevel(rawQuestion?.classLevel),
    chapter: cleanString(rawQuestion?.chapter),
    difficulty: cleanString(rawQuestion?.difficulty),
    questionType: cleanString(rawQuestion?.questionType).toLowerCase(),
    options: safeArray(rawQuestion?.options).map(cleanString).filter(Boolean),
    explanation: cleanString(rawQuestion?.explanation),
    modelAnswer: cleanString(rawQuestion?.modelAnswer),
    keyPoints: safeArray(rawQuestion?.keyPoints).map(cleanString).filter(Boolean),
  };

  const reasons = [];

  if (question.drop) {
    reasons.push(
      cleanString(question.dropReason) || "NAVTA AI marked this question as unusable."
    );
  }

  if (!question.question) reasons.push("Question text is missing.");
  if (!VALID_SUBJECTS.has(question.subject)) {
    reasons.push("Subject could not be identified.");
  }
  if (!VALID_EXAMS.has(question.exam)) {
    reasons.push("Exam type could not be identified.");
  }
  if (!VALID_CLASSES.has(question.classLevel)) {
    reasons.push("Class level could not be identified.");
  }

  // Chapter is important for NAVTA filtering, but do not lose a readable
  // question solely because chapter classification is uncertain.
  if (!question.chapter) {
    question.chapter = "Needs Review";
    question.needsReview = true;
  }

  if (!VALID_DIFFICULTIES.has(question.difficulty)) {
    question.difficulty = "Medium";
    question.needsReview = true;
  }

  if (!VALID_QUESTION_TYPES.has(question.questionType)) {
    reasons.push("Question type could not be identified.");
  }

  if (
    ["JEE", "NEET"].includes(question.exam) &&
    question.questionType !== "mcq"
  ) {
    reasons.push(`${question.exam} questions must be MCQ.`);
  }

  if (question.questionType === "mcq") {
    if (question.options.length !== 4) {
      reasons.push("MCQ must contain exactly 4 options.");
    }

    if (
      requireCorrectAnswer &&
      (!Number.isInteger(rawQuestion?.correctAnswer) ||
        rawQuestion.correctAnswer < 0 ||
        rawQuestion.correctAnswer > 3)
    ) {
      reasons.push("MCQ correct answer could not be determined.");
    }
  }

  if (requireScreenshot && !question.questionBoundingBox) {
    reasons.push("Complete question screenshot boundary is missing.");
  }

  return {
    valid: reasons.length === 0,
    reasons,
    question,
  };
};

const processCompleteQuestionScreenshot = async ({
  question,
  renderedPage,
  sourceFileName,
}) => {
  if (!question?.questionBoundingBox) {
    return {
      questionImage: null,
      cropBuffer: null,
      screenshotWarning: "Complete question screenshot boundary is missing.",
    };
  }

  if (!renderedPage) {
    return {
      questionImage: null,
      cropBuffer: null,
      screenshotWarning: "Source PDF page could not be located.",
    };
  }

  try {
    // Reuse the existing crop service by treating the full-question box
    // as the visual box.
    const cropQuestion = {
      ...question,
      hasVisual: true,
      visualBoundingBox: question.questionBoundingBox,
      visualDescription:
        question.question ||
        `Question ${question.questionNumber || ""}`.trim(),
    };

    const cropped = await createQuestionDiagram({
      question: cropQuestion,
      pageBuffer: renderedPage.buffer,
    });

    if (
      !cropped ||
      !Buffer.isBuffer(cropped.buffer) ||
      cropped.buffer.length === 0
    ) {
      return {
        questionImage: null,
        cropBuffer: null,
        screenshotWarning: "Could not create the complete question screenshot.",
      };
    }

    const safeFileName =
      cleanString(sourceFileName)
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .slice(0, 80) || "navta-question";

    const questionNumber =
      cleanString(question.questionNumber)
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .slice(0, 30) || "question";

    const upload = await uploadQuestionImage({
      buffer: cropped.buffer,
      fileName: `${safeFileName}-page-${question.sourcePage}-${questionNumber}`,
      folder: "navta/ai-imports/pending",
    });

    if (!upload?.url) {
      return {
        questionImage: null,
        cropBuffer: cropped.buffer,
        screenshotWarning: "Question screenshot was created but could not be uploaded.",
      };
    }

    return {
      cropBuffer: cropped.buffer,
      questionImage: {
        url: upload.url,
        publicId: upload.publicId || "",
        altText:
          question.question ||
          `Question ${question.questionNumber || ""}`.trim() ||
          "NAVTA question",
        sourcePage: question.sourcePage,
        width: upload.width || cropped.width,
        height: upload.height || cropped.height,
        bbox: question.questionBoundingBox,
      },
    };
  } catch (error) {
    console.error("NAVTA QUESTION SCREENSHOT ERROR:", error);
    return {
      questionImage: null,
      cropBuffer: null,
      screenshotWarning:
        error?.message || "NAVTA could not process the question screenshot.",
    };
  }
};

const solveMissingMcqAnswer = async ({ question, cropBuffer }) => {
  if (question?.questionType !== "mcq") return question;

  if (
    Number.isInteger(question.correctAnswer) &&
    question.correctAnswer >= 0 &&
    question.correctAnswer <= 3
  ) {
    return question;
  }

  if (!Buffer.isBuffer(cropBuffer) || cropBuffer.length === 0) {
    return question;
  }

  const solution = await solveQuestionFromImage({
    imageBuffer: cropBuffer,
    question,
  });

  return {
    ...question,
    correctAnswer:
      Number.isInteger(solution?.correctAnswer) &&
      solution.correctAnswer >= 0 &&
      solution.correctAnswer <= 3
        ? solution.correctAnswer
        : null,
    explanation:
      cleanString(solution?.explanation) || question.explanation || "",
    answerConfidence: cleanString(solution?.confidence) || "low",
    answerSolvedFromScreenshot: Number.isInteger(solution?.correctAnswer),
    answerSolverWarning: cleanString(solution?.solverError),
  };
};

const buildImportQuestion = ({
  question,
  questionImage = null,
  sourceFileName,
  fileType,
}) => {
  const result = {
    question: question.question,
    subject: question.subject,
    exam: question.exam,
    classLevel: question.classLevel,
    chapter: question.chapter,
    difficulty: question.difficulty,
    questionType: question.questionType,
    explanation: question.explanation || "",
    needsReview: Boolean(question.needsReview),
    sourceDocument: {
      fileName: sourceFileName,
      fileType,
      pageNumber: question.sourcePage || null,
      importedByAI: true,
    },
  };

  if (question.questionType === "mcq") {
    result.options = question.options;
    result.correctAnswer = question.correctAnswer;
  } else {
    result.modelAnswer = question.modelAnswer || "";
    result.keyPoints = question.keyPoints || [];

    const marks = Number(question.maxMarks);
    if (Number.isFinite(marks) && marks > 0) result.maxMarks = marks;
  }

  if (questionImage?.url) {
    result.questionImage = questionImage;
    result.questionImages = [questionImage];
  } else {
    result.questionImages = [];
  }

  return result;
};

const processPdfImport = async ({ file, documentResult, hints }) => {
  const rendered = await renderPdfPages({
    buffer: file.buffer,
    scale: 1.8,
    maxPages: MAX_PDF_PAGES_PER_IMPORT,
  });

  if (!rendered?.pages?.length) {
    throw new Error("NAVTA could not render any pages from this PDF.");
  }

  const detectedQuestions = await analyseRenderedPages({
    pages: rendered.pages,
    text: documentResult?.text || "",
    hints,
  });

  const pageMap = new Map(
    rendered.pages.map((page) => [Number(page.pageNumber), page])
  );

  const acceptedQuestions = [];
  const droppedQuestions = [];

  for (const rawQuestion of detectedQuestions) {
    const preliminary = validateDetectedQuestion(rawQuestion, {
      requireCorrectAnswer: false,
      requireScreenshot: true,
    });

    if (!preliminary.valid) {
      const reason = preliminary.reasons.join(" ");
      droppedQuestions.push({
        ...preliminary.question,
        reason,
        dropReason: reason,
      });
      continue;
    }

    let question = { ...preliminary.question };
    const renderedPage = pageMap.get(Number(question.sourcePage));

    const screenshot = await processCompleteQuestionScreenshot({
      question,
      renderedPage,
      sourceFileName: file.originalname,
    });

    if (
      !screenshot.questionImage ||
      !Buffer.isBuffer(screenshot.cropBuffer) ||
      screenshot.cropBuffer.length === 0
    ) {
      const reason =
        screenshot.screenshotWarning ||
        "NAVTA could not preserve the complete question screenshot.";

      droppedQuestions.push({
        ...question,
        reason,
        dropReason: reason,
      });
      continue;
    }

    question = await solveMissingMcqAnswer({
      question,
      cropBuffer: screenshot.cropBuffer,
    });

    const finalValidation = validateDetectedQuestion(question, {
      requireCorrectAnswer: true,
      requireScreenshot: true,
    });

    if (!finalValidation.valid) {
      const reason = finalValidation.reasons.join(" ");
      droppedQuestions.push({
        ...finalValidation.question,
        questionImage: screenshot.questionImage,
        questionImages: [screenshot.questionImage],
        reason,
        dropReason: reason,
      });
      continue;
    }

    question = {
      ...finalValidation.question,
      answerConfidence: question.answerConfidence || "",
      answerSolvedFromScreenshot: Boolean(question.answerSolvedFromScreenshot),
      answerSolverWarning: question.answerSolverWarning || "",
    };

    const importQuestion = buildImportQuestion({
      question,
      questionImage: screenshot.questionImage,
      sourceFileName: file.originalname,
      fileType: "pdf",
    });

    importQuestion.answerConfidence = question.answerConfidence;
    importQuestion.answerSolvedFromScreenshot =
      question.answerSolvedFromScreenshot;

    if (question.answerSolverWarning) {
      importQuestion.answerSolverWarning = question.answerSolverWarning;
    }

    acceptedQuestions.push(importQuestion);
  }

  return {
    acceptedQuestions,
    droppedQuestions,
    documentInfo: {
      fileType: "pdf",
      fileName: file.originalname,
      totalPages: rendered.totalPages,
      renderedPages: rendered.renderedPages,
      truncated: Boolean(rendered.truncated),
    },
  };
};

const processTextImport = async ({ file, documentResult, hints, fileType }) => {
  const detectedQuestions = await analyseTextQuestions({
    text: documentResult?.text || "",
    hints,
  });

  const acceptedQuestions = [];
  const droppedQuestions = [];

  for (const rawQuestion of detectedQuestions) {
    const validation = validateDetectedQuestion(rawQuestion, {
      requireCorrectAnswer: rawQuestion.questionType === "mcq",
      requireScreenshot: false,
    });

    if (!validation.valid) {
      const reason = validation.reasons.join(" ");
      droppedQuestions.push({
        ...validation.question,
        reason,
        dropReason: reason,
      });
      continue;
    }

    acceptedQuestions.push(
      buildImportQuestion({
        question: validation.question,
        questionImage: null,
        sourceFileName: file.originalname,
        fileType,
      })
    );
  }

  return {
    acceptedQuestions,
    droppedQuestions,
    documentInfo: {
      fileType,
      fileName: file.originalname,
      totalPages: null,
      renderedPages: 0,
      truncated: false,
    },
  };
};

const analyseNavtaImport = async ({
  file,
  subject,
  exam,
  classLevel,
}) => {
  if (!file) {
    throw new Error("Please upload a PDF, DOCX or TXT file.");
  }

  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new Error("Uploaded file buffer is missing.");
  }

  const fileType = getFileType(file.originalname);

  if (!["pdf", "docx", "txt"].includes(fileType)) {
    throw new Error("Unsupported file type. Please upload PDF, DOCX or TXT.");
  }

  const documentResult = await processNavtaDocument(file);

  const hints = {
    subject: normalizeSubject(subject),
    exam: normalizeExam(exam),
    classLevel: normalizeClassLevel(classLevel),
  };

  const result =
    fileType === "pdf"
      ? await processPdfImport({ file, documentResult, hints })
      : await processTextImport({
          file,
          documentResult,
          hints,
          fileType,
        });

  return {
    ...result,
    summary: {
      detected:
        result.acceptedQuestions.length + result.droppedQuestions.length,
      accepted: result.acceptedQuestions.length,
      dropped: result.droppedQuestions.length,
    },
  };
};

module.exports = {
  analyseNavtaImport,
  validateDetectedQuestion,
};
