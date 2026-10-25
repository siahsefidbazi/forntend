import type { DetourPreferences } from '@/api/types';
import type { Coordinates } from '@/components/map/types';
import type { MatchOffer } from '@/features/dashboard/mock';

/** Straight-line distance, used only for the sample offer corridor. */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const radians = Math.PI / 180;
  const lat = (b.latitude - a.latitude) * radians;
  const lon = (b.longitude - a.longitude) * radians;
  const h = Math.sin(lat / 2) ** 2 + Math.cos(a.latitude * radians) *
    Math.cos(b.latitude * radians) * Math.sin(lon / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function matchesSampleRoute(
  offer: MatchOffer,
  route: Coordinates[],
  preferences: DetourPreferences,
): boolean {
  if (route.length < 2 || offer.extraMinutes > preferences.maxExtraMinutes ||
      offer.extraWalkMeters > preferences.maxExtraWalkingMeters) return false;

  // Preserve intermediate stops and direction instead of comparing names only.
  const project = (point: Coordinates) => {
    let best = { distance: Infinity, progress: 0 };
    let elapsed = 0;
    for (let i = 1; i < route.length; i++) {
      const start = route[i - 1];
      const end = route[i];
      const scale = Math.cos(start.latitude * Math.PI / 180);
      const dx = (end.longitude - start.longitude) * scale;
      const dy = end.latitude - start.latitude;
      const px = (point.longitude - start.longitude) * scale;
      const py = point.latitude - start.latitude;
      const length = dx * dx + dy * dy;
      const fraction = length ? Math.max(0, Math.min(1, (px * dx + py * dy) / length)) : 0;
      const distance = distanceMeters(point, {
        latitude: start.latitude + fraction * dy,
        longitude: start.longitude + fraction * (end.longitude - start.longitude),
      });
      const segment = distanceMeters(start, end);
      if (distance < best.distance) best = { distance, progress: elapsed + fraction * segment };
      elapsed += segment;
    }
    return best;
  };
  const pickup = project(offer.pickupCoordinate);
  const dropoff = project(offer.dropoffCoordinate);
  const radius = preferences.candidateRadiusKm * 1000;
  return pickup.distance <= radius && dropoff.distance <= radius &&
    dropoff.progress > pickup.progress;
}
