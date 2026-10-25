import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'token';
const PHONE_KEY = 'phone';

function webStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return window.localStorage;
}

async function read(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return webStorage()?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch { return null; }
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    const storage = webStorage();
    if (!storage) throw new Error('ذخیره‌ی نشست در مرورگر در دسترس نیست.');
    storage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function readToken(): Promise<string | null> {
  const token = await read(TOKEN_KEY);
  return token === 'mock-access-token' ? null : token;
}
export function writeToken(token: string): Promise<void> { return write(TOKEN_KEY, token); }
export function readPhone(): Promise<string | null> { return read(PHONE_KEY); }
export function writePhone(phone: string): Promise<void> { return write(PHONE_KEY, phone); }

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    const storage = webStorage();
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(PHONE_KEY);
  } else {
    await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(PHONE_KEY)]);
  }
}
