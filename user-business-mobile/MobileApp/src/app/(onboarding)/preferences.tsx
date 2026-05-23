import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import Chip from '@/components/Chip';
import CustomButton from '@/components/CustomButton';
import { markOnboardingComplete } from '@/services/onboarding';

const CATEGORIES = [
  {
    title: 'Attractions & Entertainment',
    items: [
      'Events venue', 'Live music venue', 'Nightclub', 'Performing arts theatre', 
      'Art Gallery', 'Museum', 'Cinema', 'Theme Park', 'Zoo', 'Stadium'
    ],
  },
  {
    title: 'Eating & Drinking',
    items: [
      'American restaurant', 'Asian restaurant', 'Bakery', 'Buffet restaurant', 
      'Cafe', 'Chicken restaurant', 'Chinese restaurant', 'Fast food restaurant', 
      'French restaurant', 'Hamburger restaurant', 'Indian restaurant', 
      'Italian restaurant', 'Japanese restaurant', 'Korean restaurant', 
      'Mexican restaurant', 'Pizza restaurant', 'Ramen restaurant', 
      'Sandwich shop', 'Seafood restaurant', 'Sports bar', 'Steak house', 
      'Sushi restaurant', 'Takeaway', 'Tea Room', 'Thai restaurant'
    ],
  },
  {
    title: 'Shops & Shopping',
    items: [
      'Butchers', 'Coffee Shop', 'Craft shop', 'Doughnut Shop', 'General Store', 
      'Health Food Shop', 'Jewelry shop', 'Clothing store', 'Electronics', 
      'Bookstore', 'Supermarket', 'Market', 'Florist', 'Pet shop'
    ],
  },
];

export default function PreferencesScreen() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const onNext = async () => {
    // Mark complete after interest selection
    await markOnboardingComplete();
    router.replace('/notifications');
  };

  const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <View style={styles.categoryWrap}>
      <Text style={styles.categoryTitle}>{item.title}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.chipScroll}
      >
        {item.items.map((interest) => (
          <Chip
            key={interest}
            label={interest}
            selected={selectedInterests.includes(interest)}
            onPress={() => toggleInterest(interest)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>What are you interested in?</Text>
          <Text style={styles.subtitle}>
            Select some topics you're interested in to help personalize your experience.
          </Text>
        </View>

        <FlatList
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={item => item.title}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <CustomButton 
            text="Next" 
            onPress={onNext}
            style={styles.nextButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: 100,
  },
  categoryWrap: {
    marginTop: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  chipScroll: {
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  nextButton: {
    backgroundColor: '#fff',
  },
});
