const express = require('express');
const router = express.Router();
const {
  createOrder, verifyPayment, recordCashPayment, recordDemoPayment,
  getPaymentHistory, getPaymentById,
} = require('../controllers/paymentController');

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/cash', recordCashPayment);
router.post('/demo', recordDemoPayment);
router.get('/history/:patientName', getPaymentHistory);
router.get('/:id', getPaymentById);

module.exports = router;
