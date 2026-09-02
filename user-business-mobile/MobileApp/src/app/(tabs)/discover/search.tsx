import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { USE_CONVEX_DATA } from '@/config/features';
import { SEARCH_HISTORY } from '@/data/mockFeed';
import type { SearchResult } from '@/types/content';

export default function DiscoverSearch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(SEARCH_HISTORY);

  const liveResults = useQuery(
    api.platform.merchants.searchMenuProducts,
    USE_CONVEX_DATA && query.trim().length > 0
      ? { query: query.trim(), limit: 24 }
      : 'skip',
  );

  const filteredResults: SearchResult[] = useMemo(() => {
    if (!USE_CONVEX_DATA || !liveResults) return [];
    return liveResults.map((row) => ({
      id: `${row.merchantSlug}:${row.product.slug}`,
      entityType: 'product' as const,
      title: row.product.name,
      subtitle: `${row.merchantName} · ${row.product.categoryName}`,
      image: row.product.imageUrl ?? '',
      merchantSlug: row.merchantSlug,
      productSlug: row.product.slug,
    }));
  }, [liveResults]);

  const showResults = query.length > 0;

  const removeRecent = (id: string) => {
    setRecentSearches((prev) => prev.filter((s) => s.id !== id));
  };

  const openResult = (item: SearchResult) => {
    if (item.merchantSlug && item.productSlug) {
      router.push({
        pathname: '/(tabs)/business/[businessId]/product/[productId]',
        params: {
          businessId: item.merchantSlug,
          productId: item.productSlug,
        },
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons
            name="search"
            size={16}
            color="rgba(255,255,255,0.5)"
          />
          <TextInput
            style={styles.input}
            placeholder="Search menu items and beach bars"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
        </View>
      </View>

      {showResults ? (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {liveResults === undefined
                ? 'Searching…'
                : 'No menu items match your search.'}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultRow}
              onPress={() => openResult(item)}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.resultImage} />
              ) : (
                <View style={[styles.resultImage, styles.resultImagePlaceholder]} />
              )}
              <View style={styles.resultText}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent searches</Text>
          {recentSearches.map((item) => (
            <View key={item.id} style={styles.recentRow}>
              <TouchableOpacity
                style={styles.recentTap}
                onPress={() => setQuery(item.label)}
              >
                <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.5)" />
                <Text style={styles.recentLabel}>{item.label}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeRecent(item.id)}>
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
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
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  resultImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  resultImagePlaceholder: {
    backgroundColor: '#1a1a1a',
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginTop: 2,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  recentTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recentLabel: {
    color: '#fff',
    fontSize: 15,
  },
});
