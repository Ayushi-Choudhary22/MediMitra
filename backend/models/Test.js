const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  roomNumber: { type: String, required: true },
  cost: { type: Number, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
