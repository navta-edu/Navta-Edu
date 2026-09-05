// =====================================================
// NAVTA AI QUESTION SERVICE
// One provider: Gemini
// PDF: vision-first detection + screenshot solver
// TXT/DOCX: text-only classification
// =====================================================

const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = String(process.env.GEMINI_MODEL || "gemini-2.0-flash").trim();
const GEMINI_API_BASE = String(
  process.env.GEMINI_API_BASE ||
    "https://generativelanguage.googleapis.com/v1beta"
)
  .trim()
  .replace(/\/+$/, "");

const NAVTA_AI_TIMEOUT_MS = Math.max(
  30000,
  Number(process.env.NAVTA_AI_TIMEOUT_MS || 180000) || 180000
);

const MAX_ATTEMPTS = 2;

const cleanString = (value = "") => String(value ?? "").trim();
const safeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeQuestionType = (value) => {
  const type = cleanString(value).toLowerCase();
  if (["mcq", "short", "long"].includes(type)) return type;
  return "";
};

const normalizeDifficulty = (value) => {
  const valueText = cleanString(value).toLowerCase();
  if (valueText === "easy") return "Easy";
  if (valueText === "medium") return "Medium";
  if (valueText === "hard") return "Hard";
  return "";
};

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

const normalizeCorrectAnswer = (value) => {
  if (Number.isInteger(value) && value >= 0 && value <= 3) return value;

  const text = cleanString(value).toUpperCase();
  const map = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
  };

  return Object.prototype.hasOwnProperty.call(map, text) ? map[text] : null;
};

const normalizeBoundingBox = (value) => {
  if (!value || typeof value !== "object") return null;

  let x = Number(value.x);
  let y = Number(value.y);
  let width = Number(value.width);
  let height = Number(value.height);

  if (![x, y, width, height].every(Number.isFinite)) return null;

  // Also accept 0-100 percentages.
  if (x > 1 || y > 1 || width > 1 || height > 1) {
    if (
      x >= 0 &&
      y >= 0 &&
      x <= 100 &&
      y <= 100 &&
      width <= 100 &&
      height <= 100
    ) {
      x /= 100;
      y /= 100;
      width /= 100;
      height /= 100;
    }
  }

  if (x < 0 || y < 0 || width <= 0 || height <= 0) return null;

  x = Math.min(1, Math.max(0, x));
  y = Math.min(1, Math.max(0, y));
  width = Math.min(1 - x, Math.max(0, width));
  height = Math.min(1 - y, Math.max(0, height));

  if (width <= 0 || height <= 0) return null;

  return { x, y, width, height };
};

const imageBufferToBase64 = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("A valid PNG image buffer is required.");
  }
  return buffer.toString("base64");
};

const validateRenderedPage = (page) => {
  if (!page || typeof page !== "object") {
    throw new Error("NAVTA AI received an invalid rendered PDF page.");
  }

  const pageNumber = Number(page.pageNumber);

  if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
    throw new Error("Rendered PDF page has an invalid page number.");
  }

  if (!Buffer.isBuffer(page.buffer) || page.buffer.length === 0) {
    throw new Error(
      `Rendered PDF page ${pageNumber} does not contain a valid image buffer.`
    );
  }

  return { ...page, pageNumber };
};

