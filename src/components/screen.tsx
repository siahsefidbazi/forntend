import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppFonts, Colors, MaxContentWidth } from '@/constants/theme';

const theme = Colors.light;

export function Screen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-forward" size={22} color={theme.text} />
          </Pressable>
          <View style={styles.flex}>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

export const screenTheme = theme;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
    gap: 14,
    writingDirection: 'rtl',
  },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    backgroundColor: theme.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  title: { fontFamily: AppFonts.bold, fontSize: 22, color: theme.text, textAlign: 'right' },
  subtitle: {
    fontFamily: AppFonts.regular,
    fontSize: 13,
    lineHeight: 22,
    color: theme.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    backgroundColor: theme.backgroundElement,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
});
