import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import {
  INLINE_FADE_OUT_END,
  INLINE_FADE_OUT_START,
  inlineThumbPeekOpacity,
  expandProgressFromSheet,
} from '@/components/commerce/menuTransitionTokens';

type MenuInlinePlayerBarProps = {
  productName: string;
  merchantName: string;
  imageUrl?: string | null;
  merchantAvatar?: string | null;
  sheetTranslateY: SharedValue<number>;
  collapsedOffsetSV: SharedValue<number>;
  onPress?: () => void;
};

export default function MenuInlinePlayerBar({
  productName,
  merchantName,
  imageUrl,
  merchantAvatar,
  sheetTranslateY,
  collapsedOffsetSV,
  onPress,
}: MenuInlinePlayerBarProps) {
  const barStyle = useAnimatedStyle(() => {
    const expandProgress = expandProgressFromSheet(
      sheetTranslateY.value,
      collapsedOffsetSV.value,
    );
    const opacity = interpolate(
      expandProgress,
      [INLINE_FADE_OUT_START, INLINE_FADE_OUT_END],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity,
      pointerEvents: opacity > 0.05 ? ('auto' as const) : ('none' as const),
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const expandProgress = expandProgressFromSheet(
      sheetTranslateY.value,
      collapsedOffsetSV.value,
    );
    return { opacity: inlineThumbPeekOpacity(expandProgress) };
  });

  const inner = (
    <View style={styles.inner}>
      <Animated.View style={[styles.thumb, thumbStyle]}>
        {imageUrl ? (
          <DynamicMediaRenderer
            media={{
              uri: imageUrl,
              type: 'image',
              width: 36,
              height: 36,
              aspect: 'square',
            }}
            mode="heroCover"
            maxHeight={36}
            contentWidth={36}
            borderRadius={6}
          />
        ) : null}
      </Animated.View>
      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1}>
          {productName}
        </Text>
        <View style={styles.merchantRow}>
          {merchantAvatar ? (
            <DynamicMediaRenderer
              media={{
                uri: merchantAvatar,
                type: 'image',
                width: 16,
                height: 16,
                aspect: 'square',
              }}
              mode="heroCover"
              maxHeight={16}
              contentWidth={16}
              borderRadius={8}
            />
          ) : null}
          <Text style={styles.merchantName} numberOfLines={1}>
            {merchantName}
          </Text>
          <Ionicons name="checkmark-circle" size={12} color={Colors.primary} />
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.bar, barStyle]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          style={styles.pressable}
          accessibilityRole="button"
          accessibilityLabel="Collapse menu queue"
        >
          {inner}
        </Pressable>
      ) : (
        inner
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  pressable: {
    flex: 1,
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    overflow: 'hidden',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  merchantName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '70%',
  },
});
