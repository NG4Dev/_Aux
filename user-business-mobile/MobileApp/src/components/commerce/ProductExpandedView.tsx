import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import type { MediaItem } from '@/types/content';
import Colors from '@/constants/Colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type ProductExpandedViewProps = {
  media: MediaItem;
  productName: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl?: string | null;
  onCollapse: () => void;
  onShare: () => void;
  onAddCart: () => void;
};

export default function ProductExpandedView({
  media,
  productName,
  description,
  priceCents,
  currency,
  imageUrl,
  onCollapse,
  onShare,
  onAddCart,
}: ProductExpandedViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.collapseBtn, { top: insets.top + 8 }]}
        onPress={onCollapse}
      >
        <Ionicons name="chevron-down" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.mediaWrap}>
        <DynamicMediaRenderer
          media={media}
          maxHeight={SCREEN_HEIGHT}
          borderRadius={0}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onAddCart}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="bookmark-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.summary, { paddingBottom: insets.bottom + 12 }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.summaryThumb} />
        ) : (
          <View style={[styles.summaryThumb, styles.thumbEmpty]} />
        )}
        <View style={styles.summaryText}>
          <Text style={styles.summaryName} numberOfLines={1}>
            {productName}
          </Text>
          <Text style={styles.summaryDesc} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <Text style={styles.summaryPrice}>
          {(priceCents / 100).toFixed(0)} {currency.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  collapseBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaWrap: { flex: 1, justifyContent: 'center' },
  actions: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    gap: 16,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
  },
  summaryThumb: { width: 48, height: 48, borderRadius: 8 },
  thumbEmpty: { backgroundColor: '#333' },
  summaryText: { flex: 1 },
  summaryName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  summaryDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  summaryPrice: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
