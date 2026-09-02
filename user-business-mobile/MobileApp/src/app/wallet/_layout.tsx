import { Stack } from 'expo-router';
import { DARK_STACK_OPTIONS } from '@/navigation/stackOptions';

export default function WalletLayout() {
  return (
    <Stack screenOptions={DARK_STACK_OPTIONS}>
      <Stack.Screen name="configureWallet" />
      <Stack.Screen name="manageWallet" />
      <Stack.Screen name="disableWallet" />
    </Stack>
  );
}
