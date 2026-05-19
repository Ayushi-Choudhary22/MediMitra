const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Allow requests from any Vercel/frontend origin
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    callback(null, true); // Allow all origins (you can restrict to your Vercel URL after deploy)
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/queue', require('./routes/queueRoutes'));

// Health check
app.get('/', (req, res) => res.json({ status: 'MediMitra API running ✅' }));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medimitra';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB error:', err));
