import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import Chip from '@/components/Chip';
import CustomButton from '@/components/CustomButton';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  isGuestBrowseUnlocked,
} from '@/services/onboarding';

export default function PreferencesScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const groups = useQuery(api.categories.listForOnboarding);
  const updateProfile = useMutation(api.userProfile.updateProfile);
  const completeStep = useMutation(api.userProfile.completeOnboardingStep);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<
    Id<'categories'>[]
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded || isSignedIn) return;

    void (async () => {
      const browseUnlocked = await isGuestBrowseUnlocked();
      router.replace(browseUnlocked ? '/(tabs)/home' : '/(onboarding)/showcase');
    })();
  }, [isLoaded, isSignedIn]);

  const categoryRows = useMemo(() => {
    if (!groups) return [];
    return groups.map((group) => ({
      title: group.group,
      items: group.categories.map((category) => ({
        id: category._id,
        label: category.name,
      })),
    }));
  }, [groups]);

  const toggleCategory = (categoryId: Id<'categories'>) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const onNext = async () => {
    if (!isSignedIn) return;

    setSaving(true);
    try {
      if (selectedCategoryIds.length > 0) {
        await updateProfile({ interestCategoryIds: selectedCategoryIds });
        await completeStep({ step: 'preferences' });
      }
      router.replace('/(onboarding)/notifications');
    } finally {
      setSaving(false);
    }
  };

  const renderCategory = ({
    item,
  }: {
    item: (typeof categoryRows)[0];
  }) => (
    <View style={styles.categoryWrap}>
      <Text style={styles.categoryTitle}>{item.title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {item.items.map((interest) => (
          <Chip
            key={interest.id}
            label={interest.label}
            selected={selectedCategoryIds.includes(interest.id)}
            onPress={() => toggleCategory(interest.id)}
          />
        ))}
      </ScrollView>
    </View>
  );

  if (!isLoaded || !isSignedIn) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>What are you interested in?</Text>
          <Text style={styles.subtitle}>
            Select topics to personalize your experience. Merchants can adopt
            these categories later — your picks are saved now.
          </Text>
        </View>

        {groups === undefined ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
        ) : categoryRows.length === 0 ? (
          <Text style={styles.emptyText}>
            Interest categories are loading on the server. Pull to refresh or try
            again shortly.
          </Text>
        ) : (
          <FlatList
            data={categoryRows}
            renderItem={renderCategory}
            keyExtractor={(item) => item.title}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.footer}>
          <CustomButton
            text={saving ? 'Saving…' : 'Next'}
            onPress={onNext}
            style={styles.nextButton}
            disabled={saving || groups === undefined}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
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
