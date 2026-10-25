import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import { useAuth } from '@/features/auth/AuthProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const SETTINGS: { id: string; title: string; subtitle: string; icon: IconName; route: string }[] = [
  { id: 'schedule', title: 'برنامه‌های رفت‌وآمد', subtitle: 'روزها و ساعت‌های مسیر', icon: 'calendar-outline', route: '/schedule' },
  { id: 'detour', title: 'محدودیت مسیر', subtitle: 'پیاده‌روی و زمان اضافه', icon: 'walk-outline', route: '/settings/detour' },
  { id: 'deliveries', title: 'تحویل‌های من', subtitle: 'وضعیت سفارش‌های تخصیص‌یافته', icon: 'cube-outline', route: '/deliveries' },
  { id: 'notifications', title: 'اعلان‌ها', subtitle: 'پیشنهادها و تغییر وضعیت', icon: 'notifications-outline', route: '/notifications' },
  { id: 'support', title: 'پشتیبانی و قوانین', subtitle: 'راهنما و گزارش مشکل', icon: 'help-circle-outline', route: '/support' },
];

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 30 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>حساب کاربری</Text>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={30} color={RideColors.primary} />
        </View>
        <View style={styles.identityText}>
          <Text style={styles.name}>همراه مسیر</Text>
          <Text style={styles.phone}>{phone || 'شماره تلفن ثبت نشده'}</Text>
        </View>
        <View style={styles.status}>
          <Ionicons name="shield-checkmark-outline" size={16} color={RideColors.warning} />
          <Text style={styles.statusText}>احراز واقعی فعال نیست</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>تنظیمات و خدمات</Text>
      <View style={styles.menu}>
        {SETTINGS.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() => router.push(item.route as Href)}
            style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={20} color={RideColors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-back" size={17} color={RideColors.textSecondary} />
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={signingOut}
        onPress={() => void handleSignOut()}
        style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
      >
        {signingOut ? <ActivityIndicator color={RideColors.danger} /> : (
          <>
            <Ionicons name="log-out-outline" size={19} color={RideColors.danger} />
            <Text style={styles.signOutText}>خروج از حساب</Text>
          </>
        )}
      </Pressable>
      <Text style={styles.version}>هم‌مسیر · نسخه‌ی آزمایشی</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: RideColors.background },
  content: { paddingHorizontal: 18, gap: 17 },
  pageTitle: { fontFamily: RideFonts.bold, fontSize: 22, color: RideColors.text, textAlign: 'right' },
  identity: { flexDirection: 'row-reverse', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: RideColors.border },
  avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: RideColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  identityText: { flex: 1, minWidth: 130 },
  name: { fontFamily: RideFonts.bold, fontSize: 16, color: RideColors.text, textAlign: 'right' },
  phone: { fontFamily: RideFonts.regular, fontSize: 12, color: RideColors.textSecondary, textAlign: 'right', marginTop: 3 },
  status: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: RideRadius.pill, backgroundColor: RideColors.warningSoft },
  statusText: { fontFamily: RideFonts.medium, fontSize: 10, color: RideColors.warning },
  sectionTitle: { fontFamily: RideFonts.bold, fontSize: 14, color: RideColors.text, textAlign: 'right' },
  menu: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: RideColors.border },
  menuRow: { minHeight: 68, flexDirection: 'row-reverse', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: RideColors.border },
  menuIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: RideColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuTitle: { fontFamily: RideFonts.semiBold, fontSize: 13, color: RideColors.text, textAlign: 'right' },
  menuSubtitle: { fontFamily: RideFonts.regular, fontSize: 11, color: RideColors.textSecondary, textAlign: 'right', marginTop: 3 },
  signOut: { minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: RideColors.dangerSoft, borderRadius: RideRadius.md },
  signOutText: { fontFamily: RideFonts.semiBold, fontSize: 13, color: RideColors.danger },
  version: { fontFamily: RideFonts.regular, fontSize: 10, color: RideColors.textSecondary, textAlign: 'center' },
  pressed: { opacity: 0.72 },
});