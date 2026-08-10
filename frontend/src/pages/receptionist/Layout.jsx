import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/receptionist',              label: 'Dashboard',       icon: '📊', end: true },
  { to: '/receptionist/register-patient', label: 'Register Patient', icon: '➕' },
  { to: '/receptionist/queue',        label: 'Queue',           icon: '🔢' },
  { to: '/receptionist/history',      label: 'History',         icon: '📋' },
  { to: '/receptionist/beds',         label: 'Bed Availability', icon: '🛏️' },
  { to: '/receptionist/tests',        label: 'Test Info',       icon: '🧪' },
];

export default function ReceptionistLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Medi<span>Mitra</span></h2>
          <div className="sidebar-role">Receptionist Panel</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            {user?.email}
          </div>
          <button className="btn btn-outline btn-sm"
            style={{ width: '100%', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}
            onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <span className="topbar-title">Hospital Management</span>
          <div className="topbar-right">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