const stripJsonFences = (value) =>
  cleanString(value)
    .replace(/^```(?:json|javascript|js)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const parseJsonObject = (raw) => {
  const text = stripJsonFences(raw);

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start !== -1 && end > start) {
      const sliced = text.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(sliced);
    }

    throw new Error("AI returned invalid JSON.");
  }
};

const extractGeminiText = (data) => {
  for (const candidate of safeArray(data?.candidates)) {
    const text = safeArray(candidate?.content?.parts)
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();

    if (text) return text;
  }

  return "";
};

const callGemini = async ({ parts, maxOutputTokens = 8192 }) => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured on the NAVTA backend.");
  }

  const endpoint =
    `${GEMINI_API_BASE}/models/${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NAVTA_AI_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.05,
          responseMimeType: "application/json",
          maxOutputTokens,
        },
      }),
    });

    const responseText = await response.text();

    let data = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error("Gemini returned an invalid HTTP response.");
    }

    if (!response.ok) {
      const message =
        cleanString(data?.error?.message) || `Gemini returned HTTP ${response.status}.`;
      throw new Error(message);
    }

    const modelText = extractGeminiText(data);

    if (!modelText) {
      throw new Error("Gemini returned an empty response.");
    }

    return modelText;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Gemini request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const PAGE_SYSTEM_PROMPT = `
You are NAVTA AI, a question separator for academic PDFs.

Analyse exactly ONE original rendered PDF page image.

Supported subjects: Physics, Chemistry, Maths, Biology.
Supported exams: NEET, JEE, Boards.
Supported classes: Class 11, Class 12.
Difficulty: Easy, Medium, Hard.
Question types: mcq, short, long.

CRITICAL RULES:
1. Detect every complete readable academic question on the page.
2. The original page image is authoritative. Extracted text is only supporting context.
3. For each question, return a normalized questionBoundingBox with x, y, width, height from 0 to 1.
4. The box must include the COMPLETE single question: number, stem, options, equations, diagrams, graphs, tables and other material needed to solve it.
5. Do not include previous or next questions in the box.
6. For MCQs, return exactly four options when four options are visible.
7. correctAnswer is zero-based: A=0, B=1, C=2, D=3.
8. If the answer is not reliable, return correctAnswer=null. Do NOT drop a readable question only because the answer is unknown.
9. drop=true only when the actual question is unreadable or incomplete on this page.
10. Use admin hints when provided and consistent with the page.
11. Preserve ordinary question wording. For complex visual mathematics, a short readable description is acceptable because NAVTA also keeps the original question screenshot.
12. Return JSON only. No markdown.

Return:
{
  "questions": [
    {
      "questionNumber": "",
      "question": "",
      "subject": "",
      "exam": "",
      "classLevel": "",
      "chapter": "",
      "difficulty": "",
      "questionType": "",
      "options": [],
      "correctAnswer": null,
      "modelAnswer": "",
      "keyPoints": [],
      "maxMarks": null,
      "explanation": "",
      "questionBoundingBox": null,
      "hasVisual": false,
      "visualDescription": "",
      "visualBoundingBox": null,
      "sourcePage": null,
      "drop": false,
      "dropReason": ""
    }
  ]
}
`;

const normalizeDetectedQuestion = ({ item = {}, pageNumber = null, hints = {} }) => {
  const options = safeArray(item.options)
    .map((option) => cleanString(option))
    .filter(Boolean);

  const questionType =
    normalizeQuestionType(item.questionType) ||
    (options.length === 4 ? "mcq" : "");

  const questionBoundingBox = normalizeBoundingBox(item.questionBoundingBox);
  const visualBoundingBox = normalizeBoundingBox(item.visualBoundingBox);

  let drop = Boolean(item.drop);
  let dropReason = cleanString(item.dropReason);

  if (pageNumber && !questionBoundingBox) {
    drop = true;
    dropReason =
      dropReason ||
      "The complete one-question screenshot boundary could not be identified.";
  }

  const question = cleanString(item.question);

  if (!question) {
    drop = true;
    dropReason = dropReason || "Question text is missing.";
  }

  return {
    questionNumber: cleanString(item.questionNumber),
    question,
    subject: normalizeSubject(item.subject) || normalizeSubject(hints.subject),
    exam: normalizeExam(item.exam) || normalizeExam(hints.exam),
    classLevel:
      normalizeClassLevel(item.classLevel) || normalizeClassLevel(hints.classLevel),
    chapter: cleanString(item.chapter),
    difficulty: normalizeDifficulty(item.difficulty),
    questionType,
    options,
    correctAnswer: normalizeCorrectAnswer(item.correctAnswer),
    modelAnswer: cleanString(item.modelAnswer),
    keyPoints: safeArray(item.keyPoints).map(cleanString).filter(Boolean),
    maxMarks:
      item.maxMarks === null || item.maxMarks === undefined
        ? null
        : Number(item.maxMarks),
    explanation: cleanString(item.explanation),
    questionBoundingBox,
    hasVisual: Boolean(item.hasVisual),
    visualDescription: cleanString(item.visualDescription),
    visualBoundingBox,
    sourcePage: pageNumber || Number(item.sourcePage) || null,
    drop,
    dropReason,
  };
};

