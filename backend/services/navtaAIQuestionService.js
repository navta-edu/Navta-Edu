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
    ![
      x,
      y,
      width,
      height,
    ].every(
      Number.isFinite
    )
  ) {
    return null;
  }

  // Gemini may occasionally return percentages.
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

  x = Math.min(
    1,
    Math.max(
      0,
      x
    )
  );

  y = Math.min(
    1,
    Math.max(
      0,
      y
    )
  );

  width = Math.min(
    1 - x,
    Math.max(
      0,
      width
    )
  );

  height = Math.min(
    1 - y,
    Math.max(
      0,
      height
    )
  );

  if (
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return {
    x,
    y,
    width,
    height,
  };
};

// =====================================================
// OPTION VISUAL BOUNDING BOXES
// =====================================================

const normalizeOptionVisualBoundingBoxes = (
  value
) => {
  const source =
    safeArray(value);

  const result =
    [null, null, null, null];

  for (
    let index = 0;
    index < 4;
    index += 1
  ) {
    result[index] =
      normalizeBoundingBox(
        source[index]
      );
  }

  return result;
};

const hasAnyOptionVisual = (
  boxes = []
) =>
  safeArray(boxes).some(
    (box) =>
      Boolean(
        normalizeBoundingBox(
          box
        )
      )
  );

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

const parseJsonObject = (
  raw
) => {
  const text =
    stripJsonFences(
      raw
    );

  if (!text) {
    throw new Error(
      "NAVTA AI returned an empty JSON response."
    );
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    // Continue to recovery.
  }

  const start =
    text.indexOf("{");

  const end =
    text.lastIndexOf("}");

  if (
    start !== -1 &&
    end > start
  ) {
    const sliced =
      text
        .slice(
          start,
          end + 1
        )
        .replace(
          /,\s*([}\]])/g,
          "$1"
        );

    try {
      return JSON.parse(
        sliced
      );
    } catch {
      // Continue to debug output.
    }
  }

  console.error(
    "NAVTA AI INVALID JSON"
  );

  console.error(
    `Response length: ${text.length}`
  );

  console.error(
    "Response ending:"
  );

  console.error(
    text.slice(
      -1200
    )
  );

  throw new Error(
    "NAVTA AI response was incomplete or invalid. Please retry the import."
  );
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
  const headerValue =
    Number(
      response?.headers?.get?.(
        "retry-after"
      )
    );

  if (
    Number.isFinite(
      headerValue
    ) &&
    headerValue > 0
  ) {
    return Math.ceil(
      headerValue
    );
  }

  const match =
    String(
      message
    ).match(
      /retry\s+in\s+([\d.]+)s/i
    );

  if (match) {
    return Math.ceil(
      Number(
        match[1]
      ) || 60
    );
  }

  return 60;
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
    `${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent?key=` +
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
      NAVTA_AI_TIMEOUT_MS
    );

  try {
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

                maxOutputTokens,
              },
            }),
        }
      );

    const responseText =
      await response.text();

    let data = {};

    try {
      data =
        responseText
          ? JSON.parse(
              responseText
            )
          : {};
    } catch {
      throw new Error(
        "Gemini returned an invalid HTTP response."
      );
    }

    if (!response.ok) {
      const message =
        cleanString(
          data?.error?.message
        ) ||
        `Gemini returned HTTP ${response.status}.`;

      if (
        response.status === 429
      ) {
        const retryAfter =
          extractRetryAfterSeconds(
            response,
            message
          );

        const error =
          new Error(
            `Gemini quota/rate limit reached. Please wait about ${retryAfter} seconds and try again.`
          );

        error.statusCode =
          429;

        error.retryAfter =
          retryAfter;

        throw error;
      }

      throw new Error(
        message
      );
    }

    const modelText =
      extractGeminiText(
        data
      );

    if (!modelText) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    return modelText;
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      const timeoutError =
        new Error(
          "Gemini request timed out."
        );

      timeoutError.statusCode =
        504;

      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(
      timeout
    );
  }
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
Do NOT copy the four answer options into the question field.

5B. If an answer option is itself a diagram, graph, organic structure,
circuit, geometry figure, biological figure, or other spatial visual:
- put EXACTLY ${NAVTA_VISUAL_MARKER} in that option string
- return that option's own tight bounding box in optionVisualBoundingBoxes
- do NOT include that option visual inside visualBoundingBox

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

visualBoundingBox must contain ONLY the genuine visual.

It must NOT contain:

- the entire question
- normal question prose
- answer options
- question number
- unrelated nearby content

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

