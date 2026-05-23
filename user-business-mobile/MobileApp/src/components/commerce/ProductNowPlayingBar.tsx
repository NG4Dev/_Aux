import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

type ProductNowPlayingBarProps = {
  imageUrl?: string | null;
  productName: string;
  merchantName: string;
};

export default function ProductNowPlayingBar({
  imageUrl,
  productName,
  merchantName,
}: ProductNowPlayingBarProps) {
  return (
    <View style={styles.container}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]} />
      )}
      <View style={styles.textCol}>
        <Text style={styles.productName} numberOfLines={1}>
          {productName}
        </Text>
        <Text style={styles.merchantName} numberOfLines={1}>
          {merchantName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  thumbPlaceholder: {
    backgroundColor: '#333',
  },
  textCol: { flex: 1 },
  productName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  merchantName: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginTop: 2,
  },
});
