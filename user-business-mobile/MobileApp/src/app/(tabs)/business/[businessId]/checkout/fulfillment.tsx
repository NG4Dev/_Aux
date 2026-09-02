import React, { useState } from 'react';
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

export default function FulfillmentScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const router = useRouter();
  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.tabs}>
        {(['delivery', 'pickup'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, mode === tab && styles.tabActive]}
            onPress={() => setMode(tab)}
          >
            <Text style={[styles.tabText, mode === tab && styles.tabTextActive]}>
              {tab === 'delivery' ? 'Delivery' : 'Pick-up'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {mode === 'delivery' ? (
          <>
            <Text style={styles.sectionTitle}>Delivery address</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressText}>Mobile checkout address</Text>
              <Text style={styles.addressSub}>Edit in account settings</Text>
            </View>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.slot}>
              <Text style={styles.slotText}>ASAP · ~30–45 min</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Pickup location</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressText}>{businessId} store</Text>
              <Text style={styles.addressSub}>Ready in ~15 min</Text>
            </View>
          </>
        )}

        <View style={styles.stubRow}>
          <Text style={styles.stubLabel}>Promo code</Text>
          <Text style={styles.stubValue}>Coming soon</Text>
        </View>
        <View style={styles.stubRow}>
          <Text style={styles.stubLabel}>Wallet balance</Text>
          <Text style={styles.stubValue}>R0.00</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/business/[businessId]/checkout/summary',
              params: { businessId: businessId ?? '', fulfillment: mode },
            })
          }
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
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
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 4,
    marginTop: 8,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#333' },
  tabText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16, gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8 },
  addressCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  addressText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  addressSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  slot: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
  },
  slotText: { color: '#fff' },
  stubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  stubLabel: { color: 'rgba(255,255,255,0.7)' },
  stubValue: { color: 'rgba(255,255,255,0.4)' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#333' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
