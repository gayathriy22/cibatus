import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { isOnboardingComplete } from '@/hooks/useOnboardingComplete';
import { useUserProfile } from '@/hooks/useUserProfile';
import { colors } from '@/theme/tokens';

export default function Index() {
  const { session, profile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!isOnboardingComplete(profile)) {
    return <Redirect href="/(onboarding)/goal" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
