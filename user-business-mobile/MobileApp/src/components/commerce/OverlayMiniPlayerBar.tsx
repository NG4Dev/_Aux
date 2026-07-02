import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  type AnimatedRef,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

type OverlayMiniPlayerBarProps = {
  productName: string;
  productSubtitle?: string;
  imageUrl?: string | null;
  sheetTranslateY: SharedValue<number>;
  collapsedOffsetSV: SharedValue<number>;
  barRef: AnimatedRef<Animated.View>;
  thumbRef: AnimatedRef<Animated.View>;
  onBarLayout?: () => void;
  onThumbLayout?: () => void;
  onPress?: () => void;
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

const AnimatedView = Animated.createAnimatedComponent(View);

export default function OverlayMiniPlayerBar({
  productName,
  productSubtitle,
  imageUrl,
  sheetTranslateY,
  collapsedOffsetSV,
  barRef,
  thumbRef,
  onBarLayout,
  onThumbLayout,
  onPress,
}: OverlayMiniPlayerBarProps) {
  const slotStyle = useAnimatedStyle(() => {
    const expandProgress = expandProgressFromSheet(sheetTranslateY, collapsedOffsetSV);
    const opacity = interpolate(
      expandProgress,
      [0.35, 0.55],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const textColStyle = useAnimatedStyle(() => {
    const expandProgress = expandProgressFromSheet(sheetTranslateY, collapsedOffsetSV);
    const opacity = interpolate(
      expandProgress,
      [0.35, 0.55],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const thumbImageStyle = useAnimatedStyle(() => {
    const expandProgress = expandProgressFromSheet(sheetTranslateY, collapsedOffsetSV);
    return {
      opacity: interpolate(
        expandProgress,
        [0.96, 0.98],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  });

  const animatedProps = useAnimatedProps(() => ({
    pointerEvents: 'none' as const,
  }));

  const inner = (
    <View style={styles.inner} pointerEvents="box-none">
      <Animated.View ref={thumbRef} style={styles.thumb} onLayout={onThumbLayout}>
        {imageUrl ? (
          <Animated.Image
            source={{ uri: imageUrl }}
            style={[styles.thumbImage, thumbImageStyle]}
            resizeMode="cover"
          />
        ) : null}
      </Animated.View>
      <Animated.View style={[styles.textCol, textColStyle]}>
        <Text style={styles.name} numberOfLines={1}>
          {productName}
        </Text>
        {productSubtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {productSubtitle}
          </Text>
        ) : null}
      </Animated.View>
    </View>
  );

  return (
    <AnimatedView
      ref={barRef}
      style={[styles.slot, slotStyle]}
      animatedProps={animatedProps}
      onLayout={onBarLayout}
      pointerEvents="box-none"
    >
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={styles.pressable}
          accessibilityRole="button"
          accessibilityLabel="Collapse menu queue"
        >
          {inner}
        </Pressable>
      ) : (
        inner
      )}
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  pressable: {
    flex: 1,
    minWidth: 0,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#333',
    overflow: 'hidden',
  },
  thumbImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
});
