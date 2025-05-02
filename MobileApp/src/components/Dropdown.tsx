import { View, Text } from 'react-native'
import React from 'react'
import * as DropdownMenu from 'zeego/dropdown-menu';
import RoundButton from './RoundButton';

const Dropdown = () => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <RoundButton icon={'ellipsis-horizontal'} text='More'/>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item key='Download statement'>
            <DropdownMenu.ItemTitle>Download statement</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon 
                ios={{name: "doc.text"}} //or name:'list.bullet.rectangle.fill', pointSize:24,
                androidIconName="description_24px"
            />
        </DropdownMenu.Item>

        <DropdownMenu.Item key='Add payment method'>
            <DropdownMenu.ItemTitle>Add payment method</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon 
                ios={{name: "doc.text"}} //or name:'list.bullet.rectangle.fill', pointSize:24,
                androidIconName="add_card_24px"
            />
        </DropdownMenu.Item>

        <DropdownMenu.Item key='Auto top-up settings'>
            <DropdownMenu.ItemTitle>Auto top-up settings</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon 
                ios={{name: "doc.text"}} //or name:'list.bullet.rectangle.fill', pointSize:24,
                androidIconName="money_24px"
            />
        </DropdownMenu.Item>

        <DropdownMenu.Item key='Security & PIN settings'>
            <DropdownMenu.ItemTitle>Security & PIN settings</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon 
                ios={{name: "doc.text"}} //or name:'list.bullet.rectangle.fill', pointSize:24,
                androidIconName="password_24px"
            />
        </DropdownMenu.Item>

      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default Dropdown
