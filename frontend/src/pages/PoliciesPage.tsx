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
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPolicies = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let active = true;
    const loadPolicies = async () => {
      try {
        const { data } = await api.get('/policies?limit=50');
        if (active) {
          setPolicies(data.policies || []);
          setTotal(data.total);
        }
      } catch { /* */ }
      if (active) setLoading(false);
    };
    loadPolicies();
    return () => { active = false; };
  }, [refreshKey]);

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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2.5">
          <FileText size={22} className="text-blue-500" />
          <h1 className="text-[22px] font-bold">Policies</h1>
          <span className="text-[13px] text-(--color-text-muted) ml-1">({total})</span>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)} 
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-none bg-(--color-primary) text-white text-[13px] font-semibold cursor-pointer hover:bg-(--color-primary-light) transition-colors"
        >
          <Plus size={16} /> New Policy
        </button>
      </div>

      {showCreate && (
        <div className="p-5 mb-5 rounded-xl bg-(--color-bg-card) border border-(--color-border)">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input 
              placeholder="Policy name" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-[13px] outline-none focus:border-(--color-primary-light) transition-colors"
            />
            <input 
              placeholder="Description" 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-3 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-[13px] outline-none focus:border-(--color-primary-light) transition-colors"
            />
          </div>
          <textarea
            value={form.document}
            onChange={(e) => setForm({ ...form, document: e.target.value })}
            rows={10}
            className="w-full p-3 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-xs font-mono outline-none resize-y mb-3 transition-colors focus:border-(--color-primary-light)"
          />
          {createError && <div className="text-(--color-danger) text-[13px] mb-2.5">{createError}</div>}
          <button 
            onClick={handleCreate} 
            disabled={creating} 
            className="px-5 py-2 rounded-lg border-none bg-(--color-success) text-white text-[13px] font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating && <Loader2 size={14} className="animate-spin" />} Create Policy
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center p-10 text-(--color-text-muted)">
          <Loader2 size={24} className="animate-spin mx-auto" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {policies.map((p) => (
            <div key={p.id} className="rounded-xl border border-(--color-border) bg-(--color-bg-card) overflow-hidden">
              <div 
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-(--color-bg-hover) transition-colors"
                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-blue-500" />
                  <span className="text-sm font-semibold">{p.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">v{p.version}</span>
                  <span className="text-[13px] text-(--color-text-muted)">{p.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-(--color-text-muted)">
                    {p.document.statement.length} statement{p.document.statement.length !== 1 ? 's' : ''}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} 
                    title="Delete"
                    className="bg-transparent border-none cursor-pointer text-(--color-text-muted) p-1 hover:text-(--color-danger) transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  {expandedId === p.id ? <ChevronUp size={16} className="text-(--color-text-muted)" /> : <ChevronDown size={16} className="text-(--color-text-muted)" />}
                </div>
              </div>
              {expandedId === p.id && (
                <div className="px-4 pb-4 border-t border-(--color-border)">
                  <div className="mt-3">
                    {p.document.statement.map((stmt, i) => (
                      <div key={i} className="p-3 mb-2 rounded-lg bg-(--color-bg-secondary) border border-(--color-border) last:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye size={14} className="text-(--color-text-muted)" />
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                            stmt.effect === 'Allow' ? 'bg-green-500/15 text-(--color-success)' : 'bg-red-500/15 text-(--color-danger)'
                          }`}>
                            {stmt.effect}
                          </span>
                        </div>
                        <div className="text-xs text-(--color-text-secondary) mb-1">
                          <strong className="font-semibold text-(--color-text-primary)">Actions:</strong> {stmt.action.map((a) =>
                            <code key={a} className="ml-1 px-1.5 py-px rounded bg-(--color-bg-hover) text-[11px]">{a}</code>
                          )}
                        </div>
                        <div className="text-xs text-(--color-text-secondary)">
                          <strong className="font-semibold text-(--color-text-primary)">Resources:</strong> {stmt.resource.map((r) =>
                            <code key={r} className="ml-1 px-1.5 py-px rounded bg-(--color-bg-hover) text-[11px]">{r}</code>
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
            <div className="text-center p-10 text-(--color-text-muted) text-sm rounded-xl border border-(--color-border) bg-(--color-bg-card)">
              No policies yet. Create one with a JSON policy document.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
