import { useState } from 'react';

const WARDS = [
  { id: 'general', name: 'General Ward', icon: '🏥', color: '#e8f4fd', accent: '#0070c9', totalBeds: 10 },
  { id: 'icu',     name: 'ICU',          icon: '💊', color: '#fdf0f0', accent: '#e05252', totalBeds: 6  },
  { id: 'private', name: 'Private Ward', icon: '🛏️', color: '#f0f4fa', accent: '#5a6a85', totalBeds: 8  },
  { id: 'emergency',name: 'Emergency',   icon: '🚨', color: '#fff8e1', accent: '#b45309', totalBeds: 4  },
];

const initBeds = () => {
  const beds = {};
  WARDS.forEach(w => {
    beds[w.id] = Array.from({ length: w.totalBeds }, (_, i) => ({
      id: `${w.id}-${i + 1}`,
      number: i + 1,
      status: 'available', // 'available' | 'occupied' | 'reserved'
      patient: '',
    }));
  });
  return beds;
};

const STATUS_CONFIG = {
  available: { label: 'Available', color: '#2ea06b', bg: '#eaf7f1', border: '#4caf88' },
  occupied:  { label: 'Occupied',  color: '#e05252', bg: '#fdf0f0', border: '#e05252' },
  reserved:  { label: 'Reserved',  color: '#b45309', bg: '#fff8e1', border: '#f0c040' },
};

export default function BedAvailability() {
  const [beds, setBeds] = useState(initBeds());
  const [editBed, setEditBed] = useState(null); // { wardId, bedId }
  const [patientName, setPatientName] = useState('');

  const cycleBedStatus = (wardId, bedId) => {
    const order = ['available', 'occupied', 'reserved'];
    setBeds(prev => ({
      ...prev,
      [wardId]: prev[wardId].map(b => {
        if (b.id !== bedId) return b;
        const next = order[(order.indexOf(b.status) + 1) % order.length];
        return { ...b, status: next, patient: next === 'available' ? '' : b.patient };
      }),
    }));
  };

  const assignPatient = (wardId, bedId) => {
    setBeds(prev => ({
      ...prev,
      [wardId]: prev[wardId].map(b =>
        b.id === bedId ? { ...b, patient: patientName, status: 'occupied' } : b
      ),
    }));
    setEditBed(null);
    setPatientName('');
  };

  const totalStats = WARDS.reduce((acc, w) => {
    const wardBeds = beds[w.id];
    acc.available += wardBeds.filter(b => b.status === 'available').length;
    acc.occupied  += wardBeds.filter(b => b.status === 'occupied').length;
    acc.reserved  += wardBeds.filter(b => b.status === 'reserved').length;
    acc.total     += wardBeds.length;
    return acc;
  }, { available: 0, occupied: 0, reserved: 0, total: 0 });

  return (
    <div>
      <div className="page-header">
        <h1>Bed Availability</h1>
        <p>Real-time bed status across all wards — click a bed to change its status</p>
      </div>

      {/* Summary stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total Beds',  value: totalStats.total,     icon: '🛏️', bg: '#f0f4fa', color: '#374151' },
          { label: 'Available',   value: totalStats.available,  icon: '✅', bg: '#eaf7f1', color: '#2ea06b' },
          { label: 'Occupied',    value: totalStats.occupied,   icon: '🔴', bg: '#fdf0f0', color: '#e05252' },
          { label: 'Reserved',    value: totalStats.reserved,   icon: '🟡', bg: '#fff8e1', color: '#b45309' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-info">
              <div className="value" style={{ color: s.color }}>{s.value}</div>
              <div className="label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: cfg.bg, border: `2px solid ${cfg.border}` }}></div>
            <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
          </div>
        ))}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Click any bed to cycle status · Click patient name to assign</span>
      </div>

      {/* Wards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {WARDS.map(ward => {
          const wardBeds = beds[ward.id];
          const avail = wardBeds.filter(b => b.status === 'available').length;
          return (
            <div key={ward.id} style={{ background: 'var(--card)', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow)' }}>
              {/* Ward header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{ward.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{ward.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ward.totalBeds} beds total</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: avail > 0 ? 'var(--success)' : '#e05252', lineHeight: 1 }}>{avail}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>available</div>
                </div>
              </div>

              {/* Bed grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {wardBeds.map(bed => {
                  const cfg = STATUS_CONFIG[bed.status];
                  const isEditing = editBed?.bedId === bed.id;
                  return (
                    <div key={bed.id} style={{ textAlign: 'center' }}>
                      <div
                        onClick={() => cycleBedStatus(ward.id, bed.id)}
                        style={{
                          background: cfg.bg,
                          border: `2px solid ${cfg.border}`,
                          borderRadius: 8,
                          padding: '8px 4px',
                          cursor: 'pointer',
                          transition: 'transform 0.1s',
                          userSelect: 'none',
                        }}
                        title={`Bed ${bed.number} — ${cfg.label}${bed.patient ? ` (${bed.patient})` : ''}`}
                      >
                        <div style={{ fontSize: 16 }}>🛏️</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, marginTop: 2 }}>B{bed.number}</div>
                        <div style={{ fontSize: 9, color: cfg.color, fontWeight: 600 }}>{cfg.label}</div>
                        {bed.patient && (
                          <div style={{ fontSize: 8, color: '#374151', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 50, margin: '2px auto 0' }}>
                            {bed.patient}
                          </div>
                        )}
                      </div>
                      {/* Assign patient button */}
                      {bed.status === 'occupied' && !isEditing && (
                        <button
                          onClick={() => { setEditBed({ wardId: ward.id, bedId: bed.id }); setPatientName(bed.patient || ''); }}
                          style={{ fontSize: 9, marginTop: 3, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {bed.patient ? 'Edit' : 'Assign'}
                        </button>
                      )}
                      {isEditing && (
                        <div style={{ marginTop: 4 }}>
                          <input
                            value={patientName}
                            onChange={e => setPatientName(e.target.value)}
                            placeholder="Patient name"
                            style={{ width: '100%', fontSize: 9, padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border)' }}
                            autoFocus
                          />
                          <button
                            onClick={() => assignPatient(ward.id, bed.id)}
                            style={{ fontSize: 9, marginTop: 2, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', width: '100%' }}
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Note: Bed data resets on page refresh. For persistent beds, connect to backend.
      </div>
    </div>
  );
}
