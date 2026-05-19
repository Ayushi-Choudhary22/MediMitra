const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  problem: { type: String, required: true },
  specialization: { type: String, required: true },
  mode: { type: String, enum: ['online', 'offline'], required: true },
  timeSlot: { type: String, default: '' },
  meetingLink: { type: String, default: '' },
  tokenNumber: { type: Number },
  qrCode: { type: String, default: '' },
  status: { type: String, enum: ['waiting', 'current', 'completed'], default: 'waiting' },
  registeredBy: { type: String, default: 'receptionist' }, // 'receptionist' or 'self'
  phone: { type: String, default: '' },
  address: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
