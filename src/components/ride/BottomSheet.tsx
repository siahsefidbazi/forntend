import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RideColors, RideFonts, RideRadius } from '@/constants/ride';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Modal based bottom sheet with a subtle slide/fade transition.
 *
 * It is intentionally built on the core `Animated` API so the passenger
 * experience does not depend on a gesture/reanimated setup.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  contentStyle,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }

    Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, progress]);

  /** Animates the sheet out and notifies the parent afterwards. */
  const handleClose = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  }, [onClose, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="بستن"
            onPress={handleClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16, transform: [{ translateY }] },
            contentStyle,
          ]}
        >
          <View style={styles.handle} />

          {!!title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}

          {children}

          {!!footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 26, 18, 0.42)',
  },
  sheet: {
    backgroundColor: RideColors.surface,
    borderTopLeftRadius: RideRadius.xl,
    borderTopRightRadius: RideRadius.xl,
    paddingHorizontal: 18,
    paddingTop: 8,
    maxHeight: '86%',
    shadowColor: RideColors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.borderStrong,
    marginBottom: 12,
  },
  header: { marginBottom: 12 },
  title: {
    fontFamily: RideFonts.bold,
    fontSize: 17,
    color: RideColors.text,
    textAlign: 'right',
  },
  subtitle: {
    fontFamily: RideFonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: RideColors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  footer: { marginTop: 14 },
});
