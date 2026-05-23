import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { Business } from '@/types/business';
import GalleryCarousel from './GalleryCarousel';
import TabEmptyState from './TabEmptyState';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;
const GRID_GAP = 2;
const GRID_TILE_WIDTH = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

type Props = {
  business: Business;
  contentPaddingTop: number;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export default function GalleryTab({
  business,
  contentPaddingTop,
  onScroll,
}: Props) {
  const scale = useSharedValue(1.2);

  useEffect(() => {
    scale.value = 1.2;
    scale.value = withTiming(1, { duration: 6000 });
  }, [scale]);

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heroPhoto = business.gallery[0];
  const gridPhotos = useMemo(
    () => business.gallery.slice(1),
    [business.gallery],
  );

  const featuredCarousel = useMemo(
    () => business.gallery.slice(0, 6),
    [business.gallery],
  );
  const recentCarousel = useMemo(
    () => business.gallery.slice(-6).reverse(),
    [business.gallery],
  );

  if (business.gallery.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.empty,
          { paddingTop: contentPaddingTop },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <TabEmptyState
          title="No content available"
          subtitle="No content is available at this time."
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: contentPaddingTop, paddingBottom: 140 }}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {heroPhoto && (
        <View style={styles.heroWrap}>
          <Animated.Image
            source={{ uri: heroPhoto.uri }}
            style={[styles.heroImage, heroAnimatedStyle]}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.grid}>
        {gridPhotos.map((photo, idx) => (
          <Pressable key={`${photo.uri}-${idx}`} style={styles.tile}>
            <Image
              source={{ uri: photo.uri }}
              style={styles.tileImage}
            />
          </Pressable>
        ))}
      </View>

      {featuredCarousel.length > 0 && (
        <GalleryCarousel title="Featured" photos={featuredCarousel} />
      )}
      {recentCarousel.length > 0 && (
        <GalleryCarousel title="Most recent" photos={recentCarousel} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  empty: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  heroWrap: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginBottom: GRID_GAP,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  tile: {
    width: GRID_TILE_WIDTH,
    aspectRatio: 1,
  },
  tileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
  },
});
