import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { getMissingCapability } from '@/api/capabilities';
import type { TravelLeg, TravelPlan } from '@/api/types';
import { describeTransport } from '@/constants/transport';
import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import type { Place } from '@/features/trip/places';
import { formatClock, formatDuration } from '@/utils/persian';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './PrimaryButton';

export type RequestSheetProps = {
  visible: boolean;
  onClose: () => void;
  plan?: TravelPlan | null;
  leg?: TravelLeg | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  origin?: Place | null;
  destination?: Place | null;
};

/**
 * Trip summary shown before a ride request.
 *
 * The backend has no ride-booking endpoint yet, so the sheet states that
 * clearly (with the contract the service would need) and offers the action
 * that *is* available: saving the route for later trips.
 */
export function RequestSheet({
  visible,
  onClose,
  plan,
  leg,
  departureTime,
  arrivalTime,
  origin,
  destination,
}: RequestSheetProps) {
  const router = useRouter();

  const bookingCapability = getMissingCapability('ride-request');
  const fareCapability = getMissingCapability('fare-estimate');
  const transport = leg ? describeTransport(leg.transportType) : null;

  const rows: { label: string; value: string }[] = [
    {
      label: 'مسیر',
      value: plan?.name ?? (leg ? `${leg.startPlace} به ${leg.endPlace}` : '—'),
    },
    {
      label: 'قطعه سفر',
      value: leg
        ? `${leg.startPlace} به ${leg.endPlace}`
        : 'گزینه‌ای انتخاب نشده',
    },
    {
      label: 'وسیله',
      value: transport
        ? `${transport.label} (کد ${leg?.transportType})`
        : '—',
    },
    {
      label: 'مبدأ',
      value: origin?.title ?? 'موقعیت فعلی دستگاه',
    },
    {
      label: 'مقصد',
      value: destination?.title ?? 'انتخاب نشده',
    },
    {
      label: 'حرکت',
      value: departureTime ? formatClock(departureTime) : '—',
    },
    {
      label: 'رسیدن',
      value: arrivalTime ? formatClock(arrivalTime) : '—',
    },
    {
      label: 'مدت سفر',
      value: leg ? formatDuration(leg.estimatedDurationMinutes) : '—',
    },
  ];

  const handleSaveRoute = () => {
    onClose();

    router.push({
      pathname: '/(ride)/plan-editor',
      params: {
        name: plan?.name ?? (leg ? `${leg.startPlace} به ${leg.endPlace}` : 'مسیر جدید'),
        startPlace: leg?.startPlace ?? origin?.title ?? '',
        endPlace: leg?.endPlace ?? destination?.title ?? '',
        duration: leg ? String(leg.estimatedDurationMinutes) : '',
        transportType: leg ? String(leg.transportType) : '0',
      },
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="خلاصه سفر"
      subtitle="اطلاعات سفر را قبل از ثبت مرور کنید."
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue} numberOfLines={2}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.notice}>
          <View style={styles.noticeHead}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={RideColors.warning}
            />
            <Text style={styles.noticeTitle}>
              ثبت سفر آنلاین در این سرویس فعال نیست
            </Text>
          </View>

          <Text style={styles.noticeBody}>
            {bookingCapability?.reason}{' '}
            {fareCapability?.reason}
          </Text>

          {!!bookingCapability && (
            <View style={styles.contract}>
              <Text style={styles.contractLabel}>سرویس مورد نیاز بک‌اند</Text>
              <Text style={styles.contractText} selectable>
                {bookingCapability.contract.method} {bookingCapability.contract.path}
              </Text>
            </View>
          )}
        </View>

        <PrimaryButton
          label="افزودن این مسیر به مسیرهای من"
          icon="bookmark-outline"
          onPress={handleSaveRoute}
        />

        <PrimaryButton
          label="بستن"
          variant="ghost"
          onPress={onClose}
          style={styles.secondary}
        />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 380 },
  scrollContent: { gap: 12, paddingBottom: 4 },
  card: {
    borderWidth: 1,
    borderColor: RideColors.border,
    borderRadius: RideRadius.lg,
    padding: 14,
    gap: 10,
    backgroundColor: RideColors.surface,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowLabel: {
    width: 78,
    fontFamily: RideFonts.regular,
    fontSize: 13,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  rowValue: {
    flex: 1,
    fontFamily: RideFonts.medium,
    fontSize: 13,
    color: RideColors.text,
    textAlign: 'right',
  },
  notice: {
    borderRadius: RideRadius.lg,
    borderWidth: 1,
    borderColor: '#F0DFC4',
    backgroundColor: RideColors.warningSoft,
    padding: 14,
    gap: 8,
  },
  noticeHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  noticeTitle: {
    flex: 1,
    fontFamily: RideFonts.semiBold,
    fontSize: 13.5,
    color: '#8A5A12',
    textAlign: 'right',
  },
  noticeBody: {
    fontFamily: RideFonts.regular,
    fontSize: 12.5,
    lineHeight: 21,
    color: '#7A5518',
    textAlign: 'right',
  },
  contract: {
    borderRadius: RideRadius.md,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 10,
    gap: 4,
  },
  contractLabel: {
    fontFamily: RideFonts.medium,
    fontSize: 11,
    color: '#8A5A12',
    textAlign: 'right',
  },
  contractText: {
    fontFamily: RideFonts.medium,
    fontSize: 12,
    color: RideColors.text,
    textAlign: 'right',
  },
  secondary: { marginTop: 2 },
});
