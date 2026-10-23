import type { DetourPreferences } from './types';
import {
  getDetourPreferences as mockGetDetourPreferences,
  updateDetourPreferences as mockUpdateDetourPreferences,
} from '@/mocks/api'; // [MOCK]

/** `GET /api/users/me/detour-preferences`. */
export function getDetourPreferences(signal?: AbortSignal): Promise<DetourPreferences> {
  // [REAL-API] return apiRequest<DetourPreferences>('/api/users/me/detour-preferences', { signal });
  return mockGetDetourPreferences(signal); // [MOCK]
}

/** `PUT /api/users/me/detour-preferences`. */
export function updateDetourPreferences(
  preferences: DetourPreferences,
  signal?: AbortSignal,
): Promise<DetourPreferences> {
  // [REAL-API] return apiRequest<DetourPreferences>('/api/users/me/detour-preferences', { method: 'PUT', body: preferences, signal });
  return mockUpdateDetourPreferences(preferences, signal); // [MOCK]
}