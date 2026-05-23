import React, { useMemo, useState } from 'react';
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
  onSelectProduct: (slug: string) => void;
};

type SortKey = 'recent' | 'name' | 'price';

export default function MerchantMenuList({
  products,
  selectedSlug,
  onSelectProduct,
}: MerchantMenuListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  const sorted = useMemo(() => {
    const copy = [...products];
    if (sortKey === 'name') {
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortKey === 'price') {
      return copy.sort((a, b) => a.priceCents - b.priceCents);
    }
    return copy;
  }, [products, sortKey]);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() =>
            setSortKey(
              sortKey === 'recent'
                ? 'name'
                : sortKey === 'name'
                  ? 'price'
                  : 'recent',
            )
          }
        >
          <Ionicons name="filter-outline" size={16} color="#fff" />
          <Text style={styles.toolbarText}>
            {sortKey === 'recent'
              ? 'Most recent'
              : sortKey === 'name'
                ? 'Name'
                : 'Price'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const selected = item.slug === selectedSlug;
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
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowPrice}>
                  {(item.priceCents / 100).toFixed(0)} {item.currency.toUpperCase()}
                </Text>
                <Text style={styles.rowDesc} numberOfLines={2}>
                  {item.description}
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
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarText: { color: '#fff', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  rowSelected: {
    opacity: 1,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  thumbEmpty: { backgroundColor: '#222' },
  rowBody: { flex: 1 },
  rowName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  rowPrice: { color: Colors.primary, fontSize: 14, fontWeight: '700', marginTop: 2 },
  rowDesc: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 },
});
