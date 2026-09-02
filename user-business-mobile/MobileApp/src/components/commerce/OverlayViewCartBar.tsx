import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type OverlayViewCartBarProps = {
  visible: boolean;
  itemCount: number;
  bottomInset: number;
  onPress: () => void;
};

export default function OverlayViewCartBar({
  visible,
  itemCount,
  bottomInset,
  onPress,
}: OverlayViewCartBarProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && itemCount > 0) {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, itemCount, opacity]);

  if (itemCount <= 0) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.wrap,
        {
          bottom: bottomInset + 12,
          opacity,
        },
      ]}
    >
      <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.9}>
        <Ionicons name="cart" size={18} color="#fff" />
        <Text style={styles.label}>View cart • {itemCount}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 130,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
