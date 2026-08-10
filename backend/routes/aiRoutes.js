const express = require('express');
const router = express.Router();
const { chat, getHistory, getConversations, getConversationById } = require('../controllers/aiAssistantController');
const { generateSummary } = require('../controllers/aiSummaryController');
const { explainPrescription } = require('../controllers/aiPrescriptionController');
const { getSymptomSuggestions } = require('../controllers/aiSymptomSuggestionsController');

router.post('/chat', chat);
router.get('/history/:patientName', getHistory);
router.get('/conversations/:patientName', getConversations);
router.get('/conversations/:patientName/:sessionId', getConversationById);
router.get('/summary/:patientName', generateSummary);
router.get('/prescription/:historyId', explainPrescription);
router.post('/symptom-suggestions', getSymptomSuggestions);

module.exports = router;
