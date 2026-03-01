import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useScreenTime } from '@/contexts/ScreenTimeContext';
import { getTimeHistoryRange } from '@/lib/db';
import { colors, spacing, typography } from '@/theme/tokens';

function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

function SimpleBarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.minutes));
  return (
    <View style={styles.chart}>
      {data.map((d) => (
        <View key={d.date} style={styles.barWrap}>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                { height: `${(d.minutes / max) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>{d.date.slice(5)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StatsScreen() {
  const { profile } = useUserProfile();
  const { getTodayTotalMinutes, getPerAppBreakdown, simulateMinutes } = useScreenTime();
  const [minutes, setMinutes] = useState(0);
  const [breakdown, setBreakdown] = useState([]);
  const [devSlider, setDevSlider] = useState(false);
  const [simulateValue, setSimulateValue] = useState(120);

  const historyQuery = useQuery({
    queryKey: ['time-history', profile?.user_id],
    queryFn: () => getTimeHistoryRange(profile?.user_id, 7),
    enabled: !!profile?.user_id,
  });

  useEffect(() => {
    getTodayTotalMinutes().then(setMinutes);
    if (profile?.apps_to_track?.length) {
      getPerAppBreakdown(profile.apps_to_track).then(setBreakdown);
    }
  }, [profile?.apps_to_track, getTodayTotalMinutes, getPerAppBreakdown]);

  const goalMinutes = (profile?.daily_time_goal ?? 2) * 60;
  const history = historyQuery.data ?? [];
  const chartData = history
    .slice(-7)
    .map((h) => ({
      date: h.date_time.slice(0, 10),
      minutes: h.daily_total,
    }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text
          style={styles.cardTitle}
          onLongPress={() => setDevSlider((s) => !s)}
        >
          Today's screentime
        </Text>
        <ProgressBar value={minutes} max={goalMinutes} />
        <Text style={styles.progressText}>
          {Math.round(minutes)} min / {goalMinutes} min goal
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Plant health (last 7 days)</Text>
        {chartData.length > 0 ? (
          <SimpleBarChart data={chartData} />
        ) : (
          <Text style={styles.emptyText}>No history yet</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Activity</Text>
        {(breakdown.length ? breakdown : [{ app: '—', minutes: 0 }])
          .sort((a, b) => b.minutes - a.minutes)
          .map(({ app, minutes: m }) => (
            <View key={app} style={styles.activityRow}>
              <Text style={styles.activityApp}>{app}</Text>
              <Text style={styles.activityMinutes}>{m} min</Text>
            </View>
          ))}
      </View>

      <View style={styles.devArea}>
        {devSlider ? (
          <View style={styles.devPanel}>
            <Text style={styles.devTitle}>Simulate screentime (dev)</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.devLabel}>Minutes:</Text>
              <TextInput
                style={styles.devInput}
                value={String(simulateValue)}
                onChangeText={(t) => setSimulateValue(Number(t) || 0)}
                keyboardType="number-pad"
              />
            </View>
            <TouchableOpacity
              style={styles.devButtonWrap}
              onPress={async () => {
                await simulateMinutes(simulateValue);
              }}
            >
              <Text style={styles.devButton}>Apply</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
  progressTrack: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginTop: spacing.sm,
  },
  barWrap: { flex: 1, alignItems: 'center' },
  barBg: {
    width: 24,
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  barLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  activityApp: { ...typography.body, color: colors.text },
  activityMinutes: { ...typography.bodySmall, color: colors.textSecondary },
  devArea: { marginTop: spacing.xl },
  devPanel: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  devTitle: { ...typography.bodySmall, marginBottom: spacing.sm },
  devLabel: { ...typography.caption },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  devInput: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 8,
    padding: 8,
    minWidth: 60,
    ...typography.body,
  },
  devButtonWrap: { marginTop: spacing.sm },
  devButton: {
    ...typography.button,
    color: colors.primary,
  },
});
