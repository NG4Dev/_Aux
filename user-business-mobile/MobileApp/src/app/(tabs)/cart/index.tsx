import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Colors from '@/constants/Colors';
import { useCartStore } from '@/features/cart/cartStore';

export default function GlobalCartsScreen() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const linesByMerchant = useCartStore((s) => s.linesByMerchant());
  const clearMerchant = useCartStore((s) => s.clearMerchant);
  const merchants = useQuery(api.platform.merchants.listActive);

  const merchantCards = useMemo(() => {
    const map = linesByMerchant;
    return [...map.entries()].map(([slug, merchantLines]) => {
      const subtotal = merchantLines.reduce(
        (s, l) => s + l.priceCents * l.quantity,
        0,
      );
      const count = merchantLines.reduce((s, l) => s + l.quantity, 0);
      const merchantName =
        merchantLines[0]?.merchantName ??
        merchants?.find((m: { slug: string; name: string }) => m.slug === slug)?.name ??
        slug;
      return { slug, merchantName, subtotal, count, currency: merchantLines[0]?.currency ?? 'gbp' };
    });
  }, [linesByMerchant, merchants]);

  const orders = useQuery(api.orders.listMine);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carts</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cart/orders')}>
          <Text style={styles.ordersLink}>Orders</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={merchantCards}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No open carts. Add items from Discover.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.merchantName}</Text>
            <Text style={styles.cardMeta}>
              {item.count} items · {(item.subtotal / 100).toFixed(2)}{' '}
              {item.currency.toUpperCase()}
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/business/[businessId]/cart',
                    params: { businessId: item.slug },
                  })
                }
              >
                <Text style={styles.primaryBtnText}>View cart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/business/[businessId]',
                    params: { businessId: item.slug },
                  })
                }
              >
                <Text style={styles.secondaryBtnText}>View store</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Clear cart?', `Remove all items from ${item.merchantName}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: () => clearMerchant(item.slug),
                    },
                  ])
                }
              >
                <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {orders && orders.length > 0 && (
        <View style={styles.ordersPreview}>
          <Text style={styles.ordersPreviewTitle}>
            Recent orders ({orders.length})
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  ordersLink: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  empty: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cardMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryBtnText: { color: '#fff', fontSize: 13 },
  ordersPreview: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#333' },
  ordersPreviewTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
});
