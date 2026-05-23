import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated as RNAnimated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import * as DropdownMenu from 'zeego/dropdown-menu';

import GuestEmptyState from '@/components/GuestEmptyState';
import {
  useBookmarksStore,
  selectCollectionsForLocation,
  sortCollections,
} from '@/features/bookmarks/bookmarksStore';
import type { BookmarkSortKey, Collection } from '@/features/bookmarks/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_GAP = 12;
const GRID_PADDING_H = 16;
const TILE_WIDTH = (SCREEN_WIDTH - GRID_PADDING_H * 2 - TILE_GAP) / 2;
const TILE_HEIGHT = TILE_WIDTH;

const HEADER_ROW_HEIGHT = 56;
const CHIP_ROW_HEIGHT = 48;
const TOOLBAR_HEIGHT = 44;
const COLLAPSIBLE_HEIGHT = CHIP_ROW_HEIGHT + TOOLBAR_HEIGHT;

const SORT_LABELS: Record<BookmarkSortKey, string> = {
  recent: 'Most recent',
  name: 'Name',
  count: 'Most items',
};

export default function LibraryScreen() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const parentNav = navigation.getParent();

  const collections = useBookmarksStore((s) => s.collections);
  const activeLocation = useBookmarksStore((s) => s.activeLocation);
  const viewMode = useBookmarksStore((s) => s.viewMode);
  const sortKey = useBookmarksStore((s) => s.sortKey);
  const setViewMode = useBookmarksStore((s) => s.setViewMode);
  const setSortKey = useBookmarksStore((s) => s.setSortKey);

  const [headerVisible, setHeaderVisible] = useState(true);
  const collapsibleHeight = useRef(
    new RNAnimated.Value(COLLAPSIBLE_HEIGHT),
  ).current;
  const lastOffset = useRef(0);

  const visibleCollections = useMemo(() => {
    const filtered = selectCollectionsForLocation(collections, activeLocation);
    return sortCollections(filtered, sortKey);
  }, [collections, activeLocation, sortKey]);

  const setTabBarVisible = useCallback(
    (visible: boolean) => {
      parentNav?.setOptions({
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute' as const,
          bottom: visible ? 0 : -100,
          left: 0,
          right: 0,
          elevation: 0,
          shadowOpacity: 0,
          borderTopWidth: 0,
        },
      });
    },
    [parentNav],
  );

  useEffect(() => {
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  const toggleHeader = (toValue: number) => {
    RNAnimated.timing(collapsibleHeight, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleScroll = (event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const currentOffset = event.nativeEvent.contentOffset.y;

    if (currentOffset <= 10) {
      toggleHeader(COLLAPSIBLE_HEIGHT);
      setHeaderVisible(true);
      setTabBarVisible(true);
      lastOffset.current = currentOffset;
      return;
    }

    if (currentOffset > lastOffset.current && headerVisible) {
      toggleHeader(0);
      setHeaderVisible(false);
      setTabBarVisible(false);
    } else if (currentOffset < lastOffset.current && !headerVisible) {
      toggleHeader(COLLAPSIBLE_HEIGHT);
      setHeaderVisible(true);
      setTabBarVisible(true);
    }

    lastOffset.current = currentOffset;
  };

  if (!isSignedIn) {
    return (
      <GuestEmptyState
        feature="Library"
        icon="bookmark-outline"
        description="Your saved events, places, and bookmarks will appear here."
      />
    );
  }

  const renderGridItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={styles.gridTile}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/library/[collectionId]',
          params: { collectionId: item.id },
        })
      }
    >
      <View style={styles.gridImage} />
      <Text style={styles.gridLabel} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity
      style={styles.listRow}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/library/[collectionId]',
          params: { collectionId: item.id },
        })
      }
    >
      <View style={styles.listThumb} />
      <View style={styles.listText}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.listSub} numberOfLines={1}>
          List · {item.itemIds.length}{' '}
          {item.itemIds.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color="rgba(255,255,255,0.3)"
      />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name="bookmark-outline"
          size={36}
          color="rgba(255,255,255,0.2)"
        />
      </View>
      <Text style={styles.emptyTitle}>No collections yet</Text>
      <Text style={styles.emptySub}>
        Create your first collection to start saving places, events, and
        products.
      </Text>
      <TouchableOpacity
        style={styles.emptyCta}
        onPress={() => router.push('/(tabs)/library/create-collection')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={18} color="#000" />
        <Text style={styles.emptyCtaText}>Create a collection</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color="#666" />
          </View>
          <Text style={styles.headerTitle}>My Library</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push('/(tabs)/library/search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push('/(tabs)/library/create-collection')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <RNAnimated.View
        style={{ height: collapsibleHeight, overflow: 'hidden' }}
      >
        <View style={styles.chipRowWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <TouchableOpacity
              style={styles.locationChip}
              onPress={() => router.push('/(tabs)/library/location-picker')}
              activeOpacity={0.8}
            >
              <Ionicons name="location" size={14} color="#fff" />
              <Text style={styles.locationChipText}>{activeLocation}</Text>
            </TouchableOpacity>
            {visibleCollections.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.collectionChip}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/library/[collectionId]',
                    params: { collectionId: c.id },
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.collectionChipDot} />
                <Text style={styles.collectionChipText} numberOfLines={1}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.toolbar}>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.7}>
                <Ionicons
                  name="funnel-outline"
                  size={16}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.toolbarText}>{SORT_LABELS[sortKey]}</Text>
              </TouchableOpacity>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                key="recent"
                onSelect={() => setSortKey('recent')}
              >
                <DropdownMenu.ItemTitle>Most recent</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                key="name"
                onSelect={() => setSortKey('name')}
              >
                <DropdownMenu.ItemTitle>Name</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                key="count"
                onSelect={() => setSortKey('count')}
              >
                <DropdownMenu.ItemTitle>Most items</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={18}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        </View>
      </RNAnimated.View>

      {visibleCollections.length === 0 ? (
        renderEmpty()
      ) : viewMode === 'grid' ? (
        <FlatList
          key="grid"
          data={visibleCollections}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={renderGridItem}
        />
      ) : (
        <FlatList
          key="list"
          data={visibleCollections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={renderListItem}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
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
  headerRow: {
    height: HEADER_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRowWrap: {
    height: CHIP_ROW_HEIGHT,
    justifyContent: 'center',
  },
  chipRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  locationChipText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  collectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxWidth: 180,
  },
  collectionChipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E94E77',
  },
  collectionChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  toolbar: {
    height: TOOLBAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  toolbarText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  gridContent: {
    paddingHorizontal: GRID_PADDING_H,
    paddingTop: 4,
    paddingBottom: 140,
  },
  gridRow: {
    gap: TILE_GAP,
    marginBottom: 20,
  },
  gridTile: {
    width: TILE_WIDTH,
    gap: 8,
  },
  gridImage: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: 4,
    backgroundColor: '#E94E77',
  },
  gridLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 140,
  },
  listSeparator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  listThumb: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#E94E77',
  },
  listText: {
    flex: 1,
  },
  listTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
    paddingBottom: 120,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  emptyCtaText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
});
