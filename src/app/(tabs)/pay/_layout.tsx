import { Stack } from "expo-router";

export default function PayLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Pay" }} />
      <Stack.Screen name="manageWallet" options={{ title: "Manage Wallet" }} />
    </Stack>
  );
}
