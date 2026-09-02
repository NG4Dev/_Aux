import { Stack } from 'expo-router';
import { DARK_STACK_OPTIONS } from '@/navigation/stackOptions';

export default function CartLayout() {
  return (
    <Stack screenOptions={DARK_STACK_OPTIONS}>
      <Stack.Screen name="index" />
      <Stack.Screen name="orders" />
    </Stack>
  );
}
