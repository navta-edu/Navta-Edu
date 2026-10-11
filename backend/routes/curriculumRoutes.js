const express = require('express');
const { protect, authorizeRoles } = require('../middleware/auth');
const {
  listClasses, createClass, updateClass,
  listPreparationMethods, createPreparationMethod, updatePreparationMethod,
  listSubjects, updateSubjectLinks
} = require('../controllers/curriculumController');

const router = express.Router();
// Read-only curriculum lists are public so student-facing selectors can use them.
router.get('/classes', listClasses);
router.get('/preparation-methods', listPreparationMethods);
router.get('/subjects', listSubjects);

// Curriculum changes are restricted to administrators.
router.use(protect, authorizeRoles('admin'));
router.post('/classes', createClass);
router.patch('/classes/:id', updateClass);
router.post('/preparation-methods', createPreparationMethod);
router.patch('/preparation-methods/:id', updatePreparationMethod);
router.patch('/subjects/:id/links', updateSubjectLinks);

module.exports = router;
