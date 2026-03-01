import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { createUserProfile } from '@/lib/db';
import { colors, spacing, typography } from '@/theme/tokens';

/** Single shared plant; no new plant is created on signup/login. */
const DEFAULT_PLANT_UID = 'd40def0b-bb1b-4cc3-84da-9ea8da0c17f4';

const logo = require('../../assets/logo.png');

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  const { session, authUid } = useUserProfile();
  const queryClient = useQueryClient();
  const { first_name, goalHours, appsToTrack, reset } = useOnboarding();
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setProgress((p) => Math.min(p + 0.03, 0.9)), 120);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!authUid) return;

      const nameToUse =
        (first_name?.trim() && first_name.trim()) ||
        ((session?.user?.user_metadata?.first_name?.trim?.() ?? '') || 'User');

      const user = await createUserProfile(authUid, {
        first_name: nameToUse,
        daily_time_goal: goalHours,
        apps_to_track: appsToTrack,
        plant_uid: DEFAULT_PLANT_UID,
      });
      if (!user && !cancelled) {
        setError('Could not create profile.');
        return;
      }

      if (cancelled) return;
      setProgress(1);
      await queryClient.invalidateQueries({ queryKey: ['auth-session'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      reset();
      router.replace('/(tabs)/home');
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [authUid, session?.user?.user_metadata?.first_name, first_name, goalHours, appsToTrack, queryClient, reset]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const extraTop = Dimensions.get('window').height * 0.15;
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xl) + extraTop }]}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.welcome}>welcome to</Text>
      <Text style={styles.appName}>cibatus</Text>
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>loading your plant...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logo: { width: 120, height: 120, marginBottom: spacing.md },
  welcome: { ...typography.body, color: colors.text, marginBottom: spacing.xs, textTransform: 'lowercase' },
  appName: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: spacing.xl, textTransform: 'lowercase' },
  progressWrap: { width: '100%', maxWidth: 280, alignItems: 'center' },
  progressTrack: {
    height: 8,
    width: '100%',
    backgroundColor: colors.progressTrackGreen,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.progressGreen, borderRadius: 4 },
  progressLabel: { ...typography.body, color: colors.text, marginTop: spacing.sm, textTransform: 'lowercase' },
  error: { ...typography.body, color: colors.error },
});
