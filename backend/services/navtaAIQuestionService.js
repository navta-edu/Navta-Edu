// =====================================================
// NAVTA AI QUESTION SERVICE
// Gemini Vision - Screenshot First
// Robust JSON + Automatic Page Retry
// =====================================================

const GEMINI_API_KEY = String(
  process.env.GEMINI_API_KEY || ""
).trim();

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

// One normal attempt + one retry.
const MAX_PAGE_ATTEMPTS = 2;


// =====================================================
// BASIC HELPERS
// =====================================================

const cleanString = (value = "") => {
  return String(value ?? "").trim();
};

const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const normalizeAcademicContent = (value = "") => {
  return cleanString(value)
    .replace(/```(?:latex|tex|math|markdown|json)?/gi, "")
    .replace(/```/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
};

const normalizeQuestionType = (value) => {
  const type = cleanString(value).toLowerCase();

  if (type === "mcq") return "mcq";
  if (type === "short") return "short";
  if (type === "long") return "long";

  return "";
};

const normalizeDifficulty = (value) => {
  const difficulty = cleanString(value).toLowerCase();

  if (difficulty === "easy") return "Easy";
  if (difficulty === "medium") return "Medium";
  if (difficulty === "hard") return "Hard";

  return "";
};

const normalizeCorrectAnswer = (value) => {
  if (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 3
  ) {
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
};


// =====================================================
// BOUNDING BOX
// =====================================================

const normalizeBoundingBox = (value) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  let x = Number(value.x);
  let y = Number(value.y);
  let width = Number(value.width);
  let height = Number(value.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null;
  }

  // Support percentage-style coordinates.
  if (
    x > 1 ||
    y > 1 ||
    width > 1 ||
    height > 1
  ) {
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

  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  const safeX = Math.min(1, Math.max(0, x));
  const safeY = Math.min(1, Math.max(0, y));

  const safeWidth = Math.min(
    1 - safeX,
    Math.max(0, width)
  );

  const safeHeight = Math.min(
    1 - safeY,
    Math.max(0, height)
  );

  if (safeWidth <= 0 || safeHeight <= 0) {
    return null;
  }

  return {
    x: safeX,
    y: safeY,
    width: safeWidth,
    height: safeHeight,
  };
};


// =====================================================
// IMAGE
// =====================================================

const imageBufferToBase64 = (buffer) => {
  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length === 0
  ) {
    throw new Error(
      "A valid rendered PDF page image buffer is required."
    );
  }

  return buffer.toString("base64");
};


// =====================================================
// VALIDATE PAGE
// =====================================================

const validateRenderedPage = (page) => {
  if (!page || typeof page !== "object") {
    throw new Error(
      "NAVTA AI received an invalid rendered PDF page."
    );
  }

  const pageNumber = Number(page.pageNumber);

  if (
    !Number.isInteger(pageNumber) ||
    pageNumber <= 0
  ) {
    throw new Error(
      "NAVTA AI received a rendered page without a valid page number."
    );
  }

  if (
    !Buffer.isBuffer(page.buffer) ||
    page.buffer.length === 0
  ) {
    throw new Error(
      `Rendered PDF page ${pageNumber} does not contain a valid image buffer.`
    );
  }

  return {
    ...page,
    pageNumber,
  };
};


// =====================================================
// GEMINI SYSTEM PROMPT
// =====================================================

const SYSTEM_PROMPT = `
You are NAVTA AI.

You analyse ONE ORIGINAL RENDERED PDF PAGE IMAGE at a time.

Your task is to detect every academic question visible on the supplied page image and identify the exact screenshot boundary for every complete question.

SUPPORTED SUBJECTS:
Physics
Chemistry
Maths
Biology

SUPPORTED EXAMS:
NEET
JEE
Boards

SUPPORTED CLASSES:
Class 11
Class 12

DIFFICULTY:
Easy
Medium
Hard

QUESTION TYPES:
mcq
short
long


=====================================================
PRIMARY SOURCE
=====================================================

The attached ORIGINAL PDF PAGE IMAGE is the primary source.

You MUST visually inspect the image.

Extracted text is supporting context only.

Never determine questionBoundingBox only from extracted text.


=====================================================
SCAN THE COMPLETE PAGE
=====================================================

Scan from top to bottom.

If the page has multiple columns, inspect every column.

Detect EVERY readable academic question.

Do not stop after the first few questions.


=====================================================
QUESTION SCREENSHOT
=====================================================

Every non-dropped question MUST contain:

"questionBoundingBox": {
  "x": 0.0,
  "y": 0.0,
  "width": 0.0,
  "height": 0.0
}

Coordinates are normalized from 0 to 1.

x = left edge / page width
y = top edge / page height
width = crop width / page width
height = crop height / page height

The rectangle MUST contain exactly ONE complete question.

Include:

- question number
- complete question statement
- all answer options
- equations
- matrices
- determinants
- diagrams
- graphs
- circuits
- tables
- figures
- structures
- any visual required by that question

Do NOT include the previous question.

Do NOT include the next question.

Use a small safety margin.


=====================================================
IMPORTANT BOUNDING-BOX RULE
=====================================================

If you can visually see the complete question, estimate a bounding box.

Do NOT return questionBoundingBox=null merely because the coordinates are not pixel-perfect.

The crop needs to be safely usable, not mathematically perfect.

Use null only when the complete question boundary genuinely cannot be determined.


=====================================================
MCQ
=====================================================

NEET and JEE questions use questionType="mcq".

Return four options when four options are visible.

correctAnswer:

0 = A
1 = B
2 = C
3 = D

If uncertain, return null.

Never guess merely to make a question valid.


=====================================================
BOARDS
=====================================================

Boards may contain:

mcq
short
long

For written questions provide when reliable:

modelAnswer
keyPoints
maxMarks


=====================================================
VISUAL QUESTIONS
=====================================================

If a question contains an important diagram, graph, circuit, table, figure or other visual:

hasVisual=true

When possible also return visualBoundingBox.

However, questionBoundingBox must already contain the COMPLETE question including that visual.


=====================================================
DROP RULES
=====================================================

Do NOT drop because:

- correct answer is uncertain
- difficulty is uncertain
- chapter is uncertain
- explanation is unavailable

Use drop=true only when:

- the actual question is unreadable
- the question is incomplete
- essential continuation is on another page
- complete screenshot boundary genuinely cannot be identified


=====================================================
JSON OUTPUT
=====================================================

Return ONLY JSON.

No Markdown.

No code fences.

No introduction.

No explanation outside JSON.

Top-level structure MUST be:

{
  "questions": []
}

Every question object MUST use:

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

IMPORTANT:

Keep JSON compact.

Do not repeat the question.

Do not add analysis.

Do not add comments.

Do not add trailing commas.

Always close every:
- string
- object
- array

Before responding, verify that the JSON is syntactically complete.
`;


// =====================================================
// PAGE PROMPT
// =====================================================

const buildPagePrompt = ({
  page,
  text = "",
  hints = {},
  retry = false,
}) => {
  const pageNumber = Number(page.pageNumber);

  const subjectHint =
    cleanString(hints?.subject) || "Not provided";

  const examHint =
    cleanString(hints?.exam) || "Not provided";

  const classHint =
    cleanString(hints?.classLevel) || "Not provided";

  const pageText =
    cleanString(page?.text);

  const retryInstruction = retry
    ? `
IMPORTANT RETRY:
Your previous response for this same page could not be parsed as valid JSON.

Return SHORTER and STRICTER JSON this time.

Do not include unnecessary explanation text.

Do not use Markdown.

Do not use code fences.

Make sure the final closing ] and } are present.
`
    : "";

  return `
Analyse ORIGINAL PDF PAGE ${pageNumber}.

${retryInstruction}

ADMIN HINTS:

Subject:
${subjectHint}

Preparation / Exam:
${examHint}

Class:
${classHint}

IMPORTANT:

You are receiving the actual rendered PNG for PDF page ${pageNumber}.

Visually inspect the COMPLETE image.

Detect every readable academic question.

Every non-dropped question must have questionBoundingBox.

Every sourcePage must equal:

${pageNumber}

PAGE TEXT SUPPORT:

${pageText.slice(0, 5000)}

GENERAL DOCUMENT SUPPORT:

${String(text || "").slice(0, 3000)}

Return ONLY:

{
  "questions": [...]
}

Make the JSON syntactically complete.
`;
};


// =====================================================
// BUILD GEMINI PARTS
// =====================================================

const buildGeminiParts = ({
  page,
  text = "",
  hints = {},
  retry = false,
}) => {
  const validPage =
    validateRenderedPage(page);

  return [
    {
      text:
        SYSTEM_PROMPT +
        "\n\n" +
        buildPagePrompt({
          page: validPage,
          text,
          hints,
          retry,
        }),
    },

    {
      text:
        `The next image is ORIGINAL PDF PAGE ${validPage.pageNumber}. Visually inspect this image and determine questionBoundingBox for every complete question.`,
    },

    {
      inlineData: {
        mimeType: "image/png",

        data: imageBufferToBase64(
          validPage.buffer
        ),
      },
    },
  ];
};


// =====================================================
// GEMINI RESPONSE HELPERS
// =====================================================

const extractGeminiText = (data) => {
  for (const candidate of safeArray(data?.candidates)) {
    const output = safeArray(
      candidate?.content?.parts
    )
      .map((part) =>
        typeof part?.text === "string"
          ? part.text
          : ""
      )
      .filter(Boolean)
      .join("\n")
      .trim();

    if (output) {
      return output;
    }
  }

  return "";
};

const extractGeminiError = (
  data,
  fallbackMessage
) => {
  return (
    cleanString(data?.error?.message) ||
    fallbackMessage
  );
};


// =====================================================
// ROBUST JSON CLEANER
// =====================================================

const stripJsonFences = (value) => {
  let text = cleanString(value);

  text = text.replace(
    /^```(?:json|javascript|js)?\s*/i,
    ""
  );

  text = text.replace(
    /\s*```$/i,
    ""
  );

  return text.trim();
};


// =====================================================
// FIND COMPLETE OUTER JSON OBJECT
// =====================================================

const extractOuterJsonObject = (value) => {
  const text = stripJsonFences(value);

  const start = text.indexOf("{");

  if (start === -1) {
    return text;
  }

  let inString = false;
  let escaped = false;
  let depth = 0;

  for (
    let index = start;
    index < text.length;
    index += 1
  ) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return text.slice(
          start,
          index + 1
        );
      }
    }
  }

  // Possibly truncated. Return from first { onward so
  // recovery can try to repair it.
  return text.slice(start);
};


