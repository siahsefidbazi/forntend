import { apiRequest } from './client';
import type {
  RequestCodeRequest,
  RequestCodeResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
} from './types';

/**
 * `POST /api/auth/request-code` — sends an OTP to the given phone number.
 * No authentication required.
 */
export function requestVerificationCode(
  body: RequestCodeRequest,
  signal?: AbortSignal,
): Promise<RequestCodeResponse> {
  return apiRequest<RequestCodeResponse>('/api/auth/request-code', {
    method: 'POST',
    body,
    authenticated: false,
    signal,
  });
}

/**
 * `POST /api/auth/verify-code` — exchanges the OTP for a bearer token.
 * No authentication required.
 */
export function verifyCode(
  body: VerifyCodeRequest,
  signal?: AbortSignal,
): Promise<VerifyCodeResponse> {
  return apiRequest<VerifyCodeResponse>('/api/auth/verify-code', {
    method: 'POST',
    body,
    authenticated: false,
    signal,
  });
}
