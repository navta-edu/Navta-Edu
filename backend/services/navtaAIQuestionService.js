// =====================================================
// NAVTA AI QUESTION SERVICE
// Gemini Vision - Screenshot First
// Clean Question Text
// Robust JSON
// Dedicated Single-Question Solver
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
.replace(//+$/, "");

const NAVTA_AI_TIMEOUT_MS = Math.max(
30000,
Number(
process.env.NAVTA_AI_TIMEOUT_MS ||
180000
) || 180000
);

const MAX_PAGE_ATTEMPTS = 2;
const MAX_SOLVER_ATTEMPTS = 2;

// =====================================================
// BASIC HELPERS
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
// INTERNAL ACADEMIC CONTENT
// =====================================================

const normalizeAcademicContent = (
value = ""
) => {
return cleanString(value)
.replace(
/(?:latex|tex|math|markdown|json)?/gi,
      ""
    )
    .replace(//g, "")
.replace(/\r\n?/g, "\n")
.replace(/\u00a0/g, " ")
.trim();
};

// =====================================================
// CLEAN VISIBLE QUESTION TEXT
// =====================================================

const normalizeVisibleQuestionText = (
value = ""
) => {
let text =
normalizeAcademicContent(value);

if (!text) {
return "";
}

const containsDeterminant =
/\begin\s*{\svmatrix\s}/i.test(text) ||
/\end\s*{\svmatrix\s}/i.test(text);

const containsMatrix =
/\begin\s*{\s*(?|pmatrix|matrix|Vmatrix)\s*}/i.test(
text
) ||
/\end\s*{\s*(?|pmatrix|matrix|Vmatrix)\s*}/i.test(
text
);

const containsCases =
/\begin\s*{\scases\s}/i.test(text);

if (containsDeterminant) {
text = text.replace(
/$$[\s\S]?\begin\s{\svmatrix\s}[\s\S]?\end\s{\svmatrix\s}[\s\S]*?$$/gi,
"the given determinant"
);

text = text.replace(
  /\$[\s\S]*?\\begin\s*\{\s*vmatrix\s*\}[\s\S]*?\\end\s*\{\s*vmatrix\s*\}[\s\S]*?\$/gi,
  "the given determinant"
);

}

if (containsMatrix) {
text = text.replace(
/$$[\s\S]?\begin\s{\s*(?|pmatrix|matrix|Vmatrix)\s*}[\s\S]?\end\s{\s*(?|pmatrix|matrix|Vmatrix)\s*}[\s\S]*?$$/gi,
"the given matrix"
);

text = text.replace(
  /\$[\s\S]*?\\begin\s*\{\s*(?:bmatrix|pmatrix|matrix|Vmatrix)\s*\}[\s\S]*?\\end\s*\{\s*(?:bmatrix|pmatrix|matrix|Vmatrix)\s*\}[\s\S]*?\$/gi,
  "the given matrix"
);

}

if (containsCases) {
text = text.replace(
/$$[\s\S]?\begin\s{\scases\s}[\s\S]?\end\s{\scases\s}[\s\S]*?$$/gi,
"the given expression"
);
}

if (
/\begin\s*{\svmatrix\s}/i.test(text) ||
/\end\s*{\svmatrix\s}/i.test(text)
) {
return "Find the value of the given determinant.";
}

if (
/\begin\s*{\s*(?|pmatrix|matrix|Vmatrix)\s*}/i.test(
text
) ||
/\end\s*{\s*(?|pmatrix|matrix|Vmatrix)\s*}/i.test(
text
)
) {
return "Answer the question using the given matrix.";
}

text = text
.replace(/$$/g, "")
.replace(/\s+/g, " ")
.trim();

if (
/\begin\s*{/i.test(text) ||
/\end\s*{/i.test(text)
) {
if (containsDeterminant) {
return "Find the value of the given determinant.";
}

if (containsMatrix) {
  return "Answer the question using the given matrix.";
}

return "Answer the question shown in the original question image.";

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

let x = Number(value.x);
let y = Number(value.y);
let width = Number(value.width);
let height = Number(value.height);

if (
!Number.isFinite(x) ||
!Number.isFinite(y) ||
!Number.isFinite(width) ||
!Number.isFinite(height)
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

if (
x < 0 ||
y < 0 ||
width <= 0 ||
height <= 0
) {
return null;
}

const safeX =
Math.min(1, Math.max(0, x));

const safeY =
Math.min(1, Math.max(0, y));

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
"A valid PNG image buffer is required."
);
}

return buffer.toString("base64");
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
Rendered PDF page ${pageNumber} does not contain a valid image buffer.
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
let text =
cleanString(value);

text = text.replace(
/^```(?|javascript|js)?\s*/i,
""
);

text = text.replace(
/\s*```$/i,
""
);

return text.trim();
};

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

let inString = false;
let escaped = false;
let depth = 0;

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
} else if (char === "}") {
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

const removeTrailingCommas = (
value
) => {
return String(
value || ""
).replace(
/,\s*([}]])/g,
"$1"
);
};

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

let inString = false;
let escaped = false;

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
text += "\";
}

if (inString) {
text += '"';
}

text =
text.replace(
/,\s*$/,
""
);

const stack = [];

inString = false;
escaped = false;

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

const tryParseGeminiJson = (
rawResponse
) => {
const attempts = [];

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
!attempts.includes(noTrailing)
) {
attempts.push(noTrailing);
}

const repaired =
repairTruncatedJson(
outer
);

if (
repaired &&
!attempts.includes(repaired)
) {
attempts.push(repaired);
}

for (
const candidate of
attempts
) {
try {
return {
success: true,
parsed:
JSON.parse(candidate),
};
} catch {
// continue
}
}

return {
success: false,
parsed: null,
};
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
// PAGE DETECTION PROMPT
// =====================================================

const SYSTEM_PROMPT = `
You are NAVTA AI.

You analyse ONE ORIGINAL RENDERED PDF PAGE IMAGE at a time.

NAVTA uses a SCREENSHOT-FIRST question system.

Your first task is detection, not final answer solving.

The ORIGINAL QUESTION SCREENSHOT is the authoritative student-facing content.

You must:

Visually inspect the entire PDF page image.

Detect every readable academic question.

Identify a questionBoundingBox for every complete question.

Create a clean human-readable question description.

Extract classification metadata.

Extract four MCQ options when visible.

You MAY determine correctAnswer if immediately reliable.

If correctAnswer is not immediately reliable, return null.

IMPORTANT: correctAnswer=null MUST NOT cause the question to be dropped during this detection pass.

Supported subjects:
Physics
Chemistry
Maths
Biology

Supported exams:
NEET
JEE
Boards

Supported classes:
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

The attached ORIGINAL PAGE IMAGE is the primary source.

Visually inspect it.

Extracted text is only supporting context.

The "question" field should be a SHORT readable description.

Do not reconstruct large determinants, matrices, long equations, graphs, circuits, diagrams or chemical structures using raw LaTeX.

Examples:

Printed determinant question:
Return:
"The value of the given determinant is:"

Printed matrix inverse question:
Return:
"Find the inverse of the given matrix."

Printed graph question:
Return:
"Identify the relationship represented by the given graph."

For simple ordinary questions, preserve the actual wording.

Every non-dropped question MUST return:

"questionBoundingBox": {
"x": 0.0,
"y": 0.0,
"width": 0.0,
"height": 0.0
}

Coordinates are normalized 0 to 1.

The box must contain exactly ONE complete question.

Include:

question number

stem

all four MCQ options

determinant

matrix

equation

graph

diagram

circuit

table

visual

every piece needed to solve that question

Do not include previous or next questions.

Approximate coordinates are acceptable if the crop safely contains the full question.

NEET and JEE use questionType="mcq".

Extract all four options.

correctAnswer may be:

0 = A
1 = B
2 = C
3 = D

If determining the answer requires calculation or significant reasoning, you may return null.

NAVTA has a SECOND dedicated solver pass for such questions.

Therefore DO NOT drop a readable MCQ merely because correctAnswer is null.

Use drop=true only when:

actual question is unreadable

question is incomplete

essential continuation is outside this page

complete screenshot boundary genuinely cannot be identified

Do NOT drop merely because:

correctAnswer is null

explanation is missing

chapter is uncertain

difficulty is uncertain

Return ONLY valid JSON.

Top-level:

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

Return JSON only.
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

const retryText =
retry
? `
This is a retry.

Your previous response was malformed JSON.

Return shorter, strict and complete JSON.

Do not use Markdown or code fences.
`
: "";

return `
Analyse ORIGINAL PDF PAGE ${pageNumber}.

${retryText}

Admin hints:

Subject:
${cleanString(hints?.subject) || "Not provided"}

Exam:
${cleanString(hints?.exam) || "Not provided"}

Class:
${cleanString(hints?.classLevel) || "Not provided"}

The actual PNG image of PDF page ${pageNumber} is attached.

Visually inspect the whole page.

Detect every readable question.

Every non-dropped question must have questionBoundingBox.

Do NOT drop an MCQ merely because correctAnswer is null.

sourcePage must equal ${pageNumber}.

Extracted page text:

${cleanString(page?.text).slice(0, 5000)}

General document text:

${String(text || "").slice(0, 3000)}

Return only:

{
"questions": [...]
}
`;
};

// =====================================================
// BUILD PAGE GEMINI PARTS
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
page:
validPage,

      text,

      hints,

      retry,
    }),
},

{
  text:
    `The next image is ORIGINAL PDF PAGE ${validPage.pageNumber}. Visually inspect it completely.`,
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

let drop =
Boolean(item?.drop);

let dropReason =
cleanString(
item?.dropReason
);

// Missing answer is NOT a detection-pass drop reason.
// Missing screenshot boundary IS a drop reason.

if (!questionBoundingBox) {
drop = true;

if (!dropReason) {
  dropReason =
    "The complete one-question screenshot boundary could not be identified safely.";
}

}

const options =
safeArray(item?.options)
.map(
normalizeAcademicContent
)
.filter(Boolean);

const keyPoints =
safeArray(item?.keyPoints)
.map(
normalizeAcademicContent
)
.filter(Boolean);

let maxMarks = null;

if (
item?.maxMarks !== null &&
item?.maxMarks !== undefined
) {
const value =
Number(item.maxMarks);

if (
  Number.isFinite(value) &&
  value > 0
) {
  maxMarks = value;
}

}

return {
questionNumber:
cleanString(
item?.questionNumber
),

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
  Boolean(item?.hasVisual),

visualDescription:
  cleanString(
    item?.visualDescription
  ),

visualBoundingBox,

sourcePage:
  Number(pageNumber),

drop,

dropReason,

};
};

// =====================================================
// PARSE PAGE QUESTIONS
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
NAVTA could not understand the Gemini JSON response for PDF page ${pageNumber}.
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
typeof item === "object"
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
// SEND ONE PAGE REQUEST
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

  let responseData = {};

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


  const modelText =
    extractGeminiText(
      responseData
    );

  if (!modelText) {
    throw new Error(
      `Gemini returned no question JSON for PDF page ${pageNumber}.`
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
  clearTimeout(timeout);
}

};

// =====================================================
// ANALYSE PAGE WITH RETRY
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
  try {
    const response =
      await sendGeminiPageRequest({
        page:
          validPage,

        text,

        hints,

        retry:
          attempt > 1,
      });


    const questions =
      parseGeminiQuestions({
        rawResponse:
          response.modelText,

        pageNumber,
      });


    return questions;
  } catch (error) {
    lastError =
      error;

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

if (!renderedPage) {
  renderedPage = {
    pageNumber:
      Number(pageNumber),

    buffer:
      imageBuffer,

    mimeType,

    text:
      cleanString(text),
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
// DEDUPE
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
safeArray(questions)
) {
const key =
${
        Number(question?.sourcePage) || 0
      }|${
        cleanString(
          question?.questionNumber
        ).toLowerCase()
      }|${
        cleanString(
          question?.question
        )
          .replace(/\s+/g, " ")
          .toLowerCase()
      };

if (
  seen.has(key)
) {
  continue;
}

seen.add(key);
output.push(question);

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
...safeArray(questions),
].sort(
(
first,
second
) => {
const firstPage =
Number(
first?.sourcePage
) || 0;

  const secondPage =
    Number(
      second?.sourcePage
    ) || 0;

  if (
    firstPage !==
    secondPage
  ) {
    return (
      firstPage -
      secondPage
    );
  }


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
    Number.isFinite(firstY) &&
    Number.isFinite(secondY) &&
    firstY !== secondY
  ) {
    return (
      firstY -
      secondY
    );
  }


  return 0;
}

);
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
        Number(page.pageNumber) > 0 &&
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
      (
        first,
        second
      ) =>
        first.pageNumber -
        second.pageNumber
    );


if (
  validPages.length === 0
) {
  throw new Error(
    "NAVTA AI received no valid rendered PDF page images."
  );
}


console.log(
  "====================================================="
);

console.log(
  "NAVTA SCREENSHOT DETECTION STARTING"
);

console.log(
  `Pages: ${validPages.length}`
);

console.log(
  "Correct-answer solving: SECOND PASS"
);

console.log(
  "====================================================="
);


const allQuestions =
  [];


for (
  let index = 0;
  index <
  validPages.length;
  index += 1
) {
  const page =
    validPages[index];

  const pageQuestions =
    await analyseSinglePageWithRetry({
      page,

      text:
        cleanString(page?.text) ||
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


return sortQuestionsInPdfOrder(
  removeExactDuplicates(
    allQuestions
  )
);

};

// =====================================================
// DEDICATED SINGLE-QUESTION MCQ SOLVER
// =====================================================
//
// This receives the ALREADY CROPPED original question.
//
// It is intentionally separate from page detection.
//
// Gemini now sees:
//
// ONE question
// ONE set of options
// ONE exact original screenshot
//
// and must actually solve the academic problem.
// =====================================================

const buildSolverPrompt = ({
question = {},
retry = false,
}) => {
const retryText =
retry
? `
This is a retry.

Return ONLY valid JSON.

You must choose the best-supported answer from A, B, C or D if the question is readable and complete.
`
: "";

return `
You are NAVTA AI ANSWER SOLVER.

You are receiving ONE ORIGINAL CROPPED QUESTION IMAGE.

The image contains exactly one academic question and its answer options.

Your task is to ACTUALLY SOLVE the question.

Do not merely search for a printed answer key.

Use:

mathematical calculation

logical reasoning

Physics reasoning

Chemistry reasoning

Biology knowledge

NCERT/JEE/NEET/Boards academic knowledge

every piece of information visible in the screenshot

${retryText}

Subject:
${cleanString(question?.subject) || "Unknown"}

Exam:
${cleanString(question?.exam) || "Unknown"}

Class:
${cleanString(question?.classLevel) || "Unknown"}

Chapter:
${cleanString(question?.chapter) || "Unknown"}

Difficulty:
${cleanString(question?.difficulty) || "Unknown"}

${cleanString(question?.question) || "Read the original screenshot."}

Option A:
${cleanString(question?.options?.[0]) || "Read from screenshot"}

Option B:
${cleanString(question?.options?.[1]) || "Read from screenshot"}

Option C:
${cleanString(question?.options?.[2]) || "Read from screenshot"}

Option D:
${cleanString(question?.options?.[3]) || "Read from screenshot"}

You MUST actively solve the question.

For Maths:

Perform the determinant, matrix, algebra, trigonometry, calculus, probability, vectors or coordinate-geometry calculation when required.

For Physics:

Apply the relevant formulas and physical reasoning.

For Chemistry:

Apply reaction, numerical, inorganic, organic or physical chemistry reasoning.

For Biology:

Use correct biological knowledge and NCERT-level reasoning.

Return:

0 = Option A
1 = Option B
2 = Option C
3 = Option D

Return correctAnswer=null ONLY when:

screenshot is unreadable

an essential part of the question is missing

one or more required options are missing

question genuinely cannot be solved from available information

Do NOT return null merely because:

calculation is long

determinant is large

matrix calculation is required

reasoning requires multiple steps

Return ONLY:

{
"correctAnswer": 0,
"explanation": "",
"confidence": "high"
}

confidence must be:

"high"
"medium"
"low"

No Markdown.
No code fences.
`;
};

// =====================================================
// PARSE SOLVER RESPONSE
// =====================================================

const parseSolverResponse = (
rawResponse
) => {
const result =
tryParseGeminiJson(
rawResponse
);

if (!result.success) {
const error =
new Error(
"NAVTA could not understand the Gemini answer-solver response."
);

error.code =
  "NAVTA_SOLVER_JSON_ERROR";

throw error;

}

const parsed =
result.parsed || {};

return {
correctAnswer:
normalizeCorrectAnswer(
parsed.correctAnswer
),

explanation:
  normalizeAcademicContent(
    parsed.explanation
  ),

confidence:
  ["high", "medium", "low"].includes(
    cleanString(
      parsed.confidence
    ).toLowerCase()
  )
    ? cleanString(
        parsed.confidence
      ).toLowerCase()
    : "medium",

};
};

// =====================================================
// SEND SOLVER REQUEST
// =====================================================

const sendSolverRequest =
async ({
imageBuffer,
question = {},
retry = false,
}) => {
if (!GEMINI_API_KEY) {
throw new Error(
"GEMINI_API_KEY is not configured on the NAVTA backend."
);
}

if (
  !Buffer.isBuffer(
    imageBuffer
  ) ||
  imageBuffer.length === 0
) {
  throw new Error(
    "A valid cropped question screenshot is required for the NAVTA answer solver."
  );
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

                parts: [
                  {
                    text:
                      buildSolverPrompt({
                        question,
                        retry,
                      }),
                  },

                  {
                    text:
                      "The next image is the ORIGINAL cropped NAVTA question. Read the exact question and all four options from this image, then solve it.",
                  },

                  {
                    inlineData: {
                      mimeType:
                        "image/png",

                      data:
                        imageBufferToBase64(
                          imageBuffer
                        ),
                    },
                  },
                ],
              },
            ],

            generationConfig: {
              temperature:
                0.05,

              responseMimeType:
                "application/json",

              maxOutputTokens:
                4096,
            },
          }),
      }
    );


  const responseText =
    await response.text();

  let responseData = {};

  try {
    responseData =
      responseText
        ? JSON.parse(
            responseText
          )
        : {};
  } catch {
    throw new Error(
      "Gemini returned an invalid HTTP response during answer solving."
    );
  }


  if (!response.ok) {
    throw new Error(
      `Gemini answer solver failed. ${extractGeminiError(
        responseData,
        `HTTP ${response.status}`
      )}`
    );
  }


  const modelText =
    extractGeminiText(
      responseData
    );


  if (!modelText) {
    throw new Error(
      "Gemini returned an empty answer-solver response."
    );
  }


  return modelText;
} catch (error) {
  if (
    error?.name ===
    "AbortError"
  ) {
    throw new Error(
      "Gemini answer solver timed out."
    );
  }

  throw error;
} finally {
  clearTimeout(timeout);
}

};

// =====================================================
// PUBLIC QUESTION SCREENSHOT SOLVER
// =====================================================

const solveQuestionFromImage =
async ({
imageBuffer,
question = {},
} = {}) => {
let lastError =
null;

for (
  let attempt = 1;
  attempt <=
  MAX_SOLVER_ATTEMPTS;
  attempt += 1
) {
  try {
    const rawResponse =
      await sendSolverRequest({
        imageBuffer,

        question,

        retry:
          attempt > 1,
      });


    const solution =
      parseSolverResponse(
        rawResponse
      );


    console.log(
      `NAVTA ANSWER SOLVER: Q${cleanString(
        question?.questionNumber
      ) || "?"} answer=${
        solution.correctAnswer
      } confidence=${
        solution.confidence
      }`
    );


    return solution;
  } catch (error) {
    lastError =
      error;

    if (
      attempt >=
      MAX_SOLVER_ATTEMPTS
    ) {
      break;
    }

    console.warn(
      `NAVTA answer solver retrying Q${
        cleanString(
          question?.questionNumber
        ) || "?"
      }.`
    );
  }
}


console.error(
  "NAVTA ANSWER SOLVER FAILED:",
  lastError
);


return {
  correctAnswer:
    null,

  explanation:
    "",

  confidence:
    "low",

  solverError:
    lastError?.message ||
    "NAVTA could not solve this question.",
};

};

// =====================================================
// GEMINI CONNECTION CHECK
// =====================================================

const checkGeminiConnection =
async () => {
if (!GEMINI_API_KEY) {
return {
ok: false,
provider: "gemini",
model: GEMINI_MODEL,
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


  if (!response.ok) {
    return {
      ok: false,
      provider: "gemini",
      model: GEMINI_MODEL,
      status: response.status,
      message:
        `Gemini returned HTTP ${response.status}.`,
    };
  }


  return {
    ok: true,
    provider: "gemini",
    model: GEMINI_MODEL,
    message:
      "NAVTA Gemini connection is available.",
  };
} catch (error) {
  return {
    ok: false,
    provider: "gemini",
    model: GEMINI_MODEL,
    message:
      error?.name ===
      "AbortError"
        ? "Gemini connection check timed out."
        : error?.message ||
          "Gemini connection check failed.",
  };
} finally {
  clearTimeout(timeout);
}

};

// =====================================================
// EXPORTS
// =====================================================
//
// IMPORTANT:
//
// navtaAIImportService.js uses:
// analyseRenderedPages
//
// The NEXT version of navtaAIImportService.js will also
// use:
// solveQuestionFromImage
//
// =====================================================

module.exports = {
analyseNavtaPage,

analyseRenderedPages,

solveQuestionFromImage,

checkGeminiConnection,

checkNavtaAIGatewayConnection:
checkGeminiConnection,

checkOllamaConnection:
checkGeminiConnection,
};
