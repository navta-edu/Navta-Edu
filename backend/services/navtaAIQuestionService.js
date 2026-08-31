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
// sends them to Gemini in batches of EXACTLY 5 pages,
// extracts structured questions, and returns them to
// the existing NAVTA import pipeline.
//
// Processing:
//
// Pages 1-5
// Pages 6-10
// Pages 11-15
// Pages 16-20
// ...
// until the final page.
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
// FIXED 5-PAGE BATCH
// =====================================================
//
// NAVTA intentionally processes 5 PDF pages at a time.
//
// Example:
//
// Request 1 -> pages 1,2,3,4,5
// Request 2 -> pages 6,7,8,9,10
// Request 3 -> pages 11,12,13,14,15
//
// The final request can contain fewer than 5 pages.
//
// =====================================================

const NAVTA_AI_BATCH_SIZE = 5;


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
// IMAGE BUFFER -> BASE64
// =====================================================

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

Your job is to analyse rendered question-paper PAGE IMAGES and detect every academic question visible on those pages.

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
CRITICAL QUESTION DETECTION RULES
=====================================================

1. The PAGE IMAGES are the PRIMARY source.

2. You MUST analyse EVERY supplied page.

3. You MUST scan every supplied page from TOP to BOTTOM.

4. Detect EVERY academic question visible on ALL supplied pages.

5. DO NOT stop after detecting only the first few questions.

6. If five pages are supplied, you must inspect ALL FIVE pages completely.

For example:

If pages 1, 2, 3, 4 and 5 are supplied:

- fully inspect page 1
- fully inspect page 2
- fully inspect page 3
- fully inspect page 4
- fully inspect page 5

Do not return early.

7. If pages 6, 7, 8, 9 and 10 are supplied:

inspect every one of those pages completely.

Continue this behaviour for every later page batch.

8. Your goal is MAXIMUM QUESTION RECALL without inventing questions.

9. Preserve the printed question number whenever visible.

10. A page may contain many questions.

Do not assume one page contains only one question.

If a page contains:

Q1
Q2
Q3
Q4
Q5
Q6
Q7

then return all seven questions if they are readable.

11. Questions may be arranged:

- vertically
- in columns
- in sections
- across multiple areas of the page

Inspect the COMPLETE page.

12. Pay special attention to two-column question papers.

If the page contains a left column and right column,
scan BOTH columns.

13. Preserve the original question wording as accurately as possible.

14. Do not invent questions.


=====================================================
QUESTIONS CONTINUING BETWEEN PAGES
=====================================================

15. A question may continue from one supplied page to the next supplied page.

If adjacent supplied pages clearly contain different parts of the same question, combine them into one complete question.

16. Do not duplicate a question simply because it appears across two pages.

17. If a question begins near the bottom of one page and continues on the next supplied page, combine it.

18. If a question cannot be understood completely because the required continuation is NOT present in the supplied batch:

drop = true

and explain why using dropReason.


=====================================================
MCQ RULES
=====================================================

19. For MCQ questions:

Return exactly four options when four options are visible.

20. Preserve options accurately.

21. Preserve mathematical expressions as readable text.

22. correctAnswer must be:

0 = A
1 = B
2 = C
3 = D

23. If the correct answer cannot be determined reliably:

correctAnswer = null

24. Never guess a correct answer just to make a question valid.

25. NEET and JEE questions must use:

questionType = "mcq"


=====================================================
BOARD QUESTION RULES
=====================================================

26. Boards questions may use:

- mcq
- short
- long

27. For Boards written questions provide when possible:

- modelAnswer
- keyPoints
- maxMarks


=====================================================
CLASSIFICATION
=====================================================

28. Determine as accurately as possible:

- subject
- exam
- classLevel
- chapter
- difficulty
- questionType

29. If administrator hints are supplied and they clearly match the pages, use them.

30. Do not blindly use hints if they clearly contradict the question.


