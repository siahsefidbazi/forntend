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
import {
  MOCK_DASHBOARD,
  type CommuteLeg,
  type MatchOffer,
  type TransportMode,
} from '@/features/dashboard/mock';
import { useOfferQueue } from '@/features/dashboard/OfferQueueProvider';
import { formatToman, toFaDigits } from '@/utils/format';
import AppMap from '@/components/map/AppMap';
import type { AppMapMarker, Coordinates } from '@/components/map/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const theme = Colors.light;
const DEFAULT_LOCATION: Coordinates = { latitude: 35.6892, longitude: 51.389 };

const QUICK_ACTIONS: { id: string; label: string; icon: IconName; route: string }[] = [
  { id: 'schedule', label: 'برنامه مسیر', icon: 'calendar-outline', route: '/schedule' },
  { id: 'detour', label: 'حد پیاده‌روی', icon: 'walk-outline', route: '/settings/detour' },
  { id: 'deliveries', label: 'تحویل‌ها', icon: 'file-tray-stacked-outline', route: '/deliveries' },
  { id: 'support', label: 'پشتیبانی', icon: 'chatbubble-ellipses-outline', route: '/support' },
];

const MODE_ICON: Record<TransportMode, IconName> = {
  metro: 'train-outline',
  bus: 'bus-outline',
  walk: 'walk-outline',
  car: 'car-outline',
};

export default function DashboardHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentOffer, remainingCount, advanceOffer } = useOfferQueue();
  const { width } = useWindowDimensions();
  const wideLayout = width >= 900;
  const [showSamples, setShowSamples] = useState(true);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const nextLeg = MOCK_DASHBOARD.todayLegs.find((leg) => leg.status !== 'completed');
  const visibleOffer = showSamples ? currentOffer : null;

  const markers = useMemo<AppMapMarker[]>(
    () => userLocation
      ? [{ id: 'current-location', coordinate: userLocation, title: 'موقعیت فعلی شما' }]
      : [],
    [userLocation],
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
                <Text style={styles.availabilityTitle}>پیشنهادهای هم‌مسیر</Text>
                <Text style={styles.availabilitySubtitle}>داده‌های نمایشی · بدون سفارش واقعی</Text>
              </View>
              <Switch
                accessibilityLabel="نمایش پیشنهادهای نمونه"
                value={showSamples}
                onValueChange={setShowSamples}
                trackColor={{ false: '#D7DFD9', true: '#A6D8B3' }}
                thumbColor={showSamples ? theme.primary : '#FFFFFF'}
              />
            </View>

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
                {showSamples ? `${toFaDigits(remainingCount)} مورد` : 'خاموش'}
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
                    {showSamples ? 'پیشنهادی باقی نمانده' : 'پیشنهادها متوقف‌اند'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {showSamples
                      ? 'برنامه‌ی رفت‌وآمدت را بررسی کن یا برای ارسال بسته اقدام کن.'
                      : 'برای دیدن پیشنهادهای نمونه، نمایش را روشن کن.'}
                  </Text>
                </View>
              </View>
            )}

            {nextLeg ? <CommutePreview leg={nextLeg} onPress={() => open('/schedule')} /> : null}
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

function CommutePreview({ leg, onPress }: { leg: CommuteLeg; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.commutePreview, pressed && styles.pressed]}
    >
      <View style={styles.commuteIcon}>
        <Ionicons name={MODE_ICON[leg.mode]} size={19} color={theme.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.commuteEyebrow}>مسیر برنامه‌ریزی‌شده · نمونه</Text>
        <Text style={styles.commuteTitle}>{leg.from} تا {leg.to}</Text>
      </View>
      <Text style={styles.commuteTime}>{toFaDigits(leg.time)}</Text>
      <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
