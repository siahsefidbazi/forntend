/**
 * Capabilities that the HamMasir backend does **not** expose yet.
 *
 * The Swagger document ("HamMasir v1") only covers authentication, the user
 * profile and travel plans. Everything a ride-hailing passenger flow needs
 * beyond that (pricing, booking, live tracking, drivers) is listed here with
 * the contract the backend would have to implement.
 *
 * The UI reads this registry to render honest "not available" states instead of
 * pretending that a ride was booked. No request is ever sent to these paths.
 */
export type MissingCapability = {
  id: string;
  /** Feature as it appears in the product. */
  title: string;
  /** Why the feature cannot be implemented with the current contract. */
  reason: string;
  /** The endpoint the backend has to provide. */
  contract: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    request?: string;
    response: string;
  };
};

export const MISSING_CAPABILITIES: MissingCapability[] = [
  {
    id: 'fare-estimate',
    title: 'برآورد قیمت سفر',
    reason:
      'هیچ سرویس قیمت‌گذاری در مستندات Swagger وجود ندارد؛ بنابراین مبلغ سفر قابل محاسبه نیست.',
    contract: {
      method: 'POST',
      path: '/api/rides/estimate',
      request: `{
  "origin": { "latitude": 35.7, "longitude": 51.4 },
  "destination": { "latitude": 35.8, "longitude": 51.5 },
  "transportType": 0
}`,
      response: `{
  "amount": 125000,
  "currency": "IRT",
  "distanceMeters": 8400,
  "durationMinutes": 18,
  "availableVehicles": 3
}`,
    },
  },
  {
    id: 'ride-request',
    title: 'ثبت و رزرو سفر',
    reason:
      'سرویس ثبت سفر وجود ندارد؛ سفری در سرور ثبت نمی‌شود و کد رهگیری تولید نمی‌گردد.',
    contract: {
      method: 'POST',
      path: '/api/rides',
      request: `{
  "origin": { "latitude": 35.7, "longitude": 51.4, "address": "مبدأ" },
  "destination": { "latitude": 35.8, "longitude": 51.5, "address": "مقصد" },
  "travelPlanId": "c433a40a-b804-4238-9a0d-4c79b400dcbc",
  "legSequence": 1
}`,
      response: `{
  "id": "0f0d4d1e-...",
  "status": "Requested",
  "estimatedArrivalMinutes": 4,
  "driver": { "id": "...", "fullName": "...", "rating": 4.8 },
  "vehicle": { "plateNumber": "...", "model": "...", "color": "..." }
}`,
    },
  },
  {
    id: 'ride-tracking',
    title: 'پیگیری زنده سفر',
    reason:
      'سرویس وضعیت سفر یا کانال WebSocket/SSE در مستندات وجود ندارد؛ به‌روزرسانی زنده موقعیت راننده ممکن نیست.',
    contract: {
      method: 'GET',
      path: '/api/rides/{id}',
      response: `{
  "id": "0f0d4d1e-...",
  "status": "DriverArriving",
  "driverLocation": { "latitude": 35.71, "longitude": 51.41, "updatedAtUtc": "..." },
  "etaMinutes": 3
}`,
    },
  },
  {
    id: 'ride-cancel',
    title: 'لغو سفر',
    reason: 'قواعد و سرویس لغو سفر در قرارداد بک‌اند تعریف نشده است.',
    contract: {
      method: 'DELETE',
      path: '/api/rides/{id}',
      response: '204 No Content',
    },
  },
  {
    id: 'ride-history',
    title: 'تاریخچه سفرها',
    reason:
      'سرویس تاریخچه سفر (با صفحه‌بندی) وجود ندارد؛ در حال حاضر «سفرهای من» همان مسیرهای ذخیره‌شده در سرویس برنامه سفر است.',
    contract: {
      method: 'GET',
      path: '/api/rides?page=1&pageSize=20',
      response: `{
  "items": [{ "id": "...", "status": "Completed", "price": 125000, "createdAtUtc": "..." }],
  "total": 42
}`,
    },
  },
  {
    id: 'vehicle-categories',
    title: 'دسته‌بندی خودروها',
    reason:
      'سرویس لیست دسته‌بندی وسایل نقلیه وجود ندارد؛ گزینه‌های سفر از قطعه‌های واقعی مسیر ذخیره‌شده گرفته می‌شود.',
    contract: {
      method: 'GET',
      path: '/api/transport-types',
      response: `{
  "id": 0,
  "name": "مترو",
  "capacity": 180,
  "iconUrl": "..."
}`,
    },
  },
  {
    id: 'backend-geocoding',
    title: 'جست‌وجوی مکان در سرویس',
    reason:
      'سرویس جغرافیایی (geocoding) ندارد؛ جست‌وجو از سرویس ژئوکدینگ سیستم‌عامل و نام مکان‌های ذخیره‌شده استفاده می‌کند.',
    contract: {
      method: 'GET',
      path: '/api/places?query=ولیعصر',
      response: `{
  "items": [
    { "title": "میدان ولیعصر", "latitude": 35.75, "longitude": 51.40 }
  ]
}`,
    },
  },
];

export type BackendRequirement = {
  id: string;
  title: string;
  reason: string;
  requiredChanges: string[];
};

export const BACKEND_REQUIREMENTS: BackendRequirement[] = [
  {
    id: 'driver-delivery-matching',
    title: 'تطبیق بسته با مسیر روز راننده',
    reason:
      'قرارداد دریافت پیشنهادهای بسته برای مسیر روز راننده در Swagger یا پیاده‌سازی فعال API وجود ندارد. پذیرش موجود نیز در این مخزن فقط mock حافظه‌ای است.',
    requiredChanges: [
      'دریافت پیشنهادها بر اساس موقعیت فعلی، مقصد اصلی، زمان محلی روز، مسیر برنامه‌ریزی‌شده یا مسیر دستی معتبر و تعهدهای تحویل فعال.',
      'پاسخ پیشنهاد باید مختصات pickup/drop-off، مهلت و مبلغ در صورت وجود، وضعیت واقعی سفارش، مسافت/زمان مسیر اصلی و پیشنهادی و انحراف اضافه را ارائه کند.',
      'قواعد مجاز انحراف مسافت و زمان باید پیکربندی/تأیید شوند؛ تنظیم فعلی پیاده‌روی جایگزین انحراف جاده‌ای نیست.',
      'عملیات اتمیک و وضعیت‌محور برای قبول و رد، حذف پیشنهادهای ردشده از جست‌وجوی بعدی، جلوگیری از ادعای هم‌زمان و امکان دریافت پیشنهاد بعدی لازم است.',
      'ثبت مسیر یک‌روزه‌ی دستی با مختصات و مبدأ برنامه‌ریزی‌شده، جدا از مکان فعلی GPS، و بازیابی وضعیت فعال در نشست بعدی لازم است.',
      'سرویس مسیریابی واقعی با زمان/مسافت و ترافیک و بررسی مهلت تحویل و تعهدهای پذیرفته‌شده لازم است؛ در حال حاضر هیچ خط مسیر یا امتیاز تطبیقی ساخته نمی‌شود.',
    ],
  },
];

/** Looks up a single capability by its identifier. */
export function getMissingCapability(id: string) {
  return MISSING_CAPABILITIES.find((capability) => capability.id === id);
}
