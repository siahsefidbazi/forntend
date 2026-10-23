import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { MatchOffer } from '@/features/dashboard/mock';
import { RideColors, RideFonts, RideRadius } from '@/constants/ride';
import { formatToman, toFaDigits } from '@/utils/format';

export type MatchOfferCardProps = {
  offer: MatchOffer;
  /** Stops of the offer that matched the user's route anchors. */
  matchedStops: string[];
  onPress: () => void;
};

/** One co-travel offer suggestion shown on the ride home panel. */
export function MatchOfferCard({
  offer,
  matchedStops,
  onPress,
}: MatchOfferCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`پیشنهاد حمل ${offer.parcel} از ${offer.pickupStop}`}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="cube-outline" size={20} color={RideColors.primary} />
        </View>
        <View style={styles.headTexts}>
          <Text style={styles.title} numberOfLines={1}>
            {offer.parcel}
          </Text>
          <Text style={styles.sender} numberOfLines={1}>
            {offer.sender}
          </Text>
        </View>
        <Text style={styles.price}>{formatToman(offer.priceToman)}</Text>
      </View>

      <View style={styles.route}>
        <View style={styles.stop}>
          <Ionicons
            name="radio-button-on-outline"
            size={13}
            color={RideColors.primary}
          />
          <Text style={styles.stopText} numberOfLines={1}>
            {offer.pickupStop}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.stop}>
          <Ionicons
            name="location-outline"
            size={13}
            color={RideColors.text}
          />
          <Text style={styles.stopText} numberOfLines={1}>
            {offer.dropoffStop}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={13} color={RideColors.textSecondary} />
          <Text style={styles.metaText}>
            {toFaDigits(offer.extraMinutes)} دقیقه انحراف
          </Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="walk-outline" size={13} color={RideColors.textSecondary} />
          <Text style={styles.metaText}>
            {toFaDigits(offer.extraWalkMeters)} متر پیاده‌روی
          </Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="pulse-outline" size={13} color={RideColors.primary} />
          <Text style={styles.fitText}>
            {toFaDigits(offer.routeFit)}٪ هم‌مسیری
          </Text>
        </View>
      </View>

      {!!matchedStops.length && (
        <View style={styles.matchBadge}>
          <Ionicons name="checkmark-circle" size={13} color={RideColors.primary} />
          <Text style={styles.matchText} numberOfLines={1}>
            هم‌مسیر با {matchedStops.join('، ')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: RideColors.surface,
    borderWidth: 1,
    borderColor: RideColors.border,
    borderRadius: RideRadius.lg,
    padding: 12,
    gap: 8,
  },
  pressed: { opacity: 0.85 },
  head: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: RideRadius.md,
    backgroundColor: RideColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headTexts: { flex: 1, gap: 2 },
  title: {
    fontFamily: RideFonts.semiBold,
    fontSize: 14,
    color: RideColors.text,
    textAlign: 'right',
  },
  sender: {
    fontFamily: RideFonts.regular,
    fontSize: 12,
    color: RideColors.textSecondary,
    textAlign: 'right',
  },
  price: {
    fontFamily: RideFonts.semiBold,
    fontSize: 13,
    color: RideColors.primary,
  },
  route: { gap: 4 },
  stop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  stopText: {
    flex: 1,
    fontFamily: RideFonts.medium,
    fontSize: 12.5,
    color: RideColors.text,
    textAlign: 'right',
  },
  routeLine: {
    width: 1,
    height: 10,
    backgroundColor: RideColors.borderStrong,
    marginLeft: 6,
    marginRight: 6,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
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
  fitText: {
    fontFamily: RideFonts.semiBold,
    fontSize: 11.5,
    color: RideColors.primary,
  },
  matchBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RideRadius.pill,
    backgroundColor: RideColors.primarySoft,
  },
  matchText: {
    fontFamily: RideFonts.medium,
    fontSize: 11,
    color: RideColors.primary,
  },
});
