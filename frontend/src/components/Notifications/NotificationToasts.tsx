import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import type { AppNotification, NotificationType } from '../../store/notificationStore';

const TOAST_DURATION = 4500; // 4.5 seconds

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const Toast = ({ notification, onDismiss }: { notification: AppNotification, onDismiss: (id: string | number) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 border border-slate-200 dark:border-slate-700 mb-3 transition-all duration-300 transform translate-y-0 opacity-100 slide-in-from-right-5 fade-in">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {notification.message}
            </p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:hover:text-slate-300"
              onClick={() => onDismiss(notification.id)}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationToasts = () => {
  const { activeToasts, dismissToast } = useNotificationStore();

  if (activeToasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 flex px-4 py-6 items-start justify-end sm:p-6 z-50"
      style={{ top: '64px' }} // Below the 64px Topbar
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {activeToasts.map((toast) => (
          <Toast key={toast.id} notification={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </div>
  );
};
