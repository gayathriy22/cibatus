import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { AuthSync } from '@/components/AuthSync';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { ScreenTimeProvider } from '@/contexts/ScreenTimeContext';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <ScreenTimeProvider>
        <OnboardingProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </OnboardingProvider>
      </ScreenTimeProvider>
    </QueryClientProvider>
  );
}
