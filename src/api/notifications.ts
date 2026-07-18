import type { HttpClient } from '../http';
import type { Notification, UnreadCount } from '../types';

export interface NotificationsApi {
  getNotifications(): Promise<{ notifications: Notification[] }>;
  getUnreadCount(): Promise<UnreadCount>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  removeNotification(id: string): Promise<void>;
  dismissAction(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export function createNotificationsApi(http: HttpClient): NotificationsApi {
  return {
    getNotifications(): Promise<{ notifications: Notification[] }> {
      return http.get('/notifications');
    },

    getUnreadCount(): Promise<UnreadCount> {
      return http.get('/notifications/unread-count');
    },

    markAsRead(id: string): Promise<void> {
      return http.post(`/notifications/${id}/mark-read`);
    },

    markAllAsRead(): Promise<void> {
      return http.post('/notifications/mark-all-read');
    },

    removeNotification(id: string): Promise<void> {
      return http.delete(`/notifications/${id}`);
    },

    dismissAction(id: string): Promise<void> {
      return http.post(`/notifications/${id}/dismiss-action`);
    },

    clearAll(): Promise<void> {
      return http.delete('/notifications');
    },
  };
}
