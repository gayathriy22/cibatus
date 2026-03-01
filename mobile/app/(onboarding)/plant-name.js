import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { colors, spacing, typography } from '@/theme/tokens';
import { z } from 'zod';

const schema = z.object({
  plantName: z.string().min(1, 'Give your plant a name'),
});

export default function PlantNameScreen() {
  const insets = useSafeAreaInsets();
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

  const extraTop = Dimensions.get('window').height * 0.15;
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xl) + extraTop }]}>
      <OnboardingHeader subtitle="what is your plant's name?" />
      <View style={styles.form}>
        <Controller
          control={control}
          name="plantName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label=""
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.plantName?.message}
              placeholder=""
              autoCapitalize="words"
              style={styles.input}
            />
          )}
        />
        <Button title="next →" onPress={next} style={styles.button} />
      </View>
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
  form: { flex: 1, maxWidth: 340, alignSelf: 'center', width: '100%' },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  button: { marginTop: spacing.xl, borderRadius: 9999 },
});
