import { Bell, Moon, Sun, ChevronDown, Database, Check, User, Settings, LogOut } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useNotificationStore } from '../../store/notificationStore';

import { getConnections, testExistingConnection } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const Topbar = () => {
  const { user, logout } = useAuthStore();
  const { activeConnectionId, connections, connectionStatus, setActiveConnection, setConnections, setConnectionStatus } = useConnectionStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, fetchNotifications } = useNotificationStore();
  
  const [dbDropdownOpen, setDbDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  const dbDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Theme logic
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    fetchNotifications();
    getConnections().then(res => {
      setConnections(res.data.connections);
      let activeState = useConnectionStore.getState().activeConnectionId;
      if (!activeState && res.data.connections.length > 0) {
        activeState = res.data.connections[0].id;
        setActiveConnection(activeState);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeConnectionId) {
      setConnectionStatus("not_connected");
      return;
    }
    
    setConnectionStatus("checking");
    testExistingConnection(activeConnectionId).finally(() => fetchNotifications())
      .then(() => setConnectionStatus("connected"))
      .catch(() => setConnectionStatus("disconnected"));
      
    const handleDisconnect = () => setConnectionStatus("disconnected");
    window.addEventListener('db:disconnected', handleDisconnect);
    return () => window.removeEventListener('db:disconnected', handleDisconnect);
  }, [activeConnectionId, setConnectionStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dbDropdownRef.current && !dbDropdownRef.current.contains(event.target as Node)) {
        setDbDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const activeConnection = connections.find(c => c.id === activeConnectionId);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors">
      
      {/* Database Selector */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={dbDropdownRef}>
          <div 
            onClick={() => setDbDropdownOpen(!dbDropdownOpen)}
            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/30 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:border-slate-700 rounded-md px-3 py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Database className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{activeConnection ? activeConnection.name : 'Select Database'}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          
          {dbDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                Saved Connections
              </div>
              {connections.map(conn => (
                <button
                  key={conn.id}
                  onClick={() => {
                    setActiveConnection(conn.id);
                    setDbDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-200">{conn.name}</span>
                  {conn.id === activeConnectionId && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 dark:text-blue-400" />}
                </button>
              ))}
              {connections.length === 0 && (
                <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 italic">No connections found</div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 hidden sm:flex">
          {connectionStatus === 'connected' && (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Connected</span>
            </>
          )}
          {connectionStatus === 'disconnected' && (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Disconnected</span>
            </>
          )}
          {connectionStatus === 'checking' && (
            <>
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Checking...</span>
            </>
          )}
          {connectionStatus === 'not_connected' && (
            <>
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Not Connected</span>
            </>
          )}
        </div>
      </div>
      
      {/* Right side controls */}
      <div className="flex items-center gap-3">
        
        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        {/* Notifications */}
        <div className="relative" ref={notifDropdownRef}>
          <button onClick={() => setNotifDropdownOpen(!notifDropdownOpen)} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            )}
          </button>
          
          {notifDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-blue-600 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400 dark:text-slate-400 text-sm">
                    You're all caught up
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-50 dark:bg-blue-900/20/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium ${!n.is_read ? 'text-slate-800 dark:text-slate-200 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400 dark:text-slate-400'}`}>{n.title}</span>
                        <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(n.created_at + 'Z'))} ago</span>
                      </div>
                      <p className={`text-xs ${!n.is_read ? 'text-slate-600 dark:text-slate-400 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400 dark:text-slate-400'}`}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <button onClick={clearAll} className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-300 py-1">
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* User Profile */}
        <div className="relative ml-2 pl-4 border-l border-slate-200 dark:border-slate-700 dark:border-slate-700" ref={userDropdownRef}>
          <div 
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-3 cursor-pointer p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 capitalize">{user?.role?.toLowerCase() || 'Member'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-200 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-400">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          
          {userDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 md:hidden">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              
              <Link to="/settings" onClick={() => setUserDropdownOpen(false)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors">
                <User className="w-4 h-4" /> Profile
              </Link>
              <Link to="/settings" onClick={() => setUserDropdownOpen(false)} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