// =====================================================
// REMOVE TRAILING COMMAS
// =====================================================

const removeTrailingCommas = (value) => {
  return String(value || "").replace(
    /,\s*([}\]])/g,
    "$1"
  );
};


// =====================================================
// SIMPLE TRUNCATED JSON REPAIR
// =====================================================

const repairTruncatedJson = (value) => {
  let text = removeTrailingCommas(
    extractOuterJsonObject(value)
  ).trim();

  if (!text) {
    return "";
  }

  // If the model was cut off inside an unfinished
  // string, safely close that string first.
  let inString = false;
  let escaped = false;

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
    }
  }

  if (escaped) {
    text += "\\";
  }

  if (inString) {
    text += '"';
  }

  // Remove a final incomplete key/value separator.
  text = text.replace(/,\s*$/, "");

  const stack = [];

  inString = false;
  escaped = false;

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      stack.push("}");
    } else if (char === "[") {
      stack.push("]");
    } else if (
      char === "}" ||
      char === "]"
    ) {
      if (
        stack.length > 0 &&
        stack[stack.length - 1] === char
      ) {
        stack.pop();
      }
    }
  }

  while (stack.length > 0) {
    text += stack.pop();
  }

  return removeTrailingCommas(text);
};


// =====================================================
// TRY MULTIPLE JSON PARSING STRATEGIES
// =====================================================

