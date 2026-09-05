const mongoose = require('mongoose');

const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Student = require('../models/Student');
const Result = require('../models/Result');

const cloudinary =
  require('../config/cloudinary');

// SAME MODEL USED BY ADMIN NAVTA TEST
const NavtaQuestion =
  require('../models/NavtaQuestion');


// =====================================================
// NAVTA MASTER STUDY NOTE HELPERS
// =====================================================

const cleanString = (value = '') => {
  return String(
    value ?? ''
  ).trim();
};


const escapeRegex = (value = '') => {
  return cleanString(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
};


const normalizeSubjectName = (
  value = ''
) => {
  const raw =
    cleanString(value);

  const lower =
    raw.toLowerCase();

  if (lower === 'physics') {
    return 'Physics';
  }

  if (lower === 'chemistry') {
    return 'Chemistry';
  }

  if (
    lower === 'maths' ||
    lower === 'math' ||
    lower === 'mathematics'
  ) {
    return 'Maths';
  }

  if (
    lower === 'biology' ||
    lower === 'bio'
  ) {
    return 'Biology';
  }

  return raw;
};


const normalizeClassName = (
  value = ''
) => {
  const raw =
    cleanString(value);

  if (!raw) {
    return '';
  }

  const compact =
    raw
      .toLowerCase()
      .replace(/\s+/g, '');

  if (
    compact === '11' ||
    compact === 'class11' ||
    compact === 'xi'
  ) {
    return 'Class 11';
  }

  if (
    compact === '12' ||
    compact === 'class12' ||
    compact === 'xii'
  ) {
    return 'Class 12';
  }

  return raw;
};


const normalizePreparationName = (
  value = ''
) => {
  const raw =
    cleanString(value);

  const lower =
    raw.toLowerCase();

  if (
    lower === 'jee' ||
    lower === 'jee main' ||
    lower === 'jee mains' ||
    lower === 'jee advanced'
  ) {
    return 'JEE';
  }

  if (lower === 'neet') {
    return 'NEET';
  }

  if (
    lower === 'boards' ||
    lower === 'board' ||
    lower === 'cbse'
  ) {
    return 'Boards';
  }

  return raw;
};


const isMongoObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    cleanString(value)
  );
};


// =====================================================
// CLOUDINARY STUDY NOTE PDF UPLOAD
// =====================================================

const uploadStudyNotePdf = async (
  file
) => {
  if (
    !file ||
    !Buffer.isBuffer(
      file.buffer
    ) ||
    file.buffer.length === 0
  ) {
    return '';
  }

  return new Promise(
    (resolve, reject) => {
      const originalName =
        String(
          file.originalname ||
          'study-note.pdf'
        )
          .replace(
            /\.pdf$/i,
            ''
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            '-'
          )
          .replace(
            /-+/g,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            ''
          ) ||
        'study-note';

      const publicId =
        `${originalName}-${Date.now()}`;

      console.log(
        'NAVTA CLOUDINARY PDF UPLOAD START:',
        {
          originalName:
            file.originalname,

          mimetype:
            file.mimetype,

          size:
            file.size,

          publicId
        }
      );

      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            resource_type:
              'raw',

            folder:
              'navta/study-notes',

            public_id:
              publicId,

            use_filename:
              false,

            unique_filename:
              false,

            overwrite:
              false
          },

          (
            error,
            result
          ) => {
            if (error) {
              console.error(
                'NAVTA CLOUDINARY PDF UPLOAD ERROR:',
                error
              );

              return reject(
                error
              );
            }

            const secureUrl =
              cleanString(
                result?.secure_url
              );

            if (!secureUrl) {
              return reject(
                new Error(
                  'Cloudinary did not return a PDF URL.'
                )
              );
            }

            console.log(
              'NAVTA CLOUDINARY PDF UPLOAD SUCCESS:',
              {
                publicId:
                  result?.public_id,

                secureUrl
              }
            );

            return resolve(
              secureUrl
            );
          }
        );

      uploadStream.end(
        file.buffer
      );
    }
  );
};


// =====================================================
// RESOLVE / CREATE SUBJECT
// =====================================================

const resolveSubjectForNavta =
  async ({
    subjectId,
    subjectName
  }) => {

    if (
      isMongoObjectId(
        subjectId
      )
    ) {
      const subjectById =
        await Subject.findById(
          subjectId
        );

      if (subjectById) {
        return subjectById;
      }
    }

    const normalizedName =
      normalizeSubjectName(
        subjectName
      );

    if (!normalizedName) {
      return null;
    }

    const exactNameRegex =
      new RegExp(
        `^${escapeRegex(
          normalizedName
        )}$`,
        'i'
      );

    let subject =
      await Subject.findOne({
        name:
          exactNameRegex
      });

    if (
      !subject &&
      normalizedName ===
        'Maths'
    ) {
      subject =
        await Subject.findOne({
          name:
            /^Mathematics$/i
        });
    }

    if (subject) {
      return subject;
    }

    subject =
      await Subject.create({
        name:
          normalizedName
      });

    console.log(
      `NAVTA Study Notes: created MongoDB subject "${normalizedName}" (${subject._id}).`
    );

    return subject;
  };


