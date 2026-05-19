import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PatientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: 'var(--primary)' }}>
            Medi<span style={{ color: 'var(--accent)' }}>Mitra</span>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 12 }}>Patient Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Welcome, <strong>{user?.name}</strong></span>
          <button className="btn btn-outline btn-sm" onClick={() => { logout(); navigate('/login'); }}>Sign Out</button>
        </div>
      </div>
      <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
