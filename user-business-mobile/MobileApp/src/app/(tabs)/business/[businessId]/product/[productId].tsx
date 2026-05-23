import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DiscoverProductOverlay from '@/components/commerce/DiscoverProductOverlay';
import Colors from '@/constants/Colors';

export default function ProductDetailScreen() {
  const { businessId, productId } = useLocalSearchParams<{
    businessId: string;
    productId: string;
  }>();
  const router = useRouter();

  if (!businessId || !productId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <DiscoverProductOverlay
        visible
        merchantSlug={businessId}
        productSlug={productId}
        onDismiss={() => router.back()}
        dismissible
      />
    </View>
  );
}
