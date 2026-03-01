import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/Button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { disconnectPlant } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography } from '@/theme/tokens';

function MaskedEmail({ email }) {
  const [local, domain] = email.split('@');
  if (!domain) return <Text style={styles.value}>{email}</Text>;
  const masked = local.length <= 2 ? '**' : local.slice(0, 2) + '***';
  return <Text style={styles.value}>{masked}@{domain}</Text>;
}

export default function ProfileScreen() {
  const { profile, session } = useUserProfile();
  const queryClient = useQueryClient();

  const handleDisconnect = async () => {
    if (!session?.user?.id) return;
    const ok = await disconnectPlant(session.user.id);
    if (ok) {
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['plant'] });
      await queryClient.invalidateQueries({ queryKey: ['plant-character'] });
      router.replace('/(onboarding)/goal');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.removeQueries({ queryKey: ['auth-session'] });
    queryClient.removeQueries({ queryKey: ['user-profile'] });
    queryClient.removeQueries({ queryKey: ['plant'] });
    queryClient.removeQueries({ queryKey: ['plant-character'] });
    queryClient.removeQueries({ queryKey: ['time-history'] });
    router.replace('/(auth)/sign-in');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>First name</Text>
        <Text style={styles.value}>{profile?.first_name ?? '—'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        {session?.user?.email ? (
          <MaskedEmail email={session.user.email} />
        ) : (
          <Text style={styles.value}>—</Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Daily screentime goal</Text>
        <Text style={styles.value}>{profile?.daily_time_goal ?? '—'} hours</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Apps to track</Text>
        <Text style={styles.value}>
          {profile?.apps_to_track?.length
            ? profile.apps_to_track.join(', ')
            : '—'}
        </Text>
      </View>

      <Button
        title="Disconnect plant"
        onPress={handleDisconnect}
        variant="outline"
        style={styles.disconnect}
      />
      <Button title="Sign out" onPress={handleSignOut} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: { ...typography.body, color: colors.text },
  disconnect: { marginBottom: spacing.md },
});
