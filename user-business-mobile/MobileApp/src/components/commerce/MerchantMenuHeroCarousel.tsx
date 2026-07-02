import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import {
  menuCarouselFrameHeightForProduct,
  overlayHeroUsesLetterbox,
} from '@/components/commerce/getSheetSnapPoints';
import Colors from '@/constants/Colors';
import type { MediaAspect, MediaItem } from '@/types/content';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH * 0.72;
const ITEM_GAP = 12;
const SNAP_INTERVAL = ITEM_WIDTH + ITEM_GAP;
const SIDE_INSET = (SCREEN_WIDTH - ITEM_WIDTH) / 2;
const SIDE_SCALE = 0.72;

export type MenuCarouselProduct = {
  slug: string;
  name: string;
  imageUrl?: string | null;
  mediaAspect?: MediaAspect;
  imageWidth?: number;
  imageHeight?: number;
};

function toMediaItem(product: MenuCarouselProduct): MediaItem | null {
  if (!product.imageUrl) return null;
  return {
    uri: product.imageUrl,
    type: 'image',
    width: product.imageWidth ?? 1080,
    height: product.imageHeight ?? 1080,
    aspect: product.mediaAspect ?? 'square',
  };
}

function frameHeightForProduct(product: MenuCarouselProduct, scale = 1): number {
  return Math.round(menuCarouselFrameHeightForProduct(product) * scale);
}

type MerchantMenuHeroCarouselProps = {
  products: MenuCarouselProduct[];
  selectedSlug: string;
  merchantName: string;
  merchantAvatar?: string | null;
  fixedCenterFrameH?: number;
  programmaticScrollRef?: React.MutableRefObject<boolean>;
  onSelectProduct: (slug: string) => void;
  onHeroPress?: () => void;
  onCenterFrameHeight?: (height: number) => void;
};

export default function MerchantMenuHeroCarousel({
  products,
  selectedSlug,
  merchantName,
  merchantAvatar,
  fixedCenterFrameH,
  programmaticScrollRef,
  onSelectProduct,
  onHeroPress,
  onCenterFrameHeight,
}: MerchantMenuHeroCarouselProps) {
  const listRef = useRef<FlatList<MenuCarouselProduct>>(null);

  const selectedProduct = products.find((p) => p.slug === selectedSlug) ?? products[0];
  const dynamicCenterFrameH = useMemo(
    () => (selectedProduct ? frameHeightForProduct(selectedProduct, 1) : 0),
    [selectedProduct],
  );
  const slotH = fixedCenterFrameH ?? dynamicCenterFrameH;

  useEffect(() => {
    if (slotH > 0) {
      onCenterFrameHeight?.(slotH);
    }
  }, [slotH, onCenterFrameHeight]);

  useEffect(() => {
    if (products.length === 0) return;
    const index = Math.max(0, products.findIndex((p) => p.slug === selectedSlug));
    if (programmaticScrollRef) {
      programmaticScrollRef.current = true;
    }
    listRef.current?.scrollToOffset({
      offset: index * SNAP_INTERVAL,
      animated: false,
    });
    const timer = setTimeout(() => {
      if (programmaticScrollRef) {
        programmaticScrollRef.current = false;
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedSlug, products, programmaticScrollRef]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (programmaticScrollRef?.current) return;
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SNAP_INTERVAL);
      const product = products[index];
      if (product && product.slug !== selectedSlug) {
        onSelectProduct(product.slug);
      }
    },
    [products, selectedSlug, onSelectProduct, programmaticScrollRef],
  );

  if (products.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE_INSET }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index,
        })}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => {
          const isSelected = item.slug === selectedSlug;
          const useFixedSlot = fixedCenterFrameH != null && fixedCenterFrameH > 0;
          const centerFrameH = useFixedSlot
            ? fixedCenterFrameH
            : frameHeightForProduct(item, 1);
          const frameH = isSelected
            ? centerFrameH
            : Math.round(centerFrameH * SIDE_SCALE);
          const frameW = isSelected ? ITEM_WIDTH : ITEM_WIDTH * SIDE_SCALE;
          const media = toMediaItem(item);
          const aspect = item.mediaAspect ?? 'square';
          const renderMode = media && overlayHeroUsesLetterbox(aspect, media)
            ? ('heroLetterbox' as const)
            : ('heroCover' as const);

          const imageNode = media ? (
            <DynamicMediaRenderer
              media={media}
              mode={renderMode}
              maxHeight={frameH}
              contentWidth={frameW}
              borderRadius={12}
            />
          ) : (
            <View style={[styles.imageEmpty, { width: frameW, height: frameH }]} />
          );

          return (
            <View style={[styles.item, { width: ITEM_WIDTH, marginRight: ITEM_GAP }]}>
              <View
                style={[
                  styles.slot,
                  slotH > 0 ? { height: slotH } : undefined,
                ]}
              >
                <View
                  style={[
                    styles.imageWrap,
                    {
                      width: frameW,
                      height: frameH,
                      opacity: isSelected ? 1 : 0.85,
                    },
                  ]}
                >
                  {isSelected && onHeroPress ? (
                    <Pressable
                      style={StyleSheet.absoluteFill}
                      onPress={onHeroPress}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${item.name} full screen`}
                    >
                      {imageNode}
                    </Pressable>
                  ) : (
                    imageNode
                  )}
                </View>
              </View>
              {isSelected ? (
                <>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.profileRow}>
                    {merchantAvatar ? (
                      <DynamicMediaRenderer
                        media={{
                          uri: merchantAvatar,
                          type: 'image',
                          width: 40,
                          height: 40,
                          aspect: 'square',
                        }}
                        mode="heroCover"
                        maxHeight={20}
                        contentWidth={20}
                        borderRadius={10}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.imageEmpty]} />
                    )}
                    <Text style={styles.merchantName} numberOfLines={1}>
                      {merchantName}
                    </Text>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  </View>
                </>
              ) : (
                <Text style={styles.sideLabel} numberOfLines={1}>
                  {item.name}
                </Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 8,
  },
  item: {
    alignItems: 'center',
  },
  slot: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  imageEmpty: {
    backgroundColor: '#333',
    borderRadius: 12,
  },
  productName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    maxWidth: ITEM_WIDTH,
    textAlign: 'center',
  },
  sideLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 8,
    maxWidth: ITEM_WIDTH * SIDE_SCALE,
    textAlign: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  merchantName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: ITEM_WIDTH * 0.55,
  },
});
