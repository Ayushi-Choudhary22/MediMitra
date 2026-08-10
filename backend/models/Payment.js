const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Snapshot of the appointment booking form — used to create the actual
  // Patient/appointment record ONLY after payment is confirmed.
  bookingDetails: {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    problem: { type: String, required: true },
    specialization: { type: String, required: true },
    mode: { type: String, enum: ['online', 'offline'], required: true },
    timeSlot: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctorName: { type: String, default: '' },
  },

  amount: { type: Number, required: true }, // in INR (rupees)
  currency: { type: String, default: 'INR' },

  method: { type: String, enum: ['razorpay', 'cash', 'demo'], required: true },

  // Razorpay identifiers (only populated for method: 'razorpay')
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },

  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  // Human-readable override shown on receipts, e.g. "Success (Demo)".
  // Left blank for real razorpay/cash payments — status/method alone
  // already describe those clearly.
  statusLabel: { type: String, default: '' },
  transactionId: { type: String, default: '' }, // razorpay payment id, CASH-<timestamp>, or DEMO-<timestamp>
  paymentDate: { type: Date },

  // Linked once the appointment is actually created (post payment confirmation)
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },

  registeredBy: { type: String, enum: ['patient', 'receptionist'], default: 'patient' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
