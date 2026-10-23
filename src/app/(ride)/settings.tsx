import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BACKEND_REQUIREMENTS, MISSING_CAPABILITIES } from '@/api/capabilities';
import { API_BASE_URL, API_TIMEOUT_MS } from '@/api/config';
import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import { useAuth } from '@/features/auth/AuthProvider';
import { toFaDigits } from '@/utils/format';
import { PrimaryButton } from '@/components/ride/PrimaryButton';
import { ScreenHeader } from '@/components/ride/ScreenHeader';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { phone, signOut } = useAuth();

  const version = useMemo(
    () => Constants.expoConfig?.version ?? '1.0.0',
    [],
  );

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="تنظیمات"
        subtitle="تنظیمات برنامه و وضعیت اتصال به سرویس"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>حساب کاربری</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>شماره موبایل</Text>
            <Text style={styles.rowValue}>
              {phone ? toFaDigits(phone) : 'ثبت نشده'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>نسخه برنامه</Text>
            <Text style={styles.rowValue}>{toFaDigits(version)}</Text>
          </View>
        </View>

        <PrimaryButton
          label="خروج از حساب"
          variant="ghost"
          icon="log-out-outline"
          onPress={() => void signOut()}
        />

        <Text style={styles.sectionTitle}>اتصال به سرویس</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>آدرس سرویس</Text>
            <Text style={styles.rowValue} selectable>
              {API_BASE_URL}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>مهلت درخواست</Text>
            <Text style={styles.rowValue}>
              {toFaDigits(Math.round(API_TIMEOUT_MS / 1000))} ثانیه
            </Text>
          </View>
          <Text style={styles.note}>
            آدرس سرویس از متغیر محیطی EXPO_PUBLIC_API_BASE_URL خوانده می‌شود.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>قابلیت‌های فعال‌نشده سرویس</Text>
        <Text style={styles.note}>
          موارد زیر در مستندات Swagger موجود نیستند و به همین دلیل در برنامه به‌صورت
          «در دسترس نیست» نمایش داده می‌شوند.
        </Text>

        {MISSING_CAPABILITIES.map((capability) => (
          <View key={capability.id} style={styles.card}>
            <View style={styles.capabilityHead}>
              <Ionicons
                name="remove-circle-outline"
                size={17}
                color={RideColors.warning}
              />
              <Text style={styles.capabilityTitle}>{capability.title}</Text>
            </View>
            <Text style={styles.note}>{capability.reason}</Text>
            <View style={styles.contract}>
              <Text style={styles.contractText} selectable>
                {capability.contract.method} {capability.contract.path}
              </Text>
            </View>
          </View>
        ))}
        <Text style={styles.sectionTitle}>تصمیم‌ها و قابلیت‌های موردنیاز بک‌اند</Text>
        {BACKEND_REQUIREMENTS.map((requirement) => (
          <View key={requirement.id} style={styles.card}>
            <View style={styles.capabilityHead}>
              <Ionicons name="alert-circle-outline" size={17} color={RideColors.warning} />
              <Text style={styles.capabilityTitle}>{requirement.title}</Text>
            </View>
            <Text style={styles.note}>{requirement.reason}</Text>
            {requirement.requiredChanges.map((change) => (
              <Text key={change} style={styles.note}>
                • {change}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RideColors.background },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  sectionTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 14.5,
    color: RideColors.text,
    textAlign: 'right',
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    borderColor: RideColors.border,
    borderRadius: RideRadius.lg,
    backgroundColor: RideColors.surface,
    padding: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontFamily: RideFonts.regular,
    fontSize: 13,
    color: RideColors.textSecondary,
  },
  rowValue: {
    flex: 1,
    fontFamily: RideFonts.medium,
    fontSize: 13,
    color: RideColors.text,
    textAlign: 'right',
  },
  note: {
    fontFamily: RideFonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  capabilityHead: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  capabilityTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 13.5,
    color: RideColors.text,
  },
  contract: {
    borderRadius: RideRadius.md,
    backgroundColor: RideColors.surfaceMuted,
    padding: 10,
  },
  contractText: {
    fontFamily: RideFonts.medium,
    fontSize: 12,
    color: RideColors.text,
    textAlign: 'right',
  },
});
