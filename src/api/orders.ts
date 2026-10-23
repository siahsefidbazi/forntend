import type { CreateParcelOrderRequest, ParcelOrderResponse } from './types';
import {
  createParcelOrder as mockCreateParcelOrder,
  listParcelOrders as mockListParcelOrders,
} from '@/mocks/api'; // [MOCK]

/** `GET /api/orders/mine` — requires an authenticated sender. */
export function listParcelOrders(signal?: AbortSignal): Promise<ParcelOrderResponse[]> {
  // [REAL-API] return apiRequest<ParcelOrderResponse[]>('/api/orders/mine', { signal });
  return mockListParcelOrders(signal); // [MOCK]
}

/** `POST /api/orders` — server validates and persists the order. */
export function createParcelOrder(
  body: CreateParcelOrderRequest,
  signal?: AbortSignal,
): Promise<ParcelOrderResponse> {
  // [REAL-API] return apiRequest<ParcelOrderResponse>('/api/orders', { method: 'POST', body, signal });
  return mockCreateParcelOrder(body, signal); // [MOCK]
}