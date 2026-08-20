const express = require('express');

const router = express.Router();

const {
  chatWithStudent
} = require('../controllers/chatController');

router.post('/', chatWithStudent);

module.exports = router;
