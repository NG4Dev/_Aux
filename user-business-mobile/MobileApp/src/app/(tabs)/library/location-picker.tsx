import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOOKMARK_LOCATIONS } from '@/data/mockFeed';
import { useBookmarksStore } from '@/features/bookmarks/bookmarksStore';

export default function LocationPicker() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeLocation = useBookmarksStore((s) => s.activeLocation);
  const setActiveLocation = useBookmarksStore((s) => s.setActiveLocation);

  const handleSelect = (location: string) => {
    setActiveLocation(location);
    router.back();
  };

  return (
    <Pressable style={styles.backdrop} onPress={() => router.back()}>
      <Pressable
        style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
        onPress={(e) => e.stopPropagation()}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>Choose location</Text>
        <View style={styles.list}>
          {BOOKMARK_LOCATIONS.map((loc) => {
            const active = loc === activeLocation;
            return (
              <TouchableOpacity
                key={loc}
                style={styles.row}
                onPress={() => handleSelect(loc)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={active ? '#fff' : 'rgba(255,255,255,0.5)'}
                />
                <Text style={[styles.rowText, active && styles.rowTextActive]}>
                  {loc}
                </Text>
                {active && (
                  <Ionicons name="checkmark" size={20} color="#00BFA5" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  list: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  rowText: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  rowTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
