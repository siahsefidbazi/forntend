import { API_BASE_URL, API_TIMEOUT_MS } from './config';
import { ApiError, kindForStatus } from './errors';
import { getAccessToken, notifyUnauthorized } from './session';
import type { ProblemDetails } from './types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  authenticated?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

function buildUrl(path: string, query?: ApiRequestOptions['query']): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const search = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return search ? `${url}?${search}` : url;
}

/** Real transport for the endpoints documented in swagger_final.pdf. */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, authenticated = true, signal, timeoutMs = API_TIMEOUT_MS } = options;
  const controller = new AbortController();
  let timedOut = false;
  const token = authenticated ? getAccessToken() : null;
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) throw new ApiError('درخواست لغو شد.', 'cancelled');
  signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(buildUrl(path, query), {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
    });
    // An old request must not sign out a newer session; OTP failures do not expire a session.
    if (response.status === 401) {
      if (authenticated && token === getAccessToken()) notifyUnauthorized();
      throw new ApiError('نشست شما منقضی شده است.', 'unauthorized', 401);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    let value: unknown;
    try { value = text ? JSON.parse(text) : undefined; }
    catch {
      if (response.ok) throw new ApiError('پاسخ سرور قابل خواندن نبود.', 'server', response.status);
    }
    if (!response.ok) {
      const problem = value && typeof value === 'object' ? value as ProblemDetails : undefined;
      throw new ApiError(problem?.title ?? 'درخواست با خطا مواجه شد.', kindForStatus(response.status), response.status, problem);
    }
    return value as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError('پاسخی از سرور دریافت نشد.', 'timeout');
    if (controller.signal.aborted) throw new ApiError('درخواست لغو شد.', 'cancelled');
    throw new ApiError(error instanceof Error ? error.message : 'ارتباط با سرور برقرار نشد.', 'network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
