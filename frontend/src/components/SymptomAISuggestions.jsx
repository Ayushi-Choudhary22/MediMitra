import { useState } from 'react';
import api from '../utils/api';

function ListSection({ title, icon, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>{icon} {title}</div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2, lineHeight: 1.4 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * symptoms: current value of the booking form's problem/symptoms field
 * age: optional, improves suggestion quality
 * onUseSpecialization: optional callback(specialization) if the parent wants
 *   to offer a "use this department" convenience action
 */
export default function SymptomAISuggestions({ symptoms, age, onUseSpecialization }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSuggestions = async () => {
    if (!symptoms || !symptoms.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/ai/symptom-suggestions', { symptoms, age });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not get AI suggestions right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={fetchSuggestions}
        disabled={loading || !symptoms?.trim()}
      >
        {loading ? <><span className="spinner"></span> Analyzing...</> : '✨ Get AI Suggestions'}
      </button>

      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}

      {result && (
        <div style={{
          marginTop: 10, background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 12,
        }}>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 10 }}>{result.explanation}</div>

          <ListSection title="Possible Common Causes" icon="🔍" items={result.possibleCauses} />
          <ListSection title="Home-Care Suggestions" icon="🏠" items={result.homeCare} />
          <ListSection title="Precautions" icon="⚠️" items={result.precautions} />

          {result.consultAdvice && (
            <div style={{ fontSize: 12, marginBottom: 10 }}>
              <strong>Should you see a doctor?</strong> {result.consultAdvice}
            </div>
          )}

          <div style={{ fontSize: 12, marginBottom: 8 }}>
            <strong>Recommended specialization:</strong> {result.specialization}
            {onUseSpecialization && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ marginLeft: 8 }}
                onClick={() => onUseSpecialization(result.specialization)}
              >
                Use this
              </button>
            )}
          </div>

          {result.doctors?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>👨‍⚕️ Matching Doctors</div>
              {result.doctors.map(doc => (
                <div key={doc._id} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {doc.name} {doc.experience && `· ${doc.experience}`} {doc.availableTimings && `· ${doc.availableTimings}`}
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
