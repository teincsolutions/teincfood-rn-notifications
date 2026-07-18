import * as ExpoNotifications from 'expo-notifications';
import notifee from '@notifee/react-native';
import type { PushDataPayload, PushNotificationData } from './types';
import { buildNotificationRoute } from './types';

export interface IncomingNotification {
  title: string;
  body: string;
  data: PushDataPayload | null;
  notificationId: string;
  categoryId?: string;
}

export interface TapHandlerOptions {
  onNotificationTapped?: (payload: PushDataPayload | null) => void;
  navigateToRoute?: (route: string) => void;
}

function extractExpoPayload(
  content: ExpoNotifications.NotificationContent,
): PushDataPayload | null {
  if (typeof content.data === 'object' && content.data !== null) {
    return content.data as PushDataPayload;
  }
  return null;
}

export function setupTapHandlers(options: TapHandlerOptions): () => void {
  const disposers: (() => void)[] = [];

  // Expo tap handler (foreground + background via listener)
  const expoTapSub = ExpoNotifications.addNotificationResponseReceivedListener(
    (response) => {
      const payload = extractExpoPayload(response.notification.request.content);
      options.onNotificationTapped?.(payload);

      if (payload && options.navigateToRoute) {
        const route = buildNotificationRoute(payload);
        if (route) {
          options.navigateToRoute(route);
        }
      }
    },
  );
  disposers.push(() => expoTapSub.remove());

  // Expo cold-start handler
  ExpoNotifications.getLastNotificationResponseAsync().then((response) => {
    if (!response) return;
    const payload = extractExpoPayload(response.notification.request.content);
    options.onNotificationTapped?.(payload);

    if (payload && options.navigateToRoute) {
      const route = buildNotificationRoute(payload);
      if (route) {
        options.navigateToRoute(route);
      }
    }
  });

  // Notifee cold-start handler
  notifee.getInitialNotification().then((event) => {
    if (!event?.pressAction?.id) return;
    const data = (event.notification?.data || {}) as PushNotificationData;
    if (event.pressAction.id) {
      options.onNotificationTapped?.(data as unknown as PushDataPayload);
      if (options.navigateToRoute && data.route) {
        options.navigateToRoute(data.route);
      }
    }
  });

  return () => {
    for (const dispose of disposers) {
      try {
        dispose();
      } catch {}
    }
  };
}