// =====================================================
// RESOLVE / CREATE CHAPTER
// =====================================================

const resolveChapterForNavta =
  async ({
    chapterId,
    chapterName,
    subject,
    className,
    exam,
    chapterNumber
  }) => {

    if (
      isMongoObjectId(
        chapterId
      )
    ) {
      const chapterById =
        await Chapter.findById(
          chapterId
        );

      if (chapterById) {
        return chapterById;
      }
    }

    const normalizedChapterName =
      cleanString(
        chapterName
      );

    if (
      !normalizedChapterName ||
      !subject?._id
    ) {
      return null;
    }

    const normalizedClass =
      normalizeClassName(
        className
      );

    const chapterQuery = {
      subject:
        subject._id,

      title:
        new RegExp(
          `^${escapeRegex(
            normalizedChapterName
          )}$`,
          'i'
        )
    };

    let chapterClassField =
      '';

    if (
      Chapter.schema.path(
        'classLevel'
      )
    ) {
      chapterClassField =
        'classLevel';
    } else if (
      Chapter.schema.path(
        'className'
      )
    ) {
      chapterClassField =
        'className';
    } else if (
      Chapter.schema.path(
        'class'
      )
    ) {
      chapterClassField =
        'class';
    }

    if (
      chapterClassField &&
      normalizedClass
    ) {
      chapterQuery[
        chapterClassField
      ] =
        normalizedClass;
    }

    let chapter =
      await Chapter.findOne(
        chapterQuery
      );

    if (
      !chapter &&
      chapterClassField
    ) {
      chapter =
        await Chapter.findOne({
          subject:
            subject._id,

          title:
            new RegExp(
              `^${escapeRegex(
                normalizedChapterName
              )}$`,
              'i'
            ),

          $or: [
            {
              [chapterClassField]: {
                $exists:
                  false
              }
            },
            {
              [chapterClassField]:
                null
            },
            {
              [chapterClassField]:
                ''
            }
          ]
        });
    }

    if (chapter) {
      return chapter;
    }

    let resolvedChapterNumber =
      Number(
        chapterNumber
      );

    if (
      !Number.isFinite(
        resolvedChapterNumber
      ) ||
      resolvedChapterNumber <=
        0
    ) {
      resolvedChapterNumber =
        (
          await Chapter.countDocuments({
            subject:
              subject._id
          })
        ) + 1;
    }

    const chapterPayload = {
      subject:
        subject._id,

      title:
        normalizedChapterName,

      chapterNumber:
        resolvedChapterNumber,

      description:
        `NAVTA master chapter${
          normalizedClass
            ? ` • ${normalizedClass}`
            : ''
        }${
          cleanString(exam)
            ? ` • ${cleanString(
                exam
              )}`
            : ''
        }`
    };

    if (
      chapterClassField &&
      normalizedClass
    ) {
      chapterPayload[
        chapterClassField
      ] =
        normalizedClass;
    }

    if (
      Chapter.schema.path(
        'exam'
      ) &&
      cleanString(
        exam
      )
    ) {
      chapterPayload.exam =
        cleanString(
          exam
        );
    }

    chapter =
      await Chapter.create(
        chapterPayload
      );

    console.log(
      `NAVTA Study Notes: created MongoDB chapter "${normalizedChapterName}" (${chapter._id}).`
    );

    return chapter;
  };


// =====================================================
// CREATE CHAPTER
// =====================================================

exports.createChapter =
  async (req, res) => {
    try {
      const {
        subjectId,
        subjectName,
        title,
        chapterNumber,
        description,
        className,
        classLevel,
        exam
      } = req.body;

      const subject =
        await resolveSubjectForNavta({
          subjectId,
          subjectName
        });

      if (!subject) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Please provide a valid subject.'
          });
      }

      if (
        !cleanString(
          title
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Chapter title is required.'
          });
      }

      const existingChapter =
        await resolveChapterForNavta({
          chapterId:
            '',

          chapterName:
            title,

          subject,

          className:
            className ||
            classLevel,

          exam,

          chapterNumber
        });

      if (
        existingChapter &&
        cleanString(
          description
        ) &&
        Chapter.schema.path(
          'description'
        ) &&
        !cleanString(
          existingChapter
            .description
        )
      ) {
        existingChapter.description =
          cleanString(
            description
          );

        await existingChapter.save();
      }

      return res
        .status(201)
        .json({
          success:
            true,

          data:
            existingChapter
        });

    } catch (error) {
      console.error(
        'CREATE CHAPTER ERROR:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message
        });
    }
  };


// =====================================================
// CREATE STUDY NOTE
// =====================================================

