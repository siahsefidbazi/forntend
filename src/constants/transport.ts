import type { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type TransportDescriptor = {
  /** Label shown to the user. */
  label: string;
  icon: IconName;
};

/**
 * `transportType` is an integer enum on the backend.
 *
 * The Swagger document does not publish the members of that enum, so the app
 * keeps the raw value (it is displayed next to the label) and uses a neutral
 * description until the backend documents the mapping.
 *
 * Fill in `TRANSPORT_TYPES` once the enum members are published — the rest of
 * the app picks the change up automatically.
 */
const TRANSPORT_TYPES: Record<number, TransportDescriptor> = {};

const DEFAULT_TRANSPORT: TransportDescriptor = {
  label: 'حمل‌ونقل عمومی',
  icon: 'bus-outline',
};

export function describeTransport(transportType: number): TransportDescriptor {
  return TRANSPORT_TYPES[transportType] ?? DEFAULT_TRANSPORT;
}

/**
 * `dayOfWeek` follows the .NET `DayOfWeek` enum used by the backend
 * (0 = Sunday … 6 = Saturday).
 */
export const WEEK_DAY_NAMES = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
] as const;

export function weekDayName(dayOfWeek: number): string {
  return WEEK_DAY_NAMES[dayOfWeek] ?? '—';
}

/** All selectable days, ordered the way they are shown in the editor. */
export const WEEK_DAY_OPTIONS = [
  { value: 6, label: 'شنبه' },
  { value: 0, label: 'یکشنبه' },
  { value: 1, label: 'دوشنبه' },
  { value: 2, label: 'سه‌شنبه' },
  { value: 3, label: 'چهارشنبه' },
  { value: 4, label: 'پنجشنبه' },
  { value: 5, label: 'جمعه' },
] as const;
