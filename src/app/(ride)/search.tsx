import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeError } from '@/api/errors';
import { listTravelPlans } from '@/api/travelPlans';
import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import { useTrip } from '@/features/trip/TripProvider';
import type { Place } from '@/features/trip/places';
import { MapPlacePicker } from '@/components/map/MapPlacePicker';
import { ScreenHeader } from '@/components/ride/ScreenHeader';
import { StateView } from '@/components/ride/StateView';
import { hasValidCoordinates } from '@/features/trip/matching-state';

type SearchTarget = 'origin' | 'destination';
const DEBOUNCE_MS = 400;

/** Device geocoding is available on mobile; map picking also works on web. */
const IS_NATIVE = Platform.OS === 'android' || Platform.OS === 'ios';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ target?: string | string[]; mode?: string }>();
  const target: SearchTarget =
    (Array.isArray(params.target) ? params.target[0] : params.target) ===
    'origin'
      ? 'origin'
      : 'destination';

  const { origin, destination, setOrigin, setDestination } = useTrip();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');
  const [mapMode, setMapMode] = useState(params.mode === 'map');

  const requestId = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [routePlaces, setRoutePlaces] = useState<Place[]>([]);

  /* ---------------------------------------------------------------------- */
  /* Places coming from the saved routes (real backend data)                */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const plans = await listTravelPlans(controller.signal);
        const places: Place[] = [];
        const seen = new Set<string>();

        plans.forEach((plan) => {
          plan.legs.forEach((leg) => {
            [leg.startPlace, leg.endPlace].forEach((name) => {
              const key = name.trim();
              if (!key || seen.has(key)) {
                return;
              }
              seen.add(key);
              places.push({
                id: `route-${key}`,
                title: key,
                subtitle: 'از مسیرهای ذخیره‌شده',
                latitude: null,
                longitude: null,
                source: 'route',
              });
            });
          });
        });

        if (!controller.signal.aborted) setRoutePlaces(places);
      } catch {
        if (!controller.signal.aborted) setRoutePlaces([]);
      }
    })();

    return () => controller.abort();
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Search                                                                  */
  /* ---------------------------------------------------------------------- */

  const runSearch = useCallback(async (text: string) => {
    const currentId = ++requestId.current;
    const trimmed = text.trim();

    const localMatches = routePlaces.filter((place) =>
      place.title.includes(trimmed),
    );

    if (!trimmed) {
      setResults(localMatches);
      setStatus('ready');
      return;
    }

    setStatus('loading');

    const collected: Place[] = [...localMatches];

    if (IS_NATIVE) {
      try {
        if (Platform.OS === 'android') {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (permission.status !== 'granted') throw new Error('برای جست‌وجوی مکان دسترسی لازم است؛ از انتخاب روی نقشه استفاده کنید.');
        }
        const geocoded = await Location.geocodeAsync(trimmed);

        if (currentId !== requestId.current) {
          return;
        }

        geocoded.forEach((item, index) => {
          collected.push({
            id: `geo-${index}-${item.latitude}-${item.longitude}`,
            title: trimmed,
            subtitle: `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`,
            latitude: item.latitude,
            longitude: item.longitude,
            source: 'geocode',
          });
        });
      } catch (caught) {
        if (currentId !== requestId.current) {
          return;
        }

        if (!collected.length) {
          setError(describeError(caught));
          setStatus('error');
          return;
        }
      }
    }

    if (currentId !== requestId.current) {
      return;
    }

    setResults(collected);
    setStatus('ready');
  }, [routePlaces]);

  useEffect(() => {
    requestId.current += 1;
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      void runSearch(query);
    }, query.trim() ? DEBOUNCE_MS : 0);

    return () => {
      requestId.current += 1;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, runSearch, routePlaces]);

  /* ---------------------------------------------------------------------- */
  /* Map picking                                                             */
  /* ---------------------------------------------------------------------- */

  const applyPlace = useCallback(
    async (place: Place) => {
      if (!hasValidCoordinates(place)) {
        if (!IS_NATIVE) {
          setQuery(place.title);
          setMapMode(true);
          return;
        }
        setStatus('loading');
        try {
          if (Platform.OS === 'android') {
            const permission = await Location.requestForegroundPermissionsAsync();
            if (permission.status !== 'granted') throw new Error('از انتخاب روی نقشه استفاده کنید.');
          }
          const point = (await Location.geocodeAsync(place.title))[0];
          if (!hasValidCoordinates(point)) throw new Error('مکان پیدا نشد؛ نقطه را روی نقشه انتخاب کنید.');
          place = { ...place, latitude: point.latitude, longitude: point.longitude, source: 'geocode' };
        } catch (caught) {
          setError(describeError(caught));
          setStatus('error');
          return;
        }
      }
      if (target === 'origin') {
        setOrigin(place);
      } else {
        setDestination(place);
      }

      router.back();
    },
    [router, setDestination, setOrigin, target],
  );

  const title = target === 'origin' ? 'انتخاب مبدأ' : 'انتخاب مقصد';

  const header = (
    <ScreenHeader
      title={title}
      subtitle="جست‌وجو کنید یا نقطه را روی نقشه مشخص کنید."
      onBack={() => router.back()}
    />
  );

  const searchField = (
    <View style={styles.searchRow}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={RideColors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="نام مکان را بنویسید"
          placeholderTextColor={RideColors.textSecondary}
          textAlign="right"
          autoCorrect={false}
          style={styles.searchInput}
          accessibilityLabel="جست‌وجوی مکان"
          returnKeyType="search"
        />
        {!!query && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="پاک کردن جست‌وجو"
            onPress={() => setQuery('')}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={RideColors.textSecondary} />
          </Pressable>
        )}
      </View>

      {(
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mapMode ? 'نمایش نتایج جست‌وجو' : 'انتخاب روی نقشه'}
          onPress={() => setMapMode((current) => !current)}
          style={({ pressed }) => [styles.mapToggle, pressed && styles.pressed]}
        >
          <Ionicons
            name={mapMode ? 'list-outline' : 'map-outline'}
            size={20}
            color={RideColors.primary}
          />
        </Pressable>
      )}
    </View>
  );

  const mapPanel = <MapPlacePicker target={target} initialPlace={target === 'origin' ? origin : destination}
    onConfirm={(place) => void applyPlace(place)} />;

  const resultsList = useMemo(
    () =>
      results.map((place) => (
        <Pressable
          key={place.id}
          accessibilityRole="button"
          onPress={() => void applyPlace(place)}
          style={({ pressed }) => [styles.resultRow, pressed && styles.pressed]}
        >
          <View style={styles.resultIcon}>
            <Ionicons
              name={
                place.source === 'geocode'
                  ? 'globe-outline'
                  : place.source === 'route'
                    ? 'bookmark-outline'
                    : 'location-outline'
              }
              size={17}
              color={RideColors.primary}
            />
          </View>

          <View style={styles.resultTexts}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {place.title}
            </Text>
            {!!place.subtitle && (
              <Text style={styles.resultSubtitle} numberOfLines={1}>
                {place.subtitle}
              </Text>
            )}
          </View>

          <Ionicons name="chevron-back" size={17} color={RideColors.textSecondary} />
        </Pressable>
      )),
    [results, applyPlace],
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {header}
      {searchField}

      {mapMode ? (
        mapPanel
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {status === 'loading' ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={RideColors.primary} />
              <Text style={styles.loadingText}>در حال جست‌وجو…</Text>
            </View>
          ) : null}

          {status === 'error' ? (
            <StateView
              state="error"
              title="جست‌وجو ممکن نشد"
              description={error}
            />
          ) : null}

          {status === 'ready' && !results.length ? (
            <StateView
              state="empty"
              icon="search-outline"
              title="نتیجه‌ای پیدا نشد"
              description={
                IS_NATIVE
                  ? 'عبارت دیگری را امتحان کنید یا نقطه را روی نقشه انتخاب کنید.'
                  : 'عبارت دیگری را امتحان کنید یا نقطه را روی نقشه انتخاب کنید.'
              }
            />
          ) : null}

          {status === 'ready' && !!results.length && (
            <View style={styles.results}>{resultsList}</View>
          )}

          {status === 'ready' && !!results.length && (
            <Text style={styles.sourceNote}>
              مکان‌ها از نام‌های ثبت‌شده در مسیرهای شما و سرویس ژئوکدینگ دستگاه
              می‌آیند؛ سرویس جغرافیایی اختصاصی در بک‌اند وجود ندارد.
            </Text>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RideColors.background },
  searchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: RideRadius.md,
    borderWidth: 1,
    borderColor: RideColors.border,
    backgroundColor: RideColors.surfaceMuted,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: RideFonts.medium,
    fontSize: 14,
    color: RideColors.text,
    textAlign: 'right',
  },
  mapToggle: {
    width: 48,
    height: 48,
    borderRadius: RideRadius.md,
    borderWidth: 1,
    borderColor: RideColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RideColors.surface,
  },
  pressed: { opacity: 0.75 },
  content: { paddingHorizontal: 16, gap: 10 },
  loadingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  loadingText: {
    fontFamily: RideFonts.regular,
    fontSize: 13,
    color: RideColors.textSecondary,
  },
  results: { gap: 8 },
  resultRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: RideColors.border,
    borderRadius: RideRadius.lg,
    padding: 12,
    backgroundColor: RideColors.surface,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: RideRadius.md,
    backgroundColor: RideColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTexts: { flex: 1 },
  resultTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 14,
    color: RideColors.text,
    textAlign: 'right',
  },
  resultSubtitle: {
    fontFamily: RideFonts.regular,
    fontSize: 12,
    color: RideColors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  sourceNote: {
    fontFamily: RideFonts.regular,
    fontSize: 11.5,
    lineHeight: 20,
    color: RideColors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
  mapPanel: { flex: 1 },
  map: { flex: 1 },
  mapFooter: {
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: RideColors.border,
    backgroundColor: RideColors.surface,
  },
  mapHint: {
    fontFamily: RideFonts.regular,
    fontSize: 12.5,
    lineHeight: 20,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
});
