
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#DCFCE7',

        tabBarStyle: {
          flexDirection: 'row-reverse',
          backgroundColor: Colors.light.primary,
          height: 65,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
          position: 'absolute',
          bottom: 8,
          width: '100%',
          maxWidth: 660,
          alignSelf: 'center',
          borderRadius: 24,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 6,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },

      }}
    >


      <Tabs.Screen
        name="profile"
        options={{
          title: 'پروفایل',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-circle-outline"
              size={22}
              color={color}
            />
          ),
        }}
      />


      <Tabs.Screen
        name="send"
        options={{
          title: 'ارسال بسته',
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="cube-outline"
              size={22}
              color={color}
            />
          ),
        }}
      />



      <Tabs.Screen
        name="plan"
        options={{
          title: 'برنامه هفتگی',
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'داشبورد',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={22}
              color={color}
            />
          ),
        }}
      />


    </Tabs>
  );
}
