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
  } = options;

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

  setupTapHandlers({ onNotificationTapped, navigateToRoute });

  const client = new NotificationsClient(http);
  setGlobalClient(client);
  return client;
}