const tryParseGeminiJson = (rawResponse) => {
  const attempts = [];

  const raw = stripJsonFences(rawResponse);

  if (raw) {
    attempts.push(raw);
  }

  const outer = extractOuterJsonObject(raw);

  if (
    outer &&
    !attempts.includes(outer)
  ) {
    attempts.push(outer);
  }

  const noTrailing =
    removeTrailingCommas(outer);

  if (
    noTrailing &&
    !attempts.includes(noTrailing)
  ) {
    attempts.push(noTrailing);
  }

  const repaired =
    repairTruncatedJson(outer);

  if (
    repaired &&
    !attempts.includes(repaired)
  ) {
    attempts.push(repaired);
  }

  for (const candidate of attempts) {
    try {
      return {
        success: true,
        parsed: JSON.parse(candidate),
        candidate,
      };
    } catch {
      // Try next strategy.
    }
  }

  return {
    success: false,
    parsed: null,
    candidate: repaired || outer || raw,
  };
};


// =====================================================
// NORMALIZE QUESTION
// =====================================================

const normalizeDetectedQuestion = ({
  item,
  pageNumber,
}) => {
  const questionBoundingBox =
    normalizeBoundingBox(
      item?.questionBoundingBox
    );

  const visualBoundingBox =
    normalizeBoundingBox(
      item?.visualBoundingBox
    );

  let drop = Boolean(item?.drop);

  let dropReason =
    cleanString(item?.dropReason);

  if (!questionBoundingBox) {
    drop = true;

    if (!dropReason) {
      dropReason =
        "The complete one-question screenshot boundary could not be identified safely.";
    }
  }

  const options = safeArray(item?.options)
    .map(normalizeAcademicContent)
    .filter(Boolean);

  const keyPoints = safeArray(item?.keyPoints)
    .map(normalizeAcademicContent)
    .filter(Boolean);

  let maxMarks = null;

  if (
    item?.maxMarks !== null &&
    item?.maxMarks !== undefined
  ) {
    const marks = Number(item.maxMarks);

    if (
      Number.isFinite(marks) &&
      marks > 0
    ) {
      maxMarks = marks;
    }
  }

  return {
    questionNumber:
      cleanString(item?.questionNumber),

    question:
      normalizeAcademicContent(item?.question),

    subject:
      cleanString(item?.subject),

    exam:
      cleanString(item?.exam),

    classLevel:
      cleanString(item?.classLevel),

    chapter:
      cleanString(item?.chapter),

    difficulty:
      normalizeDifficulty(item?.difficulty),

    questionType:
      normalizeQuestionType(item?.questionType),

    options,

    correctAnswer:
      normalizeCorrectAnswer(
        item?.correctAnswer
      ),

    modelAnswer:
      normalizeAcademicContent(
        item?.modelAnswer
      ),

    keyPoints,

    maxMarks,

    explanation:
      normalizeAcademicContent(
        item?.explanation
      ),

    questionBoundingBox,

    hasVisual:
      Boolean(item?.hasVisual),

    visualDescription:
      cleanString(
        item?.visualDescription
      ),

    visualBoundingBox,

    // We analyse exactly one page at a time, so force
    // the real page number instead of trusting AI.
    sourcePage:
      Number(pageNumber),

    drop,

    dropReason,
  };
};


