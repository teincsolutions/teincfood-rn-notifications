export type AppType = 'buyer' | 'business' | 'admin';

export interface Notification {
  id: string;
  title: string;
  body: string;
  message: string;
  read: boolean;
  action_dismissed: boolean;
  data: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  type: string;
}

export interface UnreadCount {
  count: number;
}

export interface PushDataPayload {
  type: string;
  route?: string;
  app_type?: AppType | 'rider' | string;
  order_id?: string;
  delivery_id?: string;
  conversation_id?: string;
  context?: 'buyer' | 'seller' | 'rider';
  action_type?: string;
  [key: string]: unknown;
}

export interface TokenRegistrationPayload {
  token: string;
  platform: 'ios' | 'android';
  provider: 'fcm' | 'apns';
  app_instance_id: string;
  app_type: AppType;
}

export interface NotificationPreference {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  channel: 'push' | 'email' | 'sms';
  category?: string;
}

export type NotificationPreferences = NotificationPreference[];

export interface PushNotificationData {
  route?: string;
  order_id?: string;
  delivery_id?: string;
  order_number?: string;
  status?: string;
  action_type?: string;
  avatar_url?: string;
  business_name?: string;
  sound?: string;
  invitation_id?: string;
  join_request_id?: string;
  code?: string;
  customer_name?: string;
  [key: string]: unknown;
}

export interface NotificationAction {
  id: string;
  title: string;
}

export function buildNotificationRoute(payload: PushDataPayload): string | null {
  // The backend may already provide a resolved route. Prefer it so the
  // sender can target a role-specific screen without the client guessing.
  if (typeof payload.route === 'string' && payload.route.length > 0) {
    return payload.route;
  }

  const context =
    payload.context ??
    (payload.app_type === 'buyer'
      ? 'buyer'
      : payload.app_type === 'rider'
        ? 'rider'
        : payload.app_type === 'business'
          ? 'seller'
          : undefined);

  const orderId = payload.order_id;
  const deliveryId = payload.delivery_id;

  if (context === 'buyer') {
    return orderId ? `/track/${orderId}` : null;
  }

  if (context === 'seller') {
    return orderId ? `/orders/${orderId}` : null;
  }

  if (context === 'rider') {
    const id = deliveryId ?? orderId;
    return id ? `/deliveries/${id}` : null;
  }

  return null;
}