CRITICAL TIGHT-CROP RULE:

visualBoundingBox MUST tightly enclose ONLY the exact visual object
that belongs to the QUESTION STEM.

For a chemistry reaction question, include only the required substrate,
reaction arrows, reagents, conditions and structures that form the
question's reaction scheme.

DO NOT include:
- question number
- question prose
- answer labels
- answer option text
- answer option diagrams
- a diagram belonging to the next question
- blank page area merely because it is nearby

Make the box as tight as possible while keeping the complete visual.

OPTION VISUAL RULE:

For MCQ answer choices that are themselves visual objects, return:

"optionVisualBoundingBoxes": [
  null,
  null,
  null,
  null
]

Index 0 = Option A
Index 1 = Option B
Index 2 = Option C
Index 3 = Option D

For every visual option:
- the option text must contain exactly ${NAVTA_VISUAL_MARKER}
- its corresponding optionVisualBoundingBoxes entry MUST tightly
  enclose ONLY that option's diagram/structure
- do not include the A/B/C/D label unless it is inseparable
- do not include neighbouring options
- do not include the question-stem visual
- do not merge multiple option diagrams into one box

If an option is normal text/LaTeX, its box must be null.

question visualBoundingBox and optionVisualBoundingBoxes are independent.

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
OUTPUT
=======================================================

Return JSON ONLY.

Do not return Markdown.

Do not return explanations outside JSON.

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
      "optionVisualBoundingBoxes": [null, null, null, null],
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
          formatNavtaQuestionContent(
            option
          )
      )
      .filter(Boolean);

  const optionVisualBoundingBoxesRaw =
    normalizeOptionVisualBoundingBoxes(
      item.optionVisualBoundingBoxes
    );

  const normalizedOptions =
    options.map(
      (option, index) => {
        const hasOptionVisual =
          Boolean(
            optionVisualBoundingBoxesRaw[
              index
            ]
          );

        if (
          hasOptionVisual &&
          !option.includes(
            NAVTA_VISUAL_MARKER
          )
        ) {
          return `${option}\n${NAVTA_VISUAL_MARKER}`.trim();
        }

        if (
          !hasOptionVisual
        ) {
          return option
            .replaceAll(
              NAVTA_VISUAL_MARKER,
              ""
            )
            .trim();
        }

        return option;
      }
    );

  const questionType =
    normalizeQuestionType(
      item.questionType
    ) ||
    (
      normalizedOptions.length === 4
        ? "mcq"
        : ""
    );

  const questionBoundingBox =
    normalizeBoundingBox(
      item.questionBoundingBox
    );

  let visualBoundingBox =
    normalizeBoundingBox(
      item.visualBoundingBox
    );

  const optionVisualBoundingBoxes =
    optionVisualBoundingBoxesRaw;

  let visualType =
    normalizeVisualType(
      item.visualType
    );

  let hasVisual =
    Boolean(
      item.hasVisual
    );

  if (
    !hasVisual ||
    !visualBoundingBox
  ) {
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

  let question =
    formatNavtaQuestionContent(
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

    options:
      normalizedOptions,

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

    explanation:
      formatNavtaQuestionContent(
        item.explanation
      ),

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

    optionVisualBoundingBoxes,

    hasOptionVisuals:
      hasAnyOptionVisual(
        optionVisualBoundingBoxes
      ),

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

  return {
    ...original,
    ...verified,

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
      original.hasVisual,

    visualType:
      original.visualType,

    visualDescription:
      original.visualDescription,

    visualBoundingBox:
      original.visualBoundingBox,

    optionVisualBoundingBoxes:
      original.optionVisualBoundingBoxes,

    hasOptionVisuals:
      original.hasOptionVisuals,
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

Verify only the uncertain questions listed below against the supplied original PDF page images.

Do not create new questions.

Do not remove a readable question merely because the answer is uncertain.

Do not invent missing options or text.

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

Return the same questions only, with corrected:

- subject
- exam
- classLevel
- chapter
- difficulty
- correctAnswer
- explanation
- chapterConfidence
- answerConfidence
- classificationConfidence
- difficultyConfidence
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

          if (
            attempt >=
            attempts
          ) {
            throw error;
          }

          if (
            error?.statusCode ===
              429
          ) {
            throw error;
          }

          console.warn(
            `NAVTA AI batch ${pageNumbers} failed on attempt ${attempt}; retrying. ${error?.message || ""}`
          );
        }
      }

      if (
        lastError
      ) {
        throw lastError;
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
