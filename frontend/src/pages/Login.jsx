import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const DEMO_ACCOUNTS = [
  { label: 'Receptionist', email: 'receptionist@medimitra.com', password: 'rec123', role: 'receptionist' },
  { label: 'Dr. Sharma (Fever)', email: 'doctor.fever@medimitra.com', password: 'doc123', role: 'doctor' },
  { label: 'Dr. Verma (Heart)', email: 'doctor.heart@medimitra.com', password: 'doc123', role: 'doctor' },
  { label: 'Dr. Gupta (General)', email: 'doctor.general@medimitra.com', password: 'doc123', role: 'doctor' },
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', role: 'receptionist' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user);
      const role = res.data.user.role;
      navigate(role === 'receptionist' ? '/receptionist' : role === 'doctor' ? '/doctor' : '/patient');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password, role: account.role });
  };

  return (
    <div className="login-page">
      <div style={{ width: '100%', maxWidth: 800, padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Login Box */}
          <div className="login-box">
            <div className="login-logo">
              <h1>Medi<span>Mitra</span></h1>
              <p>Hospital Management System</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="patient">Patient</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="Enter email" />
              </div>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Enter password" />
              </div>
              <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%' }} disabled={loading}>
                {loading ? <><span className="spinner"></span> Signing in...</> : 'Sign In'}
              </button>
            </form>

            <p style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              New patient? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register here</Link>
            </p>
          </div>

          {/* Demo Accounts */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Demo Accounts</p>
            {DEMO_ACCOUNTS.map(acc => (
              <div
                key={acc.email}
                onClick={() => fillDemo(acc)}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 8,
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{acc.label}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{acc.email} · {acc.password}</div>
              </div>
            ))}
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 10 }}>Click to auto-fill credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
}