const analyseNavtaPage = async ({ page, text = "", hints = {} } = {}) => {
  const validPage = validateRenderedPage(page);

  const prompt = `
${PAGE_SYSTEM_PROMPT}

PAGE NUMBER: ${validPage.pageNumber}

ADMIN HINTS:
Subject: ${cleanString(hints.subject) || "Auto detect"}
Exam: ${cleanString(hints.exam) || "Auto detect"}
Class: ${cleanString(hints.classLevel) || "Auto detect"}

EXTRACTED PAGE TEXT:
${cleanString(validPage.text).slice(0, 5000)}

GENERAL DOCUMENT TEXT:
${cleanString(text).slice(0, 2500)}

sourcePage must equal ${validPage.pageNumber}.
`;

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const raw = await callGemini({
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBufferToBase64(validPage.buffer),
            },
          },
        ],
      });

      const parsed = parseJsonObject(raw);
      const rawQuestions = safeArray(parsed?.questions);

      return rawQuestions.map((item) =>
        normalizeDetectedQuestion({
          item,
          pageNumber: validPage.pageNumber,
          hints,
        })
      );
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_ATTEMPTS) break;
    }
  }

  throw new Error(
    `NAVTA could not analyse PDF page ${validPage.pageNumber}. ${
      lastError?.message || "Unknown AI error."
    }`
  );
};

const removeExactDuplicates = (questions = []) => {
  const seen = new Set();
  const result = [];

  for (const question of safeArray(questions)) {
    const key = [
      Number(question?.sourcePage) || 0,
      cleanString(question?.questionNumber).toLowerCase(),
      cleanString(question?.question).replace(/\s+/g, " ").toLowerCase(),
    ].join("|");

    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(question);
  }

  return result;
};

const analyseRenderedPages = async ({ pages = [], text = "", hints = {} } = {}) => {
  if (!Array.isArray(pages) || pages.length === 0) return [];

  const validPages = pages
    .filter(
      (page) =>
        page &&
        Number(page.pageNumber) > 0 &&
        Buffer.isBuffer(page.buffer) &&
        page.buffer.length > 0
    )
    .map((page) => ({ ...page, pageNumber: Number(page.pageNumber) }))
    .sort((a, b) => a.pageNumber - b.pageNumber);

  if (validPages.length === 0) {
    throw new Error("NAVTA AI received no valid rendered PDF page images.");
  }

  const allQuestions = [];

  for (const page of validPages) {
    const pageQuestions = await analyseNavtaPage({
      page,
      text: cleanString(page.text) || text,
      hints,
    });

    allQuestions.push(...pageQuestions);
    console.log(
      `NAVTA AI page ${page.pageNumber}: detected ${pageQuestions.length} question(s).`
    );
  }

  return removeExactDuplicates(allQuestions).sort((a, b) => {
    const pageDiff = (a.sourcePage || 0) - (b.sourcePage || 0);
    if (pageDiff !== 0) return pageDiff;

    const aNum = Number.parseFloat(a.questionNumber);
    const bNum = Number.parseFloat(b.questionNumber);

    if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
    return 0;
  });
};

