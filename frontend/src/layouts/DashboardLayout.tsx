import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, MessageSquare, Settings, Bell, Search, BrainCircuit, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

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
    <div className="flex h-screen bg-background text-text overflow-hidden font-sans">
      <aside className="w-64 bg-card border-r border-border flex flex-col z-20 shadow-sm">
        <div className="h-20 flex items-center gap-2 px-6 font-bold text-2xl text-primary border-b border-border">
          <BrainCircuit size={28} /> HireSense
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);
            return (
              <Link key={item.name} to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                  isActive ? "bg-primary/10 text-primary" : "text-muted hover:bg-background hover:text-text"
                )}
              >
                <Icon size={20} /> {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white uppercase flex-shrink-0">
              {user?.full_name?.charAt(0) || 'R'}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{user?.full_name || 'Recruiter Pro'}</p>
              <p className="text-xs text-muted truncate">{user?.email || 'admin@hiresense.ai'}</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative z-10">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 shadow-sm">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input type="text" placeholder="Search across HireSense..." 
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium" />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2.5 text-muted hover:bg-background rounded-xl transition">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border border-card"></span>
            </button>
            <Link to="/app/jobs?create=true" className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl shadow-soft hover:bg-primary/90 transition flex items-center justify-center">
              + New Job
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 bg-background">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
