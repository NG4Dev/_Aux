import { Stack } from 'expo-router';

export default function CheckoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
      <Stack.Screen name="fulfillment" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
