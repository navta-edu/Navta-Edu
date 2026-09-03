// =====================================================
// NAVTA AI QUESTION SERVICE
// Gemini Vision - Screenshot First
// Clean Question Text + Robust JSON + Page Retry
// =====================================================
//
// STUDENT-FACING DESIGN:
//
// question
//   -> short, clean, human-readable question description
//
// questionBoundingBox
//   -> exact original printed question screenshot
//
// The screenshot is authoritative for:
// - determinants
// - matrices
// - long equations
// - diagrams
// - graphs
// - circuits
// - chemistry structures
// - tables
// - complex notation
//
// =====================================================


// =====================================================
// CONFIG
// =====================================================

const GEMINI_API_KEY = String(
  process.env.GEMINI_API_KEY || ""
).trim();

const GEMINI_MODEL = String(
  process.env.GEMINI_MODEL ||
    "gemini-3.5-flash-lite"
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
    process.env.NAVTA_AI_TIMEOUT_MS ||
      180000
  ) || 180000
);

const MAX_PAGE_ATTEMPTS = 2;


// =====================================================
// BASIC HELPERS
// =====================================================

const cleanString = (value = "") => {
  return String(
    value ?? ""
  ).trim();
};


const safeArray = (value) => {
  return Array.isArray(value)
    ? value
    : [];
};


// =====================================================
// INTERNAL ACADEMIC CONTENT NORMALIZER
// =====================================================
//
// This is still used for:
//
// - options
// - explanations
// - model answers
// - key points
//
// Those fields may legitimately contain mathematical
// notation.
//
// The visible "question" field uses a separate cleaner.
// =====================================================

const normalizeAcademicContent = (
  value = ""
) => {
  return cleanString(value)
    .replace(
      /```(?:latex|tex|math|markdown|json)?/gi,
      ""
    )
    .replace(
      /```/g,
      ""
    )
    .replace(
      /\r\n?/g,
      "\n"
    )
    .replace(
      /\u00a0/g,
      " "
    )
    .trim();
};


// =====================================================
// CLEAN VISIBLE QUESTION TEXT
// =====================================================
//
// IMPORTANT:
//
// The exact original academic question is displayed
// using questionImage / questionBoundingBox.
//
// Therefore this field should be readable metadata,
// NOT a reconstruction of a huge determinant/matrix.
//
// Example:
//
// BAD:
//
// The value of the determinant
// $\begin{vmatrix} ... \end{vmatrix}$ is
//
// GOOD:
//
// The value of the given determinant is:
//
// =====================================================

