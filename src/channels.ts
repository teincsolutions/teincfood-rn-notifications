import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';

export interface ChannelConfig {
  id: string;
  name: string;
  importance: AndroidImportance;
  visibility: AndroidVisibility;
  vibration: boolean;
  sound: string;
}

export const CHANNELS = {
  ORDER_UPDATES: 'order-updates',
  LIVE_TIMERS: 'live-timers',
  ACTION_NOTIFICATIONS: 'action-notifications',
} as const;

const CHANNEL_CONFIGS: ChannelConfig[] = [
  {
    id: CHANNELS.ORDER_UPDATES,
    name: 'Order Updates',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    sound: 'default',
  },
  {
    id: CHANNELS.LIVE_TIMERS,
    name: 'Live Timers',
    importance: AndroidImportance.DEFAULT,
    visibility: AndroidVisibility.PUBLIC,
    vibration: false,
    sound: 'default',
  },
  {
    id: CHANNELS.ACTION_NOTIFICATIONS,
    name: 'Action Required',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    sound: 'default',
  },
];

let channelsCreated = false;

export async function createNotificationChannels(): Promise<void> {
  if (channelsCreated) return;
  for (const config of CHANNEL_CONFIGS) {
    await notifee.createChannel(config);
  }
  channelsCreated = true;
}
