import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  NotificationsClient,
  getGlobalClient,
  onClientReady,
} from './client';
import type { Notification } from './types';

// ============================================================================
// Global refetch bridge — mutations trigger list refetch without coupling
// ============================================================================

const _refetchFns = new Set<() => void>();
const _triggerRefetch = () => { _refetchFns.forEach(fn => fn()); };

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

  // Register as a global refetch target so mutations can trigger a refresh
  useEffect(() => {
    _refetchFns.add(fetch);
    return () => { _refetchFns.delete(fetch); };
  }, [fetch]);

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

  // Register as a global refetch target so mutations can refresh the badge too
  useEffect(() => {
    _refetchFns.add(fetch);
    return () => { _refetchFns.delete(fetch); };
  }, [fetch]);

  useEffect(() => {
    if (!c) return;
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') fetch();
    });
    return () => sub.remove();
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
      _triggerRefetch();
    },
    [c],
  );

  const markAllAsRead = useCallback(async () => {
    if (!c) throw new Error('NotificationsClient not initialized');
      await c.markAllAsRead();
    _triggerRefetch();
  }, [c]);

  const removeNotification = useCallback(
    async (id: string) => {
      if (!c) throw new Error('NotificationsClient not initialized');
      await c.removeNotification(id);
      _triggerRefetch();
    },
    [c],
  );

  const dismissAction = useCallback(
    async (id: string) => {
      if (!c) throw new Error('NotificationsClient not initialized');
      await c.dismissAction(id);
      _triggerRefetch();
    },
    [c],
  );

  const clearAll = useCallback(async () => {
    if (!c) throw new Error('NotificationsClient not initialized');
    await c.clearAll();
    _triggerRefetch();
  }, [c]);

  return {
    markAsRead,
    markAllAsRead,
    removeNotification,
    dismissAction,
    clearAll,
    invalidate: _triggerRefetch,
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
