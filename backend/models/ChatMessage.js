const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  // Identifies which patient this conversation belongs to.
  // We key by name (same pattern already used by patient/history search
  // in patientController & historyController) since the app has no JWT/user id on requests.
  patientName: { type: String, required: true },
  // Authenticated patient's User document id, when available (added for
  // AI Chat History feature). Optional/nullable so existing rows and any
  // caller that only has a name keep working exactly as before.
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Groups messages into a single reopenable conversation. Existing rows
  // predate this field and will simply have '' — the UI treats those as
  // one legacy conversation per day, without altering the stored data.
  sessionId: { type: String, default: '', index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  message: { type: String, required: true },
  // Only set on assistant messages once a department has been identified
  department: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
