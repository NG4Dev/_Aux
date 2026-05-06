import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import type { ContentItem } from '@/types/content';
import IdentityRow from '@/components/feed/IdentityRow';
import ContentContextMenu from '@/components/feed/ContentContextMenu';
import TabEmptyState from './TabEmptyState';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_IMAGE_HEIGHT = SCREEN_HEIGHT * 0.4;

type Props = {
  events: ContentItem[];
  contentPaddingTop: number;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export default function EventsTab({
  events,
  contentPaddingTop,
  onScroll,
}: Props) {
  if (events.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.empty,
          { paddingTop: contentPaddingTop },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <TabEmptyState
          title="No events available"
          subtitle="No event content is available at this time."
        />
      </ScrollView>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.list,
        { paddingTop: contentPaddingTop, paddingBottom: 140 },
      ]}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.media[0] && (
            <Image
              source={{ uri: item.media[0].uri }}
              style={styles.cardImage}
            />
          )}
          <View style={styles.cardMeta}>
            <View style={styles.metaTop}>
              <View style={{ flex: 1 }}>
                <IdentityRow
                  avatarUri={item.profileAvatar}
                  name={item.profileName}
                  verified={item.verified}
                  status={item.status}
                />
              </View>
              <ContentContextMenu />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  list: {
    paddingHorizontal: 16,
    gap: 24,
  },
  empty: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  card: {
    width: CARD_WIDTH,
    gap: 12,
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    borderRadius: 4,
    backgroundColor: '#222',
  },
  cardMeta: {
    gap: 6,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 18,
  },
});
