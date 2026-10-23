import type { TravelLeg, TravelPlan } from '@/api/types';
import { addMinutesToClock } from '@/utils/persian';

export type ScheduledLeg = {
  leg: TravelLeg;
  /** `HH:mm` clock of the departure. */
  departureClock: string;
  /** `HH:mm` clock of the arrival. */
  arrivalClock: string;
};

/** First enabled departure time of a plan, `null` when the plan has no days. */
export function firstDeparture(plan: TravelPlan | null | undefined): string | null {
  if (!plan) {
    return null;
  }

  const enabled = plan.days.find((day) => day.isEnabled) ?? plan.days[0];
  return enabled?.departureTime ?? null;
}

/**
 * Builds the timetable of a plan from the real backend fields: the departure
 * time of the plan plus the estimated duration of every leg.
 */
export function buildSchedule(plan: TravelPlan | null | undefined): ScheduledLeg[] {
  if (!plan) {
    return [];
  }

  const departure = firstDeparture(plan);
  if (!departure) {
    return plan.legs.map((leg) => ({
      leg,
      departureClock: '',
      arrivalClock: '',
    }));
  }

  const start = departure.slice(0, 5);
  let elapsed = 0;

  return [...plan.legs]
    .sort((a, b) => a.sequence - b.sequence)
    .map((leg) => {
      const departureClock = addMinutesToClock(start, elapsed);
      elapsed += leg.estimatedDurationMinutes;

      return {
        leg,
        departureClock,
        arrivalClock: addMinutesToClock(start, elapsed),
      };
    });
}

/** Sum of the estimated durations of every leg of a plan. */
export function totalDuration(plan: TravelPlan | null | undefined): number {
  if (!plan) {
    return 0;
  }

  return plan.legs.reduce(
    (sum, leg) => sum + (leg.estimatedDurationMinutes ?? 0),
    0,
  );
}