exports.createNote =
  async (req, res) => {
    try {
      console.log(
        '======================================'
      );

      console.log(
        'NAVTA CREATE NOTE REQUEST'
      );

      console.log(
        '======================================'
      );

      console.log(
        'BODY:',
        req.body
      );

      console.log(
        'FILE:',
        req.file
          ? {
              fieldname:
                req.file
                  .fieldname,

              originalname:
                req.file
                  .originalname,

              mimetype:
                req.file
                  .mimetype,

              size:
                req.file
                  .size,

              hasBuffer:
                Buffer.isBuffer(
                  req.file
                    .buffer
                ),

              bufferLength:
                req.file
                  .buffer
                  ?.length ||
                0
            }
          : null
      );

      console.log(
        'USER:',
        req.user
          ? {
              id:
                req.user.id,

              _id:
                req.user._id,

              role:
                req.user.role
            }
          : null
      );

      const {
        chapterId,
        chapterName,
        subjectId,
        subjectName,
        exam,
        className,
        classLevel,
        chapterNumber,
        title,
        content,
        pdfUrl
      } =
        req.body || {};

      const finalTitle =
        cleanString(
          title
        );

      if (!finalTitle) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Study Note title is required.'
          });
      }

      const finalContent =
        cleanString(
          content
        );

      if (!finalContent) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Study Note content is required.'
          });
      }

      const finalPreparation =
        normalizePreparationName(
          exam
        );

      const finalClassName =
        normalizeClassName(
          className ||
          classLevel
        );

      const finalSubjectName =
        normalizeSubjectName(
          subjectName
        );

      const finalChapterName =
        cleanString(
          chapterName
        );

      if (!finalPreparation) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Please select a preparation: NEET, JEE or Boards.'
          });
      }

      if (
        ![
          'NEET',
          'JEE',
          'Boards'
        ].includes(
          finalPreparation
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Invalid Study Note preparation. Allowed values are NEET, JEE and Boards.'
          });
      }

      // A Study Note MUST store preparation metadata.
      // Without this field, a Boards PDF would appear in JEE/NEET too.
      if (
        !Note.schema.path(
          'exam'
        )
      ) {
        return res
          .status(500)
          .json({
            success:
              false,

            message:
              'Note model is missing the exam field. Update Note.js before uploading Study Notes.'
          });
      }

      const uploadedBy =
        req.user?._id ||
        req.user?.id;

      if (!uploadedBy) {
        console.error(
          'CREATE NOTE ERROR: req.user does not contain an ID.'
        );

        return res
          .status(401)
          .json({
            success:
              false,

            message:
              'Authenticated user ID was not found. Please log in again.'
          });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          uploadedBy
        )
      ) {
        console.error(
          'CREATE NOTE ERROR: Invalid uploadedBy:',
          uploadedBy
        );

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Authenticated user has an invalid MongoDB ID.'
          });
      }

      let chapter =
        null;

      if (
        chapterId &&
        mongoose.Types.ObjectId.isValid(
          cleanString(
            chapterId
          )
        )
      ) {
        chapter =
          await Chapter.findById(
            cleanString(
              chapterId
            )
          );

        if (chapter) {
          console.log(
            'Found chapter using MongoDB ID:',
            chapter._id,
            chapter.title
          );
        }
      }

      if (!chapter) {
        console.log(
          'Resolving NAVTA chapter:',
          {
            subjectId,
            subjectName,
            chapterName,
            className,
            classLevel,
            exam
          }
        );

        const subject =
          await resolveSubjectForNavta({
            subjectId,
            subjectName
          });

        if (!subject) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                'Subject could not be resolved for this Study Note.'
            });
        }

        console.log(
          'Resolved subject:',
          subject._id,
          subject.name
        );

        chapter =
          await resolveChapterForNavta({
            chapterId,

            chapterName,

            subject,

            className:
              finalClassName,

            exam:
              finalPreparation,

            chapterNumber
          });
      }

      if (!chapter) {
        console.error(
          'CREATE NOTE ERROR: chapter could not be resolved.'
        );

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Chapter could not be resolved. Please select the chapter again.'
          });
      }

      console.log(
        'Resolved chapter:',
        chapter._id,
        chapter.title
      );

      // =================================================
      // PDF
      // =================================================

      let finalPdfUrl =
        cleanString(
          pdfUrl
        );

      if (
        !finalPdfUrl &&
        req.file
      ) {
        console.log(
          'Uploading Study Note PDF to Cloudinary...'
        );

        finalPdfUrl =
          await uploadStudyNotePdf(
            req.file
          );

        console.log(
          'Study Note PDF URL:',
          finalPdfUrl
        );
      }

      // =================================================
      // FINAL PAYLOAD
      // =================================================

      const notePayload = {
        chapter:
          chapter._id,

        title:
          finalTitle,

        content:
          finalContent,

        // IMPORTANT:
        // This is the preparation bucket used by Study Notes.
        // Boards notes stay in Boards, JEE notes stay in JEE,
        // and NEET notes stay in NEET.
        exam:
          finalPreparation,

        uploadedBy:
          new mongoose.Types.ObjectId(
            String(
              uploadedBy
            )
          )
      };

      // Save the rest of the Study Notes classification metadata
      // whenever those fields exist in the Note schema.
      if (
        Note.schema.path(
          'className'
        )
      ) {
        notePayload.className =
          finalClassName;
      }

      if (
        Note.schema.path(
          'subjectName'
        )
      ) {
        notePayload.subjectName =
          finalSubjectName;
      }

      if (
        Note.schema.path(
          'chapterName'
        )
      ) {
        notePayload.chapterName =
          finalChapterName ||
          cleanString(
            chapter.title
          );
      }

      if (finalPdfUrl) {
        notePayload.pdfUrl =
          finalPdfUrl;
      }

      console.log(
        'NOTE PAYLOAD BEFORE DATABASE INSERT:',
        notePayload
      );

      const note =
        new Note(
          notePayload
        );

      console.log(
        'Mongoose validation starting...'
      );

      await note.validate();

      console.log(
        'Mongoose validation successful.'
      );

      console.log(
        'Saving Study Note to MongoDB...'
      );

      const savedNote =
        await note.save();

      const verification =
        await Note.findById(
          savedNote._id
        ).lean();

      if (!verification) {
        console.error(
          'CRITICAL: Note.save() completed but verification failed.'
        );

        return res
          .status(500)
          .json({
            success:
              false,

            message:
              'Study Note could not be verified after saving.'
          });
      }

      console.log(
        '======================================'
      );

      console.log(
        'STUDY NOTE SAVED SUCCESSFULLY'
      );

      console.log(
        'NOTE ID:',
        savedNote._id
      );

      console.log(
        'TITLE:',
        savedNote.title
      );

      console.log(
        'CHAPTER:',
        savedNote.chapter
      );

      console.log(
        'PDF:',
        savedNote.pdfUrl ||
        'NONE'
      );

      console.log(
        '======================================'
      );

      return res
        .status(201)
        .json({
          success:
            true,

          message:
            'Study Note uploaded and saved successfully.',

          data:
            savedNote,

          note:
            savedNote,

          resolvedChapter: {
            _id:
              chapter._id,

            title:
              chapter.title,

            chapterNumber:
              chapter.chapterNumber
          }
        });

    } catch (error) {
      console.error(
        '======================================'
      );

      console.error(
        'CREATE STUDY NOTE FAILED'
      );

      console.error(
        '======================================'
      );

      console.error(
        'NAME:',
        error?.name
      );

      console.error(
        'MESSAGE:',
        error?.message
      );

      console.error(
        'STACK:',
        error?.stack
      );

      if (
        error?.errors
      ) {
        console.error(
          'MONGOOSE VALIDATION ERRORS:',
          error.errors
        );
      }

      if (
        error?.name ===
        'ValidationError'
      ) {
        const validationMessages =
          Object.values(
            error.errors ||
            {}
          )
            .map(
              (item) =>
                item.message
            )
            .filter(
              Boolean
            );

        return res
          .status(400)
          .json({
            success:
              false,

            message:
              validationMessages.join(
                ', '
              ) ||
              error.message ||
              'Study Note validation failed.'
          });
      }

      if (
        error?.name ===
        'CastError'
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              `Invalid ${
                error.path ||
                'MongoDB'
              } value.`
          });
      }

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error?.message ||
            'Failed to create Study Note.'
        });
    }
  };


