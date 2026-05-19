import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ waiting: 0, current: null, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const fetchData = async () => {
    try {
      const [queueRes, statsRes] = await Promise.all([
        api.get('/queue', { params: { specialization: user?.specialization } }),
        api.get('/patients/stats')
      ]);
      // Backend already returns queue ordered: current first, then waiting by tokenNumber
      const q = queueRes.data;
      const waiting = q.filter(p => p.status === 'waiting');
      setQueue(q);
      setStats({ waiting: waiting.length, completed: statsRes.data.completed });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 8000);
    return () => clearInterval(i);
  }, []);

  const markCurrent = async (patientId) => {
    await api.put(`/queue/${patientId}/current`, { specialization: user?.specialization });
    fetchData();
  };

  const markComplete = async (patientId) => {
    setCompleting(true);
    try {
      // Backend auto-promotes next patient after marking complete
      await api.put(`/patients/${patientId}/status`, { status: 'completed' });
      await fetchData();
    } finally {
      setCompleting(false);
    }
  };

  const currentPatient = queue.find(p => p.status === 'current');
  const waitingPatients = queue.filter(p => p.status === 'waiting');

  return (
    <div>
      <div className="page-header">
        <h1>Doctor Dashboard</h1>
        <p>{user?.specialization} Department — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* ── Stats ── */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 500 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff3cd' }}>⏳</div>
          <div className="stat-info">
            <div className="value" style={{ color: '#856404' }}>{waitingPatients.length}</div>
            <div className="label">Waiting</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-pale)' }}>🩺</div>
          <div className="stat-info">
            <div className="value" style={{ color: 'var(--primary)' }}>{currentPatient ? 1 : 0}</div>
            <div className="label">In Consult</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>✅</div>
          <div className="stat-info">
            <div className="value" style={{ color: 'var(--success)' }}>{stats.completed}</div>
            <div className="label">Completed</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* ── CURRENT PATIENT ── */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🟢 Current Patient</h2>
          {currentPatient ? (
            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <div className="token-badge" style={{ width: 44, height: 44, fontSize: 15, borderRadius: 10 }}>
                  #{currentPatient.tokenNumber}
                </div>
                <span className="badge badge-current" style={{ fontSize: 12 }}>In Consultation</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{currentPatient.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Age: {currentPatient.age}</p>
              <div style={{ background: 'var(--bg)', borderRadius: 7, padding: '8px 10px', marginTop: 10, fontSize: 13 }}>
                🩺 <strong>Problem:</strong> {currentPatient.problem}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span className={`badge badge-${currentPatient.mode}`}>{currentPatient.mode}</span>
                {currentPatient.timeSlot && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>🕐 {currentPatient.timeSlot}</span>}
              </div>
              {currentPatient.mode === 'online' && currentPatient.meetingLink && (
                <div style={{ marginTop: 14, background: '#e8f4fd', border: '2px solid #0070c9', borderRadius: 10, padding: '14px' }}>
                  <div style={{ fontSize: 11, color: '#0070c9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    💻 Online Consultation
                  </div>
                  {currentPatient.timeSlot && (
                    <div style={{ fontSize: 13, marginBottom: 10, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🕐</span>
                      <span>Scheduled at: <strong>{currentPatient.timeSlot}</strong></span>
                    </div>
                  )}
                  <button
                    className="btn btn-primary"
                    style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: 14, padding: '10px' }}
                    onClick={() => {
                      const link = currentPatient.meetingLink || '';
                      const room = link.split('/').pop() || `MediMitra${currentPatient._id}`;
                      navigate(`/video-call?room=${encodeURIComponent(room)}&name=${encodeURIComponent('Dr. ' + (user?.name || 'Doctor'))}`);
                    }}
                  >
                    📹 Join Video Consultation
                  </button>
                  <div style={{ fontSize: 10, color: '#5a6a85', marginTop: 8, textAlign: 'center' }}>
                    Camera &amp; microphone will open — allow permissions when asked
                  </div>
                </div>
              )}
              <button
                className="btn btn-success"
                style={{ width: '100%', marginTop: 12 }}
                onClick={() => markComplete(currentPatient._id)}
                disabled={completing}
              >
                {completing
                  ? <><span className="spinner"></span> Processing...</>
                  : '✅ Mark as Complete'}
              </button>
              {waitingPatients.length > 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                  Next patient will be called automatically
                </p>
              )}
            </div>
          ) : (
            <div className="card empty">
              <div className="icon">🩺</div>
              <p>No patient in consultation</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                {waitingPatients.length > 0 ? 'Click "Call →" on a patient below' : 'Queue is empty'}
              </p>
            </div>
          )}
        </div>

        {/* ── WAITING QUEUE with position numbers ── */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
            ⏳ Waiting Queue ({waitingPatients.length})
          </h2>
          {waitingPatients.length === 0 ? (
            <div className="card empty">
              <div className="icon">✨</div>
              <p>Queue is clear!</p>
            </div>
          ) : (
            <div style={{ maxHeight: 440, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {waitingPatients.map((p) => {
                const pos = p.queuePosition; // from backend: 2, 3, 4...
                const isNext = p.patientsAhead === 1 || (!currentPatient && p.patientsAhead === 0);
                return (
                  <div
                    key={p._id}
                    className="queue-card"
                    style={{
                      borderLeft: isNext ? '3px solid var(--primary)' : '3px solid var(--border)',
                      background: isNext ? 'var(--primary-pale)' : '#fff',
                    }}
                  >
                    {/* Position circle */}
                    <div style={{
                      minWidth: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: isNext ? 'var(--primary)' : '#e5e7eb',
                      color: isNext ? '#fff' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 12,
                      flexShrink: 0,
                    }}>
                      {pos}
                    </div>

                    {/* Token */}
                    <div className="token-badge" style={{ flexShrink: 0 }}>#{p.tokenNumber}</div>

                    {/* Name + problem */}
                    <div className="queue-card-info">
                      <div className="queue-card-name">{p.name}</div>
                      <div className="queue-card-sub">
                        {p.problem} ·{' '}
                        <span className={`badge badge-${p.mode}`} style={{ fontSize: 10, padding: '1px 5px' }}>{p.mode}</span>
                        {isNext && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>← Next</span>}
                      </div>
                    </div>

                    {/* Manual call button */}
                    <button className="btn btn-primary btn-sm" onClick={() => markCurrent(p._id)}>Call →</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
