const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['receptionist', 'doctor', 'patient'], required: true },
  specialization: { type: String, default: '' }, // for doctors
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' } // for patients
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
