import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import type { MediaItem } from '@/types/content';

type ProductHeroMediaProps = {
  media: MediaItem;
  maxHeight: number;
  showOverlay: boolean;
  onToggleOverlay: () => void;
  onMaximize: () => void;
  onShare: () => void;
  onAddCart: () => void;
  onAddToList: () => void;
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

export default function ProductHeroMedia({
  media,
  maxHeight,
  showOverlay,
  onToggleOverlay,
  onMaximize,
  onShare,
  onAddCart,
  onAddToList,
}: ProductHeroMediaProps) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onToggleOverlay} style={styles.mediaPressable}>
        <DynamicMediaRenderer
          media={media}
          maxHeight={maxHeight}
          borderRadius={8}
        />
        {showOverlay && (
          <View style={styles.overlay}>
            <View style={styles.overlayActions}>
              <ActionChip icon="share-outline" onPress={onShare} />
              <ActionChip icon="cart-outline" onPress={onAddCart} />
              <ActionChip icon="bookmark-outline" onPress={onAddToList} />
            </View>
          </View>
        )}
      </Pressable>

      <TouchableOpacity
        style={styles.maximizeBtn}
        onPress={onMaximize}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="expand-outline" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  mediaPressable: {
    borderRadius: 8,
    overflow: 'hidden',
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
});
