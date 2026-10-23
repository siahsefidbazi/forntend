import type { AcceptMatchResponse, MatchAcceptanceRequest } from './types';
import { acceptMatch as mockAcceptMatch } from '@/mocks/api'; // [MOCK]

/** `POST /api/matches/{id}/accept` — acceptance must be atomic on the server. */
export function acceptMatch(
  id: string,
  body: MatchAcceptanceRequest,
  signal?: AbortSignal,
): Promise<AcceptMatchResponse> {
  // [REAL-API] return apiRequest<AcceptMatchResponse>(`/api/matches/${encodeURIComponent(id)}/accept`, { method: 'POST', body, signal });
  return mockAcceptMatch(id, body, signal); // [MOCK]
}