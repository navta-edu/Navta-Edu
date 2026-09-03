// =====================================================
// NAVTA AI QUESTION SERVICE
// Gemini Vision - Screenshot First
// =====================================================
//
// FINAL SCREENSHOT-FIRST FLOW:
//
// PDF page 1
//   -> Gemini Vision
//   -> detect every question
//   -> return questionBoundingBox for each
//
// PDF page 2
//   -> Gemini Vision
//   -> detect every question
//   -> return questionBoundingBox for each
//
// Continues sequentially until final PDF page.
//
// IMPORTANT:
// Bounding boxes are page-local normalized coordinates:
//
// x      = left / page width
// y      = top / page height
// width  = crop width / page width
// height = crop height / page height
//
// =====================================================


// =====================================================
// CONFIGURATION
// =====================================================

const GEMINI_API_KEY =
  String(
    process.env.GEMINI_API_KEY || ""
  ).trim();


const GEMINI_MODEL =
  String(
    process.env.GEMINI_MODEL ||
      "gemini-3.5-flash-lite"
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


// =====================================================
// HELPERS
// =====================================================

const cleanString = (
  value = ""
) => {
  return String(
    value ?? ""
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


// =====================================================
// NORMALIZE ACADEMIC CONTENT
// =====================================================

const normalizeAcademicContent = (
  value = ""
) => {
  let text =
    cleanString(
      value
    );


  if (!text) {
    return "";
  }


  text =
    text
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


  return text;
};


// =====================================================
// NORMALIZE QUESTION TYPE
// =====================================================

const normalizeQuestionType = (
  value
) => {
  const type =
    cleanString(
      value
    ).toLowerCase();


  if (
    type === "mcq"
  ) {
    return "mcq";
  }


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


  return "";
};


// =====================================================
// NORMALIZE DIFFICULTY
// =====================================================

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


// =====================================================
// NORMALIZE CORRECT ANSWER
// =====================================================

const normalizeCorrectAnswer = (
  value
) => {
  if (
    Number.isInteger(
      value
    ) &&
    value >= 0 &&
    value <= 3
  ) {
    return value;
  }


  const text =
    cleanString(
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
    return map[
      text
    ];
  }


  return null;
};


// =====================================================
// NORMALIZE BOUNDING BOX
// =====================================================

const normalizeBoundingBox = (
  value
) => {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return null;
  }


  let x =
    Number(
      value.x
    );

  let y =
    Number(
      value.y
    );

  let width =
    Number(
      value.width
    );

  let height =
    Number(
      value.height
    );


  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return null;
  }


  // ===================================================
  // SUPPORT GEMINI RETURNING PERCENTAGES
  // ===================================================
  //
  // If Gemini accidentally returns:
  //
  // x: 12
  // y: 20
  // width: 75
  // height: 18
  //
  // interpret them as percentages.
  // ===================================================

  if (
    x > 1 ||
    y > 1 ||
    width > 1 ||
    height > 1
  ) {
    if (
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
      1 - safeX,
      Math.max(
        0,
        width
      )
    );


  const safeHeight =
    Math.min(
      1 - safeY,
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
// IMAGE -> BASE64
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
      "A valid rendered PDF page image buffer is required."
    );
  }


  return buffer.toString(
    "base64"
  );
};


// =====================================================
// GEMINI SYSTEM PROMPT
// =====================================================

const SYSTEM_PROMPT = `
You are NAVTA AI.

You analyse ONE ORIGINAL RENDERED PDF PAGE IMAGE at a time.

Your primary task is NOT merely OCR.

Your primary task is:

1. Find every academic question visible on this page.
2. Identify the exact rectangular region containing each complete question.
3. Return normalized screenshot coordinates for every question.
4. Extract hidden academic metadata for NAVTA.
5. Never invent a question or screenshot boundary.


=====================================================
SUPPORTED NAVTA CONTENT
=====================================================

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
MOST IMPORTANT RULE
=====================================================

THE ORIGINAL PAGE IMAGE IS THE PRIMARY SOURCE.

You MUST visually inspect the supplied page image.

Do not determine questionBoundingBox from extracted text.

The extracted text is supporting context only.

questionBoundingBox MUST be determined by visually locating the printed question on the supplied page image.


=====================================================
PAGE ANALYSIS
=====================================================

Scan the complete page.

Start at the top.

Continue to the bottom.

If there are two columns:

scan the complete left column
AND
scan the complete right column.

Detect EVERY readable academic question.

Do not stop after the first question.

Do not stop after the first few questions.


=====================================================
QUESTION SCREENSHOT BOUNDING BOX
=====================================================

EVERY non-dropped question MUST contain:

"questionBoundingBox": {
  "x": 0.0,
  "y": 0.0,
  "width": 0.0,
  "height": 0.0
}

Coordinates MUST be normalized from 0 to 1.

x:

horizontal position of the LEFT edge divided by total page width.

y:

vertical position of the TOP edge divided by total page height.

width:

question screenshot width divided by total page width.

height:

question screenshot height divided by total page height.


=====================================================
EXAMPLE
=====================================================

Suppose a question occupies:

10% from the left edge,

25% from the top edge,

80% of page width,

and 15% of page height.

Return:

"questionBoundingBox": {
  "x": 0.10,
  "y": 0.25,
  "width": 0.80,
  "height": 0.15
}


=====================================================
WHAT MUST BE INSIDE THE QUESTION SCREENSHOT
=====================================================

The rectangle must include:

- printed question number
- complete question statement
- all MCQ options belonging to that question
- matrices
- determinants
- equations
- graphs
- diagrams
- circuits
- tables
- chemical structures
- biological figures
- geometry figures
- ray diagrams
- charts
- apparatus
- any other visual required to understand the question


=====================================================
WHAT MUST NOT BE INSIDE THE SCREENSHOT
=====================================================

Do NOT include:

- previous question
- next question
- unrelated page instructions
- page footer
- page header when avoidable
- unrelated watermark area when avoidable


=====================================================
SAFETY MARGIN
=====================================================

Leave a small visual margin around the question.

Do not crop directly through:

- letters
- mathematical symbols
- option labels
- diagrams
- subscripts
- superscripts


=====================================================
CRITICAL BOUNDARY RULE
=====================================================

The screenshot must contain EXACTLY ONE question.

For example:

If Question 7 ends at 48% page height
and Question 8 begins at 51% page height,

Question 7's bounding box must end BEFORE Question 8 begins.


=====================================================
SOURCE PAGE
=====================================================

The caller supplies exactly one PDF page.

Every detected question on that image MUST use that supplied PDF page number as sourcePage.


=====================================================
MCQ
=====================================================

For NEET and JEE:

questionType must be "mcq".

Return four options when four printed options are visible.

correctAnswer:

0 = A
1 = B
2 = C
3 = D

If the answer cannot be reliably determined:

correctAnswer = null

Never guess.


=====================================================
BOARDS
=====================================================

Boards may contain:

mcq
short
long

For written questions return when possible:

modelAnswer
keyPoints
maxMarks


=====================================================
VISUAL QUESTIONS
=====================================================

questionBoundingBox already contains the ENTIRE printed question.

If the question contains an important visual, also return:

hasVisual = true

and when reliably possible:

visualBoundingBox

visualBoundingBox should contain only the individual diagram / graph / circuit / figure.

The student-facing screenshot still uses questionBoundingBox.


=====================================================
DROP RULE
=====================================================

Do not drop a question merely because:

- correct answer is unknown
- chapter is uncertain
- difficulty is uncertain
- explanation is unavailable

Only use drop=true when:

- question itself is unreadable
- question is incomplete
- essential continuation is on another page
- complete screenshot boundary genuinely cannot be determined

If questionBoundingBox can be visually identified, return it.


=====================================================
OUTPUT
=====================================================

Return ONLY valid JSON.

No Markdown.

No code fences.

Top-level structure:

{
  "questions": []
}

Every question must use:

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

Before returning JSON verify:

1. You visually inspected the page image.
2. You found every readable question.
3. Every non-dropped question has questionBoundingBox.
4. Every questionBoundingBox contains exactly one question.
5. No questionBoundingBox contains the next question.
6. sourcePage equals the supplied PDF page number.
`;
// =====================================================
// BUILD SINGLE-PAGE PROMPT
// =====================================================

const buildPagePrompt = ({
  page,
  text = "",
  hints = {},
}) => {
  const pageNumber =
    Number(
      page?.pageNumber
    );


  const pageText =
    cleanString(
      page?.text
    );


  const subjectHint =
    cleanString(
      hints?.subject
    ) ||
    "Not provided";


  const examHint =
    cleanString(
      hints?.exam
    ) ||
    "Not provided";


  const classHint =
    cleanString(
      hints?.classLevel
    ) ||
    "Not provided";


  return `
=====================================================
NAVTA SINGLE-PAGE VISION ANALYSIS
=====================================================

You are analysing:

PDF PAGE ${pageNumber}


=====================================================
ADMIN HINTS
=====================================================

Subject:
${subjectHint}

Preparation / Exam:
${examHint}

Class:
${classHint}


=====================================================
CRITICAL IMAGE INSTRUCTION
=====================================================

An ORIGINAL rendered image of PDF PAGE ${pageNumber} is attached to this request.

YOU MUST LOOK AT THAT IMAGE.

Do not rely only on the extracted text below.

The image determines:

- where each question begins
- where each question ends
- questionBoundingBox
- visualBoundingBox
- column layout
- option positions
- diagrams
- matrices
- determinants
- figures

The extracted text is only supporting context.


=====================================================
YOUR TASK
=====================================================

Scan the COMPLETE image of PDF PAGE ${pageNumber}.

Start from the top of the image.

Continue until the bottom.

If the page contains multiple columns:

inspect every column.

Find EVERY readable academic question.

For EACH question:

1. Preserve its printed question number when visible.

2. Extract the question text for internal NAVTA metadata.

3. Identify subject.

4. Identify exam.

5. Identify classLevel.

6. Identify chapter.

7. Identify difficulty.

8. Identify questionType.

9. Extract options when applicable.

10. Determine correctAnswer only when reliable.

11. Provide explanation when reliable.

12. MOST IMPORTANT:
    visually determine questionBoundingBox.

13. sourcePage MUST equal:

${pageNumber}


=====================================================
QUESTION BOUNDING BOX
=====================================================

questionBoundingBox must describe the complete printed
question rectangle on THIS page.

Return:

{
  "x": number,
  "y": number,
  "width": number,
  "height": number
}

Use NORMALIZED coordinates from 0 to 1.

Example:

{
  "x": 0.08,
  "y": 0.14,
  "width": 0.84,
  "height": 0.17
}

The crop must contain:

- question number
- complete question
- all options
- every required figure

Do not include the next question.

Do not include the previous question.


=====================================================
IMPORTANT: DO NOT RETURN NULL BOXES CASUALLY
=====================================================

If you can visually see the complete question on the page,
you MUST estimate its questionBoundingBox.

The coordinates do not need to be pixel-perfect.

They DO need to safely contain the complete question while
excluding adjacent questions.

Use a small margin around the question.

questionBoundingBox = null is allowed ONLY if the complete
question boundary genuinely cannot be determined from the
image.


=====================================================
PAGE TEXT SUPPORT
=====================================================

Extracted text for PDF PAGE ${pageNumber}:

${pageText.slice(
  0,
  7000
)}


=====================================================
GENERAL DOCUMENT SUPPORT
=====================================================

${String(
  text || ""
).slice(
  0,
  5000
)}


=====================================================
FINAL VERIFICATION
=====================================================

Before returning:

- Confirm you inspected the attached PAGE IMAGE.
- Confirm you scanned the complete page.
- Confirm every readable question was detected.
- Confirm every non-dropped question has questionBoundingBox.
- Confirm every questionBoundingBox contains exactly one question.
- Confirm every sourcePage equals ${pageNumber}.

Return valid JSON only.
`;
};


// =====================================================
// CLEAN GEMINI JSON RESPONSE
// =====================================================

const cleanJsonResponse = (
  value
) => {
  let text =
    cleanString(
      value
    );


  if (!text) {
    return "";
  }


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


  return text.trim();
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
        candidate
          ?.content
          ?.parts
      );


    const text =
      parts
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
        .filter(
          Boolean
        )
        .join(
          "\n"
        )
        .trim();


    if (text) {
      return text;
    }
  }


  return "";
};


