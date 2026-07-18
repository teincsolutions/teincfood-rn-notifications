import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  NotificationsClient,
  getGlobalClient,
  NOTIFICATIONS_QUERY_KEY,
} from './client';

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
  const result = useQuery({
    queryKey: c.queryKey as QueryKey,
    queryFn: () => c.getNotifications(),
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        result.refetch();
        c.syncBadge().catch(() => {});
      }
    });
    return () => sub.remove();
  }, [c, result.refetch]);

  return result;
}

export function useUnreadCount(client?: NotificationsClient) {
  const c = getClient(client);
  return useQuery({
    queryKey: [...c.queryKey, 'unread'] as QueryKey,
    queryFn: () => c.getUnreadCount(),
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useNotificationsMutations(client?: NotificationsClient) {
  const c = getClient(client);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: c.queryKey });
  };

  const markAsRead = useMutation({
    mutationFn: (id: string) => c.markAsRead(id),
    onSuccess: invalidate,
  });

  const markAllAsRead = useMutation({
    mutationFn: () => c.markAllAsRead(),
    onSuccess: invalidate,
  });

  const removeNotification = useMutation({
    mutationFn: (id: string) => c.removeNotification(id),
    onSuccess: invalidate,
  });

  const dismissAction = useMutation({
    mutationFn: (id: string) => c.dismissAction(id),
    onSuccess: invalidate,
  });

  const clearAll = useMutation({
    mutationFn: () => c.clearAll(),
    onSuccess: invalidate,
  });

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
  const c = getClient(client);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    return subscribe(() => {
      queryClient.invalidateQueries({ queryKey: c.queryKey });
    });
  }, [enabled, subscribe, c.queryKey, queryClient]);
}
