import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

type SimilarItem = {
  id: string;
  name: string;
  kind: 'product' | 'merchant' | 'place';
};

type ProductDetailSheetProps = {
  productName: string;
  description: string;
  priceCents: number;
  currency: string;
  merchantName: string;
  onAddCart: () => void;
  inCart: boolean;
  similarProducts?: SimilarItem[];
  similarPlaces?: SimilarItem[];
  loadingSimilar?: boolean;
};

export default function ProductDetailSheet({
  productName,
  description,
  priceCents,
  currency,
  merchantName,
  onAddCart,
  inCart,
  similarProducts = [],
  similarPlaces = [],
  loadingSimilar,
}: ProductDetailSheetProps) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.handle} />
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

      <TouchableOpacity style={styles.cartBtn} onPress={onAddCart}>
        <Ionicons
          name={inCart ? 'cart' : 'cart-outline'}
          size={20}
          color="#fff"
        />
        <Text style={styles.cartBtnText}>
          {inCart ? 'In cart — tap to add more' : 'Add to cart'}
        </Text>
      </TouchableOpacity>

      {loadingSimilar ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
      ) : null}

      {similarProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>You might also like</Text>
          {similarProducts.map((item) => (
            <Text key={item.id} style={styles.similarItem}>
              {item.name}
            </Text>
          ))}
        </View>
      )}

      {similarPlaces.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Places similar to {merchantName}
          </Text>
          {similarPlaces.map((item) => (
            <Text key={item.id} style={styles.similarItem}>
              {item.name}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
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
    marginBottom: 8,
  },
  similarItem: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    paddingVertical: 4,
  },
});
