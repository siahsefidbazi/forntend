/**
 * Minimal Jalali (Solar Hijri) calendar conversion.
 *
 * React Native's Hermes build does not reliably ship the `fa-IR` calendar data
 * for `Intl.DateTimeFormat`, so the conversion is done here to keep Persian
 * dates correct on every device.
 */

const GREGORIAN_MONTH_DAYS = [
  0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334,
];

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const JALALI_WEEK_DAY_NAMES = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
] as const;

function div(a: number, b: number) {
  return Math.trunc(a / b);
}

/** Converts a Gregorian date into a Jalali date. */
export function toJalali(
  gy: number,
  gm: number,
  gd: number,
): { jy: number; jm: number; jd: number } {
  const gregorianYear = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    div(gregorianYear + 3, 4) -
    div(gregorianYear + 99, 100) +
    div(gregorianYear + 399, 400) +
    gd +
    GREGORIAN_MONTH_DAYS[gm - 1];

  let jy = -1595 + 33 * div(days, 12053);
  days %= 12053;

  jy += 4 * div(days, 1461);
  days %= 1461;

  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }

  if (days < 186) {
    jy += div(days, 31);
    return { jy, jm: 1 + div(days, 31), jd: 1 + (days % 31) };
  }

  jy += div(days - 186, 365);
  return {
    jy,
    jm: 7 + div(days - 186, 30),
    jd: 1 + ((days - 186) % 30),
  };
}

/** Jalali date of a JavaScript date instance. */
export function toJalaliDate(date: Date) {
  return toJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Weekday index of a date, 0 = Sunday (same convention as the backend). */
export function weekDayIndex(date: Date): number {
  return date.getDay();
}
