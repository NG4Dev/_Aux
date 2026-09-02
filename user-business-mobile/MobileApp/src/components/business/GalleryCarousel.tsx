import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import type { MediaItem } from '@/types/content';

const CARD_WIDTH = 250;
const CARD_HEIGHT = 150;
const CARD_GAP = 12;

type Props = {
  title: string;
  photos: MediaItem[];
};

export default function GalleryCarousel({ title, photos }: Props) {
  if (photos.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        contentContainerStyle={styles.scroll}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
      >
        {photos.map((photo, idx) => (
          <Image
            key={`${photo.uri}-${idx}`}
            source={{ uri: photo.uri }}
            style={styles.image}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    color: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    gap: CARD_GAP,
    paddingHorizontal: 16,
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    backgroundColor: '#222',
  },
});
