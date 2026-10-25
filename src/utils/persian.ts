import { toFaDigits } from './format';
import { JALALI_MONTH_NAMES, JALALI_WEEK_DAY_NAMES, toJalaliDate } from './jalali';

/** "۱۲ دقیقه" */
export function formatMinutes(minutes: number): string {
  return `${toFaDigits(Math.max(0, Math.round(minutes)))} دقیقه`;
}

/** "۱ ساعت و ۵ دقیقه" */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (hours === 0) {
    return formatMinutes(rest);
  }

  if (rest === 0) {
    return `${toFaDigits(hours)} ساعت`;
  }

  return `${toFaDigits(hours)} ساعت و ${toFaDigits(rest)} دقیقه`;
}

/**
 * Normalises the `TimeOnly` values returned by the backend (`"07:30:00"`)
 * into a Persian `"۰۷:۳۰"` clock string.
 */
export function formatClock(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const [rawHour, rawMinute] = value.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return toFaDigits(value);
  }

  return `${toFaDigits(String(hour).padStart(2, '0'))}:${toFaDigits(
    String(minute).padStart(2, '0'),
  )}`;
}

/** Adds minutes to a `"HH:mm"` clock string and returns `"HH:mm"`. */
export function addMinutesToClock(clock: string, minutes: number): string {
  const [rawHour, rawMinute] = clock.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return clock;
  }

  const total = (hour * 60 + minute + Math.round(minutes)) % (24 * 60);
  const nextHour = Math.floor(total / 60);
  const nextMinute = total % 60;

  return `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(
    2,
    '0',
  )}`;
}

/** "۲۹ مهر ۱۴۰۴" for an ISO timestamp coming from the backend. */
export function formatIsoDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return toFaDigits(value);
  }

  const { jy, jm, jd } = toJalaliDate(date);
  return `${toFaDigits(jd)} ${JALALI_MONTH_NAMES[jm - 1]} ${toFaDigits(jy)}`;
}

/** "یکشنبه ۲۹ مهر ۱۴۰۴" for an ISO timestamp coming from the backend. */
export function formatIsoDateWithWeekday(
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatIsoDate(value);
  }

  return `${JALALI_WEEK_DAY_NAMES[date.getDay()]} ${formatIsoDate(value)}`;
}

/** Formats a coordinate pair for display under a map marker. */
export function formatCoordinate(latitude: number, longitude: number): string {
  return `${toFaDigits(latitude.toFixed(5))}, ${toFaDigits(longitude.toFixed(5))}`;
}
