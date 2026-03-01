import { useEffect, useState } from 'react';
import { Users, FolderTree, UserCog, FileText, ScrollText, Shield } from 'lucide-react';
import api from '../lib/api';

// =============================================================================
// Dashboard Page — Overview with entity counts
// =============================================================================

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, groups: 0, roles: 0, policies: 0, auditLogs: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, groups, roles, policies, audit] = await Promise.allSettled([
          api.get('/users?limit=1'),
          api.get('/groups?limit=1'),
          api.get('/roles?limit=1'),
          api.get('/policies?limit=1'),
          api.get('/audit-logs?limit=1'),
        ]);

        setStats({
          users: users.status === 'fulfilled' ? users.value.data.total : 0,
          groups: groups.status === 'fulfilled' ? groups.value.data.total : 0,
          roles: roles.status === 'fulfilled' ? roles.value.data.total : 0,
          policies: policies.status === 'fulfilled' ? policies.value.data.total : 0,
          auditLogs: audit.status === 'fulfilled' ? audit.value.data.total : 0,
        });
      } catch {
        // Dashboard gracefully handles missing data
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Shield size={22} color="var(--color-primary-light)" />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Dashboard
          </h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
          Sentinel IAM — system overview
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard label="Users" value={stats.users} icon={<Users size={22} color="#6366f1" />} color="#6366f1" />
        <StatCard label="Groups" value={stats.groups} icon={<FolderTree size={22} color="#22c55e" />} color="#22c55e" />
        <StatCard label="Roles" value={stats.roles} icon={<UserCog size={22} color="#f59e0b" />} color="#f59e0b" />
        <StatCard label="Policies" value={stats.policies} icon={<FileText size={22} color="#3b82f6" />} color="#3b82f6" />
        <StatCard label="Audit Events" value={stats.auditLogs} icon={<ScrollText size={22} color="#ec4899" />} color="#ec4899" />
      </div>

      {/* Quick start info */}
      <div
        style={{
          padding: 20,
          borderRadius: 12,
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)' }}>
          Quick Start
        </h2>
        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
          <p><strong>1.</strong> Create <strong>Users</strong> to represent principals in the system.</p>
          <p><strong>2.</strong> Define <strong>Policies</strong> with Allow/Deny statements for actions and resources.</p>
          <p><strong>3.</strong> Organize users into <strong>Groups</strong> and assign <strong>Roles</strong>.</p>
          <p><strong>4.</strong> Attach policies to users, groups, or roles.</p>
          <p><strong>5.</strong> Use the <strong>Simulator</strong> to test access decisions.</p>
        </div>
      </div>
    </div>
  );
}
