import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/Button';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { colors, spacing, typography } from '@/theme/tokens';

const HARDCODED_PLANT_UID = 'd40def0b-bb1b-4cc3-84da-9ea8da0c17f4';

export default function ScanQrScreen() {
  const insets = useSafeAreaInsets();
  const { scannedPlantUid, setScannedPlantUid } = useOnboarding();
  const [permission, requestPermission] = useCameraPermissions();
  const [didScan, setDidScan] = useState(false);

  const scanned = useMemo(
    () => didScan || scannedPlantUid === HARDCODED_PLANT_UID,
    [didScan, scannedPlantUid]
  );

  const handleBarcodeScanned = () => {
    // QR is read through camera, but payload is intentionally ignored.
    setScannedPlantUid(HARDCODED_PLANT_UID);
    setDidScan(true);
  };

  const next = () => {
    if (!scanned) return;
    router.push('/(onboarding)/plant-name');
  };

  const extraTop = Dimensions.get('window').height * 0.08;
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xl) + extraTop }]}>
      <OnboardingHeader subtitle="scan your plant qr code to continue" />

      <View style={styles.scannerWrap}>
        {permission?.granted ? (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        ) : (
          <View style={styles.permissionCard}>
            <Text style={styles.permissionText}>camera access is required to scan your plant qr code.</Text>
            <TouchableOpacity onPress={requestPermission} style={styles.permissionButton} activeOpacity={0.85}>
              <Text style={styles.permissionButtonText}>enable camera</Text>
            </TouchableOpacity>
          </View>
        )}
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.scannerFrame} />
        </View>
        <Text style={styles.scannerHint}>
          {scanned ? 'qr code scanned' : 'align qr code inside the frame'}
        </Text>
      </View>

      {scanned ? (
        <Text style={styles.successText}>plant linked successfully</Text>
      ) : null}

      <Button title="next →" onPress={next} disabled={!scanned} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  scannerWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  camera: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.cardGreen,
  },
  permissionCard: {
    width: '100%',
    minHeight: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardGreenBorder,
    backgroundColor: colors.cardGreen,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  permissionText: {
    ...typography.bodySmall,
    color: colors.text,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  permissionButtonText: {
    ...typography.bodySmall,
    color: colors.white,
    textTransform: 'lowercase',
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 230,
    height: 230,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.progressGreen,
    backgroundColor: 'transparent',
  },
  scannerHint: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textTransform: 'lowercase',
  },
  successText: {
    ...typography.body,
    color: colors.progressGreen,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  button: {
    marginTop: 'auto',
    marginBottom: spacing.xl,
    borderRadius: 9999,
  },
});
