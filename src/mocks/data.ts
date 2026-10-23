/**
 * Sample data for the mock layer.
 *
 * The shapes are the real ones from `@/api/types` so the mock and the real
 * backend stay interchangeable.
 */
import type {
  TravelPlan,
  TravelPlanRequest,
  UserProfile,
} from '@/api/types';

/** Sample routes around Tehran. */
export const MOCK_TRAVEL_PLANS: TravelPlan[] = [
  {
    id: '6b0f1f2c-4a51-4a0e-9f3a-1d2c3b4a5e6f',
    name: 'خانه به دانشگاه',
    isActive: true,
    createdAtUtc: '2026-09-14T08:12:00.000Z',
    days: [
      { dayOfWeek: 6, departureTime: '07:30:00', isEnabled: true },
      { dayOfWeek: 1, departureTime: '07:30:00', isEnabled: true },
      { dayOfWeek: 2, departureTime: '07:30:00', isEnabled: true },
      { dayOfWeek: 3, departureTime: '07:30:00', isEnabled: true },
      { dayOfWeek: 4, departureTime: '07:30:00', isEnabled: true },
    ],
    legs: [
      {
        sequence: 1,
        transportType: 0,
        startPlace: 'میدان آزادی',
        endPlace: 'میدان انقلاب',
        estimatedDurationMinutes: 18,
      },
      {
        sequence: 2,
        transportType: 1,
        startPlace: 'میدان انقلاب',
        endPlace: 'دانشگاه تهران',
        estimatedDurationMinutes: 12,
      },
    ],
  },
  {
    id: '9c1e2d3b-8c4d-4f2a-9b6e-2a3b4c5d6e7f',
    name: 'خانه به محل کار',
    isActive: true,
    createdAtUtc: '2026-09-20T06:45:00.000Z',
    days: [
      { dayOfWeek: 1, departureTime: '08:15:00', isEnabled: true },
      { dayOfWeek: 2, departureTime: '08:15:00', isEnabled: true },
      { dayOfWeek: 3, departureTime: '08:15:00', isEnabled: true },
      { dayOfWeek: 4, departureTime: '08:15:00', isEnabled: true },
      { dayOfWeek: 5, departureTime: '08:15:00', isEnabled: true },
    ],
    legs: [
      {
        sequence: 1,
        transportType: 0,
        startPlace: 'میدان آزادی',
        endPlace: 'میدان هفت‌تیر',
        estimatedDurationMinutes: 22,
      },
      {
        sequence: 2,
        transportType: 2,
        startPlace: 'میدان هفت‌تیر',
        endPlace: 'میدان ونک',
        estimatedDurationMinutes: 15,
      },
      {
        sequence: 3,
        transportType: 3,
        startPlace: 'میدان ونک',
        endPlace: 'برج تجاری یادگار',
        estimatedDurationMinutes: 9,
      },
    ],
  },
  {
    id: 'f2d3c4b5-6a7e-4b8c-9d0f-3c4d5e6f7a8b',
    name: 'آخر هفته',
    isActive: false,
    createdAtUtc: '2026-10-02T11:30:00.000Z',
    days: [
      { dayOfWeek: 5, departureTime: '17:20:00', isEnabled: true },
      { dayOfWeek: 6, departureTime: '10:00:00', isEnabled: true },
    ],
    legs: [
      {
        sequence: 1,
        transportType: 1,
        startPlace: 'میدان ونک',
        endPlace: 'تجریش',
        estimatedDurationMinutes: 38,
      },
      {
        sequence: 2,
        transportType: 0,
        startPlace: 'تجریش',
        endPlace: 'پارک قلهک',
        estimatedDurationMinutes: 24,
      },
    ],
  },
];

/** Profile of the signed in user. */
export const MOCK_USER_PROFILE: UserProfile = {
  firstName: 'مریم',
  lastName: 'رضایی',
  birthDate: '1996-04-12',
  nationalIdNumber: '0012345678',
  address: 'تهران، خیابان شریعتی، کوچه بهار، پلاک ۱۲',
  postalCode: '1619613456',
};

/** Template used when a new route is created in the mock. */
export const MOCK_NEW_PLAN_TEMPLATE: TravelPlanRequest = {
  name: 'مسیر جدید',
  days: [{ dayOfWeek: 6, departureTime: '08:00:00' }],
  legs: [
    {
      sequence: 1,
      transportType: 0,
      startPlace: '',
      endPlace: '',
      estimatedDurationMinutes: 10,
    },
  ],
};
