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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2.5">
          <FolderTree size={22} className="text-green-500" />
          <h1 className="text-[22px] font-bold">Groups</h1>
          <span className="text-[13px] text-(--color-text-muted) ml-1">({total})</span>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)} 
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-none bg-(--color-primary) text-white text-[13px] font-semibold cursor-pointer hover:bg-(--color-primary-light) transition-colors"
        >
          <Plus size={16} /> New Group
        </button>
      </div>

      {showCreate && (
        <div className="p-5 mb-5 rounded-xl bg-(--color-bg-card) border border-(--color-border)">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[{k:'name',p:'Group name'},{k:'description',p:'Description'},{k:'path',p:'Path (e.g. /engineering)'}].map(({k,p}) => (
              <input 
                key={k} 
                placeholder={p} 
                value={(form as Record<string, string>)[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
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

      {loading ? (
        <div className="text-center p-10 text-(--color-text-muted)">
          <Loader2 size={24} className="animate-spin mx-auto" />
        </div>
      ) : (
        <div className="rounded-xl border border-(--color-border) bg-(--color-bg-card) overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-(--color-border)">
                {['Name', 'Description', 'Path', 'Created', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id} className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-bg-hover) transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{g.name}</td>
                  <td className="px-4 py-3 text-sm text-(--color-text-secondary)">{g.description || '—'}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs px-2 py-0.5 rounded bg-(--color-bg-hover) text-(--color-text-secondary)">
                      {g.path}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-(--color-text-muted)">
                    {new Date(g.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(g.id)} 
                      title="Delete" 
                      className="bg-transparent border-none cursor-pointer text-(--color-text-muted) p-1 hover:text-(--color-danger) transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-(--color-text-muted) text-sm">
                    No groups yet.
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
