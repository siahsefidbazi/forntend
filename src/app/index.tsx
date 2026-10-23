import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/AuthProvider';

export default function AppIndex() {
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    router.replace(
      status === 'authenticated' ? '/(dashboard)/dashboard' : '/(auth)/login',
    );
  }, [status]);

  return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
}
