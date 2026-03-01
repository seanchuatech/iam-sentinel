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
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchUsers = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      try {
        const { data } = await api.get('/users?limit=50');
        if (active) {
          setUsers(data.users || []);
          setTotal(data.total);
        }
      } catch { /* handled by interceptor */ }
      if (active) setLoading(false);
    };
    loadUsers();
    return () => { active = false; };
  }, [refreshKey]);

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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2.5">
          <Users size={22} className="text-(--color-primary-light)" />
          <h1 className="text-[22px] font-bold">Users</h1>
          <span className="text-[13px] text-(--color-text-muted) ml-1">({total})</span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-none bg-(--color-primary) text-white text-[13px] font-semibold cursor-pointer hover:bg-(--color-primary-light) transition-colors"
        >
          <Plus size={16} /> New User
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="p-5 mb-5 rounded-xl bg-(--color-bg-card) border border-(--color-border)">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {(['username', 'email', 'password'] as const).map((field) => (
              <input
                key={field}
                type={field === 'password' ? 'password' : 'text'}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-[13px] outline-none focus:border-(--color-primary-light) transition-colors"
              />
            ))}
          </div>
          <button 
            onClick={handleCreate} 
            disabled={creating} 
            className="px-5 py-2 rounded-lg border-none bg-(--color-success) text-white text-[13px] font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating && <Loader2 size={14} className="animate-spin" />} Create
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center p-10 text-(--color-text-muted)">
          <Loader2 size={24} className="animate-spin mx-auto" />
        </div>
      ) : (
        <div className="rounded-xl border border-(--color-border) bg-(--color-bg-card) overflow-hidden">
          <table className="w-full border-collapse border-none">
            <thead>
              <tr className="border-b border-(--color-border)">
                {['Username', 'Email', 'Status', 'Created', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-bg-hover) transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                  <td className="px-4 py-3 text-sm text-(--color-text-secondary)">{user.email}</td>
                  <td className="px-4 py-3">
                    <span 
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
                        user.status === 'active' 
                          ? 'bg-green-500/15 text-(--color-success)' 
                          : 'bg-red-500/15 text-(--color-danger)'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-(--color-text-muted)">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(user.id)} 
                      title="Delete" 
                      className="bg-transparent border-none cursor-pointer text-(--color-text-muted) p-1 hover:text-(--color-danger) transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-(--color-text-muted) text-sm">
                    No users yet. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
