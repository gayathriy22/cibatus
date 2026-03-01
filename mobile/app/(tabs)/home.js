import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTimeHistorySync } from '@/hooks/useTimeHistorySync';
import { usePlantHealthUpdate } from '@/hooks/usePlantHealthUpdate';
import { useScreenTime } from '@/contexts/ScreenTimeContext';
import { getPlant, getPlantCharacter } from '@/lib/db';
import { healthToDisplayCopy } from '@/features/plant/health';
import { colors, spacing, typography } from '@/theme/tokens';

function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.progressWrap}>
      <Text style={styles.progressLabel}>{label}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.progressValue}>
        {Math.round(value)} / {max} min
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { profile } = useUserProfile();
  useTimeHistorySync();
  usePlantHealthUpdate();
  const { getTodayTotalMinutes, getTodayPickups, getPerAppBreakdown } = useScreenTime();

  const [minutes, setMinutes] = React.useState(0);
  const [pickups, setPickups] = React.useState(0);
  const [breakdown, setBreakdown] = React.useState([]);

  useEffect(() => {
    getTodayTotalMinutes().then(setMinutes);
    getTodayPickups().then(setPickups);
    if (profile?.apps_to_track?.length) {
      getPerAppBreakdown(profile.apps_to_track).then(setBreakdown);
    }
  }, [profile?.apps_to_track, getTodayTotalMinutes, getTodayPickups, getPerAppBreakdown]);

  const plantUid = profile?.plant_uid ?? null;
  const plantQuery = useQuery({
    queryKey: ['plant', plantUid],
    queryFn: () => (plantUid ? getPlant(plantUid) : null),
    enabled: !!plantUid,
  });
  const characterQuery = useQuery({
    queryKey: ['plant-character', plantUid],
    queryFn: () => (plantUid ? getPlantCharacter(plantUid) : null),
    enabled: !!plantUid,
  });

  const plant = plantQuery.data;
  const character = characterQuery.data;
  const health = character?.character_health ?? 'okay';
  const goalMinutes = (profile?.daily_time_goal ?? 2) * 60;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        {(plant?.plant_name || 'Your plant').toLowerCase()} {healthToDisplayCopy(health)}
      </Text>

      <View style={styles.plantFrame}>
        {plant?.plant_img_uri ? (
          <Image source={{ uri: plant.plant_img_uri }} style={styles.plantImage} resizeMode="contain" />
        ) : (
          <View style={styles.plantPlaceholder}>
            <Text style={styles.plantPlaceholderText}>🌱</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's screentime</Text>
        <ProgressBar value={minutes} max={goalMinutes} label="Progress" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top activity</Text>
        {(breakdown.length ? breakdown : [{ app: '—', minutes: 0 }])
          .sort((a, b) => b.minutes - a.minutes)
          .slice(0, 5)
          .map(({ app, minutes: m }) => (
            <View key={app} style={styles.activityRow}>
              <Text style={styles.activityApp}>{app}</Text>
              <Text style={styles.activityMinutes}>{m} min</Text>
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  greeting: {
    ...typography.titleSmall,
    color: colors.text,
    marginBottom: spacing.md,
  },
  plantFrame: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    marginBottom: spacing.lg,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  plantImage: { width: '100%', height: '100%' },
  plantPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  plantPlaceholderText: { fontSize: 80 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTitle: {
    ...typography.titleSmall,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  progressWrap: { marginTop: spacing.xs },
  progressLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressValue: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  activityApp: { ...typography.body, color: colors.text },
  activityMinutes: { ...typography.bodySmall, color: colors.textSecondary },
});
