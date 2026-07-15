import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, MessageSquare, Settings, Bell, Search, BrainCircuit, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlobalSearch } from '../components/GlobalSearch';
import { NotificationBell } from '../components/NotificationBell';
export default function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', path: '/app/jobs', icon: Briefcase },
    { name: 'Candidates', path: '/app/candidates', icon: Users },
    { name: 'AI Chatbot', path: '/app/chat', icon: MessageSquare },
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans relative" style={{ backgroundColor: '#EBEDE8', color: '#333F3C' }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col z-20 flex-shrink-0 fixed left-0 top-0 h-screen"
        style={{ backgroundColor: '#004838', boxShadow: '4px 0 24px rgba(0,72,56,0.15)' }}
      >
        {/* Logo */}
        <div
          className="h-20 flex items-center gap-2 px-6 font-extrabold text-xl flex-shrink-0"
          style={{ color: '#E2FB6C', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <BrainCircuit size={26} />
          HireSense
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm"
                style={isActive
                  ? { backgroundColor: '#E2FB6C', color: '#004838' }
                  : { color: 'rgba(255,255,255,0.75)' }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#003b2d';
                    (e.currentTarget as HTMLElement).style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
                  }
                }}
              >
                <Icon size={19} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div
          className="p-4 flex items-center justify-between gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm uppercase flex-shrink-0"
              style={{ backgroundColor: '#E2FB6C', color: '#004838' }}
            >
              {user?.full_name?.charAt(0) || 'R'}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate" style={{ color: '#ffffff' }}>
                {user?.full_name || 'Recruiter Pro'}
              </p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {user?.email || 'admin@hiresense.ai'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            title="Log Out"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(220,38,38,0.2)';
              (e.currentTarget as HTMLElement).style.color = '#fca5a5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 pl-64">
        {/* Top header */}
        <header
          className="h-20 flex items-center justify-between px-8 flex-shrink-0"
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #D1D7D0',
            boxShadow: '0 2px 12px rgba(0,72,56,0.05)',
          }}
        >
          {/* Search */}
          <GlobalSearch />

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link
              to="/app/jobs?create=true"
              className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all"
              style={{ backgroundColor: '#E2FB6C', color: '#004838' }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#d4f54e'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#E2FB6C'}
            >
              + New Job
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-8" style={{ backgroundColor: '#EBEDE8' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
