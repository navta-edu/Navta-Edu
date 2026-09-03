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
// SCREENSHOT-FIRST MODE:
// Every non-dropped question also returns questionBoundingBox.
// The import pipeline can use sourcePage + questionBoundingBox
// to crop ONE complete question screenshot for NAVTA TEST.
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
        /```(?:latex|tex|math|markdown)?/gi,
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

  if (type === "short") {
    return "short";
  }

  if (type === "long") {
    return "long";
  }

  if (type === "mcq") {
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

21. Preserve mathematical expressions accurately.

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
CRITICAL QUESTION SCREENSHOT RULES
=====================================================

NAVTA is switching to SCREENSHOT-FIRST questions.

For EVERY detected academic question, you MUST identify the exact rectangular area of the ORIGINAL PDF page that contains that ONE COMPLETE question.

The question screenshot is what the student will see in NAVTA TEST.

Therefore EVERY detected question MUST return:

"questionBoundingBox": {
  "x": 0.0,
  "y": 0.0,
  "width": 0.0,
  "height": 0.0
}

QUESTION BOUNDING BOX RULES:

1. questionBoundingBox is REQUIRED for every detected question.

2. Coordinates are NORMALIZED to the source PDF page:
   - x = left edge / page width
   - y = top edge / page height
   - width = question crop width / page width
   - height = question crop height / page height

3. Every coordinate must be between 0 and 1.

4. The box must contain exactly ONE complete question.

5. Include the printed question number when visible.

6. Include the full question statement.

7. For MCQ questions, include ALL visible answer options that belong to that question.

8. Include every visual that belongs to the question:
   - diagram
   - graph
   - matrix
   - determinant
   - circuit
   - table
   - chemical structure
   - biological figure
   - ray diagram
   - geometry figure
   - chart
   - apparatus
   - coordinate graph

9. Do NOT crop only the diagram. Crop the complete question.

10. Do NOT include the next question.

11. Do NOT include the previous question.

12. Keep a small safety margin around the printed question so no text is cut off.

13. Avoid page headers, footers, watermarks and unrelated instructions whenever possible.

14. If a question continues onto another page and cannot fit inside one source-page screenshot:
    - use the page where the question begins as sourcePage
    - set drop = true
    - explain in dropReason that a single-question screenshot cannot safely contain the complete question.

15. If the exact question boundary cannot be identified reliably:
    - set drop = true
    - explain why in dropReason.

16. Text extraction remains useful for:
    - subject
    - exam
    - classLevel
    - chapter
    - difficulty
    - questionType
    - correctAnswer
    - explanation
    - modelAnswer
    - keyPoints

But the STUDENT-FACING question will use the cropped screenshot from questionBoundingBox.

17. Never invent questionBoundingBox coordinates.

18. Before returning JSON, verify that every non-dropped question has a valid questionBoundingBox.

=====================================================
CRITICAL ACADEMIC FORMATTING RULES
=====================================================

NAVTA renders academic content with KaTeX.

EVERY returned question, option, explanation, modelAnswer and keyPoint MUST follow these formatting rules.


=====================================================
A. NORMAL PROSE
=====================================================

Keep ordinary English words as ordinary text.

Do NOT put complete paragraphs inside LaTeX.


=====================================================
B. INLINE MATHEMATICS
=====================================================

Every mathematical expression inside a sentence MUST be enclosed in single dollar delimiters.

Correct:

Let $\alpha$, $\beta$ and $\gamma$ be the roots of
$x^3 + ax^2 + bx + c = 0$.

Incorrect:

Let \alpha, \beta and \gamma be the roots of
x^3 + ax^2 + bx + c = 0.

Never return raw LaTeX commands such as:

\alpha
\beta
\gamma
\lambda
\frac
\sqrt
\sin
\cos
\theta

outside a valid $...$ or $$...$$ math block.


=====================================================
C. DISPLAY EQUATIONS
=====================================================

A complete equation or multi-line equation that should appear on its own line MUST use double dollar delimiters.

Example:

$$
\alpha x + \beta y + \gamma z = 0
$$

For a system of equations:

$$
\begin{aligned}
\alpha x + \beta y + \gamma z &= 0 \\
\beta x + \gamma y + \alpha z &= 0 \\
\gamma x + \alpha y + \beta z &= 0
\end{aligned}
$$


=====================================================
D. MATRICES
=====================================================

Matrices MUST use valid LaTeX matrix environments inside $$...$$.

Example:

$$
A =
\begin{bmatrix}
\sin^2\alpha & 0 & 0 \\
0 & \sin^2\beta & 0 \\
0 & 0 & \sin^2\gamma
\end{bmatrix}
$$

Do NOT return the words:

\begin{bmatrix}

or:

\end{bmatrix}

as ordinary visible text.


=====================================================
E. DETERMINANTS
=====================================================

Determinants MUST use vmatrix inside a display block.

Example:

$$
\begin{vmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{vmatrix}
$$


=====================================================
F. FRACTIONS, ROOTS, POWERS AND SUBSCRIPTS
=====================================================

Use valid LaTeX.

Examples:

$\frac{GMm}{r^2}$

$\sqrt{x^2+y^2}$

$a^3 = 27c$

$x_1 + x_2$


=====================================================
G. PHYSICS
=====================================================

Return physical equations as valid LaTeX.

Examples:

$F = ma$

$E = mc^2$

$V = IR$

$P = VI$

$F = \frac{GMm}{r^2}$

$\vec{F} = q(\vec{E} + \vec{v}\times\vec{B})$

$$
s = ut + \frac{1}{2}at^2
$$

$$
v^2 = u^2 + 2as
$$

Preserve:

- vectors
- Greek symbols
- subscripts
- superscripts
- fractions
- integrals
- derivatives
- units
- scientific notation


=====================================================
H. CHEMISTRY
=====================================================

Chemical formulae MUST preserve proper subscripts,
superscripts, charges and reaction arrows.

Examples:

$\mathrm{H_2O}$

$\mathrm{CO_2}$

$\mathrm{H_2SO_4}$

$\mathrm{NH_3}$

$\mathrm{CH_4}$

$\mathrm{Fe^{3+}}$

$\mathrm{SO_4^{2-}}$

$\mathrm{NH_4^+}$

$\Delta H$

Chemical reactions should use valid formatting.

Example:

$$
\mathrm{2H_2 + O_2 \rightarrow 2H_2O}
$$

Example:

$$
\mathrm{CaCO_3 \rightarrow CaO + CO_2}
$$

Preserve:

- reaction arrows
- coefficients
- subscripts
- superscripts
- ionic charges


=====================================================
I. BIOLOGY
=====================================================

Normal Biology terminology remains normal text.

Scientific formulae and mathematical expressions must be formatted correctly.

Examples:

$\mathrm{O_2}$

$\mathrm{CO_2}$

$\mathrm{C_6H_{12}O_6}$

$\mathrm{ATP}$

$\mathrm{NADH}$

Example:

$$
\mathrm{6CO_2 + 6H_2O \rightarrow C_6H_{12}O_6 + 6O_2}
$$


=====================================================
J. OPTIONS
=====================================================

Apply the SAME formatting rules to every MCQ option.

Incorrect:

a^3 = 27c

Correct:

"$a^3 = 27c$"

Incorrect:

\alpha + \beta + \gamma = 0

Correct:

"$\alpha + \beta + \gamma = 0$"


=====================================================
K. NO BROKEN DELIMITERS
=====================================================

Never return an unmatched single $.

Never return:

$A =

without the matching closing $.

Never place a $$ block inside a $...$ block.

Never leave:

\begin{bmatrix}

without:

\end{bmatrix}

Never leave:

\begin{vmatrix}

without:

\end{vmatrix}


=====================================================
L. VISUAL QUESTIONS
=====================================================

If the printed question depends on an actual:

- graph
- circuit
- geometry figure
- biological diagram
- chemical structure
- ray diagram
- apparatus
- coordinate graph
- chart
- labelled figure
- required table

DO NOT replace that visual with invented text.

DO NOT invent ASCII art.

DO NOT describe the visual as a replacement for displaying it.

Use:

hasVisual = true

Return the correct:

visualBoundingBox

and:

sourcePage

NAVTA will crop the ORIGINAL visual from the PDF page.


=====================================================
M. FINAL FORMATTING CHECK
=====================================================

Before returning JSON, verify every question and every option:

- contains no visible raw LaTeX command outside math delimiters
- contains no unmatched $ delimiter
- contains valid matrix/determinant environments
- preserves all mathematical symbols
- preserves all Physics notation
- preserves Chemistry subscripts/superscripts/reactions
- preserves Biology scientific formulae
- uses the original required visual when the question depends on a figure


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
  "questionBoundingBox": null,
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

6. Confirm every non-dropped question has a valid questionBoundingBox that contains exactly one complete question and its options/required visual.

7. Confirm no questionBoundingBox includes the next or previous question.

8. Confirm sourcePage is one of these supplied PDF page numbers:

${pageNumbers.join(", ")}


Return:

{
  "questions": [...]
}

Return JSON only.
`;
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
// NORMALIZE VISUAL BOUNDING BOX
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
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
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
// NORMALIZE QUESTION SCREENSHOT BOX
// =====================================================