// =====================================================
// CREATE PYQ
// =====================================================

exports.createPYQ =
  async (req, res) => {
    try {
      const {
        subjectId,
        chapterId,
        year,
        examName,
        title,
        pdfUrl
      } =
        req.body;

      const pyq =
        await PYQ.create({
          subject:
            subjectId,

          chapter:
            chapterId ||
            null,

          year,

          examName,

          title,

          pdfUrl,

          uploadedBy:
            req.user.id
        });

      return res
        .status(201)
        .json({
          success:
            true,

          data:
            pyq
        });

    } catch (error) {
      console.error(
        'CREATE PYQ ERROR:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message
        });
    }
  };


// =====================================================
// CREATE TEST
// =====================================================

exports.createTest =
  async (req, res) => {
    try {
      const {
        title,
        description,
        subjectId,
        chapterId,
        duration,
        type,
        questions,
        totalMarks,
        passingScore
      } =
        req.body;

      if (
        !Array.isArray(
          questions
        ) ||
        questions.length ===
          0
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              'Please provide questions for the test'
          });
      }

      const questionIds =
        [];

      for (
        const item of
        questions
      ) {
        const question =
          await Question.create({
            subject:
              subjectId,

            chapter:
              chapterId ||
              null,

            questionType:
              item.questionType ||
              'mcq',

            text:
              item.text,

            options:
              item.options ||
              [],

            correctOption:
              item.correctOption,

            correctAnswer:
              item.correctAnswer,

            explanation:
              item.explanation ||
              '',

            difficulty:
              item.difficulty ||
              'medium'
          });

        questionIds.push(
          question._id
        );
      }

      const test =
        await Test.create({
          title,

          description,

          subject:
            subjectId,

          chapter:
            chapterId ||
            null,

          duration,

          type:
            type ||
            'Quiz',

          questions:
            questionIds,

          totalMarks:
            totalMarks ||
            questions.length *
              10,

          passingScore:
            passingScore ||
            40
        });

      return res
        .status(201)
        .json({
          success:
            true,

          data:
            test
        });

    } catch (error) {
      console.error(
        'CREATE TEST ERROR:',
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error.message
        });
    }
  };
