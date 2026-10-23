import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RideColors, RideFonts, RideRadius } from '@/constants/ride';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
};

/** Small selectable pill used for the route selector. */
export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.pressed,
      ]}
    >
      {!!icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? RideColors.textInverse : RideColors.textSecondary}
        />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RideRadius.pill,
    borderWidth: 1,
    borderColor: RideColors.border,
    backgroundColor: RideColors.surface,
  },
  containerSelected: {
    backgroundColor: RideColors.primary,
    borderColor: RideColors.primary,
  },
  pressed: { opacity: 0.8 },
  label: {
    fontFamily: RideFonts.medium,
    fontSize: 13,
    color: RideColors.textSecondary,
  },
  labelSelected: { color: RideColors.textInverse },
});
