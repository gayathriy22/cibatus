import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '@/components/Button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { uploadPlantImage } from '@/lib/storage';
import { colors, spacing, typography } from '@/theme/tokens';

export default function PlantPhotoScreen() {
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
    const uri = result.assets[0].uri;
    setPlantImageUri(uri);
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
    const uri = result.assets[0].uri;
    setPlantImageUri(uri);
  };

  const next = async () => {
    if (!plantImageUri) {
      setError('Please take or select a photo first.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fileName = `plant-${plantName || 'unknown'}-${Date.now()}.jpg`;
      const publicUrl = await uploadPlantImage(plantImageUri, fileName);
      if (publicUrl) {
        setPlantImageUri(publicUrl);
        router.push('/(onboarding)/loading');
      } else {
        setError('Upload failed. You can continue with a local photo.');
        router.push('/(onboarding)/loading');
      }
    } catch (e) {
      setError('Upload failed. Continuing with local photo.');
      router.push('/(onboarding)/loading');
    } finally {
      setUploading(false);
    }
  };

  const skip = () => {
    setPlantImageUri(null);
    router.push('/(onboarding)/loading');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Take a photo</Text>
      <Text style={styles.subtitle}>Add a photo of your plant (or use a placeholder).</Text>

      <View style={styles.preview}>
        {plantImageUri ? (
          <Image source={{ uri: plantImageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No photo yet</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={pickImage} style={styles.secondaryButton} disabled={uploading}>
          <Text style={styles.secondaryButtonText}>Choose from library</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={takePhoto} style={styles.secondaryButton} disabled={uploading}>
          <Text style={styles.secondaryButtonText}>Take photo</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {uploading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <Button title="Next" onPress={next} style={styles.button} />
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
  preview: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBorder,
  },
  placeholderText: { ...typography.bodySmall, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  secondaryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  secondaryButtonText: { ...typography.bodySmall, color: colors.primary },
  errorText: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  loader: { marginVertical: spacing.lg },
  button: { marginTop: 'auto', marginBottom: spacing.sm },
  skipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
