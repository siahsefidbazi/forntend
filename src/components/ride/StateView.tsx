import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RideColors, RideFonts, RideRadius } from '@/constants/ride';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type StateViewProps = {
  state: 'loading' | 'empty' | 'error';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconName;
};

export function StateView({
  state,
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: StateViewProps) {
  if (state === 'loading') {
    return (
      <View style={styles.container} accessibilityRole="progressbar">
        <ActivityIndicator color={RideColors.primary} size="large" />
        <Text style={styles.title}>{title}</Text>
        {!!description && <Text style={styles.description}>{description}</Text>}
      </View>
    );
  }

  const resolvedIcon: IconName =
    icon ?? (state === 'error' ? 'alert-circle-outline' : 'map-outline');

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          state === 'error' && styles.iconWrapError,
        ]}
      >
        <Ionicons
          name={resolvedIcon}
          size={26}
          color={state === 'error' ? RideColors.danger : RideColors.primary}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      {!!actionLabel && !!onAction && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconWrapError: { backgroundColor: RideColors.dangerSoft },
  title: {
    fontFamily: RideFonts.semiBold,
    fontSize: 16,
    color: RideColors.text,
    textAlign: 'center',
  },
  description: {
    fontFamily: RideFonts.regular,
    fontSize: 13,
    lineHeight: 22,
    color: RideColors.textSecondary,
    textAlign: 'center',
  },
  action: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.primarySoft,
  },
  actionLabel: {
    fontFamily: RideFonts.semiBold,
    fontSize: 13,
    color: RideColors.primary,
  },
  pressed: { opacity: 0.75 },
});
