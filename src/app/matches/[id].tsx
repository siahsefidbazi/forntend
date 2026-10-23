import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { acceptMatch } from '@/api/matches';
import { describeError } from '@/api/errors';
import { listTravelPlans } from '@/api/travelPlans';
import type { MatchAcceptanceRequest, TravelPlan } from '@/api/types';
import { Panel, Screen, screenTheme } from '@/components/screen';
import { PlaceField } from '@/components/ride/PlaceField';
import { AppFonts } from '@/constants/theme';
import { MOCK_DASHBOARD } from '@/features/dashboard/mock';
import { useOfferQueue } from '@/features/dashboard/OfferQueueProvider';
import { useTrip } from '@/features/trip/TripProvider';
import { formatToman, toFaDigits } from '@/utils/format';
import { weekDayName } from '@/constants/transport';

const ACCEPTANCE_MODES = [
  {
    id: 'weekly_schedule',
    title: 'طبق برنامه هفتگی',
    subtitle: 'از مسیری که قبلاً ثبت کرده‌ای',
    icon: 'calendar-outline',
  },
  {
    id: 'custom_route',
    title: 'مسیر دلخواه همین سفارش',
    subtitle: 'مبدأ و مقصد را الان انتخاب کن',
    icon: 'map-outline',
  },
] as const;

type AcceptanceMode = (typeof ACCEPTANCE_MODES)[number]['id'];

