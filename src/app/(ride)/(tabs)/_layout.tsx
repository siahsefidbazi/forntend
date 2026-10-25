import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { RideColors, RideFonts } from '@/constants/ride';

export default function RideTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: RideColors.textInverse,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.72)',
        tabBarStyle: {
          flexDirection: 'row-reverse',
          backgroundColor: RideColors.primary,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 12,
          left: '4%',
          right: '4%',
          borderRadius: 22,
          elevation: 8,
          shadowColor: RideColors.shadow,
          shadowOpacity: 0.22,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        },
        tabBarLabelStyle: {
          fontFamily: RideFonts.medium,
          fontSize: 11.5,
        },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'خانه',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journeys"
        options={{
          title: 'سفرهای من',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'پروفایل',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
