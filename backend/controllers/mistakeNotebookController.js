const mongoose = require("mongoose");

const MistakeNotebook = require(
  "../models/MistakeNotebook"
);

const NavtaQuestion = require(
  "../models/NavtaQuestion"
);

// ============================================
// HELPERS
// ============================================

const getStudentId = (req) => {
  return (
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    null
  );
};

const isValidObjectId = (id) => {
  return mongoose.isValidObjectId(id);
};

const toObjectId = (id) => {
  if (
    id instanceof
    mongoose.Types.ObjectId
  ) {
    return id;
  }

  return new mongoose.Types.ObjectId(
    String(id)
  );
};

// ============================================
// SAVE MISTAKE
// POST /api/mistake-notebook
// ============================================

exports.saveMistake = async (
  req,
  res
) => {
  try {
    const studentId =
      getStudentId(req);

    if (!studentId) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authentication required.",
        });
    }

    const {
      questionId,
      selectedAnswer = null,
      note = "",
      source = "standard",
    } = req.body || {};

    if (!questionId) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Question ID is required.",
        });
    }

    if (
      !isValidObjectId(
        questionId
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid question ID.",
        });
    }

    const allowedSources = [
      "standard",
      "boss",
      "revenge",
    ];

    if (
      !allowedSources.includes(
        source
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid mistake source.",
        });
    }

    // ========================================
    // FIND ORIGINAL QUESTION
    // ========================================

    const question =
      await NavtaQuestion.findById(
        questionId
      );

    if (!question) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Question not found.",
        });
    }

    // ========================================
    // VERIFY INCORRECT MCQ ANSWER
    // ========================================

    if (
      selectedAnswer !== null &&
      selectedAnswer !== undefined
    ) {
      const answerNumber =
        Number(
          selectedAnswer
        );

      if (
        !Number.isInteger(
          answerNumber
        ) ||
        answerNumber < 0 ||
        answerNumber > 3
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid selected answer.",
          });
      }

      if (
        answerNumber ===
        Number(
          question.correctAnswer
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Correct questions cannot be added as mistakes.",
          });
      }
    }

    // ========================================
    // PREPARE UPDATE
    // ========================================

    const update = {
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

      source,

      correctAnswer:
        Number(
          question.correctAnswer
        ),

      note:
        typeof note ===
        "string"
          ? note.trim()
          : "",

      isMastered: false,
    };

    if (
      selectedAnswer !== null &&
      selectedAnswer !== undefined
    ) {
      update.selectedAnswer =
        Number(
          selectedAnswer
        );
    }

    // ========================================
    // CREATE OR UPDATE
    // ========================================

    const mistake =
      await MistakeNotebook
        .findOneAndUpdate(
          {
            student:
              studentId,

            question:
              question._id,
          },

          {
            $set: update,

            $setOnInsert: {
              student:
                studentId,

              question:
                question._id,

              reviewCount: 0,

              lastReviewedAt:
                null,
            },
          },

          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert:
              true,
          }
        );

    return res
      .status(200)
      .json({
        success: true,

        message:
          "Question saved to Mistake Notebook.",

        mistake,
      });
  } catch (error) {
    console.error(
      "Save Mistake Notebook Error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          "Unable to save question to Mistake Notebook.",
      });
  }
};

// ============================================
// GET ALL MISTAKES
// GET /api/mistake-notebook
// ============================================

