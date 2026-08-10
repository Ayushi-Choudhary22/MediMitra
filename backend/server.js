const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Allow requests from any Vercel/frontend origin
app.use(cors({
  //origin-website(address from which the request is coming), callback-return final descision(allow/block)
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    callback(null, true); // Allow all origins (you can restrict to your Vercel URL after deploy)
  },
  credentials: true
}));

app.use(express.json());//parses incoming JSON request

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/queue', require('./routes/queueRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/ai-help', require('./routes/aiHelpRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Health check   SERVER IS RUNNING
app.get('/', (req, res) => res.json({ status: 'MediMitra API running ✅' }));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medimitra';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB error:', err));
