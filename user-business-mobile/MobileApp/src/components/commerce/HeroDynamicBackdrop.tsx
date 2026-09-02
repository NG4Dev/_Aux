import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useHeroBackdropPalette } from '@/hooks/useHeroBackdropPalette';
import { useHeroBleedOpacityStyle } from '@/components/commerce/useOverlayHeroMorph';
import { BACKDROP_CROSSFADE_MS } from '@/components/commerce/menuTransitionTokens';
import { hasCachedHeroBackdropColor } from '@/utils/heroBackdropPaletteCache';
import type { HeroBackdropPalette } from '@/utils/heroBackdropColorUtils';

type HeroDynamicBackdropProps = {
  imageUrl?: string | null;
  sheetTranslateY?: SharedValue<number>;
  collapsedOffsetSV?: SharedValue<number>;
};

type DisplayState = {
  url: string | null | undefined;
  gradientColors: HeroBackdropPalette['gradientColors'];
};

export default function HeroDynamicBackdrop({
  imageUrl,
  sheetTranslateY,
  collapsedOffsetSV,
}: HeroDynamicBackdropProps) {
  const palette = useHeroBackdropPalette(imageUrl);
  const fadeSV = useSharedValue(1);
  const fallbackSheetY = useSharedValue(0);
  const fallbackCollapsed = useSharedValue(0);
  const bleedOpacityStyle = useHeroBleedOpacityStyle(
    sheetTranslateY ?? fallbackSheetY,
    collapsedOffsetSV ?? fallbackCollapsed,
  );
  const [display, setDisplay] = useState<DisplayState>(() => ({
    url: imageUrl,
    gradientColors: palette.gradientColors,
  }));
  const prevReadyUrlRef = useRef<string | null | undefined>(imageUrl);

  useEffect(() => {
    if (!imageUrl) {
      setDisplay({ url: null, gradientColors: palette.gradientColors });
      prevReadyUrlRef.current = imageUrl;
      return;
    }

    const paletteReady = palette.status === 'ready' || palette.status === 'fallback';
    const cacheHit = hasCachedHeroBackdropColor(imageUrl);

    if (!paletteReady && !cacheHit) {
      return;
    }

    if (prevReadyUrlRef.current === imageUrl && paletteReady) {
      setDisplay((prev) =>
        prev.url === imageUrl
          ? { url: imageUrl, gradientColors: palette.gradientColors }
          : prev,
      );
      return;
    }

    prevReadyUrlRef.current = imageUrl;
    fadeSV.value = 0;
    setDisplay({ url: imageUrl, gradientColors: palette.gradientColors });
    fadeSV.value = withTiming(1, { duration: BACKDROP_CROSSFADE_MS });
  }, [imageUrl, palette.status, palette.gradientColors, fadeSV]);

  const layerStyle = useAnimatedStyle(() => ({
    opacity: fadeSV.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, layerStyle]}>
        {display.url ? (
          <Animated.View style={[styles.bleedWrap, bleedOpacityStyle]}>
            <Image
              source={{ uri: display.url }}
              style={styles.bleedImage}
              resizeMode="cover"
              blurRadius={Platform.OS === 'android' ? 18 : 0}
            />
            {Platform.OS !== 'android' ? (
              <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />
            ) : null}
            <View style={styles.bleedDim} />
          </Animated.View>
        ) : null}
        <LinearGradient
          colors={display.gradientColors}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.25)']}
          style={styles.vignette}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bleedWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bleedImage: {
    position: 'absolute',
    width: '140%',
    height: '140%',
    left: '-20%',
    top: '-20%',
  },
  bleedDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
});