// =====================================================
// TEACHER / ADMIN STUDENT METRICS
// =====================================================

exports.getStudentMetrics = async (req, res) => {
  try {
    const students =
      await Student.find({})
        .populate(
          'user',
          'name email'
        )
        .lean();

    const results =
      await Result.find({})
        .populate(
          'test',
          'title subject chapter'
        )
        .lean();

    const studentMetrics =
      students.map((student) => {
        const studentId =
          String(
            student._id
          );

        const studentResults =
          results.filter(
            (result) =>
              String(
                result.student
              ) === studentId
          );

        const totalTests =
          studentResults.length;

        const totalScore =
          studentResults.reduce(
            (
              sum,
              result
            ) => {
              const percentage =
                Number(
                  result.percentage ??
                  result.score ??
                  0
                );

              return (
                sum +
                (
                  Number.isFinite(
                    percentage
                  )
                    ? percentage
                    : 0
                )
              );
            },
            0
          );

        const averageScore =
          totalTests > 0
            ? Number(
                (
                  totalScore /
                  totalTests
                ).toFixed(2)
              )
            : 0;

        return {
          studentId:
            student._id,

          name:
            student.user?.name ||
            student.name ||
            'Student',

          email:
            student.user?.email ||
            student.email ||
            '',

          totalTests,

          averageScore,

          results:
            studentResults
        };
      });

    return res.status(200).json({
      success: true,

      count:
        studentMetrics.length,

      data:
        studentMetrics
    });

  } catch (error) {
    console.error(
      'GET STUDENT METRICS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to load student metrics.'
    });
  }
};


// =====================================================
// GET ALL QUESTIONS
// =====================================================

