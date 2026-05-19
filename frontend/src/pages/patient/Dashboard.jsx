import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../utils/api';

const SPECIALIZATIONS = ['Fever', 'Heart', 'General', 'Orthopedic', 'Skin', 'Eye', 'ENT'];
const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'];


// ── Inline Bed Availability View for patients (read-only style) ──────────────
const BED_WARDS = [
  { id: 'general',   name: 'General Ward',  icon: '🏥', totalBeds: 10 },
  { id: 'icu',       name: 'ICU',           icon: '💊', totalBeds: 6  },
  { id: 'private',   name: 'Private Ward',  icon: '🛏️', totalBeds: 8  },
  { id: 'emergency', name: 'Emergency',     icon: '🚨', totalBeds: 4  },
];

// Simulated availability — in production connect to backend
const DEMO_OCCUPIED = { general: [2,5,7], icu: [1,3,4], private: [2,6], emergency: [1] };

function BedAvailabilityView() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>🛏️ Bed Availability</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current bed status across all wards</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
        {BED_WARDS.map(ward => {
          const occupied = DEMO_OCCUPIED[ward.id]?.length || 0;
          const available = ward.totalBeds - occupied;
          return (
            <div key={ward.id} style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 14px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>{ward.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{ward.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ward.totalBeds} total beds</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: available > 0 ? 'var(--success)' : '#e05252', lineHeight: 1 }}>{available}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>available</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed grid per ward */}
      {BED_WARDS.map(ward => {
        const occupiedNums = DEMO_OCCUPIED[ward.id] || [];
        return (
          <div key={ward.id} style={{ background: 'var(--card)', borderRadius: 10, padding: '14px 16px', marginBottom: 12, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{ward.icon}</span> {ward.name}
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>● Available: {ward.totalBeds - occupiedNums.length}</span>
                <span style={{ color: '#e05252', fontWeight: 600 }}>● Occupied: {occupiedNums.length}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {Array.from({ length: ward.totalBeds }, (_, i) => {
                const num = i + 1;
                const isOccupied = occupiedNums.includes(num);
                return (
                  <div key={num} style={{
                    background: isOccupied ? '#fdf0f0' : '#eaf7f1',
                    border: `2px solid ${isOccupied ? '#e05252' : '#4caf88'}`,
                    borderRadius: 8, padding: '8px 4px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 16 }}>🛏️</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isOccupied ? '#e05252' : '#2ea06b', marginTop: 2 }}>B{num}</div>
                    <div style={{ fontSize: 9, color: isOccupied ? '#e05252' : '#2ea06b', fontWeight: 600 }}>{isOccupied ? 'Occupied' : 'Free'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
        Contact reception for bed booking · Availability updates in real-time
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [queueInfo, setQueueInfo] = useState(null); // live queue data for active patient
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registerForm, setRegisterForm] = useState({
    name: user?.name || '', age: '', problem: '', specialization: 'General',
    mode: 'offline', timeSlot: '', phone: ''
  });
  const [registering, setRegistering] = useState(false);
  const [regResult, setRegResult] = useState(null);
  const [tab, setTab] = useState('status');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      const [pRes, hRes] = await Promise.all([
        api.get('/patients', { params: { search: user?.name } }),
        api.get('/history', { params: { search: user?.name } })
      ]);
      setPatients(pRes.data);
      setHistory(hRes.data);

      // Find their active patient record
      const active = pRes.data.find(p => p.status === 'waiting' || p.status === 'current');
      if (active) {
        // Get full queue for their specialization to calculate position
        const qRes = await api.get('/queue', { params: { specialization: active.specialization } });
        const queueList = qRes.data;
        const myEntry = queueList.find(q => q._id.toString() === active._id.toString());
        setQueueInfo(myEntry || null);
      } else {
        setQueueInfo(null);
      }
      setLastUpdated(new Date());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Auto-refresh every 8 seconds so patient sees live updates
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [regResult]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await api.post('/patients/register', registerForm);
      setRegResult(res.data.patient);
      setTab('status');
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setRegistering(false); }
  };

  const activePatient = patients.find(p => p.status === 'waiting' || p.status === 'current');

  // Queue status display helpers
  const isOnline = activePatient?.mode === 'online';

  const getQueueMessage = () => {
    if (!queueInfo) return null;
    const ahead = queueInfo.patientsAhead;
    if (queueInfo.status === 'current') return {
      emoji: isOnline ? '💻' : '🟢',
      text: isOnline ? 'Join your video consultation!' : "It's your turn!",
      sub: isOnline
        ? 'Click the meeting link below to start your online consultation'
        : "Please proceed to the doctor's cabin now",
      color: 'var(--success)', bg: 'var(--success-light)', border: 'var(--success)'
    };
    if (ahead === 0) return {
      emoji: '🔔', text: "You're next!",
      sub: isOnline ? 'Keep your meeting link ready — your turn is very soon' : 'Get ready — you are first in queue',
      color: 'var(--success)', bg: 'var(--success-light)', border: 'var(--success)'
    };
    if (ahead === 1) return {
      emoji: '⏰', text: 'Almost your turn!',
      sub: isOnline ? 'Only 1 patient ahead — keep your meeting link ready' : 'Only 1 patient ahead of you — please be ready',
      color: '#c77700', bg: '#fff8e0', border: '#f0d060'
    };
    return {
      emoji: '⏳',
      text: `Your turn is after ${ahead} patient${ahead > 1 ? 's' : ''}`,
      sub: isOnline
        ? `You are #${queueInfo.queuePosition} in queue — your meeting link is ready below`
        : `You are #${queueInfo.queuePosition} in the queue`,
      color: '#5a6a85', bg: '#f0f4fa', border: '#c8d4e8'
    };
  };

  const queueMsg = getQueueMessage();

  return (
    <div>
      <div className="page-header">
        <h1>My Health Portal</h1>
        <p>Track your appointments and medical history</p>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'status' ? 'active' : ''}`} onClick={() => setTab('status')}>📋 My Status</div>
        <div className={`tab ${tab === 'book' ? 'active' : ''}`} onClick={() => setTab('book')}>➕ Book Appointment</div>
        <div className={`tab ${tab === 'beds' ? 'active' : ''}`} onClick={() => setTab('beds')}>🛏️ Bed Availability</div>
        <div className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>📚 Visit History</div>
      </div>

      {tab === 'status' && (
        <div>
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', width: 28, height: 28, margin: '0 auto 10px' }}></div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your status...</p>
            </div>
          ) : activePatient ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 16, alignItems: 'start' }}>

              {/* Main status card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* ── LIVE QUEUE POSITION BANNER ── */}
                {queueMsg && (
                  <div style={{
                    background: queueMsg.bg,
                    border: `2px solid ${queueMsg.border}`,
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16
                  }}>
                    <div style={{ fontSize: 36, lineHeight: 1 }}>{queueMsg.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: queueMsg.color }}>{queueMsg.text}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{queueMsg.sub}</div>
                    </div>
                    {queueInfo && (
                      <div style={{ textAlign: 'center', background: '#fff', borderRadius: 10, padding: '8px 14px', minWidth: 80, flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Your Position</div>
                        <div style={{ fontSize: 30, fontWeight: 900, color: queueMsg.color, lineHeight: 1 }}>#{queueInfo.queuePosition}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          {queueInfo.patientsAhead === 0 && queueInfo.status !== 'current' ? 'Next up' : queueInfo.status === 'current' ? 'Now' : `${queueInfo.patientsAhead} ahead`}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── APPOINTMENT DETAILS ── */}
                <div className="card" style={{
                  borderLeft: `4px solid ${activePatient.status === 'current' ? 'var(--success)' : 'var(--accent)'}`
                }}>
                  <div className="flex-between" style={{ marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Token Number</div>
                      <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>#{activePatient.tokenNumber}</h2>
                    </div>
                    <span className={`badge badge-${activePatient.status}`} style={{ fontSize: 12, padding: '5px 14px' }}>
                      {activePatient.status === 'current' ? '🟢 In Consultation' : '⏳ Waiting'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Patient</div>
                      <div style={{ fontWeight: 700, marginTop: 2 }}>{activePatient.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Age: {activePatient.age}</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Department</div>
                      <div style={{ fontWeight: 700, marginTop: 2 }}>{activePatient.specialization}</div>
                      <span className={`badge badge-${activePatient.mode}`} style={{ marginTop: 4, display: 'inline-flex', fontSize: 11 }}>{activePatient.mode}</span>
                    </div>
                    {activePatient.timeSlot && (
                      <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Time Slot</div>
                        <div style={{ fontWeight: 700, marginTop: 2 }}>🕐 {activePatient.timeSlot}</div>
                      </div>
                    )}
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', gridColumn: activePatient.timeSlot ? 'auto' : '1/-1' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chief Complaint</div>
                      <div style={{ fontWeight: 500, marginTop: 2, fontSize: 13 }}>🩺 {activePatient.problem}</div>
                    </div>
                  </div>

                  {activePatient.mode === 'online' && activePatient.meetingLink && (
                    <div style={{ marginTop: 14, background: '#e8f4fd', border: '2px solid #0070c9', borderRadius: 10, padding: '14px' }}>
                      <div style={{ fontSize: 11, color: '#0070c9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                        💻 Online Consultation
                      </div>
                      {activePatient.timeSlot && (
                        <div style={{ fontSize: 13, marginBottom: 10, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>🕐</span>
                          <span>Scheduled at: <strong>{activePatient.timeSlot}</strong></span>
                        </div>
                      )}
                      <button
                        className="btn btn-primary"
                        style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', gap: 8, fontSize: 14, padding: '10px' }}
                        onClick={() => {
                          // Extract room name from meeting link or use patient ID as room
                          const link = activePatient.meetingLink || '';
                          const room = link.split('/').pop() || `MediMitra${activePatient._id}`;
                          navigate(`/video-call?room=${encodeURIComponent(room)}&name=${encodeURIComponent(activePatient.name)}`);
                        }}
                      >
                        📹 Join Video Consultation
                      </button>
                      <div style={{ fontSize: 10, color: '#5a6a85', marginTop: 8, textAlign: 'center' }}>
                        Camera &amp; microphone will open — allow permissions when asked
                      </div>
                    </div>
                  )}
                </div>

                {/* Auto-refresh indicator */}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }}></span>
                  Live updates every 8s
                  {lastUpdated && <span>· Last updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
                </div>
              </div>

              {/* QR Code */}
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Your QR Code</p>
                <div id="patient-qr" style={{ display: 'inline-block', padding: 8, background: '#fff', border: '2px solid var(--border)', borderRadius: 8 }}>
                  <QRCodeSVG
                    value={`${window.location.origin}/history/${activePatient._id}`}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>Scan to view medical history</p>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 8, width: '100%', fontSize: 11 }}
                  onClick={() => {
                    const svg = document.querySelector('#patient-qr svg');
                    if (!svg) return;
                    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'MediMitra-QR.svg'; a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  ⬇ Download QR
                </button>
              </div>
            </div>
          ) : (
            <div className="card empty">
              <div className="icon">🏥</div>
              <p>No active appointment found</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setTab('book')}>Book Appointment</button>
            </div>
          )}

          {regResult && (
            <div className="card" style={{ marginTop: 16, borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 30 }}>✅</div>
                <div>
                  <strong>Appointment Booked!</strong>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Token #{regResult.tokenNumber} assigned · {regResult.specialization} Dept · Queue updating automatically</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'book' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Book New Appointment</h3>
          <form onSubmit={handleRegister}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Age *</label>
                <input type="number" value={registerForm.age} onChange={e => setRegisterForm({ ...registerForm, age: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Specialization</label>
                <select value={registerForm.specialization} onChange={e => setRegisterForm({ ...registerForm, specialization: e.target.value })}>
                  {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Mode</label>
                <select value={registerForm.mode} onChange={e => setRegisterForm({ ...registerForm, mode: e.target.value, timeSlot: '' })}>
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>
              {registerForm.mode === 'online' && (
                <div className="form-group">
                  <label>Time Slot *</label>
                  <select value={registerForm.timeSlot} onChange={e => setRegisterForm({ ...registerForm, timeSlot: e.target.value })} required>
                    <option value="">Select time</option>
                    {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group full">
                <label>Problem / Symptoms *</label>
                <textarea value={registerForm.problem} onChange={e => setRegisterForm({ ...registerForm, problem: e.target.value })} required rows={3} placeholder="Describe your symptoms..." />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: 16 }} disabled={registering}>
              {registering ? <><span className="spinner"></span> Booking...</> : '📋 Book Appointment'}
            </button>
          </form>
        </div>
      )}

      {tab === 'beds' && (
        <BedAvailabilityView />
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="card empty">
              <div className="icon">📋</div>
              <p>No visit history found</p>
            </div>
          ) : (
            history.map((h, i) => (
              <div className="card" key={h._id} style={{ marginBottom: 10 }}>
                <div className="flex-between">
                  <div>
                    <div style={{ fontWeight: 700 }}>Visit {history.length - i} — {h.specialization} Dept.</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>🩺 {h.problem}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{new Date(h.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <span className={`badge badge-${h.mode}`} style={{ marginTop: 4, display: 'inline-flex', fontSize: 10 }}>{h.mode}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
