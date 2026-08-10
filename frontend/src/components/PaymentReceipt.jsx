export default function PaymentReceipt({ payment, patient }) {
  if (!payment) return null;

  return (
    <div className="card" id="payment-receipt" style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
        🧾 Payment Receipt
      </div>
      <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Patient</span><strong>{patient?.name}</strong></div>
        <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Transaction ID</span><strong style={{ fontSize: 11 }}>{payment.transactionId}</strong></div>
        <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Payment Status</span>
          <span className={`badge ${payment.status === 'paid' ? 'badge-current' : 'badge-waiting'}`}>
            {payment.statusLabel || payment.status}
          </span>
        </div>
        <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Payment Date</span>
          <strong>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleString('en-IN') : '—'}</strong>
        </div>
        <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Payment Method</span><strong style={{ textTransform: 'capitalize' }}>{payment.method}</strong></div>
        <div className="flex-between" style={{ borderTop: '1px dashed var(--border)', paddingTop: 8, marginTop: 4 }}>
          <span style={{ color: 'var(--text-muted)' }}>Amount Paid</span>
          <strong style={{ fontSize: 16, color: 'var(--primary)' }}>₹{payment.amount}</strong>
        </div>
      </div>
      <button
        className="btn btn-outline btn-sm"
        style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
        onClick={() => window.print()}
      >
        🖨️ Print Receipt
      </button>
    </div>
  );
}
