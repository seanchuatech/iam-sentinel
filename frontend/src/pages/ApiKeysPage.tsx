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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Key size={22} color="#f59e0b" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>API Keys</h1>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setNewKeySecret(null); }} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
          border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: 13,
          fontWeight: 600, cursor: 'pointer',
        }}><Plus size={16} /> Generate Key</button>
      </div>

      {/* New key secret (shown once) */}
      {newKeySecret && (
        <div style={{
          padding: 20, marginBottom: 20, borderRadius: 12,
          backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-warning)', marginBottom: 12 }}>
            ⚠️ Save your secret key now — you won't be able to see it again!
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Key ID', value: newKeySecret.keyId, field: 'keyId' },
              { label: 'Secret', value: newKeySecret.secret, field: 'secret' },
            ].map(({ label, value, field }) => (
              <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', minWidth: 50 }}>{label}:</span>
                <code style={{ flex: 1, fontSize: 12, padding: '6px 10px', borderRadius: 6, backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                  {value}
                </code>
                <button onClick={() => handleCopy(value, field)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: copiedField === field ? 'var(--color-success)' : 'var(--color-text-muted)', padding: 4,
                }}>
                  {copiedField === field ? <CheckCheck size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div style={{ padding: 20, marginBottom: 20, borderRadius: 12, backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input placeholder="Key name (e.g. CI/CD Pipeline)" value={name} onChange={(e) => setName(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none' }} />
            <button onClick={handleCreate} disabled={creating || !name} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-success)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: creating || !name ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, opacity: creating || !name ? 0.5 : 1,
            }}>{creating && <Loader2 size={14} className="animate-spin" />} Generate</button>
          </div>
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
              {['Name', 'Key ID', 'Status', 'Last Used', 'Created', ''].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{k.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <code style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}>{k.key_id}</code>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                      backgroundColor: k.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: k.status === 'active' ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>{k.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>{k.last_used ? new Date(k.last_used).toLocaleString() : 'Never'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>{new Date(k.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(k.id)} title="Revoke" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>No API keys. Generate one to enable programmatic access.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
