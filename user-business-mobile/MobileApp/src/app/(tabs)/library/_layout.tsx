import { Stack } from 'expo-router';
import { DARK_STACK_OPTIONS } from '@/navigation/stackOptions';

export default function LibraryLayout() {
  return (
    <Stack screenOptions={DARK_STACK_OPTIONS}>
      <Stack.Screen name="index" options={{ title: 'Library' }} />
      <Stack.Screen name="[collectionId]" />
      <Stack.Screen
        name="search"
        options={{ animation: 'fade', presentation: 'transparentModal' }}
      />
      <Stack.Screen
        name="create-collection"
        options={{ animation: 'fade', presentation: 'transparentModal' }}
      />
      <Stack.Screen
        name="location-picker"
        options={{ animation: 'fade', presentation: 'transparentModal' }}
      />
    </Stack>
  );
}
