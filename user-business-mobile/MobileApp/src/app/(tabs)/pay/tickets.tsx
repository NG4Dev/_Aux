import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import Colors from '@/constants/Colors';
import { useStripeCheckoutSheet } from '@/hooks/useStripeCheckoutSheet';

export default function MyTicketsScreen() {
  const { isSignedIn } = useAuth();
  const tickets = useQuery(api.platform.tickets.listMine, isSignedIn ? {} : 'skip');
  const listings = useQuery(api.platform.resale.listActive, {});
  const listForSale = useMutation(api.platform.resale.listForSale);
  const createResaleOrder = useMutation(api.platform.resale.createResaleOrder);
  const { payForOrder } = useStripeCheckoutSheet();
  const [priceInput, setPriceInput] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const handleSell = async (ticketInstanceId: Id<'ticketInstances'>) => {
    const raw = priceInput[ticketInstanceId];
    const cents = Math.round(Number(raw) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      Alert.alert('Enter a valid price');
      return;
    }
    setLoading(ticketInstanceId);
    try {
      await listForSale({ ticketInstanceId, resalePriceCents: cents });
      Alert.alert('Listed for resale');
    } catch (err) {
      Alert.alert('Could not list ticket', String(err));
    } finally {
      setLoading(null);
    }
  };

  const handleBuy = async (resaleId: Id<'ticketResales'>) => {
    if (!isSignedIn) {
      Alert.alert('Sign in to purchase');
      return;
    }
    setLoading(resaleId);
    try {
      const order = await createResaleOrder({ resaleId });
      const result = await payForOrder(order.orderId, 'Aux resale');
      if (result.canceled) {
        return;
      }
      Alert.alert('Purchase complete', 'Your ticket will appear in My tickets.');
    } catch (err) {
      Alert.alert('Purchase failed', String(err));
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>My tickets</Text>
      <FlatList
        data={tickets ?? []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No tickets yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.eventName}>{item.eventName}</Text>
            <Text style={styles.tier}>{item.ticketTypeName}</Text>
            <Text style={styles.status}>{item.status}</Text>
            {item.status === 'valid' && (
              <View style={styles.sellRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Resale price"
                  placeholderTextColor="#888"
                  keyboardType="decimal-pad"
                  value={priceInput[item._id] ?? ''}
                  onChangeText={(v) =>
                    setPriceInput((s) => ({ ...s, [item._id]: v }))
                  }
                />
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => handleSell(item._id)}
                  disabled={loading === item._id}
                >
                  {loading === item._id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.secondaryBtnText}>Sell</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      <Text style={styles.title}>Resale marketplace</Text>
      <FlatList
        data={listings ?? []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No listings.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.eventName}>{item.eventName}</Text>
            <Text style={styles.tier}>{item.ticketTypeName}</Text>
            <View style={styles.buyRow}>
              <Text style={styles.price}>
                {(item.resalePriceCents / 100).toFixed(2)} {item.currency.toUpperCase()}
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => handleBuy(item._id)}
                disabled={loading === item._id}
              >
                <Text style={styles.primaryBtnText}>Buy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  list: { gap: 12, paddingBottom: 24 },
  empty: { color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
  card: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  eventName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  tier: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  status: { color: Colors.primaryMuted, fontSize: 12, fontWeight: '600' },
  sellRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 10,
    color: '#fff',
  },
  buyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { color: '#fff', fontWeight: '700' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '700' },
});
