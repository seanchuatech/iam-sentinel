import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { User } from '../types';

// =============================================================================
// Users Page — List, create, and delete users
// =============================================================================

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users?limit=50');
      setUsers(data.users || []);
      setTotal(data.total);
    } catch { /* handled by interceptor */ }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post('/auth/register', form);
      setShowCreate(false);
      setForm({ username: '', email: '', password: '' });
      fetchUsers();
    } catch { /* error */ }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    fetchUsers();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={22} color="var(--color-primary-light)" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Users</h1>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 4 }}>({total})</span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> New User
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div style={{
          padding: 20, marginBottom: 20, borderRadius: 12,
          backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {(['username', 'email', 'password'] as const).map((field) => (
              <input
                key={field}
                type={field === 'password' ? 'password' : 'text'}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                style={{
                  padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
                  fontSize: 13, outline: 'none',
                }}
              />
            ))}
          </div>
          <button onClick={handleCreate} disabled={creating} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            backgroundColor: 'var(--color-success)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {creating && <Loader2 size={14} className="animate-spin" />} Create
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{
          borderRadius: 12, border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-card)', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Username', 'Email', 'Status', 'Created', ''].map((h) => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{user.username}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-secondary)' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11,
                      fontWeight: 600, textTransform: 'uppercase',
                      backgroundColor: user.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: user.status === 'active' ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(user.id)} title="Delete" style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)', padding: 4,
                    }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  No users yet. Create one to get started.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
