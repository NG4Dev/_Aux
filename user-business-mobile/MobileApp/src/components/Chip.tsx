import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  interpolateColor,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Chip({ label, selected, onPress }: ChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selected ? 1 : 0,
      [0, 1],
      ['rgba(255, 255, 255, 0.05)', '#2196F3']
    );

    return {
      backgroundColor,
      transform: [{ scale: scale.value }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      selected ? 1 : 0,
      [0, 1],
      ['rgba(255, 255, 255, 0.8)', '#ffffff']
    );

    return { color };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.chip, animatedStyle]}
    >
      <Text style={[styles.label, { color: selected ? '#fff' : 'rgba(255,255,255,0.8)' }]}>{label}</Text>
      <View style={styles.iconContainer}>
        {selected ? (
          <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
        ) : (
          <MaterialCommunityIcons name="plus" size={16} color="rgba(255, 255, 255, 0.4)" />
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    marginLeft: 6,
  },
});
