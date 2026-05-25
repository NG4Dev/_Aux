import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import SwipeChatContainer from '@/components/chat/SwipeChatContainer';

type IconProps = {
  color: string;
  size: number;
  focused: boolean;
};

function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        style={styles.blurBackground}
        intensity={50}
        tint="dark"
        blurReductionFactor={3}
      />
    );
  }
  return <View style={styles.androidTabBarBackground} />;
}

function shouldHideTabBar(segments: string[]): boolean {
  if (segments.includes('cart')) return true;
  const businessIndex = segments.indexOf('business');
  if (businessIndex === -1) return false;
  const afterBusinessId = segments.slice(businessIndex + 2);
  return afterBusinessId[0] === 'cart' || afterBusinessId[0] === 'checkout';
}

const hiddenTabBarStyle = { display: 'none' } as const;

const TabsLayout = () => {
  const segments = useSegments();
  const hideTabBar = useMemo(
    () => shouldHideTabBar(segments as string[]),
    [segments],
  );
  const tabBarStyle = useMemo(
    () => (hideTabBar ? hiddenTabBarStyle : styles.tabBar),
    [hideTabBar],
  );

  return (
    <SwipeChatContainer>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: 'gray',
          tabBarBackground: () => <TabBarBackground />,
          tabBarStyle,
          tabBarLabelStyle: styles.tabLabel,
          sceneStyle: styles.scene,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }: IconProps) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, size, focused }: IconProps) => (
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="business"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, size, focused }: IconProps) => (
              <Ionicons
                name={focused ? 'bookmark' : 'bookmark-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="pay"
          options={{
            title: 'Pay',
            tabBarIcon: ({ color, size, focused }: IconProps) => (
              <Ionicons
                name={focused ? 'card' : 'card-outline'}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </SwipeChatContainer>
  );
};

export default TabsLayout;

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: '#000',
  },
  blurBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  androidTabBarBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  tabBar: {
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  tabLabel: {
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
});
