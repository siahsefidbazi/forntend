// [REAL-API] import { apiRequest } from './client';
import type {
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  UserProfile,
} from './types';
import {
  getUserProfile as mockGetUserProfile,
  updateUserProfile as mockUpdateUserProfile,
} from '@/mocks/api'; // [MOCK]

/** `GET /api/users/me/profile` — requires a bearer token. */
export function getUserProfile(signal?: AbortSignal): Promise<UserProfile> {
  // [REAL-API] return apiRequest<UserProfile>('/api/users/me/profile', { signal });
  return mockGetUserProfile(signal); // [MOCK]
}

/** `PUT /api/users/me/profile` — requires a bearer token. */
export function updateUserProfile(
  body: UpdateUserProfileRequest,
  signal?: AbortSignal,
): Promise<UpdateUserProfileResponse> {
  // [REAL-API] return apiRequest<UpdateUserProfileResponse>('/api/users/me/profile', {
  // [REAL-API]   method: 'PUT',
  // [REAL-API]   body,
  // [REAL-API]   signal,
  // [REAL-API] });
  return mockUpdateUserProfile(body, signal); // [MOCK]
}
