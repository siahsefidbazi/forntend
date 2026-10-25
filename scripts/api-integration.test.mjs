import './helpers/register-ts-paths.mjs';
import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

const { apiRequest } = await import('../src/api/client.ts');
const { ApiError } = await import('../src/api/errors.ts');
const { setAccessToken, setUnauthorizedHandler } = await import('../src/api/session.ts');
const auth = await import('../src/api/auth.ts');
const plans = await import('../src/api/travelPlans.ts');
const profiles = await import('../src/api/profile.ts');
const users = await import('../src/api/users.ts');
const originalFetch = global.fetch;
let requests;
beforeEach(() => {
  requests = [];
  setAccessToken('test-session-token');
  global.fetch = async (url, options) => {
    requests.push({ url, ...options });
    return Response.json({ ok: true });
  };
});
afterEach(() => { global.fetch = originalFetch; setAccessToken(null); setUnauthorizedHandler(null); });

test('the eleven documented operations use real HTTP with their documented verb and route', async () => {
  const body = { name: 'مسیر', days: [{ dayOfWeek: 0, departureTime: '07:30:00' }], legs: [] };
  const operations = [
    [() => auth.requestVerificationCode({ phoneNumber: '09123456789' }), 'POST', '/api/auth/request-code', false],
    [() => auth.verifyCode({ phoneNumber: '09123456789', code: '081957' }), 'POST', '/api/auth/verify-code', false],
    [() => users.createUser({ fullName: 'نام', phoneNumber: '09123456789' }), 'POST', '/api/Users/Login', true],
    [() => profiles.getUserProfile(), 'GET', '/api/users/me/profile', true],
    [() => profiles.updateUserProfile({ firstName: 'نام' }), 'PUT', '/api/users/me/profile', true],
    [() => plans.listTravelPlans(), 'GET', '/api/travel-plans', true],
    [() => plans.getTravelPlan('plan/1'), 'GET', '/api/travel-plans/plan%2F1', true],
    [() => plans.createTravelPlan(body), 'POST', '/api/travel-plans', true],
    [() => plans.updateTravelPlan('plan/1', body), 'PUT', '/api/travel-plans/plan%2F1', true],
    [() => plans.deleteTravelPlan('plan/1'), 'DELETE', '/api/travel-plans/plan%2F1', true],
    [() => plans.setTravelPlanStatus('plan/1', { isActive: false }), 'PATCH', '/api/travel-plans/plan%2F1/status', true],
  ];
  for (const [run, method, route, authenticated] of operations) {
    await run();
    const actual = requests.at(-1);
    assert.equal(actual.url, `https://localhost:7220${route}`);
    assert.equal(actual.method, method);
    assert.equal(actual.headers.Authorization, authenticated ? 'Bearer test-session-token' : undefined);
    if (method !== 'GET' && method !== 'DELETE') assert.equal(actual.headers['Content-Type'], 'application/json');
  }
  assert.equal(JSON.parse(requests[1].body).code, '081957');
  assert.equal(JSON.parse(requests[7].body).days[0].departureTime, '07:30:00');
});

test('empty PUT/PATCH responses reload the saved plan, while DELETE accepts 204', async () => {
  global.fetch = async (url, options) => {
    requests.push({ url, ...options });
    return options.method === 'GET' ? Response.json({ id: 'saved', isActive: false }) : new Response(null, { status: options.method === 'DELETE' ? 204 : 200 });
  };
  assert.equal((await plans.updateTravelPlan('saved', {})).id, 'saved');
  assert.equal((await plans.setTravelPlanStatus('saved', { isActive: false })).isActive, false);
  assert.equal(await plans.deleteTravelPlan('saved'), undefined);
  assert.deepEqual(requests.map(item => item.method), ['PUT', 'GET', 'PATCH', 'GET', 'DELETE']);
});

test('validation and not-found errors remain errors and never fall back to mock', async () => {
  global.fetch = async () => Response.json({ title: 'Validation failed', errors: { departureTime: ['TimeOnly required'] } }, { status: 400 });
  await assert.rejects(plans.createTravelPlan({}), error => error instanceof ApiError && error.kind === 'validation' && error.fieldErrors.departureTime[0] === 'TimeOnly required');
  global.fetch = async () => new Response('Not Found', { status: 404 });
  await assert.rejects(plans.getTravelPlan('missing'), error => error.kind === 'not-found');
});

test('only 401s belonging to the active authenticated session expire it', async () => {
  let expired = 0;
  setUnauthorizedHandler(() => expired++);
  global.fetch = async () => new Response(null, { status: 401 });
  await assert.rejects(auth.verifyCode({ phoneNumber: '09123456789', code: '000000' }));
  assert.equal(expired, 0);
  await assert.rejects(plans.listTravelPlans());
  assert.equal(expired, 1);
  global.fetch = async () => { setAccessToken('new-session-token'); return new Response(null, { status: 401 }); };
  await assert.rejects(plans.listTravelPlans());
  assert.equal(expired, 1);
});

test('cancellation, timeouts while reading the body, and invalid JSON are reported accurately', async () => {
  const caller = new AbortController(); caller.abort();
  await assert.rejects(apiRequest('/api/travel-plans', { signal: caller.signal }), error => error.kind === 'cancelled');
  assert.equal(requests.length, 0);
  global.fetch = async (_url, { signal }) => ({ status: 200, ok: true,
    text: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))) });
  await assert.rejects(apiRequest('/api/travel-plans', { timeoutMs: 10 }), error => error.kind === 'timeout');
  global.fetch = async () => new Response('not JSON');
  await assert.rejects(plans.listTravelPlans(), error => error.kind === 'server');
});

test('undocumented features stay in memory and do not issue HTTP requests', async () => {
  const orders = await import('../src/api/orders.ts');
  const limits = await import('../src/api/detourPreferences.ts');
  const support = await import('../src/api/support.ts');
  const deliveries = await import('../src/api/deliveries.ts');
  const matches = await import('../src/api/matches.ts');
  global.fetch = async () => { throw new Error('undocumented endpoint was called'); };
  const [list, preferences, tickets, assigned] = await Promise.all([
    orders.listParcelOrders(), limits.getDetourPreferences(), support.listSupportTickets(), deliveries.listMyDeliveries(),
  ]);
  assert.ok(Array.isArray(list) && Array.isArray(tickets) && Array.isArray(assigned));
  assert.equal(typeof preferences.maxExtraMinutes, 'number');
  const accepted = await matches.acceptMatch('match-123', { mode: 'weekly_schedule', travelPlanId: 'real-server-plan', legSequence: 1 });
  assert.equal(accepted.status, 'Assigned');
});
