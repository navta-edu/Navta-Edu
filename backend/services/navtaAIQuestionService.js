// =====================================================
// NAVTA AI QUESTION SERVICE
// Google Gemini Vision API - Screenshot First
// =====================================================

const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = String(
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
).trim();
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

const NAVTA_AI_BATCH_SIZE = 5;

function cleanString(value = "") {
  return String(value || "").trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeAcademicContent(value = "") {
  return cleanString(value)
    .replace(/```(?:latex|tex|math|markdown|json)?/gi, "")
    .replace(/```/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
}

function normalizeQuestionType(value) {
  const type = cleanString(value).toLowerCase();
  if (["mcq", "short", "long"].includes(type)) return type;
  return "";
}

function normalizeDifficulty(value) {
  const difficulty = cleanString(value).toLowerCase();
  if (difficulty === "easy") return "Easy";
  if (difficulty === "medium") return "Medium";
  if (difficulty === "hard") return "Hard";
  return "";
}

function normalizeBoundingBox(value) {
  if (!value || typeof value !== "object") return null;

  const x = Number(value.x);
  const y = Number(value.y);
  const width = Number(value.width);
  const height = Number(value.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  const safeX = Math.min(1, Math.max(0, x));
  const safeY = Math.min(1, Math.max(0, y));
  const safeWidth = Math.min(1 - safeX, Math.max(0, width));
  const safeHeight = Math.min(1 - safeY, Math.max(0, height));

  if (safeWidth <= 0 || safeHeight <= 0) return null;

  return {
    x: safeX,
    y: safeY,
    width: safeWidth,
    height: safeHeight,
  };
}

function imageBufferToBase64(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("A valid rendered PDF page image buffer is required.");
  }

  return buffer.toString("base64");
}

const SYSTEM_PROMPT = `
You are NAVTA AI, an educational question-paper analysis system.

Analyse every supplied rendered PDF page image completely and detect every readable academic question.

Supported subjects: Physics, Chemistry, Maths, Biology.
Supported exams: NEET, JEE, Boards.
Supported classes: Class 11, Class 12.
Difficulty: Easy, Medium, Hard.
Question types: mcq, short, long.

CRITICAL SCREENSHOT-FIRST RULES:
- PAGE IMAGES are the primary source.
- Inspect every supplied page from top to bottom and both columns if present.
- Return every readable academic question.
- Preserve the printed question number when visible.
- For every non-dropped question return questionBoundingBox using normalized coordinates from 0 to 1.
- questionBoundingBox must contain exactly ONE complete question.
- Include the question number, complete stem, every option, and every diagram/graph/table/matrix/circuit/figure needed for that question.
- Do not include the previous or next question.
- Keep a small safety margin so printed content is not cut off.
- sourcePage must be the actual PDF page containing the beginning of the question.
- If a complete one-page question crop cannot safely be identified, set drop=true and explain dropReason.

MCQ RULES:
- NEET and JEE questions must use questionType="mcq".
- For an MCQ, return exactly four options when four are visible.
- correctAnswer must be 0=A, 1=B, 2=C, 3=D.
- If the correct answer cannot be determined reliably, use null. Never guess.

BOARDS RULES:
- Boards may use mcq, short, or long.
- For written questions provide modelAnswer, keyPoints and maxMarks when reliably possible.

VISUAL RULES:
- If a question depends on a graph, diagram, circuit, table, geometry figure, biological diagram, chemical structure, ray diagram, apparatus, chart or similar visual, set hasVisual=true.
- Return visualBoundingBox when the individual visual can be identified.
- visualBoundingBox also uses normalized 0..1 coordinates.
- Do not invent a visual description as a replacement for the original visual.

CLASSIFICATION:
Determine subject, exam, classLevel, chapter, difficulty and questionType as accurately as possible. Use admin hints when they clearly match, but do not blindly follow contradictory hints.

CONTENT:
Preserve the question and options accurately. Mathematical and scientific notation may use valid LaTeX with $...$ or $$...$$. Do not invent missing content.

DROP RULES:
Use drop=true only when the question is incomplete, unreadable, missing essential continuation, genuinely uncertain, or its complete screenshot boundary cannot be identified safely.

OUTPUT:
Return ONLY valid JSON with this exact top-level structure:
{
  "questions": []
}

Every question object must contain:
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
`;

function buildBatchPrompt({ pages = [], text = "", hints = {} }) {
  const pageNumbers = pages
    .map((page) => Number(page?.pageNumber))
    .filter((number) => Number.isInteger(number) && number > 0);

  const pageContext = pages
    .map((page) => {
      const pageNumber = Number(page?.pageNumber);
      const pageText = cleanString(page?.text);

      return `PDF PAGE ${pageNumber}\nExtracted text context:\n${pageText.slice(
        0,
        5000
      )}`;
    })
    .join("\n\n");

  return `
Analyse this NAVTA question-paper page batch.

SUPPLIED PDF PAGES:
${pageNumbers.join(", ")}

ADMIN HINTS:
Subject: ${cleanString(hints.subject) || "Not provided"}
Preparation / Exam: ${cleanString(hints.exam) || "Not provided"}
Class: ${cleanString(hints.classLevel) || "Not provided"}

IMPORTANT:
- Inspect ALL supplied pages completely.
- PAGE IMAGES are the primary source.
- Extracted text is supporting context only.
- Do not create a question that is not visible in the supplied images.
- Every non-dropped question must have a valid questionBoundingBox.
- sourcePage must be one of: ${pageNumbers.join(", ")}.

PAGE TEXT CONTEXT:
${pageContext}

GENERAL DOCUMENT TEXT CONTEXT:
${String(text || "").slice(0, 6000)}

Return JSON only.
`;
}

function cleanJsonResponse(value) {
  return cleanString(value)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeCorrectAnswer(value) {
  if (Number.isInteger(value) && value >= 0 && value <= 3) {
    return value;
  }

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

  return Object.prototype.hasOwnProperty.call(map, text)
    ? map[text]
    : null;
}

function normalizeDetectedQuestion({
  item,
  fallbackPageNumber,
  validPageNumbers = [],
}) {
  const validPages = safeArray(validPageNumbers)
    .map(Number)
    .filter((value) => Number.isInteger(value) && value > 0);

  const requestedSourcePage = Number(item?.sourcePage);

  const sourcePage = validPages.includes(requestedSourcePage)
    ? requestedSourcePage
    : Number(fallbackPageNumber) || validPages[0] || null;

  const questionBoundingBox = normalizeBoundingBox(
    item?.questionBoundingBox
  );

  const visualBoundingBox = normalizeBoundingBox(
    item?.visualBoundingBox
  );

  const requestedVisual = Boolean(item?.hasVisual);

  let drop = Boolean(item?.drop);
  let dropReason = cleanString(item?.dropReason);

  if (!questionBoundingBox) {
    drop = true;

    if (!dropReason) {
      dropReason =
        "The complete one-question screenshot boundary could not be identified safely.";
    }
  }

  if (requestedVisual && !visualBoundingBox && !dropReason) {
    dropReason =
      "A required visual was detected but its visual bounding box could not be identified.";
  }

  let maxMarks = null;

  if (
    item?.maxMarks !== null &&
    item?.maxMarks !== undefined &&
        Number.isFinite(Number(item.maxMarks)) &&
    Number(item.maxMarks) > 0
  ) {
    maxMarks = Number(item.maxMarks);
  }

  return {
    questionNumber: cleanString(item?.questionNumber),

    question: normalizeAcademicContent(item?.question),

    subject: cleanString(item?.subject),

    exam: cleanString(item?.exam),

    classLevel: cleanString(item?.classLevel),

    chapter: cleanString(item?.chapter),

    difficulty: normalizeDifficulty(item?.difficulty),

    questionType: normalizeQuestionType(item?.questionType),

    options: safeArray(item?.options)
      .map(normalizeAcademicContent)
      .filter(Boolean),

    correctAnswer: normalizeCorrectAnswer(item?.correctAnswer),

    modelAnswer: normalizeAcademicContent(item?.modelAnswer),

    keyPoints: safeArray(item?.keyPoints)
      .map(normalizeAcademicContent)
      .filter(Boolean),

    maxMarks,

    explanation: normalizeAcademicContent(item?.explanation),

    questionBoundingBox,

    hasVisual:
      requestedVisual && Boolean(visualBoundingBox),

    visualDescription:
      cleanString(item?.visualDescription),

    visualBoundingBox,

    sourcePage,

    drop,

    dropReason,
  };
}

async function checkGeminiConnection() {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  if (!GEMINI_MODEL) {
    throw new Error(
      "GEMINI_MODEL is not configured."
    );
  }

  return true;
}

function extractGeminiError(data, fallbackMessage) {
  return (
    cleanString(data?.error?.message) ||
    fallbackMessage
  );
}

function extractGeminiText(data) {
  for (const candidate of safeArray(data?.candidates)) {
    const text = safeArray(candidate?.content?.parts)
      .map((part) =>
        typeof part?.text === "string"
          ? part.text
          : ""
      )
      .filter(Boolean)
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  return "";
}

async function requestGeminiAnalysis({
  pages = [],
  text = "",
  hints = {},
}) {
  await checkGeminiConnection();

  const validPages = safeArray(pages).filter(
    (page) =>
      Number(page?.pageNumber) > 0 &&
      Buffer.isBuffer(page?.buffer) &&
      page.buffer.length > 0
  );

  if (validPages.length === 0) {
    return [];
  }

  const validPageNumbers =
    validPages.map((page) =>
      Number(page.pageNumber)
    );

  const prompt =
    `${SYSTEM_PROMPT}\n\n${buildBatchPrompt({
      pages: validPages,
      text,
      hints,
    })}`;

  const parts = [
    {
      text: prompt,
    },
  ];

  for (const page of validPages) {
    const pageNumber =
      Number(page.pageNumber);

    const mimeType =
      cleanString(page?.mimeType) ||
      "image/png";

    parts.push({
      text:
        `The next image is PDF PAGE ${pageNumber}. Analyse the entire page from top to bottom.`,
    });

    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: imageBufferToBase64(
          page.buffer
        ),
      },
    });
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      NAVTA_AI_TIMEOUT_MS
    );

  let response;

  try {
    const endpoint =
      `${GEMINI_API_BASE}/models/${encodeURIComponent(
        GEMINI_MODEL
      )}:generateContent?key=${encodeURIComponent(
        GEMINI_API_KEY
      )}`;

    console.log(
      `NAVTA Gemini request: analysing PDF pages ${validPageNumbers.join(
        ", "
      )} using ${GEMINI_MODEL}.`
    );

    response = await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        signal:
          controller.signal,

        body:
          JSON.stringify({
            contents: [
              {
                role: "user",
                parts,
              },
            ],

            generationConfig: {
              temperature: 0.1,
              responseMimeType:
                "application/json",
            },
          }),
      }
    );
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      throw new Error(
        `Gemini timed out while analysing PDF pages ${validPageNumbers.join(
          ", "
        )}.`
      );
    }

    throw new Error(
      `NAVTA could not connect to Gemini. ${error.message}`
    );
  } finally {
    clearTimeout(timeout);
  }

  const responseText =
    await response.text();

  let data = {};

  try {
    data = responseText
      ? JSON.parse(responseText)
      : {};
  } catch {
    console.error(
      "NAVTA GEMINI RAW RESPONSE:",
      responseText
    );

    throw new Error(
      `Gemini returned an invalid API response while analysing pages ${validPageNumbers.join(
        ", "
      )}.`
    );
  }

  if (!response.ok) {
    const apiMessage =
      extractGeminiError(
        data,
        `Gemini request failed with status ${response.status}.`
      );

    throw new Error(apiMessage);
  }

  const outputText =
    extractGeminiText(data);

  if (!outputText) {
    const finishReason =
      cleanString(
        data?.candidates?.[0]?.finishReason
      );

    const blockReason =
      cleanString(
        data?.promptFeedback?.blockReason
      );

    if (blockReason) {
      throw new Error(
        `Gemini blocked the PDF analysis request: ${blockReason}.`
      );
    }

    if (finishReason) {
      throw new Error(
        `Gemini returned no question data. Finish reason: ${finishReason}.`
      );
    }

    throw new Error(
      `Gemini returned no question data for pages ${validPageNumbers.join(
        ", "
      )}.`
    );
  }

  let parsed;

  try {
    parsed =
      JSON.parse(
        cleanJsonResponse(
          outputText
        )
      );
  } catch {
    console.error(
      "NAVTA GEMINI JSON PARSE ERROR:",
      outputText
    );

    throw new Error(
      `NAVTA could not understand the Gemini JSON response for pages ${validPageNumbers.join(
        ", "
      )}.`
    );
  }

  const questions =
    safeArray(
      parsed?.questions
    );

  const fallbackPageNumber =
    validPageNumbers[0];

  const normalized =
    questions.map((item) =>
      normalizeDetectedQuestion({
        item,
        fallbackPageNumber,
        validPageNumbers,
      })
    );

  console.log(
    `NAVTA Gemini pages ${validPageNumbers.join(
      ", "
    )}: detected ${normalized.length} question(s).`
  );

  return normalized;
}
async function analyseNavtaPage({
  pageNumber,
  imageBuffer,
  mimeType = "image/png",
  text = "",
  hints = {},
}) {
  if (
    !Buffer.isBuffer(imageBuffer) ||
    imageBuffer.length === 0
  ) {
    throw new Error(
      `Rendered image for page ${pageNumber} is missing.`
    );
  }

  return requestGeminiAnalysis({
    pages: [
      {
        pageNumber:
          Number(pageNumber),

        buffer:
          imageBuffer,

        mimeType,

        text,
      },
    ],

    text,

    hints,
  });
}

