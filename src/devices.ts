import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import type { AppType, TokenRegistrationPayload } from './types';

const APP_INSTANCE_ID_KEY = '@teincfood/rn-notifications/app_instance_id';

let cachedInstanceId: string | null = null;

function generateAppInstanceId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export function setAppInstanceId(id: string): void {
  cachedInstanceId = id;
}

export function getAppInstanceId(): string {
  if (cachedInstanceId) return cachedInstanceId;
  cachedInstanceId = generateAppInstanceId();
  return cachedInstanceId;
}

export function buildTokenRegistrationPayload(
  token: string,
  appType: AppType,
): TokenRegistrationPayload {
  return {
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    provider: 'fcm',
    app_instance_id: getAppInstanceId(),
    app_type: appType,
  };
}
