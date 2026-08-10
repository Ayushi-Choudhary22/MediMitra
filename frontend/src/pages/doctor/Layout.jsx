import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/doctor', label: 'Dashboard', icon: '📊', end: true },
  { to: '/doctor/patients', label: 'My Patients', icon: '👥' },
  { to: '/doctor/history', label: 'History', icon: '📋' },
  { to: '/doctor/scanner', label: 'QR Scanner', icon: '📷' },
];

export default function DoctorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Medi<span>Mitra</span></h2>
          <div className="sidebar-role">Doctor Panel</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{user?.specialization} Dept.</span>
          </div>
          <button className="btn btn-outline btn-sm" style={{ width: '100%', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }} onClick={() => { logout(); navigate('/login'); }}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <span className="topbar-title">Doctor Portal – {user?.specialization} Department</span>
          <div className="topbar-right">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
