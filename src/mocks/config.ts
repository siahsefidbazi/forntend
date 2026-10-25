/**
 * Configuration of the mock layer.
 *
 * Only APIs absent from swagger_final.pdf use this layer: parcel orders,
 * deliveries, matching, detour preferences and support.
 */

export const MOCK_DELAY_MS = 400;

function createAbortError(): Error {
  try {
    return new DOMException('Aborted', 'AbortError');
  } catch {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    return error;
  }
}

/** Waits for the given amount of time, rejecting when the signal is aborted. */
export const wait = (ms = MOCK_DELAY_MS, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(createAbortError());
    });
  });

/** Structured copy of plain data so callers can never mutate the source. */
export function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
