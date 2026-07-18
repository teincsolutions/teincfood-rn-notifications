export const SOUNDS = {
  ORDER_NEW: 'order_new.wav',
  ORDER_STATUS: 'order_status.wav',
  ORDER_ALERT: 'order_alert.wav',
  ORDER_COMPLETE: 'order_complete.wav',
  ORDER_CANCELLED: 'order_cancelled.wav',
  RIDER_PICKUP: 'rider_pickup.wav',
  RIDER_OPPORTUNITY: 'rider_opportunity.wav',
  TIMER_ALERT: 'timer_alert.wav',
  NOTIFICATION_DEFAULT: 'notification_default.wav',
} as const;

const SOUND_MAP: Record<string, string> = {
  order_new: SOUNDS.ORDER_NEW,
  order_status: SOUNDS.ORDER_STATUS,
  order_alert: SOUNDS.ORDER_ALERT,
  order_complete: SOUNDS.ORDER_COMPLETE,
  order_cancelled: SOUNDS.ORDER_CANCELLED,
  rider_pickup: SOUNDS.RIDER_PICKUP,
  rider_opportunity: SOUNDS.RIDER_OPPORTUNITY,
  timer_alert: SOUNDS.TIMER_ALERT,
  notification_default: SOUNDS.NOTIFICATION_DEFAULT,
  default: SOUNDS.NOTIFICATION_DEFAULT,
};

export function getNotificationSound(backendSound?: string): string {
  if (!backendSound) return SOUNDS.NOTIFICATION_DEFAULT;
  return SOUND_MAP[backendSound] || SOUNDS.NOTIFICATION_DEFAULT;
}
