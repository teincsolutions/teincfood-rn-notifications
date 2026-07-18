import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  NotificationsClient,
  getGlobalClient,
  onClientReady,
} from './client';
import type { Notification } from './types';

// ============================================================================
// Queries
// ============================================================================

export function useNotificationsList(client?: NotificationsClient) {
  const [c, setC] = useState<NotificationsClient | null>(
    client ?? getGlobalClient(),
  );
  const [data, setData] = useState<{ notifications: Notification[] } | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(!c);
  const [error, setError] = useState<Error | null>(null);
  const cRef = useRef(c);
  cRef.current = c;

  useEffect(() => {
    if (c) return;
    return onClientReady(() => {
      setC(getGlobalClient());
    });
  }, []);

  const fetch = useCallback(async () => {
    const ch = cRef.current;
    if (!ch) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await ch.getNotifications();
      setData(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (c) fetch();
  }, [c, fetch]);

  useEffect(() => {
    if (!c) return;
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        fetch();
        cRef.current?.syncBadge().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [c, fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useUnreadCount(client?: NotificationsClient) {
  const [c, setC] = useState<NotificationsClient | null>(
    client ?? getGlobalClient(),
  );
  const [data, setData] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(!c);
  const cRef = useRef(c);
  cRef.current = c;

  useEffect(() => {
    if (c) return;
    return onClientReady(() => {
      setC(getGlobalClient());
    });
  }, []);

  const fetch = useCallback(async () => {
    const ch = cRef.current;
    if (!ch) return;
    try {
      setIsLoading(true);
      const count = await ch.getUnreadCount();
      setData(count);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (c) fetch();
  }, [c, fetch]);

  return { data, isLoading, refetch: fetch };
}

// ============================================================================
// Mutations
// ============================================================================

export function useNotificationsMutations(client?: NotificationsClient) {
  const [c, setC] = useState<NotificationsClient | null>(
    client ?? getGlobalClient(),
  );

  useEffect(() => {
    if (c) return;
    return onClientReady(() => {
      setC(getGlobalClient());
    });
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!c) throw new Error('NotificationsClient not initialized');
      await c.markAsRead(id);
    },
    [c],
  );

  const markAllAsRead = useCallback(async () => {
    if (!c) throw new Error('NotificationsClient not initialized');
    await c.markAllAsRead();
  }, [c]);

  const removeNotification = useCallback(
    async (id: string) => {
      if (!c) throw new Error('NotificationsClient not initialized');
      await c.removeNotification(id);
    },
    [c],
  );

  const dismissAction = useCallback(
    async (id: string) => {
      if (!c) throw new Error('NotificationsClient not initialized');
      await c.dismissAction(id);
    },
    [c],
  );

  const clearAll = useCallback(async () => {
    if (!c) throw new Error('NotificationsClient not initialized');
    await c.clearAll();
  }, [c]);

  return {
    markAsRead,
    markAllAsRead,
    removeNotification,
    dismissAction,
    clearAll,
    invalidate: () => {},
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