=====================================================
EXPLANATIONS
=====================================================

31. Provide an educational explanation when it can be determined reliably.

32. The explanation should help a student understand the answer.

33. Do not reject an otherwise readable question merely because a long explanation is unavailable.


=====================================================
DIAGRAMS AND VISUALS
=====================================================

34. DIAGRAMS AND VISUALS ARE VERY IMPORTANT.

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

35. If a question depends on a visual:

hasVisual = true

36. Return visualBoundingBox using NORMALIZED coordinates for the page identified by sourcePage:

{
  "x": 0.0,
  "y": 0.0,
  "width": 0.0,
  "height": 0.0
}

37. Each coordinate must be between 0 and 1.

38. x is the horizontal starting position from the LEFT edge.

39. y is the vertical starting position from the TOP edge.

40. width is the visual width divided by total page width.

41. height is the visual height divided by total page height.

42. The visualBoundingBox must contain the REQUIRED diagram, graph, circuit, figure, table or other visual as tightly as practical.

43. Do not include the complete page.

44. Do not include the entire question text unless that text is part of the required figure.

45. If no visual is required:

hasVisual = false
visualDescription = ""
visualBoundingBox = null


=====================================================
DROP RULES
=====================================================

46. Do NOT drop a readable question simply because classification is difficult.

Make your best reliable classification.

47. Only use:

drop = true

when the actual question itself is:

- incomplete
- unreadable
- genuinely uncertain
- missing essential continuation
- impossible to reconstruct safely

48. Never invent missing question text.

49. Never make up an answer simply to make a question valid.


=====================================================
SOURCE PAGE
=====================================================

50. sourcePage is REQUIRED.

51. sourcePage must be the actual PDF page number containing the question.

52. If a question spans multiple supplied pages, use the page where the question begins.

53. If a visual belongs to the question, sourcePage must identify the page containing the visual because NAVTA uses that page to crop the diagram.


=====================================================
OUTPUT
=====================================================

54. Return ONLY valid JSON.

55. Do not return Markdown.

56. Do not use code fences.

57. Return EVERY question you detected.

58. Before producing the final JSON, mentally verify that you inspected every supplied page from top to bottom.

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
=====================================================
PDF PAGE ${pageNumber}
=====================================================

Extracted text context for page ${pageNumber}:

${pageText.slice(
  0,
  7000
)}
`;
        }
      )
      .join(
        "\n"
      );


  return `
Analyse this NAVTA question-paper page batch.


=====================================================
SUPPLIED PDF PAGES
=====================================================

${pageNumbers.join(", ")}


You MUST analyse these pages in this order:

${pageNumbers
  .map(
    (number) =>
      `PDF Page ${number}`
  )
  .join("\n")}


IMPORTANT:

You MUST inspect EVERY supplied page.

Do not analyse only the first page.

Do not stop after finding the first few questions.

Scan every page completely from top to bottom.

If a page contains two columns, inspect both columns.

Detect every readable academic question.


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
SOURCE PRIORITY
=====================================================

The PAGE IMAGES supplied with this request are the PRIMARY SOURCE.

Each image is preceded by a text label identifying its PDF page number.

Extracted document text is SUPPORTING CONTEXT only.

Do not create questions that are not visible on one or more supplied page images.


=====================================================
PAGE TEXT CONTEXT
=====================================================

${pageContext}


=====================================================
GENERAL DOCUMENT TEXT CONTEXT
=====================================================

${String(
  text || ""
).slice(
  0,
  8000
)}


=====================================================
REQUIRED QUESTION FORMAT
=====================================================

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


=====================================================
FINAL CHECK BEFORE RETURNING JSON
=====================================================

Before returning:

1. Confirm you inspected ALL of these pages:

${pageNumbers.join(", ")}

2. Confirm you scanned each page completely.

3. Confirm you did not stop after only a few questions.

4. Confirm every visible readable academic question has been included.

