import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { AppFonts, Colors } from '@/constants/theme';
import type { MatchOffer } from '@/features/dashboard/mock';
import { useOfferQueue } from '@/features/dashboard/OfferQueueProvider';
import { formatToman, toFaDigits } from '@/utils/format';
import AppMap from '@/components/map/AppMap';
import type { AppMapMarker, Coordinates } from '@/components/map/types';
import { useDailyRoute } from '@/features/trip/use-daily-route';
import { matchesSampleRoute } from '@/features/trip/route-matching';
import { PlaceField } from '@/components/ride/PlaceField';
import { PrimaryButton } from '@/components/ride/PrimaryButton';
import { hasValidCoordinates } from '@/features/trip/matching-state';
import { weekDayName } from '@/constants/transport';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const theme = Colors.light;
const DEFAULT_LOCATION: Coordinates = { latitude: 35.6892, longitude: 51.389 };

const QUICK_ACTIONS: { id: string; label: string; icon: IconName; route: string }[] = [
  { id: 'schedule', label: 'برنامه مسیر', icon: 'calendar-outline', route: '/schedule' },
  { id: 'detour', label: 'حد انحراف', icon: 'walk-outline', route: '/settings/detour' },
  { id: 'deliveries', label: 'تحویل‌ها', icon: 'file-tray-stacked-outline', route: '/deliveries' },
  { id: 'support', label: 'پشتیبانی', icon: 'chatbubble-ellipses-outline', route: '/support' },
];

