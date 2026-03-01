import { useEffect, useState } from 'react';
import { FolderTree, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { Group } from '../types';

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', path: '/' });
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get('/groups?limit=50');
      setGroups(data.groups || []);
      setTotal(data.total);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post('/groups', form);
      setShowCreate(false);
      setForm({ name: '', description: '', path: '/' });
      fetchGroups();
    } catch { /* */ }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    await api.delete(`/groups/${id}`);
    fetchGroups();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FolderTree size={22} color="#22c55e" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Groups</h1>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 4 }}>({total})</span>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
          border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: 13,
          fontWeight: 600, cursor: 'pointer',
        }}><Plus size={16} /> New Group</button>
      </div>

      {showCreate && (
        <div style={{ padding: 20, marginBottom: 20, borderRadius: 12, backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[{k:'name',p:'Group name'},{k:'description',p:'Description'},{k:'path',p:'Path (e.g. /engineering)'}].map(({k,p}) => (
              <input key={k} placeholder={p} value={(form as Record<string, string>)[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none' }}
              />
            ))}
          </div>
          <button onClick={handleCreate} disabled={creating} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-success)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
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
              {['Name', 'Description', 'Path', 'Created', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                  color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{g.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>{g.description || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <code style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}>{g.path}</code>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>{new Date(g.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(g.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>No groups yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
