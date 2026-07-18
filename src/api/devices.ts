import type { HttpClient } from '../http';
import type { TokenRegistrationPayload } from '../types';

export interface DevicesApi {
  registerPushToken(payload: TokenRegistrationPayload): Promise<void>;
  unregisterPushToken(tokenId: string): Promise<void>;
}

export function createDevicesApi(http: HttpClient): DevicesApi {
  return {
    registerPushToken(payload: TokenRegistrationPayload): Promise<void> {
      return http.post('/devices/push-token', payload);
    },

    unregisterPushToken(tokenId: string): Promise<void> {
      return http.delete(`/devices/push-token/${tokenId}`);
    },
  };
}
