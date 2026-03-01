import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useScreenTime } from '@/contexts/ScreenTimeContext';
import { getAppIconSource } from '@/lib/appIcons';
import { colors, spacing, typography } from '@/theme/tokens';

export default function AppsScreen() {
  const insets = useSafeAreaInsets();
  const { appsToTrack, setAppsToTrack } = useOnboarding();
  const { getInstalledApplications } = useScreenTime();
  const [installedApps, setInstalledApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstalledApplications()
      .then((apps) => setInstalledApps(Array.isArray(apps) ? apps : []))
      .catch(() => setInstalledApps([]))
      .finally(() => setLoading(false));
  }, [getInstalledApplications]);

  const toggle = (bundleId) => {
    if (appsToTrack.includes(bundleId)) {
      setAppsToTrack(appsToTrack.filter((id) => id !== bundleId));
    } else {
      setAppsToTrack([...appsToTrack, bundleId]);
    }
  };

  const next = () => router.push('/(onboarding)/scan-qr');

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  const extraTop = Dimensions.get('window').height * 0.05;
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xl) + extraTop }]}>
      <OnboardingHeader subtitle="which apps would you like to track screentime for?" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {installedApps.map((app) => {
          const bundleId = app.bundleIdentifier || app.bundle_id;
          const displayName = app.displayName || app.display_name || bundleId || 'App';
          const selected = appsToTrack.includes(bundleId);
          const iconSource = getAppIconSource(displayName);
          return (
            <TouchableOpacity
              key={bundleId}
              onPress={() => toggle(bundleId)}
              style={[styles.item, selected && styles.itemSelected]}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, selected && styles.checkboxSelected]} />
              {iconSource ? (
                <Image source={iconSource} style={styles.appIcon} resizeMode="contain" />
              ) : null}
              <Text style={[styles.itemText, selected && styles.itemTextSelected]} numberOfLines={1}>
                {displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Button
        title="next →"
        onPress={next}
        disabled={appsToTrack.length === 0}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: colors.cardGreen,
    borderWidth: 1,
    borderColor: colors.cardGreenBorder,
    marginRight: spacing.md,
  },
  checkboxSelected: { backgroundColor: colors.progressGreen, borderColor: colors.progressGreen },
  appIcon: { width: 28, height: 28, marginRight: spacing.md, borderRadius: 6 },
  itemText: { ...typography.body, color: colors.text, flex: 1 },
  itemTextSelected: { fontWeight: '600' },
  button: { marginTop: 'auto', marginBottom: spacing.xl, borderRadius: 9999 },
  loader: { marginTop: spacing.xxl },
});
