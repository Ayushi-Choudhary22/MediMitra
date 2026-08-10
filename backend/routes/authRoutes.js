const express = require('express');
const router = express.Router();
const { login, register, getDoctors } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.get('/doctors', getDoctors);

module.exports = router;
