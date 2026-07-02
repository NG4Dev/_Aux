import { Stack } from 'expo-router';
import { DARK_STACK_OPTIONS } from '@/navigation/stackOptions';

export default function PayLayout() {
  return (
    <Stack screenOptions={DARK_STACK_OPTIONS}>
      <Stack.Screen name="index" options={{ title: 'Pay' }} />
      <Stack.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Stack.Screen name="tickets" options={{ title: 'My tickets' }} />
    </Stack>
  );
}
