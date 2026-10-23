// [REAL-API] import { apiRequest } from './client';
import type {
  CreateUserRequest,
  UserResponse,
} from './types';
import { createUser as mockCreateUser } from '@/mocks/api'; // [MOCK]

/**
 * `POST /api/Users/Login` — registers the authenticated phone number with a
 * full name. Requires a bearer token.
 */
export function createUser(
  body: CreateUserRequest,
  signal?: AbortSignal,
): Promise<UserResponse> {
  // [REAL-API] return apiRequest<UserResponse>('/api/Users/Login', {
  // [REAL-API]   method: 'POST',
  // [REAL-API]   body,
  // [REAL-API]   signal,
  // [REAL-API] });
  return mockCreateUser(body, signal); // [MOCK]
}
