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

function contextForAppType(
  appType: string | undefined,
): 'buyer' | 'seller' | 'rider' | undefined {
  if (appType === 'buyer') return 'buyer';
  if (appType === 'rider') return 'rider';
  if (appType === 'business') return 'seller';
  return undefined;
}

/**
 * Resolve the screen a notification should open.
 *
 * `fallbackAppType` matters because many backend notifications (order
 * cancellations, pickups, invitations, billing) do not carry `app_type`.
 * The host app knows which audience it is, so it passes that in; otherwise
 * those notifications would silently do nothing when tapped.
 */
export function buildNotificationRoute(
  payload: PushDataPayload,
  fallbackAppType?: string,
): string | null {
  // The backend may already provide a resolved route. Prefer it so the
  // sender can target a role-specific screen without the client guessing.
  if (typeof payload.route === 'string' && payload.route.length > 0) {
    return payload.route;
  }

  const context =
    payload.context ?? contextForAppType(payload.app_type ?? fallbackAppType);

  const category = String(payload.notification_category ?? '');
  const type = String(payload.type ?? '');
  const orderId = payload.order_id;
  const deliveryId = payload.delivery_id;

  // Invitations and join requests have their own screens; they are not
  // order/delivery notifications even when they mention a business.
  const isInvitation =
    Boolean(payload.invitation_id) ||
    Boolean(payload.code) ||
    category.includes('invitation') ||
    type.includes('invitation');

  if (isInvitation && (context === 'seller' || context === 'rider')) {
    return '/(shared)/invitations';
  }

  const isJoinRequest =
    Boolean(payload.join_request_id) || category === 'rider_join_request';

  if (isJoinRequest) {
    if (context === 'seller') return '/(fleet)/riders';
    if (context === 'rider') return '/(rider)/home';
  }

  // Chat opens the messages inbox. A conversation-specific route is only
  // available on platforms that support opening an existing conversation.
  if (payload.conversation_id && (context === 'seller' || context === 'rider')) {
    return '/(communication)';
  }

  if (type === 'kyc_expired') {
    if (context === 'seller' || context === 'rider') return '/(shared)/kyc';
    if (context === 'buyer') return '/profile';
  }

  // Subscription/billing notices have an invoice id but no order. Refunds
  // keep their order_id and fall through to the order screen instead.
  if (payload.invoice_id || type === 'subscription_payment_due') {
    if (context === 'seller' || context === 'rider') return '/(shared)/wallet';
    if (context === 'buyer') return '/profile/payments';
  }

  if (context === 'buyer') {
    return orderId ? `/track/${orderId}` : null;
  }

  if (context === 'seller') {
    if (orderId) return `/orders/${orderId}`;
    if (deliveryId) return `/deliveries/${deliveryId}`;
    return null;
  }

  if (context === 'rider') {
    if (deliveryId) return `/deliveries/${deliveryId}`;
    // Delivery opportunities have an order id but no delivery until the
    // rider claims it. Send them to the available-jobs screen, not to a
    // delivery detail URL that does not exist yet.
    if (orderId) return '/(rider)/home';
    return null;
  }

  return null;
}
