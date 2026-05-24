import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import TopActionRow from '@/components/feed/TopActionRow';
import VerticalFeedList from '@/components/feed/VerticalFeedList';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';
import { mapFeedItemToContentItem } from '@/utils/personalizedFeed';
import { authLog } from '@/services/authFlowLogger';

export default function HomeContent() {
  const router = useRouter();
  const { items, meta, loading, error } = usePersonalizedFeed(16);

  const feedData = useMemo(
    () => items.map(mapFeedItemToContentItem),
    [items],
  );

  useEffect(() => {
    const typeCounts = feedData.reduce<Record<string, number>>((acc, item) => {
      acc[item.contentType] = (acc[item.contentType] ?? 0) + 1;
      return acc;
    }, {});
    authLog('home', 'feedReady', {
      count: feedData.length,
      loading,
      error: error ?? undefined,
      typeCounts,
      tasteSlots: meta?.tasteSlots,
      exploreSlots: meta?.exploreSlots,
      categorySpread: meta?.categorySpread,
      entityTypeSpread: meta?.entityTypeSpread,
    });
  }, [feedData, loading, error, meta]);

  return (
    <View style={styles.container}>
      <TopActionRow
        onCart={() => router.push('/(tabs)/cart')}
      />
      {loading && feedData.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#fff" size="large" />
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
