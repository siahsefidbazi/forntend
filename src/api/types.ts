/**
 * Request/response contracts extracted from the Swagger document
 * ("HamMasir v1", https://localhost:7220/swagger/index.html).
 *
 * Auth, users, profiles and travel plans follow swagger_final.pdf.
 * Parcel, matching, detour and support types below are mock-only contracts.
 */

/** RFC 7807 `application/problem+json` payload returned by the backend. */
export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
};

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

/** `RequestCodeDto` */
export type RequestCodeRequest = {
  phoneNumber: string;
};

/** Response of `POST /api/auth/request-code`. */
export type RequestCodeResponse = {
  message: string;
  /** Returned by the development server so the OTP can be read from the UI. */
  developmentCode?: string | null;
};

/** `VerifyCodeDto` */
export type VerifyCodeRequest = {
  phoneNumber: string;
  code: string;
};

/** Response of `POST /api/auth/verify-code`. */
export type VerifyCodeResponse = {
  accessToken: string;
  tokenType?: string;
  expiresInMinutes?: number;
};

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

/** `CreateUserRequestDto` */
export type CreateUserRequest = {
  fullName: string;
  phoneNumber: string;
};

/** Response of `POST /api/Users/Login` (HTTP 201). */
export type UserResponse = {
  id: string;
  fullName: string;
  phoneNumber: string;
  createdAtUtc: string;
};

/* -------------------------------------------------------------------------- */
/* User profile                                                               */
/* -------------------------------------------------------------------------- */

/** Response of `GET /api/users/me/profile`. */
export type UserProfile = {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalIdNumber: string;
  address: string;
  postalCode: string;
};

/** `UpdateUserProfileDto` */
export type UpdateUserProfileRequest = {
  userPhotoUrl?: string | null;
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalIdNumber: string;
  address: string;
  postalCode: string;
};

/** Response of `PUT /api/users/me/profile`. */
export type UpdateUserProfileResponse = UserProfile & {
  message?: string;
};

/* -------------------------------------------------------------------------- */
/* Travel plans                                                               */
/* -------------------------------------------------------------------------- */

/** `TravelPlanDayResponseDto` */
export type TravelPlanDay = {
  dayOfWeek: number;
  departureTime: string;
  isEnabled: boolean;
};

/**
 * `TravelLegResponseDto`
 *
 * `transportType` is an integer enum on the backend. The Swagger document does
 * not publish the members, so the raw value is preserved end to end.
 */
export type TravelLeg = {
  sequence: number;
  transportType: number;
  startPlace: string;
  endPlace: string;
  estimatedDurationMinutes: number;
};

/** `TravelPlanResponseDto` */
export type TravelPlan = {
  id: string;
  name: string;
  isActive: boolean;
  createdAtUtc: string;
  days: TravelPlanDay[];
  legs: TravelLeg[];
};

/** `CreateTravelPlanDayDto` */
export type CreateTravelPlanDay = {
  dayOfWeek: number;
  departureTime: string;
};

/** `CreateTravelLegDto` */
export type CreateTravelLeg = {
  sequence: number;
  transportType: number;
  startPlace: string;
  endPlace: string;
  estimatedDurationMinutes: number;
};

/** `CreateTravelPlanDto` / `UpdateTravelPlanDto` */
export type TravelPlanRequest = {
  name: string;
  days: CreateTravelPlanDay[];
  legs: CreateTravelLeg[];
};

/** `SetTravelPlanStatusDto` */
export type SetTravelPlanStatusRequest = {
  isActive: boolean;
};

/* -------------------------------------------------------------------------- */
/* Parcel matches                                                             */
/* -------------------------------------------------------------------------- */

export type MatchAcceptanceRequest =
  | {
      mode: 'weekly_schedule';
      travelPlanId: string;
      legSequence: number;
    }
  | {
      mode: 'custom_route';
      origin: { title: string; latitude: number; longitude: number };
      destination: { title: string; latitude: number; longitude: number };
    };

/** Response of `POST /api/matches/{id}/accept`. */
export type AcceptMatchResponse = {
  matchId: string;
  deliveryId: string;
  status: 'Assigned';
  acceptance: MatchAcceptanceRequest;
  assignedAtUtc: string;
};

/** `POST /api/orders` request for a parcel in the Tehran pilot. */
export type CreateParcelOrderRequest = {
  origin: { title: string; latitude: number; longitude: number };
  destination: { title: string; latitude: number; longitude: number };
  parcelDescription: string;
  weightGrams: number;
  deliverByLocalTime: string;
};

/** Response of `POST /api/orders` and `GET /api/orders/mine`. */
export type ParcelOrderResponse = CreateParcelOrderRequest & {
  id: string;
  status: 'Open' | 'Assigned' | 'PickedUp' | 'Delivered' | 'Cancelled';
  createdAtUtc: string;
};

export type DetourPreferences = {
  candidateRadiusKm: number;
  maxExtraMinutes: number;
  maxExtraWalkingMeters: number;
};

export type MyDelivery = {
  id: string;
  matchId: string;
  parcel: string;
  sender: string;
  pickupStop: string;
  dropoffStop: string;
  extraMinutes: number;
  extraWalkMeters: number;
  payoutToman: number;
  acceptanceMode: MatchAcceptanceRequest['mode'];
  status: 'Assigned';
  assignedAtUtc: string;
};

export type SupportTopic = 'delivery' | 'account' | 'payment' | 'other';

export type CreateSupportTicketRequest = {
  topic: SupportTopic;
  orderReference?: string;
  message: string;
};

export type SupportTicketResponse = CreateSupportTicketRequest & {
  id: string;
  status: 'Received';
  createdAtUtc: string;
};
