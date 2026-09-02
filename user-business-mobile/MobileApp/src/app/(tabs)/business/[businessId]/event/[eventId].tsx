import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import Colors from '@/constants/Colors';
import { useStripeCheckoutSheet } from '@/hooks/useStripeCheckoutSheet';

export default function EventDetailScreen() {
  const { businessId, eventId } = useLocalSearchParams<{
    businessId: string;
    eventId: string;
  }>();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [selectedTicketTypeId, setSelectedTicketTypeId] =
    useState<Id<'ticketTypes'> | null>(null);
  const [loading, setLoading] = useState(false);

  const data = useQuery(
    api.platform.events.getBySlug,
    businessId && eventId
      ? { merchantSlug: businessId, eventSlug: eventId }
      : 'skip',
  );
  const joinQueue = useMutation(api.platform.tickets.joinWaitingList);
  const createTicketOrder = useMutation(api.platform.tickets.createTicketOrder);
  const { payForOrder } = useStripeCheckoutSheet();

  if (data === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (data === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Event not found</Text>
      </SafeAreaView>
    );
  }

  const { event, merchant, ticketTypes } = data;

  const handlePurchase = async () => {
    if (!isSignedIn) {
      router.push('/(auth)');
      return;
    }
    if (!selectedTicketTypeId) {
      Alert.alert('Select a ticket tier');
      return;
    }

    setLoading(true);
    try {
      const queue = await joinQueue({ ticketTypeId: selectedTicketTypeId });
      const order = await createTicketOrder({
        ticketTypeId: selectedTicketTypeId,
        waitingListEntryId:
          queue.status === 'offered' ? queue.waitingListEntryId : undefined,
      });
      const result = await payForOrder(order.orderId, merchant.name);
      if (result.canceled) {
        return;
      }
      Alert.alert('Ticket purchased', 'Your ticket will appear in My tickets.');
    } catch (err) {
      Alert.alert('Checkout failed', String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {event.name}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.priceHeader}>
          <Text style={styles.priceEach}>
            from {(ticketTypes[0]?.priceCents ?? 0) / 100} each
          </Text>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.merchant}>{merchant.name}</Text>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.dateLine}>
          {new Date(event.startTime).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.subtitle}>{event.location ?? 'Location TBA'}</Text>
        <Text style={styles.description}>{event.description}</Text>

        <Text style={styles.sectionTitle}>Select quantity</Text>
        <View style={styles.qtyPills}>
          {[1, 2, 3, 4].map((n) => (
            <View key={n} style={styles.qtyPill}>
              <Text style={styles.qtyPillText}>{n}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Ticket tiers</Text>
        {ticketTypes.map((tt: (typeof ticketTypes)[number]) => {
          const selected = selectedTicketTypeId === tt._id;
          return (
            <TouchableOpacity
              key={tt._id}
              style={[styles.tierCard, selected && styles.tierCardSelected]}
              onPress={() => setSelectedTicketTypeId(tt._id)}
            >
              <View>
                <Text style={styles.tierName}>{tt.name}</Text>
                <Text style={styles.tierMeta}>
                  {tt.capacity - tt.soldCount} remaining
                </Text>
              </View>
              <Text style={styles.tierPrice}>
                {(tt.priceCents / 100).toFixed(2)} {tt.currency.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Service fee</Text>
          <Text style={styles.feeValue}>Included</Text>
        </View>
        <Text style={styles.refund}>Standard refund policy applies</Text>
        <Text style={styles.terms}>
          By purchasing you agree to the event terms and conditions.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          disabled={loading}
          onPress={handlePurchase}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? 'Processing…' : 'Continue · Pay now'}
          </Text>
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
  content: { padding: 20, gap: 12, paddingBottom: 120 },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceEach: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  merchant: { color: Colors.primaryMuted, fontSize: 13, fontWeight: '600' },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  dateLine: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  description: { color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 22 },
  qtyPills: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  qtyPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPillText: { color: '#fff', fontWeight: '700' },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  feeLabel: { color: 'rgba(255,255,255,0.6)' },
  feeValue: { color: '#fff' },
  refund: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 },
  terms: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 12 },
  tierCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  tierCardSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(61,56,237,0.15)' },
  tierName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  tierMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  tierPrice: { color: '#fff', fontSize: 15, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#333' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { color: '#fff', textAlign: 'center', marginTop: 40 },
});
