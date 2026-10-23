export { findTodayPlans, hasValidCoordinates } from './matching-state';

/** `.NET DayOfWeek` index for the current device-local date. */
export function dayOfWeekToday(now: Date = new Date()): number {
  return now.getDay();
}
