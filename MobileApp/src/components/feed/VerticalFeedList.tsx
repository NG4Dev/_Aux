import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import type { ContentItem } from '@/types/content';
import AnimatedFeedCard from './AnimatedFeedCard';

type VerticalFeedListProps = {
  data: ContentItem[];
};

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');
const SPACING = 4;
const ITEM_HEIGHT = SCREEN_HEIGHT * 0.72;
const ITEM_FULL_SIZE = ITEM_HEIGHT + SPACING * 2;

export default function VerticalFeedList({ data }: VerticalFeedListProps) {
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y / ITEM_FULL_SIZE;
    },
  });

  return (
    <Animated.FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <AnimatedFeedCard
          item={item}
          index={index}
          scrollY={scrollY}
          itemHeight={ITEM_HEIGHT}
        />
      )}
      onScroll={onScroll}
      scrollEventThrottle={16}
      snapToInterval={ITEM_FULL_SIZE}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingVertical: (SCREEN_HEIGHT - ITEM_FULL_SIZE) / 2,
        paddingHorizontal: SPACING * 3,
        gap: SPACING * 2,
      }}
    />
  );
}

export { ITEM_HEIGHT, ITEM_FULL_SIZE, SPACING };
