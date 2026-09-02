import { useEffect, useRef, useState } from 'react';
import { Keyboard, LayoutAnimation, Platform } from 'react-native';
import { useNavigation } from 'expo-router';

/** Keyboard height with LayoutAnimation disabled during stack transitions. */
export function useAuthKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isTransitioningRef = useRef(false);
  const navigation = useNavigation();

  useEffect(() => {
    const onStart = navigation.addListener('transitionStart' as never, () => {
      isTransitioningRef.current = true;
    });
    const onEnd = navigation.addListener('transitionEnd' as never, () => {
      isTransitioningRef.current = false;
    });
    return () => {
      onStart();
      onEnd();
    };
  }, [navigation]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      if (!isTransitioningRef.current) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      if (!isTransitioningRef.current) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardHeight;
}
