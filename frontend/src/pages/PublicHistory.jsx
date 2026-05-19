import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

export default function PublicHistory() {
  const { patientId } = useParams();
  const [history, setHistory] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, hRes] = await Promise.all([
          api.get(`/patients/${patientId}`),
          api.get(`/history/patient/${patientId}`)
        ]);
        setPatient(pRes.data);
        setHistory(hRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', width: 32, height: 32 }}></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', color: 'var(--primary)' }}>Medi<span style={{ color: 'var(--accent)' }}>Mitra</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Patient History Record</p>
        </div>

        {patient && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{patient.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Age: {patient.age} · {patient.specialization}</p>
              </div>
              <div className="token-badge" style={{ width: 44, height: 44, fontSize: 16 }}>#{patient.tokenNumber}</div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <span className={`badge badge-${patient.mode}`}>{patient.mode}</span>
              <span className={`badge badge-${patient.status}`}>{patient.status}</span>
            </div>
          </div>
        )}

        <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Visit History ({history.length})</h3>

        {history.length === 0 ? (
          <div className="card empty">
            <div className="icon">📋</div>
            <p>No visit history yet</p>
          </div>
        ) : (
          history.map((h, i) => (
            <div className="card" key={h._id} style={{ marginBottom: 10 }}>
              <div className="flex-between">
                <span style={{ fontWeight: 600, fontSize: 13 }}>Visit {history.length - i}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(h.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <p style={{ fontSize: 13, marginTop: 6, color: 'var(--text)' }}>🩺 {h.problem}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Dept: {h.specialization} · Token #{h.tokenNumber}</p>
              {h.mode === 'online' && h.meetingLink && (
                <a href={h.meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4, display: 'block' }}>🔗 Meeting Link</a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
