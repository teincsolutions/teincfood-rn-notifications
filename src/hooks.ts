import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  NotificationsClient,
  getGlobalClient,
} from './client';
import type { Notification } from './types';

function getClient(client?: NotificationsClient): NotificationsClient {
  const c = client ?? getGlobalClient();
  if (!c)
    throw new Error(
      'NotificationsClient not initialized. Call setupNotifications() first.',
    );
  return c;
}

// ============================================================================
// Queries
// ============================================================================

export function useNotificationsList(client?: NotificationsClient) {
  const c = getClient(client);
  const [data, setData] = useState<{ notifications: Notification[] } | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef(c);
  clientRef.current = c;

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await clientRef.current.getNotifications();
      setData(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        fetch();
        clientRef.current.syncBadge().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useUnreadCount(client?: NotificationsClient) {
  const c = getClient(client);
  const [data, setData] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const clientRef = useRef(c);
  clientRef.current = c;

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const count = await clientRef.current.getUnreadCount();
      setData(count);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

// ============================================================================
// Mutations
// ============================================================================

export function useNotificationsMutations(client?: NotificationsClient) {
  const c = getClient(client);

  const invalidate = useCallback(() => {
    // No-op: plain state hooks auto-refresh on next mount.
    // Consumers can call refetch from useNotificationsList if needed.
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      await c.markAsRead(id);
    },
    [c],
  );

  const markAllAsRead = useCallback(async () => {
    await c.markAllAsRead();
  }, [c]);

  const removeNotification = useCallback(
    async (id: string) => {
      await c.removeNotification(id);
    },
    [c],
  );

  const dismissAction = useCallback(
    async (id: string) => {
      await c.dismissAction(id);
    },
    [c],
  );

  const clearAll = useCallback(async () => {
    await c.clearAll();
  }, [c]);

  return {
    markAsRead,
    markAllAsRead,
    removeNotification,
    dismissAction,
    clearAll,
    invalidate,
  };
}

// ============================================================================
// Real-time Stream
// ============================================================================

export type SubscribeToNotifications = (
  onNotification: () => void,
) => () => void;

export function useNotificationsStream(
  subscribe: SubscribeToNotifications,
  enabled: boolean,
  client?: NotificationsClient,
) {
  useEffect(() => {
    if (!enabled) return;
    const c = client ?? getGlobalClient();
    if (!c) return;
    return subscribe(() => {});
  }, [enabled, subscribe, client]);
}
