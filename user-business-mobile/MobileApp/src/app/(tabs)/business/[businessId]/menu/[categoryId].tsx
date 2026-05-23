import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DropdownMenu from 'zeego/dropdown-menu';

import {
  getBusinessById,
  getMenuCategoriesForBusiness,
  getMenuItemsForCategory,
} from '@/data/mockBusinesses';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import type { MenuItem } from '@/types/business';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_ROW_HEIGHT = 48;
const CHIP_ROW_HEIGHT = 48;
const TOOLBAR_HEIGHT = 44;
const COLLAPSIBLE_HEIGHT = CHIP_ROW_HEIGHT + TOOLBAR_HEIGHT;

const GRID_GAP = 2;
const GRID_TILE_WIDTH = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

type SortKey = 'recent' | 'name' | 'price';

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Most recent',
  name: 'Name',
  price: 'Price',
};

const sortItems = (items: MenuItem[], key: SortKey): MenuItem[] => {
  const copy = [...items];
  switch (key) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'price':
      return copy.sort((a, b) => a.price - b.price);
    case 'recent':
    default:
      return copy.sort((a, b) => b.postedAt - a.postedAt);
  }
};

export default function MenuCategoryScreen() {
  const { businessId, categoryId } = useLocalSearchParams<{
    businessId: string;
    categoryId: string;
  }>();
  const router = useRouter();

  const business = businessId ? getBusinessById(businessId) : undefined;
  const categories = businessId
    ? getMenuCategoriesForBusiness(businessId)
    : [];

  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { animatedHeight, onScroll } = useCollapsibleHeader({
    headerHeight: COLLAPSIBLE_HEIGHT,
  });

  const items = useMemo(
    () =>
      businessId && categoryId
        ? sortItems(getMenuItemsForCategory(businessId, categoryId), sortKey)
        : [],
    [businessId, categoryId, sortKey],
  );

  if (!business) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Menu not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const setActiveCategory = (newId: string) => {
    router.setParams({ categoryId: newId });
  };

  const renderGrid = () => (
    <FlatList
      key="grid"
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={3}
      columnWrapperStyle={{ gap: GRID_GAP }}
      contentContainerStyle={[
        styles.gridContent,
        { paddingTop: HEADER_ROW_HEIGHT + COLLAPSIBLE_HEIGHT + 4 },
      ]}
      onScroll={onScroll}
      scrollEventThrottle={16}
      ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.gridTile}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/business/[businessId]/product/[productId]',
              params: {
                businessId: businessId ?? '',
                productId: item.id,
              },
            })
          }
        >
          <Image source={{ uri: item.image }} style={styles.gridImage} />
          <View style={styles.gridOverlay}>
            <Text style={styles.gridName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.gridPrice}>
              {item.currency}
              {item.price}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );

  const renderList = () => (
    <FlatList
      key="list"
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.listContent,
        { paddingTop: HEADER_ROW_HEIGHT + COLLAPSIBLE_HEIGHT + 4 },
      ]}
      onScroll={onScroll}
      scrollEventThrottle={16}
      ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.listRow}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/business/[businessId]/product/[productId]',
              params: {
                businessId: businessId ?? '',
                productId: item.id,
              },
            })
          }
        >
          <Image source={{ uri: item.image }} style={styles.listThumb} />
          <View style={styles.listText}>
            <Text style={styles.listName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.listDesc} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <Text style={styles.listPrice}>
            {item.currency}
            {item.price}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {viewMode === 'grid' ? renderGrid() : renderList()}

      <View style={styles.stickyBlock}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Your menu
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <RNAnimated.View
          style={{ height: animatedHeight, overflow: 'hidden' }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={{ height: CHIP_ROW_HEIGHT }}
          >
            {categories.map((cat) => {
              const active = cat.id === categoryId;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setActiveCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
                  key="price"
                  onSelect={() => setSortKey('price')}
                >
                  <DropdownMenu.ItemTitle>Price</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <TouchableOpacity
              style={styles.toolbarBtn}
              onPress={() =>
                setViewMode(viewMode === 'grid' ? 'list' : 'grid')
              }
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  stickyBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    zIndex: 10,
  },
  headerRow: {
    height: HEADER_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  chipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000',
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
  },
  toolbarText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  gridContent: {
    paddingBottom: 140,
    gap: GRID_GAP,
  },
  gridTile: {
    width: GRID_TILE_WIDTH,
    aspectRatio: 1,
    backgroundColor: '#111',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  gridName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  gridPrice: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  listContent: {
    paddingHorizontal: 16,
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
    width: 64,
    height: 64,
    borderRadius: 4,
    backgroundColor: '#222',
  },
  listText: {
    flex: 1,
  },
  listName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  listPrice: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});
