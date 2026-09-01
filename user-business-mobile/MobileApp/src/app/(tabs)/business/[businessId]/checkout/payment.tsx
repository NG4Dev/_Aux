import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import Colors from '@/constants/Colors';
import { useCartStore } from '@/features/cart/cartStore';
import { useStripeCheckoutSheet } from '@/hooks/useStripeCheckoutSheet';
import {
  trackAddPaymentInfo,
  trackPurchase,
  trackMixpanel,
  MixpanelEvents,
} from '@/services/analytics';

export default function PaymentScreen() {
  const { businessId, fulfillment } = useLocalSearchParams<{
    businessId: string;
    fulfillment?: string;
  }>();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const slug = businessId ?? '';

  const allLines = useCartStore((s) => s.lines);
  const lines = useMemo(
    () => allLines.filter((l) => l.merchantSlug === slug),
    [allLines, slug],
  );
  const clearMerchant = useCartStore((s) => s.clearMerchant);

  const ensureUser = useMutation(api.users.ensureCurrent);
  const setAddress = useMutation(api.users.setAddress);
  const createPending = useMutation(api.orders.createPending);
  const { payForOrder } = useStripeCheckoutSheet();

  const handlePay = async () => {
    if (!isSignedIn || !user) {
      router.push('/(auth)');
      return;
    }
    if (lines.length === 0) {
      Alert.alert('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const value =
        lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0) /
        100;
      void trackAddPaymentInfo({
        persona: 'consumer',
        paymentType: 'card',
        value,
        orderKind: 'product',
        emailAddress: user.primaryEmailAddress?.emailAddress,
      });
      void trackMixpanel(MixpanelEvents.PaymentStarted, {
        persona: 'consumer',
        payment_type: 'card',
        value,
        merchant_slug: slug,
      });

      await ensureUser({});
      if (fulfillment !== 'pickup') {
        await setAddress({
          address: {
            fullName: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? 'Customer',
            line1: 'Mobile checkout',
            city: 'Mobile',
            region: 'N/A',
            postalCode: '00000',
            country: 'GB',
          },
        });
      }

      const order = await createPending({
        clerkUserId: user.id,
        items: lines.map((line) => ({
          productId: line.productId as Id<'products'>,
          quantity: line.quantity,
        })),
        hasFreeShipping: fulfillment === 'pickup',
        fulfillmentType: fulfillment === 'pickup' ? 'pickup' : 'delivery',
      });

      const result = await payForOrder(order.orderId, slug || 'Aux');
      if (result.canceled) {
        return;
      }

      void trackPurchase({
        transactionId: result.paymentIntentId,
        value,
        persona: 'consumer',
        currency: 'ZAR',
        orderKind: 'product',
        merchantSlug: slug,
        emailAddress: user.primaryEmailAddress?.emailAddress,
      });
      void trackMixpanel(MixpanelEvents.OrderPaid, {
        transaction_id: result.paymentIntentId,
        value,
        currency: 'ZAR',
        persona: 'consumer',
        merchant_slug: slug,
        order_kind: 'product',
      });

      clearMerchant(slug);
      router.replace({
        pathname: '/(tabs)/business/[businessId]/checkout/success',
        params: { businessId: slug },
      });
    } catch (err) {
      Alert.alert('Checkout failed', String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Pay with</Text>
        <TouchableOpacity style={styles.methodCard}>
          <Ionicons name="card-outline" size={22} color="#fff" />
          <Text style={styles.methodText}>Card · Apple Pay · Google Pay</Text>
          <Text style={styles.methodSub}>Secure in-app payment sheet</Text>
        </TouchableOpacity>
        <View style={styles.stubCard}>
          <Text style={styles.stubText}>Saved cards — coming soon</Text>
        </View>
        <View style={styles.stubCard}>
          <Text style={styles.stubText}>Wallet — coming soon</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.disabled]}
          disabled={loading}
          onPress={handlePay}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Pay now</Text>
          )}
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
  content: { flex: 1, padding: 16, gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  methodCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  methodText: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8 },
  methodSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  stubCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    opacity: 0.6,
  },
  stubText: { color: 'rgba(255,255,255,0.5)' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#333' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
