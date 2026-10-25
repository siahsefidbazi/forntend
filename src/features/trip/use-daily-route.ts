import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';

import { getDetourPreferences } from '@/api/detourPreferences';
import { describeError } from '@/api/errors';
import { listTravelPlans } from '@/api/travelPlans';
import type { DetourPreferences, TravelPlan } from '@/api/types';
import type { Coordinates } from '@/components/map/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { findTodayPlans, hasValidCoordinates } from './matching-state';
import { distanceMeters } from './route-matching';
import { useTrip } from './TripProvider';

const dateKey = () => new Date().toDateString();

export function useDailyRoute() {
  const trip = useTrip();
  const { status: authStatus } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [day, setDay] = useState(dateKey);
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [preferences, setPreferences] = useState<DetourPreferences | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const [manual, setManual] = useState(false);
  const [route, setRoute] = useState<Coordinates[] | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [resolving, setResolving] = useState(false);
  const loadController = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const todayPlans = useMemo(() => findTodayPlans(plans, new Date(day)), [plans, day]);
  const manualKey = JSON.stringify([day, trip.origin, trip.destination]);
  const plan = todayPlans.find((item) => item.id === trip.selectedPlanId);
  const planKey = JSON.stringify([day, plan]);
  const routeReady = enabled && status === 'ready' && !!route &&
    confirmation === (manual ? manualKey : planKey);

  const stop = useCallback(() => {
    loadController.current?.abort();
    generation.current++;
    setEnabled(false);
    setRoute(null);
    setConfirmation('');
    setResolving(false);
    setError('');
  }, []);

  useEffect(() => {
    const refreshDay = () => {
      const currentDay = dateKey();
      if (currentDay !== day) {
        stop();
        setDay(currentDay);
      }
    };
    const next = new Date();
    next.setHours(24, 0, 0, 0);
    const timer = setTimeout(refreshDay, next.getTime() - Date.now() + 50);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshDay();
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [day, stop]);

  const refresh = useCallback(() => {
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;
    setStatus('loading');
    setError('');
    void Promise.all([listTravelPlans(controller.signal), getDetourPreferences(controller.signal)])
      .then(([allPlans, limits]) => {
        if (controller.signal.aborted) return;
        setDay(dateKey());
        setPlans(allPlans);
        setPreferences(limits);
        setStatus('ready');
      }).catch((caught) => {
        if (!controller.signal.aborted) { setError(describeError(caught)); setStatus('error'); }
      });
  }, []);

  useFocusEffect(useCallback(() => {
    if (authStatus !== 'authenticated') { stop(); return; }
    if (!enabled) return;
    refresh();
    return () => { loadController.current?.abort(); generation.current++; setResolving(false); };
  }, [enabled, authStatus, refresh, stop]));

  const start = () => {
    trip.reset();
    setDay(dateKey());
    setManual(false);
    setStatus('loading');
    setEnabled(true);
  };

  const useManual = () => {
    generation.current++;
    setResolving(false);
    setManual(true);
    setRoute(null);
    setConfirmation('');
    trip.setSelectedPlan(null);
    trip.setSelectedLeg(null);
    trip.setOrigin(null);
    trip.setDestination(null);
    setError('');
  };

  const confirmManual = () => {
    if (!hasValidCoordinates(trip.origin) || !hasValidCoordinates(trip.destination)) return;
    const points = [trip.origin!, trip.destination!] as Coordinates[];
    if (distanceMeters(points[0], points[1]) < 25) {
      setError('مبدأ و مقصد باید دو نقطه‌ی متفاوت باشند.');
      return;
    }
    setError('');
    setManual(true);
    setRoute(points);
    setConfirmation(manualKey);
    trip.setSelectedPlan(null);
    trip.setSelectedLeg(null);
  };

  const confirmPlan = async (selected: TravelPlan) => {
    const request = ++generation.current;
    setResolving(true);
    setError('');
    try {
      if (Platform.OS === 'web') throw new Error('برای این برنامه، مبدأ و مقصد را روی نقشه مشخص کنید.');
      if (Platform.OS === 'android') {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') throw new Error('دسترسی مکان داده نشد؛ می‌توانید مسیر را روی نقشه انتخاب کنید.');
      }
      const legs = [...selected.legs].sort((a, b) => a.sequence - b.sequence);
      const names = [legs[0].startPlace, ...legs.map((leg) => leg.endPlace)];
      const points: Coordinates[] = [];
      for (const name of names) {
        const point = (await Location.geocodeAsync(name))[0];
        if (request !== generation.current) return;
        if (!hasValidCoordinates(point)) throw new Error(`مکان «${name}» پیدا نشد؛ مسیر را روی نقشه مشخص کنید.`);
        points.push({ latitude: point.latitude, longitude: point.longitude });
      }
      if (request !== generation.current || dateKey() !== day) return;
      trip.setSelectedPlan(selected.id);
      trip.setSelectedLeg(legs[0].sequence);
      setManual(false);
      setRoute(points);
      setConfirmation(JSON.stringify([day, selected]));
    } catch (caught) {
      if (request === generation.current) setError(describeError(caught));
    } finally {
      if (request === generation.current) setResolving(false);
    }
  };

  return { enabled, start, stop, status, error, todayPlans, manual, useManual,
    retry: refresh,
    confirmPlan, confirmManual, resolving, route: routeReady ? route : null,
    routeReady, preferences, trip, day };
}
