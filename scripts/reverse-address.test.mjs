import assert from 'node:assert/strict';
import test from 'node:test';
import { formatMapAddress, reverseMapAddress } from '../src/features/trip/reverse-address.ts';

test('formats a readable Persian street address without duplicate areas', () => {
  assert.equal(formatMapAddress({ city: 'تهران', suburb: 'یوسف‌آباد', road: 'اسدآبادی', house_number: '۱۲' }), 'تهران، یوسف‌آباد، اسدآبادی، پلاک ۱۲');
  assert.equal(formatMapAddress({ city: 'تهران', suburb: 'تهران' }), 'تهران');
  assert.equal(formatMapAddress({}, 'آدرس کامل'), 'آدرس کامل');
});

test('looks up the actual coordinate in Persian and caches repeated selections', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url) => {
    calls.push(new URL(url));
    return { ok: true, json: async () => ({ address: { city: 'تهران', road: 'ولیعصر' } }) };
  };
  try {
    const signal = new AbortController().signal;
    assert.equal(await reverseMapAddress(35.7115, 51.407, signal), 'تهران، ولیعصر');
    assert.equal(await reverseMapAddress(35.7115, 51.407, signal), 'تهران، ولیعصر');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].searchParams.get('lat'), '35.7115');
    assert.equal(calls[0].searchParams.get('accept-language'), 'fa');
  } finally { global.fetch = original; }
});

test('does not send an already cancelled selection to the provider', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(reverseMapAddress(35.8, 51.3, controller.signal));
});
