import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { requestVerificationCode, verifyCode } from '@/api/auth';
import { describeError } from '@/api/errors';
import { AppFonts, Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { toEnglishDigits, toFaDigits } from '@/utils/format';

const theme = Colors.light;
const OTP_LENGTH = 5;
const RESEND_SECONDS = 60;

export default function Otp() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{
    phone?: string | string[];
    code?: string | string[];
  }>();
  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone ?? '';
  const developmentCode =
    Array.isArray(params.code) ? params.code[0] : params.code ?? '';

  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isComplete = code.length === OTP_LENGTH;
  const isSmallScreen = width < 360;
  const horizontalPadding = isSmallScreen ? 12 : 20;
  const cardPadding = isSmallScreen ? 16 : 22;
  const boxGap = isSmallScreen ? 6 : 10;
  const availableWidth = width - horizontalPadding * 2 - cardPadding * 2;
  const boxWidth = Math.max(1, Math.min(52, (availableWidth - boxGap * (OTP_LENGTH - 1)) / OTP_LENGTH));

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((previous) => previous - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const handleChange = (value: string) => {
    setCode(toEnglishDigits(value).replace(/\D/g, '').slice(0, OTP_LENGTH));
    setError('');
  };

  const handleVerify = async () => {
    if (!isComplete) {
      setError('لطفا کد تایید را کامل وارد کن.');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyCode({ phoneNumber: phone, code });
      await signIn(response.accessToken, phone);
      router.replace('/(dashboard)/dashboard');
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0 || loading) return;

    setCode('');
    setError('');
    setSeconds(RESEND_SECONDS);
    inputRef.current?.focus();

    try {
      await requestVerificationCode({ phoneNumber: phone });
    } catch (caught) {
      setError(describeError(caught));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height, paddingHorizontal: horizontalPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { padding: cardPadding }]}>
          <Text style={styles.title}>کد تایید</Text>
          <Text style={styles.subtitle}>
            کد {toFaDigits(OTP_LENGTH)} رقمی ارسال‌شده به {toFaDigits(phone)} را وارد کنید.
          </Text>

          <Pressable
            style={[styles.boxes, { gap: boxGap }]}
            onPress={() => inputRef.current?.focus()}
            accessibilityRole="button"
            accessibilityLabel="ورود کد تایید"
          >
            {Array.from({ length: OTP_LENGTH }).map((_, index) => {
              const active = index === code.length || (isComplete && index === OTP_LENGTH - 1);
              return (
                <View
                  key={index}
                  style={[
                    styles.box,
                    { width: boxWidth, height: isSmallScreen ? 52 : 60 },
                    active && styles.boxActive,
                    !!error && styles.boxError,
                  ]}
                >
                  <Text style={styles.boxText}>{toFaDigits(code[index] ?? '')}</Text>
                </View>
              );
            })}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            accessibilityLabel="کد تایید پنج رقمی"
            style={styles.hiddenInput}
            caretHidden
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          {!!developmentCode && !code && (
            <Text style={styles.devCode}>
              کد توسعه سرویس: {toFaDigits(developmentCode)}
            </Text>
          )}

          <Pressable
            disabled={!isComplete || loading}
            onPress={handleVerify}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primaryButton,
              (!isComplete || loading) && styles.primaryButtonDisabled,
              pressed && isComplete && !loading && styles.pressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>تایید و ورود</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            {seconds > 0 ? (
              <Text style={styles.timer}>ارسال مجدد تا {toFaDigits(seconds)} ثانیه دیگر</Text>
            ) : (
              <Pressable onPress={handleResend} accessibilityRole="button">
                <Text style={styles.link}>ارسال مجدد کد</Text>
              </Pressable>
            )}
            <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.link}>ویرایش شماره</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  card: { width: '100%', maxWidth: 440, backgroundColor: theme.backgroundElement, borderRadius: 24, alignSelf: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  title: { fontFamily: AppFonts.bold, fontSize: 22, color: theme.text, textAlign: 'right' },
  subtitle: { fontFamily: AppFonts.regular, marginTop: 6, fontSize: 13, color: theme.textSecondary, textAlign: 'right', lineHeight: 22 },
  boxes: { marginTop: 26, flexDirection: 'row', writingDirection: 'ltr', justifyContent: 'center', alignItems: 'center', width: '100%' },
  box: { flexShrink: 1, borderRadius: 14, borderWidth: 1.5, borderColor: 'transparent', backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: theme.primary },
  boxError: { borderColor: theme.error },
  boxText: { fontFamily: AppFonts.bold, fontSize: 24, color: theme.text },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1, left: 0, bottom: 0 },
  error: { fontFamily: AppFonts.regular, marginTop: 10, fontSize: 12, color: theme.error, textAlign: 'right', lineHeight: 20 },
  devCode: { fontFamily: AppFonts.regular, marginTop: 10, fontSize: 12, color: theme.textSecondary, textAlign: 'right' },
  primaryButton: { marginTop: 22, minHeight: 54, borderRadius: 16, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { fontFamily: AppFonts.bold, color: theme.onPrimary, fontSize: 16 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  footer: { marginTop: 18, flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', rowGap: 12, columnGap: 12 },
  timer: { fontFamily: AppFonts.regular, fontSize: 12, color: theme.textSecondary, lineHeight: 22 },
  link: { fontFamily: AppFonts.semiBold, fontSize: 13, color: theme.primary, lineHeight: 22 },
});
