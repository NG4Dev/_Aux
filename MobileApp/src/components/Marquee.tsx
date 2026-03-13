import { useEffect, useState, PropsWithChildren, useMemo } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';

type MarqueeItemProps = {
  index: number;
  scroll: SharedValue<number>;
  totalWidth: number;
  itemWidth: number;
};

function MarqueeItem({
  index,
  scroll,
  totalWidth,
  itemWidth,
  children,
}: PropsWithChildren<MarqueeItemProps>) {
  const { width: screenWidth } = useWindowDimensions();

  const animatedStyle = useAnimatedStyle(() => {
    const initialPosition = itemWidth * index;
    // Modulo ensures we loop within the total width of the tripled set
    const position = ((initialPosition - scroll.value) % totalWidth + totalWidth) % totalWidth;
    
    // We want to center the active item on the screen.
    // The items are laid out 0 -> totalWidth.
    // We shift the rendering so it's centered.
    const x = position - itemWidth; 

    // Visual polish: tilt and vertical movement based on screen position
    // First, find where it is relative to the screen
    const screenPos = x + itemWidth / 2;
    const rotation = interpolate(screenPos, [0, screenWidth], [-2, 2], 'clamp');
    const translateY = interpolate(
      screenPos,
      [0, screenWidth / 2, screenWidth],
      [4, 0, 4],
      'clamp'
    );

    return {
      transform: [
        { translateX: Math.round(x) },
        { rotateZ: `${rotation}deg` },
        { translateY: Math.round(translateY) }
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.marqueeItem,
        { width: itemWidth, transformOrigin: 'bottom' },
        animatedStyle,
      ]}>
      {children}
    </Animated.View>
  );
}

export default function Marquee({
  items,
  onIndexChange,
  renderItem,
}: {
  items: any[];
  onIndexChange?: (index: number) => void;
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactNode;
}) {
  const scroll = useSharedValue(0);
  const scrollSpeed = useSharedValue(50); // pixels per second
  const { width: screenWidth } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);

  const itemWidth = screenWidth * 0.65;
  const singleSetWidth = items.length * itemWidth;
  
  // We use 3 sets to ensure seamless scroll in both directions
  const tripledItems = useMemo(() => [...items, ...items, ...items], [items]);
  const totalWidth = tripledItems.length * itemWidth;

  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(activeIndex);
    }
  }, [activeIndex]);

  useAnimatedReaction(
    () => scroll.value,
    (value) => {
      // Calculate which of the original items is at the center
      const normalisedScroll = ((value + screenWidth / 2) % singleSetWidth + singleSetWidth) % singleSetWidth;
      const index = Math.floor(normalisedScroll / itemWidth);
      if (index !== activeIndex && index >= 0 && index < items.length) {
        runOnJS(setActiveIndex)(index);
      }
    }
  );

  useFrameCallback((frameInfo) => {
    const deltaSeconds = (frameInfo.timeSincePreviousFrame ?? 0) / 1000;
    scroll.value = scroll.value + scrollSpeed.value * deltaSeconds;
    
    // Keep scroll value within a manageable range to avoid precision issues
    if (scroll.value > totalWidth) scroll.value -= singleSetWidth;
    if (scroll.value < -totalWidth) scroll.value += singleSetWidth;
  });

  const gesture = Gesture.Pan()
    .onBegin(() => {
      scrollSpeed.value = 0;
    })
    .onChange((event) => {
      scroll.value = scroll.value - event.changeX;
    })
    .onFinalize((event) => {
      scrollSpeed.value = -event.velocityX;
      // Smoothly return to auto-scroll speed
      scrollSpeed.value = withTiming(50, { duration: 1500, easing: Easing.out(Easing.quad) });
    });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        {tripledItems.map((item, index) => (
          <MarqueeItem
            key={`${item?.id ?? index}-${index}`}
            index={index}
            scroll={scroll}
            itemWidth={itemWidth}
            totalWidth={totalWidth}>
            {renderItem({ item, index: index % items.length })}
          </MarqueeItem>
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    flexDirection: 'row',
  },
  marqueeItem: {
    position: 'absolute',
    height: '100%',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

