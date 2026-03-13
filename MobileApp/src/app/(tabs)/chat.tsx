import React, { useState, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image, Text, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import MessageInput from '@/components/chat/MessageInput';
import ChatMessage from '@/components/chat/ChatMessage';
import MessageIdeas from '@/components/chat/MessageIdeas';
import { aiChatService, Message, Role } from '@/services/aiChat';

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [height, setHeight] = useState(0);
  const flashListRef = useRef<any>(null);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = { role: Role.User, content: text };
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate bot response
    const botMessage: Message = { role: Role.Bot, content: '' };
    setMessages(prev => [...prev, botMessage]);
    
    try {
      const response = await aiChatService.sendMessage([...messages, userMessage]);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = response;
        return newMessages;
      });
    } catch (error) {
       setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = "Sorry, something went wrong.";
        return newMessages;
      });
    }
  };

  const onLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setHeight(height / 2);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <ChatMessage {...item} />
  );

  const ListEmptyComponent = () => (
    <View style={[styles.logoContainer, { marginTop: height - 100 || 100 }]}>
      <Image source={require('@assets/images/logo-white.png')} style={styles.image} />
    </View>
  );

  return (
    <View style={styles.pageContainer}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header - Literal match */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn}>
            <FontAwesome6 name="grip-lines" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
             <Text style={styles.headerTitle}>ChatGPT</Text>
             <Text style={styles.headerSubTitle}>3.5 {'>'}</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.page} onLayout={onLayout}>
          {/* @ts-ignore */}
          <FlashList
            ref={flashListRef}
            data={messages}
            renderItem={renderItem}
            estimatedItemSize={100}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={styles.listContent}
            keyboardDismissMode="on-drag"
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flashListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.keyboardAvoidingView}
        >
          {messages.length === 0 && (
             <MessageIdeas onSelectCard={(text) => handleSendMessage(text)} />
          )}
          <MessageInput onShouldSend={handleSendMessage} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBtn: {
     width: 40,
     height: 40,
     justifyContent: 'center',
     alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  page: {
    flex: 1,
  },
  listContent: {
    paddingTop: 30,
    paddingBottom: 150,
  },
  logoContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    backgroundColor: '#000',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  image: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
  },
});
