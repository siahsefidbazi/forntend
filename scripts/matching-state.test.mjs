import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findTodayPlans,
  hasValidCoordinates,
} from '../src/features/trip/matching-state.ts';

test('findTodayPlans uses the local weekday and excludes inactive or unrelated templates', () => {
  const localFriday = new Date(2026, 9, 23, 12);
  const plans = [
    {
      id: 'today',
      isActive: true,
      days: [{ dayOfWeek: localFriday.getDay(), isEnabled: true }],
      legs: [{}],
    },
    {
      id: 'inactive',
      isActive: false,
      days: [{ dayOfWeek: localFriday.getDay(), isEnabled: true }],
      legs: [{}],
    },
    {
      id: 'another-day',
      isActive: true,
      days: [{ dayOfWeek: (localFriday.getDay() + 1) % 7, isEnabled: true }],
      legs: [{}],
    },
    {
      id: 'disabled-day',
      isActive: true,
      days: [{ dayOfWeek: localFriday.getDay(), isEnabled: false }],
      legs: [{}],
    },
    {
      id: 'empty',
      isActive: true,
      days: [{ dayOfWeek: localFriday.getDay(), isEnabled: true }],
      legs: [],
    },
  ];

  assert.deepEqual(
    findTodayPlans(plans, localFriday).map((plan) => plan.id),
    ['today'],
  );
  assert.deepEqual(
    findTodayPlans(plans.filter((plan) => plan.id !== 'today'), localFriday),
    [],
  );
});

test('a plan is available only within its local calendar day', () => {
  const beforeMidnight = new Date(2026, 9, 25, 23, 59, 59);
  const afterMidnight = new Date(2026, 9, 26, 0, 0, 0);
  const plans = [{ isActive: true, days: [{ dayOfWeek: beforeMidnight.getDay(), isEnabled: true }], legs: [{}] }];
  assert.equal(findTodayPlans(plans, beforeMidnight).length, 1);
  assert.equal(findTodayPlans(plans, afterMidnight).length, 0);
});

test('hasValidCoordinates rejects missing, non-finite, and out-of-range coordinates', () => {
  assert.equal(hasValidCoordinates({ latitude: 35.7, longitude: 51.4 }), true);
  assert.equal(hasValidCoordinates(null), false);
  assert.equal(hasValidCoordinates({ latitude: null, longitude: 51.4 }), false);
  assert.equal(hasValidCoordinates({ latitude: Number.NaN, longitude: 51.4 }), false);
  assert.equal(hasValidCoordinates({ latitude: 91, longitude: 51.4 }), false);
  assert.equal(hasValidCoordinates({ latitude: 35.7, longitude: 181 }), false);
});
