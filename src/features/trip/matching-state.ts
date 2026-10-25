export type ScheduledRoutePlan = {
  isActive: boolean;
  days: { dayOfWeek: number; isEnabled: boolean }[];
  legs: unknown[];
};

/** Uses the device's local weekday, matching the app's weekday schedule contract. */
export function findTodayPlans<T extends ScheduledRoutePlan>(
  plans: T[],
  now: Date = new Date(),
): T[] {
  const weekday = now.getDay();
  return plans.filter(
    (plan) =>
      plan.isActive &&
      plan.legs.length > 0 &&
      plan.days.some((day) => day.isEnabled && day.dayOfWeek === weekday),
  );
}

export function hasValidCoordinates<T extends { latitude: number | null; longitude: number | null }>(
  point: T | null | undefined,
): point is T & { latitude: number; longitude: number } {
  return (
    point !== null &&
    point !== undefined &&
    point.latitude !== null &&
    point.longitude !== null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180
  );
}
