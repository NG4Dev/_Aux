import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSegments } from 'expo-router';
import ChatScreenContent from '@/components/chat/ChatScreenContent';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
  onSwipeChange?: (index: number) => void;
}

export default function SwipeChatContainer({ children, onSwipeChange }: Props) {
  const segments = useSegments();
  const isHome = segments[segments.length - 1] === 'home';
  const translateX = useSharedValue(0);
  const context = useSharedValue({ x: 0 });

  useEffect(() => {
    if (!isHome) {
      translateX.value = 0;
    }
  }, [isHome, translateX]);

  const gesture = Gesture.Pan()
    .enabled(isHome || translateX.value > 0)
    .activeOffsetX([-20, 20])
    .failOffsetY([-12, 12])
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      let nextX = context.value.x + event.translationX;
      if (nextX < 0) nextX = 0;
      if (nextX > SCREEN_WIDTH) nextX = SCREEN_WIDTH;
      translateX.value = nextX;
    })
    .onEnd((event) => {
      const isShowingChat = context.value.x >= SCREEN_WIDTH;
      const threshold = isShowingChat ? SCREEN_WIDTH * 0.6 : SCREEN_WIDTH / 3;

      if (event.velocityX > 400 || translateX.value > threshold) {
        translateX.value = withSpring(SCREEN_WIDTH, {
          damping: 28,
          stiffness: 320,
          mass: 0.8,
          overshootClamping: true,
        });
        if (onSwipeChange) runOnJS(onSwipeChange)(0);
      } else if (event.velocityX < -400 || translateX.value < threshold) {
        translateX.value = withSpring(0, {
          damping: 28,
          stiffness: 320,
          mass: 0.8,
          overshootClamping: true,
        });
        if (onSwipeChange) runOnJS(onSwipeChange)(1);
      } else {
        const snapTo = translateX.value > SCREEN_WIDTH / 2 ? SCREEN_WIDTH : 0;
        translateX.value = withSpring(snapTo, {
          damping: 28,
          stiffness: 320,
          mass: 0.8,
          overshootClamping: true,
        });
        if (onSwipeChange) runOnJS(onSwipeChange)(snapTo === 0 ? 1 : 0);
      }
    });

  const mainStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - SCREEN_WIDTH }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <Animated.View style={[styles.page, leftStyle]}>
          <ChatScreenContent />
        </Animated.View>

        <Animated.View style={[styles.page, mainStyle]}>
          <View style={styles.mainContent}>{children}</View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  page: {
    ...StyleSheet.absoluteFill,
    width: SCREEN_WIDTH,
  },
  mainContent: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
