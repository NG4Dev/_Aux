import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import TopActionRow from '@/components/feed/TopActionRow';
import VerticalFeedList from '@/components/feed/VerticalFeedList';
import { FEED_ITEMS } from '@/data/mockFeed';
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed';
import { mapFeedItemToContentItem } from '@/utils/personalizedFeed';
import { authLog } from '@/services/authFlowLogger';

export default function HomeContent() {
  const router = useRouter();
  const { items } = usePersonalizedFeed(16);

  const feedData = useMemo(() => {
    if (items.length === 0) {
      return FEED_ITEMS;
    }
    const personalized = items.map(mapFeedItemToContentItem);
    const exploration = FEED_ITEMS.slice(0, 2);
    return [...personalized, ...exploration];
  }, [items]);

  useEffect(() => {
    authLog('home', 'feedReady', { count: feedData.length });
  }, [feedData.length]);

  return (
    <View style={styles.container}>
      <TopActionRow
        onCart={() => router.push('/(tabs)/cart')}
      />
      <VerticalFeedList data={feedData} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