export default function DashboardHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { remainingOffers, advanceOffer } = useOfferQueue();
  const daily = useDailyRoute();
  const { width } = useWindowDimensions();
  const wideLayout = width >= 900;
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const eligibleOffers = useMemo(() => daily.route && daily.preferences
    ? remainingOffers.filter((offer) => matchesSampleRoute(offer, daily.route!, daily.preferences!))
    : [], [daily.route, daily.preferences, remainingOffers]);
  const visibleOffer = eligibleOffers[0] ?? null;

  const markers = useMemo<AppMapMarker[]>(
    () => [...(userLocation
      ? [{ id: 'current-location', coordinate: userLocation, title: 'موقعیت فعلی شما' }]
      : []), ...(daily.route ?? []).map((coordinate, index, points) => ({
        id: `route-${index}`, coordinate,
        title: index === 0 ? 'مبدأ مسیر امروز' : index === points.length - 1 ? 'مقصد مسیر امروز' : 'ایستگاه مسیر',
      }))],
    [userLocation, daily.route],
  );

  const open = (path: string) => router.push(path as Href);

  const requestCurrentLocation = async () => {
    if (Platform.OS === 'web' || locationLoading) return;
    setLocationLoading(true);
    setLocationError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationError('برای دریافت موقعیت، اجازه‌ی دسترسی لازم است.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setLocationError('موقعیت دریافت نشد. GPS دستگاه را بررسی کنید.');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <AppMap
        style={styles.map}
        initialRegion={{ ...DEFAULT_LOCATION, latitudeDelta: 0.035, longitudeDelta: 0.035 }}
        region={userLocation ? { ...userLocation, latitudeDelta: 0.035, longitudeDelta: 0.035 } : undefined}
        onMapReady={() => setMapReady(true)}
        showsUserLocation={!!userLocation}
        markers={markers}
        fallbackTitle="هم‌مسیر در تهران"
        fallbackText="نقشه در اپ موبایل قابل تعامل است. پیشنهادهای این صفحه برای پیش‌نمایش هستند."
      />

      {Platform.OS !== 'web' && !mapReady ? (
        <View pointerEvents="none" style={[styles.mapLoading, { top: insets.top + 130 }]}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : null}

      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={[styles.topBar, { marginTop: insets.top + 10 }]}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Ionicons name="cube-outline" size={20} color={theme.onPrimary} />
            </View>
            <View>
              <Text style={styles.brandName}>هم‌مسیر</Text>
              <Text style={styles.brandCaption}>تهران · پایلوت</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <RoundAction icon="person-circle-outline" label="حساب کاربری" onPress={() => open('/(dashboard)/profile')} />
            <RoundAction icon="notifications-outline" label="اعلان‌ها" onPress={() => open('/notifications')} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="رفتن به موقعیت فعلی"
          disabled={Platform.OS === 'web' || locationLoading}
          onPress={() => void requestCurrentLocation()}
          style={({ pressed }) => [styles.locateButton, { top: insets.top + 70 }, pressed && styles.pressed]}
        >
          {locationLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Ionicons name="locate-outline" size={22} color={theme.primary} />
          )}
        </Pressable>

        <View
          style={[
            styles.sheet,
            wideLayout && styles.sheetWide,
            wideLayout
              ? { top: insets.top + 72, right: 20, bottom: insets.bottom + 82 }
              : { bottom: insets.bottom + 76 },
          ]}
        >
          <View style={styles.sheetHandle} />
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.availabilityRow}>
              <View style={styles.availabilityIcon}>
                <Ionicons name="navigate-circle-outline" size={24} color={theme.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.availabilityTitle}>مسیر {daily.enabled ? 'روشن' : 'خاموش'}</Text>
                <Text style={styles.availabilitySubtitle}>{daily.enabled ? 'بررسی برنامه فقط برای امروز' : 'برای بررسی برنامه‌ی امروز روشن کنید'}</Text>
              </View>
              <Switch
                accessibilityLabel="روشن و خاموش کردن مسیر"
                value={daily.enabled}
                onValueChange={(value) => value ? daily.start() : daily.stop()}
                trackColor={{ false: '#D7DFD9', true: '#A6D8B3' }}
                thumbColor={daily.enabled ? theme.primary : '#FFFFFF'}
              />
            </View>

            {daily.enabled && daily.status === 'loading' ? <ActivityIndicator accessibilityLabel="بررسی برنامه امروز" color={theme.primary} /> : null}
            {daily.enabled && daily.status === 'error' ? (
              <PrimaryButton label="بررسی دوباره برنامه امروز" onPress={daily.retry} />
            ) : null}
            {daily.enabled && daily.status === 'ready' && !daily.manual && daily.todayPlans.length > 0 && !daily.routeReady ? (
              <View style={styles.routeSetup}>
                <Text style={styles.sectionTitle}>امروز طبق کدام برنامه می‌روید؟</Text>
                {daily.todayPlans.map((plan) => {
                  const legs = [...plan.legs].sort((a, b) => a.sequence - b.sequence);
                  const time = plan.days.find((item) => item.dayOfWeek === new Date(daily.day).getDay() && item.isEnabled)?.departureTime.slice(0, 5);
                  return <View key={plan.id} style={styles.routeSetup}>
                    <Text style={styles.emptyTitle}>{plan.name} · {toFaDigits(time ?? '')}</Text>
                    <Text style={styles.emptyText}>{legs[0]?.startPlace} تا {legs[legs.length - 1]?.endPlace}</Text>
                    <PrimaryButton label="طبق این برنامه می‌روم" loading={daily.resolving} disabled={daily.resolving} onPress={() => void daily.confirmPlan(plan)} />
                  </View>;
                })}
                <PrimaryButton label="امروز مسیر دیگری می‌روم" variant="secondary" disabled={daily.resolving} onPress={daily.useManual} />
              </View>
            ) : null}
            {daily.enabled && daily.status === 'ready' && (daily.manual || daily.todayPlans.length === 0) && !daily.routeReady ? (
              <View style={styles.routeSetup}>
                <Text style={styles.sectionTitle}>{daily.manual ? 'مسیر دلخواه امروز' : `امروز (${weekDayName(new Date(daily.day).getDay())}) برنامه‌ای ندارید`}</Text>
                <Text style={styles.emptyText}>مبدأ و مقصد را روی نقشه انتخاب کنید یا نام مکان را جست‌وجو کنید.</Text>
                {(['origin', 'destination'] as const).map((target) => <View key={target}>
                  <PlaceField label={target === 'origin' ? 'مبدأ' : 'مقصد'} value={daily.trip[target]?.title} icon={target === 'origin' ? 'navigate-outline' : 'location-outline'} placeholder="جست‌وجو و انتخاب مکان" onPress={() => router.push({ pathname: '/(ride)/search', params: { target } })} />
                  <PrimaryButton label={target === 'origin' ? 'انتخاب مبدأ روی نقشه' : 'انتخاب مقصد روی نقشه'} variant="ghost" icon="map-outline" onPress={() => router.push({ pathname: '/(ride)/search', params: { target, mode: 'map' } })} />
                </View>)}
                <PrimaryButton label="تأیید مسیر و نمایش پیشنهادها" disabled={!hasValidCoordinates(daily.trip.origin) || !hasValidCoordinates(daily.trip.destination)} onPress={daily.confirmManual} />
              </View>
            ) : null}
            {daily.enabled && daily.routeReady ? (
              <View style={styles.routeSetup}>
                <Text style={styles.emptyTitle}>{daily.manual ? `${daily.trip.origin?.title} تا ${daily.trip.destination?.title}` : daily.todayPlans.find((plan) => plan.id === daily.trip.selectedPlanId)?.name}</Text>
                <Text style={styles.emptyText}>مسیر تأییدشده برای امروز · پیشنهادهای نمونه مطابق مقصد، جهت مسیر و حد انحراف شما</Text>
                <PrimaryButton label="تغییر مسیر امروز" variant="ghost" onPress={daily.useManual} />
              </View>
            ) : null}
            {daily.enabled && daily.error ? <Text accessibilityRole="alert" style={styles.locationError}>{daily.error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="ثبت بسته برای ارسال"
              onPress={() => open('/(dashboard)/send')}
              style={({ pressed }) => [styles.createOrderButton, pressed && styles.pressed]}
            >
              <View style={styles.createOrderIcon}>
                <Ionicons name="cube-outline" size={21} color={theme.onPrimary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.createOrderTitle}>ثبت بسته برای ارسال</Text>
                <Text style={styles.createOrderSubtitle}>مبدأ، مقصد و مشخصات بسته را وارد کنید</Text>
              </View>
              <Ionicons name="chevron-back" size={18} color={theme.onPrimary} />
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActions}
            >
              {QUICK_ACTIONS.map((action) => (
                <Pressable
                  key={action.id}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  onPress={() => open(action.route)}
                  style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon} size={21} color={theme.primary} />
                  </View>
                  <Text numberOfLines={1} style={styles.quickActionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                {visibleOffer ? 'پیشنهاد فعلی' : 'پیشنهادهای هم‌مسیر'}
              </Text>
              <Text style={styles.remainingCount}>
                {daily.routeReady ? `${toFaDigits(eligibleOffers.length)} مورد نمونه` : 'متوقف'}
              </Text>
            </View>

            {visibleOffer ? (
              <OfferCard
                offer={visibleOffer}
                onPress={() => open(`/matches/${visibleOffer.id}`)}
                onReject={() => advanceOffer(visibleOffer.id)}
              />
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="file-tray-outline" size={23} color={theme.primary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.emptyTitle}>
                    {daily.routeReady ? 'پیشنهاد متناسبی پیدا نشد' : 'پیشنهادها متوقف‌اند'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {daily.routeReady
                      ? 'در داده‌های نمونه، موردی مطابق مسیر و محدودیت انحراف شما وجود ندارد.'
                      : daily.enabled ? 'مسیر امروز را تأیید کنید تا پیشنهادهای متناسب نمایش داده شوند.' : 'مسیر را روشن کنید تا برنامه‌ی امروز بررسی شود.'}
                  </Text>
                </View>
              </View>
            )}

            {daily.routeReady ? <Text style={styles.emptyText}>پیشنهادها آزمایشی‌اند؛ نزدیکی به مسیر به‌صورت خط مستقیم بررسی می‌شود و زمان و پیاده‌روی اضافه، مقادیر نمونه‌اند.</Text> : null}
            {locationError ? <Text accessibilityRole="alert" style={styles.locationError}>{locationError}</Text> : null}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function RoundAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.roundAction, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={21} color={theme.text} />
    </Pressable>
  );
}

function OfferCard({ offer, onPress, onReject }: { offer: MatchOffer; onPress: () => void; onReject: () => void }) {
  return (
    <View style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <View style={styles.offerSymbol}>
          <Ionicons name="cube-outline" size={21} color={theme.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.offerTitle}>{offer.parcel}</Text>
          <Text style={styles.offerSender}>{offer.sender}</Text>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>{toFaDigits(offer.routeFit)}٪ جور</Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <RouteStop icon="radio-button-on-outline" label="دریافت" value={offer.pickupStop} />
        <View style={styles.routeConnector}>
          <View style={styles.routeLine} />
          <Ionicons name="arrow-back" size={14} color={theme.textSecondary} />
          <View style={styles.routeLine} />
        </View>
        <RouteStop icon="location-outline" label="تحویل" value={offer.dropoffStop} />
      </View>

      <View style={styles.metricsRow}>
        <Metric icon="time-outline" value={`${toFaDigits(offer.extraMinutes)} دقیقه اضافه`} />
        <Metric icon="walk-outline" value={`${toFaDigits(offer.extraWalkMeters)} متر پیاده`} />
      </View>

      <View style={styles.offerFooter}>
        <View style={styles.flex}>
          <Text style={styles.offerPrice}>{formatToman(offer.priceToman)}</Text>
          <Text style={styles.offerExpiry}>تحویل حدود {toFaDigits(offer.expectedDeliveryAt)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="رد پیشنهاد فعلی"
          onPress={onReject}
          style={({ pressed }) => [styles.rejectButton, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={19} color={theme.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
        >
          <Text style={styles.detailsButtonText}>بررسی</Text>
          <Ionicons name="chevron-back" size={16} color={theme.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function RouteStop({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.routeStop}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <View style={styles.flex}>
        <Text style={styles.routeLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.routeValue}>{value}</Text>
      </View>
    </View>
  );
}

function Metric({ icon, value }: { icon: IconName; value: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={15} color={theme.textSecondary} />
      <Text style={styles.metricText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  routeSetup: { gap: 10, padding: 12, borderRadius: 16, backgroundColor: '#F6F8F6' },
  screen: { flex: 1, backgroundColor: '#E7EFEA', overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFill, zIndex: 0 },
  mapLoading: { position: 'absolute', alignSelf: 'center', width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', zIndex: 2, elevation: 2 },
  topBar: { width: '100%', paddingHorizontal: 20, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#FFFFFF', shadowColor: '#193326', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  brandIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: AppFonts.bold, fontSize: 14, color: theme.text, textAlign: 'right' },
  brandCaption: { fontFamily: AppFonts.regular, fontSize: 10, color: theme.textSecondary, textAlign: 'right', marginTop: 1 },
  headerActions: { flexDirection: 'row-reverse', gap: 8 },
  roundAction: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#193326', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  locateButton: { position: 'absolute', left: 16, width: 46, height: 46, borderRadius: 16, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#193326', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  sheet: { position: 'absolute', width: '100%', maxWidth: 500, maxHeight: '74%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 9, paddingHorizontal: 16, backgroundColor: '#FFFFFF', shadowColor: '#193326', shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: -5 }, elevation: 18 },
  sheetWide: { width: 420, maxHeight: 740, borderRadius: 24, paddingTop: 12, paddingHorizontal: 18 },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#D8E1DC', marginBottom: 12 },
  sheetScroll: { flexGrow: 0 },
  sheetContent: { gap: 14, paddingBottom: 18 },
  availabilityRow: { minHeight: 62, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  availabilityIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#E9F6ED', alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  availabilityTitle: { fontFamily: AppFonts.bold, fontSize: 15, color: theme.text, textAlign: 'right' },
  availabilitySubtitle: { fontFamily: AppFonts.regular, fontSize: 11, color: theme.textSecondary, textAlign: 'right', marginTop: 3 },
  createOrderButton: { minHeight: 62, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: 15, backgroundColor: theme.primary },
  createOrderIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  createOrderTitle: { fontFamily: AppFonts.bold, fontSize: 13, color: theme.onPrimary, textAlign: 'right' },
  createOrderSubtitle: { fontFamily: AppFonts.regular, fontSize: 10, color: theme.onPrimaryMuted, textAlign: 'right', marginTop: 3 },
  quickActions: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 2 },
  quickAction: { width: 78, minHeight: 70, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, backgroundColor: '#F6F8F6' },
  quickActionIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { maxWidth: 72, fontFamily: AppFonts.medium, fontSize: 10, color: theme.text, textAlign: 'center' },
  sectionHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { fontFamily: AppFonts.bold, fontSize: 15, color: theme.text, textAlign: 'right' },
  remainingCount: { fontFamily: AppFonts.medium, fontSize: 11, color: theme.textSecondary },
  offerCard: { borderWidth: 1, borderColor: '#E7ECE8', borderRadius: 18, padding: 13, gap: 11, backgroundColor: '#FFFFFF' },
  offerHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  offerSymbol: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#E9F6ED', alignItems: 'center', justifyContent: 'center' },
  offerTitle: { fontFamily: AppFonts.bold, fontSize: 14, color: theme.text, textAlign: 'right' },
  offerSender: { fontFamily: AppFonts.regular, fontSize: 11, color: theme.textSecondary, textAlign: 'right', marginTop: 2 },
  matchBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: '#E9F6ED' },
  matchBadgeText: { fontFamily: AppFonts.bold, fontSize: 10, color: theme.primary },
  routeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  routeStop: { flex: 1, minWidth: 0, flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  routeLabel: { fontFamily: AppFonts.regular, fontSize: 10, color: theme.textSecondary, textAlign: 'right' },
  routeValue: { fontFamily: AppFonts.semiBold, fontSize: 12, color: theme.text, textAlign: 'right', marginTop: 2 },
  routeConnector: { width: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  routeLine: { width: 5, height: 1, backgroundColor: '#C9D4CD' },
  metricsRow: { flexDirection: 'row-reverse', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#E7ECE8', paddingVertical: 8 },
  metric: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  metricText: { fontFamily: AppFonts.medium, fontSize: 10, color: theme.textSecondary },
  offerFooter: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  offerPrice: { fontFamily: AppFonts.bold, fontSize: 15, color: theme.text, textAlign: 'right' },
  offerExpiry: { fontFamily: AppFonts.regular, fontSize: 10, color: theme.textSecondary, marginTop: 2, textAlign: 'right' },
  rejectButton: { width: 42, height: 42, borderWidth: 1, borderColor: '#E2E8E4', borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  detailsButton: { minWidth: 90, height: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: theme.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 5 },
  detailsButtonText: { fontFamily: AppFonts.bold, fontSize: 12, color: theme.onPrimary },
  emptyState: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: '#E7ECE8', borderRadius: 16, padding: 13, backgroundColor: '#F9FBF9' },
  emptyIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#E9F6ED', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: AppFonts.semiBold, fontSize: 13, color: theme.text, textAlign: 'right' },
  emptyText: { fontFamily: AppFonts.regular, fontSize: 11, lineHeight: 18, color: theme.textSecondary, textAlign: 'right', marginTop: 3 },
  commutePreview: { minHeight: 54, flexDirection: 'row-reverse', alignItems: 'center', gap: 9, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#E7ECE8', paddingTop: 10 },
  commuteIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F1F7F3', alignItems: 'center', justifyContent: 'center' },
  commuteEyebrow: { fontFamily: AppFonts.regular, fontSize: 10, color: theme.textSecondary, textAlign: 'right' },
  commuteTitle: { fontFamily: AppFonts.semiBold, fontSize: 11, color: theme.text, textAlign: 'right', marginTop: 2 },
  commuteTime: { fontFamily: AppFonts.bold, fontSize: 12, color: theme.text },
  locationError: { fontFamily: AppFonts.medium, fontSize: 11, color: theme.error, textAlign: 'right' },
  pressed: { opacity: 0.75 },
});
