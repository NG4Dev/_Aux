import { Stack } from 'expo-router';
import { DARK_STACK_OPTIONS } from '@/navigation/stackOptions';

export default function BusinessDetailLayout() {
  return <Stack screenOptions={DARK_STACK_OPTIONS} />;
}
