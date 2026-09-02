import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type AnimatedStyle,
  type AnimatedRef,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import {
  overlayHeroUsesLetterbox,
  overlayHeroWidth,
} from '@/components/commerce/getSheetSnapPoints';
import type { MediaItem } from '@/types/content';

type ProductHeroMediaProps = {
  media: MediaItem;
  imageSlotHeight: number;
  showOverlay: boolean;
  onToggleOverlay: () => void;
  onMaximize: () => void;
  onShare: () => void;
  onAddCart: () => void;
  onAddToList: () => void;
  onChipPress?: (chip: 'share' | 'cart' | 'list') => void;
  productName: string;
  productSubtitle?: string;
  captionStyle?: AnimatedStyle;
  mediaOpacityStyle?: AnimatedStyle;
  hideMaximizeStyle?: AnimatedStyle;
  heroAnchorRef?: AnimatedRef<Animated.View>;
  onHeroAnchorLayout?: () => void;
  tapEnabled?: boolean;
};

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

export default function ProductHeroMedia({
  media,
  imageSlotHeight,
  showOverlay,
  onToggleOverlay,
  onMaximize,
  onShare,
  onAddCart,
  onAddToList,
  onChipPress,
  productName,
  productSubtitle,
  captionStyle,
  mediaOpacityStyle,
  hideMaximizeStyle,
  heroAnchorRef,
  onHeroAnchorLayout,
  tapEnabled = true,
}: ProductHeroMediaProps) {
  const contentWidth = overlayHeroWidth();
  const renderMode = useMemo(
    () =>
      overlayHeroUsesLetterbox(media.aspect ?? 'square', media)
        ? ('heroLetterbox' as const)
        : ('heroCover' as const),
    [media],
  );

  const heroTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .enabled(tapEnabled)
        .onEnd(() => {
          runOnJS(onToggleOverlay)();
        }),
    [onToggleOverlay, tapEnabled],
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.imageSlotOuter, { height: imageSlotHeight }]}>
        <View style={[styles.imageSlot, { height: imageSlotHeight }]}>
          <GestureDetector gesture={heroTapGesture}>
            <Animated.View style={styles.mediaPressable}>
              <Animated.View
                ref={heroAnchorRef}
                style={[styles.mediaAnchor, mediaOpacityStyle]}
                onLayout={onHeroAnchorLayout}
              >
                <DynamicMediaRenderer
                  media={media}
                  mode={renderMode}
                  maxHeight={imageSlotHeight}
                  contentWidth={contentWidth}
                  borderRadius={8}
                />
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          {!showOverlay && (
            <Animated.View style={[styles.maximizeBtnWrap, hideMaximizeStyle]} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.maximizeBtn}
                onPress={onMaximize}
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="expand-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {showOverlay && (
          <View
            style={[
              styles.overlay,
              { height: imageSlotHeight },
              styles.overlayActive,
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.overlayBackdrop}
              onPress={onToggleOverlay}
              activeOpacity={1}
            />
            <View style={styles.overlayActions} pointerEvents="box-none">
              <ActionChip
                icon="share-outline"
                label="Share"
                onPress={() => {
                  onChipPress?.('share');
                  onShare();
                }}
              />
              <ActionChip
                icon="cart-outline"
                label="Add to Cart"
                onPress={() => {
                  onChipPress?.('cart');
                  onAddCart();
                }}
              />
              <ActionChip
                icon="list-outline"
                label="Add to List"
                onPress={() => {
                  onChipPress?.('list');
                  onAddToList();
                }}
              />
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={onMaximize}>
        <Animated.View style={[styles.captionWrap, captionStyle]}>
          <Text style={styles.heroTitle}>{productName}</Text>
          {productSubtitle ? (
            <Text style={styles.heroSubtitle} numberOfLines={2}>
              {productSubtitle}
            </Text>
          ) : null}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  imageSlotOuter: {
    position: 'relative',
    width: '100%',
  },
  imageSlot: {
    position: 'relative',
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaPressable: {
    flex: 1,
    width: '100%',
  },
  mediaAnchor: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  overlayActive: {
    zIndex: 60,
    elevation: 10,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  overlayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    zIndex: 6,
    elevation: 6,
  },
  actionChip: {
    alignItems: 'center',
    elevation: 4,
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
  maximizeBtnWrap: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    zIndex: 2,
  },
  maximizeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  captionWrap: {
    overflow: 'hidden',
    marginTop: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
});
