import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RideColors, RideFonts, RideRadius } from '@/constants/ride';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type PlaceFieldProps = {
  label: string;
  value?: string | null;
  placeholder: string;
  icon: IconName;
  iconColor?: string;
  onPress: () => void;
  /** Renders the field as the active one. */
  active?: boolean;
};

/** Read-only tappable field used for the origin and the destination. */
export function PlaceField({
  label,
  value,
  placeholder,
  icon,
  iconColor = RideColors.primary,
  onPress,
  active = false,
}: PlaceFieldProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        active && styles.containerActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>

      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        <Text
          style={[styles.value, !value && styles.placeholder]}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
      </View>

      <Ionicons
        name="chevron-back"
        size={18}
        color={RideColors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: RideRadius.md,
  },
  containerActive: { backgroundColor: RideColors.primaryMuted },
  pressed: { opacity: 0.75 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: RideRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  label: {
    fontFamily: RideFonts.regular,
    fontSize: 11,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  value: {
    fontFamily: RideFonts.semiBold,
    fontSize: 15,
    color: RideColors.text,
    textAlign: 'right',
    marginTop: 2,
  },
  placeholder: { color: RideColors.textSecondary, fontWeight: '400' },
});
