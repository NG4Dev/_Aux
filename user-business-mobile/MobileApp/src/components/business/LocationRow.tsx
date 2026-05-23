import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessLocation } from '@/types/business';

type Props = {
  location: BusinessLocation | null;
  locationGiven: boolean;
};

export default function LocationRow({ location, locationGiven }: Props) {
  if (location && locationGiven) {
    return (
      <View style={styles.row}>
        <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.7)" />
        <Text style={styles.text} numberOfLines={1}>
          {location.address}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.4)" />
      <Text style={styles.placeholder}>Location (if given in onboarding)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  placeholder: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
