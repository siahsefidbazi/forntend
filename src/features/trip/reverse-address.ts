type AddressFields = Record<string, string | undefined>;

/** Prefer a readable street address over the provider's long administrative label. */
export function formatMapAddress(address: AddressFields, fallback = ''): string {
  const parts = [address.city ?? address.town ?? address.village,
    address.suburb ?? address.neighbourhood ?? address.city_district,
    address.road ?? address.pedestrian ?? address.residential,
    address.house_number ? `پلاک ${address.house_number}` : undefined];
  return [...new Set(parts.filter((part): part is string => !!part?.trim()))].join('، ') || fallback;
}

const cache = new Map<string, string>();
let nextRequestAt = 0;

/** Configurable Nominatim-compatible endpoint; cache and pace user-triggered lookups. */
export async function reverseMapAddress(latitude: number, longitude: number, signal: AbortSignal, native = false): Promise<string> {
  const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const wait = Math.max(0, nextRequestAt - Date.now());
  nextRequestAt = Date.now() + wait + 1100;
  await new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new Error('Aborted')); return; }
    const abort = () => { clearTimeout(timer); reject(new Error('Aborted')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, wait);
    signal.addEventListener('abort', abort, { once: true });
  });
  const base = process.env.EXPO_PUBLIC_REVERSE_GEOCODE_URL ?? 'https://nominatim.openstreetmap.org/reverse';
  const query = new URLSearchParams({ lat: String(latitude), lon: String(longitude), format: 'jsonv2',
    addressdetails: '1', zoom: '18', 'accept-language': 'fa' });
  const response = await fetch(`${base}?${query}`, { signal, headers: { Accept: 'application/json', ...(native ? { 'User-Agent': 'HamMasir/1.0' } : {}) } });
  if (!response.ok) throw new Error('دریافت آدرس انجام نشد.');
  const body: { address?: AddressFields; display_name?: string } = await response.json();
  const label = formatMapAddress(body.address ?? {}, body.display_name);
  if (!label) throw new Error('برای این نقطه آدرسی پیدا نشد.');
  if (cache.size >= 150) cache.delete(cache.keys().next().value!);
  cache.set(key, label);
  return label;
}
