import { useEffect, useState } from 'react';
import { FileText, Plus, Trash2, Loader2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';
import type { Policy, PolicyDocument } from '../types';

const DEFAULT_DOCUMENT: PolicyDocument = {
  version: '2024-01-01',
  statement: [
    { effect: 'Allow', action: ['s3:GetObject'], resource: ['arn:sentinel:s3:*'] },
  ],
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', document: JSON.stringify(DEFAULT_DOCUMENT, null, 2) });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchPolicies = async () => {
    try {
      const { data } = await api.get('/policies?limit=50');
      setPolicies(data.policies || []);
      setTotal(data.total);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchPolicies(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError('');
    try {
      const doc = JSON.parse(form.document);
      await api.post('/policies', { name: form.name, description: form.description, document: doc, policy_type: 'managed' });
      setShowCreate(false);
      setForm({ name: '', description: '', document: JSON.stringify(DEFAULT_DOCUMENT, null, 2) });
      fetchPolicies();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setCreateError('Invalid JSON in policy document');
      } else {
        setCreateError('Failed to create policy');
      }
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this policy?')) return;
    await api.delete(`/policies/${id}`);
    fetchPolicies();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={22} color="#3b82f6" />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Policies</h1>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 4 }}>({total})</span>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
          border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: 13,
          fontWeight: 600, cursor: 'pointer',
        }}><Plus size={16} /> New Policy</button>
      </div>

      {showCreate && (
        <div style={{ padding: 20, marginBottom: 20, borderRadius: 12, backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input placeholder="Policy name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none' }} />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none' }} />
          </div>
          <textarea
            value={form.document}
            onChange={(e) => setForm({ ...form, document: e.target.value })}
            rows={10}
            style={{
              width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
              fontSize: 12, fontFamily: 'monospace', outline: 'none', resize: 'vertical', marginBottom: 12,
            }}
          />
          {createError && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 10 }}>{createError}</div>}
          <button onClick={handleCreate} disabled={creating} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-success)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>{creating && <Loader2 size={14} className="animate-spin" />} Create Policy</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {policies.map((p) => (
            <div key={p.id} style={{ borderRadius: 12, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={16} color="#3b82f6" />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>v{p.version}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{p.description}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {p.document.statement.length} statement{p.document.statement.length !== 1 ? 's' : ''}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} title="Delete"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                  {expandedId === p.id ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
                </div>
              </div>
              {expandedId === p.id && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ marginTop: 12 }}>
                    {p.document.statement.map((stmt, i) => (
                      <div key={i} style={{
                        padding: 12, marginBottom: 8, borderRadius: 8,
                        backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Eye size={14} color="var(--color-text-muted)" />
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
                            backgroundColor: stmt.effect === 'Allow' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: stmt.effect === 'Allow' ? 'var(--color-success)' : 'var(--color-danger)',
                          }}>{stmt.effect}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                          <strong>Actions:</strong> {stmt.action.map((a) =>
                            <code key={a} style={{ marginLeft: 4, padding: '1px 6px', borderRadius: 3, backgroundColor: 'var(--color-bg-hover)', fontSize: 11 }}>{a}</code>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          <strong>Resources:</strong> {stmt.resource.map((r) =>
                            <code key={r} style={{ marginLeft: 4, padding: '1px 6px', borderRadius: 3, backgroundColor: 'var(--color-bg-hover)', fontSize: 11 }}>{r}</code>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {policies.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)', fontSize: 14,
              borderRadius: 12, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
              No policies yet. Create one with a JSON policy document.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