// =====================================================
// EXTRACT GEMINI API ERROR
// =====================================================

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
// NORMALIZE DETECTED QUESTION
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


  const requestedVisual =
    Boolean(
      item?.hasVisual
    );


  let drop =
    Boolean(
      item?.drop
    );


  let dropReason =
    cleanString(
      item?.dropReason
    );


  // ===================================================
  // SCREENSHOT-FIRST REQUIREMENT
  // ===================================================

  if (
    !questionBoundingBox
  ) {
    drop =
      true;


    if (
      !dropReason
    ) {
      dropReason =
        "The complete one-question screenshot boundary could not be identified safely.";
    }
  }


  // ===================================================
  // IMPORTANT:
  //
  // Failure to identify a separate visualBoundingBox
  // does NOT automatically drop the question.
  //
  // The complete question screenshot already includes
  // the visual because questionBoundingBox surrounds the
  // whole printed question.
  // ===================================================

  const hasVisual =
    requestedVisual;


  const options =
    safeArray(
      item?.options
    )
      .map(
        (option) =>
          normalizeAcademicContent(
            option
          )
      )
      .filter(
        Boolean
      );


  const keyPoints =
    safeArray(
      item?.keyPoints
    )
      .map(
        (point) =>
          normalizeAcademicContent(
            point
          )
      )
      .filter(
        Boolean
      );


  let maxMarks =
    null;


  if (
    item?.maxMarks !==
      null &&
    item?.maxMarks !==
      undefined
  ) {
    const parsedMarks =
      Number(
        item.maxMarks
      );


    if (
      Number.isFinite(
        parsedMarks
      ) &&
      parsedMarks > 0
    ) {
      maxMarks =
        parsedMarks;
    }
  }


  return {
    questionNumber:
      cleanString(
        item?.questionNumber
      ),

    question:
      normalizeAcademicContent(
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

    // ===============================================
    // COMPLETE STUDENT-FACING QUESTION SCREENSHOT
    // ===============================================

    questionBoundingBox,

    // ===============================================
    // OPTIONAL INNER VISUAL
    // ===============================================

    hasVisual,

    visualDescription:
      cleanString(
        item?.visualDescription
      ),

    visualBoundingBox,

    // ===============================================
    // FORCE THE CURRENT SINGLE PDF PAGE
    // ===============================================

    sourcePage:
      Number(
        pageNumber
      ),

    drop,

    dropReason,
  };
};


