import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  INLINE_FADE_OUT_END,
  INLINE_FADE_OUT_START,
  inlineThumbPeekOpacity,
  expandProgressFromSheet,
} from '@/components/commerce/menuTransitionTokens';

type ProductNowPlayingBarProps = {
  imageUrl?: string | null;
  productName: string;
  merchantName: string;
  sheetTranslateY: SharedValue<number>;
  collapsedOffsetSV: SharedValue<number>;
  onPress?: () => void;
};

export default function ProductNowPlayingBar({
  imageUrl,
  productName,
  merchantName,
  sheetTranslateY,
  collapsedOffsetSV,
  onPress,
}: ProductNowPlayingBarProps) {
  const barStyle = useAnimatedStyle(() => {
    const expandProgress = expandProgressFromSheet(
      sheetTranslateY.value,
      collapsedOffsetSV.value,
    );
    const opacity = interpolate(
      expandProgress,
      [INLINE_FADE_OUT_START, INLINE_FADE_OUT_END],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      pointerEvents: opacity > 0.05 ? ('auto' as const) : ('none' as const),
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const expandProgress = expandProgressFromSheet(
      sheetTranslateY.value,
      collapsedOffsetSV.value,
    );
    return { opacity: inlineThumbPeekOpacity(expandProgress) };
  });

  const inner = (
    <View style={styles.inner}>
      <Animated.View style={[styles.thumb, thumbStyle]}>
        {imageUrl ? (
          <Animated.Image source={{ uri: imageUrl }} style={styles.thumbImage} />
        ) : null}
      </Animated.View>
      <View style={styles.textCol}>
        <Text style={styles.productName} numberOfLines={1}>
          {productName}
        </Text>
        <Text style={styles.merchantName} numberOfLines={1}>
          {merchantName}
        </Text>
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.bar, barStyle]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={styles.pressable}
          accessibilityRole="button"
          accessibilityLabel="Collapse product sheet"
        >
          {inner}
        </Pressable>
      ) : (
        inner
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 52,
    justifyContent: 'center',
  },
  pressable: {
    flex: 1,
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    overflow: 'hidden',
  },
  thumbImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  textCol: { flex: 1, minWidth: 0 },
  productName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  merchantName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