export default function MatchDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const offer = MOCK_DASHBOARD.offers.find((item) => item.id === id);
  const { advanceOffer } = useOfferQueue();
  const { origin, destination, setOrigin, setDestination } = useTrip();
  const [acceptanceMode, setAcceptanceMode] = useState<AcceptanceMode>('weekly_schedule');
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedLegSequence, setSelectedLegSequence] = useState<number | null>(null);
  const [acceptState, setAcceptState] = useState<'idle' | 'submitting' | 'accepted' | 'error'>('idle');
  const [acceptError, setAcceptError] = useState('');

  const loadPlans = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await listTravelPlans(signal);
      if (signal?.aborted) return;
      const activePlans = result.filter((plan) => plan.isActive && plan.legs.length > 0);
      setPlans(activePlans);
      setSelectedPlanId(activePlans[0]?.id ?? '');
      setSelectedLegSequence(activePlans[0]?.legs[0]?.sequence ?? null);
      setPlansError('');
    } catch (caught) {
      if (!signal?.aborted) setPlansError(describeError(caught));
    } finally {
      if (!signal?.aborted) setPlansLoading(false);
    }
  }, [setSelectedLegSequence, setSelectedPlanId]);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void loadPlans(controller.signal);
      return () => controller.abort();
    }, [loadPlans]),
  );

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;
  const selectedLeg = selectedPlan?.legs.find((leg) => leg.sequence === selectedLegSequence) ?? null;
  const canAccept = acceptanceMode === 'weekly_schedule'
    ? !!selectedPlan && !!selectedLeg
    : !!origin && !!destination;

  const handleAccept = async () => {
    if (!offer || !canAccept || acceptState === 'submitting' || acceptState === 'accepted') return;

    const acceptance: MatchAcceptanceRequest = acceptanceMode === 'weekly_schedule'
      ? {
          mode: 'weekly_schedule',
          travelPlanId: selectedPlan!.id,
          legSequence: selectedLeg!.sequence,
        }
      : {
          mode: 'custom_route',
          origin: { title: origin!.title, latitude: origin!.latitude, longitude: origin!.longitude },
          destination: { title: destination!.title, latitude: destination!.latitude, longitude: destination!.longitude },
        };

    setAcceptState('submitting');
    setAcceptError('');
    try {
      await acceptMatch(offer.id, acceptance);
      advanceOffer(offer.id);
      setAcceptState('accepted');
    } catch (caught) {
      setAcceptError(describeError(caught));
      setAcceptState('error');
    }
  };

  const handleReject = () => {
    if (!offer || acceptState === 'submitting' || acceptState === 'accepted') return;
    advanceOffer(offer.id);
    router.replace('/(dashboard)/dashboard');
  };

  const chooseManualPlace = (target: 'origin' | 'destination') => {
    router.push({ pathname: '/(ride)/search', params: { target } });
  };

  if (!offer) {
    return (
      <Screen title="پیشنهاد پیدا نشد" subtitle="این پیشنهاد در دسترس نیست یا منقضی شده است.">
        <Panel><Text style={styles.text}>از فهرست پیشنهادها دوباره وارد شوید.</Text></Panel>
      </Screen>
    );
  }

  return (
    <Screen title="جزئیات پیشنهاد" subtitle="روش رفت‌وآمدت را برای این سفارش انتخاب کن">
      <Panel>
        <View style={styles.offerHeader}>
          <View style={styles.flex}>
            <Text style={styles.title}>{offer.parcel}</Text>
            <Text style={styles.muted}>{offer.sender}</Text>
          </View>
          <Text style={styles.price}>{formatToman(offer.priceToman)}</Text>
        </View>
        <View style={styles.offerRoute}>
          <RouteStop label="برداشت بسته" place={offer.pickupStop} icon="radio-button-on-outline" />
          <View style={styles.routeLine} />
          <RouteStop label="تحویل بسته" place={offer.dropoffStop} icon="location-outline" />
        </View>
      </Panel>

      <Panel>
        <Text style={styles.title}>با کدام مسیر انجامش می‌دهی؟</Text>
        <View style={styles.modeList}>
          {ACCEPTANCE_MODES.map((mode) => (
            <ModeOption
              key={mode.id}
              selected={acceptanceMode === mode.id}
              title={mode.title}
              subtitle={mode.subtitle}
              icon={mode.icon}
              onPress={() => {
                setAcceptanceMode(mode.id);
                setAcceptError('');
                if (mode.id === 'custom_route') {
                  setOrigin(null);
                  setDestination(null);
                }
              }}
            />
          ))}
        </View>

        {acceptanceMode === 'weekly_schedule' ? (
          <View style={styles.selectionContent}>
            {plansLoading ? <ActivityIndicator color={screenTheme.primary} /> : null}
            {plansError ? <Text accessibilityRole="alert" style={styles.error}>{plansError}</Text> : null}
            {!plansLoading && plans.length === 0 ? (
              <View style={styles.noPlan}>
                <Text style={styles.text}>برنامه‌ی فعالی پیدا نشد. اول مسیر رفت‌وآمد هفتگی‌ات را ثبت کن.</Text>
                <Pressable accessibilityRole="button" onPress={() => router.push('/(ride)/plan-editor')} style={styles.linkButton}>
                  <Ionicons name="add-circle-outline" size={18} color={screenTheme.primary} />
                  <Text style={styles.linkButtonText}>ثبت برنامه‌ی هفتگی</Text>
                </Pressable>
              </View>
            ) : null}
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const enabledDays = plan.days.filter((day) => day.isEnabled);
              return (
                <View
                  key={plan.id}
                  style={[styles.planChoice, isSelected && styles.planChoiceSelected]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setSelectedPlanId(plan.id);
                      setSelectedLegSequence(plan.legs[0]?.sequence ?? null);
                    }}
                    style={styles.planSelectButton}
                  >
                    <View style={styles.planHeading}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {isSelected ? <Ionicons name="checkmark-circle" size={19} color={screenTheme.primary} /> : null}
                    </View>
                    <Text style={styles.planDays}>
                      {enabledDays.slice(0, 4).map((day) => `${weekDayName(day.dayOfWeek)} ${day.departureTime.slice(0, 5)}`).join(' · ') || 'زمان‌بندی مشخص نشده'}
                    </Text>
                  </Pressable>
                  {plan.legs.map((leg) => (
                    <Pressable
                      key={leg.sequence}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected && selectedLegSequence === leg.sequence }}
                      onPress={() => {
                        setSelectedPlanId(plan.id);
                        setSelectedLegSequence(leg.sequence);
                      }}
                      style={[styles.legChoice, isSelected && selectedLegSequence === leg.sequence && styles.legChoiceSelected]}
                    >
                      <Ionicons name="train-outline" size={15} color={screenTheme.primary} />
                      <Text style={styles.legText}>{leg.startPlace} ← {leg.endPlace}</Text>
                      <Text style={styles.legDuration}>{toFaDigits(leg.estimatedDurationMinutes)} دقیقه</Text>
                    </Pressable>
                  ))}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.selectionContent}>
            <Text style={styles.text}>مسیر رفت‌وآمدی را که برای همین سفارش می‌پذیری مشخص کن.</Text>
            <PlaceField label="مبدأ مسیر من" value={origin?.title} placeholder="انتخاب مبدأ" icon="radio-button-on" onPress={() => chooseManualPlace('origin')} />
            <View style={styles.fieldDivider} />
            <PlaceField label="مقصد مسیر من" value={destination?.title} placeholder="انتخاب مقصد" icon="location" onPress={() => chooseManualPlace('destination')} />
            {origin && destination ? (
              <View style={styles.customPreview}>
                <Ionicons name="information-circle-outline" size={17} color={screenTheme.warning} />
                <Text style={styles.customPreviewText}>انحراف این مسیر در نسخه‌ی آزمایشی محاسبه نمی‌شود؛ مقدارهای کارت صرفاً نمونه‌اند.</Text>
              </View>
            ) : null}
          </View>
        )}
      </Panel>

      <Panel>
        <Text style={styles.title}>اثر تقریبی این پیشنهاد</Text>
        <Metric icon="time-outline" label="زمان اضافه" value={`${offer.extraMinutes} دقیقه`} />
        <Metric icon="walk-outline" label="پیاده‌روی اضافه" value={`${offer.extraWalkMeters} متر`} />
        <Text style={styles.disclaimer}>این مقادیر نمایشی‌اند و با مسیر انتخاب‌شده دوباره محاسبه نمی‌شوند.</Text>
      </Panel>

      <Panel>
        <Text style={styles.title}>تحویل امن</Text>
        <Text style={styles.text}>کدهای دریافت و تحویل باید در هر مرحله از سرویس امن گرفته شوند؛ در این نسخه کد واقعی تولید یا اعتبارسنجی نمی‌شود.</Text>
      </Panel>

      {acceptError ? <Text accessibilityRole="alert" style={styles.error}>{acceptError}</Text> : null}
      {acceptState === 'accepted' ? <Text style={styles.success}>پیشنهاد با روش انتخاب‌شده پذیرفته شد؛ این عملیات فعلاً نمایشی است.</Text> : null}
      <Pressable
        style={[styles.rejectButton, (acceptState === 'submitting' || acceptState === 'accepted') && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel="رد پیشنهاد و رفتن به پیشنهاد بعدی"
        disabled={acceptState === 'submitting' || acceptState === 'accepted'}
        onPress={handleReject}
      >
        <Ionicons name="close-circle-outline" size={20} color="#B42318" />
        <Text style={styles.rejectButtonText}>رد پیشنهاد</Text>
      </Pressable>
      <Pressable
        style={[styles.primaryButton, (!canAccept || acceptState === 'submitting' || acceptState === 'accepted') && styles.disabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canAccept || acceptState === 'submitting' || acceptState === 'accepted', busy: acceptState === 'submitting' }}
        disabled={!canAccept || acceptState === 'submitting' || acceptState === 'accepted'}
        onPress={() => void handleAccept()}
      >
        {acceptState === 'submitting' ? <ActivityIndicator color={screenTheme.onPrimary} /> : (
          <>
            <Text style={styles.primaryButtonText}>
              {acceptanceMode === 'weekly_schedule' ? 'قبول با برنامه‌ی هفتگی' : 'قبول با مسیر دلخواه'}
            </Text>
            <Ionicons name="checkmark-circle-outline" size={20} color={screenTheme.onPrimary} />
          </>
        )}
      </Pressable>
    </Screen>
  );
}