exports.getMistakes = async (
  req,
  res
) => {
  try {
    const studentId =
      getStudentId(req);

    if (!studentId) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authentication required.",
        });
    }

    const {
      subject,
      chapter,
      difficulty,
      source,
      mastered,
    } = req.query || {};

    const filter = {
      student:
        studentId,
    };

    if (subject) {
      filter.subject =
        subject;
    }

    if (chapter) {
      filter.chapter =
        chapter;
    }

    if (difficulty) {
      filter.difficulty =
        difficulty;
    }

    if (source) {
      filter.source =
        source;
    }

    if (
      mastered === "true"
    ) {
      filter.isMastered =
        true;
    }

    if (
      mastered === "false"
    ) {
      filter.isMastered =
        false;
    }

    const mistakes =
      await MistakeNotebook
        .find(filter)

        .populate({
          path: "question",

          select:
            "questionText question options correctAnswer explanation subject exam classLevel chapter difficulty questionType",
        })

        .sort({
          isMastered: 1,
          createdAt: -1,
        });

    return res
      .status(200)
      .json({
        success: true,
        count:
          mistakes.length,
        mistakes,
      });
  } catch (error) {
    console.error(
      "Get Mistake Notebook Error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          "Unable to load Mistake Notebook.",
      });
  }
};

// ============================================
// GET ONE MISTAKE
// ============================================

exports.getMistakeById =
  async (
    req,
    res
  ) => {
    try {
      const studentId =
        getStudentId(req);

      const { id } =
        req.params;

      if (!studentId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required.",
          });
      }

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid mistake ID.",
          });
      }

      const mistake =
        await MistakeNotebook
          .findOne({
            _id: id,
            student:
              studentId,
          })

          .populate({
            path: "question",

            select:
              "questionText question options correctAnswer explanation subject exam classLevel chapter difficulty questionType",
          });

      if (!mistake) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Mistake not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          mistake,
        });
    } catch (error) {
      console.error(
        "Get Mistake Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load mistake.",
        });
    }
  };

// ============================================
// UPDATE NOTE
// ============================================

exports.updateNote =
  async (
    req,
    res
  ) => {
    try {
      const studentId =
        getStudentId(req);

      const { id } =
        req.params;

      const { note } =
        req.body || {};

      if (!studentId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required.",
          });
      }

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid mistake ID.",
          });
      }

      if (
        typeof note !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Note must be text.",
          });
      }

      if (
        note.length >
        2000
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Note cannot exceed 2000 characters.",
          });
      }

      const mistake =
        await MistakeNotebook
          .findOneAndUpdate(
            {
              _id: id,
              student:
                studentId,
            },

            {
              $set: {
                note:
                  note.trim(),
              },
            },

            {
              new: true,
              runValidators:
                true,
            }
          );

      if (!mistake) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Mistake not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Note updated successfully.",

          mistake,
        });
    } catch (error) {
      console.error(
        "Update Mistake Note Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update note.",
        });
    }
  };

// ============================================
// MARK MASTERED / REVISION
// ============================================

exports.updateMastered =
  async (
    req,
    res
  ) => {
    try {
      const studentId =
        getStudentId(req);

      const { id } =
        req.params;

      const {
        isMastered,
      } =
        req.body || {};

      if (!studentId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required.",
          });
      }

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid mistake ID.",
          });
      }

      if (
        typeof isMastered !==
        "boolean"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "isMastered must be true or false.",
          });
      }

      const mistake =
        await MistakeNotebook
          .findOneAndUpdate(
            {
              _id: id,
              student:
                studentId,
            },

            {
              $set: {
                isMastered,

                lastReviewedAt:
                  new Date(),
              },

              $inc: {
                reviewCount:
                  1,
              },
            },

            {
              new: true,
              runValidators:
                true,
            }
          );

      if (!mistake) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Mistake not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            isMastered
              ? "Question marked as mastered."
              : "Question moved back to revision.",

          mistake,
        });
    } catch (error) {
      console.error(
        "Update Mastered Status Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to update mastered status.",
        });
    }
  };

// ============================================
// RECORD REVIEW
// ============================================

exports.recordReview =
  async (
    req,
    res
  ) => {
    try {
      const studentId =
        getStudentId(req);

      const { id } =
        req.params;

      if (!studentId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required.",
          });
      }

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid mistake ID.",
          });
      }

      const mistake =
        await MistakeNotebook
          .findOneAndUpdate(
            {
              _id: id,
              student:
                studentId,
            },

            {
              $inc: {
                reviewCount:
                  1,
              },

              $set: {
                lastReviewedAt:
                  new Date(),
              },
            },

            {
              new: true,
              runValidators:
                true,
            }
          );

      if (!mistake) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Mistake not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Review recorded.",
          mistake,
        });
    } catch (error) {
      console.error(
        "Record Mistake Review Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to record review.",
        });
    }
  };

