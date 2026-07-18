import type { HttpClient } from './http';
import {
  createNotificationsApi,
  type NotificationsApi,
} from './api/notifications';
import { createDevicesApi, type DevicesApi } from './api/devices';
import {
  createNotificationPreferencesApi,
  type NotificationPreferencesApi,
} from './api/preferences';
import { BadgeManager } from './badge';
import type { Notification, NotificationPreferences } from './types';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];

let _globalClient: NotificationsClient | null = null;

export function setGlobalClient(client: NotificationsClient | null) {
  _globalClient = client;
}

export function getGlobalClient(): NotificationsClient | null {
  return _globalClient;
}

export class NotificationsClient {
  queryKey: string[];

  private api: NotificationsApi;
  private devicesApi: DevicesApi;
  private preferencesApi: NotificationPreferencesApi;
  private badgeManager: BadgeManager;

  constructor(http: HttpClient) {
    this.queryKey = NOTIFICATIONS_QUERY_KEY;
    this.api = createNotificationsApi(http);
    this.devicesApi = createDevicesApi(http);
    this.preferencesApi = createNotificationPreferencesApi(http);
    this.badgeManager = new BadgeManager(() =>
      this.api.getUnreadCount().then((r) => r.count),
    );
  }

  // Notifications

  async getNotifications(): Promise<{ notifications: Notification[] }> {
    return this.api.getNotifications();
  }

  async getUnreadCount(): Promise<number> {
    const result = await this.api.getUnreadCount();
    return result.count;
  }

  async markAsRead(id: string): Promise<void> {
    await this.api.markAsRead(id);
    await this.syncBadge();
  }

  async markAllAsRead(): Promise<void> {
    await this.api.markAllAsRead();
    await this.syncBadge();
  }

  async removeNotification(id: string): Promise<void> {
    await this.api.removeNotification(id);
    await this.syncBadge();
  }

  async dismissAction(id: string): Promise<void> {
    await this.api.dismissAction(id);
  }

  async clearAll(): Promise<void> {
    await this.api.clearAll();
    await this.syncBadge();
  }

  // Preferences

  async getPreferences(): Promise<NotificationPreferences> {
    return this.preferencesApi.getPreferences();
  }

  async updatePreferences(
    preferences: Partial<NotificationPreferences[0]>[],
  ): Promise<void> {
    return this.preferencesApi.updatePreferences(preferences);
  }

  // Badge

  async syncBadge(): Promise<void> {
    await this.badgeManager.sync();
  }

  async clearBadge(): Promise<void> {
    await this.badgeManager.clear();
  }
}
