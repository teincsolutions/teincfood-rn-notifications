import type { HttpClient } from '../http';
import type { NotificationPreference, NotificationPreferences } from '../types';

export interface NotificationPreferencesApi {
  getPreferences(): Promise<NotificationPreferences>;
  updatePreferences(
    preferences: Partial<NotificationPreference>[],
  ): Promise<void>;
}

export function createNotificationPreferencesApi(
  http: HttpClient,
): NotificationPreferencesApi {
  return {
    getPreferences(): Promise<NotificationPreferences> {
      return http.get('/notifications/preferences');
    },

    updatePreferences(
      preferences: Partial<NotificationPreference>[],
    ): Promise<void> {
      return http.put('/notifications/preferences', { preferences });
    },
  };
}
