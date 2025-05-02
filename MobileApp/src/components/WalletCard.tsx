import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useBalanceStore } from '@store/balanceStore';
import formatCurrency from '@/utils/formatCurrency';

export const WalletCard = () => {
  const { balance, runTransaction, loading, error } = useBalanceStore();
  const [amount, setAmount] = useState('');

  const onDeposit = () => runTransaction('deposit', Number(amount));
  const onWithdraw = () => runTransaction('withdrawal', Number(amount));

  return (
    <View style={styles.card}>
      <Text style={styles.balance}>{formatCurrency(balance)}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={onDeposit} 
          disabled={loading}
        >
          <Text style={styles.buttonText}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={onWithdraw} 
          disabled={loading}
        >
          <Text style={styles.buttonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 16,
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3F3A5A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#BBAFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
});
