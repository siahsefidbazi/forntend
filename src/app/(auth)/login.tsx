import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { requestVerificationCode } from '@/api/auth';
import { describeError } from '@/api/errors';
import { AppFonts, Colors } from '@/constants/theme';
import { toEnglishDigits } from '@/utils/format';

const theme = Colors.light;

const isValidPhone = (phone: string) => /^09\d{9}$/.test(phone);

export default function Login() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isValid = isValidPhone(phone);

  const handlePhoneChange = (value: string) => {
    setPhone(toEnglishDigits(value).replace(/\D/g, '').slice(0, 11));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isValid || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await requestVerificationCode({ phoneNumber: phone });

      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone,
          code: response.developmentCode ?? '',
        },
      });
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>هم‌مسیر</Text>
        <Text style={styles.tagline}>سفر روزمره با مسیرهای آماده</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>ورود یا ثبت‌نام</Text>
        <Text style={styles.subtitle}>
          برای شروع، شماره موبایل را وارد کنید. کد تایید برای همین شماره ارسال می‌شود.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>شماره موبایل</Text>
          <TextInput
            value={phone}
            onChangeText={handlePhoneChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="09123456789"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            maxLength={11}
            textAlign="right"
            editable={!loading}
            accessibilityLabel="شماره موبایل"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            style={[styles.input, focused && styles.inputFocused]}
          />
          {submitted && !isValid && (
            <Text style={styles.error}>شماره باید ۱۱ رقم باشد و با 09 شروع شود.</Text>
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>

        <Pressable
          disabled={loading}
          onPress={handleSubmit}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryButton,
            (!isValid || loading) && styles.primaryButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={theme.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>دریافت کد تایید</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 28 },
  brand: { fontFamily: AppFonts.bold, fontSize: 36, color: theme.primary },
  tagline: { fontFamily: AppFonts.regular, marginTop: 6, fontSize: 14, color: theme.textSecondary },
  card: { backgroundColor: theme.backgroundElement, borderRadius: 24, padding: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  title: { fontFamily: AppFonts.bold, fontSize: 22, color: theme.text, textAlign: 'right' },
  subtitle: { fontFamily: AppFonts.regular, marginTop: 6, fontSize: 13, color: theme.textSecondary, textAlign: 'right', lineHeight: 22 },
  field: { marginTop: 22 },
  label: { fontFamily: AppFonts.semiBold, fontSize: 13, color: theme.primary, textAlign: 'right', marginBottom: 8 },
  input: { fontFamily: AppFonts.medium, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: theme.background, paddingHorizontal: 16, fontSize: 16, color: theme.text },
  inputFocused: { borderColor: theme.primary },
  error: { fontFamily: AppFonts.regular, marginTop: 6, fontSize: 12, color: theme.error, textAlign: 'right' },
  primaryButton: { marginTop: 22, height: 54, borderRadius: 16, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { fontFamily: AppFonts.bold, color: theme.onPrimary, fontSize: 16 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
