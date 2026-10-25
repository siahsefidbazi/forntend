/**
 * Mock implementation of the backend.
 *
 * Every function mirrors the signature and the return type of its counterpart
 * in `src/api/*`, so the API modules can delegate to it without touching the
 * screens. Data is kept in memory for the lifetime of the session: created,
 * updated or deleted routes are visible in the next list call.
 */
import { ApiError } from '@/api/errors';
import type {
  AcceptMatchResponse,
  MatchAcceptanceRequest,
  CreateSupportTicketRequest,
  CreateParcelOrderRequest,
  DetourPreferences,
  MyDelivery,
  ParcelOrderResponse,
  CreateUserRequest,
  RequestCodeRequest,
  RequestCodeResponse,
  SetTravelPlanStatusRequest,
  TravelPlan,
  TravelPlanRequest,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  UserProfile,
  UserResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  SupportTicketResponse,
} from '@/api/types';

import { MOCK_DELAY_MS, deepCopy, wait } from './config';
import {
  MOCK_TRAVEL_PLANS,
  MOCK_USER_PROFILE,
} from './data';
import { MOCK_DASHBOARD } from '@/features/dashboard/mock';

/** In-memory state of the mocked service. */
let travelPlans: TravelPlan[] = deepCopy(MOCK_TRAVEL_PLANS);
let userProfile: UserProfile = deepCopy(MOCK_USER_PROFILE);
const acceptedMatches = new Map<string, MatchAcceptanceRequest>();
let parcelOrders: ParcelOrderResponse[] = [];
let supportTickets: SupportTicketResponse[] = [];
let detourPreferences: DetourPreferences = {
  candidateRadiusKm: 5,
  maxExtraMinutes: 12,
  maxExtraWalkingMeters: 900,
};

let idCounter = 0;
function createId(): string {
  idCounter += 1;
  return `mock-${Date.now().toString(36)}-${idCounter}`;
}

/** Restores the sample data (useful when the mock is reloaded). */
export function resetMockData(): void {
  travelPlans = deepCopy(MOCK_TRAVEL_PLANS);
  userProfile = deepCopy(MOCK_USER_PROFILE);
  acceptedMatches.clear();
  parcelOrders = [];
  supportTickets = [];
  detourPreferences = {
    candidateRadiusKm: 5,
    maxExtraMinutes: 12,
    maxExtraWalkingMeters: 900,
  };
}

export async function getDetourPreferences(
  signal?: AbortSignal,
): Promise<DetourPreferences> {
  await wait(MOCK_DELAY_MS, signal);
  return deepCopy(detourPreferences);
}

export async function updateDetourPreferences(
  preferences: DetourPreferences,
  signal?: AbortSignal,
): Promise<DetourPreferences> {
  await wait(MOCK_DELAY_MS, signal);
  if (
    !Number.isFinite(preferences.candidateRadiusKm) ||
    preferences.candidateRadiusKm < 1 ||
    preferences.candidateRadiusKm > 5 ||
    !Number.isInteger(preferences.maxExtraMinutes) ||
    preferences.maxExtraMinutes < 0 ||
    preferences.maxExtraMinutes > 60 ||
    !Number.isInteger(preferences.maxExtraWalkingMeters) ||
    preferences.maxExtraWalkingMeters < 0 ||
    preferences.maxExtraWalkingMeters > 3000
  ) {
    throw new ApiError('محدودیت‌های انحراف معتبر نیستند.', 'validation', 400);
  }
  detourPreferences = deepCopy(preferences);
  return deepCopy(detourPreferences);
}

export async function listParcelOrders(
  signal?: AbortSignal,
): Promise<ParcelOrderResponse[]> {
  await wait(MOCK_DELAY_MS, signal);
  return deepCopy(parcelOrders);
}

export async function createParcelOrder(
  body: CreateParcelOrderRequest,
  signal?: AbortSignal,
): Promise<ParcelOrderResponse> {
  await wait(MOCK_DELAY_MS, signal);

  if (
    !body.origin.title.trim() ||
    !body.destination.title.trim() ||
    !body.parcelDescription.trim() ||
    !Number.isFinite(body.weightGrams) ||
    body.weightGrams <= 0 ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.deliverByLocalTime)
  ) {
    throw new ApiError('اطلاعات سفارش معتبر نیست.', 'validation', 400);
  }

  const order: ParcelOrderResponse = {
    ...deepCopy(body),
    id: createId(),
    status: 'Open',
    createdAtUtc: new Date().toISOString(),
  };
  parcelOrders = [order, ...parcelOrders];
  return deepCopy(order);
}

