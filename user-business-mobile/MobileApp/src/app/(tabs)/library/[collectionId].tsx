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

import { FEED_ITEMS } from '@/data/mockFeed';
import { useBookmarksStore } from '@/features/bookmarks/bookmarksStore';
import IdentityRow from '@/components/feed/IdentityRow';
import type { ContentItem } from '@/types/content';

export default function CollectionDetail() {
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  const router = useRouter();
  const collection = useBookmarksStore((s) =>
    s.collections.find((c) => c.id === collectionId),
  );
  const removeItemFromCollection = useBookmarksStore(
    (s) => s.removeItemFromCollection,
  );
  const deleteCollection = useBookmarksStore((s) => s.deleteCollection);

  const items = useMemo<ContentItem[]>(() => {
    if (!collection) return [];
    return collection.itemIds
      .map((id) => FEED_ITEMS.find((i) => i.id === id))
      .filter((i): i is ContentItem => Boolean(i));
  }, [collection]);

  const handleDelete = () => {
    if (!collection) return;
    Alert.alert(
      'Delete collection',
      `Remove "${collection.name}"? Items themselves stay saved nowhere else.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCollection(collection.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleRemove = (itemId: string) => {
    if (!collection) return;
    removeItemFromCollection(collection.id, itemId);
  };

  if (!collection) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Collection</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Collection not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {collection.name}
          </Text>
          <Text style={styles.subtitle}>
            {collection.location} · {items.length}{' '}
            {items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
          <Ionicons
            name="trash-outline"
            size={20}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="bookmark-outline"
              size={32}
              color="rgba(255,255,255,0.2)"
            />
          </View>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>
            Save items to this collection from the feed or discover page.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
                  <TouchableOpacity
                    onPress={() => handleRemove(item.id)}
                    style={styles.removeBtn}
                  >
                    <Ionicons
                      name="bookmark"
                      size={18}
                      color="#00BFA5"
                    />
                  </TouchableOpacity>
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    gap: 20,
  },
  card: {
    gap: 10,
  },
  cardImage: {
    width: '100%',
    height: 220,
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
  removeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
