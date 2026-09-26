// =====================================================
// NAVTA AI QUESTION SERVICE
// Gemini quota-optimized question separator
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
  Number(
    process.env.NAVTA_AI_TIMEOUT_MS || 90000
  ) || 90000
);

const NAVTA_AI_PAGES_PER_REQUEST = Math.max(
  1,
  Math.min(
    3,
    Number(
      process.env.NAVTA_AI_PAGES_PER_REQUEST || 1
    ) || 1
  )
);

// Retry only pages/batches that unexpectedly return zero questions.
const NAVTA_AI_EMPTY_BATCH_RETRIES = Math.max(
  0,
  Math.min(
    2,
    Number(
      process.env.NAVTA_AI_EMPTY_BATCH_RETRIES || 1
    ) || 1
  )
);

const NAVTA_VISUAL_MARKER = "[[NAVTA_VISUAL]]";

const NAVTA_AI_VERIFY_LOW_CONFIDENCE =
  String(
    process.env.NAVTA_AI_VERIFY_LOW_CONFIDENCE ?? "true"
  ).toLowerCase() !== "false";

// =====================================================
// HELPERS
// =====================================================

const cleanString = (value = "") => {
  return String(value ?? "").trim();
};

const safeArray = (value) => {
  return Array.isArray(value)
    ? value
    : [];
};

// =====================================================
// NAVTA SIMPLE SUBSCRIPT / SUPERSCRIPT NORMALIZER
// =====================================================

const NAVTA_SUBSCRIPT_MAP = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
};

const NAVTA_SUPERSCRIPT_MAP = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
};

const convertNavtaScriptCharacters = (
  value,
  map
) =>
  String(value ?? "")
    .split("")
    .map(
      (character) =>
        map[character] || character
    )
    .join("");

const formatNavtaSimpleScripts = (
  input = ""
) => {
  let value =
    String(input ?? "");

  if (!value) {
    return "";
  }

  value = value.replace(
    /_\{([0-9+\-=()]+)\}/g,
    (_, content) =>
      convertNavtaScriptCharacters(
        content,
        NAVTA_SUBSCRIPT_MAP
      )
  );

  value = value.replace(
    /_([0-9+\-=()]+)/g,
    (_, content) =>
      convertNavtaScriptCharacters(
        content,
        NAVTA_SUBSCRIPT_MAP
      )
  );

  value = value.replace(
    /\^\{([0-9+\-=()]+)\}/g,
    (_, content) =>
      convertNavtaScriptCharacters(
        content,
        NAVTA_SUPERSCRIPT_MAP
      )
  );

  value = value.replace(
    /\^([0-9+\-=()]+)/g,
    (_, content) =>
      convertNavtaScriptCharacters(
        content,
        NAVTA_SUPERSCRIPT_MAP
      )
  );

  return value;
};

// =====================================================
// ENUMERATED STATEMENT FORMATTER
// =====================================================

const formatEnumeratedStatements = (input = "") => {
  let value = String(input ?? "");

  if (!value) {
    return "";
  }

  value = value.replace(
    /\s*(\((?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx)\))\s*/gi,
    "\n$1 "
  );

  value = value.replace(
    /\s*(\([a-h]\))\s*/gi,
    "\n$1 "
  );

  value = value.replace(
    /\s*(Statement\s+(?:I|II|III|IV|V|VI|VII|VIII|IX|X)\b)\s*/gi,
    "\n$1 "
  );

  value = value.replace(
    /\s*(Assertion\s*:?\s*)/gi,
    "\n$1"
  );

  value = value.replace(
    /\s*(Reason\s*:?\s*)/gi,
    "\n$1"
  );

  return value
    .replace(/^\s*\n+/, "")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

// =====================================================
// FORMAT QUESTION CONTENT
// =====================================================

const formatNavtaQuestionContent = (
  input = ""
) => {
  const source =
    String(input ?? "");

  if (!source) {
    return "";
  }

  const parts =
    source.split(
      /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g
    );

  return parts
    .map(
      (part) => {
        if (!part) {
          return "";
        }

        if (
          (
            part.startsWith("$$") &&
            part.endsWith("$$")
          ) ||
          (
            part.startsWith("$") &&
            part.endsWith("$")
          )
        ) {
          return part.trim();
        }

        return formatEnumeratedStatements(
          formatNavtaSimpleScripts(
            part
          )
        );
      }
    )
    .join("")
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
};

const normalizeConfidence = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (
    numeric >= 0 &&
    numeric <= 1
  ) {
    return numeric;
  }

  if (
    numeric > 1 &&
    numeric <= 100
  ) {
    return numeric / 100;
  }

  return null;
};

const LOW_CONFIDENCE_THRESHOLDS = {
  chapter: 0.9,
  answer: 0.85,
  classification: 0.9,
  difficulty: 0.75,
};

// =====================================================
// NORMALIZERS
// =====================================================

const normalizeQuestionType = (
  value
) => {
  const type = cleanString(
    value
  ).toLowerCase();

  if (
    [
      "mcq",
      "short",
      "long",
    ].includes(type)
  ) {
    return type;
  }

  return "";
};

const normalizeDifficulty = (
  value
) => {
  const text = cleanString(
    value
  ).toLowerCase();

  if (text === "easy") {
    return "Easy";
  }

  if (text === "medium") {
    return "Medium";
  }

  if (text === "hard") {
    return "Hard";
  }

  return "";
};

const normalizeSubject = (
  value
) => {
  const text = cleanString(
    value
  ).toLowerCase();

  if (text === "physics") {
    return "Physics";
  }

  if (text === "chemistry") {
    return "Chemistry";
  }

  if (
    [
      "math",
      "maths",
      "mathematics",
    ].includes(text)
  ) {
    return "Maths";
  }

  if (text === "biology") {
    return "Biology";
  }

  return "";
};

const normalizeExam = (
  value
) => {
  const text = cleanString(
    value
  ).toLowerCase();

  if (text.includes("neet")) {
    return "NEET";
  }

  if (text.includes("jee")) {
    return "JEE";
  }

  if (
    text.includes("board") ||
    text.includes("cbse")
  ) {
    return "Boards";
  }

  return "";
};

const normalizeClassLevel = (
  value
) => {
  const text = cleanString(
    value
  ).toLowerCase();

  if (
    text.includes("11") ||
    text === "xi"
  ) {
    return "Class 11";
  }

  if (
    text.includes("12") ||
    text === "xii"
  ) {
    return "Class 12";
  }

  return "";
};

const normalizeCorrectAnswer = (
  value
) => {
  if (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 3
  ) {
    return value;
  }

  const text = cleanString(
    value
  ).toUpperCase();

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

  if (
    Object.prototype.hasOwnProperty.call(
      map,
      text
    )
  ) {
    return map[text];
  }

  return null;
};


// =====================================================
// MCQ OPTION QUALITY
// =====================================================
const normalizeOptionLabelOnlyValue = (value = "") => {
  return cleanString(value)
    .replace(/^[\s([{]+|[\s)\]}]+$/g, "")
    .replace(/[.:]/g, "")
    .trim()
    .toUpperCase();
};

const hasPlaceholderOnlyMcqOptions = (options = []) => {
  const values = safeArray(options)
    .map(normalizeOptionLabelOnlyValue)
    .filter(Boolean);

  if (values.length !== 4) {
    return false;
  }

  return [
    ["A", "B", "C", "D"],
    ["1", "2", "3", "4"],
  ].some((set) =>
    set.every(
      (value, index) =>
        values[index] === value
    )
  );
};

// =====================================================
// ESSENTIAL VISUAL LANGUAGE DETECTOR
// =====================================================
// This never invents a crop box and never uses questionBoundingBox.
const questionTextStronglyImpliesVisual = (value = "") => {
  const text = cleanString(value).toLowerCase();
  if (!text) return false;

  return [
    /\bfollowing\s+reaction\b/i,
    /\bfollowing\s+reaction\s+scheme\b/i,
    /\bfollowing\s+scheme\b/i,
    /\bfollowing\s+structure\b/i,
    /\bfollowing\s+diagram\b/i,
    /\bfollowing\s+figure\b/i,
    /\bfollowing\s+graph\b/i,
    /\bfollowing\s+circuit\b/i,
    /\bfollowing\s+ray\s+diagram\b/i,
    /\bfollowing\s+apparatus\b/i,
    /\bshown\s+below\b/i,
    /\bshown\s+in\s+the\s+(?:figure|diagram|graph|circuit)\b/i,
    /\bgiven\s+(?:below|above)\b/i,
    /\bfrom\s+the\s+(?:figure|diagram|graph|circuit)\b/i,
  ].some((pattern) => pattern.test(text));
};

// =====================================================
// VISUAL TYPE
// =====================================================

const normalizeVisualType = (
  value
) => {
  const text = cleanString(
    value
  ).toLowerCase();

  const allowed = new Set([
    "none",
    "diagram",
    "graph",
    "figure",
    "circuit",
    "geometry",
    "table",
    "chemical-structure",
    "biology",
    "image",
    "other",
  ]);

  if (
    allowed.has(text)
  ) {
    return text;
  }

  return "none";
};

// =====================================================
// BOUNDING BOX
// =====================================================

