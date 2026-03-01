import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { colors } from '@/theme/tokens';

const iconMap = {
  home: 'home-outline',
  stats: 'bar-chart-outline',
  profile: 'person-outline',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={iconMap.home} size={24} color={color} />
              {focused ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.progressGreen, marginTop: 4 }} /> : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={iconMap.stats} size={24} color={color} />
              {focused ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.progressGreen, marginTop: 4 }} /> : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={iconMap.profile} size={24} color={color} />
              {focused ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.progressGreen, marginTop: 4 }} /> : null}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
