import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import Colors from '@/constants/Colors';

export type MenuCategory = {
  id: string;
  name: string;
  slug?: string;
};

export type MenuListProduct = {
  _id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl?: string | null;
  categoryId?: string;
  categoryName?: string;
};

type MerchantMenuListProps = {
  products: MenuListProduct[];
  selectedSlug: string;
  merchantName: string;
  menuCategories?: MenuCategory[];
  activeCategory?: string;
  onCategoryChange?: (chip: string) => void;
  onSelectProduct: (slug: string) => void;
};

function formatPrice(priceCents: number, currency: string): string {
  return `${(priceCents / 100).toFixed(0)} ${currency.toUpperCase()}`;
}

export default function MerchantMenuList({
  products,
  selectedSlug,
  merchantName,
  menuCategories = [],
  activeCategory = 'All',
  onCategoryChange,
  onSelectProduct,
}: MerchantMenuListProps) {
  const listRef = useRef<FlatList<MenuListProduct>>(null);

  const chips = useMemo(() => {
    if (menuCategories.length === 0) return ['All'];
    return ['All', ...menuCategories.map((c) => c.name)];
  }, [menuCategories]);

  useEffect(() => {
    if (products.length === 0) return;
    const index = products.findIndex((p) => p.slug === selectedSlug);
    if (index >= 0) {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.35 });
    }
  }, [selectedSlug, products]);

  return (
    <View style={styles.container}>
      {chips.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabRow}
        >
          {chips.map((chip) => {
            const active = chip === activeCategory;
            return (
              <TouchableOpacity
                key={chip}
                style={styles.tab}
                onPress={() => onCategoryChange?.(chip)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {chip}
                </Text>
                {active ? <View style={styles.tabIndicator} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.queueHeader}>
        <View style={styles.queueHeaderText}>
          <Text style={styles.queueEyebrow}>Menu from</Text>
          <Text style={styles.queueTitle} numberOfLines={1}>
            {merchantName}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        style={styles.listScroll}
        data={products}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => {
          const selected = item.slug === selectedSlug;
          const priceLabel = formatPrice(item.priceCents, item.currency);
          return (
            <TouchableOpacity
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => onSelectProduct(item.slug)}
              accessibilityState={{ selected }}
            >
              <View style={styles.thumbWrap}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]} />
                )}
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowTitleRow}>
                  <Text style={[styles.rowName, selected && styles.rowNameSelected]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  <Text style={styles.rowPrice}>{priceLabel}</Text>
                  <Text style={styles.rowMetaSep}> • </Text>
                  <Text style={styles.rowDescInline}>{item.description}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabScroll: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'flex-start',
    maxHeight: 40,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  tabText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  queueHeaderText: { flex: 1, minWidth: 0 },
  queueEyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  queueTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  listScroll: {
    flex: 1,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 2 },
  row: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  rowSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  thumbWrap: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  thumbEmpty: { backgroundColor: '#222' },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowName: { color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '600', flex: 1 },
  rowNameSelected: { color: '#fff', fontWeight: '700' },
  rowMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 3,
  },
  rowPrice: { color: Colors.primary, fontWeight: '700' },
  rowMetaSep: { color: 'rgba(255,255,255,0.45)' },
  rowDescInline: { color: 'rgba(255,255,255,0.55)' },
});
