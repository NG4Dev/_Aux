import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Colors from '@/constants/Colors';
import { useCartStore } from '@/features/cart/cartStore';
import { useMerchantBySlug } from '@/hooks/usePlatformMerchant';

export default function CartScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const router = useRouter();
  const slug = businessId ?? '';
  const { merchant } = useMerchantBySlug(slug);
  const lines = useCartStore((s) => s.lines);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeLine = useCartStore((s) => s.removeLine);

  const merchantLines = useMemo(
    () => lines.filter((l) => l.merchantSlug === slug),
    [lines, slug],
  );
  const subtotal = useMemo(
    () => merchantLines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0),
    [merchantLines],
  );
  const merchantName = merchant?.name ?? slug;

  const confirmRemove = (productId: string, name: string) => {
    Alert.alert('Remove item?', `Remove ${name} from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeLine(productId),
      },
    ]);
  };

  const handleDecrement = (productId: string, name: string, qty: number) => {
    if (qty <= 1) {
      confirmRemove(productId, name);
      return;
    }
    updateQuantity(productId, qty - 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{merchantName}</Text>
        <View style={styles.iconBtn} />
      </View>

      <FlatList
        data={merchantLines}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Your cart is empty.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.line}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.lineName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.lineDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={styles.linePrice}>
                {(item.priceCents / 100).toFixed(2)} {item.currency.toUpperCase()}
              </Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                onPress={() =>
                  handleDecrement(item.productId, item.name, item.quantity)
                }
                style={styles.qtyBtn}
              >
                <Ionicons
                  name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                  size={16}
                  color="#fff"
                />
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                style={styles.qtyBtn}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>
            {(subtotal / 100).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.primaryBtn, merchantLines.length === 0 && styles.disabled]}
          disabled={merchantLines.length === 0}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/business/[businessId]/checkout/fulfillment',
              params: { businessId: slug },
            })
          }
        >
          <Text style={styles.primaryBtnText}>Go to checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  list: { padding: 16, gap: 16, flexGrow: 1 },
  empty: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 40 },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  thumbEmpty: { backgroundColor: '#222' },
  lineName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  lineDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  linePrice: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { color: '#fff', minWidth: 20, textAlign: 'center', fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#333', gap: 12 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subtotalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  subtotalValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

