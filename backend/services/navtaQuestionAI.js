const OpenAI = require('openai');

const navtaChapters =
  require('../config/navtaChapters');

// =====================================================
// OPENAI CLIENT
// =====================================================

const openai =
  new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY
  });

// =====================================================
// HELPERS
// =====================================================

function buildAllowedChapterText() {
  const lines = [];

  for (const [
    subject,
    classes
  ] of Object.entries(
    navtaChapters
  )) {
    for (const [
      classLevel,
      chapters
    ] of Object.entries(
      classes
    )) {
      lines.push(
        `${subject} | ${classLevel}:`
      );

      for (
        const chapter
        of chapters
      ) {
        lines.push(
          `- ${chapter}`
        );
      }

      lines.push('');
    }
  }

  return lines.join('\n');
}

function normalizeQuestionType(
  value
) {
  if (!value) {
    return 'mcq';
  }

  const type =
    String(value)
      .trim()
      .toLowerCase();

  if (
    [
      'short',
      'short answer',
      'short-answer',
      'short_answer'
    ].includes(type)
  ) {
    return 'short';
  }

  if (
    [
      'long',
      'long answer',
      'long-answer',
      'long_answer'
    ].includes(type)
  ) {
    return 'long';
  }

  return 'mcq';
}

function normalizeDifficulty(
  value
) {
  const difficulty =
    String(value || '')
      .trim()
      .toLowerCase();

  if (
    difficulty === 'easy'
  ) {
    return 'Easy';
  }

  if (
    difficulty === 'hard'
  ) {
    return 'Hard';
  }

  return 'Medium';
}

function normalizeClassLevel(
  value
) {
  const text =
    String(value || '')
      .toLowerCase();

  if (
    text.includes('11')
  ) {
    return 'Class 11';
  }

  if (
    text.includes('12')
  ) {
    return 'Class 12';
  }

  return '';
}

function normalizeSubject(
  value
) {
  const subject =
    String(value || '')
      .trim()
      .toLowerCase();

  if (
    subject === 'physics'
  ) {
    return 'Physics';
  }

  if (
    subject === 'chemistry'
  ) {
    return 'Chemistry';
  }

  if (
    subject === 'maths' ||
    subject ===
      'mathematics'
  ) {
    return 'Maths';
  }

  if (
    subject === 'biology'
  ) {
    return 'Biology';
  }

  return '';
}

function normalizeExam(
  value
) {
  const exam =
    String(value || '')
      .trim()
      .toLowerCase();

  if (
    exam.includes('neet')
  ) {
    return 'NEET';
  }

  if (
    exam.includes('jee')
  ) {
    return 'JEE';
  }

  if (
    exam.includes('board')
  ) {
    return 'Boards';
  }

  return '';
}

function isApprovedChapter(
  subject,
  classLevel,
  chapter
) {
  if (
    !subject ||
    !classLevel ||
    !chapter
  ) {
    return false;
  }

  const chapters =
    navtaChapters?.[
      subject
    ]?.[
      classLevel
    ];

  if (
    !Array.isArray(
      chapters
    )
  ) {
    return false;
  }

  return chapters.includes(
    chapter
  );
}

// =====================================================
// MAIN AI FUNCTION
// =====================================================