const normalizeBoundingBox = (value) => {
  if (!value) return null;

  let x;
  let y;
  let width;
  let height;

  if (Array.isArray(value) && value.length >= 4) {
    // Gemini commonly expresses boxes as [ymin, xmin, ymax, xmax].
    const [yMin, xMin, yMax, xMax] = value.map(Number);
    if ([yMin, xMin, yMax, xMax].every(Number.isFinite)) {
      x = xMin;
      y = yMin;
      width = xMax - xMin;
      height = yMax - yMin;
    }
  } else if (typeof value === "object") {
    const directX = Number(value.x);
    const directY = Number(value.y);
    const directWidth = Number(value.width);
    const directHeight = Number(value.height);

    if ([directX, directY, directWidth, directHeight].every(Number.isFinite)) {
      x = directX;
      y = directY;
      width = directWidth;
      height = directHeight;
    } else {
      const xMin = Number(value.xMin ?? value.xmin ?? value.left);
      const yMin = Number(value.yMin ?? value.ymin ?? value.top);
      const xMax = Number(value.xMax ?? value.xmax ?? value.right);
      const yMax = Number(value.yMax ?? value.ymax ?? value.bottom);

      if ([xMin, yMin, xMax, yMax].every(Number.isFinite)) {
        x = xMin;
        y = yMin;
        width = xMax - xMin;
        height = yMax - yMin;
      }
    }
  }

  if (![x, y, width, height].every(Number.isFinite)) return null;
  if (x < 0 || y < 0 || width <= 0 || height <= 0) return null;

  // Accept normalized, percentage, and Gemini 0..1000 coordinate spaces.
  const maxValue = Math.max(x, y, x + width, y + height);
  let divisor = 1;
  if (maxValue > 1 && maxValue <= 100) divisor = 100;
  else if (maxValue > 100 && maxValue <= 1000) divisor = 1000;
  else if (maxValue > 1000) return null;

  x /= divisor;
  y /= divisor;
  width /= divisor;
  height /= divisor;

  const left = Math.max(0, Math.min(1, x));
  const top = Math.max(0, Math.min(1, y));
  const right = Math.max(left, Math.min(1, x + width));
  const bottom = Math.max(top, Math.min(1, y + height));

  if (right <= left || bottom <= top) return null;

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
};

// =====================================================
// PAGE IMAGE HELPERS
// =====================================================

const imageBufferToBase64 = (
  buffer
) => {
  if (
    !Buffer.isBuffer(
      buffer
    ) ||
    buffer.length === 0
  ) {
    throw new Error(
      "A valid PNG image buffer is required."
    );
  }

  return buffer.toString(
    "base64"
  );
};

const validateRenderedPage = (
  page
) => {
  if (
    !page ||
    typeof page !== "object"
  ) {
    throw new Error(
      "NAVTA AI received an invalid rendered PDF page."
    );
  }

  const pageNumber =
    Number(
      page.pageNumber
    );

  if (
    !Number.isInteger(
      pageNumber
    ) ||
    pageNumber <= 0
  ) {
    throw new Error(
      "Rendered PDF page has an invalid page number."
    );
  }

  if (
    !Buffer.isBuffer(
      page.buffer
    ) ||
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
// JSON HELPERS
// =====================================================

// Gemini JSON must escape LaTeX backslashes as "\\\\". If a model response
// contains a JSON-valid escape such as "\\right", JSON.parse can turn the
// leading sequence into a control character (for example \r + "ight").
// Repair only these unmistakable LaTeX command fragments. This is deliberately
// conservative so ordinary prose is never rewritten.
const repairNavtaJsonLatexString = (input = "") => {
  // IMPORTANT:
  // JSON.parse interprets \t, \n, \r, \f and \b as JSON escapes.
  // That can silently turn valid LaTeX such as \tan into TAB + "an",
  // \beta into BACKSPACE + "eta", or \rho into CR + "ho".
  // Restore only unmistakable LaTeX command suffixes.
  return String(input ?? "")
    .replace(/\r(?=(?:ight|ho)\b)/g, "\\\\r")
    .replace(/\f(?=(?:rac|orall)\b)/g, "\\\\f")
    .replace(/\x08(?=(?:egin|eta|matrix)\b)/g, "\\\\b")
    .replace(
      /\t(?=(?:an|anh|ext|heta|imes|o|op|au|riangle|herefore)\b)/g,
      "\\\\t"
    )
    .replace(
      /\n(?=(?:abla|eq|u|ot|i|ewline)\b)/g,
      "\\\\n"
    );
};

const repairNavtaJsonLatexDeep = (value) => {
  if (typeof value === "string") {
    return repairNavtaJsonLatexString(value);
  }
  if (Array.isArray(value)) {
    return value.map(repairNavtaJsonLatexDeep);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        repairNavtaJsonLatexDeep(item),
      ])
    );
  }
  return value;
};

const stripJsonFences = (
  value
) => {
  return cleanString(
    value
  )
    .replace(
      /^```(?:json|javascript|js)?\s*/i,
      ""
    )
    .replace(
      /\s*```$/i,
      ""
    )
    .trim();
};

const sanitizeInvalidJsonBackslashes = (input = "") => {
  const text = String(input ?? "");
  let result = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (!inString) {
      result += char;
      if (char === '"') {
        inString = true;
      }
      continue;
    }

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '"') {
      result += char;
      inString = false;
      continue;
    }

    if (char !== "\\") {
      result += char;
      continue;
    }

    const next = text[index + 1] || "";

    // JSON only permits these escape starters. A backslash before any other
    // character is almost certainly an under-escaped LaTeX command from the
    // model (for example \alpha, \left, \q). Preserve it as a literal slash.
    if (!/["\\/bfnrtu]/.test(next)) {
      result += "\\\\";
      continue;
    }

    result += char;
    escaped = true;
  }

  return result;
};

const parseJsonObject = (
  raw
) => {
  const text =
    stripJsonFences(
      raw
    );

  if (!text) {
    const error = new Error(
      "NAVTA AI returned an empty JSON response."
    );
    error.code = "NAVTA_EMPTY_JSON";
    throw error;
  }

  const candidates = [];
  const addCandidate = (value) => {
    const candidate = String(value ?? "").trim();
    if (candidate && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  };

  addCandidate(text);
  addCandidate(sanitizeInvalidJsonBackslashes(text));

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start !== -1 && end > start) {
    const sliced = text
      .slice(start, end + 1)
      .replace(/,\s*([}\]])/g, "$1");

    addCandidate(sliced);
    addCandidate(sanitizeInvalidJsonBackslashes(sliced));
  }

  for (const candidate of candidates) {
    try {
      return repairNavtaJsonLatexDeep(
        JSON.parse(candidate)
      );
    } catch {
      // Try the next conservative recovery candidate.
    }
  }

  console.error("NAVTA AI INVALID JSON");
  console.error(`Response length: ${text.length}`);
  console.error("Response ending:");
  console.error(text.slice(-1200));

  const error = new Error(
    "NAVTA AI response was incomplete or invalid. Please retry the import."
  );
  error.code = "NAVTA_INVALID_JSON";
  error.responseLength = text.length;
  throw error;
};

const extractGeminiText = (
  data
) => {
  const candidates =
    safeArray(
      data?.candidates
    );

  for (
    const candidate of
    candidates
  ) {
    const parts =
      safeArray(
        candidate?.content?.parts
      );

    const text =
      parts
        .map(
          (part) =>
            typeof part?.text ===
            "string"
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
};

const extractRetryAfterSeconds = (
  response,
  message = ""
) => {
  const rawHeader = response?.headers?.get?.("retry-after");
  const headerValue = Number(rawHeader);

  if (rawHeader && Number.isFinite(headerValue) && headerValue > 0) {
    return Math.ceil(headerValue);
  }

  const match = String(message).match(/retry\s+in\s+([\d.]+)s/i);

  if (match) {
    const seconds = Number(match[1]);
    return Number.isFinite(seconds) && seconds > 0
      ? Math.ceil(seconds)
      : null;
  }

  return null;
};

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const isRetryableGeminiStatus = (status) =>
  [429, 500, 502, 503, 504].includes(Number(status));

const getGeminiRetryDelayMs = ({ attempt, retryAfter }) => {
  if (Number.isFinite(Number(retryAfter)) && Number(retryAfter) > 0) {
    return Math.min(Number(retryAfter) * 1000, 60000);
  }

  const delays = [2000, 5000, 10000, 20000];
  return delays[Math.min(Math.max(attempt - 1, 0), delays.length - 1)];
};

// =====================================================
// GEMINI REQUEST
// =====================================================

const callGemini = async ({
  parts,
  maxOutputTokens = 16384,
}) => {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the NAVTA backend."
    );
  }

  const endpoint =
    `${GEMINI_API_BASE}/models/` +
    `${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=` +
    `${encodeURIComponent(GEMINI_API_KEY)}`;

  const maxAttempts = 5;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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
          contents: [
            {
              role: "user",
              parts,
            },
          ],
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
        const error = new Error("Gemini returned an invalid HTTP response.");
        error.statusCode = response.status || 502;
        throw error;
      }

      if (!response.ok) {
        const message =
          cleanString(data?.error?.message) ||
          `Gemini returned HTTP ${response.status}.`;

        const error = new Error(message);
        error.statusCode = response.status;
        error.retryAfter = extractRetryAfterSeconds(response, message);
        throw error;
      }

      const modelText = extractGeminiText(data);

      if (!modelText) {
        const finishReason = cleanString(data?.candidates?.[0]?.finishReason);
        const error = new Error(
          finishReason
            ? `Gemini returned an empty response (${finishReason}).`
            : "Gemini returned an empty response."
        );
        error.statusCode = 502;
        throw error;
      }

      return modelText;
    } catch (error) {
      let normalizedError = error;

      if (error?.name === "AbortError") {
        normalizedError = new Error("Gemini request timed out.");
        normalizedError.statusCode = 504;
      } else if (!error?.statusCode && error instanceof TypeError) {
        normalizedError = new Error(
          `Gemini network request failed: ${error?.message || "temporary network error"}`
        );
        normalizedError.statusCode = 503;
      }

      lastError = normalizedError;

      const retryable = isRetryableGeminiStatus(normalizedError?.statusCode);

      if (!retryable || attempt >= maxAttempts) {
        throw normalizedError;
      }

      const delayMs = getGeminiRetryDelayMs({
        attempt,
        retryAfter: normalizedError?.retryAfter,
      });

      console.warn(
        `NAVTA Gemini temporary failure on attempt ${attempt}/${maxAttempts} ` +
        `(HTTP ${normalizedError?.statusCode || "network"}). ` +
        `Retrying in ${Math.round(delayMs / 1000)}s. ` +
        `${normalizedError?.message || ""}`
      );

      await sleep(delayMs);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("Gemini request failed.");
};

