import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const SPECIALIZATIONS = ['Fever', 'Heart', 'General', 'Orthopedic', 'Skin', 'Eye', 'ENT'];
const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'];

export default function PatientRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', age: '', problem: '', specialization: 'General',
    mode: 'offline', timeSlot: '', phone: '', address: '',
    email: '', password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Register the patient record + get token/QR
      const res = await api.post('/patients/register', form);
      const patient = res.data.patient;

      // 2. Create a login account for this patient
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        patientId: patient._id
      });

      setResult(patient);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div style={{ width: '100%', maxWidth: 480, padding: '0 16px' }}>
        <div className="login-box">
          <div className="login-logo">
            <h1>Medi<span>Mitra</span></h1>
            <p>Patient Self Registration</p>
          </div>

          {step < 3 && (
            <div className="tabs" style={{ marginBottom: 18 }}>
              <div className={`tab ${step === 1 ? 'active' : ''}`}>1. Personal Info</div>
              <div className={`tab ${step === 2 ? 'active' : ''}`}>2. Appointment</div>
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}

          {step === 1 && (
            <div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Your name" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Age *</label>
                  <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} required placeholder="Age" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Address</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Address (optional)" />
              </div>

              {/* Login credentials section */}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  🔐 Create Login Credentials
                </p>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="Create a password"
                    minLength={4}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  You'll use this email &amp; password to sign in later as a Patient.
                </p>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 18 }} onClick={() => {
                if (!form.name || !form.age) { setError('Name and age are required'); return; }
                if (!form.email || !form.password) { setError('Email and password are required to create your login'); return; }
                setError(''); setStep(2);
              }}>Next →</button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Problem / Symptoms</label>
                <textarea value={form.problem} onChange={e => setForm({ ...form, problem: e.target.value })} required placeholder="Describe your symptoms..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Specialization</label>
                  <select value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })}>
                    {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mode</label>
                  <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
                    <option value="offline">Offline (Visit)</option>
                    <option value="online">Online (Meeting)</option>
                  </select>
                </div>
              </div>
              {form.mode === 'online' && (
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label>Preferred Time Slot</label>
                  <select value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })} required>
                    <option value="">Select time</option>
                    {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? <><span className="spinner"></span> Registering...</> : 'Register'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && result && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <h3 style={{ marginBottom: 4 }}>Registration Successful!</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>Your account and appointment have been created</p>

              {/* Token */}
              <div style={{ background: 'var(--primary-pale)', borderRadius: 10, padding: '14px 16px', marginBottom: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>TOKEN NUMBER</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--primary)' }}>#{result.tokenNumber}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{result.name} · {result.specialization}</div>
                {result.mode === 'online' && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Time Slot: {result.timeSlot}</div>
                    <a href={result.meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>🔗 Join Meeting</a>
                  </div>
                )}
              </div>

              {/* Login credentials reminder */}
              <div style={{ background: '#fffbea', border: '1.5px solid #f0d070', borderRadius: 10, padding: '12px 16px', marginBottom: 12, textAlign: 'left' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#856404', marginBottom: 8 }}>🔐 Your Login Credentials</p>
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Email:</span> <strong>{form.email}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Password:</span> <strong>{form.password}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Role:</span> <strong>Patient</strong></div>
                </div>
                <p style={{ fontSize: 11, color: '#856404', marginTop: 8 }}>📌 Save these — you'll need them to sign in.</p>
              </div>

              {result.qrCode && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Your QR Code (for history access)</div>
                  <img src={result.qrCode} alt="QR Code" style={{ width: 110, height: 110 }} />
                </div>
              )}

              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block' }}>Sign In Now →</Link>
            </div>
          )}

          {step < 3 && (
            <p style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              Already registered? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
