/**
 * In-memory session holder shared between the API client and the auth layer.
 *
 * The token is kept in memory for the lifetime of the app and mirrored into
 * `expo-secure-store` by the auth provider. It is never logged.
 */

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Registers the callback invoked when the backend answers with HTTP 401. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  unauthorizedHandler?.();
}
