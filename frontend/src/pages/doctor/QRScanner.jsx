import { useEffect, useRef, useState } from 'react';

export default function QRScanner() {
  const [result, setResult] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const startScanner = async () => {
    setError('');
    setResult('');
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setResult(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      setError('Camera access denied or not available. ' + (err?.message || ''));
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); } catch {}
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const openLink = () => {
    if (result) window.open(result, '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <h1>QR Scanner</h1>
        <p>Scan patient QR code to view their history</p>
      </div>

      <div style={{ maxWidth: 500 }}>
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <div id="qr-reader" style={{ width: '100%', minHeight: scanning ? 300 : 0 }}></div>

          {!scanning && !result && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>📷</div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13 }}>
                Use your camera to scan a patient's QR code and instantly view their medical history
              </p>
              <button className="btn btn-primary btn-lg" onClick={startScanner}>
                Start Camera
              </button>
            </div>
          )}

          {scanning && (
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>📸 Point camera at QR code...</p>
              <button className="btn btn-outline" onClick={stopScanner}>Stop Scanner</button>
            </div>
          )}

          {result && (
            <div>
              <div className="alert alert-success" style={{ marginBottom: 12 }}>
                ✅ QR Code scanned successfully!
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 7, padding: '10px 12px', fontSize: 13, marginBottom: 14, wordBreak: 'break-all' }}>
                <strong>URL:</strong> {result}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={openLink}>🔗 Open Patient History</button>
                <button className="btn btn-outline" onClick={() => { setResult(''); setError(''); }}>Scan Again</button>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Manual Entry</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Or enter a patient ID or history URL directly:</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Paste patient history URL..."
              value={result}
              onChange={e => setResult(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={openLink} disabled={!result}>Open</button>
          </div>
        </div>
      </div>
    </div>
  );
}