exports.getQuestions = async (req, res) => {
  try {
    const {
      subject,
      chapter,
      difficulty,
      questionType
    } = req.query;

    const query = {};

    if (subject) {
      query.subject =
        subject;
    }

    if (chapter) {
      query.chapter =
        chapter;
    }

    if (difficulty) {
      query.difficulty =
        difficulty;
    }

    if (questionType) {
      query.questionType =
        questionType;
    }

    const questions =
      await Question.find(query)
        .populate(
          'subject',
          'name'
        )
        .populate(
          'chapter',
          'title chapterNumber'
        )
        .sort({
          createdAt: -1
        });

    return res.status(200).json({
      success: true,

      count:
        questions.length,

      data:
        questions
    });

  } catch (error) {
    console.error(
      'GET QUESTIONS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};


// =====================================================
// CREATE SINGLE QUESTION
// =====================================================

exports.createQuestion = async (req, res) => {
  try {
    const {
      subjectId,
      chapterId,
      questionType,
      text,
      options,
      correctOption,
      correctAnswer,
      explanation,
      difficulty
    } = req.body;

    if (!subjectId) {
      return res.status(400).json({
        success: false,

        message:
          'Subject is required.'
      });
    }

    if (!cleanString(text)) {
      return res.status(400).json({
        success: false,

        message:
          'Question text is required.'
      });
    }

    const question =
      await Question.create({
        subject:
          subjectId,

        chapter:
          chapterId || null,

        questionType:
          questionType ||
          'mcq',

        text:
          cleanString(text),

        options:
          Array.isArray(options)
            ? options
            : [],

        correctOption:
          correctOption,

        correctAnswer:
          correctAnswer,

        explanation:
          cleanString(
            explanation
          ),

        difficulty:
          difficulty ||
          'medium'
      });

    return res.status(201).json({
      success: true,

      message:
        'Question created successfully.',

      data:
        question
    });

  } catch (error) {
    console.error(
      'CREATE QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};


// =====================================================
// DELETE QUESTION
// =====================================================

exports.deleteQuestion = async (req, res) => {
  try {
    const questionId =
      req.params.questionId ||
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        questionId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Invalid question ID.'
      });
    }

    const question =
      await Question.findById(
        questionId
      );

    if (!question) {
      return res.status(404).json({
        success: false,

        message:
          'Question not found.'
      });
    }

    await question.deleteOne();

    return res.status(200).json({
      success: true,

      message:
        'Question deleted successfully.'
    });

  } catch (error) {
    console.error(
      'DELETE QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};


// =====================================================
// NAVTA TEST QUESTION BANK
// =====================================================


// =====================================================
// GET NAVTA TEST QUESTIONS
// =====================================================

exports.getNavtaQuestions = async (req, res) => {
  try {
    const {
      subject,
      preparation,
      exam,
      classLevel,
      className,
      chapter,
      difficulty,
      questionType,
      active
    } = req.query;

    const query = {};

    if (subject) {
      query.subject =
        subject;
    }

    if (
      preparation ||
      exam
    ) {
      query.preparation =
        preparation ||
        exam;
    }

    if (
      classLevel ||
      className
    ) {
      query.classLevel =
        classLevel ||
        className;
    }

    if (chapter) {
      query.chapter =
        chapter;
    }

    if (difficulty) {
      query.difficulty =
        difficulty;
    }

    if (questionType) {
      query.questionType =
        questionType;
    }

    if (
      active !== undefined
    ) {
      query.active =
        String(active) !==
        'false';
    }

    const questions =
      await NavtaQuestion
        .find(query)
        .sort({
          createdAt: -1
        })
        .lean();

    return res.status(200).json({
      success: true,

      count:
        questions.length,

      questions,

      data:
        questions
    });

  } catch (error) {
    console.error(
      'GET NAVTA QUESTIONS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to load NAVTA TEST questions.'
    });
  }
};


// =====================================================
// GET ONE NAVTA TEST QUESTION
// =====================================================

exports.getNavtaQuestion = async (req, res) => {
  try {
    const questionId =
      req.params.questionId ||
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        questionId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Invalid NAVTA question ID.'
      });
    }

    const question =
      await NavtaQuestion.findById(
        questionId
      );

    if (!question) {
      return res.status(404).json({
        success: false,

        message:
          'NAVTA TEST question not found.'
      });
    }

    return res.status(200).json({
      success: true,

      question,

      data:
        question
    });

  } catch (error) {
    console.error(
      'GET NAVTA QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};


// =====================================================
// CREATE NAVTA TEST QUESTION
// =====================================================

exports.createNavtaQuestion = async (req, res) => {
  try {
    const {
      question,
      text,
      subject,
      preparation,
      exam,
      classLevel,
      className,
      chapter,
      difficulty,
      questionType,
      options,
      correctAnswer,
      correctOption,
      explanation,
      modelAnswer,
      keyPoints,
      maxMarks,
      questionImage,
      questionBoundingBox,
      sourcePage,
      hasVisual,
      visualDescription,
      visualBoundingBox,
      active
    } = req.body;

    const visibleQuestion =
      cleanString(
        question ||
        text
      );

    if (!visibleQuestion) {
      return res.status(400).json({
        success: false,

        message:
          'Question text is required.'
      });
    }

    if (!cleanString(subject)) {
      return res.status(400).json({
        success: false,

        message:
          'Subject is required.'
      });
    }

    if (!cleanString(chapter)) {
      return res.status(400).json({
        success: false,

        message:
          'Chapter is required.'
      });
    }

    const payload = {
      question:
        visibleQuestion,

      subject:
        cleanString(subject),

      preparation:
        cleanString(
          preparation ||
          exam
        ),

      classLevel:
        normalizeClassName(
          classLevel ||
          className
        ),

      chapter:
        cleanString(chapter),

      difficulty:
        cleanString(
          difficulty
        ) ||
        'Medium',

      questionType:
        cleanString(
          questionType
        ) ||
        'mcq',

      options:
        Array.isArray(options)
          ? options
          : [],

      correctAnswer:
        correctAnswer ??
        correctOption ??
        null,

      explanation:
        cleanString(
          explanation
        ),

      modelAnswer:
        cleanString(
          modelAnswer
        ),

      keyPoints:
        Array.isArray(keyPoints)
          ? keyPoints
          : [],

      maxMarks:
        maxMarks ?? null,

      questionImage:
        cleanString(
          questionImage
        ),

      questionBoundingBox:
        questionBoundingBox ||
        null,

      sourcePage:
        sourcePage ?? null,

      hasVisual:
        Boolean(
          hasVisual
        ),

      visualDescription:
        cleanString(
          visualDescription
        ),

      visualBoundingBox:
        visualBoundingBox ||
        null,

      active:
        active !== false
    };

    Object.keys(payload).forEach(
      (key) => {
        if (
          !NavtaQuestion.schema.path(
            key
          )
        ) {
          delete payload[key];
        }
      }
    );

    const navtaQuestion =
      await NavtaQuestion.create(
        payload
      );

    return res.status(201).json({
      success: true,

      message:
        'NAVTA TEST question created successfully.',

      question:
        navtaQuestion,

      data:
        navtaQuestion
    });

  } catch (error) {
    console.error(
      'CREATE NAVTA QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to create NAVTA TEST question.'
    });
  }
};


// =====================================================
// UPDATE NAVTA TEST QUESTION
// =====================================================

exports.updateNavtaQuestion = async (req, res) => {
  try {
    const questionId =
      req.params.questionId ||
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        questionId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Invalid NAVTA question ID.'
      });
    }

    const question =
      await NavtaQuestion.findById(
        questionId
      );

    if (!question) {
      return res.status(404).json({
        success: false,

        message:
          'NAVTA TEST question not found.'
      });
    }

    const allowedFields = [
      'question',
      'subject',
      'preparation',
      'classLevel',
      'chapter',
      'difficulty',
      'questionType',
      'options',
      'correctAnswer',
      'explanation',
      'modelAnswer',
      'keyPoints',
      'maxMarks',
      'questionImage',
      'questionBoundingBox',
      'sourcePage',
      'hasVisual',
      'visualDescription',
      'visualBoundingBox',
      'active'
    ];

    for (
      const field of
      allowedFields
    ) {
      if (
        req.body[field] !==
        undefined
      ) {
        if (
          NavtaQuestion.schema.path(
            field
          )
        ) {
          question[field] =
            req.body[field];
        }
      }
    }

    if (
      req.body.exam !==
        undefined &&
      NavtaQuestion.schema.path(
        'preparation'
      )
    ) {
      question.preparation =
        cleanString(
          req.body.exam
        );
    }

    if (
      req.body.className !==
        undefined &&
      NavtaQuestion.schema.path(
        'classLevel'
      )
    ) {
      question.classLevel =
        normalizeClassName(
          req.body.className
        );
    }

    const savedQuestion =
      await question.save();

    return res.status(200).json({
      success: true,

      message:
        'NAVTA TEST question updated successfully.',

      question:
        savedQuestion,

      data:
        savedQuestion
    });

  } catch (error) {
    console.error(
      'UPDATE NAVTA QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to update NAVTA TEST question.'
    });
  }
};


