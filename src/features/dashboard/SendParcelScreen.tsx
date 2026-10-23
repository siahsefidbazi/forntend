import { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeError } from '@/api/errors';
import { createParcelOrder, listParcelOrders } from '@/api/orders';
import type { ParcelOrderResponse } from '@/api/types';
import AppMap from '@/components/map/AppMap';
import type { AppMapMarker } from '@/components/map/types';
import { PlaceField } from '@/components/ride/PlaceField';
import { RideColors, RideFonts } from '@/constants/ride';
import { DEFAULT_REGION } from '@/features/trip/places';
import { useTrip } from '@/features/trip/TripProvider';
import { toEnglishDigits } from '@/utils/format';

export default function SendParcelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { origin, destination } = useTrip();
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('500');
  const [deliverBy, setDeliverBy] = useState('18:00');
  const [orders, setOrders] = useState<ParcelOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const markers = useMemo<AppMapMarker[]>(() => [
    ...(origin ? [{ id: 'pickup', coordinate: origin, title: 'مبدأ دریافت' }] : []),
    ...(destination ? [{ id: 'dropoff', coordinate: destination, title: 'مقصد تحویل' }] : []),
  ], [destination, origin]);

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await listParcelOrders(signal);
      if (!signal?.aborted) setOrders(result);
    } catch (caught) {
      if (!signal?.aborted) setError(describeError(caught));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void loadOrders(controller.signal);
      return () => controller.abort();
    }, [loadOrders]),
  );

  const choosePlace = (target: 'origin' | 'destination') => {
    router.push({ pathname: '/(ride)/search', params: { target } });
  };

  const handleSubmit = async () => {
    if (saving) return;
    setError('');
    const weightGrams = Number(toEnglishDigits(weight).replace(/[^0-9]/g, ''));
    if (!origin || !destination) {
      setError('برای ادامه، مبدأ و مقصد را انتخاب کنید.');
      return;
    }
    if (!description.trim() || !Number.isFinite(weightGrams) || weightGrams < 1 || weightGrams > 5000) {
      setError('شرح بسته و وزن معتبر (۱ تا ۵۰۰۰ گرم) وارد کنید.');
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(toEnglishDigits(deliverBy))) {
      setError('مهلت تحویل را با قالب ساعت:دقیقه وارد کنید.');
      return;
    }

    setSaving(true);
    try {
      const created = await createParcelOrder({
        origin: { title: origin.title, latitude: origin.latitude, longitude: origin.longitude },
        destination: { title: destination.title, latitude: destination.latitude, longitude: destination.longitude },
        parcelDescription: description.trim(),
        weightGrams,
        deliverByLocalTime: toEnglishDigits(deliverBy),
      });
      setOrders((current) => [created, ...current]);
      setDescription('');
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <AppMap
        style={styles.map}
        initialRegion={{ ...DEFAULT_REGION, latitudeDelta: 0.045, longitudeDelta: 0.045 }}
        markers={markers}
        fallbackTitle="انتخاب مسیر در تهران"
        fallbackText="برای انتخاب دقیق، مبدأ و مقصد را از فهرست جست‌وجو کنید."
      />

      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={[styles.header, { marginTop: insets.top + 10 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="بازگشت به داشبورد"
            onPress={() => router.replace('/(dashboard)/dashboard')}
            style={styles.backButton}
          >
            <Ionicons name="chevron-forward" size={20} color={RideColors.text} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>ثبت بسته برای ارسال</Text>
            <Text style={styles.subtitle}>مبدأ، مقصد و مشخصات بسته را وارد کنید</Text>
          </View>
        </View>

        <View style={[styles.sheet, { bottom: insets.bottom + 14 }]}>
          <View style={styles.handle} />
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.routeFields}>
              <PlaceField label="مبدأ دریافت" value={origin?.title} placeholder="انتخاب مبدأ" icon="radio-button-on" onPress={() => choosePlace('origin')} />
              <View style={styles.routeDivider} />
              <PlaceField label="مقصد تحویل" value={destination?.title} placeholder="انتخاب مقصد" icon="location" onPress={() => choosePlace('destination')} />
            </View>

            <View style={styles.formHeading}>
              <Text style={styles.formTitle}>مشخصات بسته</Text>
              <Text style={styles.formHint}>حداکثر ۵ کیلوگرم</Text>
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="مثلاً پاکت اسناد"
              placeholderTextColor={RideColors.textSecondary}
              maxLength={80}
              style={styles.input}
              textAlign="right"
              accessibilityLabel="شرح مرسوله"
            />
            <View style={styles.inlineFields}>
              <View style={styles.field}>
                <Text style={styles.label}>وزن (گرم)</Text>
                <TextInput
                  value={weight}
                  onChangeText={(value) => setWeight(toEnglishDigits(value).replace(/[^0-9]/g, '').slice(0, 5))}
                  keyboardType="number-pad"
                  style={styles.input}
                  textAlign="center"
                  accessibilityLabel="وزن مرسوله به گرم"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>تحویل تا امروز</Text>
                <TextInput
                  value={deliverBy}
                  onChangeText={setDeliverBy}
                  placeholder="18:00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={styles.input}
                  textAlign="center"
                  accessibilityLabel="مهلت تحویل امروز"
                />
              </View>
            </View>

            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Text style={styles.demoNotice}>ثبت سفارش نمایشی است و هنوز به قیمت‌گذاری یا حمل واقعی متصل نیست.</Text>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => [styles.submitButton, (pressed || saving) && styles.pressed]}
            >
              {saving ? <ActivityIndicator color={RideColors.textInverse} /> : (
                <>
                  <Ionicons name="cube-outline" size={19} color={RideColors.textInverse} />
                  <Text style={styles.submitText}>ثبت سفارش آزمایشی</Text>
                </>
              )}
            </Pressable>

            <View style={styles.ordersHeading}>
              <Text style={styles.formTitle}>سفارش‌های اخیر</Text>
              {loading ? <ActivityIndicator size="small" color={RideColors.primary} /> : null}
            </View>
            {orders.slice(0, 3).map((order) => (
              <View key={order.id} style={styles.orderRow}>
                <View style={styles.orderIcon}><Ionicons name="cube-outline" size={17} color={RideColors.primary} /></View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderTitle}>{order.parcelDescription}</Text>
                  <Text numberOfLines={1} style={styles.orderRoute}>{order.origin.title} ← {order.destination.title}</Text>
                </View>
                <Text style={styles.orderStatus}>{order.status === 'Open' ? 'در انتظار تطبیق' : order.status}</Text>
              </View>
            ))}
            {!loading && orders.length === 0 ? <Text style={styles.empty}>هنوز سفارشی ثبت نشده است.</Text> : null}
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E7EFEA', overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFill, zIndex: 0 },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', zIndex: 2, elevation: 2 },
  header: { width: '100%', maxWidth: 500, paddingHorizontal: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  backButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#193326', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  headerTitle: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.96)' },
  title: { fontFamily: RideFonts.bold, fontSize: 15, color: RideColors.text, textAlign: 'right' },
  subtitle: { fontFamily: RideFonts.regular, fontSize: 11, color: RideColors.textSecondary, textAlign: 'right', marginTop: 2 },
  sheet: { position: 'absolute', width: '100%', maxWidth: 500, maxHeight: '84%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 9, paddingHorizontal: 16, backgroundColor: '#FFFFFF', shadowColor: '#193326', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -5 }, elevation: 18 },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: RideColors.borderStrong, marginBottom: 12 },
  sheetScroll: { flexGrow: 0 },
  sheetContent: { gap: 11, paddingBottom: 16 },
  routeFields: { borderWidth: 1, borderColor: RideColors.border, borderRadius: 15, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#FFFFFF' },
  routeDivider: { height: StyleSheet.hairlineWidth, backgroundColor: RideColors.border, marginHorizontal: 8 },
  formHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  formTitle: { fontFamily: RideFonts.bold, fontSize: 14, color: RideColors.text, textAlign: 'right' },
  formHint: { fontFamily: RideFonts.regular, fontSize: 10, color: RideColors.textSecondary },
  inlineFields: { flexDirection: 'row-reverse', gap: 9 },
  field: { flex: 1, gap: 5 },
  label: { fontFamily: RideFonts.medium, fontSize: 11, color: RideColors.textSecondary, textAlign: 'right' },
  input: { minHeight: 42, borderRadius: 11, borderWidth: 1, borderColor: RideColors.border, paddingHorizontal: 11, color: RideColors.text, fontFamily: RideFonts.regular, backgroundColor: '#FAFCFA' },
  error: { fontFamily: RideFonts.medium, color: RideColors.danger, textAlign: 'right', fontSize: 12, lineHeight: 20 },
  demoNotice: { fontFamily: RideFonts.regular, color: RideColors.textSecondary, textAlign: 'right', fontSize: 10, lineHeight: 18 },
  submitButton: { minHeight: 48, borderRadius: 13, backgroundColor: RideColors.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { fontFamily: RideFonts.bold, color: RideColors.textInverse, fontSize: 14 },
  ordersHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  orderRow: { minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', gap: 9, borderTopWidth: StyleSheet.hairlineWidth, borderColor: RideColors.border, paddingVertical: 6 },
  orderIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: RideColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  orderInfo: { flex: 1, minWidth: 0 },
  orderTitle: { fontFamily: RideFonts.semiBold, fontSize: 12, color: RideColors.text, textAlign: 'right' },
  orderRoute: { fontFamily: RideFonts.regular, fontSize: 10, color: RideColors.textSecondary, textAlign: 'right', marginTop: 2 },
  orderStatus: { fontFamily: RideFonts.medium, fontSize: 10, color: RideColors.primary, textAlign: 'right' },
  empty: { fontFamily: RideFonts.regular, fontSize: 11, color: RideColors.textSecondary, textAlign: 'center', paddingVertical: 8 },
  pressed: { opacity: 0.75 },
});
