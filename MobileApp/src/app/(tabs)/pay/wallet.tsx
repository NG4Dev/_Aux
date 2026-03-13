import { StyleSheet, View } from 'react-native';
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { useWalletStore } from '@/features/wallet/walletPersistenceStore';
import { WalletCard } from '@/components/WalletCard';

export default function WalletScreen() {
  const router = useRouter();
  const { isEnabled } = useWalletStore();

  React.useEffect(() => {
    if (!isEnabled) {
      router.push('/wallet/enableWallet');
    }
  }, [isEnabled]);

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: "Wallet",
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
          headerBackVisible: true,
        }} 
      />
      <View style={styles.container}>
        <WalletCard />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});


