const Test = require('../models/Test');

exports.createTest = async (req, res) => {
  try {
    const test = await Test.create(req.body);
    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllTests = async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    await Test.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
