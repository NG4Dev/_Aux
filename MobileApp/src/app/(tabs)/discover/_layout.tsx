import { Stack } from 'expo-router';

export default function DiscoverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[category]" />
      <Stack.Screen
        name="search"
        options={{ animation: 'fade', presentation: 'transparentModal' }}
      />
    </Stack>
  );
}
