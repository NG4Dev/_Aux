import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  MORPH_START,
  MORPH_END,
  morphEaseProgress,
  morphLayerWithHandoff,
  expandProgressFromSheet,
} from '@/components/commerce/menuTransitionTokens';

export type MorphRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const LAYOUT_READY = 1;

type OverlayHeroMorphLayerProps = {
  imageUrl: string;
  sheetTranslateY: SharedValue<number>;
  collapsedOffsetSV: SharedValue<number>;
  heroRect: SharedValue<MorphRect>;
  miniPlayerRect: SharedValue<MorphRect>;
  heroLayoutReady: SharedValue<number>;
  miniPlayerLayoutReady: SharedValue<number>;
  suppressMorphSV: SharedValue<number>;
};

export default function OverlayHeroMorphLayer({
  imageUrl,
  sheetTranslateY,
  collapsedOffsetSV,
  heroRect,
  miniPlayerRect,
  heroLayoutReady,
  miniPlayerLayoutReady,
  suppressMorphSV,
}: OverlayHeroMorphLayerProps) {
  const morphStyle = useAnimatedStyle(() => {
    if (
      heroLayoutReady.value < LAYOUT_READY ||
      miniPlayerLayoutReady.value < LAYOUT_READY
    ) {
      return { opacity: 0, width: 0, height: 0 };
    }

    const rawProgress = expandProgressFromSheet(
      sheetTranslateY.value,
      collapsedOffsetSV.value,
    );
    const hero = heroRect.value;
    const sticky = miniPlayerRect.value;

    if (hero.width <= 0 || sticky.width <= 0) {
      return { opacity: 0, width: 0, height: 0 };
    }

    if (suppressMorphSV.value > 0 && rawProgress < MORPH_START) {
      return { opacity: 0, width: 0, height: 0 };
    }

    if (rawProgress <= MORPH_START || rawProgress >= MORPH_END) {
      return { opacity: 0, width: 0, height: 0 };
    }

    const progress = morphEaseProgress(
      (rawProgress - MORPH_START) / (MORPH_END - MORPH_START),
    );

    const left = interpolate(progress, [0, 1], [hero.x, sticky.x], Extrapolation.CLAMP);
    const top = interpolate(progress, [0, 1], [hero.y, sticky.y], Extrapolation.CLAMP);
    const width = interpolate(
      progress,
      [0, 1],
      [hero.width, sticky.width],
      Extrapolation.CLAMP,
    );
    const height = interpolate(
      progress,
      [0, 1],
      [hero.height, sticky.height],
      Extrapolation.CLAMP,
    );
    const borderRadius = interpolate(progress, [0, 1], [12, 6], Extrapolation.CLAMP);

    const opacity = morphLayerWithHandoff(rawProgress);

    return {
      position: 'absolute',
      left,
      top,
      width,
      height,
      borderRadius,
      opacity,
      zIndex: 55,
    };
  });

  return (
    <Animated.Image
      source={{ uri: imageUrl }}
      style={[styles.morphImage, morphStyle]}
      resizeMode="cover"
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  morphImage: {
    backgroundColor: 'transparent',
  },
});
