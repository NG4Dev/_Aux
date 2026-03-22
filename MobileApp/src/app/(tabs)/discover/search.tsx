import React, { useState } from 'react';
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
import { SEARCH_HISTORY, FEED_ITEMS } from '@/data/mockFeed';
import type { SearchResult } from '@/types/content';

const MOCK_RESULTS: SearchResult[] = FEED_ITEMS.map((item) => ({
  id: item.id,
  entityType: item.contentType,
  title: item.title,
  subtitle: `${item.contentType.charAt(0).toUpperCase() + item.contentType.slice(1)} \u2022 ${item.profileName}`,
  image: item.profileAvatar,
}));

export default function DiscoverSearch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(SEARCH_HISTORY);

  const showResults = query.length > 0;
  const filteredResults = MOCK_RESULTS.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(query.toLowerCase()),
  );

  const removeRecent = (id: string) => {
    setRecentSearches((prev) => prev.filter((s) => s.id !== id));
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
            placeholder="Search for restaurants, events or products in your library"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            selectionColor="#00BFA5"
          />
        </View>
      </View>

      {!showResults && recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recently searched</Text>
          {recentSearches.map((entry) => (
            <View key={entry.id} style={styles.recentRow}>
              <View style={styles.recentLeft}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="rgba(255,255,255,0.4)"
                />
                <Text style={styles.recentText}>{entry.query}</Text>
              </View>
              <TouchableOpacity onPress={() => removeRecent(entry.id)}>
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

      {showResults && (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultRow} activeOpacity={0.7}>
              <Image source={{ uri: item.image }} style={styles.resultImage} />
              <View style={styles.resultText}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.resultSub} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              <TouchableOpacity>
                <Ionicons
                  name="close"
                  size={18}
                  color="rgba(255,255,255,0.3)"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
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
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  resultImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#222',
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
});
