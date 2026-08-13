import type { HttpClient } from '../http';
import type { Notification, UnreadCount } from '../types';

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_entries: number;
  total_pages: number;
}

export interface NotificationsPage {
  notifications: Notification[];
  pagination: PaginationMeta;
}

export interface ListNotificationsOptions {
  page?: number;
  page_size?: number;
}

interface BackendNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  inserted_at: string;
  payload: Record<string, unknown> | null;
  action_dismissed?: boolean;
  updated_at?: string;
}

function mapNotification(n: BackendNotification): Notification {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    message: n.body,
    read: n.is_read,
    action_dismissed: n.action_dismissed ?? false,
    data: n.payload,
    payload: n.payload,
    type: n.type,
    created_at: n.inserted_at,
    updated_at: n.updated_at ?? n.inserted_at,
  };
}

export interface NotificationsApi {
  getNotifications(options?: ListNotificationsOptions): Promise<NotificationsPage>;
  getUnreadCount(): Promise<UnreadCount>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  removeNotification(id: string): Promise<void>;
  dismissAction(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export function createNotificationsApi(http: HttpClient): NotificationsApi {
  return {
    async getNotifications(
      options?: ListNotificationsOptions,
    ): Promise<NotificationsPage> {
      const config =
        options && (options.page != null || options.page_size != null)
          ? { params: { page: options.page, page_size: options.page_size } }
          : undefined;
      const response = await http.get<{
        data: { notifications: BackendNotification[] };
        pagination: PaginationMeta;
      }>('/notifications', config);
      return {
        notifications: response.data.notifications.map(mapNotification),
        pagination: response.pagination,
      };
    },

    async getUnreadCount(): Promise<UnreadCount> {
      const response = await http.get<{
        data: { count: number };
      }>('/notifications/unread-count');
      return { count: response.data.count };
    },

    async markAsRead(id: string): Promise<void> {
      await http.patch(`/notifications/${id}/read`);
    },

    async markAllAsRead(): Promise<void> {
      await http.patch('/notifications/read-all');
    },

    async removeNotification(id: string): Promise<void> {
      await http.delete(`/notifications/${id}`);
    },

    async dismissAction(id: string): Promise<void> {
      await http.patch(`/notifications/${id}/dismiss-action`);
    },

    async clearAll(): Promise<void> {
      await http.delete('/notifications');
    },
  };
}
