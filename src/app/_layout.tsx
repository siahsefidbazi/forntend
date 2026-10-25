import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AppFonts } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { TripProvider } from '@/features/trip/TripProvider';
import { OfferQueueProvider } from '@/features/dashboard/OfferQueueProvider';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [loaded] = useFonts({
    [AppFonts.regular]: require('../../assets/fonts/Vazirmatn-Regular.ttf'),
    [AppFonts.medium]: require('../../assets/fonts/Vazirmatn-Medium.ttf'),
    [AppFonts.semiBold]: require('../../assets/fonts/Vazirmatn-SemiBold.ttf'),
    [AppFonts.bold]: require('../../assets/fonts/Vazirmatn-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <TripProvider>
        <OfferQueueProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </OfferQueueProvider>
      </TripProvider>
    </AuthProvider>
  );
}