// =====================================================
// DELETE NAVTA TEST QUESTION
// =====================================================

exports.deleteNavtaQuestion = async (req, res) => {
  try {
    const questionId =
      req.params.questionId ||
      req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        questionId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          'Invalid NAVTA question ID.'
      });
    }

    const question =
      await NavtaQuestion.findById(
        questionId
      );

    if (!question) {
      return res.status(404).json({
        success: false,

        message:
          'NAVTA TEST question not found.'
      });
    }

    await question.deleteOne();

    return res.status(200).json({
      success: true,

      message:
        'NAVTA TEST question permanently deleted.'
    });

  } catch (error) {
    console.error(
      'DELETE NAVTA QUESTION ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to delete NAVTA TEST question.'
    });
  }
};


// =====================================================
// NAVTA TEST CHAPTER DISCOVERY
// =====================================================

exports.getNavtaTestChapters = async (req, res) => {
  try {
    const {
      subject,
      preparation,
      exam,
      classLevel,
      className
    } = req.query;

    const query = {};

    if (subject) {
      query.subject =
        cleanString(subject);
    }

    if (
      preparation ||
      exam
    ) {
      query.preparation =
        cleanString(
          preparation ||
          exam
        );
    }

    if (
      classLevel ||
      className
    ) {
      query.classLevel =
        normalizeClassName(
          classLevel ||
          className
        );
    }

    const questions =
      await NavtaQuestion
        .find(query)
        .select(
          'subject preparation classLevel chapter'
        )
        .lean();

    const chapterMap =
      new Map();

    for (
      const question of
      questions
    ) {
      const chapter =
        cleanString(
          question.chapter
        );

      if (!chapter) {
        continue;
      }

      const item = {
        subject:
          cleanString(
            question.subject
          ),

        preparation:
          cleanString(
            question.preparation
          ),

        classLevel:
          cleanString(
            question.classLevel
          ),

        chapter
      };

      const key =
        [
          item.subject,
          item.preparation,
          item.classLevel,
          item.chapter
        ]
          .map(
            (value) =>
              value.toLowerCase()
          )
          .join('|');

      if (
        !chapterMap.has(key)
      ) {
        chapterMap.set(
          key,
          item
        );
      }
    }

    const chapters =
      Array.from(
        chapterMap.values()
      ).sort(
        (
          first,
          second
        ) =>
          first.chapter.localeCompare(
            second.chapter
          )
      );

    return res.status(200).json({
      success: true,

      count:
        chapters.length,

      chapters,

      data:
        chapters
    });

  } catch (error) {
    console.error(
      'GET NAVTA TEST CHAPTERS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to load NAVTA TEST chapters.'
    });
  }
};


// =====================================================
// HELPER - NORMALISE QUESTION TYPE
// =====================================================

const normalizeQuestionType = (value) => {
  if (!value) {
    return 'mcq';
  }

  const type = String(value)
    .trim()
    .toLowerCase();

  if (
    [
      'short',
      'short answer',
      'short-answer',
      'short_answer',
      'shortanswer'
    ].includes(type)
  ) {
    return 'short';
  }

  if (
    [
      'long',
      'long answer',
      'long-answer',
      'long_answer',
      'longanswer'
    ].includes(type)
  ) {
    return 'long';
  }

  return 'mcq';
};


