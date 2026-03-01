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

  const fetchLogs = async (newOffset: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/audit-logs?limit=${limit}&offset=${newOffset}`);
      setLogs(data.audit_logs || []);
      setTotal(data.total);
      setOffset(newOffset);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(0); }, []);

  const resultColors: Record<string, string> = {
    ALLOW: 'var(--color-success)',
    DENY: 'var(--color-danger)',
    IMPLICIT_DENY: 'var(--color-warning)',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <ScrollText size={22} color="#ec4899" />
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Audit Logs</h1>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 4 }}>({total} events)</span>
      </div>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Immutable record of all access decisions and system actions.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <>
          <div style={{ borderRadius: 12, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Timestamp', 'Actor', 'Action', 'Resource', 'Result', 'IP'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      <code style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}>
                        {log.actor_id.slice(0, 8)}...
                      </code>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>{log.action}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{log.resource}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11,
                        fontWeight: 600, textTransform: 'uppercase',
                        backgroundColor: `${resultColors[log.result] || 'var(--color-text-muted)'}20`,
                        color: resultColors[log.result] || 'var(--color-text-muted)',
                      }}>{log.result}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{log.ip_address || '—'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>No audit events recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button disabled={offset === 0} onClick={() => fetchLogs(Math.max(0, offset - limit))}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)',
                  fontSize: 13, cursor: offset === 0 ? 'not-allowed' : 'pointer', opacity: offset === 0 ? 0.5 : 1,
                }}>Previous</button>
              <span style={{ padding: '8px 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                {offset + 1}–{Math.min(offset + limit, total)} of {total}
              </span>
              <button disabled={offset + limit >= total} onClick={() => fetchLogs(offset + limit)}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)',
                  fontSize: 13, cursor: offset + limit >= total ? 'not-allowed' : 'pointer',
                  opacity: offset + limit >= total ? 0.5 : 1,
                }}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
