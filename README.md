# @teincfood/rn-notifications

React Native notification library for TeincFood — handles FCM push, Notifee, expo-notifications, badge sync, channels, tap handling, and push token registration out of the box.

## Installation

```bash
npm install @teincfood/rn-notifications
```

### Peer dependencies

Ensure the following are installed in your project:

- `@tanstack/react-query >= 5`
- `expo >= 52`
- `@notifee/react-native >= 9`
- `@react-native-firebase/app >= 21`
- `@react-native-firebase/messaging >= 21`
- `expo-crypto >= 12`
- `expo-live-activity >= 0.4`
- `expo-notifications >= 0.28`
- `react >= 18`
- `react-native >= 0.72`

### Expo config plugin

Add to your `app.config.js`:

```js
plugins: [
  "@teincfood/rn-notifications",
  // ... other plugins
]
```

The plugin automatically configures:
- `expo-notifications` with 9 notification sounds
- `@react-native-firebase/app` (static frameworks)
- `@react-native-firebase/messaging` (static frameworks)
- `expo-live-activity`
- Notifee Android Maven repo
- Android notification permissions (`POST_NOTIFICATIONS`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`)
- iOS `remote-notification` background mode
- Firebase manifest replacements for Android

## Usage

### 1. Setup

Call `setupNotifications` once in your root `_layout.tsx`:

```ts
import { setupNotifications } from '@teincfood/rn-notifications';
import type { PushNotificationData, NotificationAction } from '@teincfood/rn-notifications';
import { api } from './services/api.service';

setupNotifications({
  httpClient: api,
  appType: 'buyer', // 'buyer' | 'business' | 'admin'
  navigateToRoute: (route: string) => router.push(route),
  onNotificationTapped: (payload: PushNotificationData) => {
    // optional custom tap handling
  },
  onActionPress: (action: NotificationAction, payload: PushNotificationData) => {
    // handle notification action button press
  },
});
```

### 2. Hooks

```ts
import {
  useNotificationsList,
  useUnreadCount,
  useNotificationsMutations,
  useNotificationsStream,
} from '@teincfood/rn-notifications';

// Fetch notifications
const { data, isLoading } = useNotificationsList();

// Get unread count
const { data: unreadCount } = useUnreadCount();

// Mutations
const { markAsRead, markAllAsRead, removeNotification, clearAll } = useNotificationsMutations();

// Real-time stream
useNotificationsStream(
  (cb) => {
    const disconnect = eventsService.connect(userId);
    const unsub = eventsService.on('notification_created', cb);
    return () => { unsub(); disconnect(); };
  },
  isAuthenticated,
);
```

### 3. Notification sounds

9 `.wav` sounds are bundled and automatically configured by the Expo config plugin:

- `notification_default.wav`
- `order_new.wav`
- `order_status.wav`
- `order_alert.wav`
- `order_complete.wav`
- `order_cancelled.wav`
- `rider_pickup.wav`
- `rider_opportunity.wav`
- `timer_alert.wav`

## API

### `setupNotifications(options: SetupOptions)`

Initializes the notification system. Options:

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `httpClient` | `HttpClient` | Yes | HTTP client for API calls |
| `appType` | `'buyer' \| 'business' \| 'admin'` | Yes | App type for token registration |
| `navigateToRoute` | `(route: string) => void` | No | Navigation callback on tap |
| `onNotificationTapped` | `(payload: PushNotificationData) => void` | No | Custom tap handler |
| `onActionPress` | `(action: NotificationAction, payload: PushNotificationData) => void` | No | Action button press handler |

### `NotificationsClient`

Class with methods:

- `getNotifications()` — fetch notification list
- `getUnreadCount()` — fetch unread count
- `markAsRead(id)` — mark single notification as read
- `markAllAsRead()` — mark all as read
- `removeNotification(id)` — remove a notification
- `dismissAction(id)` — dismiss a notification action
- `clearAll()` — clear all notifications
- `syncBadge()` — sync native badge with server count
- `clearBadge()` — clear native badge
- `getPreferences()` / `updatePreferences(prefs)` — notification preferences

Global singleton managed via `setGlobalClient(client)` / `getGlobalClient()`.

## License

MIT