// =====================================================
// NAVTA TEST QUESTION BANK
// PAPER BUILDER
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

    const chapterFilter = {};

    /*
     * Your NavtaQuestion schema has used both "active"
     * and "isActive" in different code paths.
     * Do not force isActive:true here because it can
     * hide valid NAVTA Test questions.
     */

    if (subject) {
      chapterFilter.subject =
        subject;
    }

    if (exam) {
      if (
        NavtaQuestion.schema.path(
          'preparation'
        )
      ) {
        chapterFilter.preparation =
          exam;
      } else {
        chapterFilter.exam =
          exam;
      }
    }

    if (classLevel) {
      chapterFilter.classLevel =
        normalizeClassName(
          classLevel
        );
    }

    const chapterRecords =
      await NavtaQuestion.find(
        chapterFilter
      )
        .select('chapter')
        .lean();

    const chapters = [
      ...new Set(
        chapterRecords
          .map(
            (item) =>
              item.chapter
          )
          .filter(
            (item) =>
              item &&
              String(item).trim()
          )
          .map(
            (item) =>
              String(item).trim()
          )
      )
    ].sort(
      (a, b) =>
        a.localeCompare(b)
    );

    const conditions = [];

    if (
      NavtaQuestion.schema.path(
        'active'
      )
    ) {
      conditions.push({
        $or: [
          {
            active: true
          },
          {
            active: {
              $exists: false
            }
          }
        ]
      });
    } else if (
      NavtaQuestion.schema.path(
        'isActive'
      )
    ) {
      conditions.push({
        $or: [
          {
            isActive: true
          },
          {
            isActive: {
              $exists: false
            }
          }
        ]
      });
    }

    if (subject) {
      conditions.push({
        subject
      });
    }

    if (exam) {
      if (
        NavtaQuestion.schema.path(
          'preparation'
        )
      ) {
        conditions.push({
          preparation:
            exam
        });
      } else {
        conditions.push({
          exam
        });
      }
    }

    if (classLevel) {
      conditions.push({
        classLevel:
          normalizeClassName(
            classLevel
          )
      });
    }

    if (chapter) {
      conditions.push({
        chapter
      });
    }

    if (difficulty) {
      conditions.push({
        difficulty
      });
    }

    if (questionType) {
      const type =
        normalizeQuestionType(
          questionType
        );

      if (type === 'mcq') {
        conditions.push({
          $or: [
            {
              questionType: 'mcq'
            },
            {
              questionType: 'MCQ'
            },
            {
              questionType: 'objective'
            },
            {
              questionType: 'Objective'
            },
            {
              questionType: {
                $exists: false
              }
            },
            {
              questionType: null
            },
            {
              questionType: ''
            }
          ]
        });
      }

      if (type === 'short') {
        conditions.push({
          questionType: {
            $in: [
              'short',
              'Short',
              'short answer',
              'Short Answer',
              'short-answer',
              'short_answer'
            ]
          }
        });
      }

      if (type === 'long') {
        conditions.push({
          questionType: {
            $in: [
              'long',
              'Long',
              'long answer',
              'Long Answer',
              'long-answer',
              'long_answer'
            ]
          }
        });
      }
    }

    if (
      search &&
      String(search).trim()
    ) {
      const safeSearch =
        escapeRegex(
          String(search).trim()
        );

      const regex =
        new RegExp(
          safeSearch,
          'i'
        );

      conditions.push({
        $or: [
          {
            question: regex
          },
          {
            chapter: regex
          },
          {
            subject: regex
          }
        ]
      });
    }

    const mongoFilter =
      conditions.length === 0
        ? {}
        : conditions.length === 1
          ? conditions[0]
          : {
              $and:
                conditions
            };

    const questions =
      await NavtaQuestion.find(
        mongoFilter
      )
        .sort({
          createdAt: -1
        })
        .lean();

    const formattedQuestions =
      questions.map(
        (question) => {
          const type =
            normalizeQuestionType(
              question.questionType
            );

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
            if (
              type === 'short'
            ) {
              defaultMarks = 3;
            } else if (
              type === 'long'
            ) {
              defaultMarks = 5;
            } else {
              defaultMarks = 1;
            }
          }

          return {
            _id:
              question._id,

            subject:
              question.subject,

            exam:
              question.preparation ||
              question.exam ||
              '',

            preparation:
              question.preparation ||
              question.exam ||
              '',

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
              'NAVTA Admin Bank',

            sourceType:
              'navta-test',

            createdAt:
              question.createdAt
          };
        }
      );

    return res.status(200).json({
      success: true,

      count:
        formattedQuestions.length,

      questions:
        formattedQuestions,

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


// =====================================================
// END OF teacherController.js
// =====================================================