// =====================================================
// PARSE GEMINI QUESTION JSON
// =====================================================

const parseGeminiQuestions = ({
  rawResponse,
  pageNumber,
}) => {
  const cleaned =
    cleanJsonResponse(
      rawResponse
    );


  if (!cleaned) {
    throw new Error(
      `Gemini returned an empty response for PDF page ${pageNumber}.`
    );
  }


  let parsed;


  try {
    parsed =
      JSON.parse(
        cleaned
      );
  } catch (error) {
    console.error(
      `NAVTA Gemini JSON parse error on PDF page ${pageNumber}:`,
      error
    );


    console.error(
      "NAVTA Gemini raw response:",
      cleaned.slice(
        0,
        5000
      )
    );


    throw new Error(
      `NAVTA could not understand the Gemini JSON response for PDF page ${pageNumber}.`
    );
  }


  const rawQuestions =
    Array.isArray(
      parsed
    )
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
// VALIDATE RENDERED PAGE
// =====================================================

const validateRenderedPage = (
  page
) => {
  if (
    !page ||
    typeof page !==
      "object"
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
      "NAVTA AI received a rendered PDF page without a valid page number."
    );
  }


  if (
    !Buffer.isBuffer(
      page.buffer
    ) ||
    page.buffer.length === 0
  ) {
    throw new Error(
      `Rendered PDF page ${pageNumber} does not contain a valid PNG image buffer.`
    );
  }


  return {
    ...page,

    pageNumber,
  };
};


