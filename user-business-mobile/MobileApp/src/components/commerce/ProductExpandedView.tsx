import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import type { MediaItem } from '@/types/content';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type ProductExpandedViewProps = {
  media: MediaItem;
  onCollapse: () => void;
};

export default function ProductExpandedView({
  media,
  onCollapse,
}: ProductExpandedViewProps) {
  const insets = useSafeAreaInsets();
  const mediaHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 48;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.collapseBtn, { top: insets.top + 8 }]}
        onPress={onCollapse}
      >
        <Ionicons name="chevron-down" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={[styles.mediaWrap, { paddingTop: insets.top + 48 }]}>
        <DynamicMediaRenderer
          media={media}
          maxHeight={mediaHeight}
          borderRadius={0}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  mediaWrap: {
    flex: 1,
    width: SCREEN_WIDTH,
    justifyContent: 'center',
  },
});
