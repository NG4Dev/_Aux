import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import type {
  Business,
  MenuCategory,
  MenuItem,
} from '@/types/business';
import TabEmptyState from './TabEmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_WIDTH = SCREEN_WIDTH - 32;
const HERO_IMAGE_HEIGHT = HERO_WIDTH * 0.56;

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

const formatRelative = (postedAt: number): string => {
  const diff = Date.now() - postedAt;
  if (diff < MS_PER_HOUR) return 'Posted just now';
  if (diff < MS_PER_DAY) return 'Posted today';
  const days = Math.floor(diff / MS_PER_DAY);
  if (days === 1) return 'Posted yesterday';
  if (days < 7) return `Posted ${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'Posted 1 week ago';
  return `Posted ${weeks} weeks ago`;
};

type Props = {
  business: Business;
  categories: MenuCategory[];
  items: MenuItem[];
  contentPaddingTop: number;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export default function MenuTab({
  business,
  categories,
  items,
  contentPaddingTop,
  onScroll,
}: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const itemMap = useMemo(
    () => new Map(items.map((i) => [i.id, i] as const)),
    [items],
  );

  const featured = useMemo<MenuItem | null>(() => {
    if (items.length === 0) return null;
    const flagged = items.find((i) => i.featured);
    if (flagged) return flagged;
    return [...items].sort((a, b) => b.postedAt - a.postedAt)[0];
  }, [items]);

  if (items.length === 0 || categories.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.empty, { paddingTop: contentPaddingTop }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <TabEmptyState
          title="Menu not available"
          subtitle="Menu content is not available at this time."
        />
      </ScrollView>
    );
  }

  const featuredCategory = featured
    ? categories.find((c) => c.id === featured.categoryId)
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: contentPaddingTop }]}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {featured && (
        <View style={styles.heroCard}>
          <View style={styles.heroImageWrap}>
            <Image source={{ uri: featured.image }} style={styles.heroImage} />
            {featuredCategory && (
              <View style={styles.heroChipLeft}>
                <Text style={styles.heroChipText}>{featuredCategory.name}</Text>
              </View>
            )}
            {(featured.featured || featured.isPromo) && (
              <View
                style={[
                  styles.heroChipRight,
                  featured.isPromo && styles.heroChipPromo,
                ]}
              >
                <Text style={styles.heroChipRightText}>
                  {featured.isPromo ? 'Promo' : 'Popular today'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.heroMeta}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {featured.name}
              </Text>
              <Text style={styles.heroPrice}>
                {featured.currency}
                {featured.price}
              </Text>
            </View>
            {featured.description && (
              <Text style={styles.heroDesc} numberOfLines={2}>
                {featured.description}
              </Text>
            )}
            <View style={styles.heroFooter}>
              <Text style={styles.heroFooterText}>
                {formatRelative(featured.postedAt)}
              </Text>
              <View style={styles.heroDot} />
              <Text style={styles.heroFooterText}>
                {featured.views} {featured.views === 1 ? 'view' : 'views'}
              </Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionHeader}>Menu</Text>

      <View style={styles.categoryList}>
        {categories.map((cat) => {
          const isOpen = expanded[cat.id] ?? false;
          const previewItems = cat.itemIds
            .slice(0, 3)
            .map((id) => itemMap.get(id))
            .filter((i): i is MenuItem => Boolean(i));
          return (
            <View key={cat.id} style={styles.catBlock}>
              <TouchableOpacity
                style={styles.catRow}
                onPress={() =>
                  setExpanded((s) => ({ ...s, [cat.id]: !isOpen }))
                }
                activeOpacity={0.7}
              >
                <View style={styles.catLeft}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catCount}>
                    {cat.itemIds.length}{' '}
                    {cat.itemIds.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="rgba(255,255,255,0.5)"
                />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.catPreview}>
                  {previewItems.map((item) => (
                    <View key={item.id} style={styles.previewRow}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.previewImg}
                      />
                      <View style={styles.previewText}>
                        <Text style={styles.previewName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.previewDesc} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </View>
                      <Text style={styles.previewPrice}>
                        {item.currency}
                        {item.price}
                      </Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.viewAll}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/(tabs)/business/[businessId]/menu/[categoryId]',
                        params: {
                          businessId: business.id,
                          categoryId: cat.id,
                        },
                      })
                    }
                  >
                    <Text style={styles.viewAllText}>
                      View all {cat.itemIds.length}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="rgba(255,255,255,0.7)"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    gap: 16,
  },
  empty: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  heroCard: {
    gap: 10,
  },
  heroImageWrap: {
    width: HERO_WIDTH,
    height: HERO_IMAGE_HEIGHT,
    borderRadius: 4,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroChipLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroChipRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#00BFA5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroChipPromo: {
    backgroundColor: '#FF6F00',
  },
  heroChipRightText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroMeta: {
    gap: 6,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  heroPrice: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  heroFooterText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  sectionHeader: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  categoryList: {
    gap: 4,
  },
  catBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  catLeft: {
    flex: 1,
  },
  catName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  catCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  catPreview: {
    paddingBottom: 12,
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  previewImg: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#222',
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  previewDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  previewPrice: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  viewAllText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
});
