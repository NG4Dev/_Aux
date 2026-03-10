import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="configureWallet" />
      <Stack.Screen name="manageWallet" />
      <Stack.Screen name="disableWallet" />
    </Stack>
  );
}
