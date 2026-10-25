import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RideColors, RideFonts, RideRadius } from '@/constants/ride';

export type RouteCardProps = {
  title: string;
  /** "مبدأ → مقصد" summary coming from the first leg. */
  summary: string;
  /** Formatted schedule line, e.g. "دوشنبه ۰۷:۳۰". */
  schedule: string;
  /** Formatted total duration. */
  duration: string;
  isActive: boolean;
  onPress: () => void;
};

/** Row used by the "سفرهای من" list. */
export function RouteCard({
  title,
  summary,
  schedule,
  duration,
  isActive,
  onPress,
}: RouteCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}، ${summary}`}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="map-outline" size={20} color={RideColors.primary} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View
            style={[
              styles.status,
              isActive ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isActive ? RideColors.primary : RideColors.textSecondary },
              ]}
            >
              {isActive ? 'فعال' : 'غیرفعال'}
            </Text>
          </View>
        </View>

        <Text style={styles.summary} numberOfLines={1}>
          {summary}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={RideColors.textSecondary}
            />
            <Text style={styles.metaText}>{schedule}</Text>
          </View>
          <View style={styles.meta}>
            <Ionicons
              name="time-outline"
              size={13}
              color={RideColors.textSecondary}
            />
            <Text style={styles.metaText}>{duration}</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-back" size={18} color={RideColors.textSecondary} />
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
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: RideRadius.md,
    backgroundColor: RideColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  status: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RideRadius.pill,
  },
  statusActive: { backgroundColor: RideColors.primarySoft },
  statusInactive: { backgroundColor: RideColors.surfaceMuted },
  statusText: {
    fontFamily: RideFonts.medium,
    fontSize: 11,
  },
  summary: {
    fontFamily: RideFonts.regular,
    fontSize: 12.5,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 4,
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: RideFonts.medium,
    fontSize: 11.5,
    color: RideColors.textSecondary,
  },
});
