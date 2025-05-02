import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useRouter, Stack } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import { useWalletStore } from '@/features/wallet/walletPersistenceStore';

export default function ConfigureWallet() {
  const router = useRouter();
  const { enableWallet } = useWalletStore();

  const handleEnableWallet = () => {
    enableWallet();
    router.replace('/(protected)/(tabs)/pay/wallet');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: "Enable Wallet",
          headerShown: true,
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
          headerBackVisible: true,
        }} 
      />
      <View style={styles.container}>
        <Text style={styles.description}>
          No wallet is configured yet. Once configured, you can add money to your wallet, this will be used to make purchases like food, beverages & tickets. If you do not configure a wallet then all your purchases will be run from the selected payment method on the checkout page.
        </Text>

        <Text style={styles.description}>
          Remember to allocate emergency funds to your wallet for those moments where you're offline. This wallet will be the primary payment method in offline situations when you do not have access to a reliable network connection.
        </Text>

        <Text style={styles.description}>
          To add money to your wallet you must configure your wallet and verify your credentials.
        </Text>

        <CustomButton 
          text="ENABLE WALLET"
          style={styles.enableButton}
          onPress={handleEnableWallet}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    gap: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    color: '#333',
  },
  enableButton: {
    marginTop: 20,
  },
});