const solveQuestionFromImage = async ({ imageBuffer, question = {} } = {}) => {
  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    return {
      correctAnswer: null,
      explanation: "",
      confidence: "low",
      solverError: "A valid cropped question screenshot is required.",
    };
  }

  const prompt = `
You are NAVTA AI's dedicated MCQ solver.

Read the ORIGINAL cropped question screenshot carefully.
Solve only this one question.
Return JSON only.

correctAnswer must be:
0 for A
1 for B
2 for C
3 for D
or null if the answer cannot be determined reliably.

Return:
{
  "correctAnswer": null,
  "explanation": "",
  "confidence": "high"
}

Known metadata:
Question: ${cleanString(question.question)}
Subject: ${cleanString(question.subject)}
Exam: ${cleanString(question.exam)}
Class: ${cleanString(question.classLevel)}
Chapter: ${cleanString(question.chapter)}
`;

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const raw = await callGemini({
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBufferToBase64(imageBuffer),
            },
          },
        ],
        maxOutputTokens: 2048,
      });

      const parsed = parseJsonObject(raw);
      const confidence = cleanString(parsed.confidence).toLowerCase();

      return {
        correctAnswer: normalizeCorrectAnswer(parsed.correctAnswer),
        explanation: cleanString(parsed.explanation),
        confidence: ["high", "medium", "low"].includes(confidence)
          ? confidence
          : "medium",
      };
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_ATTEMPTS) break;
    }
  }

  return {
    correctAnswer: null,
    explanation: "",
    confidence: "low",
    solverError: lastError?.message || "NAVTA could not solve this question.",
  };
};

const analyseTextQuestions = async ({ text, hints = {} } = {}) => {
  const sourceText = cleanString(text);

  if (!sourceText) {
    throw new Error("No text was extracted from the uploaded file.");
  }

  const prompt = `
You are NAVTA AI, a question separator for academic text.

Supported subjects: Physics, Chemistry, Maths, Biology.
Supported exams: NEET, JEE, Boards.
Supported classes: Class 11, Class 12.
Difficulty: Easy, Medium, Hard.
Question types: mcq, short, long.

Separate every complete readable question.
For MCQs, return exactly four options when present and correctAnswer as zero-based A=0, B=1, C=2, D=3.
If the answer is uncertain, use null.
Do not invent question text.
Return JSON only.

ADMIN HINTS:
Subject: ${cleanString(hints.subject) || "Auto detect"}
Exam: ${cleanString(hints.exam) || "Auto detect"}
Class: ${cleanString(hints.classLevel) || "Auto detect"}

Return:
{
  "questions": [
    {
      "questionNumber": "",
      "question": "",
      "subject": "",
      "exam": "",
      "classLevel": "",
      "chapter": "",
      "difficulty": "",
      "questionType": "",
      "options": [],
      "correctAnswer": null,
      "modelAnswer": "",
      "keyPoints": [],
      "maxMarks": null,
      "explanation": "",
      "drop": false,
      "dropReason": ""
    }
  ]
}

FILE TEXT:
${sourceText.slice(0, 50000)}
`;

  const raw = await callGemini({
    parts: [{ text: prompt }],
    maxOutputTokens: 8192,
  });

  const parsed = parseJsonObject(raw);

  return safeArray(parsed?.questions).map((item) =>
    normalizeDetectedQuestion({
      item,
      pageNumber: null,
      hints,
    })
  );
};

const checkGeminiConnection = async () => {
  if (!GEMINI_API_KEY) {
    return {
      ok: false,
      provider: "gemini",
      model: GEMINI_MODEL,
      message: "GEMINI_API_KEY is not configured.",
    };
  }

  try {
    const endpoint =
      `${GEMINI_API_BASE}/models/${encodeURIComponent(
        GEMINI_MODEL
      )}?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        return {
          ok: false,
          provider: "gemini",
          model: GEMINI_MODEL,
          status: response.status,
          message: `Gemini returned HTTP ${response.status}.`,
        };
      }

      return {
        ok: true,
        provider: "gemini",
        model: GEMINI_MODEL,
        message: "NAVTA Gemini connection is available.",
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return {
      ok: false,
      provider: "gemini",
      model: GEMINI_MODEL,
      message:
        error?.name === "AbortError"
          ? "Gemini connection check timed out."
          : error?.message || "Gemini connection check failed.",
    };
  }
};

module.exports = {
  analyseNavtaPage,
  analyseRenderedPages,
  analyseTextQuestions,
  solveQuestionFromImage,
  checkGeminiConnection,
  checkNavtaAIGatewayConnection: checkGeminiConnection,
  checkOllamaConnection: checkGeminiConnection,
};
