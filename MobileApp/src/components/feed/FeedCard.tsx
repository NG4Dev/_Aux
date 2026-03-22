import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ContentItem } from '@/types/content';
import IdentityRow from './IdentityRow';
import BadgeChyron from './BadgeChyron';
import CategoryChips from './CategoryChips';
import ContentContextMenu from './ContentContextMenu';

type FeedCardProps = {
  item: ContentItem;
  height: number;
};

export default function FeedCard({ item, height }: FeedCardProps) {
  const heroMedia = item.media[0];

  return (
    <View style={[styles.card, { height }]}>
      {heroMedia && (
        <Image
          source={{ uri: heroMedia.uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
      />

      {item.badge && (
        <View style={styles.badgeFloat}>
          <View style={[styles.badgePill, { backgroundColor: item.badge.color }]}>
            <Text style={styles.badgeText}>{item.badge.label}</Text>
          </View>
        </View>
      )}

      <View style={styles.bottomSection}>
        {item.chyron && (
          <BadgeChyron chyron={item.chyron} />
        )}

        <View style={styles.identitySection}>
          <View style={styles.identityLeft}>
            <IdentityRow
              avatarUri={item.profileAvatar}
              name={item.profileName}
              subtitle={item.subtitle}
              verified={item.verified}
              status={item.status}
            />
          </View>
          <ContentContextMenu />
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        <CategoryChips categories={item.categories} variant="tag" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#111',
    justifyContent: 'flex-end',
  },
  badgeFloat: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomSection: {
    padding: 16,
    gap: 10,
  },
  identitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityLeft: {
    flex: 1,
  },
  description: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 18,
  },
});
