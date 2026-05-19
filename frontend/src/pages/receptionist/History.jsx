import { useEffect, useState } from 'react';
import api from '../../utils/api';

const SPECIALIZATIONS = ['All', 'Fever', 'Heart', 'General', 'Orthopedic', 'Skin', 'Eye', 'ENT'];

export default function ReceptionistHistory() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [spec, setSpec] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/history', { params: { search } });
        const filtered = spec === 'All' ? res.data : res.data.filter(h => h.specialization === spec);
        setHistory(filtered);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchHistory();
  }, [search, spec]);

  return (
    <div>
      <div className="page-header">
        <h1>Patient History</h1>
        <p>All completed patient records across all departments</p>
      </div>

      {/* Stats bar */}
      <div style={{ background: 'var(--card)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>{history.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Completed</div>
          </div>
        </div>
        {spec !== 'All' && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing <strong>{spec}</strong> department records
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="🔍 Search by patient name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240 }}
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

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : history.length === 0 ? (
        <div className="card empty">
          <div className="icon">📋</div>
          <p>No history records found</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient</th>
                <th>Department</th>
                <th>Problem</th>
                <th>Mode</th>
                <th>Time Slot</th>
                <th>Visit Date</th>
                <th>Meeting</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h._id}>
                  <td><div className="token-badge">#{h.tokenNumber}</div></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Age: {h.age}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, background: 'var(--primary-pale)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                      {h.specialization}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 180 }}>{h.problem}</td>
                  <td><span className={`badge badge-${h.mode}`}>{h.mode}</span></td>
                  <td style={{ fontSize: 12 }}>{h.timeSlot || '—'}</td>
                  <td style={{ fontSize: 12 }}>
                    {new Date(h.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(h.visitDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    {h.meetingLink
                      ? <a href={h.meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)' }}>🔗 Link</a>
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
        Total records: <strong>{history.length}</strong>
      </div>
    </div>
  );
}
