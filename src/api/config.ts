/**
 * Runtime configuration for the HamMasir backend.
 *
 * The Swagger document shipped with the project targets `https://localhost:7220`.
 * A physical device cannot reach the loopback interface of the development
 * machine, so the base URL is configurable through the environment.
 */
const DEFAULT_API_BASE_URL = 'https://localhost:7220';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

const configuredTimeout = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? 20000);
export const API_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 20000;
