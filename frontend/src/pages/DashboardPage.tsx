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
  colorClass: string;
  bgClass: string;
}

function StatCard({ label, value, icon, colorClass, bgClass }: StatCardProps) {
  return (
    <div
      className={`p-5 rounded-xl bg-(--color-bg-card) border border-(--color-border) flex items-center gap-4 transition-colors duration-200 hover:border-${colorClass}`}
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${bgClass}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-(--color-text-primary)">
          {value}
        </div>
        <div className="text-[13px] text-(--color-text-muted)">{label}</div>
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
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <Shield size={22} className="text-(--color-primary-light)" />
          <h1 className="text-[22px] font-bold text-(--color-text-primary)">
            Dashboard
          </h1>
        </div>
        <p className="text-sm text-(--color-text-muted)">
          Sentinel IAM — system overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
        <StatCard label="Users" value={stats.users} icon={<Users size={22} className="text-indigo-500" />} colorClass="indigo-500" bgClass="bg-indigo-500/15" />
        <StatCard label="Groups" value={stats.groups} icon={<FolderTree size={22} className="text-green-500" />} colorClass="green-500" bgClass="bg-green-500/15" />
        <StatCard label="Roles" value={stats.roles} icon={<UserCog size={22} className="text-amber-500" />} colorClass="amber-500" bgClass="bg-amber-500/15" />
        <StatCard label="Policies" value={stats.policies} icon={<FileText size={22} className="text-blue-500" />} colorClass="blue-500" bgClass="bg-blue-500/15" />
        <StatCard label="Audit Events" value={stats.auditLogs} icon={<ScrollText size={22} className="text-pink-500" />} colorClass="pink-500" bgClass="bg-pink-500/15" />
      </div>

      {/* Quick start info */}
      <div className="p-5 rounded-xl bg-(--color-bg-card) border border-(--color-border)">
        <h2 className="text-base font-semibold mb-3 text-(--color-text-primary)">
          Quick Start
        </h2>
        <div className="text-sm text-(--color-text-secondary) leading-[1.8]">
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