function createPageBatches(
  pages = []
) {
  const batches = [];

  for (
    let index = 0;
    index < pages.length;
    index += NAVTA_AI_BATCH_SIZE
  ) {
    batches.push(
      pages.slice(
        index,
        index +
          NAVTA_AI_BATCH_SIZE
      )
    );
  }

  return batches;
}

async function analyseRenderedPages({
  pages = [],
  text = "",
  hints = {},
}) {
  if (
    !Array.isArray(pages) ||
    pages.length === 0
  ) {
    return [];
  }

  await checkGeminiConnection();

  const validPages =
    pages
      .filter(
        (page) =>
          Number(page?.pageNumber) > 0 &&
          Buffer.isBuffer(page?.buffer) &&
          page.buffer.length > 0
      )
      .sort(
        (a, b) =>
          Number(a.pageNumber) -
          Number(b.pageNumber)
      );

  if (
    validPages.length === 0
  ) {
    return [];
  }

  const batches =
    createPageBatches(
      validPages
    );

  const questions = [];

  console.log(
    "====================================================="
  );

  console.log(
    "NAVTA GEMINI PDF ANALYSIS STARTING"
  );

  console.log(
    `Total rendered pages: ${validPages.length}`
  );

  console.log(
    `Batch size: ${NAVTA_AI_BATCH_SIZE} pages`
  );

  console.log(
    `Total Gemini requests: ${batches.length}`
  );

  console.log(
    "====================================================="
  );

  for (
    let batchIndex = 0;
    batchIndex < batches.length;
    batchIndex += 1
  ) {
    const batch =
      batches[batchIndex];

    const pageNumbers =
      batch.map((page) =>
        Number(page.pageNumber)
      );

    console.log(
      `NAVTA Gemini batch ${batchIndex + 1}/${batches.length}: processing PDF pages ${pageNumbers.join(
        ", "
      )}.`
    );

    const detected =
      await requestGeminiAnalysis({
        pages: batch,
        text,
        hints,
      });

    questions.push(
      ...detected
    );

    console.log(
      `Batch ${batchIndex + 1} completed. Questions found: ${detected.length}. Total so far: ${questions.length}.`
    );
  }

  console.log(
    "====================================================="
  );

  console.log(
    "NAVTA GEMINI PDF ANALYSIS COMPLETED"
  );

  console.log(
    `Pages analysed: ${validPages.length}`
  );

  console.log(
    `Total detected questions: ${questions.length}`
  );

  console.log(
    "====================================================="
  );

  return questions;
}

module.exports = {
  analyseNavtaPage,

  analyseRenderedPages,

  checkGeminiConnection,

  checkNavtaAIGatewayConnection:
    checkGeminiConnection,

  checkOllamaConnection:
    checkGeminiConnection,
};
