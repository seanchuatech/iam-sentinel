import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] min-w-[240px] bg-(--color-bg-secondary) border-r border-(--color-border) flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-(--color-border) flex items-center gap-2.5">
          <Shield size={24} className="text-(--color-primary-light)" />
          <span className="text-lg font-bold text-(--color-text-primary) tracking-tight">
            Sentinel
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium no-underline mb-0.5 transition-all duration-150 ${isActive ? 'text-(--color-primary-light) bg-(--color-bg-hover)' : 'text-(--color-text-secondary) bg-transparent hover:bg-(--color-bg-hover)'}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-2 py-3 border-t border-(--color-border)">
          <div className="flex items-center justify-between px-3 py-2">
            <div>
              <div className="text-[13px] font-semibold text-(--color-text-primary)">
                {user?.username || 'User'}
              </div>
              <div className="text-[11px] text-(--color-text-muted)">
                {user?.email || ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="bg-transparent border-none cursor-pointer text-(--color-text-muted) p-1 rounded hover:bg-(--color-bg-hover) flex"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-(--color-bg-primary)">
        <div className="px-8 py-6 w-full max-w-[1200px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
