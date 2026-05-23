import { Stack } from 'expo-router';

export default function CartLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="orders" />
    </Stack>
  );
}
