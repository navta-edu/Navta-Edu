const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Reward = require('../models/Reward');
const Result = require('../models/Result');
const Chapter = require('../models/Chapter');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Question = require('../models/Question');
const AdminActivity = require('../models/AdminActivity');
const { recordAdminActivity } = require('../services/adminActivity');

const userRoleNames = ['admin', 'student', 'teacher', 'external_teacher'];
const userFields = 'name email role isVerified createdAt avatar schoolName department stream address classLevel isProfileComplete';

function safeUser(user) {
  const fields = Object.fromEntries(userFields.split(' ').map((name) => [name, user[name]]));
  return { _id: user._id, ...fields };
}

function pagination(query, total) {
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 25));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(query.page, 10) || 1));
  return { page, limit, total, totalPages };
}

// @desc    Search and page through platform users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { role, search, page, limit } = req.query;
    if ([role, search, page, limit].every((value) => value === undefined)) {
      const users = await User.find().select(userFields).sort({ createdAt: -1, _id: -1 });
      return res.status(200).json({ success: true, count: users.length, data: users });
    }

    const searchText = typeof search === 'string' ? search.trim().slice(0, 120) : '';
    const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchQuery = escapedSearch
      ? { $or: [{ name: { $regex: escapedSearch, $options: 'i' } }, { email: { $regex: escapedSearch, $options: 'i' } }] }
      : {};
    const query = { ...searchQuery };

    if (role && role !== 'all') {
      if (!userRoleNames.includes(role)) {
        return res.status(400).json({ success: false, message: 'Select a valid account type.' });
      }
      query.role = { $regex: `^${role.replace('_', '[ _-]')}$`, $options: 'i' };
    }

    const [total, counts] = await Promise.all([
      User.countDocuments(query),
      User.aggregate([{ $match: searchQuery }, { $group: { _id: '$role', count: { $sum: 1 } } }])
    ]);
    const roleCounts = Object.fromEntries(userRoleNames.map((name) => [name, 0]));
    for (const entry of counts) {
      const roleName = String(entry._id || '').trim().toLowerCase().replace(/[ -]+/g, '_');
      if (userRoleNames.includes(roleName)) roleCounts[roleName] += entry.count;
    }

    const paging = pagination(req.query, total);
    const users = await User.find(query)
      .select('name email role isVerified createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip((paging.page - 1) * paging.limit)
      .limit(paging.limit);

    return res.status(200).json({ success: true, count: users.length, data: users, roleCounts, pagination: paging });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to load the user registry.' });
  }
};

exports.getAdminActivity = async (req, res) => {
  try {
    const paging = pagination(req.query, await AdminActivity.countDocuments());
    const data = await AdminActivity.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip((paging.page - 1) * paging.limit)
      .limit(paging.limit)
      .lean();
    return res.json({ success: true, data, pagination: paging });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to load admin activity.' });
  }
};

// @desc    Create a user account
// @route   POST /api/admin/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role, isVerified: true });

    if (user.role === 'student') {
      await Student.create({ user: user._id });
    } else if (user.role === 'teacher') {
      await Teacher.create({ user: user._id, qualification: 'Qualified Educator' });
    }

    await recordAdminActivity(req.user, 'Created', 'User', user._id);
    res.status(201).json({ success: true, message: 'User created successfully', data: safeUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'User already exists' });
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Check the name, email, role, and password before creating this user.' });
    }
    return res.status(500).json({ success: false, message: 'Unable to create this user.' });
  }
};

