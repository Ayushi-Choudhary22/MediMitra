const express = require('express');
const router = express.Router();
const {
  registerPatient, getAllPatients, getPatientById,
  updatePatientStatus, deletePatient, getStats
} = require('../controllers/patientController');

router.post('/register', registerPatient);
router.get('/', getAllPatients);
router.get('/stats', getStats);
router.get('/:id', getPatientById);
router.put('/:id/status', updatePatientStatus);
router.delete('/:id', deletePatient);

module.exports = router;
