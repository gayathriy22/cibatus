import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';
import { createUserProfile } from '@/lib/db';
import { colors, spacing, typography } from '@/theme/tokens';

/** Single shared plant; no new plant is created on signup/login. */
const DEFAULT_PLANT_UID = 'd40def0b-bb1b-4cc3-84da-9ea8da0c17f4';
const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

const logo = require('../../assets/logo.png');

async function requestWithAuth(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? null;
  if (!token) throw new Error('Not authenticated');
  if (!BASE) throw new Error('Missing EXPO_PUBLIC_API_URL');

  const url = `${BASE.replace(/\/$/, '')}${path}`;
  const method = options.method ?? 'GET';
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers ?? {}),
  };
  if (options.body != null && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const body =
    options.body instanceof FormData
      ? options.body
      : options.body != null
        ? JSON.stringify(options.body)
        : undefined;
  const res = await fetch(url, { ...options, method, headers, body });
  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.detail || payload.error)) ||
      (typeof payload === 'string' ? payload : '') ||
      res.statusText;
    throw new Error(String(message || `HTTP ${res.status}`));
  }
  return payload;
}

async function updatePlantStrict(plantUid, plantUpdates) {
  try {
    const apiModule = await import('@/lib/api');
    const updatePlant = apiModule?.apiUpdatePlant;
    if (typeof updatePlant === 'function') {
      const result = await updatePlant(plantUid, plantUpdates);
      if (result == null) throw new Error('apiUpdatePlant returned null');
      return result;
    }
  } catch {
    // Fall through to direct request fallback.
  }
  return requestWithAuth(`/api/plants/${encodeURIComponent(plantUid)}`, {
    method: 'PATCH',
    body: plantUpdates,
  });
}

async function triggerGeminiGenerateStrict(plantUid) {
  try {
    const apiModule = await import('@/lib/api');
    const triggerGeminiGenerate = apiModule?.apiTriggerGeminiGenerate;
    if (typeof triggerGeminiGenerate === 'function') {
      const result = await triggerGeminiGenerate(plantUid);
      if (!result?.ok) throw new Error(result?.error || 'apiTriggerGeminiGenerate failed');
      return result;
    }
  } catch {
    // Fall through to direct request fallback.
  }
  return requestWithAuth('/gemini/generate_image', {
    method: 'POST',
    body: { plant_uid: plantUid },
  });
}

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  const { session, authUid } = useUserProfile();
  const queryClient = useQueryClient();
  const { first_name, goalHours, appsToTrack, scannedPlantUid, plantName, plantImageUri, reset } = useOnboarding();
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

      const appsList = Array.isArray(appsToTrack) ? appsToTrack : [];
      const plantUidToUse = scannedPlantUid || DEFAULT_PLANT_UID;
      const hasPlantImage =
        plantImageUri && typeof plantImageUri === 'string' && (plantImageUri.startsWith('http://') || plantImageUri.startsWith('https://'));

      // 1. Update the plant row with name and image URI in the DB BEFORE anything else that depends on it (e.g. Gemini).
      const plantUpdates = {};
      const nameToSet = plantName && typeof plantName === 'string' ? plantName.trim() : '';
      if (nameToSet) plantUpdates.plant_name = nameToSet;
      if (hasPlantImage) plantUpdates.plant_img_uri = plantImageUri;

      if (Object.keys(plantUpdates).length > 0) {
        try {
          await updatePlantStrict(plantUidToUse, plantUpdates);
        } catch (e) {
          if (!cancelled) setError(`Could not update plant: ${e?.message || 'unknown error'}`);
          return;
        }
      }

      if (cancelled) return;

      // 2. Only after plant is updated: create user profile.
      const user = await createUserProfile(authUid, {
        first_name: nameToUse,
        daily_time_goal: goalHours,
        apps_to_track: appsList,
        plant_uid: plantUidToUse,
      });
      if (!user && !cancelled) {
        setError('Could not create profile.');
        return;
      }

      if (cancelled) return;

      // 3. Only after plant name and image_uri are in DB: call Gemini (it reads plant from DB).
      if (hasPlantImage) {
        try {
          await triggerGeminiGenerateStrict(plantUidToUse);
        } catch (e) {
          if (!cancelled) setError(`Could not generate plant character: ${e?.message || 'unknown error'}`);
          return;
        }
      }

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
  }, [authUid, session?.user?.user_metadata?.first_name, first_name, goalHours, appsToTrack, scannedPlantUid, plantName, plantImageUri, queryClient, reset]);

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
