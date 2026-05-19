import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function DoctorHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/history', { params: { search } });
        // Filter by specialization for doctor
        const filtered = res.data.filter(h => h.specialization === user?.specialization);
        setHistory(filtered);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [search]);

  return (
    <div>
      <div className="page-header">
        <h1>Patient History</h1>
        <p>Completed patient records for {user?.specialization} department</p>
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          placeholder="🔍 Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
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
                <th>Problem</th>
                <th>Mode</th>
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
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{h.problem}</td>
                  <td><span className={`badge badge-${h.mode}`}>{h.mode}</span></td>
                  <td style={{ fontSize: 12 }}>
                    {new Date(h.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(h.visitDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    {h.meetingLink ? (
                      <a href={h.meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)' }}>🔗 Link</a>
                    ) : '—'}
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
