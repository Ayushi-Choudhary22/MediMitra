const express = require('express');
const router = express.Router();
const { getAllHistory, getPatientHistory } = require('../controllers/historyController');

router.get('/', getAllHistory);
router.get('/patient/:patientId', getPatientHistory);

module.exports = router;
