import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Colors from '@/constants/Colors';

export default function OrdersScreen() {
  const router = useRouter();
  const orders = useQuery(api.orders.listMine);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={orders ?? []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No orders yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowKind}>
                {item.orderKind ?? 'product'} · {item.status}
              </Text>
              <Text style={styles.rowDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.rowTotal}>
              {(item.totalCents / 100).toFixed(2)} {item.currency.toUpperCase()}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  back: { color: Colors.primary, fontSize: 15 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  empty: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  rowKind: { color: '#fff', fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  rowDate: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  rowTotal: { color: Colors.primary, fontWeight: '700' },
});
