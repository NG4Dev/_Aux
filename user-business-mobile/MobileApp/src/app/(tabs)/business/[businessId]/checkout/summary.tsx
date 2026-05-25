import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useCartStore } from '@/features/cart/cartStore';

const SERVICE_FEE_CENTS = 299;
const DELIVERY_FEE_CENTS = 499;

export default function SummaryScreen() {
  const { businessId, fulfillment } = useLocalSearchParams<{
    businessId: string;
    fulfillment?: string;
  }>();
  const router = useRouter();
  const slug = businessId ?? '';
  const allLines = useCartStore((s) => s.lines);
  const lines = useMemo(
    () => allLines.filter((l) => l.merchantSlug === slug),
    [allLines, slug],
  );
  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0),
    [lines],
  );
  const isPickup = fulfillment === 'pickup';
  const deliveryFee = isPickup ? 0 : DELIVERY_FEE_CENTS;
  const total = subtotal + SERVICE_FEE_CENTS + deliveryFee;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order summary</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.content}>
        {lines.map((line) => (
          <View key={line.productId} style={styles.row}>
            <Text style={styles.rowName}>
              {line.quantity}× {line.name}
            </Text>
            <Text style={styles.rowPrice}>
              {((line.priceCents * line.quantity) / 100).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Subtotal</Text>
          <Text style={styles.rowPrice}>{(subtotal / 100).toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Service fee</Text>
          <Text style={styles.rowPrice}>{(SERVICE_FEE_CENTS / 100).toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>
            {isPickup ? 'Pickup' : 'Delivery fee'}
          </Text>
          <Text style={styles.rowPrice}>{(deliveryFee / 100).toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{(total / 100).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/business/[businessId]/checkout/payment',
              params: {
                businessId: slug,
                fulfillment: fulfillment ?? 'delivery',
              },
            })
          }
        >
          <Text style={styles.primaryBtnText}>Continue to payment</Text>
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
  content: { flex: 1, padding: 20, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowName: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  rowLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  rowPrice: { color: '#fff', fontSize: 14, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#333', marginVertical: 12 },
  totalLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  totalValue: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#333' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
