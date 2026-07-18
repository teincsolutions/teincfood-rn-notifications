import notifee, { AndroidStyle, AndroidCategory, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import type { PushNotificationData, NotificationAction } from './types';
import { CHANNELS } from './channels';
import { createNotificationChannels } from './channels';
import { getNotificationSound } from './sounds';

export interface PushHandlerOptions {
  buildActions?: (data: PushNotificationData) => NotificationAction[];
  onActionPress?: (actionId: string, data: PushNotificationData) => void;
}

async function displayPushNotification(
  data: PushNotificationData,
  buildActions?: (data: PushNotificationData) => NotificationAction[],
): Promise<void> {
  await createNotificationChannels();

  const channelId =
    data.action_type === 'accept_order' || data.action_type === 'accept_delivery'
      ? CHANNELS.ACTION_NOTIFICATIONS
      : CHANNELS.ORDER_UPDATES;

  const sound = getNotificationSound(data.sound);

  const actions = buildActions?.(data) ?? [];
  const notifeeActions = actions.map((a) => ({
    title: a.title,
    pressAction: { id: a.id },
  }));

  await notifee.displayNotification({
    title: data.business_name || data.customer_name || '',
    body: data.order_number || data.status || '',
    android: {
      channelId,
      sound,
      pressAction: {
        id: data.order_id ? 'view_order' : 'navigate',
      },
      style: { type: AndroidStyle.BIGTEXT, text: data.status || '' },
      smallIcon: 'ic_launcher',
      ongoing: data.status === 'on_the_way' || data.status === 'arrived',
      category: AndroidCategory.ALARM,
      actions: notifeeActions,
    },
    data: data as unknown as Record<string, string | number | object>,
  });
}

export function registerPushHandlers(options: PushHandlerOptions = {}): () => void {
  const { buildActions, onActionPress } = options;
  const disposers: (() => void)[] = [];

  // Background handler (Android only)
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    const data = (remoteMessage.data || {}) as unknown as PushNotificationData;
    await displayPushNotification(data, buildActions);
  });

  // Foreground handler
  const foregroundUnsubscribe = messaging().onMessage(async (remoteMessage) => {
    const data = (remoteMessage.data || {}) as unknown as PushNotificationData;
    await displayPushNotification(data, buildActions);
  });
  disposers.push(() => {
    try { foregroundUnsubscribe(); } catch {}
  });

  // Notifee foreground event listener
  const notifeeUnsub = notifee.onForegroundEvent(({ type, detail }) => {
    if (!onActionPress) return;
    const pressAction = detail.pressAction;
    if (!pressAction?.id) return;
    const data = (detail.notification?.data || {}) as PushNotificationData;

    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      onActionPress(pressAction.id, data);
    }
  });
  disposers.push(notifeeUnsub);

  return () => {
    for (const dispose of disposers) {
      try {
        dispose();
      } catch {}
    }
  };
}
