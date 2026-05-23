import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOOKMARK_LOCATIONS } from '@/data/mockFeed';
import { useBookmarksStore } from '@/features/bookmarks/bookmarksStore';

export default function CreateCollection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeLocation = useBookmarksStore((s) => s.activeLocation);
  const createCollection = useBookmarksStore((s) => s.createCollection);

  const [name, setName] = useState('');
  const [location, setLocation] = useState<string>(activeLocation);

  const canSubmit = name.trim().length > 0;

  const handleCreate = () => {
    if (!canSubmit) return;
    createCollection({ name, location });
    router.back();
  };

  return (
    <Pressable style={styles.backdrop} onPress={() => router.back()}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
        pointerEvents="box-none"
      >
        <Pressable
          style={[styles.card, { marginBottom: insets.bottom + 24 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Create a collection</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Restaurants, Things to do"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            selectionColor="#00BFA5"
            maxLength={40}
          />

          <Text style={styles.label}>Location</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locationRow}
          >
            {BOOKMARK_LOCATIONS.map((loc) => {
              const active = loc === location;
              return (
                <TouchableOpacity
                  key={loc}
                  onPress={() => setLocation(loc)}
                  style={[
                    styles.locChip,
                    active && styles.locChipActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="location"
                    size={12}
                    color={active ? '#000' : 'rgba(255,255,255,0.7)'}
                  />
                  <Text
                    style={[
                      styles.locChipText,
                      active && styles.locChipTextActive,
                    ]}
                  >
                    {loc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, !canSubmit && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.createText,
                  !canSubmit && styles.createTextDisabled,
                ]}
              >
                Create
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  kav: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#111',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  locationRow: {
    gap: 8,
    paddingVertical: 4,
  },
  locChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  locChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  locChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  locChipTextActive: {
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '700',
  },
  createBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  createBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  createText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  createTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
});