const normalizeVisibleQuestionText = (
  value = ""
) => {
  let text =
    normalizeAcademicContent(value);

  if (!text) {
    return "";
  }


  // ===================================================
  // DETECT COMPLEX CONTENT BEFORE CLEANING
  // ===================================================

  const containsDeterminant =
    /\\begin\s*\{\s*vmatrix\s*\}/i.test(text) ||
    /\\end\s*\{\s*vmatrix\s*\}/i.test(text);


  const containsMatrix =
    /\\begin\s*\{\s*(?:bmatrix|pmatrix|matrix|Vmatrix)\s*\}/i.test(
      text
    ) ||
    /\\end\s*\{\s*(?:bmatrix|pmatrix|matrix|Vmatrix)\s*\}/i.test(
      text
    );


  const containsCases =
    /\\begin\s*\{\s*cases\s*\}/i.test(text);


  // ===================================================
  // REPLACE DISPLAY LATEX BLOCKS
  // ===================================================

  if (containsDeterminant) {
    text =
      text.replace(
        /\$\$[\s\S]*?\\begin\s*\{\s*vmatrix\s*\}[\s\S]*?\\end\s*\{\s*vmatrix\s*\}[\s\S]*?\$\$/gi,
        "the given determinant"
      );

    text =
      text.replace(
        /\$[\s\S]*?\\begin\s*\{\s*vmatrix\s*\}[\s\S]*?\\end\s*\{\s*vmatrix\s*\}[\s\S]*?\$/gi,
        "the given determinant"
      );
  }


  if (containsMatrix) {
    text =
      text.replace(
        /\$\$[\s\S]*?\\begin\s*\{\s*(?:bmatrix|pmatrix|matrix|Vmatrix)\s*\}[\s\S]*?\\end\s*\{\s*(?:bmatrix|pmatrix|matrix|Vmatrix)\s*\}[\s\S]*?\$\$/gi,
        "the given matrix"
      );

    text =
      text.replace(
        /\$[\s\S]*?\\begin\s*\{\s*(?:bmatrix|pmatrix|matrix|Vmatrix)\s*\}[\s\S]*?\\end\s*\{\s*(?:bmatrix|pmatrix|matrix|Vmatrix)\s*\}[\s\S]*?\$/gi,
        "the given matrix"
      );
  }


  if (containsCases) {
    text =
      text.replace(
        /\$\$[\s\S]*?\\begin\s*\{\s*cases\s*\}[\s\S]*?\\end\s*\{\s*cases\s*\}[\s\S]*?\$\$/gi,
        "the given expression"
      );
  }


  // ===================================================
  // SAFETY FALLBACK
  // ===================================================
  //
  // If complex matrix commands remain after the
  // targeted replacement, use a simple readable title.
  // ===================================================

  if (
    /\\begin\s*\{\s*vmatrix\s*\}/i.test(text) ||
    /\\end\s*\{\s*vmatrix\s*\}/i.test(text)
  ) {
    text =
      "Find the value of the given determinant.";
  }


  if (
    /\\begin\s*\{\s*(?:bmatrix|pmatrix|matrix|Vmatrix)\s*\}/i.test(
      text
    ) ||
    /\\end\s*\{\s*(?:bmatrix|pmatrix|matrix|Vmatrix)\s*\}/i.test(
      text
    )
  ) {
    text =
      "Answer the question using the given matrix.";
  }


  // ===================================================
  // REMOVE DISPLAY DELIMITERS FROM VISIBLE DESCRIPTION
  // ===================================================

  text =
    text
      .replace(/\$\$/g, "")
      .replace(/\s+/g, " ")
      .trim();


  // ===================================================
  // REMOVE RAW COMPLEX LATEX COMMANDS IF THEY SURVIVED
  // ===================================================

  if (
    /\\begin\s*\{/i.test(text) ||
    /\\end\s*\{/i.test(text)
  ) {
    if (containsDeterminant) {
      return "Find the value of the given determinant.";
    }

    if (containsMatrix) {
      return "Answer the question using the given matrix.";
    }

    return "Answer the question shown in the given figure.";
  }


  return text;
};


// =====================================================
// QUESTION TYPE
// =====================================================

const normalizeQuestionType = (
  value
) => {
  const type =
    cleanString(value).toLowerCase();

  if (type === "mcq") {
    return "mcq";
  }

  if (type === "short") {
    return "short";
  }

  if (type === "long") {
    return "long";
  }

  return "";
};


// =====================================================
// DIFFICULTY
// =====================================================

const normalizeDifficulty = (
  value
) => {
  const difficulty =
    cleanString(value).toLowerCase();

  if (difficulty === "easy") {
    return "Easy";
  }

  if (difficulty === "medium") {
    return "Medium";
  }

  if (difficulty === "hard") {
    return "Hard";
  }

  return "";
};


// =====================================================
// CORRECT ANSWER
// =====================================================

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


  const text =
    cleanString(value).toUpperCase();


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


  return Object.prototype.hasOwnProperty.call(
    map,
    text
  )
    ? map[text]
    : null;
};


// =====================================================
// BOUNDING BOX
// =====================================================

const normalizeBoundingBox = (
  value
) => {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }


  let x =
    Number(value.x);

  let y =
    Number(value.y);

  let width =
    Number(value.width);

  let height =
    Number(value.height);


  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null;
  }


  // ===================================================
  // SUPPORT PERCENTAGE COORDINATES
  // ===================================================

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


  const safeX =
    Math.min(
      1,
      Math.max(0, x)
    );


  const safeY =
    Math.min(
      1,
      Math.max(0, y)
    );


  const safeWidth =
    Math.min(
      1 - safeX,
      Math.max(0, width)
    );


  const safeHeight =
    Math.min(
      1 - safeY,
      Math.max(0, height)
    );


  if (
    safeWidth <= 0 ||
    safeHeight <= 0
  ) {
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
// IMAGE BUFFER
// =====================================================

const imageBufferToBase64 = (
  buffer
) => {
  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length === 0
  ) {
    throw new Error(
      "A valid rendered PDF page image buffer is required."
    );
  }


  return buffer.toString(
    "base64"
  );
};


