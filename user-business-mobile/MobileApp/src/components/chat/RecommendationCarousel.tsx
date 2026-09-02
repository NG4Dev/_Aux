import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import type { ProductCard } from '@/services/aiChat';

type Props = {
  preamble?: string;
  answer: string;
  items: ProductCard[];
  chips: string[];
  followUps: string[];
  onChipPress?: (chip: string) => void;
  onFollowUpPress?: (text: string) => void;
  onCardPress?: (item: ProductCard) => void;
};

export default function RecommendationCarousel({
  preamble,
  answer,
  items,
  chips,
  followUps,
  onChipPress,
  onFollowUpPress,
  onCardPress,
}: Props) {
  return (
    <View style={styles.wrap}>
      {preamble ? <Text style={styles.preamble}>{preamble}</Text> : null}
      <Text style={styles.answer}>{answer}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.productId}
            style={styles.card}
            onPress={() => onCardPress?.(item)}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {item.priceCents != null ? (
              <Text style={styles.price}>R{(item.priceCents / 100).toFixed(0)}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={styles.chip}
            onPress={() => onChipPress?.(chip)}
          >
            <Text style={styles.chipText}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {followUps.map((fu) => (
          <TouchableOpacity
            key={fu}
            style={styles.followUp}
            onPress={() => onFollowUpPress?.(fu)}
          >
            <Text style={styles.followUpText}>{fu}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8, paddingHorizontal: 4 },
  preamble: { color: '#9ca3af', marginBottom: 6, fontSize: 13 },
  answer: { color: '#fff', marginBottom: 10, lineHeight: 20 },
  carousel: { marginBottom: 10 },
  card: {
    width: 140,
    marginRight: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: { width: 140, height: 100 },
  imagePlaceholder: { backgroundColor: '#333' },
  cardTitle: { color: '#fff', fontSize: 13, padding: 8, fontWeight: '600' },
  price: { color: '#93c5fd', fontSize: 12, paddingHorizontal: 8, paddingBottom: 8 },
  chipsRow: { marginBottom: 8 },
  chip: {
    backgroundColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  chipText: { color: '#e5e7eb', fontSize: 12 },
  followUp: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
  },
  followUpText: { color: '#93c5fd', fontSize: 12 },
});
