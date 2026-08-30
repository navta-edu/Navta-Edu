// =====================================================
// NAVTA AI QUESTION SERVICE
// Ollama + Qwen2.5-VL
// =====================================================
//
// Local AI model:
// qwen2.5vl:3b
//
// Default Ollama server:
// http://127.0.0.1:11434
//
// No Gemini API is used in this file.
// =====================================================

// =====================================================
// CONFIG
// =====================================================

const OLLAMA_BASE_URL =
  String(
    process.env.OLLAMA_BASE_URL ||
      "http://127.0.0.1:11434"
  )
    .trim()
    .replace(/\/+$/, "");

const OLLAMA_MODEL =
  String(
    process.env.OLLAMA_MODEL ||
      "qwen2.5vl:3b"
  ).trim();

const OLLAMA_TIMEOUT_MS =
  Math.max(
    30000,
    Number(
      process.env.OLLAMA_TIMEOUT_MS ||
        180000
    ) || 180000
  );

// =====================================================
// HELPERS
// =====================================================

const cleanString = (
  value = ""
) => {
  return String(
    value || ""
  ).trim();
};

const safeArray = (
  value
) => {
  return Array.isArray(
    value
  )
    ? value
    : [];
};

const normalizeQuestionType = (
  value
) => {
  const type =
    cleanString(
      value
    ).toLowerCase();

  if (
    type === "short"
  ) {
    return "short";
  }

  if (
    type === "long"
  ) {
    return "long";
  }

  if (
    type === "mcq"
  ) {
    return "mcq";
  }

  return "";
};

const normalizeDifficulty = (
  value
) => {
  const difficulty =
    cleanString(
      value
    ).toLowerCase();

  if (
    difficulty === "easy"
  ) {
    return "Easy";
  }

  if (
    difficulty === "medium"
  ) {
    return "Medium";
  }

  if (
    difficulty === "hard"
  ) {
    return "Hard";
  }

  return "";
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
// SYSTEM INSTRUCTIONS
// =====================================================

const SYSTEM_PROMPT = `
You are NAVTA AI, an educational question-paper analysis system.

Your job is to analyse a rendered question-paper PAGE IMAGE and detect every complete academic question visible on that page.

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

IMPORTANT RULES:

1. The PAGE IMAGE is the primary source.

2. Preserve the original question wording as accurately as possible.

3. Detect every COMPLETE academic question visible on the supplied page.

4. Do not invent questions.

5. If a question starts on another page or continues onto another page and cannot be understood completely, mark it for dropping.

6. For MCQ questions:

- Return exactly four options when four options are visible.

- Preserve mathematical expressions as readable text.

- correctAnswer must be:

0 = A
1 = B
2 = C
3 = D

- If the correct answer cannot be determined reliably, return null.

7. NEET and JEE questions must use questionType "mcq".

8. Boards questions may use:

- mcq
- short
- long

9. Determine as accurately as possible:

- subject
- exam
- classLevel
- chapter
- difficulty
- questionType

10. If administrator hints are supplied and they clearly match the page, use them.

11. Do not blindly use hints if they clearly contradict the page.

12. Provide an educational explanation when it can be determined reliably.

13. For Boards written questions provide when possible:

- modelAnswer
- keyPoints
- maxMarks

14. DIAGRAMS AND VISUALS ARE VERY IMPORTANT.

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

hasVisual must be true.

Return visualBoundingBox using NORMALIZED page coordinates:

{
  "x": 0.0,
  "y": 0.0,
  "width": 0.0,
  "height": 0.0
}

Each coordinate must be between 0 and 1.

x is the horizontal starting position from the LEFT edge.

y is the vertical starting position from the TOP edge.

width is the visual width divided by total page width.

height is the visual height divided by total page height.

The visualBoundingBox must contain the REQUIRED diagram, graph, circuit, figure, table or other visual as tightly as practical.

Do not include the complete page.

Do not include the entire question text unless that text is part of the required figure.

15. If no visual is required:

hasVisual = false
visualDescription = ""
visualBoundingBox = null

16. If a question is incomplete, unreadable, uncertain, or cannot safely be classified:

drop = true

and provide a clear dropReason.

17. Never make up an answer simply to make a question valid.

18. Return ONLY valid JSON.

19. Do not return Markdown.

20. Do not use code fences.

The exact top-level response structure is:

{
  "questions": []
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

PAGE NUMBER:

${pageNumber}

ADMIN HINTS:

Subject:
${subjectHint}

Preparation / Exam:
${examHint}

Class:
${classHint}

The PAGE IMAGE supplied with this message is the PRIMARY SOURCE.

Extracted document text below is SUPPORTING CONTEXT only.

Do not extract questions from the text context unless they are actually visible on the supplied page image.

TEXT CONTEXT:

${String(
  text || ""
).slice(
  0,
  12000
)}

For EVERY detected question return an object using this exact structure:

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
  "hasVisual": false,
  "visualDescription": "",
  "visualBoundingBox": null,
  "drop": false,
  "dropReason": ""
}

Return:

{
  "questions": [...]
}

Return JSON only.
`;
};

