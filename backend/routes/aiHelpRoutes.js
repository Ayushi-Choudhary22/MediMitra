const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/aiHelpController');

router.post('/chat', chat);

module.exports = router;
