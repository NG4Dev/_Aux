import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type OverlayHeaderChromeProps = {
  children: React.ReactNode;
  paddingTop: number;
  style?: ViewStyle;
  absolute?: boolean;
};

export default function OverlayHeaderChrome({
  children,
  paddingTop,
  style,
  absolute = false,
}: OverlayHeaderChromeProps) {
  return (
    <View
      style={[
        styles.wrap,
        absolute && styles.absolute,
        { paddingTop },
        style,
      ]}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.45)', 'transparent']}
        locations={[0, 0.6, 1]}
        style={styles.scrim}
        pointerEvents="none"
      />
      <View style={styles.row} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 70,
    elevation: 20,
    renderToHardwareTextureAndroid: true,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 140,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  centerSlot: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
});
