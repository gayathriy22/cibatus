import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  createPlant,
  createUserProfile,
  insertPlantCharacter,
} from '@/lib/db';
import { DEFAULT_CHARACTER_IMAGE_URI } from '@/types/database';
import { colors, spacing, typography } from '@/theme/tokens';

function uuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isHttpUrl(s) {
  return s.startsWith('http://') || s.startsWith('https://');
}

export default function LoadingScreen() {
  const { session, authUid } = useUserProfile();
  const queryClient = useQueryClient();
  const { first_name, goalHours, appsToTrack, plantName, plantImageUri, reset } = useOnboarding();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!authUid) return;

      const nameToUse =
        (first_name?.trim() && first_name.trim()) ||
        ((session?.user?.user_metadata?.first_name?.trim?.() ?? '') || 'User');

      const plant_uid = uuidV4();
      const imgUri = plantImageUri && isHttpUrl(plantImageUri) ? plantImageUri : null;

      const plant = await createPlant(plant_uid, plantName || 'My Plant', imgUri);
      if (!plant && !cancelled) {
        setError('Could not create plant.');
        return;
      }

      const user = await createUserProfile(authUid, {
        first_name: nameToUse,
        daily_time_goal: goalHours,
        apps_to_track: appsToTrack,
        plant_uid,
      });
      if (!user && !cancelled) {
        setError('Could not create profile.');
        return;
      }

      await insertPlantCharacter(plant_uid, 'very healthy', DEFAULT_CHARACTER_IMAGE_URI);

      if (cancelled) return;
      await queryClient.invalidateQueries({ queryKey: ['auth-session'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      reset();
      router.replace('/(tabs)/home');
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [authUid, session?.user?.user_metadata?.first_name, first_name, goalHours, appsToTrack, plantName, plantImageUri, queryClient, reset]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setting up your plant...</Text>
      <Text style={styles.subtitle}>Just a moment.</Text>
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
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
