import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ScanPlantQrScreen() {
  const insets = useSafeAreaInsets();
  const { setScannedPlantUid } = useOnboarding();
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  const isIos = Platform.OS === 'ios';

  const handleBarcodeScanned = ({ data }) => {
    const raw = data != null ? String(data).trim() : '';
    if (!raw || scannedRef.current) return;
    scannedRef.current = true;
    setScannedPlantUid(raw);
    router.push('/(onboarding)/plant-name');
  };

  const handleSkip = () => {
    router.push('/(onboarding)/plant-name');
  };

  if (!isIos) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xl) + 40 }]}>
        <OnboardingHeader subtitle="QR code scanning is only available on iOS. Skip to continue." />
        <Button title="Skip" onPress={handleSkip} style={styles.skipButton} />
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>Checking camera access…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xl) + 40 }]}>
        <OnboardingHeader subtitle="Camera access is needed to scan your plant's QR code." />
        <Text style={styles.message}>Allow camera in Settings to scan, or skip.</Text>
        <Button title="Allow camera" onPress={requestPermission} style={styles.skipButton} />
        <Button title="Skip" onPress={handleSkip} variant="outline" style={styles.skipButton} />
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.scannerWrap]}>
      <OnboardingHeader subtitle="Scan the QR code on your plant tag" />
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.scanner}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />
      </View>
      <Button title="Skip" onPress={handleSkip} variant="outline" style={styles.skipButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  scannerWrap: {
    paddingTop: 0,
  },
  scannerContainer: {
    flex: 1,
    minHeight: 280,
    marginVertical: spacing.lg,
    overflow: 'hidden',
    borderRadius: 12,
  },
  scanner: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  skipButton: {
    marginBottom: spacing.sm,
  },
});
