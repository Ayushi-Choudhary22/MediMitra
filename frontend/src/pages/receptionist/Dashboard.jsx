import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState({ total: 0, waiting: 0, current: 0, completed: 0 });
  const [queuePatients, setQueuePatients] = useState([]); // active queue (current + waiting)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, queueRes] = await Promise.all([
          api.get('/patients/stats'),
          api.get('/queue'),           // returns ordered list with queuePosition
        ]);
        setStats(statsRes.data);
        setQueuePatients(queueRes.data.slice(0, 8)); // show up to 8 in dashboard
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const STAT_CARDS = [
    { label: 'Total Patients', value: stats.total, icon: '👥', color: '#e8f4fd', iconColor: '#0070c9' },
    { label: 'Waiting', value: stats.waiting, icon: '⏳', color: '#fff3cd', iconColor: '#856404' },
    { label: 'In Consultation', value: stats.current, icon: '🩺', color: 'var(--primary-pale)', iconColor: 'var(--primary)' },
    { label: 'Completed Today', value: stats.completed, icon: '✅', color: 'var(--success-light)', iconColor: 'var(--success)' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of today's patient activity</p>
      </div>

      <div className="stat-grid">
        {STAT_CARDS.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.color }}>
              <span>{s.icon}</span>
            </div>
            <div className="stat-info">
              <div className="value" style={{ color: s.iconColor }}>{s.value}</div>
              <div className="label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Live Queue</h2>
        <Link to="/receptionist/register-patient" className="btn btn-primary btn-sm">+ Register New</Link>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', width: 28, height: 28, margin: '0 auto' }}></div>
        </div>
      ) : queuePatients.length === 0 ? (
        <div className="card empty">
          <div className="icon">🏥</div>
          <p>No patients in queue. Register a new patient to get started.</p>
          <Link to="/receptionist/register-patient" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Register Patient</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pos</th>
                <th>Token</th>
                <th>Name</th>
                <th>Problem</th>
                <th>Dept</th>
                <th>Mode</th>
                <th>Time Slot</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {queuePatients.map(p => (
                <tr key={p._id} className={p.status === 'current' ? 'current-row' : ''}>
                  {/* Queue position badge */}
                  <td>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: p.status === 'current' ? 'var(--success)' : p.queuePosition === 2 ? 'var(--primary)' : '#e5e7eb',
                      color: (p.status === 'current' || p.queuePosition === 2) ? '#fff' : '#6b7280',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 12,
                    }}>
                      {p.queuePosition}
                    </div>
                  </td>
                  <td><div className="token-badge">#{p.tokenNumber}</div></td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.problem}</td>
                  <td>{p.specialization}</td>
                  <td><span className={`badge badge-${p.mode}`}>{p.mode}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.timeSlot || '—'}</td>
                  <td>
                    <span className={`badge badge-${p.status}`}>
                      {p.status === 'current' ? '🟢 Current' : '⏳ Waiting'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Link to="/receptionist/queue" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>View full queue →</Link>
      </div>
    </div>
  );
}
