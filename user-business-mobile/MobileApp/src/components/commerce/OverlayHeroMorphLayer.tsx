import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

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

function expandProgressFromSheet(
  sheetTranslateY: SharedValue<number>,
  collapsedOffsetSV: SharedValue<number>,
): number {
  'worklet';
  const collapsed = collapsedOffsetSV.value;
  if (collapsed <= 0) return 0;
  const raw = 1 - sheetTranslateY.value / collapsed;
  return Math.max(0, Math.min(1, raw));
}

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

    const progress = expandProgressFromSheet(sheetTranslateY, collapsedOffsetSV);
    const hero = heroRect.value;
    const sticky = miniPlayerRect.value;

    if (hero.width <= 0 || sticky.width <= 0) {
      return { opacity: 0, width: 0, height: 0 };
    }

    if (suppressMorphSV.value > 0 && progress < 0.02) {
      return { opacity: 0, width: 0, height: 0 };
    }

    if (progress >= 0.98) {
      return { opacity: 0, width: 0, height: 0 };
    }

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
    const borderRadius = interpolate(progress, [0, 1], [8, 6], Extrapolation.CLAMP);

    const opacity = interpolate(
      progress,
      [0.04, 0.06, 0.94, 0.98],
      [0, 1, 1, 0],
      Extrapolation.CLAMP,
    );

    if (progress < 0.04) {
      return { opacity: 0, width: 0, height: 0 };
    }

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
    backgroundColor: '#222',
  },
});