// =====================================================
// PARSE QUESTIONS
// =====================================================

const parseGeminiQuestions = ({
  rawResponse,
  pageNumber,
}) => {
  const result =
    tryParseGeminiJson(rawResponse);

  if (!result.success) {
    const error = new Error(
      `NAVTA could not understand the Gemini JSON response for PDF page ${pageNumber}.`
    );

    error.code =
      "NAVTA_GEMINI_JSON_PARSE_ERROR";

    error.pageNumber =
      pageNumber;

    error.rawGeminiResponse =
      cleanString(rawResponse).slice(
        0,
        12000
      );

    throw error;
  }

  const parsed = result.parsed;

  const rawQuestions =
    Array.isArray(parsed)
      ? parsed
      : safeArray(parsed?.questions);

  return rawQuestions
    .filter(
      (item) =>
        item &&
        typeof item === "object"
    )
    .map((item) =>
      normalizeDetectedQuestion({
        item,
        pageNumber,
      })
    );
};


// =====================================================
// SINGLE GEMINI API REQUEST
// =====================================================

const sendGeminiPageRequest = async ({
  page,
  text = "",
  hints = {},
  retry = false,
}) => {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the NAVTA backend."
    );
  }

  const validPage =
    validateRenderedPage(page);

  const pageNumber =
    validPage.pageNumber;

  const parts =
    buildGeminiParts({
      page: validPage,
      text,
      hints,
      retry,
    });

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      NAVTA_AI_TIMEOUT_MS
    );

  try {
    const endpoint =
      `${GEMINI_API_BASE}/models/${encodeURIComponent(
        GEMINI_MODEL
      )}:generateContent?key=${encodeURIComponent(
        GEMINI_API_KEY
      )}`;

    console.log(
      `NAVTA Gemini Vision: PDF page ${pageNumber}, ${
        retry ? "retry" : "first attempt"
      }.`
    );

    const response =
      await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        signal: controller.signal,

        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts,
            },
          ],

          generationConfig: {
            temperature: 0.05,

            responseMimeType:
              "application/json",

            // Give page responses enough room to finish.
            maxOutputTokens: 8192,
          },
        }),
      });

    const responseText =
      await response.text();

    let responseData;

    try {
      responseData = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      throw new Error(
        `Gemini returned an invalid HTTP response for PDF page ${pageNumber}.`
      );
    }

    if (!response.ok) {
      throw new Error(
        `Gemini could not analyse PDF page ${pageNumber}. ${extractGeminiError(
          responseData,
          `HTTP ${response.status}`
        )}`
      );
    }

    const blockReason =
      cleanString(
        responseData?.promptFeedback?.blockReason
      );

    if (blockReason) {
      throw new Error(
        `Gemini blocked PDF page ${pageNumber}. Reason: ${blockReason}.`
      );
    }

    const modelText =
      extractGeminiText(responseData);

    if (!modelText) {
      const finishReason =
        cleanString(
          responseData?.candidates?.[0]
            ?.finishReason
        );

      throw new Error(
        `Gemini returned no question JSON for PDF page ${pageNumber}${
          finishReason
            ? `. Finish reason: ${finishReason}`
            : "."
        }`
      );
    }

    return {
      modelText,
      responseData,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        `Gemini timed out while analysing PDF page ${pageNumber}.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
// =====================================================
// AUTO-RETRY SAME PAGE ON BAD JSON
// =====================================================

const analyseSinglePageWithRetry = async ({
  page,
  text = "",
  hints = {},
}) => {
  const validPage =
    validateRenderedPage(page);

  const pageNumber =
    validPage.pageNumber;

  let lastError =
    null;


  for (
    let attempt = 1;
    attempt <= MAX_PAGE_ATTEMPTS;
    attempt += 1
  ) {
    const retry =
      attempt > 1;


    try {
      const response =
        await sendGeminiPageRequest({
          page:
            validPage,

          text,

          hints,

          retry,
        });


      const questions =
        parseGeminiQuestions({
          rawResponse:
            response.modelText,

          pageNumber,
        });


      const screenshotCount =
        questions.filter(
          (question) =>
            Boolean(
              question
                ?.questionBoundingBox
            )
        ).length;


      const droppedCount =
        questions.filter(
          (question) =>
            Boolean(
              question?.drop
            )
        ).length;


      console.log(
        `NAVTA page ${pageNumber}: detected=${questions.length}, screenshotBoxes=${screenshotCount}, dropped=${droppedCount}, attempt=${attempt}.`
      );


      return questions;
    } catch (error) {
      lastError =
        error;


      console.error(
        `NAVTA page ${pageNumber} attempt ${attempt} failed:`,
        error?.message ||
          error
      );


      const isJsonError =
        error?.code ===
        "NAVTA_GEMINI_JSON_PARSE_ERROR";


      // ===============================================
      // ONLY AUTO-RETRY PARSE FAILURES
      // ===============================================
      //
      // If Gemini/API itself fails due to auth, quota,
      // model availability, etc., retrying malformed
      // output logic will not help.
      // ===============================================

      if (
        !isJsonError ||
        attempt >=
          MAX_PAGE_ATTEMPTS
      ) {
        break;
      }


      console.log(
        `NAVTA will retry PDF page ${pageNumber} with shorter strict JSON instructions.`
      );
    }
  }


  throw (
    lastError ||
    new Error(
      `NAVTA could not analyse PDF page ${pageNumber}.`
    )
  );
};


// =====================================================
// ANALYSE ONE PAGE - PUBLIC FUNCTION
// =====================================================

const analyseNavtaPage =
  async ({
    page,
    pageNumber,
    imageBuffer,
    mimeType = "image/png",
    text = "",
    hints = {},
  } = {}) => {
    let renderedPage =
      page;


    // =================================================
    // BACKWARD COMPATIBILITY
    // =================================================
    //
    // Older NAVTA code may call:
    //
    // analyseNavtaPage({
    //   pageNumber,
    //   imageBuffer
    // })
    //
    // New code may call:
    //
    // analyseNavtaPage({
    //   page: {
    //     pageNumber,
    //     buffer
    //   }
    // })
    //
    // Support both.
    // =================================================

    if (!renderedPage) {
      renderedPage = {
        pageNumber:
          Number(
            pageNumber
          ),

        buffer:
          imageBuffer,

        mimeType,

        text:
          cleanString(
            text
          ),
      };
    }


    const validPage =
      validateRenderedPage(
        renderedPage
      );


    return analyseSinglePageWithRetry({
      page:
        validPage,

      text:
        text ||
        validPage.text ||
        "",

      hints,
    });
  };


// =====================================================
// REMOVE EXACT DUPLICATES
// =====================================================

const removeExactDuplicates = (
  questions = []
) => {
  const seen =
    new Set();


  const output =
    [];


  for (
    const question of
    safeArray(
      questions
    )
  ) {
    const sourcePage =
      Number(
        question?.sourcePage
      ) ||
      0;


    const questionNumber =
      cleanString(
        question?.questionNumber
      )
        .toLowerCase();


    const questionText =
      cleanString(
        question?.question
      )
        .replace(
          /\s+/g,
          " "
        )
        .toLowerCase();


    const key =
      `${sourcePage}|${questionNumber}|${questionText}`;


    if (
      questionText &&
      seen.has(
        key
      )
    ) {
      continue;
    }


    if (
      questionText
    ) {
      seen.add(
        key
      );
    }


    output.push(
      question
    );
  }


  return output;
};


// =====================================================
// SORT QUESTIONS IN ORIGINAL PDF ORDER
// =====================================================

const sortQuestionsInPdfOrder = (
  questions = []
) => {
  return [
    ...safeArray(
      questions
    ),
  ].sort(
    (
      first,
      second
    ) => {
      const firstPage =
        Number(
          first?.sourcePage
        ) ||
        0;


      const secondPage =
        Number(
          second?.sourcePage
        ) ||
        0;


      if (
        firstPage !==
        secondPage
      ) {
        return (
          firstPage -
          secondPage
        );
      }


      // ===============================================
      // SORT BY VERTICAL IMAGE POSITION FIRST
      // ===============================================

      const firstY =
        Number(
          first
            ?.questionBoundingBox
            ?.y
        );


      const secondY =
        Number(
          second
            ?.questionBoundingBox
            ?.y
        );


      if (
        Number.isFinite(
          firstY
        ) &&
        Number.isFinite(
          secondY
        ) &&
        firstY !==
          secondY
      ) {
        return (
          firstY -
          secondY
        );
      }


      // ===============================================
      // FALL BACK TO PRINTED QUESTION NUMBER
      // ===============================================

      const firstNumber =
        Number.parseInt(
          cleanString(
            first?.questionNumber
          ).replace(
            /\D+/g,
            ""
          ),
          10
        );


      const secondNumber =
        Number.parseInt(
          cleanString(
            second?.questionNumber
          ).replace(
            /\D+/g,
            ""
          ),
          10
        );


      if (
        Number.isFinite(
          firstNumber
        ) &&
        Number.isFinite(
          secondNumber
        )
      ) {
        return (
          firstNumber -
          secondNumber
        );
      }


      return 0;
    }
  );
};


// =====================================================
// ANALYSE ALL RENDERED PDF PAGES
// =====================================================
//
// IMPORTANT:
//
// navtaAIImportService.js imports:
//
// const {
//   analyseRenderedPages,
// } = require("./navtaAIQuestionService");
//
// Therefore this function name MUST stay exactly the
// same.
//
// SCREENSHOT-FIRST MODE:
//
// PAGE 1
//   -> Gemini Vision
//   -> parse JSON
//   -> retry PAGE 1 once if JSON malformed
//   -> questionBoundingBox
//
// PAGE 2
//   -> same flow
//
// PAGE 3
//   -> same flow
//
// Continues sequentially until final page.
// =====================================================

const analyseRenderedPages =
  async ({
    pages = [],
    text = "",
    hints = {},
  } = {}) => {
    if (
      !Array.isArray(
        pages
      ) ||
      pages.length === 0
    ) {
      return [];
    }


    // =================================================
    // VALIDATE + SORT PAGES
    // =================================================

    const validPages =
      pages
        .filter(
          (page) =>
            page &&
            Number.isInteger(
              Number(
                page.pageNumber
              )
            ) &&
            Number(
              page.pageNumber
            ) > 0 &&
            Buffer.isBuffer(
              page.buffer
            ) &&
            page.buffer.length >
              0
        )
        .map(
          (page) => ({
            ...page,

            pageNumber:
              Number(
                page.pageNumber
              ),
          })
        )
        .sort(
          (
            first,
            second
          ) =>
            first.pageNumber -
            second.pageNumber
        );


    if (
      validPages.length ===
      0
    ) {
      throw new Error(
        "NAVTA AI received no valid rendered PDF page images."
      );
    }


    console.log(
      "====================================================="
    );

    console.log(
      "NAVTA SCREENSHOT-FIRST ANALYSIS STARTING"
    );

    console.log(
      `Pages to analyse: ${validPages.length}`
    );

    console.log(
      "Mode: ONE PAGE AT A TIME"
    );

    console.log(
      `Maximum attempts per page: ${MAX_PAGE_ATTEMPTS}`
    );

    console.log(
      "====================================================="
    );


    const allQuestions =
      [];


    // =================================================
    // PROCESS EACH PAGE SEQUENTIALLY
    // =================================================
    //
    // Do NOT use Promise.all here.
    //
    // Sequential execution:
    //
    // - reduces Gemini pressure
    // - keeps coordinates page-local
    // - lets each malformed page retry independently
    // =================================================

    for (
      let pageIndex = 0;
      pageIndex <
      validPages.length;
      pageIndex += 1
    ) {
      const page =
        validPages[
          pageIndex
        ];


      const pageNumber =
        page.pageNumber;


      console.log(
        `NAVTA analysing PDF page ${pageNumber} (${pageIndex + 1}/${validPages.length}).`
      );


      const pageSpecificText =
        cleanString(
          page?.text
        );


      const pageQuestions =
        await analyseSinglePageWithRetry({
          page,

          text:
            pageSpecificText ||
            text,

          hints,
        });


      // =================================================
      // FORCE REAL SOURCE PAGE
      // =================================================

      const normalizedQuestions =
        pageQuestions.map(
          (question) => ({
            ...question,

            sourcePage:
              pageNumber,
          })
        );


      allQuestions.push(
        ...normalizedQuestions
      );


      const screenshotCount =
        normalizedQuestions.filter(
          (question) =>
            Boolean(
              question
                ?.questionBoundingBox
            )
        ).length;


      const droppedCount =
        normalizedQuestions.filter(
          (question) =>
            Boolean(
              question?.drop
            )
        ).length;


      console.log(
        `NAVTA PDF page ${pageNumber} complete: detected=${normalizedQuestions.length}, screenshotBoxes=${screenshotCount}, dropped=${droppedCount}.`
      );
    }


    // =================================================
    // DEDUPE
    // =================================================

    const deduplicatedQuestions =
      removeExactDuplicates(
        allQuestions
      );


    // =================================================
    // ORIGINAL PDF ORDER
    // =================================================

    const sortedQuestions =
      sortQuestionsInPdfOrder(
        deduplicatedQuestions
      );


    // =================================================
    // FINAL SUMMARY
    // =================================================

    const withScreenshots =
      sortedQuestions.filter(
        (question) =>
          Boolean(
            question
              ?.questionBoundingBox
          )
      );


    const withoutScreenshots =
      sortedQuestions.filter(
        (question) =>
          !question
            ?.questionBoundingBox
      );


    const dropped =
      sortedQuestions.filter(
        (question) =>
          Boolean(
            question?.drop
          )
      );


    console.log(
      "====================================================="
    );

    console.log(
      "NAVTA SCREENSHOT-FIRST ANALYSIS COMPLETE"
    );

    console.log(
      `Pages analysed: ${validPages.length}`
    );

    console.log(
      `Questions detected: ${sortedQuestions.length}`
    );

    console.log(
      `Valid screenshot boxes: ${withScreenshots.length}`
    );

    console.log(
      `Missing screenshot boxes: ${withoutScreenshots.length}`
    );

    console.log(
      `Questions marked dropped: ${dropped.length}`
    );

    console.log(
      "====================================================="
    );


    return sortedQuestions;
  };


// =====================================================
// GEMINI CONNECTION CHECK
// =====================================================

const checkGeminiConnection =
  async () => {
    if (
      !GEMINI_API_KEY
    ) {
      return {
        ok:
          false,

        provider:
          "gemini",

        model:
          GEMINI_MODEL,

        message:
          "GEMINI_API_KEY is not configured.",
      };
    }


    if (
      !GEMINI_MODEL
    ) {
      return {
        ok:
          false,

        provider:
          "gemini",

        model:
          "",

        message:
          "GEMINI_MODEL is not configured.",
      };
    }


    const controller =
      new AbortController();


    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        Math.min(
          NAVTA_AI_TIMEOUT_MS,
          30000
        )
      );


    try {
      const endpoint =
        `${GEMINI_API_BASE}/models/${encodeURIComponent(
          GEMINI_MODEL
        )}?key=${encodeURIComponent(
          GEMINI_API_KEY
        )}`;


      const response =
        await fetch(
          endpoint,
          {
            method:
              "GET",

            headers: {
              Accept:
                "application/json",
            },

            signal:
              controller.signal,
          }
        );


      const responseText =
        await response.text();


      let responseData =
        {};


      try {
        responseData =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};
      } catch {
        responseData =
          {};
      }


      if (
        !response.ok
      ) {
        return {
          ok:
            false,

          provider:
            "gemini",

          model:
            GEMINI_MODEL,

          status:
            response.status,

          message:
            extractGeminiError(
              responseData,
              responseText ||
                `Gemini returned HTTP ${response.status}.`
            ),
        };
      }


      return {
        ok:
          true,

        provider:
          "gemini",

        model:
          GEMINI_MODEL,

        message:
          "NAVTA Gemini connection is available.",
      };
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        return {
          ok:
            false,

          provider:
            "gemini",

          model:
            GEMINI_MODEL,

          message:
            "Gemini connection check timed out.",
        };
      }


      return {
        ok:
          false,

        provider:
          "gemini",

        model:
          GEMINI_MODEL,

        message:
          error?.message ||
          "Gemini connection check failed.",
      };
    } finally {
      clearTimeout(
        timeout
      );
    }
  };


// =====================================================
// EXPORTS
// =====================================================
//
// CRITICAL:
//
// navtaAIImportService.js imports:
//
// analyseRenderedPages
//
// Keep this export exactly.
// =====================================================

module.exports = {
  analyseNavtaPage,

  analyseRenderedPages,

  checkGeminiConnection,

  checkNavtaAIGatewayConnection:
    checkGeminiConnection,

  checkOllamaConnection:
    checkGeminiConnection,
};
