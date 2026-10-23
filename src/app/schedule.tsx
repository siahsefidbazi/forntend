import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeError } from '@/api/errors';
import type { TravelPlan } from '@/api/types';
import { listTravelPlans } from '@/api/travelPlans';
import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import { weekDayName } from '@/constants/transport';
import { toFaDigits } from '@/utils/format';
import { StateView } from '@/components/ride/StateView';

export default function Schedule() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await listTravelPlans(signal);
      if (!signal?.aborted) {
        setPlans(result);
        setStatus('ready');
        setError('');
      }
    } catch (caught) {
      if (!signal?.aborted) {
        setError(describeError(caught));
        setStatus('error');
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void load(controller.signal);
      return () => controller.abort();
    }, [load]),
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="بازگشت به داشبورد"
          onPress={() => router.replace('/(dashboard)/dashboard')}
          style={styles.backButton}
        >
          <Ionicons name="chevron-forward" size={20} color={RideColors.text} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.title}>برنامه هفتگی</Text>
          <Text style={styles.subtitle}>مسیرهای تکرارشونده‌ی رفت‌وآمد شما</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="افزودن برنامه مسیر"
          onPress={() => router.push('/(ride)/plan-editor')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={22} color={RideColors.textInverse} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {status === 'loading' ? <StateView state="loading" title="در حال دریافت برنامه‌ها" description="کمی صبر کنید." /> : null}
        {status === 'error' ? <StateView state="error" title="دریافت برنامه‌ها ناموفق بود" description={error} actionLabel="تلاش دوباره" onAction={() => void load()} /> : null}
        {status === 'ready' && plans.length === 0 ? <StateView state="empty" icon="calendar-outline" title="برنامه‌ای ثبت نشده" description="مسیرهای رفت‌وآمدتان را برای بررسی پیشنهادهای هم‌مسیر ثبت کنید." actionLabel="افزودن برنامه" onAction={() => router.push('/(ride)/plan-editor')} /> : null}
        {plans.map((plan) => {
          const enabledDays = plan.days.filter((day) => day.isEnabled);
          return (
            <Pressable
              key={plan.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/(ride)/plan-editor', params: { id: plan.id } })}
              style={({ pressed }) => [styles.plan, pressed && styles.pressed]}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={[styles.badge, !plan.isActive && styles.inactive]}>{plan.isActive ? 'فعال' : 'متوقف'}</Text>
              </View>
              <Text style={styles.days}>
                {enabledDays.length
                  ? enabledDays.map((day) => `${weekDayName(day.dayOfWeek)} ${day.departureTime.slice(0, 5)}`).join('  ·  ')
                  : 'روز و ساعت مشخص نشده'}
              </Text>
              {plan.legs.map((leg) => (
                <Text key={leg.sequence} style={styles.route}>
                  {leg.startPlace} ← {leg.endPlace} · {toFaDigits(leg.estimatedDurationMinutes)} دقیقه
                </Text>
              ))}
            </Pressable>
          );
        })}
        <View style={styles.note}>
          <Text style={styles.noteText}>ویرایش روزهای تکرارشونده پشتیبانی می‌شود. لغو یا تغییر مسیر برای یک تاریخ خاص تا اضافه شدن API استثناها در دسترس نیست.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RideColors.background },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
  backButton: { width: 44, height: 44, borderRadius: RideRadius.md, borderWidth: 1, borderColor: RideColors.border, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  title: { fontFamily: RideFonts.bold, fontSize: 20, color: RideColors.text, textAlign: 'right' },
  subtitle: { fontFamily: RideFonts.regular, fontSize: 12, color: RideColors.textSecondary, textAlign: 'right', marginTop: 3 },
  addButton: { width: 44, height: 44, borderRadius: RideRadius.pill, backgroundColor: RideColors.primary, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, gap: 10 },
  plan: { borderWidth: 1, borderColor: RideColors.border, borderRadius: RideRadius.md, padding: 14, backgroundColor: RideColors.surface, gap: 8 },
  planHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  planName: { flex: 1, fontFamily: RideFonts.bold, fontSize: 15, color: RideColors.text, textAlign: 'right' },
  badge: { fontFamily: RideFonts.semiBold, fontSize: 11, color: RideColors.primary },
  inactive: { color: RideColors.textSecondary },
  days: { fontFamily: RideFonts.medium, fontSize: 12, lineHeight: 22, color: RideColors.primaryStrong, textAlign: 'right' },
  route: { fontFamily: RideFonts.regular, fontSize: 13, lineHeight: 21, color: RideColors.textSecondary, textAlign: 'right' },
  note: { paddingVertical: 12 },
  noteText: { fontFamily: RideFonts.regular, fontSize: 12, lineHeight: 21, color: RideColors.textSecondary, textAlign: 'right' },
  pressed: { opacity: 0.75 },
});
