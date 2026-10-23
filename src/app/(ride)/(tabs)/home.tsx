import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeError } from '@/api/errors';
import type { TravelPlan } from '@/api/types';
import { listTravelPlans } from '@/api/travelPlans';
import { weekDayName } from '@/constants/transport';
import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import { useTrip } from '@/features/trip/TripProvider';
import { useTracking } from '@/features/trip/TrackingProvider';
import { findTodayPlans } from '@/features/trip/matching';
import { hasValidCoordinates } from '@/features/trip/matching-state';
import { DEFAULT_REGION, type Place } from '@/features/trip/places';
import { formatClock } from '@/utils/persian';
import AppMap from '@/components/map/AppMap';
import type { AppMapHandle, AppMapMarker, Coordinates } from '@/components/map/types';
import { PlaceField } from '@/components/ride/PlaceField';
import { PrimaryButton } from '@/components/ride/PrimaryButton';
import { StateView } from '@/components/ride/StateView';

type PermissionState = 'unknown' | 'granted' | 'denied';
type MatchingPhase =
  | 'inactive'
  | 'activating'
  | 'checking_schedule'
  | 'waiting_for_route'
  | 'matching_unavailable'
  | 'error';

type RouteMapPoints = {
  start: Coordinates | null;
  destination: Coordinates | null;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<AppMapHandle>(null);

  const {
    origin,
    destination,
    setOrigin,
    setDestination,
    swapPlaces,
  } = useTrip();

  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [today, setToday] = useState(() => new Date());
  const [manualRouteOverride, setManualRouteOverride] = useState(false);
  const [confirmedManualRouteKey, setConfirmedManualRouteKey] = useState<
    string | null
  >(null);
  const [plansStatus, setPlansStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [plansError, setPlansError] = useState('');
  const [matchingPhase, setMatchingPhase] = useState<MatchingPhase>('inactive');
  const [activationError, setActivationError] = useState('');
  const activationController = useRef<AbortController | null>(null);
  const activationPending = useRef(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const { isTracking, enable, disable } = useTracking();
  const [routeMapPoints, setRouteMapPoints] = useState<RouteMapPoints>({
    start: null,
    destination: null,
  });
  const [routeMapStatus, setRouteMapStatus] = useState<
    'loading' | 'ready'
  >('loading');
  const [unresolvedMapPlaces, setUnresolvedMapPlaces] = useState<string[]>([]);

  /* ---------------------------------------------------------------------- */
  /* Route switch flow: location and today's scheduled route               */
  /* ---------------------------------------------------------------------- */

  /** Stop names stored in the app for the currently relevant route. */
  const todayDayOfWeek = today.getDay();
  const todayPlans = useMemo(
    () => findTodayPlans(plans, today),
    [plans, today],
  );

  const todayPlan = manualRouteOverride ? null : todayPlans[0] ?? null;
  const todayPlanLegs = useMemo(
    () =>
      todayPlan
        ? [...todayPlan.legs].sort((a, b) => a.sequence - b.sequence)
        : [],
    [todayPlan],
  );
  const scheduledStartName = todayPlanLegs[0]?.startPlace ?? null;
  const scheduledDestinationName =
    todayPlanLegs[todayPlanLegs.length - 1]?.endPlace ?? null;

  const manualRouteKey = [
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    origin?.id,
    origin?.latitude,
    origin?.longitude,
    destination?.id,
    destination?.latitude,
    destination?.longitude,
  ].join('|');
  const manualRouteReady =
    !todayPlan &&
    hasValidCoordinates(origin) &&
    hasValidCoordinates(destination) &&
    confirmedManualRouteKey === manualRouteKey;
  const currentMatchingPhase: MatchingPhase = isTracking
    ? todayPlan
      ? hasValidCoordinates(routeMapPoints.start) &&
        hasValidCoordinates(routeMapPoints.destination)
        ? 'matching_unavailable'
        : 'waiting_for_route'
      : manualRouteReady
        ? 'matching_unavailable'
        : 'waiting_for_route'
    : matchingPhase;

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const timer = setTimeout(
      () => setToday(new Date()),
      nextMidnight.getTime() - now.getTime(),
    );

    return () => clearTimeout(timer);
  }, [today]);

  /* ---------------------------------------------------------------------- */
  /* Saved routes                                                            */
  /* ---------------------------------------------------------------------- */

  const loadPlans = useCallback(async (signal?: AbortSignal) => {
    setPlansError('');

    try {
      const data = await listTravelPlans(signal);
      if (signal?.aborted) {
        return;
      }
      setPlans(data ?? []);
      setPlansStatus('ready');
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      setPlansError(describeError(error));
      setPlansStatus('error');
    }
  }, []);

  const handleTrackingChange = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        activationController.current?.abort();
        activationController.current = null;
        activationPending.current = false;
        setActivationError('');
        setMatchingPhase('inactive');
        disable();
        return;
      }

      if (activationPending.current || isTracking) {
        return;
      }

      activationPending.current = true;
      const controller = new AbortController();
      activationController.current = controller;
      setManualRouteOverride(false);
      setConfirmedManualRouteKey(null);
      setMatchingPhase('activating');
      setActivationError('');

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (controller.signal.aborted) {
          return;
        }
        if (status !== 'granted') {
          setPermission('denied');
          throw new Error('برای فعال‌سازی مسیر، دسترسی مکان را مجاز کنید.');
        }

        setPermission('granted');
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (controller.signal.aborted) {
          return;
        }
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(currentLocation);
        mapRef.current?.animateToRegion(
          { ...currentLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 },
          350,
        );

        setMatchingPhase('checking_schedule');
        const data = await listTravelPlans(controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        const localNow = new Date();
        setToday(localNow);
        setPlans(data ?? []);
        setPlansStatus('ready');
        enable();
        setMatchingPhase('waiting_for_route');
      } catch (error) {
        if (!controller.signal.aborted) {
          setActivationError(describeError(error));
          setMatchingPhase('error');
        }
      } finally {
        if (activationController.current === controller) {
          activationController.current = null;
          activationPending.current = false;
        }
      }
    },
    [disable, enable, isTracking],
  );

  useEffect(
    () => () => {
      activationController.current?.abort();
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setToday(new Date());
      const controller = new AbortController();
      void loadPlans(controller.signal);

      return () => controller.abort();
    }, [loadPlans]),
  );

  useEffect(() => {
    let cancelled = false;

    const resolveCoordinate = async (
      title: string | null,
      knownCoordinate?: Coordinates,
    ): Promise<Coordinates | null> => {
      if (knownCoordinate) {
        return knownCoordinate;
      }
      if (
        !title ||
        Platform.OS === 'web' ||
        (Platform.OS === 'android' && permission !== 'granted')
      ) {
        return null;
      }

      const result = (await Location.geocodeAsync(title))[0];
      return result
        ? { latitude: result.latitude, longitude: result.longitude }
        : null;
    };

    const loadRouteMapPoints = async () => {
      if (Platform.OS === 'android' && permission === 'unknown') {
        return;
      }

      setRouteMapPoints({
        start: null,
        destination: null,
      });
      setUnresolvedMapPlaces([]);
      setRouteMapStatus('loading');

      const targets: {
        key: keyof RouteMapPoints;
        title: string | null;
        coordinate?: Coordinates;
      }[] = [
        {
          key: 'start',
          title: isTracking && todayPlan ? scheduledStartName : origin?.title ?? null,
          coordinate:
            (isTracking && !!todayPlan) || origin?.source === 'route'
              ? undefined
              : origin &&
                  origin.latitude !== null &&
                  origin.longitude !== null
                ? { latitude: origin.latitude, longitude: origin.longitude }
                : undefined,
        },
        {
          key: 'destination',
          title:
            isTracking && todayPlan
              ? scheduledDestinationName
              : destination?.title ?? null,
          coordinate:
            (isTracking && !!todayPlan) || destination?.source === 'route'
              ? undefined
              : destination &&
                  destination.latitude !== null &&
                  destination.longitude !== null
                ? {
                    latitude: destination.latitude,
                    longitude: destination.longitude,
                  }
                : undefined,
        },
      ];
      const points: RouteMapPoints = {
        start: null,
        destination: null,
      };
      const unresolved: string[] = [];

      for (const target of targets) {
        if (!target.title) {
          continue;
        }

        try {
          points[target.key] = await resolveCoordinate(
            target.title,
            target.coordinate,
          );
          if (!points[target.key]) {
            unresolved.push(target.title);
          }
        } catch {
          unresolved.push(target.title);
        }
      }

      if (!cancelled) {
        setRouteMapPoints(points);
        setUnresolvedMapPlaces(unresolved);
        setRouteMapStatus('ready');
      }
    };

    void loadRouteMapPoints();

    return () => {
      cancelled = true;
    };
  }, [
    destination,
    isTracking,
    origin,
    scheduledDestinationName,
    scheduledStartName,
    todayPlan,
    permission,
  ]);

  const mapMarkers = useMemo<AppMapMarker[]>(() => {
    const markers: AppMapMarker[] = [];
    const addMarker = (
      id: string,
      point: Coordinates | null,
      title: string | null,
      icon: React.ComponentProps<typeof Ionicons>['name'],
      color: string,
    ) => {
      if (!point || !title) {
        return;
      }

      markers.push({
        id,
        coordinate: point,
        anchor: { x: 0.5, y: 0.5 },
        title,
        content: (
          <View style={[styles.routeMarker, { backgroundColor: color }]}>
            <Ionicons name={icon} size={14} color={RideColors.textInverse} />
          </View>
        ),
      });
    };

    const useScheduledRoute = isTracking && todayPlan;
    const routeStartTitle = useScheduledRoute
      ? scheduledStartName
      : origin?.title ?? null;
    const routeDestinationTitle = useScheduledRoute
      ? scheduledDestinationName
      : destination?.title ?? null;

    addMarker(
      'journey-start',
      routeMapPoints.start,
      routeStartTitle ? `شروع مسیر: ${routeStartTitle}` : null,
      'navigate',
      RideColors.primary,
    );
    addMarker(
      'driver-current-location',
      isTracking ? userLocation : null,
      isTracking && userLocation ? 'موقعیت ثبت‌شده هنگام فعال‌سازی' : null,
      'locate',
      RideColors.warning,
    );
    addMarker(
      'journey-destination',
      routeMapPoints.destination,
      routeDestinationTitle ? `مقصد نهایی: ${routeDestinationTitle}` : null,
      'flag',
      RideColors.text,
    );

    return markers;
  }, [
    destination,
    isTracking,
    origin,
    routeMapPoints,
    scheduledDestinationName,
    scheduledStartName,
    todayPlan,
    userLocation,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Device location                                                         */
  /* ---------------------------------------------------------------------- */

  const recenterTo = useCallback((coordinate: Coordinates) => {
    mapRef.current?.animateToRegion(
      {
        ...coordinate,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      350,
    );
  }, []);

  const handleMapLongPress = useCallback(
    (coordinate: Coordinates) => {
      if (isTracking && todayPlan) {
        setManualRouteOverride(true);
        setConfirmedManualRouteKey(null);
      }

      const { latitude, longitude } = coordinate;
      const place: Place = {
        id: `pin-${latitude}-${longitude}`,
        title: 'نقطه انتخاب‌شده روی نقشه',
        subtitle: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude,
        longitude,
        source: 'pin',
      };

      if (!origin) {
        setOrigin(place);
      } else {
        setDestination(place);
      }
    },
    [isTracking, origin, setOrigin, setDestination, todayPlan],
  );

  const openSearch = useCallback(
    (target: 'origin' | 'destination') => {
      if (isTracking && todayPlan) {
        setManualRouteOverride(true);
        setConfirmedManualRouteKey(null);
      }
      router.push({ pathname: '/(ride)/search', params: { target } });
    },
    [isTracking, router, todayPlan],
  );

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  const renderOptions = () => {
    const trackingHeader = (
      <View style={styles.trackingRow}>
        <View style={styles.trackingTexts}>
          <Text style={styles.trackingTitle}>مسیر</Text>
          <Text style={styles.trackingSubtitle}>
            {isTracking
              ? 'روشن — مسیر امروز برای بررسی آماده می‌شود'
              : 'خاموش — برای دیدن پیشنهادها روشن کن'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="روشن و خاموش کردن مسیر"
          value={isTracking}
          disabled={
            currentMatchingPhase === 'activating' ||
            currentMatchingPhase === 'checking_schedule'
          }
          onValueChange={(value) => void handleTrackingChange(value)}
          trackColor={{ true: RideColors.primary, false: RideColors.borderStrong }}
          thumbColor={RideColors.textInverse}
        />
      </View>
    );

    if (
      currentMatchingPhase === 'activating' ||
      currentMatchingPhase === 'checking_schedule'
    ) {
      return (
        <>
          {trackingHeader}
          <View style={styles.panelLoading}>
            <ActivityIndicator color={RideColors.primary} />
            <Text style={styles.panelLoadingText}>
              {currentMatchingPhase === 'activating'
                ? 'در حال دریافت موقعیت فعلی…'
                : 'در حال بررسی برنامه‌ی امروز…'}
            </Text>
          </View>
        </>
      );
    }

    if (currentMatchingPhase === 'error') {
      return (
        <>
          {trackingHeader}
          <StateView
            state="error"
            title="فعال‌سازی مسیر انجام نشد"
            description={activationError}
            actionLabel="تلاش دوباره"
            onAction={() => void handleTrackingChange(true)}
          />
        </>
      );
    }

    if (!isTracking) {
      return (
        <>
          {trackingHeader}
          <StateView
            state="empty"
            icon="navigate-outline"
            title="مسیر خاموش است"
            description="مسیرت را روشن کن تا بررسی کنیم امروز برنامه‌ی هفتگی داری یا نه."
          />
        </>
      );
    }

    if (plansStatus === 'error' && !todayPlan) {
      return (
        <>
          {trackingHeader}
          <StateView
            state="error"
            title="بررسی برنامه ممکن نشد"
            description={plansError}
            actionLabel="تلاش دوباره"
            onAction={() => void loadPlans()}
          />
        </>
      );
    }

    if (!todayPlan && !manualRouteReady) {
      return (
        <>
          {trackingHeader}
          <View style={styles.planBannerManual}>
            <Ionicons name="calendar-outline" size={16} color={RideColors.warning} />
            <Text style={styles.planBannerTextManual}>
              امروز ({weekDayName(todayDayOfWeek)}) برنامه‌ی هفتگی فعالی نداری.
            </Text>
          </View>
          <Text style={styles.sectionTitle}>مبدأ و مقصد سفر امروزت را مشخص کن</Text>
          <Text style={styles.manualHint}>
            مسیر دستی را برای امروز تأیید کن. مکان‌های ذخیره‌شده‌ی بدون مختصات
            معتبر نیستند؛ از جست‌وجوی جغرافیایی یا انتخاب روی نقشه استفاده کن.
          </Text>
          <View style={styles.manualFields}>
            <PlaceField
              label="مبدأ"
              icon="navigate-circle-outline"
              value={origin?.title}
              placeholder="انتخاب مبدأ"
              onPress={() => openSearch('origin')}
            />
            <View style={styles.manualDivider} />
            <PlaceField
              label="مقصد نهایی"
              icon="location-outline"
              value={destination?.title}
              placeholder="انتخاب مقصد"
              onPress={() => openSearch('destination')}
            />
          </View>
          <PrimaryButton
            label="تأیید مسیر امروز"
            icon="checkmark-circle-outline"
            disabled={
              !hasValidCoordinates(origin) ||
              !hasValidCoordinates(destination)
            }
            onPress={() => setConfirmedManualRouteKey(manualRouteKey)}
            style={styles.manualPlanCta}
          />
          <PrimaryButton
            label="افزودن برنامه‌ی هفتگی"
            icon="calendar-outline"
            variant="ghost"
            onPress={() => router.push('/(ride)/plan-editor')}
            style={styles.manualPlanCta}
          />
        </>
      );
    }

    const todayScheduledDay = todayPlan?.days.find(
      (item) => item.isEnabled && item.dayOfWeek === todayDayOfWeek,
    );

    return (
      <>
        {trackingHeader}
        {todayPlan ? (
          <View style={styles.planBanner}>
            <Ionicons name="calendar-outline" size={16} color={RideColors.primary} />
            <Text style={styles.planBannerText}>
              مسیر برنامه‌ریزی‌شده‌ی امروز: {todayPlan.name}
              {todayScheduledDay
                ? ` · ${weekDayName(todayScheduledDay.dayOfWeek)} ${formatClock(todayScheduledDay.departureTime)}`
                : ''}
            </Text>
          </View>
        ) : (
          <View style={styles.planBannerManual}>
            <Ionicons name="map-outline" size={16} color={RideColors.warning} />
            <Text style={styles.planBannerTextManual}>
              مسیر دستی امروز: {origin?.title} تا {destination?.title}
            </Text>
          </View>
        )}
        {currentMatchingPhase === 'waiting_for_route' ? (
          <StateView
            state={
              todayPlan && routeMapStatus === 'ready' ? 'error' : 'loading'
            }
            title={
              todayPlan && routeMapStatus === 'ready'
                ? 'مختصات برنامه‌ی امروز در دسترس نیست'
                : 'در حال آماده‌سازی مسیر'
            }
            description={
              todayPlan
                ? unresolvedMapPlaces.length
                  ? `مختصات واقعی این مکان‌ها پیدا نشد: ${unresolvedMapPlaces.join('، ')}.`
                  : 'در حال دریافت مختصات واقعی مبدأ و مقصد برنامه‌ی امروز…'
                : 'برای شروع، مبدأ و مقصد معتبر را انتخاب کنید.'
            }
            actionLabel={
              todayPlan && routeMapStatus === 'ready'
                ? 'ورود مسیر دستی'
                : undefined
            }
            onAction={
              todayPlan && routeMapStatus === 'ready'
                ? () => {
                    setManualRouteOverride(true);
                    setConfirmedManualRouteKey(null);
                  }
                : undefined
            }
          />
        ) : (
          <StateView
            state="empty"
            icon="cube-outline"
            title="جست‌وجوی پیشنهاد بسته در دسترس نیست"
            description="این نسخه بک‌اندِ دریافت پیشنهاد، رد پیشنهاد، مسیریابی جاده‌ای و بررسی تعهدهای فعال را ندارد. پیشنهادهای نمونه عمداً نمایش داده نمی‌شوند و جست‌وجوی خودکار اجرا نمی‌شود."
          />
        )}
        {todayPlan ? (
          <Text style={styles.mapFeedback}>
            {unresolvedMapPlaces.length
              ? `مختصات برنامه برای نمایش روی نقشه موجود نیست: ${unresolvedMapPlaces.join('، ')}.`
              : 'موقعیت ثبت‌شده هنگام فعال‌سازی از مبدأ برنامه جداست؛ خط مسیر بدون سرویس مسیریابی نمایش داده نمی‌شود.'}
          </Text>
        ) : null}
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <AppMap
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onLongPress={handleMapLongPress}
        loadingEnabled
        loadingBackgroundColor={RideColors.surfaceMuted}
        loadingIndicatorColor={RideColors.primary}
        markers={mapMarkers}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.searchCard}>
          <View style={styles.fieldsRow}>
            <View style={styles.fields}>
              <PlaceField
                label="مبدأ"
                icon="navigate-circle-outline"
                value={
                  isTracking && todayPlan
                    ? scheduledStartName
                    : origin?.title
                }
                placeholder="انتخاب مبدأ"
                onPress={() => openSearch('origin')}
              />
              <View style={styles.divider} />
              <PlaceField
                label="مقصد"
                icon="location-outline"
                value={
                  isTracking && todayPlan
                    ? scheduledDestinationName
                    : destination?.title
                }
                placeholder="کجا می‌خواهید بروید؟"
                onPress={() => openSearch('destination')}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="جابه‌جایی مبدأ و مقصد"
              onPress={swapPlaces}
              disabled={isTracking && !!todayPlan}
              style={({ pressed }) => [
                styles.swapButton,
                isTracking && todayPlan && styles.swapButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="swap-vertical" size={18} color={RideColors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.mapControls}>
          {permission === 'denied' ? (
            <View style={styles.permissionBanner}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={RideColors.warning}
              />
              <Text style={styles.permissionText}>
                برای نمایش موقعیت، دسترسی مکان لازم است.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void Linking.openSettings()}
              >
                <Text style={styles.permissionAction}>تنظیمات</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="مرکز روی موقعیت من"
            disabled={!isTracking || !userLocation}
            onPress={() => {
              if (userLocation) {
                recenterTo(userLocation);
              }
            }}
            style={({ pressed }) => [
              styles.locateButton,
              pressed && styles.pressed,
              (!isTracking || !userLocation) && styles.locateButtonDisabled,
            ]}
          >
            <Ionicons name="locate" size={20} color={RideColors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 92 }]}>
        <View style={styles.panelHandle} />
        {renderOptions()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RideColors.background },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
  },
  searchCard: {
    backgroundColor: RideColors.surface,
    borderRadius: RideRadius.lg,
    borderWidth: 1,
    borderColor: RideColors.border,
    padding: 10,
    shadowColor: RideColors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fieldsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  fields: { flex: 1 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: RideColors.border,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: RideRadius.pill,
    borderWidth: 1,
    borderColor: RideColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RideColors.primaryMuted,
  },
  swapButtonDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  mapControls: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  permissionBanner: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: RideColors.warningSoft,
    borderRadius: RideRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  permissionText: {
    flex: 1,
    fontFamily: RideFonts.regular,
    fontSize: 12,
    color: '#7A5518',
    textAlign: 'right',
  },
  permissionAction: {
    fontFamily: RideFonts.semiBold,
    fontSize: 12,
    color: RideColors.primary,
  },
  locateButton: {
    width: 44,
    height: 44,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.surface,
    borderWidth: 1,
    borderColor: RideColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  locateButtonDisabled: { opacity: 0.5 },
  routeMarker: {
    width: 28,
    height: 28,
    borderRadius: RideRadius.pill,
    borderWidth: 3,
    borderColor: RideColors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '52%',
    backgroundColor: RideColors.surface,
    borderTopLeftRadius: RideRadius.xl,
    borderTopRightRadius: RideRadius.xl,
    paddingHorizontal: 16,
    paddingTop: 8,
    shadowColor: RideColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  panelHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.borderStrong,
    marginBottom: 10,
  },
  panelLoading: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  panelLoadingText: {
    fontFamily: RideFonts.regular,
    fontSize: 13,
    color: RideColors.textSecondary,
  },
  sectionTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 14,
    color: RideColors.text,
    textAlign: 'right',
    marginBottom: 8,
  },
  mapFeedback: {
    fontFamily: RideFonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: RideColors.textSecondary,
    textAlign: 'right',
    marginBottom: 8,
  },
  trackingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: RideColors.surfaceMuted,
    borderRadius: RideRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  trackingTexts: { flex: 1, gap: 2 },
  trackingTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 14,
    color: RideColors.text,
    textAlign: 'right',
  },
  trackingSubtitle: {
    fontFamily: RideFonts.regular,
    fontSize: 12,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  planBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: RideColors.primaryMuted,
    borderRadius: RideRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  planBannerText: {
    flex: 1,
    fontFamily: RideFonts.medium,
    fontSize: 12.5,
    color: RideColors.primaryStrong,
    textAlign: 'right',
  },
  planBannerManual: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: RideColors.warningSoft,
    borderRadius: RideRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  planBannerTextManual: {
    flex: 1,
    fontFamily: RideFonts.medium,
    fontSize: 12.5,
    color: '#7A5518',
    textAlign: 'right',
  },
  manualHint: {
    fontFamily: RideFonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: RideColors.textSecondary,
    textAlign: 'right',
    marginBottom: 10,
  },
  manualFields: {
    borderWidth: 1,
    borderColor: RideColors.border,
    borderRadius: RideRadius.md,
    backgroundColor: RideColors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  manualDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: RideColors.border,
    marginVertical: 2,
    marginHorizontal: 6,
  },
  manualPlanCta: { marginTop: 10 },
});
