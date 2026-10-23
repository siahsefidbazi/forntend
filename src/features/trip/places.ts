export type PlaceSource = 'gps' | 'geocode' | 'pin' | 'route';

export type Place = {
  /** Stable identifier for list keys. */
  id: string;
  /** Main label, e.g. "میدان ولیعصر". */
  title: string;
  /** Secondary line, e.g. the district or the coordinates. */
  subtitle?: string;
  latitude: number | null;
  longitude: number | null;
  source: PlaceSource;
};

export const DEFAULT_REGION = {
  latitude: 35.6892,
  longitude: 51.389,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
} as const;
