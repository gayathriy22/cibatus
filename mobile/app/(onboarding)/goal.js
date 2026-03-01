import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/Button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { colors, spacing, typography } from '@/theme/tokens';

const MIN_HOURS = 0.5;
const MAX_HOURS = 12;
const STEP = 0.5;

export default function GoalScreen() {
  const { session } = useUserProfile();
  const { goalHours, setGoalHours, first_name, setFirstName } = useOnboarding();

  useEffect(() => {
    const meta = session?.user?.user_metadata?.first_name;
    if (meta && typeof meta === 'string' && !first_name.trim()) {
      setFirstName(meta);
    }
  }, [session?.user?.user_metadata?.first_name, first_name, setFirstName]);

  const decrement = () => setGoalHours(Math.max(MIN_HOURS, goalHours - STEP));
  const increment = () => setGoalHours(Math.min(MAX_HOURS, goalHours + STEP));

  const next = () => router.push('/(onboarding)/apps');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily screentime goal</Text>
      <Text style={styles.subtitle}>Set how many hours you want to limit screen time to each day.</Text>

      <View style={styles.stepper}>
        <TouchableOpacity onPress={decrement} style={styles.stepperButton} accessibilityLabel="Decrease">
          <Text style={styles.stepperLabel}>−</Text>
        </TouchableOpacity>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{goalHours}</Text>
          <Text style={styles.unit}>hours</Text>
        </View>
        <TouchableOpacity onPress={increment} style={styles.stepperButton} accessibilityLabel="Increase">
          <Text style={styles.stepperLabel}>+</Text>
        </TouchableOpacity>
      </View>

      <Button title="Next" onPress={next} style={styles.button} />
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '600',
  },
  valueWrap: {
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    minWidth: 80,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  unit: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  button: { marginTop: 'auto', marginBottom: spacing.xl },
});