const normalizeQuestionBoundingBox = (
  value
) => {
  return normalizeVisualBoundingBox(
    value
  );
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
    Number.isInteger(
      item?.correctAnswer
    ) &&
    item.correctAnswer >= 0 &&
    item.correctAnswer <= 3
  ) {
    correctAnswer =
      item.correctAnswer;
  } else if (
    typeof item?.correctAnswer ===
    "string"
  ) {
    const answer =
      item.correctAnswer
        .trim()
        .toUpperCase();

    const answerMap = {
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
        answerMap,
        answer
      )
    ) {
      correctAnswer =
        answerMap[
          answer
        ];
    }
  }


  const requestedSourcePage =
    Number(
      item?.sourcePage
    );


  const validPageSet =
    new Set(
      safeArray(
        validPageNumbers
      )
        .map(
          (number) =>
            Number(
              number
            )
        )
        .filter(
          (number) =>
            Number.isFinite(
              number
            )
        )
    );


  const sourcePage =
    Number.isFinite(
      requestedSourcePage
    ) &&
    (
      validPageSet.size ===
        0 ||
      validPageSet.has(
        requestedSourcePage
      )
    )
      ? requestedSourcePage
      : Number(
          fallbackPageNumber
        );


  const questionBoundingBox =
    normalizeQuestionBoundingBox(
      item?.questionBoundingBox
    );


  const visualBoundingBox =
    normalizeVisualBoundingBox(
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


  if (
    !questionBoundingBox &&
    !dropReason
  ) {
    dropReason =
      "The complete one-question screenshot boundary could not be identified safely.";
  }


  if (
    requestedVisual &&
    !visualBoundingBox &&
    !dropReason
  ) {
    dropReason =
      "A required visual was detected but its bounding box could not be identified.";
  }


  if (
    !Number.isFinite(
      sourcePage
    ) &&
    !dropReason
  ) {
    dropReason =
      "The source PDF page could not be identified.";
  }


  const hasVisual =
    requestedVisual &&
    Boolean(
      visualBoundingBox
    );


  const normalizedOptions =
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


  const normalizedKeyPoints =
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
      undefined &&
    Number.isFinite(
      Number(
        item.maxMarks
      )
    )
  ) {
    maxMarks =
      Number(
        item.maxMarks
      );
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

    questionType,

    options:
      normalizedOptions,

    correctAnswer,

    modelAnswer:
      normalizeAcademicContent(
        item?.modelAnswer
      ),

    keyPoints:
      normalizedKeyPoints,

    maxMarks,

    explanation:
      normalizeAcademicContent(
        item?.explanation
      ),

    questionBoundingBox,

    hasVisual,

    visualDescription:
      cleanString(
        item?.visualDescription
      ),

    visualBoundingBox,

    sourcePage,

    drop:
      drop ||
      !questionBoundingBox ||
      (
        requestedVisual &&
        !visualBoundingBox
      ),

    dropReason,
  };
};


