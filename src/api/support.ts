import type { CreateSupportTicketRequest, SupportTicketResponse } from './types';
import {
  createSupportTicket as mockCreateSupportTicket,
  listSupportTickets as mockListSupportTickets,
} from '@/mocks/api'; // [MOCK]

/** `GET /api/support/tickets/mine` — lists tickets for the current user. */
export function listSupportTickets(signal?: AbortSignal): Promise<SupportTicketResponse[]> {
  // [REAL-API] return apiRequest<SupportTicketResponse[]>('/api/support/tickets/mine', { signal });
  return mockListSupportTickets(signal); // [MOCK]
}

/** `POST /api/support/tickets` — creates a support request. */
export function createSupportTicket(
  body: CreateSupportTicketRequest,
  signal?: AbortSignal,
): Promise<SupportTicketResponse> {
  // [REAL-API] return apiRequest<SupportTicketResponse>('/api/support/tickets', { method: 'POST', body, signal });
  return mockCreateSupportTicket(body, signal); // [MOCK]
}
