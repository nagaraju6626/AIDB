import { create } from 'zustand';
import { 
  getNotifications, 
  createNotification, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteAllNotifications, 
  getUnreadNotificationCount 
} from '../services/api';
import { useAuthStore } from './authStore';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: string | number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  activeToasts: AppNotification[];
  isInitialized: boolean;
  knownNotificationIds: Set<string | number>;
  
  fetchNotifications: (silent?: boolean) => Promise<void>;
  addNotification: (notification: { type: NotificationType, title: string, message: string }) => Promise<void>;
  markAsRead: (id: string | number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  dismissToast: (id: string | number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  activeToasts: [],
  isInitialized: false,
  knownNotificationIds: new Set(),

  fetchNotifications: async (silent = false) => {
    // Only fetch if logged in
    if (!useAuthStore.getState().token) return;
    
    if (!silent) set({ isLoading: true });
    try {
      const data = await getNotifications();
      const countRes = await getUnreadNotificationCount();
      
      set((state) => {
        const { isInitialized, knownNotificationIds, activeToasts } = state;
        
        if (!isInitialized) {
          // First load: just memorize existing IDs, no toasts
          const newKnownIds = new Set<string | number>();
          data.forEach((n: AppNotification) => newKnownIds.add(n.id));
          return {
            notifications: data,
            unreadCount: countRes.count,
            isLoading: false,
            isInitialized: true,
            knownNotificationIds: newKnownIds,
          };
        }
        
        // Subsequent loads: find genuinely new unread notifications
        const newToasts = [...activeToasts];
        const newKnownIds = new Set(knownNotificationIds);
        
        data.forEach((n: AppNotification) => {
          if (!newKnownIds.has(n.id)) {
            newKnownIds.add(n.id);
            if (!n.is_read) {
              newToasts.push(n);
            }
          }
        });
        
        return {
          notifications: data,
          unreadCount: countRes.count,
          isLoading: false,
          activeToasts: newToasts,
          knownNotificationIds: newKnownIds,
        };
      });
    } catch (e) {
      console.error('Failed to fetch notifications', e);
      set({ isLoading: false });
    }
  },

  addNotification: async (notification) => {
    if (!useAuthStore.getState().token) {
       console.warn('Cannot add notification without authentication:', notification);
       return;
    }
    try {
      await createNotification(notification);
      await get().fetchNotifications(true);
    } catch (e) {
      console.error('Failed to create notification', e);
    }
  },

  markAsRead: async (id) => {
    if (!useAuthStore.getState().token) return;
    // Optimistic update
    set((state) => {
      const updated = state.notifications.map((n) => n.id === id ? { ...n, is_read: true } : n);
      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    });
    try {
      await markNotificationAsRead(Number(id));
      await get().fetchNotifications(true);
    } catch (e) {
      console.error('Failed to mark read', e);
      get().fetchNotifications(true); // revert on failure
    }
  },

  markAllAsRead: async () => {
    if (!useAuthStore.getState().token) return;
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0
    }));
    try {
      await markAllNotificationsAsRead();
      await get().fetchNotifications(true);
    } catch (e) {
      console.error('Failed to mark all read', e);
      get().fetchNotifications(true);
    }
  },

  clearAll: async () => {
    if (!useAuthStore.getState().token) return;
    set({ notifications: [], unreadCount: 0 });
    try {
      await deleteAllNotifications();
    } catch (e) {
      console.error('Failed to clear notifications', e);
      get().fetchNotifications(true);
    }
  },

  dismissToast: (id) => {
    set((state) => ({
      activeToasts: state.activeToasts.filter((t) => t.id !== id)
    }));
  }
}));
