import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { signUpSchema } from '@/features/auth/schemas';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/tokens';

export default function SignUpScreen() {
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', first_name: '', password: '' },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { first_name: data.first_name } },
      });
      if (error) throw error;
      if (!authData.user?.id) throw new Error('No user returned');
      return authData.user.id;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth-session'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      await queryClient.refetchQueries({ queryKey: ['auth-session'] });
      router.replace('/');
    },
    onError: (err) => {
      setError('root', { message: err.message ?? 'Create account failed' });
    },
  });

  const onSubmit = handleSubmit((data) => signUpMutation.mutate(data));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join Cibatus and grow your plant</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}
        />
        <Controller
          control={control}
          name="first_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="First name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.first_name?.message}
              autoCapitalize="words"
              autoComplete="given-name"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              secureTextEntry
              autoComplete="new-password"
            />
          )}
        />

        {errors.root ? (
          <Text style={styles.rootError}>{errors.root.message}</Text>
        ) : null}

        <Button
          title="Create account"
          onPress={onSubmit}
          loading={signUpMutation.isPending}
          style={styles.button}
        />

        <Link href="/(auth)/sign-in" asChild>
          <Text style={styles.link}>Sign In</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
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
  button: { marginTop: spacing.md, marginBottom: spacing.lg },
  rootError: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  link: {
    ...typography.body,
    color: colors.primary,
    textAlign: 'center',
  },
});
