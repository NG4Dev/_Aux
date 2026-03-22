import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { ContentItem } from '@/types/content';
import FeedCard from './FeedCard';

type AnimatedFeedCardProps = {
  item: ContentItem;
  index: number;
  scrollY: SharedValue<number>;
  itemHeight: number;
};

export default function AnimatedFeedCard({
  item,
  index,
  scrollY,
  itemHeight,
}: AnimatedFeedCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [index - 1, index, index + 1],
      [0.5, 1, 0.5],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      scrollY.value,
      [index - 1, index, index + 1],
      [0.92, 1, 0.92],
      Extrapolation.CLAMP,
    );

    return { opacity, transform: [{ scale }] };
  });

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <FeedCard item={item} height={itemHeight} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});
