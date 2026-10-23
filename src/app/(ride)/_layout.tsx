import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { RideColors } from '@/constants/ride';
import { useAuth } from '@/features/auth/AuthProvider';

export default function RideLayout() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace('/(auth)/login');
    }
  }, [router, status]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: RideColors.background },
      }}
    />
  );
}
