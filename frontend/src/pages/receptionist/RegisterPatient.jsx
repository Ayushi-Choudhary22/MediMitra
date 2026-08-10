import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import DoctorPicker from '../../components/DoctorPicker';
import PaymentReceipt from '../../components/PaymentReceipt';
import { payAndBookAppointment, recordCashAppointment, recordDemoAppointment, isDemoPaymentEnabled } from '../../utils/payments';

const SPECIALIZATIONS = ['Fever', 'Heart', 'General', 'Orthopedic', 'Skin', 'Eye', 'ENT'];
const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'];

export default function RegisterPatient() {
  const [form, setForm] = useState({
    name: '', age: '', problem: '', specialization: 'General',
    mode: 'offline', timeSlot: '', phone: '', address: '', doctorId: '', paymentMethod: 'cash'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [payment, setPayment] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = form.paymentMethod === 'razorpay'
        ? await payAndBookAppointment({ bookingForm: form, doctorId: form.doctorId, registeredBy: 'receptionist' })
        : form.paymentMethod === 'demo'
        ? await recordDemoAppointment({ bookingForm: form, doctorId: form.doctorId, registeredBy: 'receptionist' })
        : await recordCashAppointment({ bookingForm: form, doctorId: form.doctorId });

      setSuccess(result.patient);
      setPayment(result.payment);
      setForm({ name: '', age: '', problem: '', specialization: 'General', mode: 'offline', timeSlot: '', phone: '', address: '', doctorId: '', paymentMethod: 'cash' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const historyUrl = success ? `${window.location.origin}/history/${success._id}` : '';

  return (
    <div>
      <div className="page-header">
        <h1>Register Patient</h1>
        <p>Fill in patient details to register and assign a token</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: success ? '1fr 340px' : '1fr', gap: 18 }}>
        {/* Form */}
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Patient name" />
              </div>
              <div className="form-group">
                <label>Age *</label>
                <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} required placeholder="Age" min={0} max={150} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Mobile number" />
              </div>
              <div className="form-group">
                <label>Specialization *</label>
                <select value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })}>
                  {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <DoctorPicker
                specialization={form.specialization}
                value={form.doctorId}
                onChange={doctorId => setForm(prev => ({ ...prev, doctorId }))}
              />
              <div className="form-group">
                <label>Payment Method *</label>
                <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option value="cash">Pay at Counter (Cash/Card)</option>
                  <option value="razorpay">Pay Online (Razorpay)</option>
                  {isDemoPaymentEnabled() && <option value="demo">🧪 Demo Payment (Testing/Demo Only)</option>}
                </select>
              </div>
              <div className="form-group full">
                <label>Address</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Patient address" />
              </div>
              <div className="form-group full">
                <label>Problem / Chief Complaint *</label>
                <textarea value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })} required placeholder="Describe the patient's symptoms or problem..." rows={3} />
              </div>
              <div className="form-group">
                <label>Consultation Mode *</label>
                <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value, timeSlot: '' })}>
                  <option value="offline">Offline (In-Person)</option>
                  <option value="online">Online (Video Meeting)</option>
                </select>
              </div>
              {form.mode === 'online' && (
                <div className="form-group">
                  <label>Time Slot *</label>
                  <select value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })} required>
                    <option value="">Select time slot</option>
                    {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !form.doctorId}>
                {loading ? <><span className="spinner"></span> Processing...</> : form.paymentMethod === 'razorpay' ? '💳 Collect Payment & Register' : form.paymentMethod === 'demo' ? '🧪 Confirm Demo Payment & Register' : '💵 Confirm Cash Payment & Register'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => { setForm({ name: '', age: '', problem: '', specialization: 'General', mode: 'offline', timeSlot: '', phone: '', address: '', doctorId: '', paymentMethod: 'cash' }); setSuccess(null); setPayment(null); setError(''); }}>
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Success / Token Display */}
        {success && (
          <div>
            <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Token Assigned</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>#{success.tokenNumber}</div>
              <div style={{ marginTop: 10, fontWeight: 600, fontSize: 15 }}>{success.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Age: {success.age} · {success.specialization}</div>
              <div style={{ marginTop: 8 }}>
                <span className={`badge badge-${success.mode}`}>{success.mode}</span>
              </div>
              {success.mode === 'online' && (
                <div style={{ marginTop: 10, background: 'var(--primary-pale)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Time: {success.timeSlot}</div>
                  <a href={success.meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, wordBreak: 'break-all' }}>🔗 {success.meetingLink}</a>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>Patient QR Code</div>
              <div className="qr-wrap">
                <QRCodeSVG value={historyUrl} size={140} level="M" />
                <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>Scan to view patient history</p>
              </div>
              {success.qrCode && (
                <a
                  href={success.qrCode}
                  download={`qr-token-${success.tokenNumber}.png`}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                >
                  ⬇ Download QR
                </a>
              )}
            </div>

            {payment && <PaymentReceipt payment={payment} patient={success} />}
          </div>
        )}
      </div>
    </div>
  );
}
