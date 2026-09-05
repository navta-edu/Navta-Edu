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
// This improves completeness without doubling every Gemini request.
const NAVTA_AI_EMPTY_BATCH_RETRIES = Math.max(
  0,
  Math.min(
    2,
    Number(
      process.env.NAVTA_AI_EMPTY_BATCH_RETRIES || 1
    ) || 1
  )
);

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
// NORMALIZE QUESTION TYPE
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

// =====================================================
// NORMALIZE DIFFICULTY
// =====================================================

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

// =====================================================
// NORMALIZE SUBJECT
// =====================================================

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

// =====================================================
// NORMALIZE EXAM
// =====================================================

const normalizeExam = (
  value
) => {
  const text = cleanString(
    value
  ).toLowerCase();

  if (
    text.includes("neet")
  ) {
    return "NEET";
  }

  if (
    text.includes("jee")
  ) {
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

// =====================================================
// NORMALIZE CLASS
// =====================================================

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
// NORMALIZE BOUNDING BOX
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

  // Convert percentages if AI returns 0-100.

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
// IMAGE TO BASE64
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

  // ============================================
  // FIRST: NORMAL JSON
  // ============================================

  try {
    return JSON.parse(
      text
    );
  } catch {
    // Continue.
  }

  // ============================================
  // SECOND: EXTRACT JSON OBJECT
  // ============================================

  const start =
    text.indexOf("{");

  const end =
    text.lastIndexOf("}");

  if (
    start !== -1 &&
    end > start
  ) {
    let sliced =
      text.slice(
        start,
        end + 1
      );

    // Remove accidental trailing commas.
    sliced =
      sliced.replace(
        /,\s*([}\]])/g,
        "$1"
      );

    try {
      return JSON.parse(
        sliced
      );
    } catch {
      // Continue.
    }
  }

  // ============================================
  // LOG SMALL DEBUG SAMPLE
  // ============================================

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
    "NAVTA AI response was incomplete. Please retry the import."
  );
};

// =====================================================
// GEMINI TEXT
// =====================================================

const extractGeminiText = (
  data
) => {
  for (
    const candidate of
    safeArray(
      data?.candidates
    )
  ) {
    const text =
      safeArray(
        candidate
          ?.content
          ?.parts
      )
        .map(
          (part) => {
            if (
              typeof part?.text ===
              "string"
            ) {
              return part.text;
            }

            return "";
          }
        )
        .filter(Boolean)
        .join("\n")
        .trim();

    if (
      text
    ) {
      return text;
    }
  }

  return "";
};

// =====================================================
// RATE LIMIT
// =====================================================

