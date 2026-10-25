import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RideColors, RideFonts, RideRadius } from '@/constants/ride';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
  accessibilityHint,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger'
              ? RideColors.textInverse
              : RideColors.primary
          }
        />
      ) : (
        <View style={styles.content}>
          {!!icon && (
            <Ionicons
              name={icon}
              size={20}
              color={
                variant === 'primary' || variant === 'danger'
                  ? RideColors.textInverse
                  : RideColors.primary
              }
            />
          )}
          <Text
            style={[
              styles.label,
              variant === 'primary' || variant === 'danger'
                ? styles.labelInverse
                : styles.labelPrimary,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: RideRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  content: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  primary: { backgroundColor: RideColors.primary },
  secondary: {
    backgroundColor: RideColors.primarySoft,
    borderWidth: 1,
    borderColor: RideColors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: RideColors.border,
  },
  danger: { backgroundColor: RideColors.danger },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  label: {
    fontFamily: RideFonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
  },
  labelInverse: { color: RideColors.textInverse },
  labelPrimary: { color: RideColors.primary },
});
