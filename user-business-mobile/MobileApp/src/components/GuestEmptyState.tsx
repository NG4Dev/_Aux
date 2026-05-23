import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GuestAuthSheet from './GuestAuthSheet';

type GuestEmptyStateProps = {
  feature: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
};

export default function GuestEmptyState({
  feature,
  icon,
  description,
}: GuestEmptyStateProps) {
  const insets = useSafeAreaInsets();
  const [showSheet, setShowSheet] = useState(true);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>{feature}</Text>
        <TouchableOpacity
          style={styles.loginPill}
          onPress={() => setShowSheet(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.loginPillText}>Log in</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={40} color="rgba(255,255,255,0.15)" />
        </View>
        <Text style={styles.heading}>{feature}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {showSheet && <GuestAuthSheet onDismiss={() => setShowSheet(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  loginPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  loginPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
    paddingBottom: 80,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
