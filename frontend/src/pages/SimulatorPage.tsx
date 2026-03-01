import { useState } from 'react';
import { FlaskConical, Play, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { SimulateResult } from '../types';

export default function SimulatorPage() {
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('s3:GetObject');
  const [resource, setResource] = useState('arn:sentinel:s3:bucket/file.txt');
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSimulate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post<SimulateResult>('/simulate', {
        user_id: userId,
        action,
        resource,
      });
      setResult(data);
    } catch {
      setError('Simulation failed. Check if the user ID is valid.');
    }
    setLoading(false);
  };

  const decisionColors: Record<string, { bg: string; color: string }> = {
    ALLOW: { bg: 'rgba(34,197,94,0.15)', color: 'var(--color-success)' },
    DENY: { bg: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)' },
    IMPLICIT_DENY: { bg: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)' },
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <FlaskConical size={22} color="#a855f7" />
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Policy Simulator</h1>
      </div>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Test whether a user would be allowed or denied access to a specific action and resource.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Input Panel */}
        <div style={{ padding: 24, borderRadius: 12, backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Evaluation Request</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>User ID</label>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Action</label>
            <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. s3:GetObject"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Resource</label>
            <input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="e.g. arn:sentinel:s3:bucket/*"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
          </div>

          <button onClick={handleSimulate} disabled={loading || !userId}
            style={{
              width: '100%', padding: '12px', borderRadius: 8, border: 'none',
              backgroundColor: '#a855f7', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading || !userId ? 'not-allowed' : 'pointer', opacity: loading || !userId ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Simulate
          </button>
        </div>

        {/* Result Panel */}
        <div style={{ padding: 24, borderRadius: 12, backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Evaluation Result</h2>

          {error && (
            <div style={{ padding: 16, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--color-danger)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {result && (
            <div>
              <div style={{
                padding: 24, borderRadius: 12, textAlign: 'center', marginBottom: 16,
                backgroundColor: decisionColors[result.decision]?.bg || 'var(--color-bg-hover)',
                border: `2px solid ${decisionColors[result.decision]?.color || 'var(--color-border)'}`,
              }}>
                <div style={{
                  fontSize: 32, fontWeight: 800, letterSpacing: '0.05em',
                  color: decisionColors[result.decision]?.color || 'var(--color-text-primary)',
                }}>
                  {result.decision}
                </div>
              </div>
              <div style={{ padding: 16, borderRadius: 8, backgroundColor: 'var(--color-bg-secondary)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Reason</div>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{result.reason}</div>
              </div>
            </div>
          )}

          {!result && !error && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)', fontSize: 14 }}>
              Enter a user ID, action, and resource, then click Simulate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
