// [REAL-API] import { apiRequest } from './client';
import type {
  RequestCodeRequest,
  RequestCodeResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
} from './types';
import {
  requestVerificationCode as mockRequestVerificationCode,
  verifyCode as mockVerifyCode,
} from '@/mocks/api'; // [MOCK]

/**
 * `POST /api/auth/request-code` — sends an OTP to the given phone number.
 * No authentication required.
 */
export function requestVerificationCode(
  body: RequestCodeRequest,
  signal?: AbortSignal,
): Promise<RequestCodeResponse> {
  // [REAL-API] return apiRequest<RequestCodeResponse>('/api/auth/request-code', {
  // [REAL-API]   method: 'POST',
  // [REAL-API]   body,
  // [REAL-API]   authenticated: false,
  // [REAL-API]   signal,
  // [REAL-API] });
  return mockRequestVerificationCode(body, signal); // [MOCK]
}

/**
 * `POST /api/auth/verify-code` — exchanges the OTP for a bearer token.
 * No authentication required.
 */
export function verifyCode(
  body: VerifyCodeRequest,
  signal?: AbortSignal,
): Promise<VerifyCodeResponse> {
  // [REAL-API] return apiRequest<VerifyCodeResponse>('/api/auth/verify-code', {
  // [REAL-API]   method: 'POST',
  // [REAL-API]   body,
  // [REAL-API]   authenticated: false,
  // [REAL-API]   signal,
  // [REAL-API] });
  return mockVerifyCode(body, signal); // [MOCK]
}
