import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FEED_ITEMS } from '@/data/mockFeed';
import { useBookmarksStore } from '@/features/bookmarks/bookmarksStore';
import type { Collection } from '@/features/bookmarks/types';
import type { ContentItem, ContentType } from '@/types/content';

type SectionRow =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'collection'; id: string; collection: Collection }
  | { kind: 'item'; id: string; item: ContentItem; collectionName: string };

const pluralizeType = (type: ContentType, count: number) => {
  const labels: Record<ContentType, [string, string]> = {
    place: ['place', 'places'],
    event: ['event', 'events'],
    product: ['product', 'products'],
    post: ['post', 'posts'],
  };
  const [singular, plural] = labels[type];
  return count === 1 ? singular : plural;
};

const dominantTypeForCollection = (collection: Collection): ContentType => {
  const counts: Record<ContentType, number> = {
    place: 0,
    event: 0,
    product: 0,
    post: 0,
  };
  collection.itemIds.forEach((id) => {
    const item = FEED_ITEMS.find((i) => i.id === id);
    if (item) counts[item.contentType] += 1;
  });
  const sorted = (Object.entries(counts) as [ContentType, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  return sorted[0][1] > 0 ? sorted[0][0] : 'place';
};

const titleCaseType = (type: ContentType) =>
  type.charAt(0).toUpperCase() + type.slice(1);

export default function LibrarySearch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const collections = useBookmarksStore((s) => s.collections);
  const searchHistory = useBookmarksStore((s) => s.searchHistory);
  const removeSearchHistory = useBookmarksStore((s) => s.removeSearchHistory);
  const pushSearchHistory = useBookmarksStore((s) => s.pushSearchHistory);

  const [query, setQuery] = useState('');

  const showResults = query.trim().length > 0;

  const rows = useMemo<SectionRow[]>(() => {
    if (!showResults) return [];
    const q = query.trim().toLowerCase();
    const matchingCollections = collections.filter((c) =>
      c.name.toLowerCase().includes(q),
    );

    const savedItemIdToCollections = new Map<string, Collection[]>();
    collections.forEach((c) => {
      c.itemIds.forEach((id) => {
        const existing = savedItemIdToCollections.get(id) ?? [];
        existing.push(c);
        savedItemIdToCollections.set(id, existing);
      });
    });

    const matchingItems = FEED_ITEMS.filter((item) => {
      if (!savedItemIdToCollections.has(item.id)) return false;
      return (
        item.title.toLowerCase().includes(q) ||
        item.profileName.toLowerCase().includes(q) ||
        item.categories.some((cat) => cat.toLowerCase().includes(q))
      );
    });

    const out: SectionRow[] = [];
    if (matchingCollections.length > 0) {
      out.push({ kind: 'header', id: 'h-c', title: 'Collections' });
      matchingCollections.forEach((c) =>
        out.push({ kind: 'collection', id: `c-${c.id}`, collection: c }),
      );
    }
    if (matchingItems.length > 0) {
      out.push({ kind: 'header', id: 'h-i', title: 'Saved items' });
      matchingItems.forEach((item) => {
        const containing = savedItemIdToCollections.get(item.id) ?? [];
        out.push({
          kind: 'item',
          id: `i-${item.id}`,
          item,
          collectionName: containing[0]?.name ?? '',
        });
      });
    }
    return out;
  }, [collections, query, showResults]);

  const handleSubmit = () => {
    if (query.trim().length === 0) return;
    pushSearchHistory(query);
  };

  const renderRow = ({ item }: { item: SectionRow }) => {
    if (item.kind === 'header') {
      return <Text style={styles.sectionHeader}>{item.title}</Text>;
    }
    if (item.kind === 'collection') {
      const c = item.collection;
      const type = dominantTypeForCollection(c);
      return (
        <TouchableOpacity
          style={styles.resultRow}
          activeOpacity={0.7}
          onPress={() => {
            pushSearchHistory(query);
            router.replace({
              pathname: '/(tabs)/library/[collectionId]',
              params: { collectionId: c.id },
            });
          }}
        >
          <View style={styles.thumb} />
          <View style={styles.resultText}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {c.name}
            </Text>
            <Text style={styles.resultSub} numberOfLines={1}>
              List · {c.itemIds.length}{' '}
              {pluralizeType(type, c.itemIds.length)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={styles.resultRow} activeOpacity={0.7}>
        <View style={styles.thumb} />
        <View style={styles.resultText}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.item.title}
          </Text>
          <Text style={styles.resultSub} numberOfLines={1}>
            {titleCaseType(item.item.contentType)} · {item.item.profileName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.input}
            placeholder="Search for restaurants, events or products in your library"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
            selectionColor="#00BFA5"
          />
        </View>
      </View>

      {!showResults && searchHistory.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recently searched</Text>
          {searchHistory.map((entry) => (
            <View key={entry.id} style={styles.recentRow}>
              <TouchableOpacity
                style={styles.recentLeft}
                onPress={() => setQuery(entry.query)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="rgba(255,255,255,0.4)"
                />
                <Text style={styles.recentText}>{entry.query}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeSearchHistory(entry.id)}>
                <Ionicons
                  name="close"
                  size={18}
                  color="rgba(255,255,255,0.3)"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {!showResults && searchHistory.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Start typing to search through your library
          </Text>
        </View>
      )}

      {showResults && (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          renderItem={renderRow}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No matches in your library</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    height: 42,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  recentTitle: {
    color: '#00BFA5',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  recentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  recentText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  sectionHeader: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#E94E77',
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    paddingTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
  },
});
