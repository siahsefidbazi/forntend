import type { MyDelivery } from './types';
import { listMyDeliveries as mockListMyDeliveries } from '@/mocks/api'; // [MOCK]

/** `GET /api/deliveries/mine` — returns deliveries assigned to the current commuter. */
export function listMyDeliveries(signal?: AbortSignal): Promise<MyDelivery[]> {
  // [REAL-API] return apiRequest<MyDelivery[]>('/api/deliveries/mine', { signal });
  return mockListMyDeliveries(signal); // [MOCK]
}
