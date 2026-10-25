import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMissingCapability } from '@/api/capabilities';
import { describeError } from '@/api/errors';
import type { TravelPlan } from '@/api/types';
import {
  deleteTravelPlan,
  getTravelPlan,
  setTravelPlanStatus,
} from '@/api/travelPlans';
import { weekDayName } from '@/constants/transport';
import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import { buildSchedule, totalDuration } from '@/features/trip/schedule';
import { formatClock, formatDuration, formatIsoDate } from '@/utils/persian';
import { toFaDigits } from '@/utils/format';
import { PrimaryButton } from '@/components/ride/PrimaryButton';
import { ScreenHeader } from '@/components/ride/ScreenHeader';
import { StateView } from '@/components/ride/StateView';

export default function TripDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';

  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const data = await getTravelPlan(id, signal);
        if (signal?.aborted) {
          return;
        }
        setError('');
        setPlan(data);
        setStatus('ready');
      } catch (caught) {
        if (signal?.aborted) {
          return;
        }
        setError(describeError(caught));
        setStatus('error');
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        return;
      }

      const controller = new AbortController();
      void load(controller.signal);

      return () => controller.abort();
    }, [id, load]),
  );

  const handleToggle = useCallback(async () => {
    if (!plan || working) {
      return;
    }

    setWorking(true);

    try {
      const updated = await setTravelPlanStatus(plan.id, {
        isActive: !plan.isActive,
      });
      setPlan(updated);
    } catch (caught) {
      Alert.alert('خطا', describeError(caught));
    } finally {
      setWorking(false);
    }
  }, [plan, working]);

  const handleDelete = useCallback(() => {
    if (!plan || working) {
      return;
    }

    Alert.alert(
      'حذف مسیر',
      `مسیر «${plan.name}» حذف می‌شود. این عمل بازگشت‌پذیر نیست.`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            setWorking(true);
            try {
              await deleteTravelPlan(plan.id);
              router.back();
            } catch (caught) {
              Alert.alert('خطا', describeError(caught));
            } finally {
              setWorking(false);
            }
          },
        },
      ],
    );
  }, [plan, router, working]);

  const schedule = buildSchedule(plan);
  const trackingCapability = getMissingCapability('ride-tracking');

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={plan?.name ?? 'جزئیات سفر'}
        subtitle={plan ? `ساخته‌شده در ${formatIsoDate(plan.createdAtUtc)}` : undefined}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!id ? (
          <StateView
            state="error"
            title="شناسه سفر نامعتبر است"
            description="آدرس سفر کامل نیست. دوباره از فهرست سفرها انتخاب کنید."
          />
        ) : null}

        {!!id && status === 'loading' && (
          <StateView state="loading" title="در حال دریافت جزئیات…" />
        )}

        {!!id && status === 'error' && (
          <StateView
            state="error"
            title="دریافت جزئیات ممکن نشد"
            description={error}
            actionLabel="تلاش دوباره"
            onAction={() => void load()}
          />
        )}

        {status === 'ready' && !!plan && (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>مدت کل</Text>
                <Text style={styles.summaryValue}>
                  {formatDuration(totalDuration(plan))}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>تعداد قطعات</Text>
                <Text style={styles.summaryValue}>
                  {toFaDigits(plan.legs.length)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>وضعیت</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: plan.isActive ? RideColors.primary : RideColors.textSecondary },
                  ]}
                >
                  {plan.isActive ? 'فعال' : 'غیرفعال'}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>زمان‌بندی</Text>
            <View style={styles.card}>
              {plan.days.length ? (
                plan.days.map((day) => (
                  <View key={`${day.dayOfWeek}-${day.departureTime}`} style={styles.dayRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={RideColors.textSecondary}
                    />
                    <Text style={styles.dayText}>
                      {weekDayName(day.dayOfWeek)}
                    </Text>
                    <Text style={styles.dayTime}>
                      {formatClock(day.departureTime)}
                    </Text>
                    <View
                      style={[
                        styles.dayBadge,
                        day.isEnabled ? styles.dayBadgeOn : styles.dayBadgeOff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayBadgeText,
                          {
                            color: day.isEnabled
                              ? RideColors.primary
                              : RideColors.textSecondary,
                          },
                        ]}
                      >
                        {day.isEnabled ? 'فعال' : 'غیرفعال'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>برای این مسیر زمانی ثبت نشده است.</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>قطعات سفر</Text>
            <View style={styles.card}>
              {schedule.map((item, index) => (
                <View key={`${item.leg.sequence}-${index}`} style={styles.legRow}>
                  <View style={styles.timeline}>
                    <View style={styles.timelineDot} />
                    {index < schedule.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>

                  <View style={styles.legBody}>
                    <Text style={styles.legTitle}>
                      {item.leg.startPlace} به {item.leg.endPlace}
                    </Text>
                    <Text style={styles.legMeta}>
                      {formatDuration(item.leg.estimatedDurationMinutes)} · کد حمل‌ونقل{' '}
                      {item.leg.transportType}
                    </Text>
                    {!!item.departureClock && (
                      <Text style={styles.legTimes}>
                        حرکت {formatClock(item.departureClock)} — رسیدن{' '}
                        {formatClock(item.arrivalClock)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.notice}>
              <View style={styles.noticeHead}>
                <Ionicons
                  name="information-circle-outline"
                  size={17}
                  color={RideColors.info}
                />
                <Text style={styles.noticeTitle}>پیگیری زنده سفر</Text>
              </View>
              <Text style={styles.noticeText}>
                {trackingCapability?.reason} زمان‌بندی بالا بر اساس زمان حرکت و مدت
                تخمینی هر قطعه در سرویس محاسبه شده است.
              </Text>
              {!!trackingCapability && (
                <Text style={styles.contract} selectable>
                  {trackingCapability.contract.method}{' '}
                  {trackingCapability.contract.path}
                </Text>
              )}
            </View>

            <View style={styles.actionsRow}>
              <PrimaryButton
                label={plan.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                variant="secondary"
                loading={working}
                onPress={() => void handleToggle()}
                style={styles.flex}
              />
              <PrimaryButton
                label="ویرایش"
                variant="ghost"
                icon="create-outline"
                onPress={() =>
                  router.push({
                    pathname: '/(ride)/plan-editor',
                    params: { id: plan.id },
                  })
                }
                style={styles.flex}
              />
            </View>

            <PrimaryButton
              label="حذف مسیر"
              variant="danger"
              icon="trash-outline"
              onPress={handleDelete}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RideColors.background },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  summaryCard: {
    borderWidth: 1,
    borderColor: RideColors.border,
    borderRadius: RideRadius.lg,
    backgroundColor: RideColors.surface,
    padding: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: RideFonts.regular,
    fontSize: 13,
    color: RideColors.textSecondary,
  },
  summaryValue: {
    fontFamily: RideFonts.semiBold,
    fontSize: 13.5,
    color: RideColors.text,
  },
  sectionTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 14,
    color: RideColors.text,
    textAlign: 'right',
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: RideColors.border,
    borderRadius: RideRadius.lg,
    backgroundColor: RideColors.surface,
    padding: 14,
    gap: 10,
  },
  dayRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  dayText: {
    fontFamily: RideFonts.medium,
    fontSize: 13,
    color: RideColors.text,
  },
  dayTime: {
    fontFamily: RideFonts.medium,
    fontSize: 13,
    color: RideColors.textSecondary,
  },
  dayBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RideRadius.pill,
  },
  dayBadgeOn: { backgroundColor: RideColors.primarySoft },
  dayBadgeOff: { backgroundColor: RideColors.surfaceMuted },
  dayBadgeText: { fontFamily: RideFonts.medium, fontSize: 11 },
  emptyText: {
    fontFamily: RideFonts.regular,
    fontSize: 13,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  legRow: { flexDirection: 'row-reverse', gap: 12 },
  timeline: { width: 16, alignItems: 'center' },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.primary,
    marginTop: 5,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: RideColors.border,
    marginTop: 2,
  },
  legBody: { flex: 1, paddingBottom: 10 },
  legTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 14,
    color: RideColors.text,
    textAlign: 'right',
  },
  legMeta: {
    fontFamily: RideFonts.regular,
    fontSize: 12,
    color: RideColors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  legTimes: {
    fontFamily: RideFonts.medium,
    fontSize: 12,
    color: RideColors.primary,
    textAlign: 'right',
    marginTop: 4,
  },
  notice: {
    borderRadius: RideRadius.lg,
    borderWidth: 1,
    borderColor: '#D6E2FF',
    backgroundColor: RideColors.infoSoft,
    padding: 14,
    gap: 6,
  },
  noticeHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  noticeTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 13.5,
    color: '#1D4ED8',
  },
  noticeText: {
    fontFamily: RideFonts.regular,
    fontSize: 12.5,
    lineHeight: 21,
    color: '#1E40AF',
    textAlign: 'right',
  },
  contract: {
    fontFamily: RideFonts.medium,
    fontSize: 12,
    color: RideColors.text,
    textAlign: 'right',
  },
  actionsRow: { flexDirection: 'row-reverse', gap: 10 },
  flex: { flex: 1 },
});