// =====================================================
// CLEAN MODEL JSON
// =====================================================

const cleanJsonResponse = (
  value
) => {
  let text =
    cleanString(
      value
    );

  if (
    text.startsWith(
      "```"
    )
  ) {
    text =
      text.replace(
        /^```(?:json)?\s*/i,
        ""
      );

    text =
      text.replace(
        /\s*```$/,
        ""
      );
  }

  return text.trim();
};

// =====================================================
// NORMALIZE VISUAL BOX
// =====================================================

const normalizeVisualBoundingBox = (
  value
) => {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return null;
  }

  const x =
    Number(
      value.x
    );

  const y =
    Number(
      value.y
    );

  const width =
    Number(
      value.width
    );

  const height =
    Number(
      value.height
    );

  if (
    !Number.isFinite(
      x
    ) ||
    !Number.isFinite(
      y
    ) ||
    !Number.isFinite(
      width
    ) ||
    !Number.isFinite(
      height
    )
  ) {
    return null;
  }

  if (
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
        1 -
          safeX
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
        1 -
          safeY
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
    x:
      safeX,

    y:
      safeY,

    width:
      safeWidth,

    height:
      safeHeight,
  };
};

// =====================================================
// NORMALIZE AI QUESTION
// =====================================================

const normalizeDetectedQuestion = ({
  item,
  pageNumber,
}) => {
  const questionType =
    normalizeQuestionType(
      item?.questionType
    );

  let correctAnswer =
    null;

  if (
    item?.correctAnswer !==
      null &&
    item?.correctAnswer !==
      undefined &&
    item?.correctAnswer !==
      ""
  ) {
    const numericAnswer =
      Number(
        item.correctAnswer
      );

    if (
      Number.isInteger(
        numericAnswer
      ) &&
      numericAnswer >= 0 &&
      numericAnswer <= 3
    ) {
      correctAnswer =
        numericAnswer;
    }
  }

  let maxMarks =
    null;

  if (
    item?.maxMarks !==
      null &&
    item?.maxMarks !==
      undefined &&
    item?.maxMarks !==
      ""
  ) {
    const numericMarks =
      Number(
        item.maxMarks
      );

    if (
      Number.isFinite(
        numericMarks
      ) &&
      numericMarks > 0
    ) {
      maxMarks =
        numericMarks;
    }
  }

  const visualBoundingBox =
    normalizeVisualBoundingBox(
      item?.visualBoundingBox
    );

  const requestedVisual =
    Boolean(
      item?.hasVisual
    );

  const hasVisual =
    requestedVisual &&
    Boolean(
      visualBoundingBox
    );

  const drop =
    Boolean(
      item?.drop
    );

  let dropReason =
    cleanString(
      item?.dropReason
    );

  if (
    requestedVisual &&
    !visualBoundingBox &&
    !dropReason
  ) {
    dropReason =
      "A required visual was detected but its bounding box could not be identified.";
  }

  return {
    questionNumber:
      cleanString(
        item?.questionNumber
      ),

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

    questionType,

    options:
      safeArray(
        item?.options
      )
        .map(
          cleanString
        )
        .filter(
          Boolean
        ),

    correctAnswer,

    modelAnswer:
      cleanString(
        item?.modelAnswer
      ),

    keyPoints:
      safeArray(
        item?.keyPoints
      )
        .map(
          cleanString
        )
        .filter(
          Boolean
        ),

    maxMarks,

    explanation:
      cleanString(
        item?.explanation
      ),

    hasVisual,

    visualDescription:
      cleanString(
        item?.visualDescription
      ),

    visualBoundingBox,

    drop:
      drop ||
      (
        requestedVisual &&
        !visualBoundingBox
      ),

    dropReason,

    sourcePage:
      Number(
        pageNumber
      ),
  };
};

// =====================================================
// CHECK OLLAMA
// =====================================================

const checkOllamaConnection =
  async () => {
    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        10000
      );

    try {
      const response =
        await fetch(
          `${OLLAMA_BASE_URL}/api/tags`,
          {
            method:
              "GET",

            signal:
              controller.signal,
          }
        );

      if (
        !response.ok
      ) {
        throw new Error(
          `Ollama returned status ${response.status}.`
        );
      }

      const data =
        await response.json();

      const models =
        safeArray(
          data?.models
        );

      const installed =
        models.some(
          (model) => {
            const name =
              cleanString(
                model?.name
              );

            const modelName =
              cleanString(
                model?.model
              );

            return (
              name ===
                OLLAMA_MODEL ||
              modelName ===
                OLLAMA_MODEL ||
              name.startsWith(
                `${OLLAMA_MODEL}:`
              )
            );
          }
        );

      if (
        models.length > 0 &&
        !installed
      ) {
        console.warn(
          `NAVTA AI WARNING: Ollama is running, but ${OLLAMA_MODEL} was not found in /api/tags.`
        );
      }

      return true;
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        throw new Error(
          `Ollama connection timed out at ${OLLAMA_BASE_URL}.`
        );
      }

      throw new Error(
        `NAVTA could not connect to Ollama at ${OLLAMA_BASE_URL}. ${error.message}`
      );
    } finally {
      clearTimeout(
        timeout
      );
    }
  };

