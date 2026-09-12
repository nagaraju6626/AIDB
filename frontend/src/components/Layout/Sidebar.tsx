import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  Database, LayoutDashboard, MessageSquare, 
  Network, History, Bookmark, BarChart3, Settings, LogOut 
} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageSquare, label: 'Chat & Query', path: '/query' },
    { icon: Network, label: 'Schema Explorer', path: '/schema' },
    { icon: History, label: 'Query History', path: '/history' },
    { icon: Bookmark, label: 'Saved Queries', path: '/saved' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Database, label: 'Connections', path: '/connections' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-64 h-screen bg-navy dark:bg-slate-900 text-white flex flex-col border-r border-transparent dark:border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <Database className="text-blue-500 w-8 h-8" />
        <span className="text-xl font-bold">AI Data Assistant</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
