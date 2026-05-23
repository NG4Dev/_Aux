import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DropdownMenu from 'zeego/dropdown-menu';

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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <TouchableOpacity style={styles.trigger}>
          <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
        </TouchableOpacity>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item key="share" onSelect={onShare}>
          <DropdownMenu.ItemTitle>Share</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon
            ios={{ name: 'square.and.arrow.up' }}
            androidIconName="share"
          />
        </DropdownMenu.Item>

        <DropdownMenu.Item key="save" onSelect={onSave}>
          <DropdownMenu.ItemTitle>Save</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon
            ios={{ name: 'bookmark' }}
            androidIconName="bookmark_border"
          />
        </DropdownMenu.Item>

        <DropdownMenu.Item key="report" onSelect={onReport} destructive>
          <DropdownMenu.ItemTitle>Report</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon
            ios={{ name: 'flag' }}
            androidIconName="flag"
          />
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
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