// =====================================================
// VALIDATE RENDERED PAGE
// =====================================================

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
    Number(page.pageNumber);


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

NAVTA uses a SCREENSHOT-FIRST question system.

The ORIGINAL QUESTION SCREENSHOT is the authoritative student-facing academic content.

Your job is:

1. Visually inspect the complete PDF page image.
2. Detect every readable academic question.
3. Find the screenshot boundary for each complete question.
4. Create a SHORT CLEAN HUMAN-READABLE question description.
5. Extract hidden metadata for classification and scoring.


=====================================================
SUPPORTED CONTENT
=====================================================

Subjects:

Physics
Chemistry
Maths
Biology

Exams:

NEET
JEE
Boards

Classes:

Class 11
Class 12

Difficulty:

Easy
Medium
Hard

Question types:

mcq
short
long


=====================================================
PRIMARY SOURCE
=====================================================

THE ORIGINAL PAGE IMAGE IS THE PRIMARY SOURCE.

You MUST visually inspect it.

Extracted text is supporting context only.

Do NOT determine questionBoundingBox only from extracted text.


=====================================================
SCAN COMPLETE PAGE
=====================================================

Scan the complete page from top to bottom.

If the page contains multiple columns:

inspect every column.

Detect EVERY readable academic question.

Do not stop after only a few questions.


=====================================================
CRITICAL QUESTION TEXT RULE
=====================================================

The "question" field is NOT supposed to reconstruct the entire printed mathematical question.

The ORIGINAL QUESTION SCREENSHOT will show the exact academic content.

Therefore:

"question" MUST be a short, clean, human-readable description.

DO NOT put complicated LaTeX into "question".

DO NOT put large determinants into "question".

DO NOT put large matrices into "question".

DO NOT reconstruct diagrams inside "question".

DO NOT reconstruct graphs inside "question".

DO NOT reconstruct circuits inside "question".

DO NOT reconstruct chemical structures inside "question".

DO NOT reconstruct long equations inside "question".


=====================================================
QUESTION TEXT EXAMPLES
=====================================================

PRINTED:

The value of the determinant [large determinant] is

RETURN:

"question": "The value of the given determinant is:"


PRINTED:

If A = [large matrix], then A inverse is

RETURN:

"question": "Find the inverse of the given matrix."


PRINTED:

If A and B are the given matrices, find AB.

RETURN:

"question": "Find the product of the given matrices."


PRINTED:

Find the value of [large mathematical expression].

RETURN:

"question": "Find the value of the given expression."


PRINTED:

Find the current in the circuit shown.

RETURN:

"question": "Find the current in the given circuit."


PRINTED:

The graph shown represents which relationship?

RETURN:

"question": "Identify the relationship represented by the given graph."


PRINTED:

Identify the labelled structure in the biological diagram.

RETURN:

"question": "Identify the labelled structure in the given diagram."


PRINTED:

Which product is formed in the following reaction?

RETURN:

"question": "Identify the product formed in the given reaction."


=====================================================
SIMPLE TEXT QUESTIONS
=====================================================

If the printed question is ordinary readable text and does NOT contain complex notation, preserve its actual wording.

Example:

PRINTED:

Which hormone is responsible for milk ejection?

RETURN:

"question": "Which hormone is responsible for milk ejection?"


=====================================================
SIMPLE MATHEMATICS
=====================================================

Simple mathematical notation may remain when it is short and readable.

For example:

"Find x if x² = 25."

is acceptable.

But do NOT return:

\\begin{vmatrix}

\\begin{bmatrix}

\\begin{pmatrix}

