import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  type AnimatedRef,
  type AnimatedStyle,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import { SideActionButton } from '@/components/feed/ReelViewerShell';
import { OVERLAY_PRICE_GREEN } from '@/components/commerce/getSheetSnapPoints';
import type { MediaItem } from '@/types/content';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ProductStoryHeroLayoutProps = {
  media: MediaItem;
  productName: string;
  productSubtitle?: string;
  priceCents: number;
  currency: string;
  imageUrl?: string | null;
  heroAnchorRef?: AnimatedRef<Animated.View>;
  onHeroAnchorLayout?: () => void;
  bottomCardPositionStyle?: AnimatedStyle;
  bottomCardOpacityStyle?: AnimatedStyle;
  reelOpacityStyle?: AnimatedStyle;
  onExpandSheet?: () => void;
  onShare: () => void;
  onAddCart: () => void;
  onAddToList: () => void;
};

export default function ProductStoryHeroLayout({
  media,
  productName,
  productSubtitle,
  priceCents,
  currency,
  imageUrl,
  heroAnchorRef,
  onHeroAnchorLayout,
  bottomCardPositionStyle,
  bottomCardOpacityStyle,
  reelOpacityStyle,
  onExpandSheet,
  onShare,
  onAddCart,
  onAddToList,
}: ProductStoryHeroLayoutProps) {
  const priceLabel = `${(priceCents / 100).toFixed(0)} ${currency.toUpperCase()}`;
  const storyMedia = useMemo(
    () => ({ ...media, aspect: 'story' as const }),
    [media],
  );

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View
        ref={heroAnchorRef}
        style={[styles.fullBleedAnchor, reelOpacityStyle]}
        onLayout={onHeroAnchorLayout}
      >
        <DynamicMediaRenderer
          media={storyMedia}
          mode="heroCover"
          maxHeight={SCREEN_HEIGHT}
          contentWidth={SCREEN_WIDTH}
          borderRadius={0}
        />
      </Animated.View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.75)']}
        locations={[0.45, 0.72, 0.88, 1]}
        style={styles.bottomScrim}
        pointerEvents="none"
      />

      <View style={styles.sideStack} pointerEvents="box-none">
        <SideActionButton icon="cart-outline" onPress={onAddCart} />
        <SideActionButton icon="list-outline" onPress={onAddToList} />
        <SideActionButton icon="share-outline" onPress={onShare} />
      </View>

      <Animated.View
        style={[styles.bottomCardWrap, bottomCardPositionStyle, bottomCardOpacityStyle]}
        pointerEvents="box-none"
      >
        <View style={styles.expandHintRow} pointerEvents="none">
          <Ionicons
            name="chevron-up"
            size={16}
            color="rgba(255,255,255,0.45)"
          />
          <Ionicons
            name="chevron-up"
            size={16}
            color="rgba(255,255,255,0.45)"
            style={styles.expandHintSecond}
          />
        </View>

        <Pressable
          style={styles.bottomCard}
          onPress={onExpandSheet}
          accessibilityRole="button"
          accessibilityLabel={`Open ${productName} details`}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardThumb} />
          ) : (
            <View style={[styles.cardThumb, styles.cardThumbEmpty]} />
          )}
          <View style={styles.cardText}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {productName}
            </Text>
            {productSubtitle ? (
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {productSubtitle}
              </Text>
            ) : null}
          </View>
          <Text style={styles.cardPrice}>{priceLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  fullBleedAnchor: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.42,
  },
  sideStack: {
    position: 'absolute',
    right: 16,
    top: SCREEN_HEIGHT * 0.55,
    gap: 14,
    zIndex: 5,
  },
  bottomCardWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 6,
  },
  expandHintRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  expandHintSecond: {
    marginTop: -10,
  },
  bottomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  cardThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  cardThumbEmpty: {
    backgroundColor: '#333',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  cardPrice: {
    color: OVERLAY_PRICE_GREEN,
    fontSize: 15,
    fontWeight: '700',
  },
});
