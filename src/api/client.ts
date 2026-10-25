// [REAL-API] import { API_BASE_URL, API_TIMEOUT_MS } from './config';
import { ApiError, kindForStatus } from './errors';
// [REAL-API] import { getAccessToken, notifyUnauthorized } from './session';
// [REAL-API] import type { ProblemDetails } from './types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Adds the `Authorization: Bearer <token>` header. Defaults to `true`. */
  authenticated?: boolean;
  /** Aborts the request when the screen unmounts or the query becomes stale. */
  signal?: AbortSignal;
  timeoutMs?: number;
};

/* [REAL-API]
function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  if (!query) {
    return url;
  }

  const search = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');

  return search ? `${url}?${search}` : url;
}

async function readProblem(response: Response): Promise<ProblemDetails | undefined> {
  try {
    const text = await response.text();
    if (!text) {
      return undefined;
    }

    return JSON.parse(text) as ProblemDetails;
  } catch {
    return undefined;
  }
}
*/

/**
 * Thin `fetch` wrapper that speaks the HamMasir API conventions:
 * bearer authentication, RFC 7807 problem details, request timeouts and
 * cancellation.
 *
 * [MOCK] The real transport is disabled while the backend is not ready. The
 * API modules delegate to `src/mocks/api` instead — see `MOCKS.md`.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  /* [REAL-API]
  const {
    method = 'GET',
    body,
    query,
    authenticated = true,
    signal,
    timeoutMs = API_TIMEOUT_MS,
  } = options;

  const controller = new AbortController();
  let timedOut = false;

  const abortFromCaller = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', abortFromCaller);
    }
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (authenticated) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw new ApiError('پاسخی از سرور دریافت نشد.', 'timeout');
    }
    if (controller.signal.aborted) {
      throw new ApiError('درخواست لغو شد.', 'cancelled');
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'ارتباط با سرور برقرار نشد.',
      'network',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }

  if (response.status === 401) {
    notifyUnauthorized();
    throw new ApiError('نشست شما منقضی شده است.', 'unauthorized', 401);
  }

  if (!response.ok) {
    const problem = await readProblem(response);
    throw new ApiError(
      problem?.title ?? 'درخواست با خطا مواجه شد.',
      kindForStatus(response.status),
      response.status,
      problem,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('پاسخ سرور قابل خواندن نبود.', 'server', response.status);
  }
  */

  throw new ApiError(
    `سرویس واقعی غیرفعال است (${path}). برنامه در حالت نمایشی اجرا می‌شود.`,
    kindForStatus(503),
    503,
  );
}
