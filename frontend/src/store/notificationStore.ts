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
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: { type: NotificationType, title: string, message: string }) => Promise<void>;
  markAsRead: (id: string | number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    // Only fetch if logged in
    if (!useAuthStore.getState().token) return;
    
    set({ isLoading: true });
    try {
      const data = await getNotifications();
      const countRes = await getUnreadNotificationCount();
      set({ notifications: data, unreadCount: countRes.count, isLoading: false });
    } catch (e) {
      console.error('Failed to fetch notifications', e);
      set({ isLoading: false });
    }
  },

  addNotification: async (notification) => {
    // If not logged in, we can't persist to the backend for this user.
    if (!useAuthStore.getState().token) {
       console.warn('Cannot add notification without authentication:', notification);
       return;
    }
    try {
      await createNotification(notification);
      await get().fetchNotifications();
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
      await get().fetchNotifications();
    } catch (e) {
      console.error('Failed to mark read', e);
      get().fetchNotifications(); // revert on failure
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
      await get().fetchNotifications();
    } catch (e) {
      console.error('Failed to mark all read', e);
      get().fetchNotifications();
    }
  },

  clearAll: async () => {
    if (!useAuthStore.getState().token) return;
    set({ notifications: [], unreadCount: 0 });
    try {
      await deleteAllNotifications();
    } catch (e) {
      console.error('Failed to clear notifications', e);
      get().fetchNotifications();
    }
  },
}));