\\frac{...}

large multi-line LaTeX

or raw complex mathematical reconstruction inside the visible question field.


=====================================================
NO RAW LATEX IN QUESTION FIELD
=====================================================

The "question" field must NEVER visibly contain strings such as:

\\begin{vmatrix}

\\end{vmatrix}

\\begin{bmatrix}

\\end{bmatrix}

\\begin{pmatrix}

\\end{pmatrix}

\\begin{matrix}

\\end{matrix}

$$

Do not make the student read reconstructed LaTeX.

The screenshot already contains the exact original notation.


=====================================================
QUESTION SCREENSHOT
=====================================================

Every non-dropped question MUST return:

"questionBoundingBox": {
  "x": 0.0,
  "y": 0.0,
  "width": 0.0,
  "height": 0.0
}

Coordinates are normalized from 0 to 1.

x = left edge / page width

y = top edge / page height

width = screenshot width / page width

height = screenshot height / page height


=====================================================
SCREENSHOT MUST INCLUDE
=====================================================

The questionBoundingBox must include:

- printed question number
- complete question statement
- all options
- determinant
- matrix
- equation
- diagram
- graph
- circuit
- table
- chemistry structure
- biological figure
- geometry figure
- ray diagram
- chart
- apparatus
- any other content belonging to that question


=====================================================
SCREENSHOT MUST NOT INCLUDE
=====================================================

Do not include:

- previous question
- next question
- unrelated instructions
- unrelated page content

Use a small safety margin around the question.


=====================================================
BOUNDING BOX ACCURACY
=====================================================

Coordinates do NOT need to be pixel-perfect.

If you can visually see the complete question, estimate a safe bounding box.

Do NOT return questionBoundingBox=null simply because the coordinates are approximate.

Use null only when the complete question boundary genuinely cannot be determined.


=====================================================
MCQ
=====================================================

NEET and JEE questions use:

questionType = "mcq"

Return four options when four options are visible.

correctAnswer:

0 = A
1 = B
2 = C
3 = D

If uncertain:

correctAnswer = null

Never guess.


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
VISUALS
=====================================================

If the question contains an important visual:

hasVisual = true

When reliably possible also return:

visualBoundingBox

However:

questionBoundingBox must already contain the complete question and its visual.


=====================================================
DROP RULES
=====================================================

Do NOT drop because:

- correct answer is uncertain
- chapter is uncertain
- difficulty is uncertain
- explanation is unavailable

Use drop=true only when:

- actual question is unreadable
- question is incomplete
- essential continuation is on another page
- complete screenshot boundary genuinely cannot be identified


=====================================================
JSON OUTPUT
=====================================================

Return ONLY valid JSON.

No Markdown.

No code fences.

No introduction.

No commentary.

Top-level structure:

{
  "questions": []
}

Every question:

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

Keep JSON compact.

Do not repeat content unnecessarily.

Always close every string, object and array.

Before responding verify that the JSON is syntactically complete.
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
  const pageNumber =
    Number(page.pageNumber);


  const subjectHint =
    cleanString(hints?.subject) ||
    "Not provided";


  const examHint =
    cleanString(hints?.exam) ||
    "Not provided";


  const classHint =
    cleanString(hints?.classLevel) ||
    "Not provided";


  const pageText =
    cleanString(page?.text);


  const retryInstruction =
    retry
      ? `
IMPORTANT RETRY:

The previous response for this same page was not valid JSON.

Return shorter and stricter JSON.

Do not use Markdown.

Do not use code fences.

Do not write anything outside the JSON.

Make sure the final ] and } are present.
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


=====================================================
IMPORTANT
=====================================================

The actual rendered PNG for PDF PAGE ${pageNumber} is attached.

Visually inspect the COMPLETE image.

Detect every readable academic question.

Every non-dropped question MUST have questionBoundingBox.

Every sourcePage MUST equal:

${pageNumber}


=====================================================
VISIBLE QUESTION TEXT
=====================================================

Remember:

The "question" field is only a CLEAN readable description.

The screenshot contains the exact printed academic question.

Do NOT reconstruct large determinants, matrices, equations, diagrams or other complex content using LaTeX.

For example:

Instead of:

"The value of the determinant $\\begin{vmatrix} ..."

Return:

"The value of the given determinant is:"


=====================================================
PAGE TEXT SUPPORT
=====================================================

${pageText.slice(0, 5000)}


=====================================================
GENERAL DOCUMENT SUPPORT
=====================================================

${String(text || "").slice(0, 3000)}


Return ONLY:

{
  "questions": [...]
}
`;
};


