import { Stack } from 'expo-router';
import { DARK_STACK_OPTIONS } from '@/navigation/stackOptions';

export default function BusinessLayout() {
  return <Stack screenOptions={DARK_STACK_OPTIONS} />;
}
