import { useEffect, useState } from 'react';
import { UserCog, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { Role } from '../types';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/roles?limit=50');
      setRoles(data.roles || []);
      setTotal(data.total);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post('/roles', { ...form, trust_policy: {}, max_session_duration: 3600 });
      setShowCreate(false);
      setForm({ name: '', description: '' });
      fetchRoles();
    } catch { /* */ }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    await api.delete(`/roles/${id}`);
    fetchRoles();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserCog size={22} color="#f59e0b" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Roles</h1>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 4 }}>({total})</span>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
          border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: 13,
          fontWeight: 600, cursor: 'pointer',
        }}><Plus size={16} /> New Role</button>
      </div>

      {showCreate && (
        <div style={{ padding: 20, marginBottom: 20, borderRadius: 12, backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input placeholder="Role name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none' }} />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none' }} />
          </div>
          <button onClick={handleCreate} disabled={creating} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-success)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>{creating && <Loader2 size={14} className="animate-spin" />} Create</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Name', 'Description', 'Session Duration', 'Created', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{r.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>{r.description || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>{Math.floor(r.max_session_duration / 3600)}h</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(r.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>No roles yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
