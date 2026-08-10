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
  //the actual consultation date
  visitDate: { type: Date, default: Date.now },
  //Doctor's consultation notes(Ex:takes medicine twice daily for 5 days)
  notes: { type: String, default: '' },
  // Doctor Consultation & Prescription feature
  diagnosis: { type: String, default: '' },
  prescription: { type: String, default: '' },
  allergy: { type: String, default: '' },
  followUpNotes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('History', historySchema);