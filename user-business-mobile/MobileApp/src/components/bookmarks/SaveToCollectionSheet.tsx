import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  selectCollectionsForLocation,
  useBookmarksStore,
} from '@/features/bookmarks/bookmarksStore';
import type { ContentItem } from '@/types/content';

type SaveToCollectionSheetProps = {
  item: ContentItem | null;
  onClose: () => void;
};

export default function SaveToCollectionSheet({
  item,
  onClose,
}: SaveToCollectionSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const collections = useBookmarksStore((s) => s.collections);
  const activeLocation = useBookmarksStore((s) => s.activeLocation);
  const addItemToCollection = useBookmarksStore((s) => s.addItemToCollection);
  const removeItemFromCollection = useBookmarksStore(
    (s) => s.removeItemFromCollection,
  );

  const visible = item !== null;

  const visibleCollections = useMemo(
    () => selectCollectionsForLocation(collections, activeLocation),
    [collections, activeLocation],
  );

  const initiallySelected = useMemo(() => {
    if (!item) return new Set<string>();
    return new Set(
      visibleCollections
        .filter((c) => c.itemIds.includes(item.id))
        .map((c) => c.id),
    );
  }, [item, visibleCollections]);

  const [selected, setSelected] = useState<Set<string>>(initiallySelected);

  useEffect(() => {
    setSelected(initiallySelected);
  }, [initiallySelected]);

  const toggle = (collectionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });
  };

  const handleSave = () => {
    if (!item) return;
    visibleCollections.forEach((c) => {
      const wasSelected = initiallySelected.has(c.id);
      const isSelected = selected.has(c.id);
      if (isSelected && !wasSelected) addItemToCollection(c.id, item.id);
      if (!isSelected && wasSelected) removeItemFromCollection(c.id, item.id);
    });
    onClose();
  };

  const handleCreateNew = () => {
    onClose();
    router.push('/(tabs)/library/create-collection');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Save to collection</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={22}
                color="rgba(255,255,255,0.6)"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {activeLocation} · {visibleCollections.length}{' '}
            {visibleCollections.length === 1 ? 'collection' : 'collections'}
          </Text>

          <ScrollView style={styles.list} contentContainerStyle={{ gap: 4 }}>
            {visibleCollections.map((c) => {
              const isOn = selected.has(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.row}
                  onPress={() => toggle(c.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowThumb} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {c.itemIds.length}{' '}
                      {c.itemIds.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  <View
                    style={[styles.checkbox, isOn && styles.checkboxOn]}
                  >
                    {isOn && (
                      <Ionicons name="checkmark" size={16} color="#000" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.createRow}
              onPress={handleCreateNew}
              activeOpacity={0.7}
            >
              <View style={styles.createIcon}>
                <Ionicons name="add" size={20} color="#fff" />
              </View>
              <Text style={styles.createText}>Create new collection</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
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
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  list: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#E94E77',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  rowSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOn: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  createIcon: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
  },
  saveText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
});
