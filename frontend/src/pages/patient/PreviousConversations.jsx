import { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function PreviousConversations({ patientName, onReopen }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/ai/conversations/${encodeURIComponent(patientName)}`);
        setConversations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (patientName) fetchConversations();
  }, [patientName]);

  if (loading) {
    return (
      <div className="card" style={{ maxWidth: 680, textAlign: 'center', padding: 40 }}>
        <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', width: 24, height: 24, margin: '0 auto 8px' }}></div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading your previous conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="card" style={{ maxWidth: 680 }}>
        <div className="empty">
          <div className="icon">💬</div>
          <p>No previous AI conversations yet. Start one from the AI Assistant tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {conversations.map(c => (
        <div key={c.sessionId} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              💬 {c.preview}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span>{new Date(c.lastMessageAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span>{c.messageCount} message{c.messageCount === 1 ? '' : 's'}</span>
              {c.department && <span className="badge badge-current" style={{ fontSize: 10 }}>{c.department}</span>}
            </div>
          </div>
          <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => onReopen(c.sessionId)}>
            Reopen
          </button>
        </div>
      ))}
    </div>
  );
}
