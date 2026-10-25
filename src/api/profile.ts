import { apiRequest } from './client';
import type {
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  UserProfile,
} from './types';

/** `GET /api/users/me/profile` — requires a bearer token. */
export function getUserProfile(signal?: AbortSignal): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/users/me/profile', { signal });
}

/** `PUT /api/users/me/profile` — requires a bearer token. */
export function updateUserProfile(
  body: UpdateUserProfileRequest,
  signal?: AbortSignal,
): Promise<UpdateUserProfileResponse> {
  return apiRequest<UpdateUserProfileResponse>('/api/users/me/profile', {
    method: 'PUT',
    body,
    signal,
  });
}
