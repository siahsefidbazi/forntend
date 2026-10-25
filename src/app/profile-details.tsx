import { Redirect } from 'expo-router';
import AccountScreen from '@/features/auth/AccountScreen';
import { useAuth } from '@/features/auth/AuthProvider';

export default function ProfileDetails() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  if (status === 'anonymous') return <Redirect href="/(auth)/login" />;
  return <AccountScreen />;
}
