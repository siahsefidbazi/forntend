import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { registerHooks } from 'node:module';

const platformURL = 'data:text/javascript,export const Platform = { OS: "web" };';
const secureURL = 'data:text/javascript,export const values=new Map(); export async function getItemAsync(k){return values.get(k)??null} export async function setItemAsync(k,v){values.set(k,v)} export async function deleteItemAsync(k){values.delete(k)}';
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === 'react-native') return { url: platformURL, shortCircuit: true };
  if (specifier === 'expo-secure-store') return { url: secureURL, shortCircuit: true };
  return nextResolve(specifier, context);
} });
const { Platform } = await import('react-native');
const native = await import('expo-secure-store');
const storage = await import('../src/features/auth/storage.ts');
let web;
beforeEach(() => {
  Platform.OS = 'web';
  web = new Map(); native.values.clear();
  global.window = { localStorage: { getItem: key => web.get(key) ?? null,
    setItem: (key, value) => web.set(key, value), removeItem: key => web.delete(key) } };
});

test('a fresh installation has no implicit token and old mock tokens are ignored', async () => {
  assert.equal(await storage.readToken(), null);
  web.set('token', 'mock-access-token');
  assert.equal(await storage.readToken(), null);
});

test('web persists the actual login and clears both token and phone on logout', async () => {
  await storage.writeToken('server-token'); await storage.writePhone('09123456789');
  assert.equal(await storage.readToken(), 'server-token');
  assert.equal(await storage.readPhone(), '09123456789');
  await storage.clearToken();
  assert.equal(await storage.readToken(), null);
  assert.equal(await storage.readPhone(), null);
});

test('native uses SecureStore instead of browser storage', async () => {
  Platform.OS = 'android';
  await storage.writeToken('native-token'); await storage.writePhone('09123456789');
  assert.equal(await storage.readToken(), 'native-token');
  assert.equal(native.values.get('token'), 'native-token');
  assert.equal(web.size, 0);
  await storage.clearToken();
  assert.equal(native.values.size, 0);
});
