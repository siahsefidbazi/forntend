import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeError } from '@/api/errors';
import type { TravelPlan } from '@/api/types';
import {
  createTravelPlan,
  getTravelPlan,
  updateTravelPlan,
} from '@/api/travelPlans';
import { WEEK_DAY_OPTIONS, weekDayName } from '@/constants/transport';
import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import { toEnglishDigits, toFaDigits } from '@/utils/format';
import { PrimaryButton } from '@/components/ride/PrimaryButton';
import { ScreenHeader } from '@/components/ride/ScreenHeader';

type DayDraft = {
  key: string;
  dayOfWeek: number;
  departureTime: string;
  isEnabled: boolean;
};

type LegDraft = {
  key: string;
  sequence: number;
  transportType: number;
  startPlace: string;
  endPlace: string;
  estimatedDurationMinutes: number;
};

let draftCounter = 0;
const nextKey = () => `draft-${(draftCounter += 1)}`;

function normalizeTime(value: string): string {
  const digits = toEnglishDigits(value).replace(/\D/g, '').slice(0, 4);

  if (digits.length <= 2) {
    return digits.padStart(2, '0');
  }

  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export default function PlanEditorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    name?: string | string[];
    startPlace?: string | string[];
    endPlace?: string | string[];
    duration?: string | string[];
    transportType?: string | string[];
  }>();

  const param = (key: 'id' | 'name' | 'startPlace' | 'endPlace' | 'duration' | 'transportType') => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? '';
  };

  const editingId = param('id');

  const [name, setName] = useState(param('name'));
  const [days, setDays] = useState<DayDraft[]>([]);
  const [legs, setLegs] = useState<LegDraft[]>(() => {
    if (editingId) {
      return [];
    }

    const startPlace = param('startPlace');
    const endPlace = param('endPlace');
    const duration = Number(param('duration'));
    const transportType = Number(param('transportType'));

    if (!startPlace && !endPlace) {
      return [];
    }

    return [
      {
        key: nextKey(),
        sequence: 1,
        transportType: Number.isFinite(transportType) ? transportType : 0,
        startPlace,
        endPlace,
        estimatedDurationMinutes: Number.isFinite(duration) ? duration : 0,
      },
    ];
  });
  const [loading, setLoading] = useState(!!editingId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editingId) {
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const plan: TravelPlan = await getTravelPlan(editingId, controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        setName(plan.name);
        setDays(
          plan.days.map((day) => ({
            key: nextKey(),
            dayOfWeek: day.dayOfWeek,
            departureTime: day.departureTime.slice(0, 5),
            isEnabled: day.isEnabled,
          })),
        );
        setLegs(
          plan.legs.map((leg) => ({
            key: nextKey(),
            sequence: leg.sequence,
            transportType: leg.transportType,
            startPlace: leg.startPlace,
            endPlace: leg.endPlace,
            estimatedDurationMinutes: leg.estimatedDurationMinutes,
          })),
        );
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(describeError(caught));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [editingId]);

  const updateDay = useCallback((key: string, patch: Partial<DayDraft>) => {
    setDays((current) =>
      current.map((day) => (day.key === key ? { ...day, ...patch } : day)),
    );
  }, []);

  const updateLeg = useCallback((key: string, patch: Partial<LegDraft>) => {
    setLegs((current) =>
      current.map((leg) => (leg.key === key ? { ...leg, ...patch } : leg)),
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (saving) {
      return;
    }

    setError('');

    if (!name.trim()) {
      setError('نام مسیر را وارد کنید.');
      return;
    }

    if (!legs.length) {
      setError('حداقل یک قطعه سفر اضافه کنید.');
      return;
    }

    const invalidLeg = legs.find(
      (leg) => !leg.startPlace.trim() || !leg.endPlace.trim(),
    );
    if (invalidLeg) {
      setError('مبدأ و مقصد هر قطعه باید مشخص باشد.');
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      days: days.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        departureTime: day.departureTime.length === 5
          ? `${day.departureTime}:00`
          : day.departureTime,
      })),
      legs: legs.map((leg, index) => ({
        sequence: index + 1,
        transportType: leg.transportType,
        startPlace: leg.startPlace.trim(),
        endPlace: leg.endPlace.trim(),
        estimatedDurationMinutes: leg.estimatedDurationMinutes,
      })),
    };

    try {
      if (editingId) {
        await updateTravelPlan(editingId, payload);
      } else {
        await createTravelPlan(payload);
      }

      router.back();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setSaving(false);
    }
  }, [days, editingId, legs, name, router, saving]);

  const totalMinutes = useMemo(
    () =>
      legs.reduce((sum, leg) => sum + (leg.estimatedDurationMinutes || 0), 0),
    [legs],
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 60}
    >
      <ScreenHeader
        title={editingId ? 'ویرایش مسیر' : 'مسیر جدید'}
        subtitle="اطلاعات مسیر برای نمایش گزینه‌های سفر استفاده می‌شود."
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={styles.label}>نام مسیر</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="مثلاً رفت و برگشت محل کار"
            placeholderTextColor={RideColors.textSecondary}
            textAlign="right"
            style={styles.input}
            accessibilityLabel="نام مسیر"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>زمان‌بندی</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setDays((current) => [
                ...current,
                {
                  key: nextKey(),
                  dayOfWeek: 6,
                  departureTime: '07:30',
                  isEnabled: true,
                },
              ])
            }
            style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={16} color={RideColors.primary} />
            <Text style={styles.addRowText}>افزودن روز</Text>
          </Pressable>
        </View>

        {days.map((day) => (
          <View key={day.key} style={styles.card}>
            <View style={styles.dayChips}>
              {WEEK_DAY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: day.dayOfWeek === option.value }}
                  onPress={() => updateDay(day.key, { dayOfWeek: option.value })}
                  style={({ pressed }) => [
                    styles.dayChip,
                    day.dayOfWeek === option.value && styles.dayChipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      day.dayOfWeek === option.value && styles.dayChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.rowBetween}>
              <View style={styles.timeField}>
                <Text style={styles.label}>ساعت حرکت</Text>
                <TextInput
                  value={day.departureTime}
                  onChangeText={(value) =>
                    updateDay(day.key, { departureTime: normalizeTime(value) })
                  }
                  placeholder="۰۷:۳۰"
                  placeholderTextColor={RideColors.textSecondary}
                  keyboardType="numeric"
                  textAlign="right"
                  style={styles.input}
                  accessibilityLabel={`ساعت حرکت ${weekDayName(day.dayOfWeek)}`}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="حذف روز"
                onPress={() =>
                  setDays((current) => current.filter((item) => item.key !== day.key))
                }
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
              >
                <Ionicons name="trash-outline" size={18} color={RideColors.danger} />
              </Pressable>
            </View>
          </View>
        ))}

        {!days.length && (
          <Text style={styles.hint}>
            بدون زمان‌بندی هم می‌توانید مسیر ذخیره کنید.
          </Text>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>قطعات سفر</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setLegs((current) => [
                ...current,
                {
                  key: nextKey(),
                  sequence: current.length + 1,
                  transportType: 0,
                  startPlace: '',
                  endPlace: '',
                  estimatedDurationMinutes: 0,
                },
              ])
            }
            style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={16} color={RideColors.primary} />
            <Text style={styles.addRowText}>افزودن قطعه</Text>
          </Pressable>
        </View>

        {legs.map((leg) => (
          <View key={leg.key} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.legTitle}>
                قطعه {toFaDigits(leg.sequence)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="حذف قطعه"
                onPress={() =>
                  setLegs((current) => current.filter((item) => item.key !== leg.key))
                }
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
              >
                <Ionicons name="trash-outline" size={18} color={RideColors.danger} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>مبدأ</Text>
              <TextInput
                value={leg.startPlace}
                onChangeText={(value) => updateLeg(leg.key, { startPlace: value })}
                placeholder="مثلاً میدان ولیعصر"
                placeholderTextColor={RideColors.textSecondary}
                textAlign="right"
                style={styles.input}
                accessibilityLabel="مبدأ قطعه"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>مقصد</Text>
              <TextInput
                value={leg.endPlace}
                onChangeText={(value) => updateLeg(leg.key, { endPlace: value })}
                placeholder="مثلاً میدان انقلاب"
                placeholderTextColor={RideColors.textSecondary}
                textAlign="right"
                style={styles.input}
                accessibilityLabel="مقصد قطعه"
              />
            </View>

            <View style={styles.inlineFields}>
              <View style={[styles.field, styles.flex]}>
                <Text style={styles.label}>مدت (دقیقه)</Text>
                <TextInput
                  value={String(leg.estimatedDurationMinutes)}
                  onChangeText={(value) =>
                    updateLeg(leg.key, {
                      estimatedDurationMinutes:
                        Number(toEnglishDigits(value).replace(/\D/g, '')) || 0,
                    })
                  }
                  keyboardType="numeric"
                  textAlign="right"
                  style={styles.input}
                  accessibilityLabel="مدت تخمینی قطعه"
                />
              </View>

              <View style={[styles.field, styles.flex]}>
                <Text style={styles.label}>کد حمل‌ونقل</Text>
                <TextInput
                  value={String(leg.transportType)}
                  onChangeText={(value) =>
                    updateLeg(leg.key, {
                      transportType:
                        Number(toEnglishDigits(value).replace(/\D/g, '')) || 0,
                    })
                  }
                  keyboardType="numeric"
                  textAlign="right"
                  style={styles.input}
                  accessibilityLabel="کد نوع حمل‌ونقل"
                />
              </View>
            </View>

            <Text style={styles.hint}>
              مقادیر «کد حمل‌ونقل» باید با enum سرویس یکسان باشند؛ این enum در
              مستندات Swagger منتشر نشده است.
            </Text>
          </View>
        ))}

        {!legs.length && (
          <Text style={styles.hint}>
            بدون قطعه، مسیر در گزینه‌های سفر نمایش داده نمی‌شود.
          </Text>
        )}

        {!!legs.length && (
          <Text style={styles.totalText}>
            مدت کل مسیر: {toFaDigits(totalMinutes)} دقیقه
          </Text>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton
          label={editingId ? 'ذخیره تغییرات' : 'ذخیره مسیر'}
          loading={saving || loading}
          disabled={loading}
          onPress={() => void handleSubmit()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RideColors.background },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  field: { gap: 6 },
  flex: { flex: 1 },
  label: {
    fontFamily: RideFonts.medium,
    fontSize: 12.5,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  input: {
    minHeight: 48,
    borderRadius: RideRadius.md,
    borderWidth: 1,
    borderColor: RideColors.border,
    backgroundColor: RideColors.surfaceMuted,
    paddingHorizontal: 14,
    fontFamily: RideFonts.medium,
    fontSize: 14,
    color: RideColors.text,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 14.5,
    color: RideColors.text,
  },
  addRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.primarySoft,
  },
  addRowText: {
    fontFamily: RideFonts.medium,
    fontSize: 12.5,
    color: RideColors.primary,
  },
  pressed: { opacity: 0.7 },
  card: {
    borderWidth: 1,
    borderColor: RideColors.border,
    borderRadius: RideRadius.lg,
    backgroundColor: RideColors.surface,
    padding: 14,
    gap: 12,
  },
  dayChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RideRadius.pill,
    borderWidth: 1,
    borderColor: RideColors.border,
    backgroundColor: RideColors.surfaceMuted,
  },
  dayChipSelected: {
    backgroundColor: RideColors.primary,
    borderColor: RideColors.primary,
  },
  dayChipText: {
    fontFamily: RideFonts.medium,
    fontSize: 12,
    color: RideColors.textSecondary,
  },
  dayChipTextSelected: { color: RideColors.textInverse },
  rowBetween: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: 10,
  },
  timeField: { flex: 1, gap: 6 },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: RideRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RideColors.dangerSoft,
  },
  legTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 13.5,
    color: RideColors.text,
  },
  inlineFields: { flexDirection: 'row-reverse', gap: 10 },
  hint: {
    fontFamily: RideFonts.regular,
    fontSize: 11.5,
    lineHeight: 20,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  totalText: {
    fontFamily: RideFonts.medium,
    fontSize: 13,
    color: RideColors.text,
    textAlign: 'right',
  },
  error: {
    fontFamily: RideFonts.regular,
    fontSize: 12.5,
    color: RideColors.danger,
    textAlign: 'right',
  },
});