// =====================================================
// BUILD GEMINI REQUEST PARTS
// =====================================================

const buildGeminiParts = ({
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


  const prompt =
    `${SYSTEM_PROMPT}

${buildPagePrompt({
  page:
    validPage,

  text,

  hints,
})}`;


  // ===================================================
  // CRITICAL GEMINI VISION FORMAT
  // ===================================================
  //
  // Keep camelCase:
  //
  // inlineData
  // mimeType
  //
  // Do NOT change these to:
  //
  // inline_data
  // mime_type
  //
  // ===================================================

  return [
    {
      text:
        prompt,
    },

    {
      text:
        `The following PNG image is ORIGINAL PDF PAGE ${pageNumber}. You MUST visually inspect this image and determine questionBoundingBox for every complete question visible on it.`,
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
// CALL GEMINI FOR ONE PDF PAGE
// =====================================================

const callGeminiForPage = async ({
  page,
  text = "",
  hints = {},
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
      `NAVTA Gemini Vision analysing PDF page ${pageNumber} using ${GEMINI_MODEL}.`
    );


    // =================================================
    // IMPORTANT
    // =================================================
    //
    // Gemini receives:
    //
    // 1. NAVTA instructions
    // 2. page-specific instructions
    // 3. ORIGINAL rendered PNG
    //
    // The PNG is sent using:
    //
    // inlineData
    // mimeType
    //
    // =================================================

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
                // -------------------------------------
                // Keep temperature low because
                // bounding boxes must be consistent.
                // -------------------------------------

                temperature:
                  0.05,

                // -------------------------------------
                // Force Gemini toward JSON output.
                // -------------------------------------

                responseMimeType:
                  "application/json",
              },
            }),
        }
      );


    const responseText =
      await response.text();


    let responseData =
      null;


    try {
      responseData =
        responseText
          ? JSON.parse(
              responseText
            )
          : {};
    } catch (error) {
      console.error(
        `NAVTA Gemini API returned invalid JSON for PDF page ${pageNumber}.`
      );


      console.error(
        responseText.slice(
          0,
          5000
        )
      );


      throw new Error(
        `Gemini returned an invalid API response while analysing PDF page ${pageNumber}.`
      );
    }


    if (
      !response.ok
    ) {
      const apiMessage =
        extractGeminiError(
          responseData,
          `Gemini request failed with HTTP ${response.status}.`
        );


      console.error(
        `NAVTA Gemini request failed on PDF page ${pageNumber}:`,
        apiMessage
      );


      throw new Error(
        `Gemini could not analyse PDF page ${pageNumber}. ${apiMessage}`
      );
    }


    // =================================================
    // CHECK FOR SAFETY / BLOCKING
    // =================================================

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


    // =================================================
    // EXTRACT MODEL TEXT
    // =================================================

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


      if (finishReason) {
        throw new Error(
          `Gemini returned no question JSON for PDF page ${pageNumber}. Finish reason: ${finishReason}.`
        );
      }


      throw new Error(
        `Gemini returned an empty question analysis for PDF page ${pageNumber}.`
      );
    }


    // =================================================
    // PARSE + NORMALIZE QUESTIONS
    // =================================================

    const questions =
      parseGeminiQuestions({
        rawResponse:
          modelText,

        pageNumber,
      });


    const acceptedBoundingBoxes =
      questions.filter(
        (question) =>
          Boolean(
            question
              ?.questionBoundingBox
          )
      ).length;


    const missingBoundingBoxes =
      questions.length -
      acceptedBoundingBoxes;


    console.log(
      `NAVTA Gemini page ${pageNumber}: ${questions.length} question(s), ${acceptedBoundingBoxes} screenshot box(es), ${missingBoundingBoxes} missing box(es).`
    );


    // =================================================
    // DEBUG WARNING
    // =================================================
    //
    // This is useful while screenshot-first mode is
    // being tested.
    //
    // It DOES NOT expose the Gemini API key.
    // =================================================

    if (
      questions.length > 0 &&
      acceptedBoundingBoxes === 0
    ) {
      console.warn(
        `NAVTA WARNING: Gemini detected questions on PDF page ${pageNumber}, but returned no usable questionBoundingBox values.`
      );
    }


    return questions;
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      throw new Error(
        `Gemini timed out while analysing PDF page ${pageNumber} after ${NAVTA_AI_TIMEOUT_MS} ms.`
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
// ANALYSE ONE RENDERED PAGE
// =====================================================

const analyseNavtaPage = async ({
  page,
  pageNumber,
  imageBuffer,
  mimeType = "image/png",
  text = "",
  hints = {},
} = {}) => {
  // ===================================================
  // SUPPORT BOTH CALLING STYLES
  // ===================================================
  //
  // Style A:
  //
  // analyseNavtaPage({
  //   page: {
  //     pageNumber: 1,
  //     buffer: ...
  //   }
  // })
  //
  // Style B:
  //
  // analyseNavtaPage({
  //   pageNumber: 1,
  //   imageBuffer: ...
  // })
  //
  // This helps preserve compatibility with older NAVTA
  // code.
  // ===================================================

  let renderedPage =
    page;


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


  return callGeminiForPage({
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
// REMOVE EXACT DUPLICATE QUESTIONS
// =====================================================
//
// Gemini is now analysing ONE page at a time, so
// cross-page duplicates should be uncommon.
//
// However, some PDFs repeat a question at a page break.
// This lightweight dedupe prevents obvious exact
// duplicates while preserving legitimate questions.
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
    const questionText =
      cleanString(
        question?.question
      )
        .replace(
          /\s+/g,
          " "
        )
        .toLowerCase();


    const questionNumber =
      cleanString(
        question?.questionNumber
      )
        .toLowerCase();


    const sourcePage =
      Number(
        question?.sourcePage
      ) ||
      0;


    // ===============================================
    // Include source page so the same printed
    // question number on another page is not removed.
    // ===============================================

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
// SORT QUESTIONS IN PDF ORDER
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
      // First try the vertical screenshot position.
      //
      // This is more reliable than question numbers
      // when papers contain sections or reset numbering.
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
      // Fall back to printed question number.
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
// navtaAIImportService.js imports this exact function:
//
// const {
//   analyseRenderedPages,
// } = require("./navtaAIQuestionService");
//
// DO NOT rename this function.
//
// SCREENSHOT-FIRST STRATEGY:
//
// Instead of sending 5 pages together, NAVTA now sends
// ONE rendered PDF page to Gemini Vision at a time.
//
// Page 1
//   -> detect questions
//   -> get questionBoundingBox
//
// Page 2
//   -> detect questions
//   -> get questionBoundingBox
//
// Page 3
//   -> ...
//
// This continues sequentially until the final page.
//
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
    // VALIDATE + SORT PDF PAGES
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
      "NAVTA SCREENSHOT-FIRST PDF ANALYSIS STARTING"
    );

    console.log(
      `Rendered PDF pages: ${validPages.length}`
    );

    console.log(
      "Gemini Vision mode: ONE PAGE AT A TIME"
    );

    console.log(
      "====================================================="
    );


    const allQuestions =
      [];


    // =================================================
    // PROCESS EVERY PAGE SEQUENTIALLY
    // =================================================
    //
    // IMPORTANT:
    //
    // Do NOT convert this to Promise.all().
    //
    // Sequential processing prevents all page images
    // being sent to Gemini simultaneously.
    //
    // It also makes questionBoundingBox page-local and
    // much easier for Gemini to determine.
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
        `NAVTA AI page ${pageIndex + 1}/${validPages.length}: analysing PDF page ${pageNumber}.`
      );


      // =================================================
      // USE PAGE-SPECIFIC TEXT WHEN AVAILABLE
      // =================================================

      const pageText =
        cleanString(
          page?.text
        );


      const questions =
        await callGeminiForPage({
          page,

          text:
            pageText ||
            text,

          hints,
        });


      // =================================================
      // FORCE CORRECT SOURCE PAGE
      // =================================================
      //
      // Because exactly one page was sent to Gemini,
      // every question detected in this request belongs
      // to this page.
      //
      // Never trust a hallucinated different page
      // number from the model.
      // =================================================

      const normalizedQuestions =
        questions.map(
          (question) => ({
            ...question,

            sourcePage:
              pageNumber,
          })
        );


      allQuestions.push(
        ...normalizedQuestions
      );


      // =================================================
      // PAGE DEBUG SUMMARY
      // =================================================

      const detectedCount =
        normalizedQuestions.length;


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
        `NAVTA AI PDF page ${pageNumber} completed: detected=${detectedCount}, screenshotBoxes=${screenshotCount}, dropped=${droppedCount}.`
      );
    }


    // =================================================
    // REMOVE ONLY EXACT DUPLICATES
    // =================================================

    const deduplicatedQuestions =
      removeExactDuplicates(
        allQuestions
      );


    // =================================================
    // SORT IN ORIGINAL PDF ORDER
    // =================================================

    const sortedQuestions =
      sortQuestionsInPdfOrder(
        deduplicatedQuestions
      );


    // =================================================
    // FINAL DEBUG SUMMARY
    // =================================================

    const screenshotQuestions =
      sortedQuestions.filter(
        (question) =>
          Boolean(
            question
              ?.questionBoundingBox
          )
      );


    const missingScreenshotQuestions =
      sortedQuestions.filter(
        (question) =>
          !question
            ?.questionBoundingBox
      );


    const droppedQuestions =
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
      "NAVTA SCREENSHOT-FIRST PDF ANALYSIS COMPLETED"
    );

    console.log(
      `Pages analysed: ${validPages.length}`
    );

    console.log(
      `Questions detected: ${sortedQuestions.length}`
    );

    console.log(
      `Questions with screenshot boxes: ${screenshotQuestions.length}`
    );

    console.log(
      `Questions missing screenshot boxes: ${missingScreenshotQuestions.length}`
    );

    console.log(
      `Questions marked dropped: ${droppedQuestions.length}`
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
// navtaAIImportService.js expects:
//
// analyseRenderedPages
//
// Therefore this export MUST remain.
//
// The aliases below preserve compatibility with older
// NAVTA code that previously checked the AI gateway or
// Ollama connection.
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
