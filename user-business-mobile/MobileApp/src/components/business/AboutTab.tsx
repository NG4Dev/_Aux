import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Business } from '@/types/business';
import TabEmptyState from './TabEmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_WIDTH = SCREEN_WIDTH - 32;
const MAP_HEIGHT = 180;

type Props = {
  business: Business;
  contentPaddingTop: number;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

export default function AboutTab({
  business,
  contentPaddingTop,
  onScroll,
}: Props) {
  const hasDescription = business.description.trim().length > 0;
  const hasLinks = Boolean(
    business.links?.instagram || business.links?.website,
  );
  const hasLocation = business.locationGiven && business.location;

  const completelyEmpty = !hasDescription && !hasLinks && !hasLocation;

  if (completelyEmpty) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.empty,
          { paddingTop: contentPaddingTop },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <TabEmptyState
          title="No details available"
          subtitle="This profile hasn't shared any details about themself."
        />
      </ScrollView>
    );
  }

  const openInstagram = () => {
    if (business.links?.instagram) {
      Linking.openURL(`https://instagram.com/${business.links.instagram}`);
    }
  };

  const openWebsite = () => {
    if (business.links?.website) {
      Linking.openURL(`https://${business.links.website}`);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: contentPaddingTop, paddingBottom: 140 },
      ]}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {hasDescription && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.body}>{business.description}</Text>
        </View>
      )}

      {hasLinks && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Links</Text>
          {business.links?.instagram && (
            <TouchableOpacity style={styles.linkRow} onPress={openInstagram}>
              <Ionicons name="logo-instagram" size={18} color="#fff" />
              <Text style={styles.linkText}>@{business.links.instagram}</Text>
            </TouchableOpacity>
          )}
          {business.links?.website && (
            <TouchableOpacity style={styles.linkRow} onPress={openWebsite}>
              <Ionicons name="globe-outline" size={18} color="#fff" />
              <Text style={styles.linkText}>{business.links.website}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {hasLocation && business.location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapPlaceholder}>
            <Ionicons
              name="location"
              size={24}
              color="#E94E77"
            />
            <Text style={styles.mapAddress}>{business.location.address}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingHorizontal: 16,
    gap: 24,
  },
  empty: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  linkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mapPlaceholder: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    borderRadius: 8,
    backgroundColor: '#0a1a2a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapAddress: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
});
