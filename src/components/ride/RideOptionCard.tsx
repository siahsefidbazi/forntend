import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RideColors, RideFonts, RideRadius } from '@/constants/ride';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type RideOptionCardProps = {
  title: string;
  subtitle?: string;
  icon: IconName;
  /** Estimated duration coming from the backend. */
  durationLabel: string;
  departureLabel?: string;
  arrivalLabel?: string;
  selected?: boolean;
  onPress: () => void;
  badge?: string;
};

/** One selectable ride option (a leg of a saved route). */
export function RideOptionCard({
  title,
  subtitle,
  icon,
  durationLabel,
  departureLabel,
  arrivalLabel,
  selected = false,
  onPress,
  badge,
}: RideOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}، ${durationLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={icon}
          size={20}
          color={selected ? RideColors.textInverse : RideColors.primary}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>

        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}

        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons
              name="time-outline"
              size={14}
              color={RideColors.textSecondary}
            />
            <Text style={styles.metaText}>{durationLabel}</Text>
          </View>

          {!!departureLabel && (
            <View style={styles.meta}>
              <Ionicons
                name="arrow-up-circle-outline"
                size={14}
                color={RideColors.textSecondary}
              />
              <Text style={styles.metaText}>حرکت {departureLabel}</Text>
            </View>
          )}

          {!!arrivalLabel && (
            <View style={styles.meta}>
              <Ionicons
                name="flag-outline"
                size={14}
                color={RideColors.textSecondary}
              />
              <Text style={styles.metaText}>رسیدن {arrivalLabel}</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? RideColors.primary : RideColors.borderStrong}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: RideColors.surface,
    borderWidth: 1,
    borderColor: RideColors.border,
    borderRadius: RideRadius.lg,
    padding: 14,
  },
  containerSelected: {
    borderColor: RideColors.primary,
    backgroundColor: RideColors.primaryMuted,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: RideRadius.md,
    backgroundColor: RideColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: RideColors.primary },
  body: { flex: 1, gap: 3 },
  titleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontFamily: RideFonts.semiBold,
    fontSize: 15,
    color: RideColors.text,
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.surfaceMuted,
  },
  badgeText: {
    fontFamily: RideFonts.medium,
    fontSize: 11,
    color: RideColors.textSecondary,
  },
  subtitle: {
    fontFamily: RideFonts.regular,
    fontSize: 12,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: RideFonts.medium,
    fontSize: 12,
    color: RideColors.textSecondary,
  },
});
