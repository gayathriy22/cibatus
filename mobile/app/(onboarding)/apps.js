import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/Button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useScreenTime } from '@/contexts/ScreenTimeContext';
import { colors, spacing, typography } from '@/theme/tokens';

export default function AppsScreen() {
  const { appsToTrack, setAppsToTrack } = useOnboarding();
  const { getInstalledApplications } = useScreenTime();
  const [installedApps, setInstalledApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstalledApplications()
      .then((apps) => setInstalledApps(Array.isArray(apps) ? apps : []))
      .catch(() => setInstalledApps([]))
      .finally(() => setLoading(false));
  }, [getInstalledApplications]);

  const toggle = (bundleId) => {
    if (appsToTrack.includes(bundleId)) {
      setAppsToTrack(appsToTrack.filter((id) => id !== bundleId));
    } else {
      setAppsToTrack([...appsToTrack, bundleId]);
    }
  };

  const next = () => router.push('/(onboarding)/plant-name');

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick apps to track</Text>
      <Text style={styles.subtitle}>Select the apps you want to limit. (Using dummy list for development.)</Text>

      <View style={styles.list}>
        {installedApps.map((app) => {
          const bundleId = app.bundleIdentifier || app.bundle_id;
          const displayName = app.displayName || app.display_name || bundleId || 'App';
          const selected = appsToTrack.includes(bundleId);
          return (
            <TouchableOpacity
              key={bundleId}
              onPress={() => toggle(bundleId)}
              style={[styles.item, selected && styles.itemSelected]}
              activeOpacity={0.7}
            >
              <Text style={[styles.itemText, selected && styles.itemTextSelected]} numberOfLines={1}>
                {displayName}
              </Text>
              {selected ? <Text style={styles.check}>✓</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <Button
        title="Next"
        onPress={next}
        disabled={appsToTrack.length === 0}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  list: { gap: spacing.sm, marginBottom: spacing.xl },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  itemSelected: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
  },
  itemText: { ...typography.body, color: colors.text },
  itemTextSelected: { fontWeight: '600', color: colors.primary },
  check: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  button: { marginTop: 'auto', marginBottom: spacing.xl },
  loader: { marginTop: spacing.xxl },
});