// =====================================================
// GEMINI REQUEST PARTS
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
        `The next image is ORIGINAL PDF PAGE ${validPage.pageNumber}. Visually inspect it completely. Determine questionBoundingBox for every complete question.`,
    },

    {
      inlineData: {
        mimeType:
          "image/png",

        data:
          imageBufferToBase64(
            validPage.buffer
          ),
      },
    },
  ];
};


// =====================================================
// GEMINI RESPONSE HELPERS
// =====================================================

const extractGeminiText = (
  data
) => {
  for (
    const candidate of
    safeArray(data?.candidates)
  ) {
    const output =
      safeArray(
        candidate?.content?.parts
      )
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
    cleanString(
      data?.error?.message
    ) ||
    fallbackMessage
  );
};


// =====================================================
// JSON CLEANING
// =====================================================

const stripJsonFences = (
  value
) => {
  let text =
    cleanString(value);


  text =
    text.replace(
      /^```(?:json|javascript|js)?\s*/i,
      ""
    );


  text =
    text.replace(
      /\s*```$/i,
      ""
    );


  return text.trim();
};


// =====================================================
// EXTRACT OUTER JSON
// =====================================================

const extractOuterJsonObject = (
  value
) => {
  const text =
    stripJsonFences(value);


  const start =
    text.indexOf("{");


  if (start === -1) {
    return text;
  }


  let inString =
    false;

  let escaped =
    false;

  let depth =
    0;


  for (
    let index = start;
    index < text.length;
    index += 1
  ) {
    const char =
      text[index];


    if (escaped) {
      escaped = false;
      continue;
    }


    if (
      char === "\\" &&
      inString
    ) {
      escaped = true;
      continue;
    }


    if (char === '"') {
      inString =
        !inString;

      continue;
    }


    if (inString) {
      continue;
    }


    if (char === "{") {
      depth += 1;
    }


    if (char === "}") {
      depth -= 1;


      if (depth === 0) {
        return text.slice(
          start,
          index + 1
        );
      }
    }
  }


  return text.slice(start);
};


// =====================================================
// REMOVE TRAILING COMMAS
// =====================================================

const removeTrailingCommas = (
  value
) => {
  return String(
    value || ""
  ).replace(
    /,\s*([}\]])/g,
    "$1"
  );
};


// =====================================================
// REPAIR TRUNCATED JSON
// =====================================================

const repairTruncatedJson = (
  value
) => {
  let text =
    removeTrailingCommas(
      extractOuterJsonObject(
        value
      )
    ).trim();


  if (!text) {
    return "";
  }


  let inString =
    false;

  let escaped =
    false;


  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    const char =
      text[index];


    if (escaped) {
      escaped = false;
      continue;
    }


    if (
      char === "\\" &&
      inString
    ) {
      escaped = true;
      continue;
    }


    if (char === '"') {
      inString =
        !inString;
    }
  }


  if (escaped) {
    text += "\\";
  }


  if (inString) {
    text += '"';
  }


  text =
    text.replace(
      /,\s*$/,
      ""
    );


  const stack =
    [];


  inString =
    false;

  escaped =
    false;


  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    const char =
      text[index];


    if (escaped) {
      escaped = false;
      continue;
    }


    if (
      char === "\\" &&
      inString
    ) {
      escaped = true;
      continue;
    }


    if (char === '"') {
      inString =
        !inString;

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
        stack[
          stack.length - 1
        ] === char
      ) {
        stack.pop();
      }
    }
  }


  while (
    stack.length > 0
  ) {
    text +=
      stack.pop();
  }


  return removeTrailingCommas(
    text
  );
};


