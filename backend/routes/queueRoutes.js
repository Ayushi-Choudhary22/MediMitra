const express = require('express');
const router = express.Router();
const { getQueue, setCurrentPatient } = require('../controllers/queueController');

router.get('/', getQueue);
router.put('/:id/current', setCurrentPatient);

module.exports = router;
