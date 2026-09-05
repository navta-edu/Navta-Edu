// =====================================================
// NAVTA AI QUESTION SERVICE
// Google Gemini Vision
// Question Separation Flow
// =====================================================

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-3.5-flash-lite";

const GEMINI_API_BASE =
  (
    process.env.GEMINI_API_BASE ||
    "https://generativelanguage.googleapis.com/v1beta"
  )
    .trim()
    .replace(/\/+$/, "");

const NAVTA_AI_TIMEOUT_MS =
  Math.max(
    30000,
    Number(
      process.env.NAVTA_AI_TIMEOUT_MS ||
      180000
    ) || 180000
  );

// =====================================================
// HELPERS
// =====================================================

const cleanString = (value = "") => {
  return String(value || "").trim();
};

const safeArray = (value) => {
  return Array.isArray(value)
    ? value
    : [];
};

const normalizeQuestionType = (
  value
) => {
  const type =
    cleanString(value)
      .toLowerCase();

  if (type === "short") {
    return "short";
  }

  if (type === "long") {
    return "long";
  }

  return "mcq";
};

const normalizeDifficulty = (
  value
) => {
  const difficulty =
    cleanString(value)
      .toLowerCase();

  if (difficulty === "easy") {
    return "Easy";
  }

  if (difficulty === "hard") {
    return "Hard";
  }

  return "Medium";
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

  const text =
    cleanString(value)
      .toUpperCase();

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

  return Object.prototype
    .hasOwnProperty.call(
      map,
      text
    )
    ? map[text]
    : null;
};

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

  // Allow Gemini to return percentages
  // like 10, 20, 40, 30.
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
      Math.max(
        0,
        x
      )
    );

  const safeY =
    Math.min(
      1,
      Math.max(
        0,
        y
      )
    );

  const safeWidth =
    Math.min(
      Math.max(
        0,
        1 - safeX
      ),
      Math.max(
        0,
        width
      )
    );

  const safeHeight =
    Math.min(
      Math.max(
        0,
        1 - safeY
      ),
      Math.max(
        0,
        height
      )
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

const imageBufferToBase64 = (
  buffer
) => {
  if (
    !Buffer.isBuffer(
      buffer
    )
  ) {
    throw new Error(
      "A valid page image buffer is required."
    );
  }

  if (
    buffer.length === 0
  ) {
    throw new Error(
      "The page image buffer is empty."
    );
  }

  return buffer.toString(
    "base64"
  );
};

// =====================================================
// JSON HELPERS
// =====================================================

const stripJsonFences = (
  value
) => {
  let text =
    cleanString(
      value
    );

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

const extractOuterJsonObject = (
  value
) => {
  const text =
    stripJsonFences(
      value
    );

  const start =
    text.indexOf("{");

  if (
    start === -1
  ) {
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
      escaped =
        false;

      continue;
    }

    if (
      char === "\\" &&
      inString
    ) {
      escaped =
        true;

      continue;
    }

    if (
      char === '"'
    ) {
      inString =
        !inString;

      continue;
    }

    if (
      inString
    ) {
      continue;
    }

    if (
      char === "{"
    ) {
      depth += 1;
    }

    if (
      char === "}"
    ) {
      depth -= 1;

      if (
        depth === 0
      ) {
        return text.slice(
          start,
          index + 1
        );
      }
    }
  }

  return text.slice(
    start
  );
};

const tryParseJson = (
  value
) => {
  const candidates = [];

  const raw =
    stripJsonFences(
      value
    );

  if (raw) {
    candidates.push(
      raw
    );
  }

  const outer =
    extractOuterJsonObject(
      raw
    );

  if (
    outer &&
    !candidates.includes(
      outer
    )
  ) {
    candidates.push(
      outer
    );
  }

  for (
    const candidate of
    candidates
  ) {
    try {
      return JSON.parse(
        candidate
      );
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(
    "NAVTA could not parse the Gemini JSON response."
  );
};

// =====================================================
// GEMINI RESPONSE HELPERS
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
    const output =
      safeArray(
        candidate
          ?.content
          ?.parts
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
      data
        ?.error
        ?.message
    ) ||
    fallbackMessage
  );
};

// =====================================================
// SYSTEM INSTRUCTIONS
// =====================================================

const SYSTEM_PROMPT = `
You are NAVTA AI, an educational question-paper analysis system.

Your job is to analyse a rendered question-paper page and detect every complete academic question visible on the page.

NAVTA supports:

Subjects:
- Physics
- Chemistry
- Maths
- Biology

Exams:
- NEET
- JEE
- Boards

Classes:
- Class 11
- Class 12

Difficulty:
- Easy
- Medium
- Hard

Question types:
- mcq
- short
- long


=====================================================
QUESTION DETECTION
=====================================================

1. Inspect the ENTIRE supplied page image from top to bottom.

2. Detect EVERY complete academic question visible on that page.

3. Preserve the original wording as accurately as possible.

4. Do not invent questions.

5. If a question is incomplete because it continues onto another page, mark:

drop = true

and explain why in dropReason.


=====================================================
QUESTION CLASSIFICATION
=====================================================

For every question determine:

- subject
- exam
- classLevel
- chapter
- difficulty
- questionType

Use supplied admin hints when they clearly apply.

Do not blindly follow a hint if it obviously contradicts the page.


=====================================================
MCQ RULES
=====================================================

For MCQ questions:

- Extract all visible options.

- If four options are visible, return exactly four options.

- correctAnswer must use:

0 = A
1 = B
2 = C
3 = D

- If the correct answer cannot be determined reliably, return null.

- Do NOT invent an answer.

NEET and JEE questions must use:

questionType = "mcq"


=====================================================
BOARDS QUESTIONS
=====================================================

Boards questions may be:

- mcq
- short
- long

For written Boards questions, provide when reliably possible:

- modelAnswer
- keyPoints
- maxMarks


=====================================================
EXPLANATION
=====================================================

Provide an educational explanation when it can be determined reliably.

Do not invent an explanation just to fill the field.


=====================================================
DIAGRAMS AND VISUALS
=====================================================

A visual includes:

- circuit
- graph
- geometry figure
- biological diagram
- chemistry structure
- table required to solve the question
- chart
- ray diagram
- apparatus
- coordinate graph
- labelled figure
- mathematical figure

If a question depends on a visual:

hasVisual = true

Return visualBoundingBox with normalized coordinates:

{
  "x": 0.0,
  "y": 0.0,
  "width": 0.0,
  "height": 0.0
}

All coordinates must be between 0 and 1.

The visualBoundingBox must tightly contain ONLY the required visual.

Do not include the complete page.

Do not include the whole question text unless the text is part of the required visual.

If no visual is required:

hasVisual = false
visualDescription = ""
visualBoundingBox = null


=====================================================
SOURCE PAGE
=====================================================

sourcePage must be the actual PDF page number containing the question.


=====================================================
DROP RULES
=====================================================

Only use:

drop = true

when the actual question itself is:

- incomplete
- unreadable
- genuinely uncertain
- missing essential continuation
- impossible to reconstruct safely

Do NOT drop a readable question merely because:

- classification is difficult
- explanation is missing
- correctAnswer is unknown

Make the best reliable classification.


=====================================================
OUTPUT
=====================================================

Return ONLY valid JSON.

Do not return Markdown.

Do not use code fences.

The exact top-level response structure is:

{
  "questions": []
}

Each question should follow:

{
  "question": "",
  "subject": "",
  "exam": "",
  "classLevel": "",
  "chapter": "",
  "difficulty": "",
  "questionType": "",
  "options": [],
  "correctAnswer": null,
  "explanation": "",
  "modelAnswer": "",
  "keyPoints": [],
  "maxMarks": null,
  "sourcePage": null,
  "hasVisual": false,
  "visualDescription": "",
  "visualBoundingBox": null,
  "drop": false,
  "dropReason": ""
}
`;

// =====================================================
// PAGE PROMPT
// =====================================================

const buildPagePrompt = ({
  pageNumber,
  text = "",
  hints = {},
}) => {
  const subjectHint =
    cleanString(
      hints.subject
    ) ||
    "Not provided";

  const examHint =
    cleanString(
      hints.exam
    ) ||
    "Not provided";

  const classHint =
    cleanString(
      hints.classLevel
    ) ||
    "Not provided";

  return `
Analyse this NAVTA question-paper page.

PAGE:
${pageNumber}

ADMIN HINTS:

Subject:
${subjectHint}

Preparation / Exam:
${examHint}

Class:
${classHint}

The IMAGE is the primary source.

Extracted text is only supporting context.

TEXT CONTEXT:

${String(
  text || ""
).slice(
  0,
  12000
)}

Inspect the complete page.

Return every complete question visible on this page.

For each detected question return:

question
subject
exam
classLevel
chapter
difficulty
questionType
options
correctAnswer
explanation
modelAnswer
keyPoints
maxMarks
sourcePage
hasVisual
visualDescription
visualBoundingBox
drop
dropReason

sourcePage must equal:

${pageNumber}

Return only valid JSON:

{
  "questions": []
}
`;
};

// =====================================================
// BUILD GEMINI REQUEST PARTS
// =====================================================

const buildGeminiParts = ({
  page,
  text = "",
  hints = {},
}) => {
  const pageNumber =
    Number(
      page.pageNumber
    );

  return [
    {
      text:
        SYSTEM_PROMPT +
        "\n\n" +
        buildPagePrompt({
          pageNumber,
          text:
            page.text ||
            text,
          hints,
        }),
    },

    {
      text:
        `The next image is PDF page ${pageNumber}. Inspect the complete page.`,
    },

    {
      inlineData: {
        mimeType:
          page.mimeType ||
          "image/png",

        data:
          imageBufferToBase64(
            page.buffer
          ),
      },
    },
  ];
};

// =====================================================
// NORMALIZE QUESTION
// =====================================================

const normalizeDetectedQuestion = ({
  item,
  pageNumber,
}) => {
  const options =
    safeArray(
      item?.options
    )
      .map(
        (option) =>
          cleanString(
            option
          )
      )
      .filter(Boolean);

  const keyPoints =
    safeArray(
      item?.keyPoints
    )
      .map(
        (point) =>
          cleanString(
            point
          )
      )
      .filter(Boolean);

  let maxMarks =
    null;

  if (
    item?.maxMarks !==
      null &&
    item?.maxMarks !==
      undefined
  ) {
    const numeric =
      Number(
        item.maxMarks
      );

    if (
      Number.isFinite(
        numeric
      )
    ) {
      maxMarks =
        numeric;
    }
  }

  return {
    question:
      cleanString(
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

    explanation:
      cleanString(
        item?.explanation
      ),

    modelAnswer:
      cleanString(
        item?.modelAnswer
      ),

    keyPoints,

    maxMarks,

    sourcePage:
      Number(
        item?.sourcePage
      ) ||
      Number(
        pageNumber
      ),

    hasVisual:
      Boolean(
        item?.hasVisual
      ),

    visualDescription:
      cleanString(
        item?.visualDescription
      ),

    visualBoundingBox:
      normalizeBoundingBox(
        item
          ?.visualBoundingBox
      ),

    drop:
      Boolean(
        item?.drop
      ),

    dropReason:
      cleanString(
        item?.dropReason
      ),
  };
};

// =====================================================
// SEND GEMINI REQUEST
// =====================================================

const sendGeminiPageRequest =
  async ({
    page,
    text = "",
    hints = {},
  }) => {
    if (
      !GEMINI_API_KEY
    ) {
      throw new Error(
        "GEMINI_API_KEY is not configured on the NAVTA backend."
      );
    }

    if (
      !page ||
      !Buffer.isBuffer(
        page.buffer
      )
    ) {
      throw new Error(
        "NAVTA AI received an invalid rendered PDF page."
      );
    }

    const pageNumber =
      Number(
        page.pageNumber
      );

    const parts =
      buildGeminiParts({
        page,
        text,
        hints,
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

      const rawHttp =
        await response.text();

      let data =
        {};

      try {
        data =
          rawHttp
            ? JSON.parse(
                rawHttp
              )
            : {};
      } catch {
        throw new Error(
          `Gemini returned an invalid HTTP response for PDF page ${pageNumber}.`
        );
      }

      if (
        !response.ok
      ) {
        throw new Error(
          `Gemini could not analyse PDF page ${pageNumber}. ${extractGeminiError(
            data,
            `HTTP ${response.status}`
          )}`
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
          `Gemini returned no question data for PDF page ${pageNumber}.`
        );
      }

      return modelText;

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
// ANALYSE ONE PAGE
// =====================================================

const analyseNavtaPage =
  async ({
    page,
    pageNumber,
    imageBuffer,
    mimeType =
      "image/png",
    text = "",
    hints = {},
  } = {}) => {
    const renderedPage =
      page || {
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

    const rawResponse =
      await sendGeminiPageRequest({
        page:
          renderedPage,

        text:
          text ||
          renderedPage.text ||
          "",

        hints,
      });

    const parsed =
      tryParseJson(
        rawResponse
      );

    const rawQuestions =
      Array.isArray(
        parsed
      )
        ? parsed
        : safeArray(
            parsed
              ?.questions
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

            pageNumber:
              renderedPage
                .pageNumber,
          })
      );
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
    const key =
      `${
        Number(
          question
            ?.sourcePage
        ) || 0
      }|${
        cleanString(
          question
            ?.question
        )
          .replace(
            /\s+/g,
            " "
          )
          .toLowerCase()
      }`;

    if (
      seen.has(
        key
      )
    ) {
      continue;
    }

    seen.add(
      key
    );

    output.push(
      question
    );
  }

  return output;
};

// =====================================================
// ANALYSE ALL RENDERED PDF PAGES
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
      "NAVTA GEMINI QUESTION SEPARATION STARTING"
    );

    console.log(
      `Model: ${GEMINI_MODEL}`
    );

    console.log(
      `Pages: ${validPages.length}`
    );

    console.log(
      "====================================================="
    );

    const allQuestions =
      [];

    for (
      const page of
      validPages
    ) {
      console.log(
        `NAVTA analysing PDF page ${page.pageNumber}...`
      );

      const pageQuestions =
        await analyseNavtaPage({
          page,

          text:
            cleanString(
              page.text
            ) ||
            text,

          hints,
        });

      allQuestions.push(
        ...pageQuestions.map(
          (question) => ({
            ...question,

            sourcePage:
              page.pageNumber,
          })
        )
      );

      console.log(
        `NAVTA page ${page.pageNumber}: detected ${pageQuestions.length} question(s).`
      );
    }

    return removeExactDuplicates(
      allQuestions
    );
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

    } catch (error) {
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
            : error
                ?.message ||
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

  // Compatibility aliases in case any older
  // controller still imports these names.
  checkNavtaAIGatewayConnection:
    checkGeminiConnection,

  checkOllamaConnection:
    checkGeminiConnection,
};