// =====================================================
// MULTIPLE JSON PARSE ATTEMPTS
// =====================================================

const tryParseGeminiJson = (
  rawResponse
) => {
  const attempts =
    [];


  const raw =
    stripJsonFences(
      rawResponse
    );


  if (raw) {
    attempts.push(raw);
  }


  const outer =
    extractOuterJsonObject(
      raw
    );


  if (
    outer &&
    !attempts.includes(outer)
  ) {
    attempts.push(outer);
  }


  const noTrailing =
    removeTrailingCommas(
      outer
    );


  if (
    noTrailing &&
    !attempts.includes(
      noTrailing
    )
  ) {
    attempts.push(
      noTrailing
    );
  }


  const repaired =
    repairTruncatedJson(
      outer
    );


  if (
    repaired &&
    !attempts.includes(
      repaired
    )
  ) {
    attempts.push(
      repaired
    );
  }


  for (
    const candidate of
    attempts
  ) {
    try {
      return {
        success: true,

        parsed:
          JSON.parse(
            candidate
          ),
      };
    } catch {
      // Try next candidate.
    }
  }


  return {
    success: false,
    parsed: null,
  };
};


// =====================================================
// NORMALIZE GEMINI QUESTION
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


  let drop =
    Boolean(
      item?.drop
    );


  let dropReason =
    cleanString(
      item?.dropReason
    );


  if (
    !questionBoundingBox
  ) {
    drop =
      true;


    if (!dropReason) {
      dropReason =
        "The complete one-question screenshot boundary could not be identified safely.";
    }
  }


  const options =
    safeArray(
      item?.options
    )
      .map(
        normalizeAcademicContent
      )
      .filter(Boolean);


  const keyPoints =
    safeArray(
      item?.keyPoints
    )
      .map(
        normalizeAcademicContent
      )
      .filter(Boolean);


  let maxMarks =
    null;


  if (
    item?.maxMarks !== null &&
    item?.maxMarks !== undefined
  ) {
    const marks =
      Number(
        item.maxMarks
      );


    if (
      Number.isFinite(marks) &&
      marks > 0
    ) {
      maxMarks =
        marks;
    }
  }


  return {
    questionNumber:
      cleanString(
        item?.questionNumber
      ),

    // =================================================
    // CLEAN HUMAN-READABLE VISIBLE QUESTION
    // =================================================

    question:
      normalizeVisibleQuestionText(
        item?.question
      ),

    subject:
      cleanString(
        item?.subject
      ),

    exam:
      cleanString(
        item?.exam
      ),

    classLevel:
      cleanString(
        item?.classLevel
      ),

    chapter:
      cleanString(
        item?.chapter
      ),

    difficulty:
      normalizeDifficulty(
        item?.difficulty
      ),

    questionType:
      normalizeQuestionType(
        item?.questionType
      ),

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
      Boolean(
        item?.hasVisual
      ),

    visualDescription:
      cleanString(
        item?.visualDescription
      ),

    visualBoundingBox,

    sourcePage:
      Number(
        pageNumber
      ),

    drop,

    dropReason,
  };
};


// =====================================================
// PARSE GEMINI QUESTIONS
// =====================================================

const parseGeminiQuestions = ({
  rawResponse,
  pageNumber,
}) => {
  const result =
    tryParseGeminiJson(
      rawResponse
    );


  if (!result.success) {
    const error =
      new Error(
        `NAVTA could not understand the Gemini JSON response for PDF page ${pageNumber}.`
      );


    error.code =
      "NAVTA_GEMINI_JSON_PARSE_ERROR";


    error.pageNumber =
      pageNumber;


    throw error;
  }


  const parsed =
    result.parsed;


  const rawQuestions =
    Array.isArray(parsed)
      ? parsed
      : safeArray(
          parsed?.questions
        );


  return rawQuestions
    .filter(
      (item) =>
        item &&
        typeof item ===
          "object"
    )
    .map(
      (item) =>
        normalizeDetectedQuestion({
          item,
          pageNumber,
        })
    );
};
// =====================================================
// SEND ONE GEMINI PAGE REQUEST
// =====================================================

