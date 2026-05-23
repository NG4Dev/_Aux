import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useQuery, useAction, useMutation } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import ProductSegmentedControl from '@/components/commerce/ProductSegmentedControl';
import ProductNowPlayingBar from '@/components/commerce/ProductNowPlayingBar';
import MerchantMenuList from '@/components/commerce/MerchantMenuList';
import ProductDetailSheet from '@/components/commerce/ProductDetailSheet';
import ProductExpandedView from '@/components/commerce/ProductExpandedView';
import {
  getSheetSnapPoints,
  snapHeight,
  toMediaAspect,
} from '@/components/commerce/getSheetSnapPoints';
import type { MediaAspect, MediaItem } from '@/types/content';
import { useCartStore } from '@/features/cart/cartStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type DiscoverProductOverlayProps = {
  visible: boolean;
  merchantSlug: string;
  productSlug: string;
  onDismiss: () => void;
  dismissible?: boolean;
};

export default function DiscoverProductOverlay({
  visible,
  merchantSlug,
  productSlug,
  onDismiss,
  dismissible = true,
}: DiscoverProductOverlayProps) {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'product' | 'menu'>('product');
  const [imageMode, setImageMode] = useState<'minimized' | 'expanded'>(
    'minimized',
  );
  const [selectedSlug, setSelectedSlug] = useState(productSlug);

  const products = useQuery(api.platform.merchants.listProducts, {
    merchantSlug,
  });
  const productData = useQuery(api.platform.merchants.getProduct, {
    merchantSlug,
    productSlug: selectedSlug,
  });

  const findSimilarProducts = useAction(api.products.findSimilar);
  const findSimilarPlaces = useAction(api.platform.discovery.findSimilarPlaces);
  const logInteraction = useMutation(api.userProfile.logInteraction);
  const loggedViewRef = useRef<string | null>(null);

  const [similarProducts, setSimilarProducts] = useState<
    Array<{ id: string; name: string; kind: 'product' }>
  >([]);
  const [similarPlaces, setSimilarPlaces] = useState<
    Array<{ id: string; name: string; kind: 'merchant' | 'place' }>
  >([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const addLine = useCartStore((s) => s.addLine);
  const cartLines = useCartStore((s) => s.lines);

  useEffect(() => {
    setSelectedSlug(productSlug);
    setActiveTab('product');
    setImageMode('minimized');
  }, [productSlug, visible]);

  const selectedProduct = productData?.product;
  const merchant = productData?.merchant;
  const mediaAspect: MediaAspect = toMediaAspect(
    selectedProduct?.mediaAspect ?? undefined,
  );
  const snapConfig = getSheetSnapPoints(mediaAspect);
  const sheetH = snapHeight(mediaAspect);
  const menuSheetH = SCREEN_HEIGHT * 0.72;

  const translateY = useSharedValue(sheetH);

  useEffect(() => {
    if (activeTab === 'menu') {
      translateY.value = withSpring(menuSheetH);
    } else {
      translateY.value = withSpring(
        imageMode === 'expanded' ? SCREEN_HEIGHT * 0.85 : sheetH,
      );
    }
  }, [activeTab, imageMode, sheetH, menuSheetH, translateY]);

  useEffect(() => {
    if (!isSignedIn || !visible || !selectedProduct?._id) return;
    const key = String(selectedProduct._id);
    if (loggedViewRef.current === key) return;
    loggedViewRef.current = key;
    void logInteraction({
      entityType: 'product',
      entityId: key,
      action: 'view',
    }).catch(() => {
      loggedViewRef.current = null;
    });
  }, [isSignedIn, visible, selectedProduct?._id, logInteraction]);

  useEffect(() => {
    if (!selectedProduct?._id) return;
    let cancelled = false;
    setLoadingSimilar(true);
    Promise.all([
      findSimilarProducts({ productId: selectedProduct._id as Id<'products'>, limit: 4 }),
      merchant
        ? findSimilarPlaces({
            sourceMerchantId: merchant._id as Id<'merchants'>,
            limit: 4,
          })
        : Promise.resolve([]),
    ])
      .then(([prods, places]) => {
        if (cancelled) return;
        setSimilarProducts(
          prods.map((p: { _id: string; name: string }) => ({
            id: p._id,
            name: p.name,
            kind: 'product' as const,
          })),
        );
        setSimilarPlaces(
          places.map((p: { id: string; name: string; kind: 'merchant' | 'place' }) => ({
            id: p.id,
            name: p.name,
            kind: p.kind,
          })),
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingSimilar(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProduct?._id, merchant?._id]);

  const media: MediaItem | null = useMemo(() => {
    if (!selectedProduct?.imageUrl) return null;
    return {
      uri: selectedProduct.imageUrl,
      type: 'image',
      width: selectedProduct.imageWidth ?? 1080,
      height: selectedProduct.imageHeight ?? 1080,
      aspect: mediaAspect,
    };
  }, [selectedProduct, mediaAspect]);

  const inCart = cartLines.some(
    (l) => l.productId === String(selectedProduct?._id),
  );

  const handleAddCart = useCallback(() => {
    if (!selectedProduct || !merchant) return;
    addLine({
      productId: String(selectedProduct._id),
      merchantSlug,
      merchantName: merchant.name,
      name: selectedProduct.name,
      description: selectedProduct.description,
      imageUrl: selectedProduct.imageUrl ?? undefined,
      priceCents: selectedProduct.priceCents,
      currency: selectedProduct.currency,
    });
  }, [selectedProduct, merchant, merchantSlug, addLine]);

  const handleShare = useCallback(async () => {
    if (!selectedProduct) return;
    await Share.share({
      message: `${selectedProduct.name} at ${merchant?.name ?? merchantSlug}`,
    });
  }, [selectedProduct, merchant, merchantSlug]);

  const handleMenuSelect = (slug: string) => {
    setSelectedSlug(slug);
    setActiveTab('product');
    setImageMode(
      getSheetSnapPoints(toMediaAspect(undefined)).expandedPreferred
        ? 'expanded'
        : 'minimized',
    );
  };

  const dismissOverlay = () => {
    if (dismissible) onDismiss();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const base = activeTab === 'menu' ? menuSheetH : sheetH;
      translateY.value = Math.max(0, base + e.translationY);
    })
    .onEnd((e) => {
      const base = activeTab === 'menu' ? menuSheetH : sheetH;
      if (e.translationY > 80) {
        if (activeTab === 'menu') {
          translateY.value = withSpring(sheetH);
          runOnJS(setActiveTab)('product');
        } else if (imageMode === 'expanded') {
          translateY.value = withSpring(sheetH);
          runOnJS(setImageMode)('minimized');
        } else {
          runOnJS(dismissOverlay)();
        }
      } else {
        translateY.value = withSpring(base);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleHeaderBack = () => {
    if (imageMode === 'expanded') {
      setImageMode('minimized');
      return;
    }
    if (activeTab === 'menu') {
      setActiveTab('product');
      return;
    }
    dismissOverlay();
  };

  if (!visible) return null;

  if (productData === undefined || products === undefined) {
    return (
      <Modal visible animationType="slide" presentationStyle="fullScreen">
        <View style={styles.loading}>
          <ActivityIndicator color="#00BFA5" size="large" />
        </View>
      </Modal>
    );
  }

  if (!selectedProduct || !merchant || !media) {
    return (
      <Modal visible animationType="slide" presentationStyle="fullScreen">
        <View style={styles.loading}>
          <Text style={{ color: '#fff' }}>Product not found</Text>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={{ color: '#00BFA5', marginTop: 12 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (imageMode === 'expanded') {
    return (
      <Modal visible animationType="fade" presentationStyle="fullScreen">
        <ProductExpandedView
          media={media}
          productName={selectedProduct.name}
          description={selectedProduct.description}
          priceCents={selectedProduct.priceCents}
          currency={selectedProduct.currency}
          imageUrl={selectedProduct.imageUrl}
          onCollapse={() => setImageMode('minimized')}
          onShare={handleShare}
          onAddCart={handleAddCart}
        />
      </Modal>
    );
  }

  const menuProducts =
    products?.map((p: NonNullable<typeof products>[number]) => ({
      _id: String(p._id),
      slug: p.slug,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      currency: p.currency,
      imageUrl: p.imageUrl,
    })) ?? [];

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View style={styles.root}>
        <LinearGradient
          colors={['#3d2a1f', '#000000']}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity onPress={handleHeaderBack} style={styles.headerBtn}>
            <Ionicons name="chevron-down" size={24} color="#fff" />
          </TouchableOpacity>
          <ProductSegmentedControl
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() =>
              Alert.alert('Options', undefined, [
                { text: 'Share', onPress: handleShare },
                { text: 'Add to cart', onPress: handleAddCart },
                { text: 'Report', style: 'destructive' },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {activeTab === 'menu' && (
          <ProductNowPlayingBar
            imageUrl={selectedProduct.imageUrl}
            productName={selectedProduct.name}
            merchantName={merchant.name}
          />
        )}

        {activeTab === 'product' && (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() =>
              setImageMode(
                snapConfig.expandedPreferred ? 'expanded' : 'expanded',
              )
            }
            style={styles.heroWrap}
          >
            <DynamicMediaRenderer
              media={media}
              maxHeight={SCREEN_HEIGHT * 0.5}
              borderRadius={8}
            />
            <Text style={styles.heroTitle}>{selectedProduct.name}</Text>
            <Text style={styles.heroSubtitle} numberOfLines={1}>
              {selectedProduct.description}
            </Text>
          </TouchableOpacity>
        )}

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              {
                height: SCREEN_HEIGHT,
                top: SCREEN_HEIGHT - (activeTab === 'menu' ? menuSheetH : sheetH),
              },
              sheetStyle,
            ]}
          >
            {activeTab === 'menu' ? (
              <MerchantMenuList
                products={menuProducts}
                selectedSlug={selectedSlug}
                onSelectProduct={handleMenuSelect}
              />
            ) : (
              <ProductDetailSheet
                productName={selectedProduct.name}
                description={selectedProduct.description}
                priceCents={selectedProduct.priceCents}
                currency={selectedProduct.currency}
                merchantName={merchant.name}
                onAddCart={handleAddCart}
                inCart={inCart}
                similarProducts={similarProducts}
                similarPlaces={similarPlaces}
                loadingSimilar={loadingSimilar}
              />
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  loading: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
