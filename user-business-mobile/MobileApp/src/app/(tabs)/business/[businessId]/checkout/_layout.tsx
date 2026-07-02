import { Stack } from 'expo-router';
import { DARK_STACK_OPTIONS } from '@/navigation/stackOptions';

export default function CheckoutLayout() {
  return (
    <Stack screenOptions={DARK_STACK_OPTIONS}>
      <Stack.Screen name="fulfillment" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
