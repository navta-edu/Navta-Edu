const OpenAI = require("openai");

// =====================================================
// OPENAI CLIENT
// =====================================================


const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY,
});

const OPENAI_MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-4.1-mini";

// =====================================================
// HELPERS
// =====================================================

const cleanString = (value = "") =>
  String(value || "").trim();

const safeArray = (value) =>
  Array.isArray(value)
    ? value
    : [];

const normalizeQuestionType = (
  value
) => {
  const normalized =
    cleanString(value)
      .toLowerCase();

  if (
    normalized === "short" ||
    normalized ===
      "short-answer"
  ) {
    return "short";
  }

  if (
    normalized === "long" ||
    normalized ===
      "long-answer"
  ) {
    return "long";
  }

  return "mcq";
};

const normalizeDifficulty = (
  value
) => {
  const normalized =
    cleanString(value)
      .toLowerCase();

  if (
    normalized === "easy"
  ) {
    return "Easy";
  }

  if (
    normalized === "hard"
  ) {
    return "Hard";
  }

  return "Medium";
};

const imageBufferToDataUrl = (
  buffer,
  mimeType =
    "image/png"
) => {
  if (
    !Buffer.isBuffer(
      buffer
    )
  ) {
    return "";
  }

  return `data:${mimeType};base64,${buffer.toString(
    "base64"
  )}`;
};

// =====================================================
// SYSTEM INSTRUCTIONS
// =====================================================

const SYSTEM_PROMPT = `
You are NAVTA AI, a question-paper analysis system for an educational platform.

Your job is to analyse school/JEE/NEET question papers and return structured questions.

You must:

1. Detect every real question on the supplied page.
2. Preserve question wording accurately.
3. Detect MCQ options where present.
4. Detect the correct answer only if it can be determined confidently.
5. Detect whether a question has a diagram, graph, figure, circuit, chemical structure, table, geometry figure, biology image, or other important visual.
6. Associate that visual with the correct question.
7. Classify each question by:
   - subject
   - exam
   - classLevel
   - chapter
   - difficulty
   - questionType
8. Give a useful explanation where possible.
9. For Boards written questions, give:
   - modelAnswer
   - keyPoints
   - maxMarks when inferable.
10. Do not invent a diagram that is not present.
11. Do not invent questions.
12. If classification is uncertain, mark the question as dropped.
13. If a question does not belong to an approved NAVTA chapter, mark it as dropped.
14. Use the supplied hints only as hints, not as facts.

Allowed subjects:
Physics
Chemistry
Maths
Biology

Allowed exams:
NEET
JEE
Boards

Allowed classes:
Class 11
Class 12

Allowed difficulty:
Easy
Medium
Hard

Allowed question types:
mcq
short
long

For JEE and NEET, only return mcq.

Return JSON only.
`;

// =====================================================
// JSON SCHEMA
// =====================================================

const RESPONSE_SCHEMA = {
  type: "object",

  additionalProperties:
    false,

  required: [
    "questions",
  ],

  properties: {
    questions: {
      type: "array",

      items: {
        type: "object",

        additionalProperties:
          false,

        required: [
          "questionNumber",
          "question",
          "subject",
          "exam",
          "classLevel",
          "chapter",
          "difficulty",
          "questionType",
          "options",
          "correctAnswer",
          "modelAnswer",
          "keyPoints",
          "maxMarks",
          "explanation",
          "hasVisual",
          "visualDescription",
          "visualBoundingBox",
          "drop",
          "dropReason",
        ],

        properties: {
          questionNumber: {
            type: [
              "string",
              "null",
            ],
          },

          question: {
            type: "string",
          },

          subject: {
            type: "string",
          },

          exam: {
            type: "string",
          },

          classLevel: {
            type: "string",
          },

          chapter: {
            type: "string",
          },

          difficulty: {
            type: "string",
          },

          questionType: {
            type: "string",
          },

          options: {
            type: "array",
            items: {
              type: "string",
            },
          },

          correctAnswer: {
            type: [
              "integer",
              "null",
            ],
          },

          modelAnswer: {
            type: "string",
          },

          keyPoints: {
            type: "array",
            items: {
              type: "string",
            },
          },

          maxMarks: {
            type: [
              "number",
              "null",
            ],
          },

          explanation: {
            type: "string",
          },

          hasVisual: {
            type: "boolean",
          },

          visualDescription: {
            type: "string",
          },

          visualBoundingBox: {
            type: [
              "object",
              "null",
            ],

            additionalProperties:
              false,

            required: [
              "x",
              "y",
              "width",
              "height",
            ],

            properties: {
              x: {
                type: "number",
              },

              y: {
                type: "number",
              },

              width: {
                type: "number",
              },

              height: {
                type: "number",
              },
            },
          },

          drop: {
            type: "boolean",
          },

          dropReason: {
            type: "string",
          },
        },
      },
    },
  },
};

