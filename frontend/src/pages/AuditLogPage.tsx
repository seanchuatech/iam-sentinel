import { useEffect, useState } from 'react';
import { ScrollText, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { AuditLog } from '../types';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 25;

  useEffect(() => {
    let active = true;
    const loadLogs = async () => {
      try {
        const { data } = await api.get(`/audit-logs?limit=${limit}&offset=${offset}`);
        if (active) {
          setLogs(data.audit_logs || []);
          setTotal(data.total);
        }
      } catch { /* */ }
      if (active) setLoading(false);
    };
    
    loadLogs();
    return () => { active = false; };
  }, [offset]);

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-2">
        <ScrollText size={22} className="text-pink-500" />
        <h1 className="text-[22px] font-bold">Audit Logs</h1>
        <span className="text-[13px] text-(--color-text-muted) ml-1">({total} events)</span>
      </div>
      <p className="text-sm text-(--color-text-muted) mb-6">
        Immutable record of all access decisions and system actions.
      </p>

      {loading ? (
        <div className="text-center p-10 text-(--color-text-muted)">
          <Loader2 size={24} className="animate-spin mx-auto" />
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-(--color-border) bg-(--color-bg-card) overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-(--color-border)">
                  {['Timestamp', 'Actor', 'Action', 'Resource', 'Result', 'IP'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-(--color-border) last:border-b-0 hover:bg-(--color-bg-hover) transition-colors">
                    <td className="px-4 py-3 text-xs text-(--color-text-muted) font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      <code className="text-[11px] px-1.5 py-0.5 rounded bg-(--color-bg-hover) text-(--color-text-secondary)">
                        {log.actor_id.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-(--color-text-secondary) font-mono break-all">{log.resource}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                        log.result === 'ALLOW' ? 'bg-green-500/15 text-(--color-success)' :
                        log.result === 'DENY' ? 'bg-red-500/15 text-(--color-danger)' :
                        'bg-yellow-500/15 text-(--color-warning)'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-(--color-text-muted) font-mono">{log.ip_address || '—'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-(--color-text-muted) text-sm">
                      No audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button 
                disabled={offset === 0} 
                onClick={() => { setLoading(true); setOffset(Math.max(0, offset - limit)); }}
                className="px-4 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-card) text-(--color-text-secondary) text-[13px] transition-all hover:bg-(--color-bg-hover) disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-[13px] text-(--color-text-muted)">
                {offset + 1}–{Math.min(offset + limit, total)} of {total}
              </span>
              <button 
                disabled={offset + limit >= total} 
                onClick={() => { setLoading(true); setOffset(offset + limit); }}
                className="px-4 py-2 rounded-lg border border-(--color-border) bg-(--color-bg-card) text-(--color-text-secondary) text-[13px] transition-all hover:bg-(--color-bg-hover) disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
