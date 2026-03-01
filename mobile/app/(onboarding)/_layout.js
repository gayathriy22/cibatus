import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="goal" />
      <Stack.Screen name="apps" />
      <Stack.Screen name="plant-name" />
      <Stack.Screen name="plant-photo" />
      <Stack.Screen name="loading" />
    </Stack>
  );
}
