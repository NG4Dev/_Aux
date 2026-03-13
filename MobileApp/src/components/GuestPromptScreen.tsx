import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type GuestPromptScreenProps = {
  feature: string;
};

export default function GuestPromptScreen({ feature }: GuestPromptScreenProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="lock-outline" size={80} color="rgba(255, 255, 255, 0.2)" />
      <Text style={styles.title}>Unlock {feature}</Text>
      <Text style={styles.subtitle}>
        Sign in to access your personalized {feature.toLowerCase()} and all our premium features.
      </Text>
      
      <CustomButton 
        text="Sign In" 
        onPress={() => router.replace('/(auth)')} 
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  button: {
    marginTop: 32,
    width: '100%',
    backgroundColor: '#fff',
  },
});
