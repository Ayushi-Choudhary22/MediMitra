const Patient = require('../models/Patient');
const History = require('../models/History');
const TokenCounter = require('../models/TokenCounter');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const getNextToken = async () => {
  const today = new Date().toISOString().split('T')[0];
  const counter = await TokenCounter.findOneAndUpdate(
    { date: today },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
  return counter.count;
};

const generateMeetingLink = (timeSlot) => {
  // 100ms.live free room — opens camera immediately, no login needed
  const slug = uuidv4().replace(/-/g, '').substring(0, 12);
  return `https://meet.jit.si/MediMitra${slug}`;
};

/**
 * AUTO-PROMOTE: find the next waiting patient (lowest tokenNumber)
 * for this specialization and set them as 'current'.
 * Called after any patient is marked 'completed' or deleted while 'current'.
 */
const promoteNextInQueue = async (specialization) => {
  const next = await Patient.findOne(
    { specialization, status: 'waiting' },
    null,
    { sort: { tokenNumber: 1 } }
  );
  if (next) {
    next.status = 'current';
    await next.save();
  }
  return next;
};

exports.registerPatient = async (req, res) => {
  try {
    const { name, age, problem, specialization, mode, timeSlot, phone, address } = req.body;

    const tokenNumber = await getNextToken();
    const meetingLink = mode === 'online' ? generateMeetingLink(timeSlot) : '';

    const patient = await Patient.create({
      name, age, problem, specialization, mode,
      timeSlot: mode === 'online' ? timeSlot : '',
      meetingLink,
      tokenNumber,
      phone: phone || '',
      address: address || '',
      status: 'waiting'
    });

    // Generate QR Code pointing to patient history
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const historyUrl = `${frontendUrl}/history/${patient._id}`;
    const qrCode = await QRCode.toDataURL(historyUrl);
    patient.qrCode = qrCode;
    await patient.save();

    // AUTO-PROMOTE: if no one is 'current' for this specialization yet, make this patient current
    const existingCurrent = await Patient.findOne({ specialization, status: 'current' });
    if (!existingCurrent) {
      await promoteNextInQueue(specialization);
    }

    // Return the freshest version
    const updatedPatient = await Patient.findById(patient._id);
    res.json({ success: true, patient: updatedPatient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const { specialization, status, search } = req.query;
    const filter = {};
    if (specialization) filter.specialization = specialization;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const patients = await Patient.find(filter).sort({ tokenNumber: 1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePatientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (status === 'completed') {
      // Save visit to history
      await History.create({
        patientId: patient._id,
        name: patient.name,
        age: patient.age,
        problem: patient.problem,
        specialization: patient.specialization,
        mode: patient.mode,
        timeSlot: patient.timeSlot,
        meetingLink: patient.meetingLink,
        tokenNumber: patient.tokenNumber,
        visitDate: new Date()
      });

      // AUTO-PROMOTE: next waiting patient becomes current automatically
      await promoteNextInQueue(patient.specialization);
    }

    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    // If the deleted patient was 'current', auto-promote the next one
    if (patient && patient.status === 'current') {
      await promoteNextInQueue(patient.specialization);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await Patient.countDocuments();
    const waiting = await Patient.countDocuments({ status: 'waiting' });
    const current = await Patient.countDocuments({ status: 'current' });
    const completed = await History.countDocuments();
    res.json({ total, waiting, current, completed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
