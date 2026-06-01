import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text,
} from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
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
  productName: string;
  productSubtitle?: string;
  captionStyle?: AnimatedStyle;
};

function ActionChip({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionChip} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={22} color="#fff" />
    </TouchableOpacity>
  );
}

function RailButton({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.railBtn} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={20} color="#fff" />
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
  productName,
  productSubtitle,
  captionStyle,
}: ProductHeroMediaProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.imageSlot, { height: imageSlotHeight }]}>
        <Pressable onPress={onToggleOverlay} style={styles.mediaPressable}>
          <DynamicMediaRenderer
            media={media}
            maxHeight={imageSlotHeight}
            borderRadius={8}
          />
        </Pressable>

        {showOverlay && (
          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.overlayActions}>
              <ActionChip icon="share-outline" onPress={onShare} />
              <ActionChip icon="cart-outline" onPress={onAddCart} />
              <ActionChip icon="bookmark-outline" onPress={onAddToList} />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.maximizeBtn}
          onPress={onMaximize}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="expand-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.actionRail, showOverlay && styles.actionRailDimmed]}>
        <RailButton icon="share-outline" onPress={onShare} />
        <RailButton icon="cart-outline" onPress={onAddCart} />
        <RailButton icon="bookmark-outline" onPress={onAddToList} />
        <RailButton icon="expand-outline" onPress={onMaximize} />
      </View>

      <Animated.View style={[styles.captionWrap, captionStyle]}>
        <Text style={styles.heroTitle}>{productName}</Text>
        {productSubtitle ? (
          <Text style={styles.heroSubtitle} numberOfLines={1}>
            {productSubtitle}
          </Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  imageSlot: {
    position: 'relative',
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  mediaPressable: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  overlayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    zIndex: 2,
  },
  actionRail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    height: 48,
    marginTop: 8,
  },
  actionRailDimmed: {
    opacity: 0.55,
  },
  railBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionWrap: {
    overflow: 'hidden',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
});