async function analyzeNavtaQuestions({
  text,
  context = {}
}) {
  if (
    !text ||
    !String(text).trim()
  ) {
    throw new Error(
      'No text was extracted from the uploaded file.'
    );
  }

  const approvedChapters =
    buildAllowedChapterText();

  const systemPrompt = `
You are the NAVTA Question Classification Engine.

Your job is to analyze academic questions extracted from uploaded files and convert them into structured NAVTA question objects.

NAVTA supports ONLY:
Subjects:
- Physics
- Chemistry
- Maths
- Biology

Classes:
- Class 11
- Class 12

Exams:
- NEET
- JEE
- Boards

Difficulties:
- Easy
- Medium
- Hard

Question types:
- mcq
- short
- long

VERY IMPORTANT RULES:

1. You MUST choose the chapter only from the APPROVED NAVTA CHAPTER LIST provided below.
2. Never invent a chapter name.
3. If a question does not clearly belong to any approved chapter, set:
   "drop": true
   "dropReason": "No matching NAVTA chapter"
4. If subject cannot be confidently identified, drop it.
5. If class cannot be confidently identified, drop it.
6. If the question is outside Physics, Chemistry, Maths, or Biology, drop it.
7. If the question text is incomplete or unusable, drop it.
8. For MCQs:
   - extract answer options
   - determine correctAnswer as ZERO-BASED INDEX
   - generate an explanation
   - if correct answer cannot be determined reliably, drop it
9. For Boards short-answer questions:
   - questionType = "short"
   - maxMarks should usually be 2 or 3
   - generate modelAnswer
   - generate keyPoints
   - generate explanation
10. For Boards long-answer questions:
   - questionType = "long"
   - maxMarks should usually be 5 or 6
   - generate modelAnswer
   - generate keyPoints
   - generate explanation
11. Difficulty rules:
   Easy:
   - direct recall
   - definition
   - one-step calculation
   Medium:
   - concept application
   - multi-step but standard
   Hard:
   - multi-concept
   - tricky reasoning
   - lengthy derivation
12. Prefer exact chapter names from the approved list.
13. Return JSON only.
14. Do not include markdown fences.
15. Every detected question must appear either as accepted or dropped.

APPROVED NAVTA CHAPTER LIST:

${approvedChapters}
`;

  const userPrompt = `
Analyze the following extracted text and return a JSON object with this exact shape:

{
  "questions": [
    {
      "subject": "Physics",
      "exam": "JEE",
      "classLevel": "Class 12",
      "chapter": "Current Electricity",
      "difficulty": "Medium",
      "questionType": "mcq",

      "question": "Question text",

      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],

      "correctAnswer": 1,

      "explanation": "Clear explanation",

      "modelAnswer": "",
      "keyPoints": [],
      "maxMarks": 1,

      "chapterConfidence": 0.95,
      "difficultyConfidence": 0.85,

      "drop": false,
      "dropReason": ""
    }
  ]
}

Use these optional hints if useful:

Subject hint:
${context.subject || 'Auto detect'}

Exam hint:
${context.exam || 'Auto detect'}

Class hint:
${context.classLevel || 'Auto detect'}

FILE TEXT:

${text}
`;

  const response =
    await openai.responses.create({
      model: 'gpt-5.6-mini',

      input: [
        {
          role: 'system',
          content:
            systemPrompt
        },
        {
          role: 'user',
          content:
            userPrompt
        }
      ],

      text: {
        format: {
          type:
            'json_object'
        }
      }
    });

  const raw =
    response.output_text;

  if (!raw) {
    throw new Error(
      'AI returned an empty response.'
    );
  }

  let parsed;

  try {
    parsed =
      JSON.parse(raw);
  } catch (error) {
    console.error(
      'AI RAW RESPONSE:',
      raw
    );

    throw new Error(
      'AI returned invalid JSON.'
    );
  }

  const rawQuestions =
    Array.isArray(
      parsed.questions
    )
      ? parsed.questions
      : [];

  // ===================================================
  // SERVER-SIDE VALIDATION
  // Never trust AI output blindly.
  // ===================================================

  const validatedQuestions =
    rawQuestions.map(
      (item) => {
        const subject =
          normalizeSubject(
            item.subject
          );

        const classLevel =
          normalizeClassLevel(
            item.classLevel
          );

        const exam =
          normalizeExam(
            item.exam
          );

        const questionType =
          normalizeQuestionType(
            item.questionType
          );

        const difficulty =
          normalizeDifficulty(
            item.difficulty
          );

        const question =
          String(
            item.question || ''
          ).trim();

        const chapter =
          String(
            item.chapter || ''
          ).trim();

        const options =
          Array.isArray(
            item.options
          )
            ? item.options
                .map(
                  (option) =>
                    String(
                      option || ''
                    ).trim()
                )
                .filter(Boolean)
            : [];

        let correctAnswer =
          Number(
            item.correctAnswer
          );

        const explanation =
          String(
            item.explanation || ''
          ).trim();

        const modelAnswer =
          String(
            item.modelAnswer || ''
          ).trim();

        const keyPoints =
          Array.isArray(
            item.keyPoints
          )
            ? item.keyPoints
                .map(
                  (point) =>
                    String(
                      point || ''
                    ).trim()
                )
                .filter(Boolean)
            : [];

        let maxMarks =
          Number(
            item.maxMarks
          );

        const chapterConfidence =
          Number(
            item.chapterConfidence
          ) || 0;

        const difficultyConfidence =
          Number(
            item.difficultyConfidence
          ) || 0;

        let drop =
          Boolean(item.drop);

        let dropReason =
          String(
            item.dropReason || ''
          ).trim();

        // ===============================================
        // REQUIRED VALIDATION
        // ===============================================

        if (!question) {
          drop = true;

          dropReason =
            dropReason ||
            'Question text is empty or incomplete.';
        }

        if (!subject) {
          drop = true;

          dropReason =
            dropReason ||
            'Unsupported or unknown subject.';
        }

        if (!classLevel) {
          drop = true;

          dropReason =
            dropReason ||
            'Unable to determine class level.';
        }

        if (!exam) {
          drop = true;

          dropReason =
            dropReason ||
            'Unable to determine exam type.';
        }

        // ===============================================
        // CHAPTER VALIDATION
        // ===============================================

        if (
          !isApprovedChapter(
            subject,
            classLevel,
            chapter
          )
        ) {
          drop = true;

          dropReason =
            dropReason ||
            'No matching NAVTA chapter.';
        }

        // ===============================================
        // LOW CHAPTER CONFIDENCE
        // ===============================================

        if (
          chapterConfidence > 0 &&
          chapterConfidence < 0.7
        ) {
          drop = true;

          dropReason =
            dropReason ||
            'Chapter classification confidence is too low.';
        }

        // ===============================================
        // MCQ VALIDATION
        // ===============================================

        if (
          questionType === 'mcq'
        ) {
          if (
            options.length !== 4
          ) {
            drop = true;

            dropReason =
              dropReason ||
              'MCQ does not contain exactly four valid options.';
          }

          if (
            !Number.isInteger(
              correctAnswer
            ) ||
            correctAnswer < 0 ||
            correctAnswer > 3
          ) {
            drop = true;

            dropReason =
              dropReason ||
              'Correct MCQ answer could not be determined.';
          }

          maxMarks = 1;
        }

        // ===============================================
        // SHORT ANSWER
        // ===============================================

        if (
          questionType === 'short'
        ) {
          if (
            !Number.isFinite(
              maxMarks
            ) ||
            maxMarks <= 0
          ) {
            maxMarks = 3;
          }

          correctAnswer =
            undefined;
        }

        // ===============================================
        // LONG ANSWER
        // ===============================================

        if (
          questionType === 'long'
        ) {
          if (
            !Number.isFinite(
              maxMarks
            ) ||
            maxMarks <= 0
          ) {
            maxMarks = 5;
          }

          correctAnswer =
            undefined;
        }

        return {
          subject,
          exam,
          classLevel,
          chapter,
          difficulty,
          questionType,

          question,

          options:
            questionType ===
            'mcq'
              ? options
              : [],

          correctAnswer:
            questionType ===
            'mcq'
              ? correctAnswer
              : undefined,

          explanation,

          modelAnswer,

          keyPoints,

          maxMarks,

          chapterConfidence,

          difficultyConfidence,

          drop,

          dropReason
        };
      }
    );

  const acceptedQuestions =
    validatedQuestions.filter(
      (question) =>
        !question.drop
    );

  const droppedQuestions =
    validatedQuestions.filter(
      (question) =>
        question.drop
    );

  return {
    detected:
      validatedQuestions.length,

    acceptedCount:
      acceptedQuestions.length,

    droppedCount:
      droppedQuestions.length,

    acceptedQuestions,

    droppedQuestions
  };
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  analyzeNavtaQuestions
};
