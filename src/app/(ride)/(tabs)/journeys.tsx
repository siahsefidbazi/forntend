import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeError } from '@/api/errors';
import type { TravelPlan } from '@/api/types';
import { listTravelPlans } from '@/api/travelPlans';
import { weekDayName } from '@/constants/transport';
import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import { buildSchedule, totalDuration } from '@/features/trip/schedule';
import { formatClock, formatDuration } from '@/utils/persian';
import { RouteCard } from '@/components/ride/RouteCard';
import { StateView } from '@/components/ride/StateView';

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await listTravelPlans(signal);
      if (signal?.aborted) {
        return;
      }
      setError('');
      setPlans(data ?? []);
      setStatus('ready');
    } catch (caught) {
      if (signal?.aborted) {
        return;
      }
      setError(describeError(caught));
      setStatus('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void load(controller.signal);

      return () => controller.abort();
    }, [load]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const sortedPlans = useMemo(
    () =>
      [...plans].sort((a, b) =>
        a.createdAtUtc < b.createdAtUtc ? 1 : a.createdAtUtc > b.createdAtUtc ? -1 : 0,
      ),
    [plans],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTexts}>
          <Text style={styles.title}>سفرهای من</Text>
          <Text style={styles.subtitle}>
            مسیرهای ذخیره‌شده شما در سرویس برنامه سفر
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="افزودن مسیر"
          onPress={() => router.push('/(ride)/plan-editor')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={22} color={RideColors.textInverse} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={RideColors.primary}
            colors={[RideColors.primary]}
          />
        }
      >
        {status === 'loading' && !sortedPlans.length ? (
          <StateView
            state="loading"
            title="در حال دریافت سفرها…"
            description="کمی صبر کنید."
          />
        ) : null}

        {status === 'error' ? (
          <StateView
            state="error"
            title="دریافت سفرها ممکن نشد"
            description={error}
            actionLabel="تلاش دوباره"
            onAction={() => void load()}
          />
        ) : null}

        {status === 'ready' && !sortedPlans.length ? (
          <StateView
            state="empty"
            icon="map-outline"
            title="هنوز سفری ثبت نشده"
            description="مسیرهای پرتکرارتان را ذخیره کنید تا سریع‌تر سفر کنید."
            actionLabel="افزودن مسیر"
            onAction={() => router.push('/(ride)/plan-editor')}
          />
        ) : null}

        {!!sortedPlans.length && (
          <View style={styles.list}>
            {sortedPlans.map((plan) => {
              const schedule = buildSchedule(plan);
              const firstLeg = schedule[0]?.leg;
              const day = plan.days.find((item) => item.isEnabled) ?? plan.days[0];

              return (
                <RouteCard
                  key={plan.id}
                  title={plan.name}
                  summary={
                    firstLeg
                      ? `${firstLeg.startPlace} به ${firstLeg.endPlace}`
                      : 'بدون قطعه'
                  }
                  schedule={
                    day
                      ? `${weekDayName(day.dayOfWeek)} · ${formatClock(day.departureTime)}`
                      : 'بدون زمان‌بندی'
                  }
                  duration={formatDuration(totalDuration(plan))}
                  isActive={plan.isActive}
                  onPress={() =>
                    router.push({ pathname: '/(ride)/trip/[id]', params: { id: plan.id } })
                  }
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RideColors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTexts: { flex: 1 },
  title: {
    fontFamily: RideFonts.bold,
    fontSize: 20,
    color: RideColors.text,
    textAlign: 'right',
  },
  subtitle: {
    fontFamily: RideFonts.regular,
    fontSize: 12.5,
    color: RideColors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  list: { gap: 10 },
});
