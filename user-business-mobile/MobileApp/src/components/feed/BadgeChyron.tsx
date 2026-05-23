import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated } from 'react-native';
import type { ContentBadge } from '@/types/content';

type BadgeChyronProps = {
  badge?: ContentBadge;
  chyron?: string;
};

export default function BadgeChyron({ badge, chyron }: BadgeChyronProps) {
  const scrollX = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!chyron) return;
    const anim = RNAnimated.loop(
      RNAnimated.timing(scrollX, {
        toValue: -600,
        duration: 12000,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [chyron, scrollX]);

  if (!badge && !chyron) return null;

  return (
    <View style={styles.container}>
      {chyron && (
        <View style={styles.chyronTrack}>
          <RNAnimated.Text
            style={[styles.chyronText, { transform: [{ translateX: scrollX }] }]}
            numberOfLines={1}
          >
            {chyron}    {'   '}    {chyron}
          </RNAnimated.Text>
        </View>
      )}
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  chyronTrack: {
    flex: 1,
    overflow: 'hidden',
    height: 20,
    justifyContent: 'center',
  },
  chyronText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    width: 1200,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
