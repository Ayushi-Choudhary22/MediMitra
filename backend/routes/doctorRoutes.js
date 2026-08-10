const express = require('express');
const router = express.Router();
const { getDoctors } = require('../controllers/authController');

router.get('/', getDoctors);

module.exports = router;
