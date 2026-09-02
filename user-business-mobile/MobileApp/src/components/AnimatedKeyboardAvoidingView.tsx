// components/AnimatedKeyboardAvoidingView.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Keyboard, Platform, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  // Optional vertical offset (e.g. header height if needed)
  keyboardVerticalOffset?: number;
}

export default function AnimatedKeyboardAvoidingView({
  children,
  style,
  keyboardVerticalOffset = 0,
}: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const onKeyboardShow = (event: any) => {
      const keyboardHeight = event.endCoordinates.height;
      // Adjust the translation: subtract safe-area bottom insets and add any extra offset
      const offset = keyboardHeight - insets.bottom - keyboardVerticalOffset;
      Animated.timing(translateY, {
        toValue: -offset,
        duration: Platform.OS === 'ios' ? event.duration : 250,
        useNativeDriver: true,
      }).start();
    };

    const onKeyboardHide = (event: any) => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? event.duration : 250,
        useNativeDriver: true,
      }).start();
    };

    const showSubscription = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    const hideSubscription = Keyboard.addListener('keyboardDidHide', onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardVerticalOffset, insets.bottom, translateY]);

  return (
    <Animated.View style={[styles.container, style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
