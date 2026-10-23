import type { ProblemDetails } from './types';

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'server'
  | 'unknown';

/** Normalised transport/application error raised by the API layer. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly problem?: ProblemDetails;

  constructor(
    message: string,
    kind: ApiErrorKind,
    status = 0,
    problem?: ProblemDetails,
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.problem = problem;
  }

  /** Field level validation messages coming from the `errors` dictionary. */
  get fieldErrors(): Record<string, string[]> {
    return this.problem?.errors ?? {};
  }
}

const KIND_MESSAGES: Record<ApiErrorKind, string> = {
  network: 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.',
  timeout: 'پاسخی از سرور دریافت نشد. کمی بعد دوباره تلاش کنید.',
  cancelled: 'درخواست لغو شد.',
  unauthorized: 'نشست شما منقضی شده است. دوباره وارد شوید.',
  forbidden: 'اجازه انجام این عملیات را ندارید.',
  'not-found': 'اطلاعات مورد نظر پیدا نشد.',
  validation: 'اطلاعات ارسالی معتبر نیست.',
  server: 'خطایی در سرور رخ داد. بعداً دوباره تلاش کنید.',
  unknown: 'خطای ناشناخته‌ای رخ داد.',
};

/** Human readable Persian message for any error thrown by the app. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldMessage = Object.values(error.fieldErrors).flat().join(' ');
    if (fieldMessage) {
      return fieldMessage;
    }

    if (error.problem?.detail) {
      return error.problem.detail;
    }

    if (error.kind === 'validation' && error.problem?.title) {
      return error.problem.title;
    }

    return KIND_MESSAGES[error.kind];
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return KIND_MESSAGES.unknown;
}

/** Maps an HTTP status code to the matching {@link ApiErrorKind}. */
export function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 400 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}
