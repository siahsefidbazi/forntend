import { apiRequest } from './client';
import type {
  CreateUserRequest,
  UserResponse,
} from './types';

/**
 * `POST /api/Users/Login` — registers the authenticated phone number with a
 * full name. Requires a bearer token.
 */
export function createUser(
  body: CreateUserRequest,
  signal?: AbortSignal,
): Promise<UserResponse> {
  return apiRequest<UserResponse>('/api/Users/Login', {
    method: 'POST',
    body,
    signal,
  });
}
