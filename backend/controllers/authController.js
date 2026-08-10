const User = require("../models/User");

// Seed default users if not exist
const seedUsers = async () => {
  const users = [
    {
      name: "Receptionist One",
      email: "receptionist@medimitra.com",
      password: "rec123",
      role: "receptionist",
    },
    {
      name: "Dr. Sharma (Fever)",
      email: "doctor.fever@medimitra.com",
      password: "doc123",
      role: "doctor",
      specialization: "Fever",
      experience: "6 years",
      availableTimings: "Mon-Sat, 09:00 AM - 02:00 PM",
      consultationFee: 300,
    },
    {
      name: "Dr. Verma (Heart)",
      email: "doctor.heart@medimitra.com",
      password: "doc123",
      role: "doctor",
      specialization: "Heart",
      experience: "12 years",
      availableTimings: "Mon-Fri, 10:00 AM - 04:00 PM",
      consultationFee: 900,
    },
    {
      name: "Dr. Gupta (General)",
      email: "doctor.general@medimitra.com",
      password: "doc123",
      role: "doctor",
      specialization: "General",
      experience: "9 years",
      availableTimings: "Mon-Sat, 09:00 AM - 05:00 PM",
      consultationFee: 400,
    },
    {
      name: "Dr. Patel (Ortho)",
      email: "doctor.ortho@medimitra.com",
      password: "doc123",
      role: "doctor",
      specialization: "Orthopedic",
      experience: "10 years",
      availableTimings: "Tue-Sun, 11:00 AM - 03:00 PM",
      consultationFee: 700,
    },
  ];

  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) await User.create(u);
    // Backfill fields for doctors created before these fields existed,
    // without touching any other data on the record.
    else if (u.role === "doctor" && (!exists.experience || !exists.availableTimings || !exists.consultationFee)) {
      exists.experience = exists.experience || u.experience;
      exists.availableTimings = exists.availableTimings || u.availableTimings;
      exists.consultationFee = exists.consultationFee || u.consultationFee;
      await exists.save();
    }
  }
};

seedUsers().catch(console.error);

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, password, role });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        patientId: user.patientId,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, patientId } = req.body;
    const exists = await User.findOne({ email });
    if (exists)
      return res
        .status(400)
        .json({
          message:
            "This email is already registered. Please use a different email or sign in.",
        });

    const user = await User.create({
      name,
      email,
      password,
      role: "patient",
      patientId: patientId || undefined,
    });
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//return all doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
