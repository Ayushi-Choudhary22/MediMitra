import { useEffect, useRef, useState } from 'react';
import api from '../../utils/api';

const DISCLAIMER_TEXT = 'This information is AI generated and should not replace professional medical advice.';

function DoctorResultCard({ doctor, onBook }) {
  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
      padding: '12px 14px', marginTop: 8, display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', gap: 12,
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{doctor.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {doctor.specialization} {doctor.experience && `· ${doctor.experience} experience`}
        </div>
        {doctor.availableTimings && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>🕐 {doctor.availableTimings}</div>
        )}
      </div>
      <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={onBook}>
        Book Appointment
      </button>
    </div>
  );
}

export default function AIAssistantChat({ patientName, patientId, resumeSessionId, onBookDepartment }) {
  const [messages, setMessages] = useState([]); // {role, message, department, doctors}
  const [sessionId, setSessionId] = useState(resumeSessionId || null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef(null);

  const storageKey = `medimitra_ai_session_${patientName}`;

  useEffect(() => {
    const loadConversation = async () => {
      setLoadingHistory(true);
      try {
        // Reopening a specific past conversation takes priority; otherwise
        // continue whatever session this patient last had open, if any.
        const targetSession = resumeSessionId || localStorage.getItem(storageKey);

        if (targetSession) {
          const res = await api.get(`/ai/conversations/${encodeURIComponent(patientName)}/${encodeURIComponent(targetSession)}`);
          setMessages(res.data.map(m => ({ role: m.role, message: m.message, department: m.department })));
          setSessionId(targetSession);
          localStorage.setItem(storageKey, targetSession);
        } else {
          setMessages([]);
          setSessionId(null);
        }
      } catch (err) {
        console.error(err);
        setMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    if (patientName) loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientName, resumeSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const startNewChat = () => {
    localStorage.removeItem(storageKey);
    setSessionId(null);
    setMessages([]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages(prev => [...prev, { role: 'user', message: text }]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post('/ai/chat', { message: text, patientName, patientId, sessionId });
      const { reply, department, doctors, sessionId: returnedSessionId } = res.data;
      setMessages(prev => [...prev, { role: 'assistant', message: reply, department, doctors }]);
      if (returnedSessionId && returnedSessionId !== sessionId) {
        setSessionId(returnedSessionId);
        localStorage.setItem(storageKey, returnedSessionId);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        message: err.response?.data?.message || "Sorry, I couldn't reach the assistant right now. Please try again.",
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', height: 560 }}>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>🤖 MediMitra Assistant</h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Describe your symptoms and I'll help point you to the right department.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={startNewChat} style={{ flexShrink: 0 }}>🆕 New Chat</button>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
          padding: '4px 2px', marginBottom: 12,
        }}
      >
        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', width: 24, height: 24, margin: '0 auto 8px' }}></div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty">
            <div className="icon">💬</div>
            <p>Tell me what symptoms you're experiencing to get started.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                background: m.role === 'user' ? 'var(--primary)' : 'var(--bg)',
                color: m.role === 'user' ? '#fff' : 'var(--text)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                borderRadius: 12,
                padding: '10px 13px',
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}>
                {m.message}
                {m.role === 'assistant' && m.doctors?.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {m.doctors.map(doc => (
                      <DoctorResultCard
                        key={doc._id}
                        doctor={doc}
                        onBook={() => onBookDepartment?.(m.department)}
                      />
                    ))}
                  </div>
                )}
                {m.role === 'assistant' && m.department && m.doctors?.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    No {m.department} department doctors are available right now — please check with reception.
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '10px 13px', fontSize: 13, color: 'var(--text-muted)',
            }}>
              <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, marginRight: 6, verticalAlign: 'middle' }}></span>
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Describe your symptoms..."
          disabled={sending}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>

      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
        ⚠️ {DISCLAIMER_TEXT}
      </div>
    </div>
  );
}