export async function acceptMatch(
  id: string,
  acceptance: MatchAcceptanceRequest,
  signal?: AbortSignal,
): Promise<AcceptMatchResponse> {
  await wait(MOCK_DELAY_MS, signal);

  const exists = MOCK_DASHBOARD.offers.some((offer) => offer.id === id);
  if (!exists) {
    throw new ApiError('پیشنهاد مورد نظر پیدا نشد.', 'not-found', 404);
  }
  if (acceptedMatches.has(id)) {
    throw new ApiError('این پیشنهاد قبلاً پذیرفته شده است.', 'unknown', 409);
  }

  if (acceptance.mode === 'weekly_schedule') {
    // Real travel plans are no longer held in the mock store. Acceptance itself
    // stays a simulation until a matching endpoint is documented.
    if (!acceptance.travelPlanId.trim() || !Number.isInteger(acceptance.legSequence) || acceptance.legSequence < 1) {
      throw new ApiError('برنامه یا قطعه‌ی انتخاب‌شده معتبر نیست.', 'validation', 400);
    }
  } else if (
    !acceptance.origin.title.trim() ||
    !acceptance.destination.title.trim() ||
    !Number.isFinite(acceptance.origin.latitude) ||
    !Number.isFinite(acceptance.origin.longitude) ||
    !Number.isFinite(acceptance.destination.latitude) ||
    !Number.isFinite(acceptance.destination.longitude)
  ) {
    throw new ApiError('مبدأ و مقصد مسیر دلخواه معتبر نیستند.', 'validation', 400);
  }

  acceptedMatches.set(id, deepCopy(acceptance));
  return {
    matchId: id,
    deliveryId: `mock-delivery-${id}`,
    status: 'Assigned',
    acceptance: deepCopy(acceptance),
    assignedAtUtc: new Date().toISOString(),
  };
}

export async function listMyDeliveries(signal?: AbortSignal): Promise<MyDelivery[]> {
  await wait(MOCK_DELAY_MS, signal);
  return [...acceptedMatches.entries()].flatMap(([matchId, acceptance]) => {
    const offer = MOCK_DASHBOARD.offers.find((item) => item.id === matchId);
    if (!offer) return [];
    return [{
      id: `mock-delivery-${matchId}`,
      matchId,
      parcel: offer.parcel,
      sender: offer.sender,
      pickupStop: offer.pickupStop,
      dropoffStop: offer.dropoffStop,
      extraMinutes: offer.extraMinutes,
      extraWalkMeters: offer.extraWalkMeters,
      payoutToman: offer.priceToman,
      acceptanceMode: acceptance.mode,
      status: 'Assigned' as const,
      assignedAtUtc: new Date().toISOString(),
    }];
  });
}

export async function listSupportTickets(signal?: AbortSignal): Promise<SupportTicketResponse[]> {
  await wait(MOCK_DELAY_MS, signal);
  return deepCopy(supportTickets);
}

