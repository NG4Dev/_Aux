import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useNavigation } from 'expo-router';

type Options = {
  headerHeight: number;
  /**
   * Threshold in px below which the header always re-opens (snaps to fully expanded).
   * Defaults to 10.
   */
  openThreshold?: number;
  /**
   * Whether to also toggle the parent tab bar visibility. Defaults to true.
   */
  toggleTabBar?: boolean;
};

type ScrollEvent = { nativeEvent: { contentOffset: { y: number } } };

/**
 * Mirrors the scroll-hide pattern from `discover/[category].tsx`:
 * - Snap-open at small offsets
 * - Collapse on downward scroll
 * - Re-open on upward scroll
 * - Optionally hide/show the parent tab bar in lockstep
 */
export function useCollapsibleHeader({
  headerHeight,
  openThreshold = 10,
  toggleTabBar = true,
}: Options) {
  const navigation = useNavigation();
  const parentNav = navigation.getParent();

  const [headerVisible, setHeaderVisible] = useState(true);
  const animatedHeight = useRef(new RNAnimated.Value(headerHeight)).current;
  const lastOffset = useRef(0);

  const setTabBarVisible = useCallback(
    (visible: boolean) => {
      if (!toggleTabBar) return;
      parentNav?.setOptions({
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute' as const,
          bottom: visible ? 0 : -100,
          left: 0,
          right: 0,
          elevation: 0,
          shadowOpacity: 0,
          borderTopWidth: 0,
        },
      });
    },
    [parentNav, toggleTabBar],
  );

  useEffect(() => {
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  const animateTo = useCallback(
    (toValue: number) => {
      RNAnimated.timing(animatedHeight, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }).start();
    },
    [animatedHeight],
  );

  const onScroll = useCallback(
    (event: ScrollEvent) => {
      const currentOffset = event.nativeEvent.contentOffset.y;

      if (currentOffset <= openThreshold) {
        animateTo(headerHeight);
        setHeaderVisible(true);
        setTabBarVisible(true);
        lastOffset.current = currentOffset;
        return;
      }

      if (currentOffset > lastOffset.current && headerVisible) {
        animateTo(0);
        setHeaderVisible(false);
        setTabBarVisible(false);
      } else if (currentOffset < lastOffset.current && !headerVisible) {
        animateTo(headerHeight);
        setHeaderVisible(true);
        setTabBarVisible(true);
      }

      lastOffset.current = currentOffset;
    },
    [animateTo, headerHeight, headerVisible, openThreshold, setTabBarVisible],
  );

  return {
    animatedHeight,
    onScroll,
    headerVisible,
    setTabBarVisible,
  };
}
