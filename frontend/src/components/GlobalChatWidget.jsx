import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function GlobalChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // {role, message}
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, open]);

  // Reset the conversation whenever the logged-in identity changes (login,
  // logout, or switching to a different account/role). Without this, the
  // widget's in-memory messages persist across auth changes because this
  // component is mounted once at the App level and never unmounts on
  // navigation — so a patient's chat would otherwise still be visible
  // after logging out and back in as a receptionist or doctor.
  useEffect(() => {
    setMessages([]);
    setOpen(false);
  }, [user?._id]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: 'user', message: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const res = await api.post('/ai-help/chat', {
        message: text,
        history: nextMessages.slice(0, -1), // prior turns for context
        userRole: user?.role,
        userName: user?.name,
      });
      setMessages(prev => [...prev, { role: 'assistant', message: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        message: err.response?.data?.message || "Sorry, I couldn't reach the assistant right now. Please try again.",
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };

  return (
    <>
      {/* Floating icon — always visible, every page, every role */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close help chat' : 'Open help chat'}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: 'var(--primary)', color: '#fff', fontSize: 24,
          cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {open ? '×' : '💬'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 86, right: 20, zIndex: 1000,
          width: 340, maxWidth: 'calc(100vw - 40px)', height: 460,
          maxHeight: 'calc(100vh - 120px)',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 14px', background: 'var(--primary)', color: '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>🤖 MediMitra Help</div>
              <div style={{ fontSize: 10, opacity: 0.85 }}>Ask about the app or general health questions</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 8px' }}>
                Hi{user?.name ? ` ${user.name}` : ''} 👋 Ask me how to use MediMitra, or any general health question.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  background: m.role === 'user' ? 'var(--primary)' : 'var(--bg)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  borderRadius: 10, padding: '8px 11px', fontSize: 12.5, lineHeight: 1.45, whiteSpace: 'pre-wrap',
                }}>
                  {m.message}
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
                  padding: '8px 11px', fontSize: 12, color: 'var(--text-muted)',
                }}>
                  <span className="spinner" style={{ width: 10, height: 10, borderWidth: 2, marginRight: 6, verticalAlign: 'middle' }}></span>
                  Typing...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid var(--border)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              disabled={sending}
              style={{ flex: 1, fontSize: 12.5 }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}