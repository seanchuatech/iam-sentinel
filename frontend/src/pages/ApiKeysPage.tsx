import { useEffect, useState } from 'react';
import { Key, Plus, Trash2, Loader2, Copy, CheckCheck } from 'lucide-react';
import api from '../lib/api';
import type { APIKey, CreateAPIKeyResponse } from '../types';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<{ keyId: string; secret: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const { data } = await api.get('/api-keys');
      setKeys(data.api_keys || []);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await api.post<CreateAPIKeyResponse>('/api-keys', { name });
      setNewKeySecret({ keyId: data.api_key.key_id, secret: data.secret });
      setShowCreate(false);
      setName('');
      fetchKeys();
    } catch { /* */ }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Revoke this API key?')) return;
    await api.delete(`/api-keys/${id}`);
    fetchKeys();
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2.5">
          <Key size={22} className="text-amber-500" />
          <h1 className="text-[22px] font-bold">API Keys</h1>
        </div>
        <button 
          onClick={() => { setShowCreate(!showCreate); setNewKeySecret(null); }} 
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-none bg-(--color-primary) text-white text-[13px] font-semibold cursor-pointer hover:bg-(--color-primary-light) transition-colors"
        >
          <Plus size={16} /> Generate Key
        </button>
      </div>

      {/* New key secret (shown once) */}
      {newKeySecret && (
        <div className="p-5 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="text-[13px] font-semibold text-(--color-warning) mb-3">
            ⚠️ Save your secret key now — you won't be able to see it again!
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Key ID', value: newKeySecret.keyId, field: 'keyId' },
              { label: 'Secret', value: newKeySecret.secret, field: 'secret' },
            ].map(({ label, value, field }) => (
              <div key={field} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-(--color-text-muted) min-w-[50px]">{label}:</span>
                <code className="flex-1 text-xs px-2.5 py-1.5 rounded-md bg-(--color-bg-secondary) text-(--color-text-primary) font-mono">
                  {value}
                </code>
                <button 
                  onClick={() => handleCopy(value, field)} 
                  className={`bg-transparent border-none cursor-pointer p-1 transition-colors ${copiedField === field ? 'text-(--color-success)' : 'text-(--color-text-muted) hover:text-(--color-primary)'}`}
                >
                  {copiedField === field ? <CheckCheck size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="p-5 mb-5 rounded-xl bg-(--color-bg-card) border border-(--color-border)">
          <div className="flex gap-3">
            <input 
              placeholder="Key name (e.g. CI/CD Pipeline)" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-[13px] outline-none transition-colors focus:border-(--color-primary-light)"
            />
            <button 
              onClick={handleCreate} 
              disabled={creating || !name} 
              className="px-5 py-2 rounded-lg border-none bg-(--color-success) text-white text-[13px] font-semibold flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating && <Loader2 size={14} className="animate-spin" />} Generate
            </button>
          </div>
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
                {['Name', 'Key ID', 'Status', 'Last Used', 'Created', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-bg-hover) transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{k.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-[11px] px-1.5 py-0.5 rounded bg-(--color-bg-hover) text-(--color-text-secondary)">
                      {k.key_id}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                      k.status === 'active' ? 'bg-green-500/15 text-(--color-success)' : 'bg-red-500/15 text-(--color-danger)'
                    }`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-(--color-text-muted)">
                    {k.last_used ? new Date(k.last_used).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-(--color-text-muted)">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(k.id)} 
                      title="Revoke" 
                      className="bg-transparent border-none cursor-pointer text-(--color-text-muted) p-1 transition-colors hover:text-(--color-danger)"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-(--color-text-muted) text-sm">
                    No API keys. Generate one to enable programmatic access.
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