// @desc    Update user details or role
// @route   PUT /api/admin/users/:userId
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { name, role, isVerified, schoolName, department, stream, address } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (schoolName !== undefined) user.schoolName = schoolName;
    if (department !== undefined) user.department = department;
    if (stream !== undefined) user.stream = stream;
    if (address !== undefined) user.address = address;
    if (isVerified !== undefined) user.isVerified = isVerified;
    
    // If role changes, check profile creation
    if (role && role !== user.role) {
      // Create student or teacher profiles if they don't already exist
      if (role === 'student') {
        const studentExists = await Student.findOne({ user: user._id });
        if (!studentExists) {
          await Student.create({ user: user._id });
        }
      } else if (role === 'teacher') {
        const teacherExists = await Teacher.findOne({ user: user._id });
        if (!teacherExists) {
          await Teacher.create({ user: user._id, qualification: 'Qualified Educator' });
        }
      }
      user.role = role;
    }

    await user.save();
    await recordAdminActivity(req.user, 'Updated', 'User', user._id);
    res.status(200).json({ success: true, message: 'User updated successfully', data: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update student profile details
// @route   PUT /api/admin/students/:userId
// @access  Private (Admin)
exports.updateStudentProfile = async (req, res) => {
  try {
    const { coins, xp, level, stream } = req.body;
    const student = await Student.findOne({ user: req.params.userId });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    if (coins !== undefined) student.coins = coins;
    if (xp !== undefined) student.xp = xp;
    if (level !== undefined) student.level = level;
    if (stream !== undefined) student.stream = stream;

    await student.save();
    await recordAdminActivity(req.user, 'Updated', 'Student profile', student._id);
    res.status(200).json({ success: true, message: 'Student profile updated', data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove profiles first
    await Student.deleteOne({ user: user._id });
    await Teacher.deleteOne({ user: user._id });
    await User.deleteOne({ _id: user._id });
    await recordAdminActivity(req.user, 'Deleted', 'User', user._id);

    res.status(200).json({ success: true, message: 'User account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new subject category
// @route   POST /api/admin/subjects
// @access  Private (Admin)
exports.createSubject = async (req, res) => {
  try {
    const { name, code, description, category, classes, preparationMethods } = req.body;

    const subjectExists = await Subject.findOne({ $or: [{ code }, { name }] });
    if (subjectExists) {
      return res.status(400).json({ success: false, message: 'Subject with this code already exists' });
    }

    const subject = await Subject.create({
      name,
      code,
      description,
      category: category || 'General',
      classes: Array.isArray(classes) ? classes : [],
      preparationMethods: Array.isArray(preparationMethods) ? preparationMethods : []
    });

    await recordAdminActivity(req.user, 'Created', 'Subject', subject._id);
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a new chapter
// @route   POST /api/admin/chapters
// @access  Private (Admin)
exports.createChapter = async (req, res) => {
  try {
    const body = req.body || {};
    const subjectInput = String(body.subject ?? body.subjectId ?? '').trim();
    const title = String(body.title ?? body.name ?? body.chapterTitle ?? '').trim();
    const description = String(body.description ?? body.chapterDescription ?? '').trim();
    const examination = String(body.examination ?? body.exam ?? body.preparation ?? '').trim();
    const classLevel = String(body.classLevel ?? body.className ?? body.class ?? '').trim();

    if (!subjectInput) {
      return res.status(400).json({ success: false, message: 'Subject is required.' });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: 'Chapter title is required.' });
    }

    const escapeRegex = (value) =>
      String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let subject = null;

    if (/^[a-f\d]{24}$/i.test(subjectInput)) {
      subject = await Subject.findById(subjectInput);
    }

    if (!subject) {
      subject = await Subject.findOne({
        name: { $regex: `^${escapeRegex(subjectInput)}$`, $options: 'i' }
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: `Subject "${subjectInput}" was not found.`
      });
    }

    const chapterData = {};

    if (Chapter.schema.path('title')) chapterData.title = title;
    if (Chapter.schema.path('name')) chapterData.name = title;
    if (Chapter.schema.path('description')) chapterData.description = description;
    if (Chapter.schema.path('subject')) chapterData.subject = subject._id;

    if (Chapter.schema.path('examination')) chapterData.examination = examination;
    if (Chapter.schema.path('exam')) chapterData.exam = examination;
    if (Chapter.schema.path('preparation')) chapterData.preparation = examination;

    if (Chapter.schema.path('classLevel')) chapterData.classLevel = classLevel;
    if (Chapter.schema.path('className')) chapterData.className = classLevel;
    if (Chapter.schema.path('class')) chapterData.class = classLevel;

    const duplicateQuery = { subject: subject._id };

    if (Chapter.schema.path('title')) {
      duplicateQuery.title = {
        $regex: `^${escapeRegex(title)}$`,
        $options: 'i'
      };
    } else if (Chapter.schema.path('name')) {
      duplicateQuery.name = {
        $regex: `^${escapeRegex(title)}$`,
        $options: 'i'
      };
    }

    if (examination) {
      if (Chapter.schema.path('examination')) duplicateQuery.examination = examination;
      else if (Chapter.schema.path('exam')) duplicateQuery.exam = examination;
      else if (Chapter.schema.path('preparation')) duplicateQuery.preparation = examination;
    }

    if (classLevel) {
      if (Chapter.schema.path('classLevel')) duplicateQuery.classLevel = classLevel;
      else if (Chapter.schema.path('className')) duplicateQuery.className = classLevel;
      else if (Chapter.schema.path('class')) duplicateQuery.class = classLevel;
    }

    const existingChapter = await Chapter.findOne(duplicateQuery);

    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: 'This chapter already exists for the selected Subject / Examination / Class.'
      });
    }

    // The admin no longer supplies a chapter number. If an older Chapter
    // schema still requires one, assign an internal value automatically.
    const numberPath =
      Chapter.schema.path('chapterNumber') ? 'chapterNumber' :
      Chapter.schema.path('number') ? 'number' :
      null;

    if (numberPath) {
      const siblings = await Chapter.find({ subject: subject._id }).lean();
      const names = siblings
        .map((chapter) => String(chapter.title ?? chapter.name ?? '').trim())
        .filter(Boolean)
        .concat(title)
        .sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
        );

      chapterData[numberPath] =
        names.findIndex(
          (name) =>
            name.localeCompare(title, undefined, { sensitivity: 'base' }) === 0
        ) + 1;
    }

    const chapter = await Chapter.create(chapterData);
    await recordAdminActivity(req.user, 'Created', 'Chapter', chapter._id);

    const sortField = Chapter.schema.path('title')
      ? 'title'
      : Chapter.schema.path('name')
        ? 'name'
        : '_id';

    const chapters = await Chapter.find({ subject: subject._id })
      .populate('subject')
      .sort({ [sortField]: 1 });

    return res.status(201).json({
      success: true,
      message: 'Chapter created successfully.',
      data: chapter,
      chapters
    });
  } catch (err) {
    console.error('Create chapter error:', err);

    if (err?.name === 'ValidationError' || err?.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          err?.code === 11000
            ? 'This chapter already exists.'
            : err.message
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || 'Unable to create chapter.'
    });
  }
};

// @desc    Get chapters alphabetically for admin/NAVTA TEST consumers
// @route   GET /api/admin/chapters
// @access  Private (Admin)
exports.getChapters = async (req, res) => {
  try {
    const query = {};
    const escapeRegex = (value) =>
      String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (req.query.subject) {
      const subjectInput = String(req.query.subject).trim();
      let subject = null;

      if (/^[a-f\d]{24}$/i.test(subjectInput)) {
        subject = await Subject.findById(subjectInput);
      }

      if (!subject) {
        subject = await Subject.findOne({
          name: { $regex: `^${escapeRegex(subjectInput)}$`, $options: 'i' }
        });
      }

      if (!subject) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }

      query.subject = subject._id;
    }

    const examValue = String(
      req.query.examination ?? req.query.exam ?? req.query.preparation ?? ''
    ).trim();

    if (examValue) {
      if (Chapter.schema.path('examination')) query.examination = examValue;
      else if (Chapter.schema.path('exam')) query.exam = examValue;
      else if (Chapter.schema.path('preparation')) query.preparation = examValue;
    }

    const classValue = String(
      req.query.classLevel ?? req.query.className ?? req.query.class ?? ''
    ).trim();

    if (classValue) {
      if (Chapter.schema.path('classLevel')) query.classLevel = classValue;
      else if (Chapter.schema.path('className')) query.className = classValue;
      else if (Chapter.schema.path('class')) query.class = classValue;
    }

    const sortField = Chapter.schema.path('title')
      ? 'title'
      : Chapter.schema.path('name')
        ? 'name'
        : '_id';

    const chapters = await Chapter.find(query)
      .populate('subject')
      .sort({ [sortField]: 1 });

    return res.status(200).json({
      success: true,
      count: chapters.length,
      data: chapters
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete subject category
// @route   DELETE /api/admin/subjects/:id
// @access  Private (Admin)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    
    // Check if chapters exist, ideally we should cascade delete or throw error.
    await Subject.deleteOne({ _id: req.params.id });
    await recordAdminActivity(req.user, 'Deleted', 'Subject', subject._id);
    res.status(200).json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete chapter
// @route   DELETE /api/admin/chapters/:id
// @access  Private (Admin)
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    
    await Chapter.deleteOne({ _id: req.params.id });
    await recordAdminActivity(req.user, 'Deleted', 'Chapter', chapter._id);
    res.status(200).json({ success: true, message: 'Chapter deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete note
// @route   DELETE /api/admin/notes/:id
// @access  Private (Admin)
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    
    await Note.deleteOne({ _id: req.params.id });
    await recordAdminActivity(req.user, 'Deleted', 'Study note', note._id);
    res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete PYQ
// @route   DELETE /api/admin/pyqs/:id
// @access  Private (Admin)
exports.deletePYQ = async (req, res) => {
  try {
    const pyq = await PYQ.findById(req.params.id);
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found' });
    
    await PYQ.deleteOne({ _id: req.params.id });
    await recordAdminActivity(req.user, 'Deleted', 'PYQ', pyq._id);
    res.status(200).json({ success: true, message: 'PYQ deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

async function listCatalog(req, res, Model, populate = []) {
  try {
    const filter = {};
    if (req.query.status === 'active') filter.archivedAt = null;
    if (req.query.status === 'archived') filter.archivedAt = { $ne: null };

    const paging = pagination(req.query, await Model.countDocuments(filter));
    const data = await Model.find(filter)
      .populate(populate)
      .sort({ createdAt: -1, _id: -1 })
      .skip((paging.page - 1) * paging.limit)
      .limit(paging.limit)
      .lean();
    return res.json({ success: true, data, pagination: paging });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to load the catalogue.' });
  }
}

exports.getPYQs = (req, res) => listCatalog(req, res, PYQ, [
  { path: 'subject', select: 'name' },
  { path: 'chapter', select: 'title' }
]);

exports.getRewards = (req, res) => listCatalog(req, res, Reward);

const isId = (value) => mongoose.isObjectIdOrHexString(value);
const trimmed = (value) => typeof value === 'string' ? value.trim() : '';
const numericValue = (value) =>
  typeof value === 'number' || (typeof value === 'string' && value.trim()) ? Number(value) : NaN;

function isHttpUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

async function savePYQ(req, res, updating) {
  try {
    let paper = null;
    if (updating) {
      if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid PYQ ID.' });
      paper = await PYQ.findById(req.params.id);
      if (!paper) return res.status(404).json({ success: false, message: 'PYQ not found.' });
    }

    const { subjectId, chapterId, title, examName, year, pdfUrl } = req.body;
    const subject = subjectId ?? paper?.subject;
    const chapter = (chapterId === undefined ? paper?.chapter : chapterId) || null;
    const paperTitle = title === undefined ? paper?.title : trimmed(title);
    const exam = examName === undefined ? paper?.examName : trimmed(examName);
    const examYear = year === undefined ? paper?.year : numericValue(year);
    const url = pdfUrl === undefined ? paper?.pdfUrl || '' : trimmed(pdfUrl);

    if (!paperTitle || !exam || !Number.isInteger(examYear) || examYear < 1 || examYear > 9999) {
      return res.status(400).json({ success: false, message: 'Enter a paper title, exam name, and valid exam year.' });
    }
    if ((!updating || pdfUrl !== undefined) && url && !isHttpUrl(url)) {
      return res.status(400).json({ success: false, message: 'Enter an HTTP or HTTPS PDF link.' });
    }
    if (!isId(subject) || !await Subject.exists({ _id: subject })) {
      return res.status(400).json({ success: false, message: 'Select a valid subject.' });
    }
    if (chapter && (!isId(chapter) || !await Chapter.exists({ _id: chapter, subject }))) {
      return res.status(400).json({ success: false, message: 'Select a chapter that belongs to the subject.' });
    }

    const fields = { subject, chapter, title: paperTitle, examName: exam, year: examYear, pdfUrl: url };
    if (paper) {
      paper.set(fields);
      await paper.save();
    } else {
      paper = await PYQ.create({ ...fields, uploadedBy: req.user._id || req.user.id });
    }

    await recordAdminActivity(req.user, updating ? 'Updated' : 'Created', 'PYQ', paper._id);
    return res.status(updating ? 200 : 201).json({ success: true, data: paper });
  } catch (error) {
    const invalid = error.name === 'ValidationError';
    return res.status(invalid ? 400 : 500).json({
      success: false,
      message: invalid ? 'Check the paper details before saving.' : 'Unable to save this PYQ.'
    });
  }
}

exports.createPYQ = (req, res) => savePYQ(req, res, false);
exports.updatePYQ = (req, res) => savePYQ(req, res, true);

async function saveReward(req, res, updating) {
  try {
    let reward = null;
    if (updating) {
      if (!isId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid reward ID.' });
      reward = await Reward.findById(req.params.id);
      if (!reward) return res.status(404).json({ success: false, message: 'Reward not found.' });
    }

    const { title, description, costCoins, badgeImage, type } = req.body;
    const fields = {
      title: title === undefined ? reward?.title : trimmed(title),
      description: description === undefined ? reward?.description : trimmed(description),
      costCoins: costCoins === undefined ? reward?.costCoins : numericValue(costCoins),
      badgeImage: badgeImage === undefined ? reward?.badgeImage || 'award' : trimmed(badgeImage) || 'award',
      type: type === undefined ? reward?.type || 'badge' : type
    };
    if (!fields.title || !fields.description || !['coupon', 'badge', 'resource'].includes(fields.type)) {
      return res.status(400).json({ success: false, message: 'Enter a reward title, description, and valid type.' });
    }
    if (!Number.isFinite(fields.costCoins) || fields.costCoins < 0 || fields.costCoins > Number.MAX_SAFE_INTEGER) {
      return res.status(400).json({ success: false, message: 'Enter a valid nonnegative coin cost.' });
    }

    if (reward) {
      reward.set(fields);
      await reward.save();
    } else {
      reward = await Reward.create(fields);
    }

    await recordAdminActivity(req.user, updating ? 'Updated' : 'Created', 'Reward', reward._id);
    return res.status(updating ? 200 : 201).json({ success: true, data: reward });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Reward item already exists.' });
    }
    const invalid = error.name === 'ValidationError';
    return res.status(invalid ? 400 : 500).json({
      success: false,
      message: invalid ? 'Check the reward details before saving.' : 'Unable to save this reward.'
    });
  }
}

exports.createReward = (req, res) => saveReward(req, res, false);
exports.updateReward = (req, res) => saveReward(req, res, true);

async function setCatalogArchived(req, res, Model, resource) {
  try {
    const { archived } = req.body;
    const { id } = req.params;
    if (!isId(id) || typeof archived !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Select a valid item and archive status.' });
    }

    const updated = await Model.findOneAndUpdate(
      { _id: id, archivedAt: archived ? null : { $ne: null } },
      { $set: { archivedAt: archived ? new Date() : null } },
      { new: true }
    );
    const item = updated || await Model.findById(id);
    if (!item) return res.status(404).json({ success: false, message: `${resource} not found.` });
    if (updated) await recordAdminActivity(req.user, archived ? 'Archived' : 'Restored', resource, id);
    return res.json({ success: true, data: item });
  } catch {
    return res.status(500).json({ success: false, message: `Unable to change the archive status of this ${resource}.` });
  }
}

exports.setPYQArchived = (req, res) => setCatalogArchived(req, res, PYQ, 'PYQ');
exports.setRewardArchived = (req, res) => setCatalogArchived(req, res, Reward, 'Reward');

// @desc    Get system global usage reports
// @route   GET /api/admin/dashboard-stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const studentsCount = await Student.countDocuments();
    const teachersCount = await Teacher.countDocuments();
    const subjectsCount = await Subject.countDocuments();
    const resultsCount = await Result.countDocuments();
    const rewardsCount = await Reward.countDocuments();

    // Average performance scoring
    const results = await Result.find();
    const totalScorePercent = results.reduce((acc, curr) => acc + curr.percentage, 0);
    const averageScore = resultsCount > 0 ? Math.round(totalScorePercent / resultsCount) : 0;

    res.status(200).json({
      success: true,
      stats: {
        studentsCount,
        teachersCount,
        subjectsCount,
        resultsCount,
        rewardsCount,
        averageScore
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all questions
// @route   GET /api/admin/questions
// @access  Private (Admin)
exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find().populate('subject chapter');
    res.status(200).json({ success: true, count: questions.length, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a new question
// @route   POST /api/admin/questions
// @access  Private (Admin)
exports.createQuestion = async (req, res) => {
  try {
    const { subject, chapter, questionType, text, options, correctOption, correctAnswer, explanation, difficulty } = req.body;

    const questionData = {
      questionType: questionType || 'mcq',
      text,
      explanation,
      difficulty
    };

    if (subject) questionData.subject = subject;
    if (chapter) questionData.chapter = chapter;

    if (questionData.questionType === 'mcq') {
      if (!options || options.length < 2) {
        return res.status(400).json({ success: false, message: 'MCQ questions require at least 2 options.' });
      }
      if (correctOption === undefined || correctOption < 0) {
        return res.status(400).json({ success: false, message: 'MCQ questions require a correctOption index.' });
      }
      questionData.options = options;
      questionData.correctOption = correctOption;
    } else {
      if (!correctAnswer) {
        return res.status(400).json({ success: false, message: 'Short/Long questions require a correctAnswer.' });
      }
      questionData.correctAnswer = correctAnswer;
    }

    const question = await Question.create(questionData);
    await recordAdminActivity(req.user, 'Created', 'Question', question._id);
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete question
// @route   DELETE /api/admin/questions/:id
// @access  Private (Admin)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    
    await Question.deleteOne({ _id: req.params.id });
    await recordAdminActivity(req.user, 'Deleted', 'Question', question._id);
    res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
