import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  NotificationsClient,
  getGlobalClient,
  onClientReady,
} from './client';
import type { PaginationMeta } from './api/notifications';
import type { Notification } from './types';

// ============================================================================
// Global refetch bridge — mutations trigger list refetch without coupling
// ============================================================================

const _refetchFns = new Set<() => void>();
const _triggerRefetch = () => { _refetchFns.forEach(fn => fn()); };

// ============================================================================
// Queries
// ============================================================================

export function useNotificationsList(
  client?: NotificationsClient,
  options?: { pageSize?: number },
) {
  const [c, setC] = useState<NotificationsClient | null>(
    client ?? getGlobalClient(),
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  // Starts false — never blocks the UI on client readiness (a missing client
  // previously left isLoading true forever).
  const [isLoading, setIsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cRef = useRef(c);
  const pageSize = options?.pageSize ?? 20;
  cRef.current = c;

  useEffect(() => {
    if (c) return;
    return onClientReady(() => {
      setC(getGlobalClient());
    });
  }, []);

  const silentFetch = useCallback(async () => {
    const ch = cRef.current;
    if (!ch) return;
    try {
      const result = await ch.getNotifications({ page: 1, page_size: pageSize });
      setNotifications(result.notifications);
      setPagination(result.pagination);
    } catch {
      // silent — no loading state toggling
    }
  }, [pageSize]);

  const fetch = useCallback(
    async (page: number, mode: 'initial' | 'refresh' | 'next') => {
      const ch = cRef.current;
      if (!ch) return;
      try {
        if (mode === 'initial') setIsLoading(true);
        else if (mode === 'refresh') setIsRefetching(true);
        else setIsFetchingNextPage(true);
        setError(null);
        const result = await ch.getNotifications({
          page,
          page_size: pageSize,
        });
        if (mode === 'next') {
          setNotifications((prev) => {
            const seen = new Set(prev.map((n) => n.id));
            return [
              ...prev,
              ...result.notifications.filter((n) => !seen.has(n.id)),
            ];
          });
        } else {
          setNotifications(result.notifications);
        }
        setPagination(result.pagination);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
        setIsRefetching(false);
        setIsFetchingNextPage(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    if (c) fetch(1, 'initial');
  }, [c, fetch]);

  const fetchNextPage = useCallback(() => {
    if (
      !pagination ||
      pagination.page >= pagination.total_pages ||
      isFetchingNextPage
    ) {
      return;
    }
    fetch(pagination.page + 1, 'next');
  }, [fetch, pagination, isFetchingNextPage]);

  const refetch = useCallback(() => fetch(1, 'refresh'), [fetch]);

  // Register silent fetch for mutation-triggered refetches (no UI flicker)
  useEffect(() => {
    _refetchFns.add(silentFetch);
    return () => { _refetchFns.delete(silentFetch); };
  }, [silentFetch]);

  useEffect(() => {
    if (!c) return;
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        refetch();
        cRef.current?.syncBadge().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [c, refetch]);

  return {
    data: notifications.length > 0 ? { notifications } : null,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage: pagination
      ? pagination.page < pagination.total_pages
      : false,
  };
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

  const silentFetch = useCallback(async () => {
    const ch = cRef.current;
    if (!ch) return;
    try {
      const count = await ch.getUnreadCount();
      setData(count);
    } catch {
      // silent
    }
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

  // Register silent fetch for mutation-triggered refetches (no UI flicker)
  useEffect(() => {
    _refetchFns.add(silentFetch);
    return () => { _refetchFns.delete(silentFetch); };
  }, [silentFetch]);

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
