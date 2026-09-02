import React from 'react';
import { Platform } from 'react-native';
import { MenuView } from '@react-native-menu/menu';
import RoundButton from './RoundButton';

const Dropdown = () => {
  return (
    <MenuView
      title="More"
      shouldOpenOnLongPress={false}
      onPressAction={() => {}}
      actions={[
        {
          id: 'download-statement',
          title: 'Download statement',
          image: Platform.select({ ios: 'doc.text', android: 'description_24px' }),
        },
        {
          id: 'add-payment-method',
          title: 'Add payment method',
          image: Platform.select({ ios: 'creditcard', android: 'add_card_24px' }),
        },
        {
          id: 'auto-top-up',
          title: 'Auto top-up settings',
          image: Platform.select({ ios: 'banknote', android: 'money_24px' }),
        },
        {
          id: 'security-settings',
          title: 'Security & PIN settings',
          image: Platform.select({ ios: 'lock', android: 'password_24px' }),
        },
      ]}
    >
      <RoundButton icon="ellipsis-horizontal" text="More" />
    </MenuView>
  );
};

export default Dropdown;
