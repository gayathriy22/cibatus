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
import { signInSchema } from '@/features/auth/schemas';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/tokens';

const EXTRA_TOP_AUTH = Dimensions.get('window').height * 0.05;

const logo = require('../../assets/logo.png');

export default function SignInScreen() {
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signInMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth-session'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      await queryClient.refetchQueries({ queryKey: ['auth-session'] });
      await queryClient.refetchQueries({ queryKey: ['user-profile'] });
      router.replace('/');
    },
    onError: (err) => {
      setError('root', { message: err.message ?? 'Sign in failed' });
    },
  });

  const onSubmit = handleSubmit((data) => signInMutation.mutate(data));

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
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="password"
                style={styles.input}
              />
            )}
          />

          {errors.root ? (
            <Text style={styles.rootError}>{errors.root.message}</Text>
          ) : null}

          <Button
            title="sign in"
            onPress={onSubmit}
            loading={signInMutation.isPending}
            style={styles.button}
          />

          <View style={styles.linkRow}>
            <Text style={styles.linkPrefix}>or </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Text style={styles.link}>Create an Account</Text>
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
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
