import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type ProductSegmentedControlProps = {
  activeTab: 'product' | 'menu';
  onChange: (tab: 'product' | 'menu') => void;
};

export default function ProductSegmentedControl({
  activeTab,
  onChange,
}: ProductSegmentedControlProps) {
  return (
    <View style={styles.container}>
      {(['product', 'menu'] as const).map((tab) => {
        const active = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab === 'product' ? 'Product' : 'Menu'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  label: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  labelActive: {
    color: '#fff',
  },
});
