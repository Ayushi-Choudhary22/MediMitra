const Payment = require('../models/Payment');
const User = require('../models/User');
const { createAppointmentFromBooking } = require('./patientController');
const { getRazorpayInstance, verifySignature } = require('../utils/razorpayClient');

const buildBookingDetails = async (body) => {
  const { name, age, problem, specialization, mode, timeSlot, phone, address, doctorId } = body;

  if (!name || !age || !problem || !specialization || !mode) {
    throw Object.assign(new Error('Missing required booking fields'), { statusCode: 400 });
  }
  if (mode === 'online' && !timeSlot) {
    throw Object.assign(new Error('timeSlot is required for online appointments'), { statusCode: 400 });
  }

  let doctor = null;
  if (doctorId) {
    doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) throw Object.assign(new Error('Selected doctor was not found'), { statusCode: 404 });
  }

  return {
    bookingDetails: {
      name, age, problem, specialization, mode,
      timeSlot: mode === 'online' ? timeSlot : '',
      phone: phone || '',
      address: address || '',
      doctorId: doctor?._id,
      doctorName: doctor?.name || '',
    },
    amount: doctor?.consultationFee ?? 500, // fallback flat fee if no doctor selected
  };
};

// POST /api/payments/create-order
// Step 1 of the online flow: creates a Razorpay order and a 'created' Payment
// record with the booking snapshot. Does NOT create the appointment yet.
exports.createOrder = async (req, res) => {
  try {
    const { registeredBy } = req.body;
    const { bookingDetails, amount } = await buildBookingDetails(req.body);

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    const payment = await Payment.create({
      bookingDetails,
      amount,
      currency: 'INR',
      method: 'razorpay',
      razorpayOrderId: order.id,
      status: 'created',
      registeredBy: registeredBy === 'receptionist' ? 'receptionist' : 'patient',
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentRecordId: payment._id,
      doctorName: bookingDetails.doctorName,
      patientName: bookingDetails.name,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// POST /api/payments/verify
// Step 2: verifies the Razorpay signature server-side. Only on a verified
// signature is the appointment actually created. A failed/tampered
// signature never creates an appointment.
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentRecordId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const payment = await Payment.findById(paymentRecordId);
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'This payment has already been processed' });
    }

    const isValid = verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed. Appointment was not created.' });
    }

    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.transactionId = razorpay_payment_id;
    payment.paymentDate = new Date();

    // Only now — after confirmed payment — does the appointment get created.
    const appointment = await createAppointmentFromBooking(payment.bookingDetails);
    payment.appointmentId = appointment._id;
    await payment.save();

    res.json({ success: true, patient: appointment, payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/payments/cash
// For receptionist desk registration when the walk-in patient chooses to
// pay in cash/card at the counter instead of Razorpay. The receptionist
// confirms payment was received in person, so the appointment (and a
// 'paid' payment record for history/receipts) is created immediately.
exports.recordCashPayment = async (req, res) => {
  try {
    const { bookingDetails, amount } = await buildBookingDetails(req.body);

    const payment = await Payment.create({
      bookingDetails,
      amount,
      currency: 'INR',
      method: 'cash',
      status: 'paid',
      transactionId: `CASH-${Date.now()}`,
      paymentDate: new Date(),
      registeredBy: 'receptionist',
    });

    const appointment = await createAppointmentFromBooking(bookingDetails);
    payment.appointmentId = appointment._id;
    await payment.save();

    res.json({ success: true, patient: appointment, payment });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// POST /api/payments/demo
// Demo/Test Payment Mode — for interviews and project demonstrations where
// real Razorpay payment can't be completed. Behaves exactly like a
// confirmed real payment: creates the appointment, token, and QR code
// immediately, and is stored with a clearly-labeled "Success (Demo)"
// status so it's never confused with a real transaction in reports.
// The real Razorpay flow (createOrder/verifyPayment) is untouched by this.
exports.recordDemoPayment = async (req, res) => {
  try {
    const { registeredBy } = req.body;
    const { bookingDetails, amount } = await buildBookingDetails(req.body);

    const payment = await Payment.create({
      bookingDetails,
      amount,
      currency: 'INR',
      method: 'demo',
      status: 'paid',
      statusLabel: 'Success (Demo)',
      transactionId: `DEMO-${Date.now()}`,
      paymentDate: new Date(),
      registeredBy: registeredBy === 'receptionist' ? 'receptionist' : 'patient',
    });

    const appointment = await createAppointmentFromBooking(bookingDetails);
    payment.appointmentId = appointment._id;
    await payment.save();

    res.json({ success: true, patient: appointment, payment });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

// GET /api/payments/history/:patientName
exports.getPaymentHistory = async (req, res) => {
  try {
    const { patientName } = req.params;
    const payments = await Payment.find({ 'bookingDetails.name': patientName }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/:id  (used to render a receipt)
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