// =====================================================
// UNIVERSAL PDF QUESTION PROMPT
// =====================================================

const PDF_BATCH_PROMPT = `
You are NAVTA AI, the academic question-separation engine for NAVTA.

You receive ORIGINAL RENDERED PDF PAGE IMAGES.

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

SUPPORTED DIFFICULTIES:
Easy
Medium
Hard

SUPPORTED QUESTION TYPES:
mcq
short
long

YOUR JOB:
Detect every COMPLETE and READABLE academic question on the supplied page images.

=======================================================
CRITICAL QUESTION TEXT RULES
=======================================================

1. Preserve the actual wording of the question.

2. Do not rewrite the question unnecessarily.

3. Do not invent missing question text.

4. Do not invent missing options.

5. For MCQs, return exactly four options only when four options are visible.

5A. The "question" field must contain ONLY the question stem.
Do NOT duplicate answer choices inside the question field.

5AA. MCQ OPTION EXTRACTION — MANDATORY:
For every readable MCQ, read the COMPLETE CONTENT of each answer choice from
the original rendered page image.

The "options" array must contain the actual answer-choice values/text, NOT
merely the printed labels.

WRONG:
"options": ["A", "B", "C", "D"]
"options": ["1", "2", "3", "4"]

CORRECT examples:
"options": ["12", "10", "6", "15"]
"options": ["A-R, B-P, C-Q", "A-Q, B-R, C-P", "A-P, B-Q, C-R", "A-Q, B-P, C-R"]

For match-the-columns / matrix-match questions:
- The question MUST remain questionType = "mcq".
- DO NOT convert a readable text/LaTeX matching table into a screenshot.
- Put only the instruction/stem in question, for example:
  "Match Column I with Column II."
- Extract the complete two-column content into matchColumns:
  "matchColumns": {
    "leftTitle": "Column I",
    "rightTitle": "Column II",
    "left": [
      { "label": "P", "text": "..." },
      { "label": "Q", "text": "..." }
    ],
    "right": [
      { "label": "1", "text": "..." },
      { "label": "2", "text": "..." }
    ]
  }
- Preserve EVERY readable row and preserve labels exactly.
- Preserve mathematics as valid LaTeX.
- Do NOT duplicate the column/table content inside question when matchColumns is populated.
- extract each mapping/code combination printed after option labels (1)-(4)
  or A-D into the corresponding options[] entry;
- NEVER return only A/B/C/D or 1/2/3/4 as option values;
- P/Q/R/S and 1/2/3/4 row labels inside matchColumns are NOT MCQ options.
- For a readable text/LaTeX match table set:
  hasVisual = false
  visualType = "none"
  visualBoundingBox = null
- Only use a visual when a cell contains genuine graphical information that cannot
  be represented faithfully as text/LaTeX (graph, geometry figure, circuit, etc.).
- Never screenshot the entire matching table merely because it is printed in two columns.
- if an option is itself a genuine spatial visual, follow the visual-option
  rule below instead of inventing text.

If four option labels are visible but their actual option contents cannot be
read confidently, do NOT invent them. Set:
needsReview = true
drop = true
dropReason = "MCQ option contents could not be extracted completely."

5AB. Before returning an MCQ, perform this check:
If options[] normalizes to exactly ["A","B","C","D"] or ["1","2","3","4"],
the extraction is incomplete. Re-read the original page image and recover the
actual text/value following each label. If recovery is impossible, apply the
drop rule above.

5B. IMPORTANT VISUAL OPTION RULE:
If answer choices are diagrams, organic structures, graphs, circuits,
geometry figures, biology figures, or other spatial visuals, keep the
complete set of answer-choice visuals together with the question visual.
Do NOT crop through an option. Do NOT include only part of an option.

6. correctAnswer is zero-based:
A = 0
B = 1
C = 2
D = 3

7. Try to solve the question in this SAME request.

8. If the correct answer is uncertain:
correctAnswer = null
needsReview = true

=======================================================
UNIVERSAL MATH / SCIENCE RENDERING RULES
=======================================================

Use TEXT OR LATEX when the content can be represented accurately as notation.

This includes:

- arithmetic
- algebra
- fractions
- powers
- roots
- logarithms
- trigonometry
- limits
- derivatives
- integrals
- summations
- vectors
- matrices
- determinants
- systems of equations
- coordinate expressions
- physics equations
- physics formulas
- ordinary chemical equations
- ordinary ionic equations
- simple molecular formulas

Use valid LaTeX delimiters:

Inline:
$...$

Block:
$$...$$

JSON + LATEX SAFETY — MANDATORY:

- You are returning JSON. Every LaTeX backslash inside a JSON string must be JSON-escaped.
- The decoded question string must contain commands such as \frac, \sqrt, \left, \right, \cos, \log and \begin exactly.
- Never return a form-feed, carriage-return, tab or backspace escape in place of a LaTeX command.
- Every \left must have a matching \right.
- Keep ordinary English outside $...$ and only mathematical expressions inside math delimiters.
- Before returning JSON, verify all $ delimiters, braces and \left...\right pairs are balanced.
- Do not simplify or rewrite the mathematics; preserve the printed meaning.

Examples:

$x^2+y^2=r^2$

$\\frac{a+b}{c}$

$\\sqrt{x^2+y^2}$

$\\int_0^\\pi \\sin x\\,dx$

$\\begin{bmatrix}
a & b \\\\
c & d
\\end{bmatrix}$

$\\begin{vmatrix}
a & b \\\\
c & d
\\end{vmatrix}$

IMPORTANT:

Matrices and determinants are NOT images.

For matrices and determinants:

hasVisual = false
visualType = "none"
visualBoundingBox = null

=======================================================
CHEMISTRY RULES
=======================================================

Simple chemical formulas and linear equations should remain text.

Examples:

H₂O
NH₄⁺
SO₄²⁻
CH₃COOH

Simple reaction equations that can be represented correctly in one line may remain text.

However, use a REAL VISUAL for chemistry when spatial layout carries meaning.

Examples:

- organic structural formula
- skeletal structure
- reaction mechanism
- curved-arrow mechanism
- reaction scheme
- reagent written above/below a reaction arrow
- multi-step reaction map
- stereochemistry
- wedge/dash structure
- ring drawing
- molecular structure whose geometry matters

For these:

hasVisual = true
visualType = "chemical-structure"

DO NOT flatten such a visual into approximate plain text.

DO NOT reconstruct a reaction scheme like:

B <- reagent substrate -> A

if the original page uses a spatial reaction diagram.

Instead preserve the original diagram using visualBoundingBox.

=======================================================
OTHER REAL VISUALS
=======================================================

Use a REAL VISUAL for:

- graph
- circuit
- geometry diagram
- ray diagram
- apparatus
- biological diagram
- map
- figure
- image-based table
- scientific diagram whose layout carries meaning

Allowed visualType values:

diagram
graph
figure
circuit
geometry
table
chemical-structure
biology
image
other


=======================================================
ESSENTIAL VISUAL DETECTION — MANDATORY
=======================================================

Before returning hasVisual=false, inspect the rendered page around the
question carefully.

If the wording depends on something drawn on the page, the visual is
REQUIRED and must not be omitted.

Strong examples:
- "following reaction"
- "following reaction scheme"
- "following structure"
- "following diagram"
- "following figure"
- "following graph"
- "following circuit"
- "shown below"
- "given below"

CHEMISTRY SPECIAL RULE:
When the stem says "following reaction", inspect immediately below/after
the stem for the substrate, organic/skeletal structure, reagent arrows,
conditions, intermediates, ring structures, and reaction scheme.

If that question-stem reaction exists:
hasVisual = true
visualType = "chemical-structure"
visualBoundingBox = a TIGHT box around ONLY that question-stem reaction
and insert [[NAVTA_VISUAL]] in the question string.

Do NOT return hasVisual=false merely because the answer choices are
ordinary text or numbers.

Do NOT include answer choices or nearby unrelated structures in the
question visualBoundingBox.

If a required visual is visible but a tight visualBoundingBox cannot be
located confidently, set needsReview=true. NEVER use questionBoundingBox
as visualBoundingBox.


=======================================================
VISUAL MARKER RULE
=======================================================

When a genuine visual belongs inside the question text, insert EXACTLY:

${NAVTA_VISUAL_MARKER}

at the location where the visual appears.

Example:

"Study the circuit shown below:
${NAVTA_VISUAL_MARKER}
Find the current through the resistor."

Another example:

"But-2-yne is reacted separately as shown:
${NAVTA_VISUAL_MARKER}
Identify the incorrect statements."

Do NOT describe or reconstruct the visual in the question string when the visual itself will be preserved.

There must be at most ONE ${NAVTA_VISUAL_MARKER} per question.

If the question has no genuine visual, do not insert the marker.

=======================================================
VISUAL BOUNDING BOX RULE
=======================================================

visualBoundingBox must tightly contain ONLY the genuine visual required
to understand the question stem.

MANDATORY VISUAL SCAN:
For EVERY detected question, inspect the physical region from the end of the
question stem down to the first answer option. Also inspect beside the stem
when the PDF uses a two-column layout. Do this even when the text itself does
not contain words such as "figure", "shown below", or "diagram".

Treat any non-text academic object that carries information as a genuine visual:
circuit, graph, ray diagram, geometry construction, labelled/unlabelled biology
figure, apparatus, free-body diagram, vector drawing, map, waveform, optical
figure, organic/skeletal structure, stereochemical drawing, reaction scheme,
mechanism, structural answer-choice set, or other spatial scientific content.

A diagram may have NO caption and the stem may have NO explicit visual keyword.
Do not miss it for that reason.

COORDINATE CONTRACT:
Return visualBoundingBox as { "x", "y", "width", "height" } using NORMALIZED
0..1 coordinates relative to the ENTIRE supplied page image:
- x = left edge / page width
- y = top edge / page height
- width = visual width / page width
- height = visual height / page height
Origin is the TOP-LEFT of the page. Never swap x and y. Never return
[ymin,xmin,ymax,xmax] in this field.

If visual answer choices are necessary to answer the MCQ, the visualBoundingBox
must include the complete visual answer-choice group as well as the associated
question visual when required; never cut through an option.

It must NOT contain:

- the entire question
- normal question prose
- answer options
- question number
- unrelated nearby content

For chemistry reaction schemes, tightly include the complete substrate,
reaction arrows, reagents, conditions, and structures that form the
question-stem reaction scheme.

Do NOT extend the box downward into answer choices.
Do NOT include a nearby structure merely because it is close to the
reaction scheme.
Do NOT use questionBoundingBox as visualBoundingBox.

If a tight question-only visual box cannot be determined confidently,
set needsReview=true instead of returning a large approximate box.

Use normalized coordinates from 0 to 1:

{
  "x": 0.1,
  "y": 0.2,
  "width": 0.5,
  "height": 0.3
}

If hasVisual=false:

visualType = "none"
visualDescription = ""
visualBoundingBox = null

If hasVisual=true:

visualBoundingBox MUST be provided.

=======================================================
QUESTION BOUNDING BOX
=======================================================

questionBoundingBox describes the complete question region on the source page.

This is internal metadata only.

It is NOT automatically used as a student-facing image.

Never use questionBoundingBox as a substitute for visualBoundingBox.

=======================================================
CLASSIFICATION
=======================================================

Return:

subject
exam
classLevel
chapter
difficulty
questionType

Do not invent a chapter outside the supplied chapter whitelist.

If a Selected Chapter is supplied by the admin, treat it as the intended destination.

If the question clearly belongs to a different chapter:
drop = true

If chapter classification is uncertain:
needsReview = true

=======================================================
CONFIDENCE
=======================================================

Return values from 0 to 1:

chapterConfidence
answerConfidence
classificationConfidence
difficultyConfidence

Do not fake confidence.

=======================================================
DROP RULES
=======================================================

drop=true only when:

- question is unreadable
- question is materially incomplete
- required MCQ options are missing
- question cannot safely be separated
- question clearly conflicts with the selected chapter

Do not drop a readable question only because correctAnswer is uncertain.

=======================================================
FORMAT SAFETY — ALL NAVTA SUBJECTS
=======================================================

Do not flatten valid notation into strings such as:
frac2√(5), cosleft(...), sinleft(...), sqrt5, beginmatrix.

MATHS:
- preserve fractions, roots, powers, subscripts, trig/inverse trig,
  logarithms, limits, derivatives, integrals, sums, vectors,
  matrices, determinants, sets, cases and inequalities.

PHYSICS:
- preserve equations, vectors, Greek symbols, units,
  scientific notation, subscripts and superscripts.
- graphs, circuits and apparatus that depend on spatial layout
  must remain genuine visuals.

CHEMISTRY:
- preserve molecular formula subscripts, ionic charges,
  equations, reaction arrows and physical states.
- organic structural formulae/mechanisms that depend on spatial
  layout must remain genuine visuals rather than guessed text.

BIOLOGY:
- preserve gene/protein/allele/chromosome notation, ratios,
  scientific symbols and labels.
- genuine biological diagrams must remain visuals.

Before returning each MCQ, re-check all option strings for lost
backslashes, braces, roots, superscripts, subscripts and delimiters.

Never invent missing scientific content.

=======================================================
OUTPUT
=======================================================

Return JSON ONLY.

Do not return Markdown.

Do NOT generate explanations, solutions, derivations, hints, or reasoning during import.
The explanation field MUST always be an empty string.
Use the output budget for exact question/options transcription, correct answer,
classification, LaTeX/scientific notation, match-column structure, and visuals.

Return exactly:

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
      "matchColumns": {
        "leftTitle": "",
        "rightTitle": "",
        "left": [],
        "right": []
      },
      "options": [],
      "correctAnswer": null,
      "modelAnswer": "",
      "keyPoints": [],
      "maxMarks": null,
      "explanation": "",
      "questionBoundingBox": null,
      "hasVisual": false,
      "visualType": "none",
      "visualDescription": "",
      "visualBoundingBox": null,
      "sourcePage": null,
      "chapterConfidence": 0.0,
      "answerConfidence": 0.0,
      "classificationConfidence": 0.0,
      "difficultyConfidence": 0.0,
      "needsReview": false,
      "drop": false,
      "dropReason": ""
    }
  ]
}
`;

