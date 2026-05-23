import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import SwipeChatContainer from '@/components/chat/SwipeChatContainer';

type IconProps = {
  color: string;
  size: number;
  focused: boolean;
};

const TabsLayout = () => {
  return (
    <SwipeChatContainer>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: 'gray',
          tabBarBackground: () => (
            <BlurView
              style={styles.blurBackground}
              intensity={50}
              tint="dark"
              blurReductionFactor={3}
            />
          ),
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
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
        {/* Chat screen hidden from Tabs as it's now in the SwipeContainer */}
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
      </Tabs>
    </SwipeChatContainer>
  );
};

export default TabsLayout;

const styles = StyleSheet.create({
  blurBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  },
  tabLabel: {
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
});
