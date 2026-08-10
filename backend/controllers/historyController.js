const History = require('../models/History');

exports.getAllHistory = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    const history = await History.find(filter).sort({ visitDate: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPatientHistory = async (req, res) => {
  try {
    const history = await History.find({ patientId: req.params.patientId }).sort({ visitDate: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
