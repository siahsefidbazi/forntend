import { apiRequest } from './client';
import type {
  SetTravelPlanStatusRequest,
  TravelPlan,
  TravelPlanRequest,
} from './types';

/** `GET /api/travel-plans` — requires a bearer token. */
export function listTravelPlans(signal?: AbortSignal): Promise<TravelPlan[]> {
  return apiRequest<TravelPlan[]>('/api/travel-plans', { signal });
}

/** `GET /api/travel-plans/{id}` — requires a bearer token. */
export function getTravelPlan(
  id: string,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  return apiRequest<TravelPlan>(`/api/travel-plans/${encodeURIComponent(id)}`, {
    signal,
  });
}

/** `POST /api/travel-plans` — requires a bearer token. */
export function createTravelPlan(
  body: TravelPlanRequest,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  return apiRequest<TravelPlan>('/api/travel-plans', {
    method: 'POST',
    body,
    signal,
  });
}

/** `PUT /api/travel-plans/{id}` — requires a bearer token. */
export async function updateTravelPlan(
  id: string,
  body: TravelPlanRequest,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  const updated = await apiRequest<TravelPlan | undefined>(`/api/travel-plans/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
    signal,
  });
  return updated ?? getTravelPlan(id, signal);
}

/** `DELETE /api/travel-plans/{id}` — requires a bearer token. Answers 204. */
export function deleteTravelPlan(
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  return apiRequest<void>(`/api/travel-plans/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    signal,
  });
}

/** `PATCH /api/travel-plans/{id}/status` — requires a bearer token. */
export async function setTravelPlanStatus(
  id: string,
  body: SetTravelPlanStatusRequest,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  const updated = await apiRequest<TravelPlan | undefined>(`/api/travel-plans/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body,
    signal,
  });
  return updated ?? getTravelPlan(id, signal);
}
