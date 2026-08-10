import { useEffect, useState } from 'react';
import api from '../../utils/api';

function SummarySection({ title, icon, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
        {icon} {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 3, lineHeight: 1.4 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function AISummaryModal({ patientName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/ai/summary/${encodeURIComponent(patientName)}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to generate summary. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSummary();
    return () => { cancelled = true; };
  }, [patientName]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🤖 AI Medical History Summary</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Patient: <strong style={{ color: 'var(--text)' }}>{patientName}</strong>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', width: 28, height: 28, margin: '0 auto 10px' }}></div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Analyzing patient records...</p>
          </div>
        ) : error ? (
          <div className="empty">
            <div className="icon">⚠️</div>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
              padding: 12, marginBottom: 16, fontSize: 13, lineHeight: 1.5,
            }}>
              {data.summary}
            </div>

            <SummarySection title="Major Illnesses" icon="🩺" items={data.majorIllnesses} />
            <SummarySection title="Recent Medications" icon="💊" items={data.recentMedications} />
            <SummarySection title="Allergies" icon="⚠️" items={data.allergies} />
            <SummarySection title="Important Observations" icon="📌" items={data.importantObservations} />
            <SummarySection title="Suggested Focus Areas" icon="🎯" items={data.suggestedFocusAreas} />

            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              ⚠️ {data.disclaimer} · Based on {data.recordsAnalyzed} record{data.recordsAnalyzed === 1 ? '' : 's'} on file.
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
