import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TouchableOpacity,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ViewStyle,
} from 'react-native';
import Animated, {
  type AnimatedRef,
  type AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import {
  menuCarouselFrameHeightForProduct,
  overlayHeroUsesLetterbox,
} from '@/components/commerce/getSheetSnapPoints';
import { OVERLAY_FADE_MS } from '@/components/commerce/menuTransitionTokens';
import { discoverLog } from '@/services/discoverFlowLogger';
import type { MediaAspect, MediaItem } from '@/types/content';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH * 0.72;
const ITEM_GAP = 12;
const SNAP_INTERVAL = ITEM_WIDTH + ITEM_GAP;
const SIDE_INSET = (SCREEN_WIDTH - ITEM_WIDTH) / 2;
const PROGRAMMATIC_SCROLL_GUARD_MS = 250;

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

function ActionChip({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionChip}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.actionChipIcon}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

type MerchantMenuHeroCarouselProps = {
  products: MenuCarouselProduct[];
  selectedSlug: string;
  merchantSlug?: string;
  fixedCenterFrameH?: number;
  programmaticScrollRef?: React.MutableRefObject<boolean>;
  heroAnchorRef?: AnimatedRef<Animated.View>;
  heroSourceOpacityStyle?: AnimatedStyle<ViewStyle>;
  sidePeekHideStyle?: AnimatedStyle<ViewStyle>;
  showOverlay?: boolean;
  onToggleOverlay?: () => void;
  onMaximize?: () => void;
  onShare?: () => void;
  onAddCart?: () => void;
  onAddToList?: () => void;
  onSelectProduct: (slug: string) => void;
  onHeroAnchorLayout?: () => void;
  onCenterFrameHeight?: (height: number) => void;
};

export default function MerchantMenuHeroCarousel({
  products,
  selectedSlug,
  merchantSlug,
  fixedCenterFrameH,
  programmaticScrollRef,
  heroAnchorRef,
  heroSourceOpacityStyle,
  sidePeekHideStyle,
  showOverlay = false,
  onToggleOverlay,
  onMaximize,
  onShare,
  onAddCart,
  onAddToList,
  onSelectProduct,
  onHeroAnchorLayout,
  onCenterFrameHeight,
}: MerchantMenuHeroCarouselProps) {
  const listRef = useRef<FlatList<MenuCarouselProduct>>(null);
  const layoutLoggedRef = useRef(false);
  const overlayOpacity = useSharedValue(0);
  const chipsOpacity = useSharedValue(0);

  const selectedProduct = products.find((p) => p.slug === selectedSlug) ?? products[0];
  const dynamicCenterFrameH = useMemo(
    () => (selectedProduct ? frameHeightForProduct(selectedProduct, 1) : 0),
    [selectedProduct],
  );
  const slotH = fixedCenterFrameH ?? dynamicCenterFrameH;
  const centerFrameH =
    fixedCenterFrameH != null && fixedCenterFrameH > 0
      ? fixedCenterFrameH
      : dynamicCenterFrameH;

  useEffect(() => {
    if (slotH > 0) {
      onCenterFrameHeight?.(slotH);
    }
  }, [slotH, onCenterFrameHeight]);

  useEffect(() => {
    if (slotH <= 0 || layoutLoggedRef.current) return;
    layoutLoggedRef.current = true;
    discoverLog('overlay', 'menuCarouselLayout', {
      merchantSlug,
      slotH,
      locked: fixedCenterFrameH != null && fixedCenterFrameH > 0,
      selectedSlug,
      centerFrameH,
      sideScaleMode: 'none',
    });
  }, [slotH, fixedCenterFrameH, selectedSlug, centerFrameH, merchantSlug]);

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
    }, PROGRAMMATIC_SCROLL_GUARD_MS);
    return () => clearTimeout(timer);
  }, [selectedSlug, products, programmaticScrollRef]);

  useEffect(() => {
    overlayOpacity.value = withTiming(showOverlay ? 1 : 0, { duration: OVERLAY_FADE_MS });
    chipsOpacity.value = withTiming(showOverlay ? 1 : 0, {
      duration: OVERLAY_FADE_MS,
      delay: showOverlay ? 60 : 0,
    });
  }, [showOverlay, overlayOpacity, chipsOpacity]);

  const overlayBackdropStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const overlayChipsStyle = useAnimatedStyle(() => ({
    opacity: chipsOpacity.value,
  }));

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

  if (products.length === 0 || centerFrameH <= 0) {
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
          const media = toMediaItem(item);
          const aspect = item.mediaAspect ?? 'square';
          const renderMode = media && overlayHeroUsesLetterbox(aspect, media)
            ? ('heroLetterbox' as const)
            : ('heroCover' as const);

          const imageNode = media ? (
            <DynamicMediaRenderer
              media={media}
              mode={renderMode}
              maxHeight={centerFrameH}
              contentWidth={ITEM_WIDTH}
              borderRadius={12}
            />
          ) : (
            <View style={[styles.imageEmpty, { width: ITEM_WIDTH, height: centerFrameH }]} />
          );

          const imageWrap = (
            <Animated.View
              style={[
                styles.imageWrap,
                {
                  width: ITEM_WIDTH,
                  height: centerFrameH,
                  opacity: isSelected ? 1 : 0.85,
                },
                isSelected && styles.imageWrapSelected,
                isSelected && heroSourceOpacityStyle,
                !isSelected && sidePeekHideStyle,
              ]}
            >
              {isSelected && onToggleOverlay ? (
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={onToggleOverlay}
                  accessibilityRole="button"
                  accessibilityLabel={`Actions for ${item.name}`}
                >
                  {imageNode}
                </Pressable>
              ) : (
                imageNode
              )}

              {isSelected && showOverlay && onShare && onAddCart && onAddToList ? (
                <>
                  <Animated.View
                    style={[styles.overlayBackdrop, overlayBackdropStyle]}
                    pointerEvents="none"
                  />
                  <Animated.View style={[styles.overlayActions, overlayChipsStyle]} pointerEvents="box-none">
                    <ActionChip icon="share-outline" label="Share" onPress={() => onShare()} />
                    <ActionChip icon="cart-outline" label="Add to Cart" onPress={() => onAddCart()} />
                    <ActionChip icon="list-outline" label="Add to List" onPress={() => onAddToList()} />
                  </Animated.View>
                </>
              ) : null}

              {isSelected && !showOverlay && onMaximize ? (
                <TouchableOpacity
                  style={styles.maximizeBtn}
                  onPress={onMaximize}
                  activeOpacity={0.85}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Expand product view"
                >
                  <Ionicons name="expand-outline" size={18} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </Animated.View>
          );

          return (
            <View style={[styles.item, { width: ITEM_WIDTH, marginRight: ITEM_GAP }]}>
              <View style={[styles.slot, { height: slotH }]}>
                {isSelected && heroAnchorRef ? (
                  <Animated.View
                    ref={heroAnchorRef}
                    style={styles.anchorSlot}
                    onLayout={onHeroAnchorLayout}
                  >
                    {imageWrap}
                  </Animated.View>
                ) : (
                  imageWrap
                )}
              </View>
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
  anchorSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  imageWrapSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#fff',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  imageEmpty: {
    backgroundColor: '#333',
    borderRadius: 12,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  overlayActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    zIndex: 6,
  },
  actionChip: {
    alignItems: 'center',
  },
  actionChipIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  maximizeBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 4,
  },
});
