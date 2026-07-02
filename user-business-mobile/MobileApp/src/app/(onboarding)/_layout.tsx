import { Stack } from 'expo-router';
import { DARK_STACK_OPTIONS } from '@/navigation/stackOptions';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        ...DARK_STACK_OPTIONS,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="showcase" />
      <Stack.Screen name="date-of-birth" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="success" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
