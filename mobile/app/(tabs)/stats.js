import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useScreenTime } from '@/contexts/ScreenTimeContext';
import { getAppIconSource } from '@/lib/appIcons';
import { getTimeHistoryRange } from '@/lib/db';
import { colors, spacing, typography } from '@/theme/tokens';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h} hrs, ${m} min` : `${h} hrs`;
}

function ProgressBar({ value, max, overGoal }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          overGoal && styles.progressFillOver,
          { width: `${pct * 100}%` },
        ]}
      />
    </View>
  );
}

/** Build 7-day bar chart data: last 7 calendar days, one entry per day with daily_total. */
function useLast7DaysChart(profileUserId) {
  const query = useQuery({
    queryKey: ['time-history', profileUserId, 7],
    queryFn: () => getTimeHistoryRange(profileUserId, 7),
    enabled: !!profileUserId,
  });
  const raw = query.data ?? [];
  const byDate = {};
  raw.forEach((row) => {
    const date = (row.date_time || row.dateTime || '').slice(0, 10);
    if (!date) return;
    const total = row.daily_total ?? row.dailyTotal ?? 0;
    if (byDate[date] == null || total > (byDate[date] ?? 0)) byDate[date] = total;
  });
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
    out.push({
      date: dateStr,
      label: dayLabel,
      minutes: byDate[dateStr] ?? 0,
    });
  }
  return { chartData: out, isLoading: query.isLoading };
}

function BarChart({ data, goalMinutes }) {
  const maxMinutes = Math.max(1, goalMinutes, ...data.map((d) => d.minutes));
  return (
    <View style={styles.chart}>
      {data.map((d) => (
        <View key={d.date} style={styles.barWrap}>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                { height: `${Math.min(100, (d.minutes / maxMinutes) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>{d.label}</Text>
          <Text style={styles.barValue} numberOfLines={1}>
            {d.minutes < 60 ? `${d.minutes}m` : `${Math.floor(d.minutes / 60)}h`}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const { getTodayTotalMinutes, getPerAppBreakdown } = useScreenTime();
  const [minutes, setMinutes] = useState(0);
  const [breakdown, setBreakdown] = useState([]);

  const { chartData, isLoading } = useLast7DaysChart(profile?.user_id);
  const goalMinutes = (profile?.daily_time_goal ?? 2) * 60;
  const extraTop = Dimensions.get('window').height * 0.05;

  useEffect(() => {
    getTodayTotalMinutes().then(setMinutes);
    if (profile?.apps_to_track?.length) {
      getPerAppBreakdown(profile.apps_to_track).then(setBreakdown);
    }
  }, [profile?.apps_to_track, getTodayTotalMinutes, getPerAppBreakdown]);

  const activityList = (breakdown.length ? breakdown : [{ app: '—', minutes: 0 }])
    .sort((a, b) => b.minutes - a.minutes);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, spacing.lg) + extraTop }]}
    >
      <Text style={styles.title}>your stats</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>today's screentime</Text>
        <ProgressBar value={minutes} max={goalMinutes} overGoal={minutes > goalMinutes} />
        <Text style={styles.progressCaption}>
          {formatDuration(minutes)} / {goalMinutes / 60} hr{(goalMinutes / 60) !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>plant health</Text>
        {isLoading ? (
          <Text style={styles.graphPlaceholderText}>loading...</Text>
        ) : (
          <BarChart data={chartData} goalMinutes={goalMinutes} />
        )}
      </View>

      <Text style={styles.sectionTitle}>activity</Text>
      <View style={styles.activityGrid}>
        {activityList.map(({ app, minutes: m }, i) => {
          const iconSource = getAppIconSource(app);
          return (
            <View key={`${app}-${i}`} style={styles.activityItem}>
              <Text style={styles.activityRank}>{i + 1}</Text>
              {iconSource ? (
                <Image source={iconSource} style={styles.activityIcon} resizeMode="contain" />
              ) : null}
              <Text style={styles.activityApp} numberOfLines={1}>{app}</Text>
              <Text style={styles.activityMinutes}>{formatDuration(m)}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
    textTransform: 'lowercase',
  },
  card: {
    backgroundColor: colors.cardGreen,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardGreenBorder,
  },
  cardTitle: {
    ...typography.titleSmall,
    color: colors.text,
    marginBottom: spacing.sm,
    textTransform: 'lowercase',
  },
  progressCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.progressTrackGreen,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.progressGreen, borderRadius: 4 },
  progressFillOver: { backgroundColor: colors.primary },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    marginTop: spacing.sm,
  },
  barWrap: { flex: 1, alignItems: 'center' },
  barBg: {
    width: 24,
    height: 88,
    backgroundColor: colors.progressTrackGreen,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    minHeight: 4,
    backgroundColor: colors.progressGreen,
    borderRadius: 6,
  },
  barLabel: { ...typography.caption, color: colors.text, marginTop: 4 },
  barValue: { ...typography.caption, color: colors.textSecondary, marginTop: 2, fontSize: 10 },
  graphPlaceholderText: {
    ...typography.body,
    color: colors.text,
    textTransform: 'lowercase',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.text,
    marginBottom: spacing.sm,
    textTransform: 'lowercase',
  },
  activityGrid: {},
  activityItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  activityRank: { ...typography.body, fontWeight: '600', color: colors.text, marginRight: spacing.xs, minWidth: 16 },
  activityIcon: { width: 22, height: 22, marginRight: spacing.xs, borderRadius: 5 },
  activityApp: { ...typography.body, color: colors.text, flex: 1 },
  activityMinutes: { ...typography.bodySmall, color: colors.textSecondary },
});
