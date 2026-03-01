import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTimeHistorySync } from '@/hooks/useTimeHistorySync';
import { usePlantHealthUpdate } from '@/hooks/usePlantHealthUpdate';
import { useScreenTime } from '@/contexts/ScreenTimeContext';
import { getPlant, getPlantCharacter, getTimeHistoryRange } from '@/lib/db';
import { healthToDisplayCopy } from '@/features/plant/health';
import { getAppIconSource } from '@/lib/appIcons';
import { colors, spacing, typography } from '@/theme/tokens';

const logo = require('../../assets/logo.png');

/** Monday = 0, Sunday = 6. Returns array of 7 date strings (YYYY-MM-DD) for current week. */
function getCurrentWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 Sun .. 6 Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Watering emoji for a past day.
 * 💦 nutrient water: screentime within first 50% of goal
 * 💧 pure water: screentime within 50–100% of goal
 * 🥵 no water: over goal
 * 💀 kill: last 4 days (including this day) were all over goal
 */
function getWateringEmoji(dayMinutes, goalMinutes, weekMinutesByDate, dateStr) {
  if (goalMinutes <= 0) return '💧';
  const weekDates = getCurrentWeekDates();
  const idx = weekDates.indexOf(dateStr);
  if (idx < 0) return '🥵';

  const isOverGoal = (m) => m > goalMinutes;
  let consecutiveOver = 0;
  for (let i = idx; i >= 0 && isOverGoal(weekMinutesByDate[weekDates[i]] ?? 0); i--) {
    consecutiveOver++;
  }
  if (consecutiveOver >= 4) return '💀';
  if (dayMinutes > goalMinutes) return '🥵';
  if (dayMinutes < goalMinutes * 0.5) return '💦';
  return '💧';
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h} hr${h !== 1 ? 's' : ''}, ${m} min` : `${h} hr${h !== 1 ? 's' : ''}`;
}

function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
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
  const characterImageUri = character?.plant_img_uri ?? character?.character_image_uri ?? null;
  const health = character?.character_health ?? 'okay';
  const goalMinutes = (profile?.daily_time_goal ?? 2) * 60;

  const timeHistoryQuery = useQuery({
    queryKey: ['time-history', profile?.user_id, 14],
    queryFn: () => getTimeHistoryRange(profile?.user_id, 14),
    enabled: !!profile?.user_id,
  });
  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const todayStr = new Date().toISOString().slice(0, 10);

  const weekMinutesByDate = useMemo(() => {
    const raw = timeHistoryQuery.data ?? [];
    const byDate = {};
    raw.forEach((row) => {
      const date = (row.date_time || row.dateTime || '').slice(0, 10);
      if (!date) return;
      const total = row.daily_total ?? row.dailyTotal ?? 0;
      if (byDate[date] == null || total > (byDate[date] ?? 0)) byDate[date] = total;
    });
    return byDate;
  }, [timeHistoryQuery.data]);

  const weekDots = useMemo(() => {
    return weekDates.map((dateStr) => {
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const minutes = weekMinutesByDate[dateStr] ?? 0;
      const showGreen = !isPast || isToday;
      const emoji = isPast && !isToday
        ? getWateringEmoji(minutes, goalMinutes, weekMinutesByDate, dateStr)
        : null;
      return { dateStr, showGreen, emoji };
    });
  }, [weekDates, todayStr, weekMinutesByDate, goalMinutes]);

  const displayName = (plant?.plant_name || 'Your plant').toLowerCase();
  const statusCopy = healthToDisplayCopy(health);
  const topActivity = (breakdown.length ? breakdown : [{ app: '—', minutes: 0 }])
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);

  const extraTop = Dimensions.get('window').height * 0.05;
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, spacing.lg) + extraTop }]}
    >
      <Text style={styles.userName}>{displayName}</Text>
      <Text style={styles.status}>{statusCopy}</Text>

      <View style={styles.plantFrame}>
        {characterImageUri ? (
          <Image source={{ uri: characterImageUri }} style={styles.plantImage} resizeMode="contain" />
        ) : (
          <Image source={logo} style={styles.plantImage} resizeMode="contain" />
        )}
      </View>
      <View style={styles.dots}>
        {weekDots.map(({ showGreen, emoji }, i) =>
          emoji ? (
            <Text key={i} style={styles.dotEmoji}>{emoji}</Text>
          ) : (
            <View key={i} style={[styles.dot, showGreen && styles.dotActive]} />
          )
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>today's screentime</Text>
        <ProgressBar value={minutes} max={goalMinutes} />
        <Text style={styles.progressCaption}>
          {formatDuration(minutes)} / {goalMinutes / 60} hr{(goalMinutes / 60) !== 1 ? 's' : ''}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>top activity</Text>
      {topActivity.map(({ app, minutes: m }, i) => {
        const iconSource = getAppIconSource(app);
        return (
          <View key={app} style={styles.activityRow}>
            <Text style={styles.activityRank}>{i + 1}</Text>
            {iconSource ? (
              <Image source={iconSource} style={styles.activityIcon} resizeMode="contain" />
            ) : null}
            <Text style={styles.activityApp}>{app}</Text>
            <Text style={styles.activityMinutes}>{formatDuration(m)}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
    textTransform: 'lowercase',
  },
  status: {
    ...typography.body,
    fontStyle: 'italic',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  plantFrame: {
    alignSelf: 'center',
    width: 180,
    height: 180,
    marginBottom: spacing.sm,
    borderRadius: 90,
    overflow: 'hidden',
    backgroundColor: colors.cardGreen,
  },
  plantImage: { width: '100%', height: '100%' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inputBorder },
  dotActive: { backgroundColor: colors.progressGreen },
  dotEmoji: { fontSize: 18 },
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
  progressWrap: { marginTop: spacing.xs },
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
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.text,
    marginBottom: spacing.sm,
    textTransform: 'lowercase',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  activityRank: { ...typography.body, fontWeight: '600', color: colors.text, marginRight: spacing.sm, minWidth: 20 },
  activityIcon: { width: 24, height: 24, marginRight: spacing.sm, borderRadius: 6 },
  activityApp: { ...typography.body, color: colors.text, flex: 1 },
  activityMinutes: { ...typography.bodySmall, color: colors.textSecondary },
});
