import { useEffect, useState } from 'react';
import api from '../../utils/api';

const SPECIALIZATIONS = ['All', 'Fever', 'Heart', 'General', 'Orthopedic', 'Skin', 'Eye', 'ENT'];

export default function QueueView() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [spec, setSpec] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const params = {};
      if (spec !== 'All') params.specialization = spec;
      if (search) params.search = search;
      const res = await api.get('/queue', { params });
      setPatients(res.data); // already ordered: current first, then waiting
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchQueue(); const i = setInterval(fetchQueue, 10000); return () => clearInterval(i); }, [spec, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove patient from queue?')) return;
    await api.delete(`/patients/${id}`);
    fetchQueue();
  };

  const currentPatient = patients.find(p => p.status === 'current');
  const waitingPatients = patients.filter(p => p.status === 'waiting');

  return (
    <div>
      <div className="page-header">
        <h1>Patient Queue</h1>
        <p>Live view of all waiting and current patients</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Search patient..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SPECIALIZATIONS.map(s => (
            <button
              key={s}
              className={`btn btn-sm ${spec === s ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSpec(s)}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--success-light)', border: '1.5px solid var(--success)' }}></div>
          <span>🟢 Current (being seen now)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#fff3cd', border: '1.5px solid #856404' }}></div>
          <span>⏳ Waiting</span>
        </div>
      </div>

      {/* Current patient highlight block */}
      {currentPatient && (
        <div style={{
          background: '#d4f4e3', border: '2px solid #4caf88', borderRadius: 10,
          padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 28 }}>🟢</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1a7a4a' }}>Currently in Consultation</div>
            <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>
              <strong>#{currentPatient.tokenNumber}</strong> — {currentPatient.name} ({currentPatient.specialization})
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
            {waitingPatients.length} patient{waitingPatients.length !== 1 ? 's' : ''} waiting
          </div>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : patients.length === 0 ? (
        <div className="card empty">
          <div className="icon">🏥</div>
          <p>Queue is empty</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Token</th>
                <th>Patient</th>
                <th>Problem</th>
                <th>Dept</th>
                <th>Mode</th>
                <th>Time Slot</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} style={{ background: p.status === 'current' ? '#eaf7f1' : 'transparent' }}>
                  {/* Queue position */}
                  <td>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: p.status === 'current'
                        ? 'var(--success)'
                        : p.patientsAhead === 1 ? 'var(--primary)' : '#e5e7eb',
                      color: (p.status === 'current' || p.patientsAhead === 1) ? '#fff' : '#6b7280',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 12, margin: '0 auto',
                    }}>
                      {p.queuePosition}
                    </div>
                  </td>
                  <td><div className="token-badge">#{p.tokenNumber}</div></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Age: {p.age}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: 180 }}>{p.problem}</td>
                  <td>{p.specialization}</td>
                  <td><span className={`badge badge-${p.mode}`}>{p.mode}</span></td>
                  <td style={{ fontSize: 12 }}>{p.timeSlot || '—'}</td>
                  <td>
                    <span className={`badge badge-${p.status}`}>
                      {p.status === 'current' ? '🟢 Current' : '⏳ Waiting'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>
        Total in queue: <strong>{patients.length}</strong> · Auto-refreshes every 10s
      </div>
    </div>
  );
}