// =====================================================
// GEMINI REQUEST
// =====================================================

const callGemini = async ({
  pages = [],
  text = "",
  hints = {},
}) => {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the NAVTA backend."
    );
  }


  if (
    !Array.isArray(
      pages
    ) ||
    pages.length === 0
  ) {
    throw new Error(
      "No rendered PDF pages were supplied to NAVTA AI."
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
    const parts = [
      {
        text:
          SYSTEM_PROMPT,
      },

      {
        text:
          buildBatchPrompt({
            pages,
            text,
            hints,
          }),
      },
    ];


    for (
      const page of
      pages
    ) {
      const pageNumber =
        Number(
          page?.pageNumber
        );


      if (
        !Buffer.isBuffer(
          page?.buffer
        ) ||
        page.buffer.length === 0
      ) {
        throw new Error(
          `Rendered PDF page ${pageNumber || "unknown"} does not contain a valid image buffer.`
        );
      }


      parts.push({
        text:
          `The next image is ORIGINAL PDF PAGE ${pageNumber}. Analyse the complete page from top to bottom.`,
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


    const url =
      `${GEMINI_API_BASE}/models/${encodeURIComponent(
        GEMINI_MODEL
      )}:generateContent?key=${encodeURIComponent(
        GEMINI_API_KEY
      )}`;


    const response =
      await fetch(
        url,
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

          signal:
            controller.signal,
        }
      );


    const rawText =
      await response.text();


    let responseData =
      null;


    try {
      responseData =
        rawText
          ? JSON.parse(
              rawText
            )
          : null;
    } catch {
      responseData =
        null;
    }


    if (!response.ok) {
      const apiMessage =
        responseData?.error
          ?.message ||
        rawText ||
        `Gemini returned HTTP ${response.status}.`;


      throw new Error(
        `NAVTA Gemini request failed: ${apiMessage}`
      );
    }


    const candidates =
      safeArray(
        responseData?.candidates
      );


    if (
      candidates.length === 0
    ) {
      throw new Error(
        "Gemini returned no analysis candidate."
      );
    }


    const candidateParts =
      safeArray(
        candidates[0]
          ?.content
          ?.parts
      );


    const modelText =
      candidateParts
        .map(
          (part) =>
            cleanString(
              part?.text
            )
        )
        .filter(
          Boolean
        )
        .join(
          "\n"
        )
        .trim();


    if (!modelText) {
      throw new Error(
        "Gemini returned an empty question analysis."
      );
    }


    return modelText;
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      throw new Error(
        `NAVTA Gemini request timed out after ${NAVTA_AI_TIMEOUT_MS} ms.`
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
// PARSE GEMINI RESPONSE
// =====================================================

const parseGeminiQuestions = ({
  rawResponse,
  pages = [],
}) => {
  const cleaned =
    cleanJsonResponse(
      rawResponse
    );


  let parsed;


  try {
    parsed =
      JSON.parse(
        cleaned
      );
  } catch (error) {
    console.error(
      "NAVTA GEMINI JSON PARSE ERROR:",
      error
    );

    console.error(
      "NAVTA GEMINI RAW RESPONSE:",
      cleaned.slice(
        0,
        5000
      )
    );

    throw new Error(
      "NAVTA could not understand the Gemini JSON response for pages " +
        pages
          .map(
            (page) =>
              page?.pageNumber
          )
          .filter(
            Boolean
          )
          .join(
            ", "
          ) +
        "."
    );
  }


  const questions =
    Array.isArray(
      parsed
    )
      ? parsed
      : safeArray(
          parsed?.questions
        );


  const validPageNumbers =
    pages
      .map(
        (page) =>
          Number(
            page?.pageNumber
          )
      )
      .filter(
        (number) =>
          Number.isFinite(
            number
          )
      );


  const fallbackPageNumber =
    validPageNumbers[0] ||
    null;


  return questions
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
          fallbackPageNumber,
          validPageNumbers,
        })
    );
};


// =====================================================
// ANALYSE ONE PAGE
// =====================================================

const analyseNavtaPage = async ({
  page,
  text = "",
  hints = {},
}) => {
  if (!page) {
    throw new Error(
      "A rendered PDF page is required."
    );
  }


  const rawResponse =
    await callGemini({
      pages: [
        page,
      ],

      text,

      hints,
    });


  return parseGeminiQuestions({
    rawResponse,

    pages: [
      page,
    ],
  });
};


// =====================================================
// SPLIT PAGES INTO 5-PAGE BATCHES
// =====================================================

const createPageBatches = (
  pages = []
) => {
  const batches = [];


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
// ANALYSE RENDERED PDF PAGES
// =====================================================
//
// IMPORTANT:
//
// This is the function imported by:
//
// backend/services/navtaAIImportService.js
//
// Do not rename it unless the import service is also
// changed.
//
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
      pages.length === 0
    ) {
      return [];
    }


    const orderedPages =
      [...pages]
        .filter(
          (page) =>
            page &&
            Buffer.isBuffer(
              page.buffer
            ) &&
            page.buffer.length >
              0
        )
        .sort(
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


    if (
      orderedPages.length ===
      0
    ) {
      throw new Error(
        "NAVTA AI received no valid rendered PDF page images."
      );
    }


    const batches =
      createPageBatches(
        orderedPages
      );


    const allQuestions =
      [];


    // =============================================
    // PROCESS EACH 5-PAGE BATCH SEQUENTIALLY
    // =============================================
    //
    // We intentionally use await inside this loop.
    //
    // This means:
    //
    // pages 1-5 finish first
    // then pages 6-10
    // then pages 11-15
    // etc.
    //
    // This prevents all Gemini requests from firing
    // simultaneously and reduces quota/memory pressure.
    // =============================================

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


      const batchPageNumbers =
        batch
          .map(
            (page) =>
              Number(
                page.pageNumber
              )
          )
          .filter(
            Number.isFinite
          );


      console.log(
        `NAVTA AI analysing PDF pages ${batchPageNumbers.join(
          ", "
        )}`
      );


      const rawResponse =
        await callGemini({
          pages:
            batch,

          text,

          hints,
        });


      const batchQuestions =
        parseGeminiQuestions({
          rawResponse,

          pages:
            batch,
        });


      allQuestions.push(
        ...batchQuestions
      );


      console.log(
        `NAVTA AI completed pages ${batchPageNumbers.join(
          ", "
        )}: ${batchQuestions.length} question(s) detected.`
      );
    }


    // =============================================
    // SORT BY SOURCE PAGE
    // =============================================

    allQuestions.sort(
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


        const firstNumber =
          Number.parseInt(
            String(
              first
                ?.questionNumber ||
                ""
            ).replace(
              /\D+/g,
              ""
            ),
            10
          );


        const secondNumber =
          Number.parseInt(
            String(
              second
                ?.questionNumber ||
                ""
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


    return allQuestions;
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
        Math.min(
          NAVTA_AI_TIMEOUT_MS,
          30000
        )
      );


    try {
      const url =
        `${GEMINI_API_BASE}/models/${encodeURIComponent(
          GEMINI_MODEL
        )}?key=${encodeURIComponent(
          GEMINI_API_KEY
        )}`;


      const response =
        await fetch(
          url,
          {
            method:
              "GET",

            signal:
              controller.signal,
          }
        );


      const rawText =
        await response.text();


      let data =
        null;


      try {
        data =
          rawText
            ? JSON.parse(
                rawText
              )
            : null;
      } catch {
        data =
          null;
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
            data?.error
              ?.message ||
            rawText ||
            "Gemini connection check failed.",
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
          "Gemini connection is available.",
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
            : (
                error?.message ||
                "Gemini connection check failed."
              ),
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
// navtaAIImportService.js imports:
//
// const {
//   analyseRenderedPages,
// } = require("./navtaAIQuestionService");
//
// Therefore analyseRenderedPages MUST remain exported.
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
