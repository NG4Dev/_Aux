import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useBalanceStore } from '@store/balanceStore';
import formatCurrency from '@/utils/formatCurrency';
import { Transaction } from '@/features/wallet/types';

/**
 * Displays the most recent transactions in a condensed list.
 * Props:
 *   count: number of transactions to show (default: 3)
 */
export function RecentTransactions({ count = 3 }: { count?: number }) {
  const { transactions } = useBalanceStore();
  const recent = [...transactions].slice(-count).reverse();

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
    </View>
  );

  if (recent.length === 0) {
    return <Text style={styles.empty}>No recent transactions</Text>;
  }

  return (
    <FlatList
      data={recent}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.list}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { marginVertical: 8 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  title: { fontSize: 16 },
  amount: { fontSize: 16, fontWeight: 'bold' },
  empty: { fontStyle: 'italic', color: '#888', marginVertical: 8 },
});