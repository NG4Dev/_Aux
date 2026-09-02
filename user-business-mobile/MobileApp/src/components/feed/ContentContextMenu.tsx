import React from 'react';
import { Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuView } from '@react-native-menu/menu';

type ContentContextMenuProps = {
  onShare?: () => void;
  onSave?: () => void;
  onReport?: () => void;
};

export default function ContentContextMenu({
  onShare,
  onSave,
  onReport,
}: ContentContextMenuProps) {
  return (
    <MenuView
      title="Content actions"
      shouldOpenOnLongPress={false}
      actions={[
        {
          id: 'share',
          title: 'Share',
          image: Platform.select({ ios: 'square.and.arrow.up', android: 'share' }),
        },
        {
          id: 'save',
          title: 'Save',
          image: Platform.select({ ios: 'bookmark', android: 'bookmark_border' }),
        },
        {
          id: 'report',
          title: 'Report',
          image: Platform.select({ ios: 'flag', android: 'flag' }),
          attributes: { destructive: true },
        },
      ]}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'share') onShare?.();
        if (nativeEvent.event === 'save') onSave?.();
        if (nativeEvent.event === 'report') onReport?.();
      }}
    >
      <TouchableOpacity style={styles.trigger}>
        <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
      </TouchableOpacity>
    </MenuView>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
