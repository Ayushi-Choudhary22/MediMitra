import api from './api';

let scriptPromise = null;

/** Loads the Razorpay Checkout script once and caches the promise. */
export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script. Check your internet connection.'));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Full online payment flow for booking an appointment:
 * 1. Create a Razorpay order (server-side) for the selected doctor's fee
 * 2. Open Razorpay Checkout
 * 3. On success, verify the payment signature server-side
 * 4. Only then is the appointment actually created (by the backend)
 *
 * Resolves with { patient, payment } on a confirmed, verified payment.
 * Rejects with an Error (e.g. "Payment cancelled") otherwise — no appointment
 * is created in that case.
 */
export function payAndBookAppointment({ bookingForm, doctorId, registeredBy = 'patient' }) {
  return new Promise(async (resolve, reject) => {
    try {
      await loadRazorpayScript();

      const orderRes = await api.post('/payments/create-order', {
        ...bookingForm,
        doctorId,
        registeredBy,
      });
      const { orderId, amount, currency, keyId, paymentRecordId, doctorName, patientName } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'MediMitra',
        description: doctorName ? `Consultation with ${doctorName}` : 'Appointment Booking',
        order_id: orderId,
        prefill: { name: patientName, contact: bookingForm.phone || '' },
        theme: { color: '#2f6fed' },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              paymentRecordId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            resolve(verifyRes.data); // { success, patient, payment }
          } catch (err) {
            reject(new Error(err.response?.data?.message || 'Payment verification failed. Appointment was not created.'));
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment was cancelled.')),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        reject(new Error(response.error?.description || 'Payment failed.'));
      });
      rzp.open();
    } catch (err) {
      reject(new Error(err.response?.data?.message || err.message || 'Could not start payment.'));
    }
  });
}

/** For receptionist desk registration when the walk-in pays in cash/card at the counter. */
export async function recordCashAppointment({ bookingForm, doctorId }) {
  const res = await api.post('/payments/cash', { ...bookingForm, doctorId, registeredBy: 'receptionist' });
  return res.data; // { success, patient, payment }
}

/**
 * Demo/Test Payment Mode — for interviews and demonstrations where a real
 * Razorpay payment can't be completed. Skips Razorpay entirely but goes
 * through the exact same appointment-creation flow as a real payment
 * (token, QR code, DB save). Stored server-side with a clear "Success
 * (Demo)" label so it's never confused with a real transaction.
 */
export async function recordDemoAppointment({ bookingForm, doctorId, registeredBy = 'patient' }) {
  const res = await api.post('/payments/demo', { ...bookingForm, doctorId, registeredBy });
  return res.data; // { success, patient, payment }
}

/** Whether the Demo Payment button should be shown. Controlled via env so
 * it can be disabled for real production deployments without a code change. */
export const isDemoPaymentEnabled = () => import.meta.env.VITE_ENABLE_DEMO_PAYMENT === 'true';
