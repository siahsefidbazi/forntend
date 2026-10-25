import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppMap from './AppMap';
import type { AppMapHandle, Coordinates, MapRegion } from './types';
import { PrimaryButton } from '@/components/ride/PrimaryButton';
import { RideColors, RideFonts } from '@/constants/ride';
import { hasValidCoordinates } from '@/features/trip/matching-state';
import type { Place } from '@/features/trip/places';
import { reverseMapAddress } from '@/features/trip/reverse-address';

const TEHRAN: MapRegion = { latitude: 35.7219, longitude: 51.3347, latitudeDelta: 0.4, longitudeDelta: 0.65 };

export function MapPlacePicker({ initialPlace, target, onConfirm }: {
  initialPlace?: Place | null; target: 'origin' | 'destination'; onConfirm: (place: Place) => void;
}) {
  const insets = useSafeAreaInsets();
  const map = useRef<AppMapHandle>(null);
  const [initialRegion] = useState<MapRegion>(() => hasValidCoordinates(initialPlace)
    ? { ...initialPlace, latitudeDelta: 0.012, longitudeDelta: 0.018 } : TEHRAN);
  const [selected, setSelected] = useState<Coordinates>(initialRegion);
  const [moving, setMoving] = useState(false);
  const [address, setAddress] = useState('');
  const [addressState, setAddressState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const currentRegion = useRef(initialRegion);
  const lookupGeneration = useRef(0);
  const label = target === 'origin' ? 'مبدأ' : 'مقصد';

  useEffect(() => {
    if (moving) return;
    let disposed = false;
    const controller = new AbortController();
    const generation = lookupGeneration.current;
    const timeout = setTimeout(() => controller.abort(), 15000);
    const timer = setTimeout(async () => {
      const stillCurrent = () => !disposed && !controller.signal.aborted && generation === lookupGeneration.current;
      try {
        let result = '';
        if (Platform.OS !== 'web') {
          try {
            // Native address lookup is preferred; map picking does not require GPS permission.
            const permission = await Location.getForegroundPermissionsAsync();
            if (Platform.OS !== 'android' || permission.granted) {
              const item = (await Location.reverseGeocodeAsync(selected))[0];
              if (item) result = [...new Set([item.city, item.district, item.street, item.streetNumber].filter(Boolean))].join('، ');
            }
          } catch { /* Use the shared provider when device geocoding is unavailable. */ }
        }
        if (!result && stillCurrent()) result = await reverseMapAddress(selected.latitude, selected.longitude, controller.signal, Platform.OS !== 'web');
        if (stillCurrent()) { setAddress(result); setAddressState('ready'); }
      } catch {
        if (stillCurrent()) setAddressState('error');
      } finally {
        clearTimeout(timeout);
      }
    }, 650);
    controller.signal.addEventListener('abort', () => {
      if (!disposed && generation === lookupGeneration.current) setAddressState('error');
    }, { once: true });
    return () => { disposed = true; clearTimeout(timer); clearTimeout(timeout); controller.abort(); };
  }, [selected, moving, retry]);

  const onMoveStart = useCallback(() => {
    lookupGeneration.current++;
    setMoving(true);
    setAddress('');
    setAddressState('loading');
  }, []);

  const onRegionChangeComplete = useCallback((region: MapRegion) => {
    currentRegion.current = region;
    setSelected({ latitude: region.latitude, longitude: region.longitude });
    setMoving(false);
    setAddress('');
    setAddressState('loading');
  }, []);

  const locate = async () => {
    if (locating) return;
    setLocating(true); setLocationError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('برای رفتن به موقعیت فعلی، دسترسی مکان را فعال کنید.');
      const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      map.current?.animateToRegion({ latitude: point.coords.latitude, longitude: point.coords.longitude,
        latitudeDelta: 0.012, longitudeDelta: 0.018 });
    } catch (caught) { setLocationError(caught instanceof Error ? caught.message : 'موقعیت دریافت نشد.'); }
    finally { setLocating(false); }
  };

  return <View style={styles.container}>
    <View style={styles.viewport}>
      <AppMap ref={map} style={StyleSheet.absoluteFill} initialRegion={initialRegion}
        onMoveStart={onMoveStart} onRegionChangeComplete={onRegionChangeComplete}
        onPress={(point) => map.current?.animateToRegion({ ...currentRegion.current, ...point })}
        showsMyLocationButton={false} />
      <View pointerEvents="none" style={styles.hintWrap}>
        <View style={styles.hint}><Ionicons name="hand-left-outline" size={16} color={RideColors.primary} />
          <Text style={styles.hintText}>نقشه را حرکت بده؛ نوک پین، {label} توست</Text></View>
      </View>
      <View pointerEvents="none" style={styles.centerPin}>
        <View style={[styles.pinBody, moving && styles.pinLift]}>
          <Ionicons name={target === 'origin' ? 'navigate' : 'flag'} size={22} color="white" />
        </View>
        <View style={[styles.pinTip, moving && styles.tipLift]} />
        <View style={[styles.pinShadow, moving && styles.shadowSmall]} />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="رفتن به موقعیت من" disabled={locating}
        onPress={() => void locate()} style={styles.locate}>
        {locating ? <ActivityIndicator color={RideColors.primary} /> : <Ionicons name="locate" size={24} color={RideColors.primary} />}
      </Pressable>
      <View pointerEvents="none" style={styles.coverage}><Text style={styles.coverageText}>تمام تهران · حرکت آزاد نقشه</Text></View>
    </View>
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.heading}><View style={styles.addressIcon}><Ionicons name="location" size={22} color={RideColors.primary} /></View>
        <View style={styles.addressContent}><Text style={styles.eyebrow}>آدرس {label} انتخاب‌شده</Text>
          <Text accessibilityLiveRegion="polite" style={styles.address} numberOfLines={3}>
            {moving ? 'نقطه‌ی دلخواهت را زیر پین قرار بده' : addressState === 'loading' ? 'در حال پیدا کردن آدرس…' : addressState === 'ready' ? address : 'آدرس دریافت نشد؛ نقطه روی نقشه مشخص است'}
          </Text></View>
        {addressState === 'loading' && !moving ? <ActivityIndicator color={RideColors.primary} /> : null}
      </View>
      {addressState === 'error' ? <Pressable accessibilityRole="button" onPress={() => { setAddressState('loading'); setRetry((value) => value + 1); }}><Text style={styles.retry}>دریافت دوباره آدرس</Text></Pressable> : null}
      <Text style={styles.coordinates}>{selected.latitude.toFixed(5)} , {selected.longitude.toFixed(5)}</Text>
      {locationError ? <Text accessibilityRole="alert" style={styles.error}>{locationError}</Text> : null}
      <PrimaryButton label={`تأیید ${label}`} icon="checkmark-circle-outline" disabled={moving || addressState === 'loading'}
        onPress={() => onConfirm({ id: `pin-${selected.latitude}-${selected.longitude}`, ...selected,
          title: address || `${label} انتخاب‌شده روی نقشه`, subtitle: address || `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`, source: 'pin' })} />
      {Platform.OS !== 'web' ? <Text style={styles.credit}>آدرس‌ها: © OpenStreetMap contributors</Text> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, viewport: { flex: 1, minHeight: 180, overflow: 'hidden', backgroundColor: '#E5ECE7' },
  hintWrap: { position: 'absolute', top: 16, left: 12, right: 74, alignItems: 'flex-end' },
  hint: { flexDirection: 'row-reverse', gap: 7, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 22, elevation: 3, shadowColor: '#183F2C', shadowOpacity: 0.1, shadowRadius: 14 },
  hintText: { fontFamily: RideFonts.medium, fontSize: 11, color: RideColors.text },
  centerPin: { position: 'absolute', left: '50%', top: '50%', width: 52, height: 72, marginLeft: -26, marginTop: -60, alignItems: 'center' },
  pinBody: { width: 48, height: 48, backgroundColor: RideColors.primary, borderRadius: 24, borderWidth: 4, borderColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 9, shadowColor: '#17472D', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, zIndex: 2 },
  pinLift: { transform: [{ translateY: -8 }] },
  pinTip: { width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: RideColors.primary, marginTop: -4, zIndex: 1 },
  tipLift: { transform: [{ translateY: -8 }] },
  pinShadow: { width: 18, height: 6, borderRadius: 9, backgroundColor: '#17472D44', marginTop: -2 }, shadowSmall: { transform: [{ scale: 0.7 }], opacity: 0.5 },
  locate: { position: 'absolute', right: 16, bottom: 34, width: 48, height: 48, backgroundColor: 'white', borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#183F2C', shadowOpacity: 0.14, shadowRadius: 12 },
  coverage: { position: 'absolute', bottom: 36, left: 16, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#FFFFFFED' },
  coverageText: { fontFamily: RideFonts.medium, fontSize: 10, color: RideColors.textSecondary },
  footer: { paddingHorizontal: 20, paddingTop: 20, gap: 12, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16, elevation: 8, shadowColor: '#183F2C', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: -4 } },
  heading: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' }, addressContent: { flex: 1 },
  addressIcon: { width: 44, height: 44, backgroundColor: RideColors.primarySoft, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: RideFonts.medium, fontSize: 11, color: RideColors.textSecondary, textAlign: 'right', marginBottom: 5 },
  address: { fontFamily: RideFonts.semiBold, fontSize: 14, lineHeight: 23, color: RideColors.text, textAlign: 'right' },
  coordinates: { fontFamily: RideFonts.regular, fontSize: 11, color: RideColors.textSecondary, textAlign: 'right', writingDirection: 'ltr' },
  retry: { fontFamily: RideFonts.medium, color: RideColors.primary, textAlign: 'right', paddingVertical: 6 },
  error: { fontFamily: RideFonts.regular, fontSize: 12, color: RideColors.danger, textAlign: 'right' },
  credit: { fontFamily: RideFonts.regular, fontSize: 9, textAlign: 'center', color: RideColors.textSecondary },
});