// =====================================================
// EXTRACT OLLAMA RESPONSE TEXT
// =====================================================

const extractOllamaText = (
  data
) => {
  if (
    typeof data?.message
      ?.content ===
      "string"
  ) {
    return data.message
      .content
      .trim();
  }

  if (
    typeof data?.response ===
      "string"
  ) {
    return data.response
      .trim();
  }

  return "";
};

// =====================================================
// ANALYSE ONE RENDERED PAGE
// =====================================================

const analyseNavtaPage =
  async ({
    pageNumber,
    imageBuffer,
    mimeType =
      "image/png",
    text = "",
    hints = {},
  }) => {
    if (
      !Buffer.isBuffer(
        imageBuffer
      ) ||
      imageBuffer.length ===
        0
    ) {
      throw new Error(
        `Rendered image for page ${pageNumber} is missing.`
      );
    }

    const imageBase64 =
      imageBufferToBase64(
        imageBuffer
      );

    const prompt = `
${SYSTEM_PROMPT}

${buildPagePrompt({
  pageNumber,
  text,
  hints,
})}
`;

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        OLLAMA_TIMEOUT_MS
      );

    let response;

    try {
      response =
        await fetch(
          `${OLLAMA_BASE_URL}/api/chat`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            signal:
              controller.signal,

            body:
              JSON.stringify({
                model:
                  OLLAMA_MODEL,

                stream:
                  false,

                format:
                  "json",

                messages: [
                  {
                    role:
                      "user",

                    content:
                      prompt,

                    images: [
                      imageBase64,
                    ],
                  },
                ],

                options: {
                  temperature:
                    0.1,
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
          `NAVTA AI timed out while analysing page ${pageNumber}.`
        );
      }

      throw new Error(
        `NAVTA could not connect to Ollama. ${error.message}`
      );
    } finally {
      clearTimeout(
        timeout
      );
    }

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
    } catch (error) {
      console.error(
        "NAVTA OLLAMA RAW RESPONSE:",
        responseText
      );

      throw new Error(
        `Ollama returned an invalid API response for page ${pageNumber}.`
      );
    }

    if (
      !response.ok
    ) {
      const apiMessage =
        data?.error ||
        data?.message ||
        `Ollama request failed with status ${response.status}.`;

      throw new Error(
        cleanString(
          apiMessage
        )
      );
    }

    const outputText =
      extractOllamaText(
        data
      );

    if (
      !outputText
    ) {
      throw new Error(
        `Ollama returned no question data for page ${pageNumber}.`
      );
    }

    const cleanedOutput =
      cleanJsonResponse(
        outputText
      );

    let parsed;

    try {
      parsed =
        JSON.parse(
          cleanedOutput
        );
    } catch (error) {
      console.error(
        "NAVTA OLLAMA JSON PARSE ERROR:",
        cleanedOutput
      );

      throw new Error(
        `NAVTA AI could not understand Ollama's JSON response for page ${pageNumber}.`
      );
    }

    const questions =
      safeArray(
        parsed?.questions
      );

    return questions.map(
      (item) =>
        normalizeDetectedQuestion({
          item,
          pageNumber,
        })
    );
  };

// =====================================================
// ANALYSE MULTIPLE RENDERED PAGES
// =====================================================

const analyseRenderedPages =
  async ({
    pages = [],
    text = "",
    hints = {},
  }) => {
    if (
      !Array.isArray(
        pages
      ) ||
      pages.length ===
        0
    ) {
      return [];
    }

    // Check once before starting a potentially
    // expensive multi-page import.
    await checkOllamaConnection();

    const questions = [];

    for (
      const page of
      pages
    ) {
      const pageNumber =
        Number(
          page?.pageNumber
        );

      if (
        !pageNumber ||
        !Buffer.isBuffer(
          page?.buffer
        )
      ) {
        continue;
      }

      console.log(
        `NAVTA Ollama analysing PDF page ${pageNumber} with ${OLLAMA_MODEL}...`
      );

      const detected =
        await analyseNavtaPage({
          pageNumber,

          imageBuffer:
            page.buffer,

          mimeType:
            page.mimeType ||
            "image/png",

          text:
            page.text ||
            text,

          hints,
        });

      questions.push(
        ...detected
      );
    }

    return questions;
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  analyseNavtaPage,
  analyseRenderedPages,
  checkOllamaConnection,
};
