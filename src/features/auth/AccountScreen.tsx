import React, { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, describeError } from '@/api/errors';
import { getUserProfile, updateUserProfile } from '@/api/profile';
import { createUser } from '@/api/users';
import type { UserProfile } from '@/api/types';
import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import { useAuth } from '@/features/auth/AuthProvider';
import { toEnglishDigits, toFaDigits } from '@/utils/format';
import { PrimaryButton } from '@/components/ride/PrimaryButton';
import { StateView } from '@/components/ride/StateView';

type EditableProfile = {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalIdNumber: string;
  address: string;
  postalCode: string;
};

const EMPTY_PROFILE: EditableProfile = {
  firstName: '',
  lastName: '',
  birthDate: '',
  nationalIdNumber: '',
  address: '',
  postalCode: '',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { phone, signOut } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditableProfile>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fullName, setFullName] = useState('');
  const [creating, setCreating] = useState(false);
  const [registered, setRegistered] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await getUserProfile(signal);
      if (signal?.aborted) {
        return;
      }
      setError('');
      setProfile(data);
      setDraft({
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        birthDate: data.birthDate ?? '',
        nationalIdNumber: data.nationalIdNumber ?? '',
        address: data.address ?? '',
        postalCode: data.postalCode ?? '',
      });
      setStatus('ready');
    } catch (caught) {
      if (signal?.aborted) {
        return;
      }
      if (caught instanceof ApiError && caught.kind === 'not-found') {
        setProfile(null);
        setDraft(EMPTY_PROFILE);
        setError('');
        setStatus('ready');
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

  const displayName = useMemo(() => {
    const name = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();
    return name || (phone ? `کاربر ${toFaDigits(phone)}` : 'کاربر');
  }, [profile, phone]);

  const handleSave = useCallback(async () => {
    if (saving) {
      return;
    }

    setFormError('');

    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      setFormError('نام و نام خانوادگی الزامی است.');
      return;
    }

    const birthDate = toEnglishDigits(draft.birthDate.trim());
    const parsedBirthDate = new Date(`${birthDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isFinite(parsedBirthDate.getTime()) || parsedBirthDate.toISOString().slice(0, 10) !== birthDate) {
      setFormError('تاریخ تولد میلادی را با قالب YYYY-MM-DD وارد کنید.');
      return;
    }

    setSaving(true);

    try {
      const updated = await updateUserProfile({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        birthDate,
        nationalIdNumber: toEnglishDigits(draft.nationalIdNumber.trim()),
        address: draft.address.trim(),
        postalCode: toEnglishDigits(draft.postalCode.trim()),
      });

      setProfile(updated);
      setEditing(false);
    } catch (caught) {
      setFormError(describeError(caught));
    } finally {
      setSaving(false);
    }
  }, [draft, saving]);

  const handleCreateUser = useCallback(async () => {
    if (creating) {
      return;
    }

    if (!fullName.trim()) {
      setFormError('نام و نام خانوادگی را وارد کنید.');
      return;
    }

    if (!phone) {
      setFormError('شماره موبایل در دسترس نیست. دوباره وارد شوید.');
      return;
    }

    setCreating(true);
    setFormError('');

    try {
      await createUser({ fullName: fullName.trim(), phoneNumber: phone });
      setRegistered(true);
      await load();
      const [firstName, ...lastName] = fullName.trim().split(/\s+/);
      setDraft((current) => ({ ...current, firstName: current.firstName || firstName, lastName: current.lastName || lastName.join(' ') }));
      setEditing(true);
    } catch (caught) {
      setFormError(describeError(caught));
    } finally {
      setCreating(false);
    }
  }, [creating, fullName, phone, load]);

  const renderForm = () => {
    const fields: {
      key: keyof EditableProfile;
      label: string;
      placeholder: string;
      keyboard?: 'default' | 'numeric';
      multiline?: boolean;
    }[] = [
      { key: 'firstName', label: 'نام', placeholder: 'نام' },
      { key: 'lastName', label: 'نام خانوادگی', placeholder: 'نام خانوادگی' },
      {
        key: 'birthDate',
        label: 'تاریخ تولد (میلادی؛ YYYY-MM-DD)',
        placeholder: '2000-01-01',
      },
      {
        key: 'nationalIdNumber',
        label: 'کد ملی',
        placeholder: '۰۰۰۰۰۰۰۰۰۰',
        keyboard: 'numeric',
      },
      { key: 'address', label: 'نشانی', placeholder: 'نشانی کامل', multiline: true },
      {
        key: 'postalCode',
        label: 'کد پستی',
        placeholder: '۱۰۰۰۰۰۰۰۰۰',
        keyboard: 'numeric',
      },
    ];

    return (
      <View style={styles.card}>
        {fields.map((field) => (
          <View key={field.key} style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              value={draft[field.key]}
              onChangeText={(value) =>
                setDraft((current) => ({ ...current, [field.key]: value }))
              }
              placeholder={field.placeholder}
              placeholderTextColor={RideColors.textSecondary}
              keyboardType={field.keyboard ?? 'default'}
              multiline={field.multiline}
              textAlign="right"
              style={[styles.input, field.multiline && styles.inputMultiline]}
              accessibilityLabel={field.label}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 60}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="بازگشت" onPress={() => router.canGoBack() ? router.back() : router.replace('/(dashboard)/profile')} style={styles.iconButton}>
          <Ionicons name="chevron-forward" size={20} color={RideColors.text} />
        </Pressable>
        <Text style={styles.title}>پروفایل</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="تنظیمات"
          onPress={() => router.push('/(ride)/settings')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons name="settings-outline" size={20} color={RideColors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {status === 'loading' && (
          <StateView state="loading" title="در حال دریافت اطلاعات…" />
        )}

        {status === 'error' && (
          <StateView
            state="error"
            title="دریافت پروفایل ممکن نشد"
            description={error}
            actionLabel="تلاش دوباره"
            onAction={() => void load()}
          />
        )}

        {status === 'ready' && (
          <>
            <View style={styles.identity}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {displayName.trim().charAt(0) || 'م'}
                </Text>
              </View>
              <Text style={styles.name}>{displayName}</Text>
              {!!phone && (
                <Text style={styles.phone}>{toFaDigits(phone)}</Text>
              )}
            </View>

            {!profile?.firstName && !profile?.lastName && !editing && !registered ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>تکمیل اطلاعات کاربر</Text>
                <Text style={styles.cardText}>
                  حساب شما هنوز نامی ندارد. با ثبت نام کامل، پروفایل در سرویس
                  ساخته می‌شود.
                </Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="نام و نام خانوادگی"
                  placeholderTextColor={RideColors.textSecondary}
                  textAlign="right"
                  style={styles.input}
                  accessibilityLabel="نام و نام خانوادگی"
                />
                {!!formError && <Text style={styles.error}>{formError}</Text>}
                <PrimaryButton
                  label="ثبت نام"
                  loading={creating}
                  onPress={() => void handleCreateUser()}
                />
              </View>
            ) : editing ? (
              <>
                {renderForm()}
                {!!formError && <Text style={styles.error}>{formError}</Text>}
                <View style={styles.actionsRow}>
                  <PrimaryButton
                    label="ذخیره تغییرات"
                    loading={saving}
                    onPress={() => void handleSave()}
                    style={styles.flex}
                  />
                  <PrimaryButton
                    label="انصراف"
                    variant="ghost"
                    onPress={() => {
                      setEditing(false);
                      setFormError('');
                    }}
                    style={styles.flex}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.card}>
                  <InfoRow label="نام" value={profile?.firstName} />
                  <InfoRow label="نام خانوادگی" value={profile?.lastName} />
                  <InfoRow label="تاریخ تولد" value={profile?.birthDate} digits />
                  <InfoRow
                    label="کد ملی"
                    value={profile?.nationalIdNumber}
                    digits
                  />
                  <InfoRow label="نشانی" value={profile?.address} />
                  <InfoRow label="کد پستی" value={profile?.postalCode} digits />
                </View>

                <PrimaryButton
                  label="ویرایش پروفایل"
                  variant="secondary"
                  icon="create-outline"
                  onPress={() => setEditing(true)}
                />
              </>
            )}

            <PrimaryButton
              label="خروج از حساب"
              variant="ghost"
              icon="log-out-outline"
              onPress={() => void signOut()}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({
  label,
  value,
  digits = false,
}: {
  label: string;
  value?: string | null;
  digits?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value ? (digits ? toFaDigits(value) : value) : 'ثبت نشده'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RideColors.background },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: {
    fontFamily: RideFonts.bold,
    fontSize: 20,
    color: RideColors.text,
    textAlign: 'right',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: RideRadius.md,
    borderWidth: 1,
    borderColor: RideColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  identity: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: RideFonts.bold,
    fontSize: 28,
    color: RideColors.textInverse,
  },
  name: {
    fontFamily: RideFonts.semiBold,
    fontSize: 17,
    color: RideColors.text,
  },
  phone: {
    fontFamily: RideFonts.regular,
    fontSize: 13,
    color: RideColors.textSecondary,
  },
  card: {
    borderWidth: 1,
    borderColor: RideColors.border,
    borderRadius: RideRadius.lg,
    backgroundColor: RideColors.surface,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontFamily: RideFonts.semiBold,
    fontSize: 15,
    color: RideColors.text,
    textAlign: 'right',
  },
  cardText: {
    fontFamily: RideFonts.regular,
    fontSize: 12.5,
    lineHeight: 21,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  field: { gap: 6 },
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
    paddingVertical: 10,
    fontFamily: RideFonts.medium,
    fontSize: 14,
    color: RideColors.text,
    textAlign: 'right',
  },
  inputMultiline: { minHeight: 76, textAlignVertical: 'top' },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoLabel: {
    width: 92,
    fontFamily: RideFonts.regular,
    fontSize: 13,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  infoValue: {
    flex: 1,
    fontFamily: RideFonts.medium,
    fontSize: 13,
    color: RideColors.text,
    textAlign: 'right',
  },
  actionsRow: { flexDirection: 'row-reverse', gap: 10 },
  flex: { flex: 1 },
  error: {
    fontFamily: RideFonts.regular,
    fontSize: 12.5,
    color: RideColors.danger,
    textAlign: 'right',
  },
});