const extractRetryAfterSeconds = (
  response,
  message = ""
) => {
  const headerValue =
    Number(
      response
        ?.headers
        ?.get?.(
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

  if (
    match
  ) {
    return Math.ceil(
      Number(
        match[1]
      ) ||
      60
    );
  }

  return 60;
};

// =====================================================
// CALL GEMINI
// =====================================================

const callGemini = async ({
  parts,
  maxOutputTokens = 16384,
}) => {
  if (
    !GEMINI_API_KEY
  ) {
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

    if (
      !response.ok
    ) {
      const message =
        cleanString(
          data?.error?.message
        ) ||
        `Gemini returned HTTP ${response.status}.`;

      if (
        response.status ===
        429
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

    if (
      !modelText
    ) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    return modelText;
  } catch (
    error
  ) {
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
// PDF PROMPT
// =====================================================

const PDF_BATCH_PROMPT = `
You are NAVTA AI.

You are the academic question-separation engine for the NAVTA learning platform.

You will receive MULTIPLE ORIGINAL RENDERED PDF PAGE IMAGES in one request.

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

TASK:

Detect every COMPLETE and READABLE academic question on every supplied page.

COMPLETENESS RULES — VERY IMPORTANT:

- Scan EACH page from top to bottom and left to right.
- Do not stop after finding the first few questions.
- Return every visible complete question on the supplied page(s).
- Treat every visible question number / numbered stem as a separate candidate.
- If a page contains 12 readable questions, return 12 questions.
- Never invent a duplicate question to increase the count.
- Do not repeat the same question with slightly different wording.
- Preserve the original question number whenever it is visible.
- If the same question is visible more than once due to page overlap, return it only once.

IMPORTANT RULES:

1. The original rendered page is authoritative.

2. Every question MUST contain the correct sourcePage.

3. questionBoundingBox should identify the complete question on its source page.

questionBoundingBox is INTERNAL NAVTA METADATA.

It is NOT automatically displayed to students.

4. Bounding boxes use normalized values from 0 to 1:

x
y
width
height

5. questionBoundingBox should contain the complete single question:

- question number
- question statement
- equations
- all MCQ options
- any required figure

6. Do not include the previous or next question in questionBoundingBox.

7. For MCQs return exactly four options when four options are visible.

8. correctAnswer is ZERO-BASED:

A = 0
B = 1
C = 2
D = 3

9. Try to solve the MCQ during THIS SAME request.

10. If the answer is uncertain:

correctAnswer = null

11. Do not drop a readable question only because correctAnswer is null.

12. If chapter is uncertain:

chapter = ""

13. If difficulty is uncertain:

difficulty = "Medium"

14. Set drop=true only if the actual question is unreadable, incomplete,
or cannot be separated safely.

15. VISUAL RULE — VERY IMPORTANT:

hasVisual=true ONLY when the original question contains a genuine visual
that should be preserved as an image.

Examples:

- graph
- coordinate graph
- geometry figure
- circuit
- ray diagram
- apparatus
- biological diagram
- map
- image-based table
- figure referred to by the question
- chemical structural drawing that cannot be represented reliably as text

16. THESE ARE NOT VISUAL DIAGRAMS:

- normal equations
- fractions
- square roots
- matrices
- determinants
- vectors written symbolically
- integrals
- summations
- trigonometric expressions
- Greek symbols
- algebraic expressions
- normal chemical equations written as text

For these:

hasVisual = false
visualType = "none"
visualBoundingBox = null
visualDescription = ""

17. If hasVisual=true:

visualType must describe the visual.

visualBoundingBox MUST contain ONLY the actual diagram / graph / figure.

visualBoundingBox MUST NOT be the whole question box unless the entire
question itself is genuinely an image.

Allowed visualType values:

none
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

18. If hasVisual=false:

visualType = "none"
visualBoundingBox = null
visualDescription = ""

19. Keep mathematical content in LaTeX where appropriate.

20. Return JSON ONLY.

Do not return Markdown.

Do not return explanations outside JSON.

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
      "questionBoundingBox": null,
      "hasVisual": false,
      "visualType": "none",
      "visualDescription": "",
      "visualBoundingBox": null,
      "sourcePage": null,
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
          cleanString(
            option
          )
      )
      .filter(Boolean);

  const questionType =
    normalizeQuestionType(
      item.questionType
    ) ||
    (
      options.length === 4
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

  let visualType =
    normalizeVisualType(
      item.visualType
    );

  let hasVisual =
    Boolean(
      item.hasVisual
    );

  // A real visual MUST have its own
  // separate visual bounding box.

  if (
    !hasVisual ||
    !visualBoundingBox
  ) {
    hasVisual =
      false;

    visualType =
      "none";

    visualBoundingBox =
      null;
  }

  if (
    hasVisual &&
    visualType === "none"
  ) {
    visualType =
      "other";
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

  const question =
    cleanString(
      item.question
    );

  if (
    !question
  ) {
    drop =
      true;

    dropReason =
      dropReason ||
      "Question text is missing.";
  }

  if (
    requirePage &&
    !sourcePage
  ) {
    drop =
      true;

    dropReason =
      dropReason ||
      "Source page could not be identified.";
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
      ),

    difficulty:
      normalizeDifficulty(
        item.difficulty
      ) ||
      "Medium",

    questionType,

    options,

    correctAnswer:
      normalizeCorrectAnswer(
        item.correctAnswer
      ),

    modelAnswer:
      cleanString(
        item.modelAnswer
      ),

    keyPoints:
      safeArray(
        item.keyPoints
      )
        .map(
          (point) =>
            cleanString(
              point
            )
        )
        .filter(Boolean),

    maxMarks:
      item.maxMarks === null ||
      item.maxMarks === undefined
        ? null
        : Number(
            item.maxMarks
          ),

    explanation:
      cleanString(
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

    sourcePage,

    drop,

    dropReason,
  };
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
      validPages.length ===
      0
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

    return safeArray(
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
// Gemini can occasionally return the same question twice with:
// - different whitespace
// - different LaTeX delimiters
// - a slightly different question-number prefix
// - tiny punctuation differences
//
// NAVTA therefore creates a canonical fingerprint and also
// performs a conservative near-duplicate comparison.
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
    tokenSet(left);

  const b =
    tokenSet(right);

  if (
    a.size === 0 ||
    b.size === 0
  ) {
    return 0;
  }

  let intersection =
    0;

  for (
    const token of a
  ) {
    if (
      b.has(token)
    ) {
      intersection +=
        1;
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
    left.length ===
      0
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

  // Strong rule: same visible question number and very similar stem.
  if (
    sameNumber &&
    similarity >= 0.88
  ) {
    return true;
  }

  // Conservative rule for duplicates where Gemini changed the number
  // or one result lost the number. Require almost identical wording
  // AND identical options so genuinely different questions survive.
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
      duplicateIndex ===
      -1
    ) {
      result.push(
        candidate
      );

      continue;
    }

    removed +=
      1;

    // Keep whichever copy contains more useful information.
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
      pages.length ===
        0
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
          (a, b) =>
            a.pageNumber -
            b.pageNumber
        );

    if (
      validPages.length ===
      0
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

          // Do not silently skip a page. A partial import is worse
          // than a clear failure because the admin may assume all
          // questions were captured.
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

Return JSON only.

ADMIN HINTS:

Subject:
${cleanString(hints.subject) || "Auto detect"}

Exam:
${cleanString(hints.exam) || "Auto detect"}

Class:
${cleanString(hints.classLevel) || "Auto detect"}

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
