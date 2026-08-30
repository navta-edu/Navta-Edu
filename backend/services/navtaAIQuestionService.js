// =====================================================
// NAVTA AI QUESTION SERVICE
// Google AI Studio / Gemini
// =====================================================

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";

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
    cleanString(value).toLowerCase();

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
    cleanString(value).toLowerCase();

  if (difficulty === "easy") {
    return "Easy";
  }

  if (difficulty === "hard") {
    return "Hard";
  }

  return "Medium";
};

const imageBufferToBase64 = (
  buffer
) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      "A valid page image buffer is required."
    );
  }

  return buffer.toString("base64");
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

IMPORTANT RULES:

1. Preserve the original question wording as accurately as possible.

2. Detect every complete question visible on the supplied page.

3. For MCQ questions:
   - Return exactly four options whenever four options are visible.
   - correctAnswer must be an integer:
     0 = A
     1 = B
     2 = C
     3 = D
   - If the correct answer cannot be determined reliably, return null.

4. NEET and JEE questions must be MCQ.

5. Boards questions may be:
   - mcq
   - short
   - long

6. Determine:
   - subject
   - exam
   - classLevel
   - chapter
   - difficulty
   - questionType

7. Provide an educational explanation when it can be determined reliably.

8. For Boards written questions, provide:
   - modelAnswer
   - keyPoints
   - maxMarks

9. DIAGRAMS AND VISUALS ARE VERY IMPORTANT.

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

If the question depends on a visual:

hasVisual must be true.

Return visualBoundingBox using NORMALIZED page coordinates:

{
  "x": 0.0 to 1.0,
  "y": 0.0 to 1.0,
  "width": 0.0 to 1.0,
  "height": 0.0 to 1.0
}

The bounding box should contain ONLY the required visual as tightly as practical.

Do NOT include the entire question text inside the visual box unless it is actually part of the diagram.

10. If no visual exists:

hasVisual = false
visualDescription = ""
visualBoundingBox = null

11. Do not invent questions that are not visible.

12. If a question is incomplete, unreadable, or cannot be classified safely:

drop = true

and explain why in dropReason.

13. If the supplied subject/exam/class hints are clearly applicable, use them.

14. Return ONLY valid JSON.

Do not return markdown.
Do not use code fences.

The response must have this exact top-level structure:

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
    ) || "Not provided";

  const examHint =
    cleanString(
      hints.exam
    ) || "Not provided";

  const classHint =
    cleanString(
      hints.classLevel
    ) || "Not provided";

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

Extracted document text is included only as supporting context.
The IMAGE is the primary source for determining what appears on this page.

TEXT CONTEXT:

${String(text || "").slice(0, 12000)}

For every detected question return:

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

Remember:

visualBoundingBox uses normalized coordinates from 0 to 1.

Return JSON only:

{
  "questions": [...]
}
`;
};

// =====================================================
// CLEAN GEMINI JSON
// =====================================================

const cleanJsonResponse = (
  value
) => {
  let text =
    cleanString(value);

  if (text.startsWith("```")) {
    text = text.replace(
      /^```(?:json)?\s*/i,
      ""
    );

    text = text.replace(
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
    typeof value !== "object"
  ) {
    return null;
  }

  const x = Number(value.x);
  const y = Number(value.y);
  const width =
    Number(value.width);
  const height =
    Number(value.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
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
      Math.max(0, x)
    );

  const safeY =
    Math.min(
      1,
      Math.max(0, y)
    );

  return {
    x: safeX,
    y: safeY,

    width:
      Math.min(
        Math.max(
          0,
          1 - safeX
        ),
        Math.max(
          0,
          width
        )
      ),

    height:
      Math.min(
        Math.max(
          0,
          1 - safeY
        ),
        Math.max(
          0,
          height
        )
      ),
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

  let correctAnswer = null;

  if (
    item?.correctAnswer !== null &&
    item?.correctAnswer !== undefined &&
    item?.correctAnswer !== ""
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

  let maxMarks = null;

  if (
    item?.maxMarks !== null &&
    item?.maxMarks !== undefined &&
    item?.maxMarks !== ""
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

  const hasVisual =
    Boolean(
      item?.hasVisual
    ) &&
    Boolean(
      visualBoundingBox
    );

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
        .map(cleanString)
        .filter(Boolean),

    correctAnswer,

    modelAnswer:
      cleanString(
        item?.modelAnswer
      ),

    keyPoints:
      safeArray(
        item?.keyPoints
      )
        .map(cleanString)
        .filter(Boolean),

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
      Boolean(
        item?.drop
      ),

    dropReason:
      cleanString(
        item?.dropReason
      ),

    sourcePage:
      Number(pageNumber),
  };
};// =====================================================
// EXTRACT GEMINI TEXT
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

    for (
      const part of
      parts
    ) {
      if (
        typeof part?.text ===
          "string" &&
        part.text.trim()
      ) {
        return part.text.trim();
      }
    }
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
    if (!GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is not configured on the server."
      );
    }

    if (
      !Buffer.isBuffer(
        imageBuffer
      ) ||
      imageBuffer.length === 0
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

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
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
          },

          body:
            JSON.stringify({
              contents: [
                {
                  role:
                    "user",

                  parts: [
                    {
                      text:
                        prompt,
                    },

                    {
                      inlineData: {
                        mimeType,
                        data:
                          imageBase64,
                      },
                    },
                  ],
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

    const responseText =
      await response.text();

    let data;

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
        `Gemini returned an invalid API response for page ${pageNumber}.`
      );
    }

    if (!response.ok) {
      const apiMessage =
        data?.error?.message ||
        `Gemini request failed with status ${response.status}.`;

      throw new Error(
        apiMessage
      );
    }

    const outputText =
      extractGeminiText(
        data
      );

    if (!outputText) {
      const blockReason =
        data?.promptFeedback
          ?.blockReason;

      if (blockReason) {
        throw new Error(
          `Gemini could not analyse page ${pageNumber}. Reason: ${blockReason}`
        );
      }

      throw new Error(
        `Gemini returned no question data for page ${pageNumber}.`
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
        `NAVTA AI could not understand Gemini's JSON response for page ${pageNumber}.`
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
      !Array.isArray(pages) ||
      pages.length === 0
    ) {
      return [];
    }

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
        `NAVTA Gemini analysing PDF page ${pageNumber}...`
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
};
