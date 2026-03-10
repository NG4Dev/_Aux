import { ScrollView, View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import RoundButton from '@/components/RoundButton';
import Dropdown from '@/components/Dropdown';
import { useBalanceStore } from '@store/balanceStore';
import { useWalletStore } from '@/features/wallet/walletPersistenceStore';
import { RecentTransactions } from '@/components/RecentTransactions';

const PayIndex = () => {
  const router = useRouter();
  const { balance, transactions } = useBalanceStore();
  const { isEnabled } = useWalletStore();

  const handleWalletPress = () => {
    const route = isEnabled 
      ? "/(tabs)/pay/wallet" 
      : "/wallet/enableWallet";
    router.push(route);
  };

  return (
    <ScrollView style={{ backgroundColor: Colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.account}>
        <View style={styles.row}>
          <Text style={styles.currency}>R</Text>
          <Text style={styles.balance}>{balance}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <RoundButton 
          icon={'wallet'} 
          text={'Wallet'} 
          onPress={handleWalletPress}
        />
        <RoundButton 
          icon={'cash-outline'} 
          text={'Send & Pay'} 
          onPress={() => router.push('/(tabs)/pay/sendPay')}
        />
        <RoundButton 
          icon={'list'} 
          text={'History'} 
          onPress={() => router.push('/(tabs)/pay/history')}
        />
        <Dropdown/>
      </View>

      <Text style={styles.subheading}>Recent Transactions</Text>
      {transactions.length === 0 ? (
        <Text style={styles.empty}>No transactions yet</Text>
      ) : (
        <RecentTransactions count={5} />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  account: {
    margin: 80,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  currency: {
    fontSize: 50,
    fontWeight: '500',
  },
  balance: {
    fontSize: 50,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
    padding: 10,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  empty: {
    fontStyle: 'italic',
    color: '#888',
    marginVertical: 8,
    textAlign: 'center',
  },
});

export default PayIndex;