// =====================================================
// MATCH COLUMN NORMALIZER
// =====================================================

const normalizeMatchColumns = (value = null) => {
  if (!value || typeof value !== "object") {
    return {
      leftTitle: "",
      rightTitle: "",
      left: [],
      right: [],
    };
  }

  const normalizeRows = (rows) =>
    safeArray(rows)
      .map((row) => ({
        label: cleanString(row?.label),
        text: formatNavtaQuestionContent(row?.text),
      }))
      .filter((row) => Boolean(row.label || row.text));

  const left = normalizeRows(value.left);
  const right = normalizeRows(value.right);

  return {
    leftTitle:
      cleanString(value.leftTitle) ||
      (left.length ? "Column I" : ""),
    rightTitle:
      cleanString(value.rightTitle) ||
      (right.length ? "Column II" : ""),
    left,
    right,
  };
};

const hasMatchColumnData = (value) =>
  Boolean(
    value &&
      Array.isArray(value.left) &&
      Array.isArray(value.right) &&
      value.left.length > 0 &&
      value.right.length > 0
  );


// =====================================================
// MATRIX / DETERMINANT ROW-SEPARATOR REPAIR
// =====================================================
// Repairs ONLY inside matrix-like LaTeX environments.
//
// Example corruption:
//   p+a & q+b & r+c \q+c & r+a & p+b \r+a & p+b & q+c
//
// Correct:
//   p+a & q+b & r+c \\ q+c & r+a & p+b \\ r+a & p+b & q+c
//
// We do NOT globally rewrite \q, \r, \x, etc. because that could
// alter legitimate scientific/LaTeX content outside a matrix.
const repairBrokenMatrixRowSeparators = (input = "") => {
  const matrixEnvironmentPattern =
    /\\begin\{(matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix|smallmatrix|array|cases|aligned|gathered)\}([\s\S]*?)\\end\{\1\}/g;

  return String(input ?? "").replace(
    matrixEnvironmentPattern,
    (fullMatch, environment, body) => {
      let repairedBody = "";
      let rowStart = 0;
      let cursor = 0;

      while (cursor < body.length) {
        // Preserve already-correct \\ row separators.
        if (
          body[cursor] === "\\" &&
          body[cursor + 1] === "\\"
        ) {
          repairedBody += "\\\\";
          cursor += 2;
          rowStart = repairedBody.length;
          continue;
        }

        if (body[cursor] === "\\") {
          const rest = body.slice(cursor);

          // A single-letter command after a populated matrix row is almost
          // certainly a collapsed row separator + the next row's variable.
          const oneLetterMatch = rest.match(
            /^\\([A-Za-z])(?=[_^+\-=(),.;:{}[\]\s&]|$)/
          );

          if (oneLetterMatch) {
            const currentRow =
              repairedBody.slice(rowStart);

            const ampersandCount =
              (currentRow.match(/&/g) || []).length;

            if (ampersandCount > 0) {
              repairedBody +=
                `\\\\ ${oneLetterMatch[1]}`;

              cursor +=
                oneLetterMatch[0].length;

              rowStart =
                repairedBody.length;

              continue;
            }
          }
        }

        repairedBody += body[cursor];
        cursor += 1;
      }

      return (
        `\\begin{${environment}}` +
        repairedBody +
        `\\end{${environment}}`
      );
    }
  );
};

// =====================================================
// UNIVERSAL NAVTA SCIENCE CONTENT REPAIR
// =====================================================
// Conservative repair only. Never invent missing academic content.
// Genuine spatial diagrams/graphs/circuits/organic structures remain
// handled by the existing NAVTA visualBoundingBox pipeline.

