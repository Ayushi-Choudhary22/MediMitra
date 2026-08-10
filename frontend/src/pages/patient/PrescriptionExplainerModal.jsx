import { useEffect, useState } from 'react';
import api from '../../utils/api';

function MedicineCard({ med }) {
  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
      padding: 12, marginBottom: 10,
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>💊 {med.name}</div>
      {med.dosageAndFrequency && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{med.dosageAndFrequency}</div>
      )}

      <div style={{ fontSize: 12, lineHeight: 1.5 }}>
        <div style={{ marginBottom: 5 }}><strong>Purpose:</strong> {med.purpose}</div>
        <div style={{ marginBottom: 5 }}><strong>How to take:</strong> {med.howToTake}</div>
        <div style={{ marginBottom: 5 }}><strong>Food timing:</strong> {med.foodTiming}</div>
        <div style={{ marginBottom: 5 }}><strong>Common side effects:</strong> {med.sideEffects}</div>
        <div><strong>Precautions:</strong> {med.precautions}</div>
      </div>
    </div>
  );
}

export default function PrescriptionExplainerModal({ historyId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchExplanation = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/ai/prescription/${historyId}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to explain this prescription. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchExplanation();
    return () => { cancelled = true; };
  }, [historyId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>💊 Explain Prescription</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', width: 28, height: 28, margin: '0 auto 10px' }}></div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Explaining your prescription...</p>
          </div>
        ) : error ? (
          <div className="empty">
            <div className="icon">⚠️</div>
            <p>{error}</p>
          </div>
        ) : (
          <>
            {data.medicines.length === 0 ? (
              <div className="empty">
                <div className="icon">📋</div>
                <p>{data.generalNotes || 'No specific medicines were found in this prescription note.'}</p>
              </div>
            ) : (
              <>
                {data.medicines.map((med, i) => <MedicineCard key={i} med={med} />)}
                {data.generalNotes && (
                  <div style={{
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
                    padding: 12, fontSize: 12, lineHeight: 1.5, marginBottom: 10,
                  }}>
                    <strong>Other notes:</strong> {data.generalNotes}
                  </div>
                )}
              </>
            )}

            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              ⚠️ {data.disclaimer}
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
