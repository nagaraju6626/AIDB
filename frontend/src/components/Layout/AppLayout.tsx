import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NotificationToasts } from '../Notifications/NotificationToasts';
import { useNotificationStore } from '../../store/notificationStore';

export const AppLayout = () => {
  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);

  useEffect(() => {
    // Lightweight polling every 15 seconds to check for background/other tab notifications
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar />
        <NotificationToasts />
        <main className="flex-1 overflow-y-auto p-6 text-slate-800 dark:text-slate-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