export async function createSupportTicket(
  body: CreateSupportTicketRequest,
  signal?: AbortSignal,
): Promise<SupportTicketResponse> {
  await wait(MOCK_DELAY_MS, signal);
  if (body.message.trim().length < 10) {
    throw new ApiError('توضیح مشکل باید حداقل ۱۰ نویسه باشد.', 'validation', 400);
  }
  const ticket: SupportTicketResponse = {
    ...deepCopy(body),
    id: createId(),
    status: 'Received',
    createdAtUtc: new Date().toISOString(),
  };
  supportTickets = [ticket, ...supportTickets];
  return deepCopy(ticket);
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export async function requestVerificationCode(
  body: RequestCodeRequest,
  signal?: AbortSignal,
): Promise<RequestCodeResponse> {
  await wait(MOCK_DELAY_MS, signal);

  return {
    message: `کد تایید برای ${body.phoneNumber} ارسال شد.`,
    developmentCode: '12345',
  };
}

export async function verifyCode(
  body: VerifyCodeRequest,
  signal?: AbortSignal,
): Promise<VerifyCodeResponse> {
  await wait(MOCK_DELAY_MS, signal);

  if (!body.code.trim()) {
    throw new ApiError('کد تایید را وارد کنید.', 'validation', 400);
  }

  return {
    accessToken: 'mock-access-token',
    tokenType: 'Bearer',
    expiresInMinutes: 30,
  };
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

export async function createUser(
  body: CreateUserRequest,
  signal?: AbortSignal,
): Promise<UserResponse> {
  await wait(MOCK_DELAY_MS, signal);

  return {
    id: createId(),
    fullName: body.fullName.trim(),
    phoneNumber: body.phoneNumber,
    createdAtUtc: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* User profile                                                               */
/* -------------------------------------------------------------------------- */

export async function getUserProfile(signal?: AbortSignal): Promise<UserProfile> {
  await wait(MOCK_DELAY_MS, signal);

  return deepCopy(userProfile);
}

export async function updateUserProfile(
  body: UpdateUserProfileRequest,
  signal?: AbortSignal,
): Promise<UpdateUserProfileResponse> {
  await wait(MOCK_DELAY_MS, signal);

  userProfile = {
    firstName: body.firstName,
    lastName: body.lastName,
    birthDate: body.birthDate,
    nationalIdNumber: body.nationalIdNumber,
    address: body.address,
    postalCode: body.postalCode,
  };

  return { message: 'پروفایل با موفقیت به‌روزرسانی شد.', ...deepCopy(userProfile) };
}

/* -------------------------------------------------------------------------- */
/* Travel plans                                                               */
/* -------------------------------------------------------------------------- */

export async function listTravelPlans(
  signal?: AbortSignal,
): Promise<TravelPlan[]> {
  await wait(MOCK_DELAY_MS, signal);

  return deepCopy(travelPlans);
}

export async function getTravelPlan(
  id: string,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  await wait(MOCK_DELAY_MS, signal);

  const plan = travelPlans.find((item) => item.id === id);

  if (!plan) {
    throw new ApiError('مسیر مورد نظر پیدا نشد.', 'not-found', 404);
  }

  return deepCopy(plan);
}

export async function createTravelPlan(
  body: TravelPlanRequest,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  await wait(MOCK_DELAY_MS, signal);

  const plan: TravelPlan = {
    id: createId(),
    name: body.name,
    isActive: true,
    createdAtUtc: new Date().toISOString(),
    days: body.days.map((day) => ({ ...day, isEnabled: true })),
    legs: body.legs.map((leg, index) => ({ ...leg, sequence: index + 1 })),
  };

  travelPlans = [plan, ...travelPlans];

  return deepCopy(plan);
}

export async function updateTravelPlan(
  id: string,
  body: TravelPlanRequest,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  await wait(MOCK_DELAY_MS, signal);

  const index = travelPlans.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new ApiError('مسیر مورد نظر پیدا نشد.', 'not-found', 404);
  }

  const current = travelPlans[index];
  const plan: TravelPlan = {
    ...current,
    name: body.name,
    days: body.days.map((day) => ({ ...day, isEnabled: true })),
    legs: body.legs.map((leg, legIndex) => ({ ...leg, sequence: legIndex + 1 })),
  };

  travelPlans = travelPlans.map((item, itemIndex) =>
    itemIndex === index ? plan : item,
  );

  return deepCopy(plan);
}

export async function deleteTravelPlan(
  id: string,
  signal?: AbortSignal,
): Promise<void> {
  await wait(MOCK_DELAY_MS, signal);

  const exists = travelPlans.some((item) => item.id === id);

  if (!exists) {
    throw new ApiError('مسیر مورد نظر پیدا نشد.', 'not-found', 404);
  }

  travelPlans = travelPlans.filter((item) => item.id !== id);
}

export async function setTravelPlanStatus(
  id: string,
  body: SetTravelPlanStatusRequest,
  signal?: AbortSignal,
): Promise<TravelPlan> {
  await wait(MOCK_DELAY_MS, signal);

  const index = travelPlans.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new ApiError('مسیر مورد نظر پیدا نشد.', 'not-found', 404);
  }

  const plan: TravelPlan = {
    ...travelPlans[index],
    isActive: body.isActive,
  };

  travelPlans = travelPlans.map((item, itemIndex) =>
    itemIndex === index ? plan : item,
  );

  return deepCopy(plan);
}
