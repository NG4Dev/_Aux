import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import type { ProductCard } from '@/services/aiChat';

type Props = {
  visible: boolean;
  preamble: string;
  candidates: ProductCard[];
  onConfirm: (approvedChunkIds: string[], approvedProductIds: string[]) => void;
  onCancel: () => void;
};

export default function SourceApprovalSheet({
  visible,
  preamble,
  candidates,
  onConfirm,
  onCancel,
}: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const approved = useMemo(() => {
    const chunkIds: string[] = [];
    const productIds: string[] = [];
    for (const c of candidates) {
      const key = c.chunkId ?? c.productId;
      if (!selected[key]) continue;
      if (c.chunkId) chunkIds.push(c.chunkId);
      productIds.push(c.productId);
    }
    return { chunkIds, productIds };
  }, [candidates, selected]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Review sources</Text>
          <Text style={styles.preamble}>{preamble}</Text>
          <ScrollView style={styles.list}>
            {candidates.map((c) => {
              const key = c.chunkId ?? c.productId;
              const checked = !!selected[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.row, checked && styles.rowSelected]}
                  onPress={() => toggle(key)}
                >
                  {c.imageUrl ? (
                    <Image source={{ uri: c.imageUrl }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]} />
                  )}
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{c.title}</Text>
                    {c.subtitle ? (
                      <Text style={styles.rowSubtitle}>{c.subtitle}</Text>
                    ) : null}
                    {c.description ? (
                      <Text style={styles.rowDesc} numberOfLines={2}>
                        {c.description}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.checkbox}>{checked ? '☑' : '☐'}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                approved.productIds.length === 0 && styles.confirmDisabled,
              ]}
              disabled={approved.productIds.length === 0}
              onPress={() => onConfirm(approved.chunkIds, approved.productIds)}
            >
              <Text style={styles.confirmText}>Confirm selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    padding: 16,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  preamble: { color: '#ccc', marginBottom: 12 },
  list: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
  },
  rowSelected: { borderWidth: 1, borderColor: '#4ade80' },
  thumb: { width: 48, height: 48, borderRadius: 8, marginRight: 10 },
  thumbPlaceholder: { backgroundColor: '#333' },
  rowText: { flex: 1 },
  rowTitle: { color: '#fff', fontWeight: '600' },
  rowSubtitle: { color: '#9ca3af', fontSize: 12 },
  rowDesc: { color: '#d1d5db', fontSize: 12, marginTop: 2 },
  checkbox: { color: '#fff', fontSize: 18, marginLeft: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#222',
    alignItems: 'center',
  },
  cancelText: { color: '#fff' },
  confirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  confirmDisabled: { opacity: 0.4 },
  confirmText: { color: '#fff', fontWeight: '600' },
});
