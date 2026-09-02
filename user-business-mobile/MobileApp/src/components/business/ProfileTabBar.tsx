import React, { useCallback, useRef } from 'react';
import {
  Animated as RNAnimated,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type TabMeasurement = { x: number; width: number };

type Props = {
  tabs: readonly string[];
  active: string;
  onSelect: (tab: string) => void;
};

export const PROFILE_TAB_BAR_HEIGHT = 48;

export default function ProfileTabBar({ tabs, active, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const measurements = useRef<TabMeasurement[]>([]);
  const underlineX = useRef(new RNAnimated.Value(0)).current;
  const underlineW = useRef(new RNAnimated.Value(0)).current;

  const handleLayout = useCallback(
    (index: number, e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      measurements.current[index] = { x, width };
      if (tabs[index] === active) {
        underlineX.setValue(x);
        underlineW.setValue(width);
      }
    },
    [active, tabs, underlineX, underlineW],
  );

  const handlePress = useCallback(
    (tab: string) => {
      onSelect(tab);
      const idx = tabs.indexOf(tab);
      const m = measurements.current[idx];
      if (m) {
        RNAnimated.parallel([
          RNAnimated.timing(underlineX, {
            toValue: m.x,
            duration: 250,
            useNativeDriver: false,
          }),
          RNAnimated.timing(underlineW, {
            toValue: m.width,
            duration: 250,
            useNativeDriver: false,
          }),
        ]).start();
        scrollRef.current?.scrollTo({
          x: Math.max(0, m.x - 32),
          animated: true,
        });
      }
    },
    [onSelect, tabs, underlineX, underlineW],
  );

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {tabs.map((tab, index) => {
          const isActive = tab === active;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => handlePress(tab)}
              onLayout={(e) => handleLayout(index, e)}
              style={styles.item}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
        <RNAnimated.View
          style={[
            styles.underline,
            { left: underlineX, width: underlineW },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: PROFILE_TAB_BAR_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  scroll: {
    paddingHorizontal: 16,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  label: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#fff',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
});
