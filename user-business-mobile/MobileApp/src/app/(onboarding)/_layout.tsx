import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="showcase" />
      <Stack.Screen name="date-of-birth" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="success" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
