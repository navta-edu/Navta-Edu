// =====================================================
// NAVTA TEST QUESTION BANK FOR PAPER BUILDER
// =====================================================

exports.getQuestionBank = async (req, res) => {
  try {
    const {
      subject,
      exam,
      classLevel,
      chapter,
      difficulty,
      questionType,
      search
    } = req.query;

    // -------------------------------------------------
    // FILTER USED FOR CHAPTER DISCOVERY
    // IMPORTANT:
    // Chapter itself is NOT included here because
    // we need all chapters for selected Subject/Exam/Class.
    // -------------------------------------------------

    const chapterFilter = {
      isActive: true
    };

    if (subject) {
      chapterFilter.subject = subject;
    }

    if (exam) {
      chapterFilter.exam = exam;
    }

    if (classLevel) {
      chapterFilter.classLevel = classLevel;
    }

    // -------------------------------------------------
    // GET AVAILABLE CHAPTERS AUTOMATICALLY
    // FROM NAVTA TEST QUESTION COLLECTION
    // -------------------------------------------------

    const chapterDocuments =
      await NavtaQuestion.find(
        chapterFilter
      )
        .select('chapter')
        .lean();

    const chapters = [
      ...new Set(
        chapterDocuments
          .map((item) => item.chapter)
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b)
    );

    // -------------------------------------------------
    // QUESTION FILTER
    // -------------------------------------------------

    const filter = {
      ...chapterFilter
    };

    if (chapter) {
      filter.chapter = chapter;
    }

    if (difficulty) {
      filter.difficulty =
        difficulty;
    }

    if (questionType) {
      const type =
        String(questionType)
          .trim()
          .toLowerCase();

      // Support different old/new stored values
      if (type === 'mcq') {
        filter.$or = [
          {
            questionType: 'mcq'
          },
          {
            questionType: 'MCQ'
          },
          {
            questionType: {
              $exists: false
            }
          },
          {
            questionType: ''
          }
        ];
      } else if (type === 'short') {
        filter.questionType = {
          $in: [
            'short',
            'Short',
            'short_answer',
            'short-answer',
            'short answer'
          ]
        };
      } else if (type === 'long') {
        filter.questionType = {
          $in: [
            'long',
            'Long',
            'long_answer',
            'long-answer',
            'long answer'
          ]
        };
      }
    }

    if (
      search &&
      String(search).trim()
    ) {
      const searchRegex =
        new RegExp(
          String(search).trim(),
          'i'
        );

      // If $or already exists for MCQ,
      // combine conditions safely with $and.
      if (filter.$or) {
        const existingOr =
          filter.$or;

        delete filter.$or;

        filter.$and = [
          {
            $or: existingOr
          },
          {
            $or: [
              {
                question:
                  searchRegex
              },
              {
                chapter:
                  searchRegex
              }
            ]
          }
        ];
      } else {
        filter.$or = [
          {
            question:
              searchRegex
          },
          {
            chapter:
              searchRegex
          }
        ];
      }
    }

    // -------------------------------------------------
    // FETCH QUESTIONS
    // -------------------------------------------------

    const questions =
      await NavtaQuestion.find(
        filter
      )
        .sort({
          createdAt: -1
        })
        .lean();

    // -------------------------------------------------
    // FORMAT QUESTION TYPE
    // -------------------------------------------------

    const formattedQuestions =
      questions.map(
        (question) => {
          let type =
            question.questionType ||
            'mcq';

          type = String(type)
            .trim()
            .toLowerCase();

          if (
            [
              'short answer',
              'short-answer',
              'short_answer'
            ].includes(type)
          ) {
            type = 'short';
          }

          if (
            [
              'long answer',
              'long-answer',
              'long_answer'
            ].includes(type)
          ) {
            type = 'long';
          }

          if (
            ![
              'mcq',
              'short',
              'long'
            ].includes(type)
          ) {
            type = 'mcq';
          }

          let defaultMarks =
            Number(
              question.maxMarks
            );

          if (
            !Number.isFinite(
              defaultMarks
            ) ||
            defaultMarks <= 0
          ) {
            defaultMarks =
              type === 'long'
                ? 5
                : type === 'short'
                  ? 3
                  : 1;
          }

          return {
            _id:
              question._id,

            subject:
              question.subject,

            exam:
              question.exam,

            classLevel:
              question.classLevel,

            chapter:
              question.chapter,

            difficulty:
              question.difficulty,

            questionType:
              type,

            question:
              question.question,

            options:
              Array.isArray(
                question.options
              )
                ? question.options
                : [],

            maxMarks:
              defaultMarks,

            source:
              'NAVTA Admin Bank'
          };
        }
      );

    return res.status(200).json({
      success: true,

      count:
        formattedQuestions.length,

      questions:
        formattedQuestions,

      // NEW
      chapters
    });
  } catch (error) {
    console.error(
      'GET NAVTA QUESTION BANK ERROR:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to load NAVTA question bank.',
      error:
        error.message
    });
  }
};
