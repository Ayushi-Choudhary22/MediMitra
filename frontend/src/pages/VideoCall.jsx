import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function VideoCall() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [camError, setCamError] = useState('');
  const streamRef = useRef(null);

  const patientName = searchParams.get('name') || 'Patient';
  const roomName = searchParams.get('room') || 'MediMitraRoom';

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setStatus('ready');
    } catch (err) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
        setCamError('Camera/microphone access was denied. Please allow permissions in your browser settings and reload.');
      } else if (err.name === 'NotFoundError') {
        setCamError('No camera or microphone found on this device.');
      } else {
        setCamError('Could not start camera: ' + err.message);
      }
      setStatus('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMicOn(p => !p);
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCamOn(p => !p);
    }
  };

  const endCall = () => {
    stopCamera();
    navigate(-1);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0d1117', display: 'flex', flexDirection: 'column', zIndex: 9999 }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#0d1f2d', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'serif', color: '#fff', fontWeight: 700, fontSize: 20 }}>
            Medi<span style={{ color: '#f0a500' }}>Mitra</span>
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Video Consultation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {status === 'ready' && (
            <span style={{ fontSize: 12, color: '#2ea06b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ea06b', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
              Camera Active
            </span>
          )}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 6 }}>
            Room: {roomName.substring(0, 20)}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 24 }}>

        {/* Loading */}
        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#fff' }}>
            <div style={{ fontSize: 52 }}>📹</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Starting video call...</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Please allow camera & microphone access when prompted</div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', borderTop: '3px solid #f0a500', animation: 'spin 0.8s linear infinite', marginTop: 8 }}></div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#fff', maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 52 }}>⚠️</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Camera access failed</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{camError}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: 8, lineHeight: 1.7 }}>
              💡 Fix: Click the 🔒 lock icon in your browser address bar → Allow Camera & Microphone → Reload page
            </div>
            <button onClick={() => window.location.reload()} style={{ background: '#0f6b5e', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
              🔄 Reload & Try Again
            </button>
          </div>
        )}

        {/* Camera feed */}
        {status === 'ready' && (
          <div style={{ width: '100%', maxWidth: 900, display: 'flex', gap: 16, flexDirection: 'column', alignItems: 'center' }}>

            {/* Main video — local camera */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 720, borderRadius: 16, overflow: 'hidden', background: '#111', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', display: 'block', minHeight: 400, objectFit: 'cover', transform: 'scaleX(-1)' /* mirror */ }}
              />
              {!camOn && (
                <div style={{ position: 'absolute', inset: 0, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 48 }}>👤</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Camera is off</div>
                </div>
              )}
              {/* Name label */}
              <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                {patientName} (You)
              </div>
            </div>

            {/* Doctor placeholder */}
            <div style={{ width: '100%', maxWidth: 720, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 32 }}>👨‍⚕️</div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 14 }}>Doctor</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 }}>Waiting to join... · Room: {roomName.substring(0, 24)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      {status === 'ready' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '16px 24px', background: '#0d1f2d', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button
            onClick={toggleMic}
            style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 20, background: micOn ? 'rgba(255,255,255,0.12)' : '#e05252', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={micOn ? 'Mute' : 'Unmute'}
          >
            {micOn ? '🎙️' : '🔇'}
          </button>
          <button
            onClick={toggleCam}
            style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 20, background: camOn ? 'rgba(255,255,255,0.12)' : '#e05252', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={camOn ? 'Stop camera' : 'Start camera'}
          >
            {camOn ? '📹' : '📷'}
          </button>
          <button
            onClick={endCall}
            style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 20, background: '#e05252', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="End call"
          >
            📵
          </button>
        </div>
      )}

      {status !== 'ready' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px', flexShrink: 0 }}>
          <button onClick={endCall} style={{ background: '#e05252', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            ✕ Cancel
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>
    </div>
  );
}
