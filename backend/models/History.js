const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  name: { type: String, required: true },
  age: { type: Number },
  problem: { type: String },
  specialization: { type: String },
  mode: { type: String },
  timeSlot: { type: String },
  meetingLink: { type: String },
  tokenNumber: { type: Number },
  visitDate: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('History', historySchema);
