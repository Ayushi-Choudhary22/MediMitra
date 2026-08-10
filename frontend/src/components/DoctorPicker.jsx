import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function DoctorPicker({ specialization, value, onChange }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const res = await api.get('/doctors');
        if (!cancelled) {
          const filtered = res.data.filter(d => d.specialization === specialization);
          setDoctors(filtered);
          // Auto-select the first doctor if current selection isn't valid for this specialization
          if (!filtered.some(d => d._id === value)) {
            onChange(filtered[0]?._id || '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDoctors();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialization]);

  return (
    <div className="form-group">
      <label>Select Doctor *</label>
      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No doctors available for {specialization} right now.</div>
      ) : (
        <select value={value} onChange={e => onChange(e.target.value)} required>
          {doctors.map(d => (
            <option key={d._id} value={d._id}>
              {d.name} {d.experience && `· ${d.experience}`} · ₹{d.consultationFee}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
