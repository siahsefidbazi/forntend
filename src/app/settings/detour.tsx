import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { describeError } from '@/api/errors';
import { getDetourPreferences, updateDetourPreferences } from '@/api/detourPreferences';
import type { DetourPreferences } from '@/api/types';
import { Panel, Screen, screenTheme } from '@/components/screen';
import { AppFonts } from '@/constants/theme';

const DEFAULTS: DetourPreferences = {
  candidateRadiusKm: 5,
  maxExtraMinutes: 12,
  maxExtraWalkingMeters: 900,
};

const QUICK_CHOICES = {
  candidateRadiusKm: [
    { value: 1, label: '۱ km' },
    { value: 3, label: '۳ km' },
    { value: 5, label: '۵ km' },
  ],
  maxExtraMinutes: [
    { value: 5, label: '۵ دقیقه' },
    { value: 10, label: '۱۰ دقیقه' },
    { value: 15, label: '۱۵ دقیقه' },
  ],
  maxExtraWalkingMeters: [
    { value: 300, label: '۳۰۰ متر' },
    { value: 500, label: '۵۰۰ متر' },
    { value: 900, label: '۹۰۰ متر' },
    { value: 1500, label: '۱٫۵ km' },
  ],
} as const;

export default function DetourSettings() {
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void getDetourPreferences(controller.signal).then((value) => {
        if (!controller.signal.aborted) setPreferences(value);
      }).catch((caught) => {
        if (!controller.signal.aborted) setError(describeError(caught));
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
      return () => controller.abort();
    }, []),
  );

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      setPreferences(await updateDetourPreferences(preferences));
      setSaved(true);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setSaving(false);
    }
  };

  const setNumber = (key: keyof DetourPreferences, value: string) => {
    const parsed = Number(value.replace(/[^0-9]/g, ''));
    if (Number.isFinite(parsed)) setPreferences((current) => ({ ...current, [key]: parsed }));
    setSaved(false);
  };

  return (
    <Screen title="حد انحراف" subtitle="شعاع جست‌وجو با انحراف واقعی مسیر متفاوت است.">
      <Panel>
        {loading ? <ActivityIndicator color={screenTheme.primary} /> : null}
        <PreferenceField label="شعاع جست‌وجوی سفارش" value={preferences.candidateRadiusKm} choices={QUICK_CHOICES.candidateRadiusKm} onChange={(value) => setNumber('candidateRadiusKm', value)} />
        <PreferenceField label="حداکثر زمان اضافه" value={preferences.maxExtraMinutes} choices={QUICK_CHOICES.maxExtraMinutes} onChange={(value) => setNumber('maxExtraMinutes', value)} />
        <PreferenceField label="حداکثر پیاده‌روی اضافه" value={preferences.maxExtraWalkingMeters} choices={QUICK_CHOICES.maxExtraWalkingMeters} onChange={(value) => setNumber('maxExtraWalkingMeters', value)} />
        {!!error && <Text style={styles.error}>{error}</Text>}
        {saved && <Text style={styles.success}>تنظیمات این نشست ذخیره شد.</Text>}
        <Pressable accessibilityRole="button" disabled={loading || saving} onPress={() => void save()} style={styles.button}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>ذخیره محدودیت‌ها</Text>}
        </Pressable>
      </Panel>
      <Panel>
        <Text style={styles.title}>وضعیت پیاده‌سازی</Text>
        <Text style={styles.text}>این تنظیمات در mock ذخیره می‌شوند و تا اضافه شدن مسیریابی و موتور تطبیق روی سفارش واقعی اعمال نمی‌شوند.</Text>
      </Panel>
    </Screen>
  );
}

function PreferenceField({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: number;
  choices: readonly { value: number; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <TextInput accessibilityLabel={label} value={String(value)} onChangeText={onChange} keyboardType="number-pad" style={styles.input} />
      </View>
      <View style={styles.choices}>
        {choices.map((choice) => (
          <Pressable
            key={choice.value}
            accessibilityRole="button"
            accessibilityState={{ selected: value === choice.value }}
            onPress={() => onChange(String(choice.value))}
            style={[styles.choice, value === choice.value && styles.choiceSelected]}
          >
            <Text style={[styles.choiceText, value === choice.value && styles.choiceTextSelected]}>{choice.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  field: { gap: 3 },
  choices: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  choice: { minHeight: 34, paddingHorizontal: 10, borderRadius: 17, borderWidth: 1, borderColor: '#D8E1DC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  choiceSelected: { borderColor: screenTheme.primary, backgroundColor: screenTheme.primaryLight },
  choiceText: { fontFamily: AppFonts.medium, fontSize: 11, color: screenTheme.textSecondary },
  choiceTextSelected: { fontFamily: AppFonts.semiBold, color: screenTheme.primary },
  label: { flex: 1, fontFamily: AppFonts.medium, fontSize: 13, color: screenTheme.textSecondary, textAlign: 'right' },
  input: { width: 78, minHeight: 42, borderWidth: 1, borderColor: '#D8E1DC', borderRadius: 8, paddingHorizontal: 8, textAlign: 'center', color: screenTheme.text },
  button: { minHeight: 48, borderRadius: 8, backgroundColor: screenTheme.primary, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  buttonText: { fontFamily: AppFonts.bold, fontSize: 14, color: '#FFFFFF' },
  error: { fontFamily: AppFonts.regular, fontSize: 12, color: '#B42318', textAlign: 'right' },
  success: { fontFamily: AppFonts.regular, fontSize: 12, color: screenTheme.primary, textAlign: 'right' },
  title: { fontFamily: AppFonts.bold, fontSize: 15, color: screenTheme.text, textAlign: 'right' },
  text: { fontFamily: AppFonts.regular, fontSize: 13, lineHeight: 23, color: screenTheme.textSecondary, textAlign: 'right' },
});