const sendGeminiPageRequest =
  async ({
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


    if (!GEMINI_MODEL) {
      throw new Error(
        "GEMINI_MODEL is not configured on the NAVTA backend."
      );
    }


    const validPage =
      validateRenderedPage(
        page
      );


    const pageNumber =
      validPage.pageNumber;


    const parts =
      buildGeminiParts({
        page:
          validPage,

        text,

        hints,

        retry,
      });


    const controller =
      new AbortController();


    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
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
          retry
            ? "retry"
            : "first attempt"
        }.`
      );


      const response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

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
                    role:
                      "user",

                    parts,
                  },
                ],

                generationConfig: {
                  temperature:
                    0.05,

                  responseMimeType:
                    "application/json",

                  maxOutputTokens:
                    8192,
                },
              }),
          }
        );


      const responseText =
        await response.text();


      let responseData;


      try {
        responseData =
          responseText
            ? JSON.parse(
                responseText
              )
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
          responseData
            ?.promptFeedback
            ?.blockReason
        );


      if (blockReason) {
        throw new Error(
          `Gemini blocked PDF page ${pageNumber}. Reason: ${blockReason}.`
        );
      }


      const modelText =
        extractGeminiText(
          responseData
        );


      if (!modelText) {
        const finishReason =
          cleanString(
            responseData
              ?.candidates
              ?.[0]
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
      if (
        error?.name ===
        "AbortError"
      ) {
        throw new Error(
          `Gemini timed out while analysing PDF page ${pageNumber}.`
        );
      }


      throw error;
    } finally {
      clearTimeout(
        timeout
      );
    }
  };


// =====================================================
// ANALYSE ONE PAGE WITH RETRY
// =====================================================

const analyseSinglePageWithRetry =
  async ({
    page,
    text = "",
    hints = {},
  }) => {
    const validPage =
      validateRenderedPage(
        page
      );


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


        if (
          !isJsonError ||
          attempt >=
            MAX_PAGE_ATTEMPTS
        ) {
          break;
        }


        console.log(
          `NAVTA retrying PDF page ${pageNumber} with stricter JSON instructions.`
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
// PUBLIC SINGLE-PAGE ANALYSIS
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
      ).toLowerCase();


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
      seen.has(key)
    ) {
      continue;
    }


    if (questionText) {
      seen.add(key);
    }


    output.push(
      question
    );
  }


  return output;
};


// =====================================================
// SORT QUESTIONS
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


      // =================================================
      // SCREENSHOT POSITION
      // =================================================

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


      // =================================================
      // QUESTION NUMBER FALLBACK
      // =================================================

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
// ANALYSE ALL RENDERED PAGES
// =====================================================
//
// IMPORTANT:
//
// navtaAIImportService.js expects:
//
// analyseRenderedPages
//
// Keep this function name.
//
// Processing:
//
// Page 1
//   -> Gemini Vision
//   -> clean question description
//   -> questionBoundingBox
//   -> retry if JSON malformed
//
// Page 2
//   -> same
//
// Continues until final page.
//
// =====================================================

const analyseRenderedPages =
  async ({
    pages = [],
    text = "",
    hints = {},
  } = {}) => {
    if (
      !Array.isArray(pages) ||
      pages.length === 0
    ) {
      return [];
    }


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
      "Visible question mode: CLEAN DESCRIPTION"
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
    // SEQUENTIAL PAGE PROCESSING
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
        `NAVTA PDF page ${pageNumber}: detected=${normalizedQuestions.length}, screenshotBoxes=${screenshotCount}, dropped=${droppedCount}.`
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
    // SORT
    // =================================================

    const sortedQuestions =
      sortQuestionsInPdfOrder(
        deduplicatedQuestions
      );


    // =================================================
    // SUMMARY
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


    if (!GEMINI_MODEL) {
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


      if (!response.ok) {
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

module.exports = {
  analyseNavtaPage,

  analyseRenderedPages,

  checkGeminiConnection,

  checkNavtaAIGatewayConnection:
    checkGeminiConnection,

  checkOllamaConnection:
    checkGeminiConnection,
};