const repairNavtaScienceContent = (input = "") => {
  let value = String(input ?? "").trim();

  if (!value) {
    return "";
  }

  value = value
    .replace(/\x0D(?=(?:ight|ho)\b)/g, "\\r")
    .replace(/\x0C(?=(?:rac|orall)\b)/g, "\\f")
    .replace(/\x08(?=(?:egin|eta|matrix)\b)/g, "\\b")
    .replace(
      /\x09(?=(?:an|anh|ext|heta|imes|o|op|au|riangle|herefore)\b)/g,
      "\\t"
    )
    .replace(
      /\x0A(?=(?:abla|eq|u|ot|i|ewline)\b)/g,
      "\\n"
    )
    .replace(
      /\b(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|log|ln|exp|lim|max|min)\s*left\s*\(/gi,
      (_, fn) => `\\${fn.toLowerCase()}\\left(`
    )
    .replace(
      /\b(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|log|ln|exp|lim|max|min)left\s*\(/gi,
      (_, fn) => `\\${fn.toLowerCase()}\\left(`
    )
    .replace(/(^|[^\\A-Za-z])left\s*\(/g, "$1\\left(")
    .replace(/(^|[^\\A-Za-z])right\s*\)/g, "$1\\right)")
    .replace(/\bfrac(?=\s*[\{\d(])/g, "\\frac")
    .replace(/\bsqrt(?=\s*[\{\d(A-Za-z])/g, "\\sqrt");

  // Legacy flattened fraction/root:
  // frac2√(5) -> \frac{2}{\sqrt{5}}
  value = value.replace(
    /(?:\\?frac)\s*([+-]?(?:\d+(?:\.\d+)?|[A-Za-z]))\s*√\s*\(\s*([^()]+?)\s*\)/g,
    "\\frac{$1}{\\sqrt{$2}}"
  );

  value = value
    .replace(/√\s*\(([^()]+)\)/g, "\\sqrt{$1}")
    .replace(/√\s*([A-Za-z0-9]+)/g, "\\sqrt{$1}");

  // OCR/Gemini quotient notation:
  // (1)/(2) -> \frac{1}{2}
  // (a)/(π) -> \frac{a}{\pi}
  for (let pass = 0; pass < 4; pass += 1) {
    const before = value;

    value = value
      .replace(
        /\(\(\s*([^()]+?)\s*\)\s*\/\s*\(\s*([^()]+?)\s*\)\)/g,
        "\\frac{$1}{$2}"
      )
      .replace(
        /\(\s*([^()]+?)\s*\)\s*\/\s*\(\s*([^()]+?)\s*\)/g,
        "\\frac{$1}{$2}"
      );

    if (value === before) {
      break;
    }
  }

  value = value
    .replace(/π/g, "\\pi")
    .replace(/θ/g, "\\theta")
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/γ/g, "\\gamma")
    .replace(/δ/g, "\\delta")
    .replace(/λ/g, "\\lambda")
    .replace(/μ/g, "\\mu")
    .replace(/σ/g, "\\sigma")
    .replace(/φ/g, "\\phi")
    .replace(/ω/g, "\\omega")
    .replace(/∞/g, "\\infty")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/≈/g, "\\approx ")
    .replace(/±/g, "\\pm ")
    .replace(/∓/g, "\\mp ");

  value =
    repairBrokenMatrixRowSeparators(
      value
    );

  return value.trim();
};

const formatNavtaScienceContent = (input = "") =>
  formatNavtaQuestionContent(
    repairNavtaScienceContent(input)
  );

// =====================================================
// NORMALIZE DETECTED QUESTION
// =====================================================

const normalizeDetectedQuestion = ({
  item = {},
  allowedPageNumbers = [],
  hints = {},
  requirePage = true,
}) => {
  const options =
    safeArray(
      item.options
    )
      .map(
        (option) =>
          formatNavtaScienceContent(
            option
          )
      )
      .filter(Boolean);

  const matchColumns =
    normalizeMatchColumns(
      item.matchColumns
    );

  const isMatchColumnQuestion =
    hasMatchColumnData(
      matchColumns
    );

  const questionType =
    normalizeQuestionType(
      item.questionType
    ) ||
    (
      options.length === 4
        ? "mcq"
        : ""
    );

  const placeholderOnlyMcqOptions =
    questionType === "mcq" &&
    hasPlaceholderOnlyMcqOptions(
      options
    );

  const questionBoundingBox =
    normalizeBoundingBox(
      item.questionBoundingBox
    );

  let visualBoundingBox =
    normalizeBoundingBox(
      item.visualBoundingBox
    );

  let visualType =
    normalizeVisualType(
      item.visualType
    );

  const visualIsStronglyImplied =
    questionTextStronglyImpliesVisual(
      item.question
    );

  // Safe recovery for inconsistent model output:
  // a supplied tight visualBoundingBox may be trusted when the stem
  // clearly requires a visual. We never fabricate a box.
  let hasVisual =
    Boolean(
      visualBoundingBox &&
      (
        item.hasVisual ||
        visualIsStronglyImplied ||
        visualType !== "none"
      )
    );

  if (!hasVisual) {
    hasVisual = false;
    visualType = "none";
    visualBoundingBox = null;
  }

  if (
    hasVisual &&
    visualType === "none"
  ) {
    visualType = "other";
  }

  // A normal text/LaTeX match-the-column table is structured content,
  // not a screenshot. Genuine graphical cell visuals remain untouched.
  if (
    isMatchColumnQuestion &&
    (visualType === "table" || visualType === "matrix")
  ) {
    hasVisual = false;
    visualType = "none";
    visualBoundingBox = null;
  }

  let sourcePage =
    Number(
      item.sourcePage
    );

  if (
    !Number.isInteger(
      sourcePage
    ) ||
    (
      allowedPageNumbers.length >
        0 &&
      !allowedPageNumbers.includes(
        sourcePage
      )
    )
  ) {
    sourcePage =
      null;
  }

  let drop =
    Boolean(
      item.drop
    );

  let dropReason =
    cleanString(
      item.dropReason
    );

  if (
    placeholderOnlyMcqOptions
  ) {
    drop = true;

    dropReason =
      "MCQ option contents could not be extracted completely.";
  }

  let question =
    formatNavtaScienceContent(
      item.question
    );

  // If Gemini identified a genuine visual but forgot
  // the marker, add it after the question text.
  if (
    hasVisual &&
    !question.includes(
      NAVTA_VISUAL_MARKER
    )
  ) {
    question =
      `${question}\n${NAVTA_VISUAL_MARKER}`.trim();
  }

  // Remove accidental visual markers when no genuine
  // visual was detected.
  if (!hasVisual) {
    question =
      question
        .replaceAll(
          NAVTA_VISUAL_MARKER,
          ""
        )
        .trim();
  }

  if (!question) {
    drop = true;

    dropReason =
      dropReason ||
      "Question text is missing.";
  }

  if (
    requirePage &&
    !sourcePage
  ) {
    drop = true;

    dropReason =
      dropReason ||
      "Source page could not be identified.";
  }

  const chapterConfidence =
    normalizeConfidence(
      item.chapterConfidence
    );

  const answerConfidence =
    normalizeConfidence(
      item.answerConfidence
    );

  const classificationConfidence =
    normalizeConfidence(
      item.classificationConfidence
    );

  const difficultyConfidence =
    normalizeConfidence(
      item.difficultyConfidence
    );

  let needsReview =
    Boolean(
      item.needsReview
    );

  if (
    placeholderOnlyMcqOptions
  ) {
    needsReview = true;
  }

  if (
    visualIsStronglyImplied &&
    !hasVisual
  ) {
    needsReview = true;
  }

  if (
    chapterConfidence !== null &&
    chapterConfidence <
      LOW_CONFIDENCE_THRESHOLDS.chapter
  ) {
    needsReview = true;
  }

  if (
    answerConfidence !== null &&
    answerConfidence <
      LOW_CONFIDENCE_THRESHOLDS.answer
  ) {
    needsReview = true;
  }

  if (
    classificationConfidence !== null &&
    classificationConfidence <
      LOW_CONFIDENCE_THRESHOLDS.classification
  ) {
    needsReview = true;
  }

  if (
    difficultyConfidence !== null &&
    difficultyConfidence <
      LOW_CONFIDENCE_THRESHOLDS.difficulty
  ) {
    needsReview = true;
  }

  return {
    questionNumber:
      cleanString(
        item.questionNumber
      ),

    question,

    subject:
      normalizeSubject(
        item.subject
      ) ||
      normalizeSubject(
        hints.subject
      ),

    exam:
      normalizeExam(
        item.exam
      ) ||
      normalizeExam(
        hints.exam
      ),

    classLevel:
      normalizeClassLevel(
        item.classLevel
      ) ||
      normalizeClassLevel(
        hints.classLevel
      ),

    chapter:
      cleanString(
        item.chapter
      ) ||
      cleanString(
        hints.chapter
      ),

    difficulty:
      normalizeDifficulty(
        item.difficulty
      ) ||
      "Medium",

    questionType,

    matchColumns,
    isMatchColumnQuestion,

    options,

    correctAnswer:
      normalizeCorrectAnswer(
        item.correctAnswer
      ),

    modelAnswer:
      formatNavtaQuestionContent(
        item.modelAnswer
      ),

    keyPoints:
      safeArray(
        item.keyPoints
      )
        .map(
          (point) =>
            formatNavtaQuestionContent(
              point
            )
        )
        .filter(Boolean),

    maxMarks:
      Number.isFinite(
        Number(
          item.maxMarks
        )
      )
        ? Number(
            item.maxMarks
          )
        : null,

    explanation: "",

    questionBoundingBox,

    hasVisual,

    visualType,

    visualDescription:
      hasVisual
        ? cleanString(
            item.visualDescription
          )
        : "",

    visualBoundingBox,

    sourcePage,

    chapterConfidence,

    answerConfidence,

    classificationConfidence,

    difficultyConfidence,

    needsReview,

    drop,

    dropReason,
  };
};
// =====================================================
// SECOND-PASS VERIFICATION FOR UNCERTAIN QUESTIONS
// =====================================================

const shouldVerifyQuestion = (
  question = {}
) => {
  if (
    !NAVTA_AI_VERIFY_LOW_CONFIDENCE
  ) {
    return false;
  }

  if (
    question.needsReview
  ) {
    return true;
  }

  if (
    question.questionType === "mcq" &&
    hasPlaceholderOnlyMcqOptions(
      question.options
    )
  ) {
    return true;
  }

  if (
    question.questionType === "mcq" &&
    !Number.isInteger(
      question.correctAnswer
    )
  ) {
    return true;
  }

  const chapterConfidence =
    normalizeConfidence(
      question.chapterConfidence
    );

  const answerConfidence =
    normalizeConfidence(
      question.answerConfidence
    );

  const classificationConfidence =
    normalizeConfidence(
      question.classificationConfidence
    );

  const difficultyConfidence =
    normalizeConfidence(
      question.difficultyConfidence
    );

  return (
    (
      chapterConfidence !== null &&
      chapterConfidence <
        LOW_CONFIDENCE_THRESHOLDS.chapter
    ) ||
    (
      answerConfidence !== null &&
      answerConfidence <
        LOW_CONFIDENCE_THRESHOLDS.answer
    ) ||
    (
      classificationConfidence !== null &&
      classificationConfidence <
        LOW_CONFIDENCE_THRESHOLDS.classification
    ) ||
    (
      difficultyConfidence !== null &&
      difficultyConfidence <
        LOW_CONFIDENCE_THRESHOLDS.difficulty
    )
  );
};

const mergeVerifiedQuestion = (
  original,
  verified
) => {
  if (
    !verified
  ) {
    return original;
  }

  const originalOptions =
    safeArray(
      original.options
    );

  const verifiedOptions =
    safeArray(
      verified.options
    );

  const shouldUseVerifiedOptions =
    verifiedOptions.length === 4 &&
    !hasPlaceholderOnlyMcqOptions(
      verifiedOptions
    ) &&
    (
      originalOptions.length !== 4 ||
      hasPlaceholderOnlyMcqOptions(
        originalOptions
      )
    );

  return {
    ...original,

    subject:
      verified.subject ||
      original.subject,

    exam:
      verified.exam ||
      original.exam,

    classLevel:
      verified.classLevel ||
      original.classLevel,

    chapter:
      verified.chapter ||
      original.chapter,

    difficulty:
      verified.difficulty ||
      original.difficulty,

    questionType:
      verified.questionType ||
      original.questionType,

    options:
      shouldUseVerifiedOptions
        ? verifiedOptions
        : originalOptions,

    correctAnswer:
      Number.isInteger(
        verified.correctAnswer
      )
        ? verified.correctAnswer
        : original.correctAnswer,

    modelAnswer:
      verified.modelAnswer ||
      original.modelAnswer,

    keyPoints:
      safeArray(
        verified.keyPoints
      ).length > 0
        ? verified.keyPoints
        : original.keyPoints,

    explanation: "",

    chapterConfidence:
      verified.chapterConfidence ??
      original.chapterConfidence,

    answerConfidence:
      verified.answerConfidence ??
      original.answerConfidence,

    classificationConfidence:
      verified.classificationConfidence ??
      original.classificationConfidence,

    difficultyConfidence:
      verified.difficultyConfidence ??
      original.difficultyConfidence,

    needsReview:
      Boolean(
        verified.needsReview
      ),

    drop:
      Boolean(
        verified.drop
      ),

    dropReason:
      cleanString(
        verified.dropReason
      ),

    // Preserve the original stem unless the verifier recovered a visual
    // that the first pass missed. In that case use the verified stem so the
    // NAVTA_VISUAL marker is placed correctly.
    question:
      (!original.hasVisual &&
       verified.hasVisual &&
       verified.visualBoundingBox)
        ? verified.question
        : original.question,

    questionNumber:
      cleanString(
        original.questionNumber
      ) ||
      cleanString(
        verified.questionNumber
      ),

    sourcePage:
      original.sourcePage ||
      verified.sourcePage,

    questionBoundingBox:
      original.questionBoundingBox ||
      verified.questionBoundingBox,

    hasVisual:
      Boolean(
        original.hasVisual ||
        (verified.hasVisual && verified.visualBoundingBox)
      ),

    visualType:
      original.hasVisual
        ? original.visualType
        : (
            verified.hasVisual && verified.visualBoundingBox
              ? verified.visualType
              : original.visualType
          ),

    visualDescription:
      original.hasVisual
        ? original.visualDescription
        : (
            verified.hasVisual && verified.visualBoundingBox
              ? verified.visualDescription
              : original.visualDescription
          ),

    visualBoundingBox:
      original.visualBoundingBox ||
      (
        verified.hasVisual
          ? verified.visualBoundingBox
          : null
      ),
  };
};


const verifyLowConfidenceQuestions =
  async ({
    questions = [],
    validPages = [],
    hints = {},
  }) => {
    const uncertain =
      safeArray(
        questions
      ).filter(
        shouldVerifyQuestion
      );

    if (
      uncertain.length === 0
    ) {
      return questions;
    }

    const uncertainPages =
      new Set(
        uncertain
          .map(
            (question) =>
              Number(
                question.sourcePage
              )
          )
          .filter(
            Number.isInteger
          )
      );

    const pagesForVerification =
      safeArray(
        validPages
      ).filter(
        (page) =>
          uncertainPages.has(
            Number(
              page.pageNumber
            )
          )
      );

    const verificationPrompt = `
You are NAVTA AI acting as a SECOND-PASS VERIFIER.

IMPORTANT EFFICIENCY RULE:
- Do NOT generate an explanation, solution, derivation, hint, or reasoning.
- explanation must remain an empty string.
- Verify only transcription/classification/options/correctAnswer/confidence/drop status.


Verify only the uncertain questions listed below against the supplied original PDF page images.

Do not create new questions.

Do not remove a readable question merely because the answer is uncertain.

Do not invent missing options or text.

MCQ OPTION REPAIR — IMPORTANT:
Inspect the original rendered PDF page and verify the COMPLETE answer-choice
content. If the supplied options are only ["A","B","C","D"] or
["1","2","3","4"], those are placeholder labels, not valid option values.
Recover the actual text/value after each printed option label from the page.

For match-the-columns / matrix-match questions, return the complete mapping/code
for each choice, for example "A-R, B-P, C-Q", not just "A", "B", "C", "D".

If the actual option contents cannot be read confidently, do not invent them:
set needsReview=true, drop=true, and explain that the MCQ option contents could
not be extracted completely.

Preserve the original question wording unless an obvious OCR/vision error must be corrected.

ADMIN HINTS:

Subject:
${cleanString(hints.subject) || "Auto detect"}

Exam:
${cleanString(hints.exam) || "Auto detect"}

Class:
${cleanString(hints.classLevel) || "Auto detect"}

Selected Chapter:
${cleanString(hints.chapter) || "Auto detect"}

ALLOWED CHAPTERS:

${
  safeArray(
    hints.allowedChapters
  ).length > 0
    ? safeArray(
        hints.allowedChapters
      ).join("\n")
    : "No whitelist supplied"
}

VISUAL RECOVERY — MANDATORY:
For every uncertain question, inspect the original page again for a missed
diagram/graph/circuit/geometry figure/biology figure/apparatus/organic structure/
reaction scheme or visual answer-choice set.

If a genuine required visual was missed, you MUST return:
- hasVisual = true
- the correct visualType
- visualDescription
- a tight visualBoundingBox in normalized 0..1 {x,y,width,height} coordinates
- sourcePage
- question containing exactly one [[NAVTA_VISUAL]] marker at the visual location.

Do not use questionBoundingBox as visualBoundingBox. Do not crop ordinary prose.
A visual can exist even when the stem contains no visual keyword.

Return the same questions only, with corrected:

- subject
- exam
- classLevel
- chapter
- difficulty
- options
- correctAnswer
- chapterConfidence
- answerConfidence
- classificationConfidence
- difficultyConfidence
- hasVisual
- visualType
- visualDescription
- visualBoundingBox
- sourcePage
- needsReview
- drop
- dropReason

Rules:

- Confidence values must be from 0 to 1.
- If the answer is uncertain, correctAnswer=null and needsReview=true.
- If Selected Chapter is provided, do not silently change to another chapter.
- If a question clearly does not belong to Selected Chapter, set drop=true and explain.
- Return JSON only.

QUESTIONS TO VERIFY:

${JSON.stringify(
  uncertain.map(
    (question) => ({
      questionNumber:
        question.questionNumber,

      question:
        question.question,

      options:
        question.options,

      hasVisual:
        question.hasVisual,

      visualType:
        question.visualType,

      visualDescription:
        question.visualDescription,

      visualBoundingBox:
        question.visualBoundingBox,

      questionBoundingBox:
        question.questionBoundingBox,

      sourcePage:
        question.sourcePage,

      subject:
        question.subject,

      exam:
        question.exam,

      classLevel:
        question.classLevel,

      chapter:
        question.chapter,

      difficulty:
        question.difficulty,

      questionType:
        question.questionType,

      correctAnswer:
        question.correctAnswer,

      sourcePage:
        question.sourcePage,

      chapterConfidence:
        question.chapterConfidence,

      answerConfidence:
        question.answerConfidence,

      classificationConfidence:
        question.classificationConfidence,

      difficultyConfidence:
        question.difficultyConfidence,

      needsReview:
        question.needsReview,
    })
  )
)}
`;

    const parts = [
      {
        text:
          verificationPrompt,
      },
    ];

    for (
      const page of
      pagesForVerification
    ) {
      parts.push({
        text:
          `ORIGINAL PDF PAGE ${page.pageNumber}.`,
      });

      parts.push({
        inlineData: {
          mimeType:
            "image/png",

          data:
            imageBufferToBase64(
              page.buffer
            ),
        },
      });
    }

    try {
      const raw =
        await callGemini({
          parts,

          maxOutputTokens:
            16384,
        });

      const parsed =
        parseJsonObject(
          raw
        );

      const verified =
        safeArray(
          parsed?.questions
        ).map(
          (item) =>
            normalizeDetectedQuestion({
              item,

              allowedPageNumbers:
                pagesForVerification.map(
                  (page) =>
                    Number(
                      page.pageNumber
                    )
                ),

              hints,

              requirePage:
                true,
            })
        );

      const verifiedMap =
        new Map();

      verified.forEach(
        (question) => {
          const key =
            `${question.sourcePage || ""}::${cleanString(
              question.questionNumber
            )}`;

          verifiedMap.set(
            key,
            question
          );
        }
      );

      return safeArray(
        questions
      ).map(
        (question) => {
          if (
            !shouldVerifyQuestion(
              question
            )
          ) {
            return question;
          }

          const key =
            `${question.sourcePage || ""}::${cleanString(
              question.questionNumber
            )}`;

          return mergeVerifiedQuestion(
            question,
            verifiedMap.get(
              key
            )
          );
        }
      );
    } catch (
      error
    ) {
      console.warn(
        `NAVTA second-pass verification skipped because it failed: ${error?.message || ""}`
      );

      return questions;
    }
  };

// =====================================================
// ANALYSE PAGE BATCH
// =====================================================

const analyseRenderedPageBatch =
  async ({
    pages = [],
    text = "",
    hints = {},
  }) => {
    const validPages =
      safeArray(
        pages
      )
        .map(
          validateRenderedPage
        )
        .sort(
          (a, b) =>
            a.pageNumber -
            b.pageNumber
        );

    if (
      validPages.length === 0
    ) {
      return [];
    }

    const allowedPageNumbers =
      validPages.map(
        (page) =>
          page.pageNumber
      );

    const prompt = `
${PDF_BATCH_PROMPT}

ADMIN HINTS:

Subject:
${cleanString(hints.subject) || "Auto detect"}

Exam:
${cleanString(hints.exam) || "Auto detect"}

Class:
${cleanString(hints.classLevel) || "Auto detect"}

Selected Chapter:
${cleanString(hints.chapter) || "Auto detect"}

ALLOWED CHAPTERS FOR THIS SUBJECT/CLASS:

${
  safeArray(
    hints.allowedChapters
  ).length > 0
    ? safeArray(
        hints.allowedChapters
      ).join("\n")
    : "No whitelist supplied"
}

If Selected Chapter is not "Auto detect", treat it as the intended destination.

Do not silently assign a different chapter.

If the question clearly belongs elsewhere, set drop=true and explain why.

PAGES INCLUDED:

${allowedPageNumbers.join(", ")}

Every question MUST use sourcePage from:

${allowedPageNumbers.join(", ")}

SUPPORTING EXTRACTED TEXT:

${cleanString(text).slice(0, 3500)}

Each image below is preceded by its exact PDF page number.
`;

    const parts = [
      {
        text:
          prompt,
      },
    ];

    for (
      const page of
      validPages
    ) {
      parts.push({
        text:
          `ORIGINAL PDF PAGE ${page.pageNumber}. ` +
          `Questions from the next image must use sourcePage=${page.pageNumber}.`,
      });

      parts.push({
        inlineData: {
          mimeType:
            "image/png",

          data:
            imageBufferToBase64(
              page.buffer
            ),
        },
      });
    }

    const raw =
      await callGemini({
        parts,

        maxOutputTokens:
          32768,
      });

    const parsed =
      parseJsonObject(
        raw
      );

    const normalizedQuestions =
      safeArray(
        parsed?.questions
      ).map(
        (item) =>
          normalizeDetectedQuestion({
            item,

            allowedPageNumbers,

            hints,

            requirePage:
              true,
          })
      );

    return verifyLowConfidenceQuestions({
      questions:
        normalizedQuestions,

      validPages,

      hints,
    });
  };

// =====================================================
// ONE PAGE COMPATIBILITY
// =====================================================

const analyseNavtaPage =
  async ({
    page,
    text = "",
    hints = {},
  } = {}) => {
    return analyseRenderedPageBatch({
      pages: [
        page,
      ],

      text,

      hints,
    });
  };

// =====================================================
// STRONG QUESTION DEDUPLICATION
// =====================================================
//
// Gemini can occasionally return the same question twice
// with tiny formatting differences.
//
// NAVTA creates a canonical fingerprint and performs a
// conservative near-duplicate comparison.
// =====================================================

const normalizeQuestionForFingerprint = (
  value = ""
) => {
  return cleanString(
    value
  )
    .toLowerCase()

    .replace(
      /^\s*(?:q(?:uestion)?\.?\s*)?\d+[a-z]?\s*[\).:\-]\s*/i,
      ""
    )

    .replace(
      /\$\$?/g,
      " "
    )

    .replace(
      /\\(?:left|right|mathrm|mathbf|mathit|text)\b/g,
      ""
    )

    .replace(
      /\\begin\{[^}]+\}|\\end\{[^}]+\}/g,
      " "
    )

    .replace(
      /\\[,;:! ]/g,
      " "
    )

    .replace(
      /[^a-z0-9]+/g,
      " "
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
};

const getQuestionFingerprint = (
  question = {}
) => {
  const stem =
    normalizeQuestionForFingerprint(
      question?.question
    );

  const options =
    safeArray(
      question?.options
    )
      .map(
        normalizeQuestionForFingerprint
      )
      .filter(Boolean)
      .join("|");

  if (
    !stem
  ) {
    return "";
  }

  return [
    stem,
    options,
  ].join("||");
};

const tokenSet = (
  value = ""
) => {
  return new Set(
    normalizeQuestionForFingerprint(
      value
    )
      .split(" ")
      .filter(
        (token) =>
          token.length > 1
      )
  );
};

const jaccardSimilarity = (
  left = "",
  right = ""
) => {
  const a =
    tokenSet(
      left
    );

  const b =
    tokenSet(
      right
    );

  if (
    a.size === 0 ||
    b.size === 0
  ) {
    return 0;
  }

  let intersection =
    0;

  for (
    const token of
    a
  ) {
    if (
      b.has(
        token
      )
    ) {
      intersection += 1;
    }
  }

  const union =
    a.size +
    b.size -
    intersection;

  return union > 0
    ? intersection / union
    : 0;
};

const sameOptions = (
  a = {},
  b = {}
) => {
  const left =
    safeArray(
      a?.options
    )
      .map(
        normalizeQuestionForFingerprint
      );

  const right =
    safeArray(
      b?.options
    )
      .map(
        normalizeQuestionForFingerprint
      );

  if (
    left.length !==
    right.length
  ) {
    return false;
  }

  if (
    left.length === 0
  ) {
    return true;
  }

  return left.every(
    (value, index) =>
      value ===
      right[index]
  );
};

const areLikelyDuplicateQuestions = (
  a = {},
  b = {}
) => {
  const aFingerprint =
    getQuestionFingerprint(
      a
    );

  const bFingerprint =
    getQuestionFingerprint(
      b
    );

  if (
    !aFingerprint ||
    !bFingerprint
  ) {
    return false;
  }

  if (
    aFingerprint ===
    bFingerprint
  ) {
    return true;
  }

  const aNumber =
    cleanString(
      a?.questionNumber
    ).toLowerCase();

  const bNumber =
    cleanString(
      b?.questionNumber
    ).toLowerCase();

  const sameNumber =
    aNumber &&
    bNumber &&
    aNumber ===
      bNumber;

  const similarity =
    jaccardSimilarity(
      a?.question,
      b?.question
    );

  if (
    sameNumber &&
    similarity >=
      0.88
  ) {
    return true;
  }

  if (
    similarity >= 0.96 &&
    sameOptions(
      a,
      b
    )
  ) {
    return true;
  }

  return false;
};

const questionCompletenessScore = (
  question = {}
) => {
  let score =
    normalizeQuestionForFingerprint(
      question?.question
    ).length;

  score +=
    safeArray(
      question?.options
    )
      .filter(Boolean)
      .length *
    80;

  if (
    Number.isInteger(
      question?.correctAnswer
    )
  ) {
    score +=
      40;
  }

  if (
    question?.questionBoundingBox
  ) {
    score +=
      30;
  }

  if (
    question?.hasVisual &&
    question?.visualBoundingBox
  ) {
    score +=
      30;
  }

  if (
    cleanString(
      question?.chapter
    )
  ) {
    score +=
      10;
  }

  return score;
};

const removeQuestionDuplicates = (
  questions = []
) => {
  const result =
    [];

  let removed =
    0;

  for (
    const candidate of
    safeArray(
      questions
    )
  ) {
    const duplicateIndex =
      result.findIndex(
        (existing) =>
          areLikelyDuplicateQuestions(
            existing,
            candidate
          )
      );

    if (
      duplicateIndex === -1
    ) {
      result.push(
        candidate
      );

      continue;
    }

    removed +=
      1;

    if (
      questionCompletenessScore(
        candidate
      ) >
      questionCompletenessScore(
        result[
          duplicateIndex
        ]
      )
    ) {
      result[
        duplicateIndex
      ] =
        candidate;
    }
  }

  if (
    removed > 0
  ) {
    console.log(
      `NAVTA AI removed ${removed} duplicate question(s) before admin review.`
    );
  }

  return result;
};

// =====================================================
// ANALYSE ALL PDF PAGES
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

    const validPages =
      pages
        .filter(
          (page) =>
            page &&
            Number(
              page.pageNumber
            ) > 0 &&
            Buffer.isBuffer(
              page.buffer
            ) &&
            page.buffer.length > 0
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
          (a, b) =>
            a.pageNumber -
            b.pageNumber
        );

    if (
      validPages.length === 0
    ) {
      throw new Error(
        "NAVTA AI received no valid rendered PDF page images."
      );
    }

    const allQuestions =
      [];

    for (
      let start = 0;
      start <
      validPages.length;
      start +=
        NAVTA_AI_PAGES_PER_REQUEST
    ) {
      const batch =
        validPages.slice(
          start,
          start +
            NAVTA_AI_PAGES_PER_REQUEST
        );

      const pageNumbers =
        batch
          .map(
            (page) =>
              page.pageNumber
          )
          .join(", ");

      console.log(
        `NAVTA AI analysing page batch: ${pageNumbers}`
      );

      let batchQuestions =
        [];

      let lastError =
        null;

      const attempts =
        1 +
        NAVTA_AI_EMPTY_BATCH_RETRIES;

      for (
        let attempt = 1;
        attempt <=
          attempts;
        attempt += 1
      ) {
        try {
          batchQuestions =
            await analyseRenderedPageBatch({
              pages:
                batch,

              text,

              hints,
            });

          lastError =
            null;

          if (
            batchQuestions.length >
              0
          ) {
            break;
          }

          if (
            attempt <
            attempts
          ) {
            console.warn(
              `NAVTA AI batch ${pageNumbers} returned 0 questions; retrying once for completeness.`
            );
          }
        } catch (
          error
        ) {
          lastError =
            error;

          const isJsonRecoveryError =
            error?.code === "NAVTA_INVALID_JSON" ||
            error?.code === "NAVTA_EMPTY_JSON";

          // HTTP/capacity/network retries already happen inside callGemini().
          // Do not repeat the entire page batch after those retries are exhausted.
          if (!isJsonRecoveryError) {
            throw error;
          }

          if (attempt < attempts) {
            console.warn(
              `NAVTA AI batch ${pageNumbers} returned invalid/incomplete JSON on attempt ${attempt}; retrying the same batch.`
            );
          }
        }
      }

      if (lastError) {
        const canSplitBatch =
          batch.length > 1 &&
          (
            lastError?.code === "NAVTA_INVALID_JSON" ||
            lastError?.code === "NAVTA_EMPTY_JSON"
          );

        if (!canSplitBatch) {
          throw lastError;
        }

        console.warn(
          `NAVTA AI batch ${pageNumbers} still returned invalid JSON; falling back to one-page extraction.`
        );

        batchQuestions = [];

        for (const singlePage of batch) {
          const singlePageNumber = singlePage.pageNumber;
          let singlePageQuestions = [];
          let singlePageError = null;

          for (let singleAttempt = 1; singleAttempt <= attempts; singleAttempt += 1) {
            try {
              singlePageQuestions = await analyseRenderedPageBatch({
                pages: [singlePage],
                text,
                hints,
              });

              singlePageError = null;

              if (singlePageQuestions.length > 0 || singleAttempt >= attempts) {
                break;
              }
            } catch (error) {
              singlePageError = error;

              const isJsonRecoveryError =
                error?.code === "NAVTA_INVALID_JSON" ||
                error?.code === "NAVTA_EMPTY_JSON";

              if (!isJsonRecoveryError || singleAttempt >= attempts) {
                throw error;
              }

              console.warn(
                `NAVTA AI page ${singlePageNumber} returned invalid/incomplete JSON; retrying page alone.`
              );
            }
          }

          if (singlePageError) {
            throw singlePageError;
          }

          batchQuestions.push(...singlePageQuestions);
        }

        lastError = null;
      }

      allQuestions.push(
        ...batchQuestions
      );

      console.log(
        `NAVTA AI batch ${pageNumbers}: detected ${batchQuestions.length} question(s).`
      );
    }

    const deduplicated =
      removeQuestionDuplicates(
        allQuestions
      );

    return deduplicated.sort(
      (a, b) => {
        const pageDifference =
          (
            a.sourcePage ||
            0
          ) -
          (
            b.sourcePage ||
            0
          );

        if (
          pageDifference !==
          0
        ) {
          return pageDifference;
        }

        const aNumber =
          Number.parseFloat(
            a.questionNumber
          );

        const bNumber =
          Number.parseFloat(
            b.questionNumber
          );

        if (
          Number.isFinite(
            aNumber
          ) &&
          Number.isFinite(
            bNumber
          )
        ) {
          return (
            aNumber -
            bNumber
          );
        }

        return 0;
      }
    );
  };

// =====================================================
// OLD SOLVER COMPATIBILITY
// =====================================================

const solveQuestionFromImage =
  async () => {
    return {
      correctAnswer:
        null,

      explanation:
        "",

      confidence:
        "not-run",

      solverError:
        "Dedicated per-question solving is disabled during import to reduce Gemini quota usage.",
    };
  };

// =====================================================
// TXT / DOCX
// =====================================================

const analyseTextQuestions =
  async ({
    text,
    hints = {},
  } = {}) => {
    const sourceText =
      cleanString(
        text
      );

    if (
      !sourceText
    ) {
      throw new Error(
        "No text was extracted from the uploaded file."
      );
    }

    const prompt = `
You are NAVTA AI.

Separate every COMPLETE and READABLE academic question.

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

QUESTION TYPES:

mcq
short
long

For MCQs:

- return exactly four options when present
- try to determine correctAnswer in this same request
- A=0
- B=1
- C=2
- D=3
- if uncertain use null

FORMATTING RULES:

- For simple chemical subscripts, ionic charges and numeric powers, prefer Unicode:
  SiCl₄, NH₄⁺, SO₄²⁻, PO₄³⁻, x².

- Do not output visible underscore/caret notation for those simple cases when avoidable.

- Keep complex mathematics in LaTeX.

- Preserve each separately labelled statement on its own line.

- Insert a newline before (i), (ii), (iii), (iv), etc. when they begin separate statements.

- Do the same for (a), (b), (c), (d), Statement I/II/III, and Assertion/Reason blocks.

- Never merge separately labelled statements into one continuous line.

- Preserve original wording and labels exactly.

Return JSON only.

ADMIN HINTS:

Subject:
${cleanString(hints.subject) || "Auto detect"}

Exam:
${cleanString(hints.exam) || "Auto detect"}

Class:
${cleanString(hints.classLevel) || "Auto detect"}

Selected Chapter:
${cleanString(hints.chapter) || "Auto detect"}

ALLOWED CHAPTERS:

${
  safeArray(
    hints.allowedChapters
  ).length > 0
    ? safeArray(
        hints.allowedChapters
      ).join("\n")
    : "No whitelist supplied"
}

RULES:

- Never invent chapter names.
- If Selected Chapter is provided, use it as the intended destination.
- If the question clearly does not belong to the selected chapter, set drop=true.
- Return chapterConfidence, answerConfidence, classificationConfidence and difficultyConfidence from 0 to 1.
- If unsure of the MCQ answer, use correctAnswer=null and set needsReview=true.
- Do not guess missing options or missing text.
- Do NOT generate explanations, solutions, derivations, hints, or reasoning.
- explanation must always be an empty string.

RETURN:

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
      "chapterConfidence": 0.0,
      "answerConfidence": 0.0,
      "classificationConfidence": 0.0,
      "difficultyConfidence": 0.0,
      "needsReview": false,
      "drop": false,
      "dropReason": ""
    }
  ]
}

FILE TEXT:

${sourceText.slice(0, 50000)}
`;

    const raw =
      await callGemini({
        parts: [
          {
            text:
              prompt,
          },
        ],

        maxOutputTokens:
          16384,
      });

    const parsed =
      parseJsonObject(
        raw
      );

    return safeArray(
      parsed?.questions
    ).map(
      (item) =>
        normalizeDetectedQuestion({
          item: {
            ...item,

            hasVisual:
              false,

            visualType:
              "none",

            visualBoundingBox:
              null,

            visualDescription:
              "",
          },

          allowedPageNumbers:
            [],

          hints,

          requirePage:
            false,
        })
    );
  };

// =====================================================
// CONNECTION CHECK
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

    try {
      const endpoint =
        `${GEMINI_API_BASE}/models/` +
        `${encodeURIComponent(
          GEMINI_MODEL
        )}?key=` +
        `${encodeURIComponent(
          GEMINI_API_KEY
        )}`;

      const controller =
        new AbortController();

      const timeout =
        setTimeout(
          () => {
            controller.abort();
          },
          30000
        );

      try {
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
              `Gemini returned HTTP ${response.status}.`,
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
      } finally {
        clearTimeout(
          timeout
        );
      }
    } catch (
      error
    ) {
      return {
        ok:
          false,

        provider:
          "gemini",

        model:
          GEMINI_MODEL,

        message:
          error?.name ===
          "AbortError"
            ? "Gemini connection check timed out."
            : (
                error?.message ||
                "Gemini connection check failed."
              ),
      };
    }
  };

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  analyseNavtaPage,

  analyseRenderedPages,

  analyseTextQuestions,

  solveQuestionFromImage,

  checkGeminiConnection,

  checkNavtaAIGatewayConnection:
    checkGeminiConnection,

  checkOllamaConnection:
    checkGeminiConnection,
};
