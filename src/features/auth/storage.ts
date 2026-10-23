// [REAL-API] import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure persistence for the session.
 *
 * The `token` key is the one already used by the application entry point, so
 * the existing login/OTP flow keeps working with the same storage contract.
 *
 * [MOCK] While the backend is not ready the session is kept in memory and the
 * app starts in the signed-in state — see `MOCKS.md`.
 */
const TOKEN_KEY = 'token';
const PHONE_KEY = 'phone';

/** [MOCK] In-memory session used while the real storage is disabled. */
const MOCK_TOKEN = 'mock-access-token';
const MOCK_PHONE = '09121234567';

let mockToken: string | null = MOCK_TOKEN;
let mockPhone: string | null = MOCK_PHONE;

function webStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export async function readToken(): Promise<string | null> {
  /* [REAL-API]
  const storage = webStorage();
  if (storage) {
    return storage.getItem(TOKEN_KEY);
  }

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
  */
  return mockToken; // [MOCK]
}

export async function writeToken(token: string): Promise<void> {
  /* [REAL-API]
  const storage = webStorage();
  if (storage) {
    storage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
  */
  mockToken = token; // [MOCK]
}

export async function clearToken(): Promise<void> {
  /* [REAL-API]
  const storage = webStorage();
  if (storage) {
    storage.removeItem(TOKEN_KEY);
    return;
  }

  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nothing to remove.
  }
  */
  mockToken = null; // [MOCK]
}

export async function readPhone(): Promise<string | null> {
  /* [REAL-API]
  const storage = webStorage();
  if (storage) {
    return storage.getItem(PHONE_KEY);
  }

  try {
    return await SecureStore.getItemAsync(PHONE_KEY);
  } catch {
    return null;
  }
  */
  return mockPhone; // [MOCK]
}

export async function writePhone(phone: string): Promise<void> {
  /* [REAL-API]
  const storage = webStorage();
  if (storage) {
    storage.setItem(PHONE_KEY, phone);
    return;
  }

  try {
    await SecureStore.setItemAsync(PHONE_KEY, phone);
  } catch {
    // The phone number is a convenience only.
  }
  */
  mockPhone = phone; // [MOCK]
}
