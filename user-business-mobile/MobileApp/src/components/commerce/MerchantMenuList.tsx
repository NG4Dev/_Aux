import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export type MenuListProduct = {
  _id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl?: string | null;
};

type MerchantMenuListProps = {
  products: MenuListProduct[];
  selectedSlug: string;
  merchantName: string;
  categoryLabels?: string[];
  onSelectProduct: (slug: string) => void;
  onFilterChange?: (filter: string) => void;
};

function productMatchesCategory(product: MenuListProduct, category: string): boolean {
  const haystack = `${product.name} ${product.description}`.toLowerCase();
  return haystack.includes(category.toLowerCase());
}

function formatPrice(priceCents: number, currency: string): string {
  return `${(priceCents / 100).toFixed(0)} ${currency.toUpperCase()}`;
}

export default function MerchantMenuList({
  products,
  selectedSlug,
  merchantName,
  categoryLabels = [],
  onSelectProduct,
  onFilterChange,
}: MerchantMenuListProps) {
  const listRef = useRef<FlatList<MenuListProduct>>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const chips = useMemo(() => {
    const unique = categoryLabels.filter(Boolean);
    return ['All', ...unique.filter((label) => label !== 'All')];
  }, [categoryLabels]);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter((p) => productMatchesCategory(p, activeCategory));
  }, [products, activeCategory]);

  useEffect(() => {
    if (filtered.length === 0) return;
    const index = filtered.findIndex((p) => p.slug === selectedSlug);
    if (index >= 0) {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.35 });
    }
  }, [selectedSlug, filtered]);

  const handleChipPress = (chip: string) => {
    setActiveCategory(chip);
    onFilterChange?.(chip);
  };

  return (
    <View style={styles.container}>
      <View style={styles.queueHeader}>
        <View style={styles.queueHeaderText}>
          <Text style={styles.queueEyebrow}>Menu from</Text>
          <Text style={styles.queueTitle} numberOfLines={1}>
            {merchantName}
          </Text>
        </View>
      </View>

      {chips.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          {chips.map((chip) => {
            const active = chip === activeCategory;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleChipPress(chip)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <FlatList
        ref={listRef}
        style={styles.listScroll}
        data={filtered}
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
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]} />
              )}
              <View style={styles.rowBody}>
                <View style={styles.rowTitleRow}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {selected ? (
                    <Ionicons name="pulse" size={14} color={Colors.primary} />
                  ) : null}
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
  chipScroll: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'flex-start',
    maxHeight: 36,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    backgroundColor: '#fff',
  },
  chipText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#111',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
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
  rowName: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  rowMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 3,
  },
  rowPrice: { color: Colors.primary, fontWeight: '700' },
  rowMetaSep: { color: 'rgba(255,255,255,0.45)' },
  rowDescInline: { color: 'rgba(255,255,255,0.55)' },
});
