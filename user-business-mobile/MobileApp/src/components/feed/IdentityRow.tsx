import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ContentStatus } from '@/types/content';

type IdentityRowProps = {
  avatarUri: string;
  name: string;
  subtitle?: string;
  verified?: boolean;
  status?: ContentStatus;
  onPress?: () => void;
};

const STATUS_LABELS: Record<ContentStatus, { label: string; color: string }> = {
  open: { label: 'OPEN', color: '#00E676' },
  closed: { label: 'CLOSED', color: '#F44336' },
  upcoming: { label: 'UPCOMING', color: '#FF9100' },
  live: { label: 'LIVE', color: '#E91E63' },
};

export default function IdentityRow({
  avatarUri,
  name,
  subtitle,
  verified,
  status,
  onPress,
}: IdentityRowProps) {
  const statusMeta = status ? STATUS_LABELS[status] : null;

  const content = (
    <>
      <Image source={{ uri: avatarUri }} style={styles.avatar} />
      <View style={styles.textBlock}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {verified && (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color="#00BFA5"
              style={styles.badge}
            />
          )}
          {statusMeta && (
            <Text style={[styles.status, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          )}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={styles.container}
        onPress={onPress}
        hitSlop={6}
        android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#222',
  },
  textBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    marginLeft: 2,
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 1,
  },
});
