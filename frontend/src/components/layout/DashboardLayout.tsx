import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import {
  Shield,
  Users,
  FolderTree,
  UserCog,
  FileText,
  FlaskConical,
  Key,
  ScrollText,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

// =============================================================================
// Dashboard Layout — Sidebar + Top Bar + Content Area
// =============================================================================

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/groups', label: 'Groups', icon: FolderTree },
  { path: '/roles', label: 'Roles', icon: UserCog },
  { path: '/policies', label: 'Policies', icon: FileText },
  { path: '/simulator', label: 'Simulator', icon: FlaskConical },
  { path: '/api-keys', label: 'API Keys', icon: Key },
  { path: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          backgroundColor: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Shield size={24} color="var(--color-primary-light)" />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.025em',
            }}
          >
            Sentinel
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                marginBottom: 2,
                color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-bg-hover)' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div
          style={{
            padding: '12px 8px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {user?.username || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {user?.email || ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'var(--color-bg-primary)',
        }}
      >
        <div style={{ padding: '24px 32px', maxWidth: 1200 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
