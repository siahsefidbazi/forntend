// [REAL-API] import { apiRequest } from './client';
import type {
  SetTravelPlanStatusRequest,
  TravelPlan,
  TravelPlanRequest,
} from './types';
import {
  createTravelPlan as mockCreateTravelPlan,
  deleteTravelPlan as mockDeleteTravelPlan,
  getTravelPlan as mockGetTravelPlan,
  listTravelPlans as mockListTravelPlans,
  setTravelPlanStatus as mockSetTravelPlanStatus,
  updateTravelPlan as mockUpdateTravelPlan,
} from '@/mocks/api'; // [MOCK]

/** `GET /api/travel-plans` — requires a bearer token. */
export function listTravelPlans(signal?: AbortSignal): Promise<TravelPlan[]> {
  // [REAL-API] return apiRequest<TravelPlan[]>('/api/travel-plans', { signal });
  return mockListTravelPlans(signal); // [MOCK]
}

/** `GET /api/travel-plans/{id}` — requires a bearer token. */
export function getTravelPlan(
  id: string,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  // [REAL-API] return apiRequest<TravelPlan>(`/api/travel-plans/${encodeURIComponent(id)}`, {
  // [REAL-API]   signal,
  // [REAL-API] });
  return mockGetTravelPlan(id, signal); // [MOCK]
}

/** `POST /api/travel-plans` — requires a bearer token. */
export function createTravelPlan(
  body: TravelPlanRequest,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  // [REAL-API] return apiRequest<TravelPlan>('/api/travel-plans', {
  // [REAL-API]   method: 'POST',
  // [REAL-API]   body,
  // [REAL-API]   signal,
  // [REAL-API] });
  return mockCreateTravelPlan(body, signal); // [MOCK]
}

/** `PUT /api/travel-plans/{id}` — requires a bearer token. */
export function updateTravelPlan(
  id: string,
  body: TravelPlanRequest,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  // [REAL-API] return apiRequest<TravelPlan>(`/api/travel-plans/${encodeURIComponent(id)}`, {
  // [REAL-API]   method: 'PUT',
  // [REAL-API]   body,
  // [REAL-API]   signal,
  // [REAL-API] });
  return mockUpdateTravelPlan(id, body, signal); // [MOCK]
}

/** `DELETE /api/travel-plans/{id}` — requires a bearer token. Answers 204. */
export function deleteTravelPlan(
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  // [REAL-API] return apiRequest<void>(`/api/travel-plans/${encodeURIComponent(id)}`, {
  // [REAL-API]   method: 'DELETE',
  // [REAL-API]   signal,
  // [REAL-API] });
  return mockDeleteTravelPlan(id, signal); // [MOCK]
}

/** `PATCH /api/travel-plans/{id}/status` — requires a bearer token. */
export function setTravelPlanStatus(
  id: string,
  body: SetTravelPlanStatusRequest,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  // [REAL-API] return apiRequest<TravelPlan>(`/api/travel-plans/${encodeURIComponent(id)}/status`, {
  // [REAL-API]   method: 'PATCH',
  // [REAL-API]   body,
  // [REAL-API]   signal,
  // [REAL-API] });
  return mockSetTravelPlanStatus(id, body, signal); // [MOCK]
}
