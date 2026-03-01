import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/Button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { colors, spacing, typography } from '@/theme/tokens';

const APP_OPTIONS = ['Twitch', 'Instagram', 'Canvas', 'Messages'];

export default function AppsScreen() {
  const { appsToTrack, setAppsToTrack } = useOnboarding();

  const toggle = (app) => {
    if (appsToTrack.includes(app)) {
      setAppsToTrack(appsToTrack.filter((a) => a !== app));
    } else {
      setAppsToTrack([...appsToTrack, app]);
    }
  };

  const next = () => router.push('/(onboarding)/plant-name');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick apps to track</Text>
      <Text style={styles.subtitle}>Select the apps you want to limit.</Text>

      <View style={styles.list}>
        {APP_OPTIONS.map((app) => {
          const selected = appsToTrack.includes(app);
          return (
            <TouchableOpacity
              key={app}
              onPress={() => toggle(app)}
              style={[styles.item, selected && styles.itemSelected]}
              activeOpacity={0.7}
            >
              <Text style={[styles.itemText, selected && styles.itemTextSelected]}>{app}</Text>
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
});
