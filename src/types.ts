export type AppType = 'buyer' | 'business' | 'admin';

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  action_dismissed: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UnreadCount {
  count: number;
}

export interface PushDataPayload {
  type: string;
  order_id?: string;
  delivery_id?: string;
  conversation_id?: string;
  context?: 'buyer' | 'seller' | 'rider';
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
  if (payload.context === 'buyer') {
    return payload.order_id ? `/track/${payload.order_id}` : null;
  }
  if (payload.context === 'seller') {
    return payload.order_id ? `/order/${payload.order_id}` : null;
  }
  if (payload.context === 'rider') {
    return payload.delivery_id ? `/deliveries/${payload.delivery_id}` : null;
  }
  return null;
}
