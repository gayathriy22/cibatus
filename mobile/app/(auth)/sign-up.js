import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { signUpSchema } from '@/features/auth/schemas';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/tokens';

const logo = require('../../assets/logo.png');
const EXTRA_TOP_AUTH = Dimensions.get('window').height * 0.05;

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
      router.replace('/(onboarding)/goal');
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
        contentContainerStyle={[styles.scroll, { paddingTop: spacing.xxl + EXTRA_TOP_AUTH }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.welcome}>welcome to</Text>
        <Text style={styles.appName}>cibatus</Text>
        <Text style={styles.pageTitle}>create an account</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="email address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />
            )}
          />
          <Controller
            control={control}
            name="first_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="first name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.first_name?.message}
                autoCapitalize="words"
                autoComplete="given-name"
                style={styles.input}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="new-password"
                style={styles.input}
              />
            )}
          />

          {errors.root ? (
            <Text style={styles.rootError}>{errors.root.message}</Text>
          ) : null}

          <Button
            title="create account"
            onPress={onSubmit}
            loading={signUpMutation.isPending}
            style={styles.button}
          />

          <View style={styles.linkRow}>
            <Text style={styles.linkPrefix}>have an account already? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <Text style={styles.link}>Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
    alignItems: 'center',
  },
  logoWrap: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
  welcome: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'lowercase',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'lowercase',
  },
  pageTitle: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xl,
    textTransform: 'lowercase',
  },
  form: {
    width: '100%',
    maxWidth: 340,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  button: { marginTop: spacing.lg, marginBottom: spacing.md, borderRadius: 9999 },
  rootError: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  linkPrefix: {
    ...typography.body,
    color: colors.text,
  },
  link: {
    ...typography.body,
    color: colors.text,
    textDecorationLine: 'underline',
  },
});
