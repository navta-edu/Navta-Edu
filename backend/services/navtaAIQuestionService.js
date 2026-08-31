// =====================================================
// NAVTA AI QUESTION SERVICE
// Google Gemini Vision API
// =====================================================
//
// Production flow:
//
// Hostinger backend
// -> Google Gemini API
// -> Gemini Vision model
//
// PDF pages are rendered elsewhere in NAVTA.
// This service receives those rendered page images,
// sends them to Gemini, extracts structured questions,
// and returns them to the existing NAVTA import pipeline.
//
// IMPORTANT:
// GEMINI_API_KEY must exist only in backend environment
// variables. Never expose it in frontend code.
// =====================================================


// =====================================================
// CONFIG
// =====================================================

const GEMINI_API_KEY =
  String(
    process.env.GEMINI_API_KEY || ""
  ).trim();

const GEMINI_MODEL =
  String(
    process.env.GEMINI_MODEL ||
      "gemini-2.5-flash"
  ).trim();

const GEMINI_API_BASE =
  String(
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

// Number of rendered PDF pages sent in one Gemini request.
//
// Start conservatively.
// This reduces API request count compared with
// one-request-per-page processing while avoiding
// extremely large multimodal requests.
const NAVTA_AI_BATCH_SIZE =
  Math.max(
    1,
    Math.min(
      4,
      Number(
        process.env.NAVTA_AI_BATCH_SIZE ||
          3
      ) || 3
    )
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

Your job is to analyse rendered question-paper PAGE IMAGES and detect every complete academic question visible on those pages.

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

1. The PAGE IMAGES are the primary source.

2. Preserve the original question wording as accurately as possible.

3. Detect every COMPLETE academic question visible on the supplied pages.

4. Do not invent questions.

5. A question may continue from one supplied page to the next supplied page.

If adjacent supplied pages clearly contain different parts of the same question, combine them into one complete question.

If a question cannot be understood completely because the required continuation is not present in the supplied pages, mark it for dropping.

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

10. If administrator hints are supplied and they clearly match the pages, use them.

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

Return visualBoundingBox using NORMALIZED coordinates for the page identified by sourcePage:

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

18. sourcePage is REQUIRED.

sourcePage must be the actual PDF page number containing the question.

If a question spans multiple supplied pages, use the page where the question begins.

If a visual belongs to the question, sourcePage must identify the page containing the visual because NAVTA uses that page to crop the diagram.

19. Return ONLY valid JSON.

20. Do not return Markdown.

21. Do not use code fences.

The exact top-level response structure is:

{
  "questions": []
}
`;


// =====================================================
// BATCH PROMPT
// =====================================================

const buildBatchPrompt = ({
  pages = [],
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

  const pageNumbers =
    pages
      .map(
        (page) =>
          Number(
            page?.pageNumber
          )
      )
      .filter(
        Boolean
      );

  const pageContext =
    pages
      .map(
        (page) => {
          const pageNumber =
            Number(
              page?.pageNumber
            );

          const pageText =
            cleanString(
              page?.text
            );

          return `
PAGE ${pageNumber} TEXT CONTEXT:

${pageText.slice(
  0,
  5000
)}
`;
        }
      )
      .join(
        "\n"
      );

  return `
Analyse this NAVTA question-paper page batch.

SUPPLIED PDF PAGE NUMBERS:

${pageNumbers.join(", ")}

ADMIN HINTS:

Subject:
${subjectHint}

Preparation / Exam:
${examHint}

Class:
${classHint}

The PAGE IMAGES supplied with this request are the PRIMARY SOURCE.

Each image is preceded by a text label identifying its PDF page number.

Extracted document text is SUPPORTING CONTEXT only.

Do not extract questions from supporting text unless they are actually visible on one or more supplied page images.

${pageContext}

GENERAL DOCUMENT TEXT CONTEXT:

${String(
  text || ""
).slice(
  0,
  6000
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
  "sourcePage": null,
  "drop": false,
  "dropReason": ""
}

IMPORTANT:

sourcePage must be one of these supplied PDF page numbers:

${pageNumbers.join(", ")}

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
  fallbackPageNumber,
  validPageNumbers = [],
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

  const requestedSourcePage =
    Number(
      item?.sourcePage
    );

  const safeValidPages =
    safeArray(
      validPageNumbers
    )
      .map(
        Number
      )
      .filter(
        (value) =>
          Number.isInteger(
            value
          ) &&
          value > 0
      );

  let sourcePage =
    Number(
      fallbackPageNumber
    ) ||
    safeValidPages[0] ||
    null;

  if (
    Number.isInteger(
      requestedSourcePage
    ) &&
    safeValidPages.includes(
      requestedSourcePage
    )
  ) {
    sourcePage =
      requestedSourcePage;
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

    sourcePage,
  };
};


// =====================================================
// GEMINI CONFIG CHECK
// =====================================================

const checkGeminiConnection =
  async () => {
    if (
      !GEMINI_API_KEY
    ) {
      throw new Error(
        "GEMINI_API_KEY is not configured."
      );
    }

    if (
      !GEMINI_MODEL
    ) {
      throw new Error(
        "GEMINI_MODEL is not configured."
      );
    }

    return true;
  };


// =====================================================
// EXTRACT GEMINI ERROR
// =====================================================

const extractGeminiError = (
  data,
  fallbackMessage
) => {
  const message =
    cleanString(
      data?.error?.message
    );

  if (
    message
  ) {
    return message;
  }

  return fallbackMessage;
};


// =====================================================
// EXTRACT GEMINI RESPONSE TEXT
// =====================================================

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
        .filter(
          Boolean
        )
        .join(
          "\n"
        )
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
// GEMINI REQUEST
// =====================================================

const requestGeminiAnalysis =
  async ({
    pages = [],
    text = "",
    hints = {},
  }) => {
    await checkGeminiConnection();

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
      pages.filter(
        (page) =>
          Number(
            page?.pageNumber
          ) > 0 &&
          Buffer.isBuffer(
            page?.buffer
          ) &&
          page.buffer.length >
            0
      );

    if (
      validPages.length ===
        0
    ) {
      return [];
    }

    const validPageNumbers =
      validPages.map(
        (page) =>
          Number(
            page.pageNumber
          )
      );

    const prompt =
      `${SYSTEM_PROMPT}\n\n${buildBatchPrompt({
        pages:
          validPages,
        text,
        hints,
      })}`;

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
      const pageNumber =
        Number(
          page.pageNumber
        );

      const mimeType =
        cleanString(
          page?.mimeType
        ) ||
        "image/png";

      parts.push({
        text:
          `The next image is PDF PAGE ${pageNumber}.`,
      });

      parts.push({
        inline_data: {
          mime_type:
            mimeType,

          data:
            imageBufferToBase64(
              page.buffer
            ),
        },
      });
    }

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
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

      response =
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
                    0.1,

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
        "NAVTA GEMINI RAW RESPONSE:",
        responseText
      );

      throw new Error(
        `Gemini returned an invalid API response while analysing pages ${validPageNumbers.join(
          ", "
        )}.`
      );
    }

    if (
      !response.ok
    ) {
      const apiMessage =
        extractGeminiError(
          data,
          `Gemini request failed with status ${response.status}.`
        );

      console.error(
        "NAVTA GEMINI API ERROR:",
        apiMessage
      );

      throw new Error(
        apiMessage
      );
    }

    const outputText =
      extractGeminiText(
        data
      );

    if (
      !outputText
    ) {
      const finishReason =
        cleanString(
          data?.candidates?.[0]
            ?.finishReason
        );

      const blockReason =
        cleanString(
          data?.promptFeedback
            ?.blockReason
        );

      if (
        blockReason
      ) {
        throw new Error(
          `Gemini blocked the PDF analysis request: ${blockReason}.`
        );
      }

      if (
        finishReason
      ) {
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
        "NAVTA GEMINI JSON PARSE ERROR:",
        cleanedOutput
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

    return questions.map(
      (item) =>
        normalizeDetectedQuestion({
          item,

          fallbackPageNumber,

          validPageNumbers,
        })
    );
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

    console.log(
      `NAVTA AI analysing PDF page ${pageNumber} with Gemini ${GEMINI_MODEL}...`
    );

    return requestGeminiAnalysis({
      pages: [
        {
          pageNumber:
            Number(
              pageNumber
            ),

          buffer:
            imageBuffer,

          mimeType,

          text,
        },
      ],

      text,

      hints,
    });
  };


// =====================================================
// SPLIT INTO BATCHES
// =====================================================

const createPageBatches = (
  pages = [],
  batchSize =
    NAVTA_AI_BATCH_SIZE
) => {
  const batches = [];

  for (
    let index = 0;
    index < pages.length;
    index += batchSize
  ) {
    batches.push(
      pages.slice(
        index,
        index +
          batchSize
      )
    );
  }

  return batches;
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

    await checkGeminiConnection();

    const validPages =
      pages.filter(
        (page) => {
          const pageNumber =
            Number(
              page?.pageNumber
            );

          return (
            pageNumber >
              0 &&
            Buffer.isBuffer(
              page?.buffer
            ) &&
            page.buffer.length >
              0
          );
        }
      );

    if (
      validPages.length ===
        0
    ) {
      return [];
    }

    const batches =
      createPageBatches(
        validPages,
        NAVTA_AI_BATCH_SIZE
      );

    const questions = [];

    console.log(
      `NAVTA Gemini PDF analysis starting: ${validPages.length} page(s), ${batches.length} request batch(es), batch size ${NAVTA_AI_BATCH_SIZE}.`
    );

    for (
      let batchIndex = 0;
      batchIndex <
        batches.length;
      batchIndex += 1
    ) {
      const batch =
        batches[
          batchIndex
        ];

      const pageNumbers =
        batch.map(
          (page) =>
            Number(
              page.pageNumber
            )
        );

      console.log(
        `NAVTA Gemini analysing batch ${batchIndex + 1}/${batches.length}: PDF page(s) ${pageNumbers.join(
          ", "
        )}...`
      );

      const detected =
        await requestGeminiAnalysis({
          pages:
            batch,

          text,

          hints,
        });

      questions.push(
        ...detected
      );
    }

    console.log(
      `NAVTA Gemini PDF analysis completed. Detected ${questions.length} question(s).`
    );

    return questions;
  };


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  analyseNavtaPage,
  analyseRenderedPages,
  checkGeminiConnection,

  // Backward-compatible exports.
  //
  // These aliases prevent older NAVTA code from
  // crashing if it still imports one of the old
  // connection-check function names.
  checkNavtaAIGatewayConnection:
    checkGeminiConnection,

  checkOllamaConnection:
    checkGeminiConnection,
};
