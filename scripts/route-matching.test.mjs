import assert from 'node:assert/strict';
import test from 'node:test';
import { distanceMeters, matchesSampleRoute } from '../src/features/trip/route-matching.ts';

const point = (latitude, longitude) => ({ latitude, longitude });
const route = [point(35.7, 51.3), point(35.7, 51.4), point(35.8, 51.4)];
const limits = { candidateRadiusKm: 1, maxExtraMinutes: 12, maxExtraWalkingMeters: 900 };
const offer = {
  pickupCoordinate: point(35.7, 51.35), dropoffCoordinate: point(35.75, 51.4),
  extraMinutes: 9, extraWalkMeters: 750,
};

test('accepts stops along a route including intermediate segments', () => {
  assert.equal(matchesSampleRoute(offer, route, limits), true);
});

test('rejects the reverse direction and a different destination corridor', () => {
  assert.equal(matchesSampleRoute(offer, [...route].reverse(), limits), false);
  assert.equal(matchesSampleRoute(offer, [point(35.7, 51.3), point(35.6, 51.3)], limits), false);
});

test('applies each configured detour limit, including zero', () => {
  assert.equal(matchesSampleRoute(offer, route, { ...limits, maxExtraMinutes: 8 }), false);
  assert.equal(matchesSampleRoute(offer, route, { ...limits, maxExtraWalkingMeters: 749 }), false);
  assert.equal(matchesSampleRoute(offer, route, { ...limits, maxExtraMinutes: 0 }), false);
  assert.equal(matchesSampleRoute(offer, route, { ...limits, maxExtraMinutes: 9, maxExtraWalkingMeters: 750 }), true);
  const distant = { ...offer, pickupCoordinate: point(35.72, 51.35) };
  assert.equal(matchesSampleRoute(distant, route, limits), false);
  assert.equal(matchesSampleRoute(distant, route, { ...limits, candidateRadiusKm: 3 }), true);
});

test('rejects missing or zero-length routes and handles identical coordinates', () => {
  assert.equal(matchesSampleRoute(offer, [], limits), false);
  assert.equal(matchesSampleRoute(offer, [route[0], route[0]], limits), false);
  assert.equal(distanceMeters(route[0], route[0]), 0);
});
