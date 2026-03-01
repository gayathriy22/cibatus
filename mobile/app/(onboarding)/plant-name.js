import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { colors, spacing, typography } from '@/theme/tokens';
import { z } from 'zod';

const schema = z.object({
  plantName: z.string().min(1, 'Give your plant a name'),
});

export default function PlantNameScreen() {
  const { plantName, setPlantName } = useOnboarding();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { plantName: plantName || '' },
  });

  const next = handleSubmit((data) => {
    setPlantName(data.plantName.trim());
    router.push('/(onboarding)/plant-photo');
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Name your plant</Text>
      <Text style={styles.subtitle}>Give your plant a name so you can care for it.</Text>

      <Controller
        control={control}
        name="plantName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Plant name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.plantName?.message}
            placeholder="e.g. Jonathan"
            autoCapitalize="words"
          />
        )}
      />

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
  button: { marginTop: 'auto', marginBottom: spacing.xl },
});
