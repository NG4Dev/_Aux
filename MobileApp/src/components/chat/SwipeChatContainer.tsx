import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  useDerivedValue
} from 'react-native-reanimated';
import { useSegments } from 'expo-router';
import ChatScreenContent from '@/components/chat/ChatScreenContent';

const { width } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
  onSwipeChange?: (index: number) => void;
}

export default function SwipeChatContainer({ children, onSwipeChange }: Props) {
  const segments = useSegments();
  const isHome = segments[segments.length - 1] === 'home';
  const translateX = useSharedValue(0);
  const context = useSharedValue({ x: 0 });

  const gesture = Gesture.Pan()
    .enabled(isHome || translateX.value > 0)
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      let nextX = context.value.x + event.translationX;
      if (nextX < 0) nextX = 0;
      if (nextX > width) nextX = width;
      translateX.value = nextX;
    })
    .onEnd((event) => {
      const threshold = width / 3;
      if (event.velocityX > 500 || translateX.value > threshold) {
        translateX.value = withSpring(width, { damping: 100, stiffness: 400, overshootClamping: true });
        if (onSwipeChange) runOnJS(onSwipeChange)(0);
      } else {
        translateX.value = withSpring(0, { damping: 100, stiffness: 400, overshootClamping: true });
        if (onSwipeChange) runOnJS(onSwipeChange)(1);
      }
    });

  const mainStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const leftStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value - width }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.container}>
        {/* Page 0: Chat (on the left) */}
        <Animated.View key="chat-page" style={[styles.page, leftStyle]}>
          <ChatScreenContent />
        </Animated.View>

        {/* Page 1: Main App (on the right/default) */}
        <Animated.View key="main-page" style={[styles.page, mainStyle]}>
          {children}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: '100%',
  },
});
