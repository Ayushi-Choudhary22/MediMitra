import { useEffect, useState } from 'react';
import api from '../../utils/api';

const CATEGORIES = ['Radiology', 'Blood Test', 'Cardiology', 'Pathology', 'General'];

const emptyForm = { testName: '', roomNumber: '', cost: '', description: '', category: 'General' };

export default function TestInfo() {
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  const fetchTests = async () => {
    try {
      const res = await api.get('/tests');
      setTests(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/tests/${editId}`, form);
        setEditId(null);
      } else {
        await api.post('/tests', form);
      }
      setForm(emptyForm);
      fetchTests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (test) => {
    setEditId(test._id);
    setForm({ testName: test.testName, roomNumber: test.roomNumber, cost: test.cost, description: test.description, category: test.category });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this test?')) return;
    await api.delete(`/tests/${id}`);
    fetchTests();
  };

  const filtered = tests.filter(t => t.testName.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <h1>Test Information</h1>
        <p>Manage available medical tests, rooms, and costs</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18 }}>
        {/* Test List */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <input
              placeholder="🔍 Search tests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Category</th>
                  <th>Room</th>
                  <th>Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                    No tests found. Add one using the form.
                  </td></tr>
                ) : filtered.map(test => (
                  <tr key={test._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{test.testName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{test.description}</div>
                    </td>
                    <td><span className="badge" style={{ background: '#e8f4fd', color: '#0070c9' }}>{test.category}</span></td>
                    <td>🚪 {test.roomNumber}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{test.cost?.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleEdit(test)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(test._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 700 }}>{editId ? '✏️ Edit Test' : '➕ Add New Test'}</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Test Name *</label>
              <input value={form.testName} onChange={e => setForm({ ...form, testName: e.target.value })} required placeholder="e.g. MRI Brain, CBC" />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label>Room Number *</label>
                <input value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} required placeholder="e.g. 102" />
              </div>
              <div className="form-group">
                <label>Cost (₹) *</label>
                <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} required placeholder="e.g. 1500" min={0} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 10 }}>
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional details..." rows={3} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <span className="spinner"></span> : editId ? 'Update Test' : 'Add Test'}
              </button>
              {editId && (
                <button type="button" className="btn btn-outline" onClick={() => { setEditId(null); setForm(emptyForm); }}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
