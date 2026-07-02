import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import TopActionRow from '@/components/feed/TopActionRow';
import VerticalFeedList from '@/components/feed/VerticalFeedList';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';
import { mapFeedItemToContentItem } from '@/utils/personalizedFeed';
import { authLog } from '@/services/authFlowLogger';

import { useCartStore } from '@/features/cart/cartStore';

export default function HomeContent() {
  const router = useRouter();
  const cartLines = useCartStore((s) => s.lines);
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const { items, meta, loading, error, refresh } = usePersonalizedFeed(16);

  const feedData = useMemo(
    () => (items ?? []).map(mapFeedItemToContentItem),
    [items],
  );

  useEffect(() => {
    if (error) {
      authLog('home', 'feedError', { error });
      return;
    }
    const typeCounts = feedData.reduce<Record<string, number>>((acc, item) => {
      acc[item.contentType] = (acc[item.contentType] ?? 0) + 1;
      return acc;
    }, {});
    authLog('home', 'feedReady', {
      count: feedData.length,
      loading,
      typeCounts,
      tasteSlots: meta?.tasteSlots,
      exploreSlots: meta?.exploreSlots,
      categorySpread: meta?.categorySpread,
      entityTypeSpread: meta?.entityTypeSpread,
    });
  }, [feedData, loading, error, meta]);

  const showLoading = loading && feedData.length === 0 && !error;
  const showError = !loading && !!error;
  const showEmpty = !loading && !error && feedData.length === 0;

  return (
    <View style={styles.container}>
      <TopActionRow
        cartCount={cartCount}
        onCart={() => router.push('/(tabs)/cart')}
      />
      {showLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : showError ? (
        <View style={styles.centered}>
          <Text style={styles.message}>Could not load your feed.</Text>
          <Text style={styles.detail}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : showEmpty ? (
        <View style={styles.centered}>
          <Text style={styles.message}>Nothing to show yet.</Text>
          <Pressable style={styles.retryBtn} onPress={() => void refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <VerticalFeedList data={feedData} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  message: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  detail: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
