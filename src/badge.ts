import * as Notifications from 'expo-notifications';

export class BadgeManager {
  private getUnreadCount: () => Promise<number>;

  constructor(getUnreadCount: () => Promise<number>) {
    this.getUnreadCount = getUnreadCount;
  }

  async sync(): Promise<void> {
    try {
      const count = await this.getUnreadCount();
      await Notifications.setBadgeCountAsync(count);
    } catch {
      // Silently fail — badge sync should never crash the app
    }
  }

  async clear(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch {
      // Silently fail
    }
  }
}
