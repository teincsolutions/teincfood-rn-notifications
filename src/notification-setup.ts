import { Platform } from 'react-native';
import * as ExpoNotifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import type { HttpClient } from './http';
import type {
  AppType,
  PushDataPayload,
  PushNotificationData,
  NotificationAction,
} from './types';
import { buildTokenRegistrationPayload } from './devices';
import { createNotificationChannels } from './channels';
import { registerPushHandlers } from './handlers';
import { setupTapHandlers } from './tap-handler';
import { NotificationsClient, setGlobalClient } from './client';

export interface SetupOptions {
  http: HttpClient;
  appType: AppType;
  buildActions?: (data: PushNotificationData) => NotificationAction[];
  onActionPress?: (actionId: string, data: PushNotificationData) => void;
  onNotificationTapped?: (payload: PushDataPayload | null) => void;
  navigateToRoute?: (route: string) => void;
  /**
   * Audience used to resolve payloads that omit `app_type`. Defaults to the
   * token-registration app type.
   */
  fallbackAppType?: AppType | 'rider';
}

export async function setupNotifications(
  options: SetupOptions,
): Promise<NotificationsClient> {
  const {
    http,
    appType,
    buildActions,
    onActionPress,
    onNotificationTapped,
    navigateToRoute,
    fallbackAppType = appType,
  } = options;

  // Create and publish the in-app notification client FIRST so list/query hooks
  // can fetch regardless of push permission, FCM token, or token registration
  // state. Previously the client was only published after all push setup
  // succeeded, which left useNotificationsList stuck loading forever when the
  // user denied notification permission (or FCM registration failed).
  const client = new NotificationsClient(http);
  setGlobalClient(client);

  if (Platform.OS === 'android') {
    await createNotificationChannels();
  }

  ExpoNotifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const cleanupPushHandlers = registerPushHandlers({
    buildActions,
    onActionPress,
  });

  try {
    const permission = await ExpoNotifications.requestPermissionsAsync();
    const granted =
      (permission as { granted?: boolean }).granted ??
      (permission as { status?: string }).status === 'granted';
    if (!granted) {
      cleanupPushHandlers();
      throw new Error('Notification permission not granted');
    }

    const fcmToken = await messaging().getToken();
    const payload = buildTokenRegistrationPayload(fcmToken, appType);
    await http.post('/devices/push-token', payload);

    messaging().onTokenRefresh(async (token) => {
      const refreshed = buildTokenRegistrationPayload(token, appType);
      await http.post('/devices/push-token', refreshed);
    });

    setupTapHandlers({ onNotificationTapped, navigateToRoute, fallbackAppType });
  } catch (e) {
    // Push setup must never block the in-app notification list — the client is
    // already published above. Surface the failure so the caller can log it.
    cleanupPushHandlers();
    throw e;
  }

  return client;
}
