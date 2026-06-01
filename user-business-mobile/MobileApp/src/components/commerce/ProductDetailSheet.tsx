import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Animated, { type AnimatedRef } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

type SimilarItem = {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  tagline?: string;
  priceCents?: number;
  currency?: string;
  kind: 'product' | 'merchant' | 'place';
};

type ProductDetailSheetProps = {
  productName: string;
  description: string;
  priceCents: number;
  currency: string;
  merchantName: string;
  onAddCart: () => void;
  onMyCart?: () => void;
  inCart: boolean;
  similarProducts?: SimilarItem[];
  similarPlaces?: SimilarItem[];
  loadingSimilar?: boolean;
  onSelectSimilar?: (slug: string) => void;
  scrollRef?: AnimatedRef<Animated.ScrollView>;
  contentPaddingBottom?: number;
};

export default function ProductDetailSheet({
  productName,
  description,
  priceCents,
  currency,
  merchantName,
  onAddCart,
  onMyCart,
  inCart,
  similarProducts = [],
  similarPlaces = [],
  loadingSimilar,
  onSelectSimilar,
  scrollRef,
  contentPaddingBottom = 40,
}: ProductDetailSheetProps) {
  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      showsVerticalScrollIndicator={false}
      bounces
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{productName}</Text>
        <Text style={styles.price}>
          {(priceCents / 100).toFixed(0)} {currency.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.merchantRow}>
        <View style={styles.merchantAvatar}>
          <Ionicons name="storefront-outline" size={18} color="#fff" />
        </View>
        <Text style={styles.merchantName}>{merchantName}</Text>
        <TouchableOpacity style={styles.followBtn}>
          <Text style={styles.followText}>Follow</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chips}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>Category</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.cartBtn}
        onPress={inCart ? onMyCart : onAddCart}
      >
        <Ionicons
          name={inCart ? 'cart' : 'cart-outline'}
          size={20}
          color="#fff"
        />
        <Text style={styles.cartBtnText}>
          {inCart ? 'My Cart' : 'Add to cart'}
        </Text>
      </TouchableOpacity>

      {loadingSimilar ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
      ) : null}

      {similarProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>You might also like</Text>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similarScroll}
          >
            {similarProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.similarCard}
                activeOpacity={0.85}
                onPress={() => item.slug && onSelectSimilar?.(item.slug)}
                disabled={!item.slug}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.similarImage} />
                ) : (
                  <View style={[styles.similarImage, styles.similarImageEmpty]} />
                )}
                <Text style={styles.similarName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.priceCents != null && item.currency ? (
                  <Text style={styles.similarPrice}>
                    {(item.priceCents / 100).toFixed(0)} {item.currency.toUpperCase()}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        </View>
      )}

      {similarPlaces.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Places similar to {merchantName}
          </Text>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similarScroll}
          >
            {similarPlaces.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.placeCard}
                activeOpacity={0.85}
                onPress={() => item.slug && onSelectSimilar?.(item.slug)}
                disabled={!item.slug}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.placeImage} />
                ) : (
                  <View style={[styles.placeImage, styles.similarImageEmpty]}>
                    <Ionicons
                      name={item.kind === 'place' ? 'location-outline' : 'storefront-outline'}
                      size={28}
                      color="rgba(255,255,255,0.4)"
                    />
                  </View>
                )}
                <Text style={styles.placeName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.tagline ? (
                  <Text style={styles.placeBio} numberOfLines={2}>
                    {item.tagline}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        </View>
      )}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  price: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  merchantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followBtn: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  followText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: { color: '#fff', fontSize: 12 },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  cartBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  section: { marginTop: 24 },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  similarScroll: {
    gap: 12,
    paddingRight: 8,
  },
  similarCard: {
    width: 120,
  },
  similarImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarImageEmpty: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  similarPrice: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  placeCard: {
    width: 200,
  },
  placeImage: {
    width: 200,
    height: 112,
    borderRadius: 8,
    marginBottom: 8,
  },
  placeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  placeBio: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});