5. Confirm question numbers were preserved whenever visible.

6. Confirm sourcePage is one of these supplied PDF page numbers:

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


    // =================================================
    // ADD EACH PAGE IMAGE
    // =================================================

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
          `The next image is PDF PAGE ${pageNumber}. Analyse this entire page from top to bottom.`,
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


      console.log(
        `NAVTA Gemini request: analysing PDF pages ${validPageNumbers.join(
          ", "
        )} using ${GEMINI_MODEL}.`
      );


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


    const normalized =
      questions.map(
        (item) =>
          normalizeDetectedQuestion({
            item,

            fallbackPageNumber,

            validPageNumbers,
          })
      );


    console.log(
      `NAVTA Gemini pages ${validPageNumbers.join(
        ", "
      )}: detected ${normalized.length} question(s).`
    );


    return normalized;
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
// SPLIT PAGES INTO EXACT 5-PAGE BATCHES
// =====================================================

const createPageBatches = (
  pages = []
) => {
  const batches =
    [];


  for (
    let index = 0;
    index < pages.length;
    index +=
      NAVTA_AI_BATCH_SIZE
  ) {
    batches.push(
      pages.slice(
        index,
        index +
          NAVTA_AI_BATCH_SIZE
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


    // =================================================
    // VALID PAGES
    // =================================================

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


    // =================================================
    // SORT PAGES
    // =================================================
    //
    // Guarantees:
    //
    // 1,2,3,4,5
    // then
    // 6,7,8,9,10
    // etc.
    //
    // =================================================

    validPages.sort(
      (
        first,
        second
      ) =>
        Number(
          first.pageNumber
        ) -
        Number(
          second.pageNumber
        )
    );


    // =================================================
    // CREATE 5-PAGE BATCHES
    // =================================================

    const batches =
      createPageBatches(
        validPages
      );


    const questions =
      [];


    console.log(
      "====================================================="
    );

    console.log(
      "NAVTA GEMINI PDF ANALYSIS STARTING"
    );

    console.log(
      `Total rendered pages: ${validPages.length}`
    );

    console.log(
      `Batch size: ${NAVTA_AI_BATCH_SIZE} pages`
    );

    console.log(
      `Total Gemini requests: ${batches.length}`
    );

    console.log(
      "====================================================="
    );


    // =================================================
    // PROCESS EACH BATCH SEQUENTIALLY
    // =================================================
    //
    // IMPORTANT:
    //
    // We intentionally use await inside this loop.
    //
    // This means:
    //
    // FIRST:
    // pages 1-5 finish
    //
    // THEN:
    // pages 6-10 begin
    //
    // THEN:
    // pages 11-15
    //
    // etc.
    //
    // =================================================

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
        "-----------------------------------------------------"
      );

      console.log(
        `NAVTA Gemini batch ${batchIndex + 1}/${batches.length}`
      );

      console.log(
        `Processing PDF pages: ${pageNumbers.join(
          ", "
        )}`
      );

      console.log(
        "-----------------------------------------------------"
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


      console.log(
        `Batch ${batchIndex + 1} completed.`
      );

      console.log(
        `Questions found in this batch: ${detected.length}`
      );

      console.log(
        `Total questions detected so far: ${questions.length}`
      );
    }


    console.log(
      "====================================================="
    );

    console.log(
      "NAVTA GEMINI PDF ANALYSIS COMPLETED"
    );

    console.log(
      `Pages analysed: ${validPages.length}`
    );

    console.log(
      `Total detected questions: ${questions.length}`
    );

    console.log(
      "====================================================="
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


  // ===================================================
  // BACKWARD COMPATIBILITY
  // ===================================================
  //
  // These aliases prevent older NAVTA code from
  // crashing if it still imports the old connection
  // check function names.
  //
  // ===================================================

  checkNavtaAIGatewayConnection:
    checkGeminiConnection,

  checkOllamaConnection:
    checkGeminiConnection,
};
