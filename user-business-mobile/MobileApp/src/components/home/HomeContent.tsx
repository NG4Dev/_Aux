import React from 'react';
import { StyleSheet, View } from 'react-native';
import TopActionRow from '@/components/feed/TopActionRow';
import VerticalFeedList from '@/components/feed/VerticalFeedList';
import { FEED_ITEMS } from '@/data/mockFeed';

export default function HomeContent() {
  return (
    <View style={styles.container}>
      <TopActionRow />
      <VerticalFeedList data={FEED_ITEMS} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
