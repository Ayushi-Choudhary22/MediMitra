const User = require('../models/User');

// Seed default users if not exist
const seedUsers = async () => {
  const users = [
    { name: 'Receptionist One', email: 'receptionist@medimitra.com', password: 'rec123', role: 'receptionist' },
    { name: 'Dr. Sharma (Fever)', email: 'doctor.fever@medimitra.com', password: 'doc123', role: 'doctor', specialization: 'Fever' },
    { name: 'Dr. Verma (Heart)', email: 'doctor.heart@medimitra.com', password: 'doc123', role: 'doctor', specialization: 'Heart' },
    { name: 'Dr. Gupta (General)', email: 'doctor.general@medimitra.com', password: 'doc123', role: 'doctor', specialization: 'General' },
    { name: 'Dr. Patel (Ortho)', email: 'doctor.ortho@medimitra.com', password: 'doc123', role: 'doctor', specialization: 'Orthopedic' },
  ];

  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) await User.create(u);
  }
};

seedUsers().catch(console.error);

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, password, role });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        patientId: user.patientId
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, patientId } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'This email is already registered. Please use a different email or sign in.' });

    const user = await User.create({
      name, email, password, role: 'patient',
      patientId: patientId || undefined
    });
    res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