// ============================================
// DELETE MISTAKE
// ============================================

exports.deleteMistake =
  async (
    req,
    res
  ) => {
    try {
      const studentId =
        getStudentId(req);

      const { id } =
        req.params;

      if (!studentId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required.",
          });
      }

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid mistake ID.",
          });
      }

      const mistake =
        await MistakeNotebook
          .findOneAndDelete({
            _id: id,
            student:
              studentId,
          });

      if (!mistake) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Mistake not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Question removed from Mistake Notebook.",
        });
    } catch (error) {
      console.error(
        "Delete Mistake Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to remove mistake from notebook.",
        });
    }
  };

// ============================================
// DASHBOARD STATS
// GET /api/mistake-notebook/stats
// ============================================

exports.getMistakeStats =
  async (
    req,
    res
  ) => {
    try {
      const studentId =
        getStudentId(req);

      if (!studentId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required.",
          });
      }

      if (
        !isValidObjectId(
          studentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid authenticated student ID.",
          });
      }

      // ======================================
      // COUNTS
      // ======================================

      const [
        totalMistakes,
        needRevision,
        mastered,
      ] =
        await Promise.all([
          MistakeNotebook
            .countDocuments({
              student:
                studentId,
            }),

          MistakeNotebook
            .countDocuments({
              student:
                studentId,

              isMastered:
                false,
            }),

          MistakeNotebook
            .countDocuments({
              student:
                studentId,

              isMastered:
                true,
            }),
        ]);

      const studentObjectId =
        toObjectId(
          studentId
        );

      // ======================================
      // SUBJECT BREAKDOWN
      // ======================================

      const subjectBreakdown =
        await MistakeNotebook
          .aggregate([
            {
              $match: {
                student:
                  studentObjectId,
              },
            },

            {
              $group: {
                _id:
                  "$subject",

                total: {
                  $sum: 1,
                },

                needRevision: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$isMastered",
                          false,
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },

            {
              $sort: {
                needRevision:
                  -1,

                total:
                  -1,
              },
            },
          ]);

      // ======================================
      // WEAK CHAPTERS
      // ======================================

      const chapterBreakdown =
        await MistakeNotebook
          .aggregate([
            {
              $match: {
                student:
                  studentObjectId,

                isMastered:
                  false,
              },
            },

            {
              $group: {
                _id: {
                  subject:
                    "$subject",

                  chapter:
                    "$chapter",
                },

                count: {
                  $sum: 1,
                },
              },
            },

            {
              $sort: {
                count: -1,
              },
            },

            {
              $limit: 5,
            },
          ]);

      // ======================================
      // RECENT MISTAKES
      // ======================================

      const recentMistakes =
        await MistakeNotebook
          .find({
            student:
              studentId,
          })

          .populate({
            path:
              "question",

            select:
              "questionText question options",
          })

          .sort({
            createdAt:
              -1,
          })

          .limit(3);

      // ======================================
      // RESPONSE
      // ======================================

      return res
        .status(200)
        .json({
          success: true,

          stats: {
            totalMistakes,

            needRevision,

            mastered,

            masteryPercentage:
              totalMistakes >
              0
                ? Math.round(
                    (
                      mastered /
                      totalMistakes
                    ) *
                      100
                  )
                : 0,

            subjectBreakdown,

            weakChapters:
              chapterBreakdown.map(
                (
                  item
                ) => ({
                  subject:
                    item._id
                      .subject,

                  chapter:
                    item._id
                      .chapter,

                  count:
                    item.count,
                })
              ),

            recentMistakes,
          },
        });
    } catch (error) {
      console.error(
        "Mistake Notebook Stats Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to load Mistake Notebook statistics.",
        });
    }
  };
