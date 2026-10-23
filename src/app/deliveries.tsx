import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { listMyDeliveries } from '@/api/deliveries';
import { describeError } from '@/api/errors';
import type { MyDelivery } from '@/api/types';
import { Panel, Screen, screenTheme } from '@/components/screen';
import { StateView } from '@/components/ride/StateView';
import { AppFonts } from '@/constants/theme';
import { formatToman, toFaDigits } from '@/utils/format';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<MyDelivery[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await listMyDeliveries(signal);
      if (!signal?.aborted) {
        setDeliveries(result);
        setStatus('ready');
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
    <Screen title="تحویل‌های من" subtitle="سفارش‌هایی که برای مسیرت پذیرفته‌ای">
      <Panel>
        <View style={styles.demoHeader}>
          <Ionicons name="information-circle-outline" size={18} color={screenTheme.warning} />
          <Text style={styles.demoText}>فهرست این نسخه نمایشی است؛ عملیات دریافت و تحویل تا اتصال API فعال نیست.</Text>
        </View>
      </Panel>
      {status === 'loading' ? <StateView state="loading" title="در حال دریافت تحویل‌ها" description="کمی صبر کنید." /> : null}
      {status === 'error' ? <StateView state="error" title="دریافت تحویل‌ها ناموفق بود" description={error} actionLabel="تلاش دوباره" onAction={() => void load()} /> : null}
      {status === 'ready' && deliveries.length === 0 ? (
        <StateView
          state="empty"
          icon="cube-outline"
          title="هنوز تحویلی نپذیرفته‌ای"
          description="پیشنهادهای هم‌مسیر را بررسی کن؛ پس از پذیرش، سفارش در این فهرست قرار می‌گیرد."
        />
      ) : null}
      {deliveries.map((delivery) => (
        <DeliveryCard key={delivery.id} delivery={delivery} />
      ))}
    </Screen>
  );
}

function DeliveryCard({ delivery }: { delivery: MyDelivery }) {
  return (
    <Panel>
      <View style={styles.cardHeader}>
        <View style={styles.parcelIcon}>
          <Ionicons name="cube-outline" size={20} color={screenTheme.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{delivery.parcel}</Text>
          <Text style={styles.sender}>{delivery.sender}</Text>
        </View>
        <View style={styles.status}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>آماده‌ی دریافت</Text>
        </View>
      </View>

      <View style={styles.route}>
        <RouteStop label="برداشت از" title={delivery.pickupStop} icon="radio-button-on-outline" />
        <View style={styles.routeLine} />
        <RouteStop label="تحویل به" title={delivery.dropoffStop} icon="location-outline" />
      </View>

      <View style={styles.metrics}>
        <Metric icon="time-outline" label={`${toFaDigits(delivery.extraMinutes)} دقیقه اضافه`} />
        <Metric icon="walk-outline" label={`${toFaDigits(delivery.extraWalkMeters)} متر پیاده`} />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Text style={styles.payout}>{formatToman(delivery.payoutToman)}</Text>
          <Text style={styles.reference}>کد سفارش · {delivery.matchId}</Text>
        </View>
        <View style={styles.modeBadge}>
          <Ionicons
            name={delivery.acceptanceMode === 'weekly_schedule' ? 'calendar-outline' : 'map-outline'}
            size={14}
            color={screenTheme.primary}
          />
          <Text style={styles.modeBadgeText}>
            {delivery.acceptanceMode === 'weekly_schedule' ? 'برنامه هفتگی' : 'مسیر دلخواه'}
          </Text>
        </View>
      </View>
    </Panel>
  );
}

function RouteStop({ label, title, icon }: { label: string; title: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={styles.routeStop}>
      <Ionicons name={icon} size={18} color={screenTheme.primary} />
      <View style={styles.flex}>
        <Text style={styles.routeLabel}>{label}</Text>
        <Text style={styles.routeTitle}>{title}</Text>
      </View>
    </View>
  );
}

function Metric({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={15} color={screenTheme.textSecondary} />
      <Text style={styles.metricText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  demoHeader: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8 },
  demoText: { flex: 1, fontFamily: AppFonts.regular, fontSize: 12, lineHeight: 20, color: screenTheme.textSecondary, textAlign: 'right' },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  parcelIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: screenTheme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  title: { fontFamily: AppFonts.bold, fontSize: 14, color: screenTheme.text, textAlign: 'right' },
  sender: { fontFamily: AppFonts.regular, fontSize: 11, color: screenTheme.textSecondary, textAlign: 'right', marginTop: 3 },
  status: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E8F6EE' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: screenTheme.success },
  statusText: { fontFamily: AppFonts.semiBold, fontSize: 10, color: screenTheme.success },
  route: { gap: 7, paddingVertical: 5 },
  routeStop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  routeLine: { width: 1, height: 12, backgroundColor: screenTheme.border, marginRight: 8 },
  routeLabel: { fontFamily: AppFonts.regular, fontSize: 10, color: screenTheme.textSecondary, textAlign: 'right' },
  routeTitle: { fontFamily: AppFonts.semiBold, fontSize: 13, color: screenTheme.text, textAlign: 'right', marginTop: 2 },
  metrics: { flexDirection: 'row-reverse', gap: 14, borderTopWidth: StyleSheet.hairlineWidth, borderColor: screenTheme.border, paddingTop: 10 },
  metric: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  metricText: { fontFamily: AppFonts.medium, fontSize: 11, color: screenTheme.textSecondary },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: screenTheme.border, paddingTop: 9 },
  footerInfo: { flex: 1, gap: 2 },
  payout: { fontFamily: AppFonts.bold, fontSize: 14, color: screenTheme.primary },
  reference: { fontFamily: AppFonts.regular, fontSize: 10, color: screenTheme.textSecondary },
  modeBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, backgroundColor: screenTheme.primaryLight },
  modeBadgeText: { fontFamily: AppFonts.semiBold, fontSize: 10, color: screenTheme.primary },
});