// =====================================================
// BUILD USER CONTENT
// =====================================================

const buildPagePrompt = ({
  pageNumber,
  text = "",
  hints = {},
}) => {
  return `
Analyse PDF page ${pageNumber}.

Text extracted from this page/document:

${text || "(No reliable text extraction available.)"}

Optional classification hints:

Subject:
${hints.subject || "Auto Detect"}

Preparation / Exam:
${hints.exam || "Auto Detect"}

Class:
${hints.classLevel || "Auto Detect"}

IMPORTANT VISUAL RULE:

If a question contains a diagram or visual that is necessary to understand or solve it, return:

hasVisual = true

and return visualBoundingBox using NORMALIZED coordinates from 0 to 1 relative to the supplied page image:

x = left position
y = top position
width = visual width
height = visual height

Example:

{
  "x": 0.25,
  "y": 0.40,
  "width": 0.50,
  "height": 0.25
}

The bounding box should contain ONLY the diagram/graph/figure as closely as possible.

Do NOT include the complete page unless the visual itself occupies most of the page.
`;
};

// =====================================================
// ANALYSE ONE PAGE
// =====================================================

const analyseNavtaPage =
  async ({
    pageNumber,
    pageImageBuffer,
    pageMimeType =
      "image/png",
    text = "",
    hints = {},
  }) => {
    if (
      !Buffer.isBuffer(
        pageImageBuffer
      )
    ) {
      throw new Error(
        "Page image buffer is required."
      );
    }

    const imageDataUrl =
      imageBufferToDataUrl(
        pageImageBuffer,
        pageMimeType
      );

    const response =
      await openai.responses.create({
        model:
          OPENAI_MODEL,

        input: [
          {
            role:
              "system",

            content: [
              {
                type:
                  "input_text",

                text:
                  SYSTEM_PROMPT,
              },
            ],
          },

          {
            role:
              "user",

            content: [
              {
                type:
                  "input_text",

                text:
                  buildPagePrompt({
                    pageNumber,
                    text,
                    hints,
                  }),
              },

              {
                type:
                  "input_image",

                image_url:
                  imageDataUrl,
              },
            ],
          },
        ],

        text: {
          format: {
            type:
              "json_schema",

            name:
              "navta_question_page",

            strict:
              true,

            schema:
              RESPONSE_SCHEMA,
          },
        },
      });

    let parsed = null;

    try {
      parsed =
        JSON.parse(
          response.output_text
        );
    } catch (error) {
      console.error(
        "NAVTA AI JSON PARSE ERROR:",
        error
      );

      throw new Error(
        "NAVTA AI returned an invalid response."
      );
    }

    const questions =
      safeArray(
        parsed.questions
      );

    return questions.map(
      (item) => ({
        questionNumber:
          cleanString(
            item.questionNumber
          ),

        question:
          cleanString(
            item.question
          ),

        subject:
          cleanString(
            item.subject
          ),

        exam:
          cleanString(
            item.exam
          ),

        classLevel:
          cleanString(
            item.classLevel
          ),

        chapter:
          cleanString(
            item.chapter
          ),

        difficulty:
          normalizeDifficulty(
            item.difficulty
          ),

        questionType:
          normalizeQuestionType(
            item.questionType
          ),

        options:
          safeArray(
            item.options
          ).map(
            cleanString
          ),

        correctAnswer:
          Number.isInteger(
            item.correctAnswer
          )
            ? item.correctAnswer
            : null,

        modelAnswer:
          cleanString(
            item.modelAnswer
          ),

        keyPoints:
          safeArray(
            item.keyPoints
          )
            .map(
              cleanString
            )
            .filter(
              Boolean
            ),

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
          cleanString(
            item.explanation
          ),

        hasVisual:
          Boolean(
            item.hasVisual
          ),

        visualDescription:
          cleanString(
            item.visualDescription
          ),

        visualBoundingBox:
          item.visualBoundingBox ||
          null,

        sourcePage:
          pageNumber,

        drop:
          Boolean(
            item.drop
          ),

        dropReason:
          cleanString(
            item.dropReason
          ),
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
    const allQuestions = [];

    for (
      const page of pages
    ) {
      const questions =
        await analyseNavtaPage({
          pageNumber:
            page.pageNumber,

          pageImageBuffer:
            page.buffer,

          pageMimeType:
            page.mimeType ||
            "image/png",

          text,

          hints,
        });

      allQuestions.push(
        ...questions
      );
    }

    return allQuestions;
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  analyseNavtaPage,
  analyseRenderedPages,
};
