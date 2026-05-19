import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function DoctorPatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients', {
        params: { specialization: user?.specialization, search }
      });
      setPatients(res.data.filter(p => p.status !== 'completed'));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPatients(); }, [search]);

  const markComplete = async (id) => {
    await api.put(`/patients/${id}/status`, { status: 'completed' });
    fetchPatients();
  };

  const markCurrent = async (id) => {
    await api.put(`/queue/${id}/current`, { specialization: user?.specialization });
    fetchPatients();
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Patients</h1>
        <p>All {user?.specialization} patients — waiting and in consultation</p>
      </div>

      <div style={{ marginBottom: 14 }}>
        <input
          placeholder="🔍 Search patients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : patients.length === 0 ? (
        <div className="card empty">
          <div className="icon">👥</div>
          <p>No patients assigned to {user?.specialization} department</p>
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
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p._id} className={p.status === 'current' ? 'current-row' : ''}>
                  <td><div className="token-badge">#{p.tokenNumber}</div></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Age: {p.age}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: 200, fontSize: 13 }}>{p.problem}</td>
                  <td>
                    <span className={`badge badge-${p.mode}`}>{p.mode}</span>
                    {p.mode === 'online' && p.meetingLink && (
                      <a href={p.meetingLink} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 10, color: 'var(--primary)', marginTop: 3 }}>🔗 Join</a>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>{p.timeSlot || '—'}</td>
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {p.status === 'waiting' && (
                        <button className="btn btn-primary btn-sm" onClick={() => markCurrent(p._id)}>Call</button>
                      )}
                      {p.status === 'current' && (
                        <button className="btn btn-success btn-sm" onClick={() => markComplete(p._id)}>✅ Done</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
