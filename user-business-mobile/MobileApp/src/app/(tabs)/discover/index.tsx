import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { USE_CONVEX_DATA } from '@/config/features';
import { DISCOVER_CATEGORIES, DISCOVER_TABS } from '@/data/mockFeed';
import { discoverLog } from '@/services/discoverFlowLogger';
import {
  trackViewItemList,
  MixpanelEvents,
  trackMixpanel,
} from '@/services/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_GAP = 12;
const TILE_WIDTH = (SCREEN_WIDTH - 16 * 2 - TILE_GAP) / 2;
const TILE_HEIGHT = 100;

export default function DiscoverIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<(typeof DISCOVER_TABS)[number]>(
    DISCOVER_TABS[0],
  );

  const convexCategories = useQuery(
    api.platform.categories.listDiscoverHome,
    USE_CONVEX_DATA ? {} : 'skip',
  );

  const categories = useMemo(() => {
    if (USE_CONVEX_DATA && convexCategories && convexCategories.length > 0) {
      return convexCategories.map((c) => ({
        id: c.id,
        label: c.label,
        color: c.color,
        image: c.image ?? DISCOVER_CATEGORIES.find((m) => m.id === c.id)?.image ?? '',
      }));
    }
    return DISCOVER_CATEGORIES;
  }, [convexCategories]);

  useEffect(() => {
    discoverLog('index', 'screenReady', {
      activeTab,
      categoryCount: categories.length,
      convexLoading: USE_CONVEX_DATA && convexCategories === undefined,
    });
    void trackViewItemList({
      itemListName: 'discover_home',
      persona: 'consumer',
    });
    void trackMixpanel(MixpanelEvents.DiscoverHomeViewed, {
      persona: 'consumer',
      category_count: categories.length,
      active_tab: activeTab,
    });
  }, [activeTab, categories.length, convexCategories]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.heading}>Search</Text>

      <TouchableOpacity
        style={styles.searchBox}
        onPress={() => router.push('/(tabs)/discover/search')}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
        <Text style={styles.searchPlaceholder}>
          Search for places, products & events
        </Text>
      </TouchableOpacity>

      <View style={styles.tabs}>
        {DISCOVER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={styles.tabBtn}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
            >
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {USE_CONVEX_DATA && convexCategories === undefined ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tile, { backgroundColor: item.color }]}
              activeOpacity={0.8}
              onPress={() => {
                discoverLog('index', 'categoryTap', {
                  categoryId: item.id,
                  label: item.label,
                });
                router.push({
                  pathname: '/(tabs)/discover/[category]',
                  params: { category: item.id, label: item.label },
                });
              }}
            >
              <Text style={styles.tileLabel}>{item.label}</Text>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.tileImage}
                  resizeMode="cover"
                />
              ) : null}
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
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    gap: 10,
  },
  searchPlaceholder: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 15,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    gap: 24,
  },
  tabBtn: {
    paddingBottom: 8,
  },
  tabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabIndicator: {
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
    marginTop: 4,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  row: {
    gap: TILE_GAP,
    marginBottom: TILE_GAP,
  },
  tile: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: 3,
    padding: 12,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  tileLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    zIndex: 1,
  },
  tileImage: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: TILE_WIDTH * 0.55,
    height: TILE_HEIGHT * 0.75,
    borderTopLeftRadius: 10,
    transform: [{ rotate: '8deg' }, { translateX: 8 }, { translateY: 4 }],
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
