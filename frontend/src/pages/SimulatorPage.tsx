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
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-2">
        <FlaskConical size={22} className="text-purple-500" />
        <h1 className="text-[22px] font-bold">Policy Simulator</h1>
      </div>
      <p className="text-sm text-(--color-text-muted) mb-6">
        Test whether a user would be allowed or denied access to a specific action and resource.
      </p>

      <div className="grid grid-cols-2 gap-5">
        {/* Input Panel */}
        <div className="p-6 rounded-xl bg-(--color-bg-card) border border-(--color-border)">
          <h2 className="text-[15px] font-semibold mb-4">Evaluation Request</h2>

          <div className="mb-4">
            <label className="block text-[13px] font-medium text-(--color-text-secondary) mb-1.5">User ID</label>
            <input 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              className="w-full px-3.5 py-2.5 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-[13px] outline-none font-mono" 
            />
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-medium text-(--color-text-secondary) mb-1.5">Action</label>
            <input 
              value={action} 
              onChange={(e) => setAction(e.target.value)} 
              placeholder="e.g. s3:GetObject"
              className="w-full px-3.5 py-2.5 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-[13px] outline-none font-mono" 
            />
          </div>

          <div className="mb-5">
            <label className="block text-[13px] font-medium text-(--color-text-secondary) mb-1.5">Resource</label>
            <input 
              value={resource} 
              onChange={(e) => setResource(e.target.value)} 
              placeholder="e.g. arn:sentinel:s3:bucket/*"
              className="w-full px-3.5 py-2.5 rounded-lg border border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-primary) text-[13px] outline-none font-mono" 
            />
          </div>

          <button 
            onClick={handleSimulate} 
            disabled={loading || !userId}
            className={`w-full p-3 rounded-lg border-none bg-purple-500 text-white text-sm font-semibold flex items-center justify-center gap-2 ${loading || !userId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-purple-600 transition-colors'}`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Simulate
          </button>
        </div>

        {/* Result Panel */}
        <div className="p-6 rounded-xl bg-(--color-bg-card) border border-(--color-border)">
          <h2 className="text-[15px] font-semibold mb-4">Evaluation Result</h2>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-(--color-danger) text-[13px]">
              {error}
            </div>
          )}

          {result && (
            <div>
              <div 
                className="p-6 rounded-xl text-center mb-4"
                style={{
                  backgroundColor: decisionColors[result.decision]?.bg || 'var(--color-bg-hover)',
                  border: `2px solid ${decisionColors[result.decision]?.color || 'var(--color-border)'}`,
                }}
              >
                <div 
                  className="text-[32px] font-extrabold tracking-wider"
                  style={{
                    color: decisionColors[result.decision]?.color || 'var(--color-text-primary)',
                  }}
                >
                  {result.decision}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-(--color-bg-secondary)">
                <div className="text-xs font-semibold text-(--color-text-muted) mb-1 uppercase">Reason</div>
                <div className="text-sm text-(--color-text-secondary)">{result.reason}</div>
              </div>
            </div>
          )}

          {!result && !error && (
            <div className="text-center p-10 text-(--color-text-muted) text-sm">
              Enter a user ID, action, and resource, then click Simulate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
