import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RideColors, RideFonts, RideRadius } from '@/constants/ride';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

/** Shared header for the stack screens of the passenger experience. */
export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {!!onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="بازگشت"
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-forward" size={20} color={RideColors.text} />
        </Pressable>
      )}

      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: RideColors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: RideColors.border,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: RideRadius.md,
    borderWidth: 1,
    borderColor: RideColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  texts: { flex: 1 },
  title: {
    fontFamily: RideFonts.bold,
    fontSize: 18,
    color: RideColors.text,
    textAlign: 'right',
  },
  subtitle: {
    fontFamily: RideFonts.regular,
    fontSize: 12,
    color: RideColors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
});
