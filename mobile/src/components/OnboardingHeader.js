import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme/tokens';

const logo = require('../../assets/logo.png');

export function OnboardingHeader({ subtitle }) {
  return (
    <View style={styles.wrap}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.welcome}>welcome to</Text>
      <Text style={styles.appName}>cibatus</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: spacing.xl, paddingTop: spacing.lg },
  logo: { width: 120, height: 120, marginBottom: spacing.md },
  welcome: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
    textTransform: 'lowercase',
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'lowercase',
  },
  subtitle: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
});
