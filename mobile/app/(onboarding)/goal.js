import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/Button';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { colors, spacing, typography } from '@/theme/tokens';

const MIN_HOURS = 0.5;
const MAX_HOURS = 12;
const STEP = 0.5;

export default function GoalScreen() {
  const insets = useSafeAreaInsets();
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

  const extraTop = Dimensions.get('window').height * 0.15;
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xl) + extraTop }]}>
      <OnboardingHeader subtitle="what is your daily screentime goal?" />
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
      <Button title="next →" onPress={next} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: { fontSize: 28, color: colors.white, fontWeight: '600' },
  valueWrap: { marginHorizontal: spacing.xl, alignItems: 'center', minWidth: 80 },
  value: { fontSize: 36, fontWeight: '700', color: colors.text },
  unit: { ...typography.body, color: colors.text, marginTop: spacing.xs },
  button: { marginTop: 'auto', marginBottom: spacing.xl, borderRadius: 9999 },
});