function ModeOption({ selected, title, subtitle, icon, onPress }: {
  selected: boolean;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.modeOption, selected && styles.modeOptionSelected]}
    >
      <View style={[styles.modeIcon, selected && styles.modeIconSelected]}>
        <Ionicons name={icon} size={19} color={selected ? '#FFFFFF' : screenTheme.primary} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={19} color={selected ? screenTheme.primary : screenTheme.border} />
    </Pressable>
  );
}

function RouteStop({ label, place, icon }: { label: string; place: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={styles.routeStop}>
      <Ionicons name={icon} size={18} color={screenTheme.primary} />
      <View style={styles.flex}>
        <Text style={styles.routeLabel}>{label}</Text>
        <Text style={styles.routeValue}>{place}</Text>
      </View>
    </View>
  );
}

function Metric({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={18} color={screenTheme.primary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{toFaDigits(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  offerHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  title: { fontFamily: AppFonts.bold, fontSize: 15, color: screenTheme.text, textAlign: 'right' },
  price: { fontFamily: AppFonts.bold, fontSize: 15, color: screenTheme.primary },
  muted: { fontFamily: AppFonts.regular, fontSize: 12, color: screenTheme.textSecondary, textAlign: 'right', marginTop: 3 },
  offerRoute: { gap: 7, marginTop: 7 },
  routeStop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  routeLine: { width: 1, height: 12, backgroundColor: screenTheme.border, marginRight: 8 },
  routeLabel: { fontFamily: AppFonts.regular, fontSize: 10, color: screenTheme.textSecondary, textAlign: 'right' },
  routeValue: { fontFamily: AppFonts.semiBold, fontSize: 13, color: screenTheme.text, textAlign: 'right', marginTop: 2 },
  modeList: { gap: 8, marginTop: 10 },
  modeOption: { minHeight: 62, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1, borderColor: screenTheme.border, borderRadius: 13, backgroundColor: '#FFFFFF' },
  modeOptionSelected: { borderColor: screenTheme.primary, backgroundColor: '#F1F8F3' },
  modeIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: screenTheme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  modeIconSelected: { backgroundColor: screenTheme.primary },
  modeTitle: { fontFamily: AppFonts.semiBold, fontSize: 12, color: screenTheme.text, textAlign: 'right' },
  modeSubtitle: { fontFamily: AppFonts.regular, fontSize: 10, color: screenTheme.textSecondary, textAlign: 'right', marginTop: 3 },
  selectionContent: { gap: 8, marginTop: 10 },
  planChoice: { gap: 7, borderWidth: 1, borderColor: screenTheme.border, borderRadius: 12, padding: 10 },
  planChoiceSelected: { borderColor: screenTheme.primary },
  planSelectButton: { gap: 6 },
  planHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  planName: { fontFamily: AppFonts.semiBold, fontSize: 12, color: screenTheme.text, textAlign: 'right' },
  planDays: { fontFamily: AppFonts.regular, fontSize: 10, color: screenTheme.textSecondary, textAlign: 'right' },
  legChoice: { minHeight: 36, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 7, borderRadius: 9, backgroundColor: '#F7F9F7' },
  legChoiceSelected: { backgroundColor: screenTheme.primaryLight },
  legText: { flex: 1, fontFamily: AppFonts.medium, fontSize: 10, color: screenTheme.text, textAlign: 'right' },
  legDuration: { fontFamily: AppFonts.regular, fontSize: 10, color: screenTheme.textSecondary },
  noPlan: { gap: 8, padding: 10, borderRadius: 11, backgroundColor: '#F7F9F7' },
  linkButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  linkButtonText: { fontFamily: AppFonts.semiBold, fontSize: 12, color: screenTheme.primary },
  fieldDivider: { height: StyleSheet.hairlineWidth, backgroundColor: screenTheme.border, marginHorizontal: 8 },
  customPreview: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 6, padding: 9, borderRadius: 10, backgroundColor: '#FDF5E9' },
  customPreviewText: { flex: 1, fontFamily: AppFonts.regular, fontSize: 10, lineHeight: 17, color: screenTheme.warning, textAlign: 'right' },
  metric: { minHeight: 34, flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  metricLabel: { flex: 1, fontFamily: AppFonts.medium, fontSize: 12, color: screenTheme.textSecondary, textAlign: 'right' },
  metricValue: { fontFamily: AppFonts.bold, fontSize: 13, color: screenTheme.text },
  disclaimer: { fontFamily: AppFonts.regular, fontSize: 10, lineHeight: 17, color: screenTheme.textSecondary, textAlign: 'right' },
  text: { fontFamily: AppFonts.regular, fontSize: 12, lineHeight: 21, color: screenTheme.textSecondary, textAlign: 'right' },
  primaryButton: { minHeight: 54, borderRadius: 15, backgroundColor: screenTheme.primary, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  rejectButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: '#F1C5C2', backgroundColor: '#FFFFFF', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  rejectButtonText: { fontFamily: AppFonts.semiBold, fontSize: 13, color: '#B42318' },
  primaryButtonText: { fontFamily: AppFonts.bold, fontSize: 14, color: screenTheme.onPrimary },
  disabled: { opacity: 0.5 },
  error: { fontFamily: AppFonts.medium, fontSize: 12, lineHeight: 20, color: '#B42318', textAlign: 'right' },
  success: { fontFamily: AppFonts.medium, fontSize: 12, lineHeight: 20, color: screenTheme.primary, textAlign: 'right' },
});
