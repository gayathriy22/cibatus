import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { uploadPlantImage } from '@/lib/storage';
import { colors, spacing, typography } from '@/theme/tokens';

export default function PlantPhotoScreen() {
  const insets = useSafeAreaInsets();
  const { plantImageUri, setPlantImageUri, plantName } = useOnboarding();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const pickImage = async () => {
    setError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('We need photo library access to set your plant image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setPlantImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    setError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('We need camera access to take a plant photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setPlantImageUri(result.assets[0].uri);
  };

  const next = async () => {
    if (!plantImageUri) {
      setError('Please take or select a photo first.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fileName = `plant-${(plantName || 'unknown').replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      const publicUrl = await uploadPlantImage(plantImageUri, fileName);
      if (!publicUrl) {
        setError('Upload failed. Check your connection and try again.');
        setUploading(false);
        return;
      }
      setPlantImageUri(publicUrl);
      router.push('/(onboarding)/loading');
    } catch (e) {
      setError(e?.message || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const skip = () => {
    setPlantImageUri(null);
    router.push('/(onboarding)/loading');
  };

  const displayName = (plantName || 'your plant').toLowerCase();

  const extraTop = Dimensions.get('window').height * 0.05;
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xl) + extraTop }]}>
      <OnboardingHeader />
      <Text style={styles.prompt}>take a picture of</Text>
      <Text style={styles.plantName}>{displayName}</Text>

      <View style={styles.cameraPlaceholder}>
        {plantImageUri ? (
          <Image source={{ uri: plantImageUri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <>
            <Text style={styles.placeholderText}>this is a camera to take photo</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={pickImage} style={styles.secondaryButton} disabled={uploading}>
                <Text style={styles.secondaryButtonText}>Choose from library</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={styles.secondaryButton} disabled={uploading}>
                <Text style={styles.secondaryButtonText}>Take photo</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {uploading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <Button title="next →" onPress={next} style={styles.button} />
          <TouchableOpacity onPress={skip} disabled={uploading}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </>
      )}
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
  prompt: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
    textTransform: 'lowercase',
  },
  plantName: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
    textTransform: 'lowercase',
  },
  cameraPlaceholder: {
    minHeight: 220,
    backgroundColor: colors.cardGreen,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardGreenBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  placeholderText: {
    ...typography.body,
    color: colors.text,
    textTransform: 'lowercase',
    marginBottom: spacing.md,
  },
  previewImage: { width: '100%', height: 220 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  secondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xs,
  },
  secondaryButtonText: { ...typography.bodySmall, color: colors.primary },
  errorText: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  loader: { marginVertical: spacing.lg },
  button: { marginTop: 'auto', marginBottom: spacing.sm, borderRadius: 9999 },
  skipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
