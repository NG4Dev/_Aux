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

  useAnimatedRef,

  useAnimatedStyle,

  useSharedValue,

  withSpring,

  runOnJS,

  interpolate,

  Extrapolation,

} from 'react-native-reanimated';

import { useQuery, useAction, useMutation } from 'convex/react';

import { useAuth } from '@clerk/clerk-expo';

import { LinearGradient } from 'expo-linear-gradient';

import { useRouter } from 'expo-router';

import { api } from '@/convex/_generated/api';

import type { Id } from '@/convex/_generated/dataModel';

import ProductSegmentedControl from '@/components/commerce/ProductSegmentedControl';

import ProductNowPlayingBar from '@/components/commerce/ProductNowPlayingBar';

import MerchantMenuList from '@/components/commerce/MerchantMenuList';

import ProductDetailSheet from '@/components/commerce/ProductDetailSheet';

import ProductExpandedView from '@/components/commerce/ProductExpandedView';

import ProductHeroMedia from '@/components/commerce/ProductHeroMedia';

import PurchasableContextMenu from '@/components/commerce/PurchasableContextMenu';

import SaveToCollectionSheet from '@/components/bookmarks/SaveToCollectionSheet';

import GuestAuthSheet from '@/components/GuestAuthSheet';

import {

  expandedSheetHeight,

  imageSlotHeight,

  snapHeight,

  toMediaAspect,

} from '@/components/commerce/getSheetSnapPoints';

import type { ContentItem, MediaAspect, MediaItem } from '@/types/content';

import { useCartStore } from '@/features/cart/cartStore';



const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const EXPANDED_SHEET_H = expandedSheetHeight();

const MENU_SHEET_H = SCREEN_HEIGHT * 0.72;



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

  const router = useRouter();

  const { isSignedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<'product' | 'menu'>('product');

  const [imageMode, setImageMode] = useState<'minimized' | 'expanded'>(

    'minimized',

  );

  const [showImageOverlay, setShowImageOverlay] = useState(false);

  const [contextMenuVisible, setContextMenuVisible] = useState(false);

  const [showGuestAuth, setShowGuestAuth] = useState(false);

  const [saveTarget, setSaveTarget] = useState<ContentItem | null>(null);

  const [selectedSlug, setSelectedSlug] = useState(productSlug);

  const [isLiked, setIsLiked] = useState(false);



  const activeTabRef = useRef(activeTab);

  activeTabRef.current = activeTab;

  const hasOpenedRef = useRef(false);



  const products = useQuery(api.platform.merchants.listProducts, {

    merchantSlug,

  });

  const productData = useQuery(api.platform.merchants.getProduct, {

    merchantSlug,

    productSlug: selectedSlug,

  });



  const selectedProduct = productData?.product;

  const merchant = productData?.merchant;



  const favorited = useQuery(

    api.favorites.isFavorited,

    isSignedIn && selectedProduct?._id

      ? { productId: selectedProduct._id as Id<'products'> }

      : 'skip',

  );



  const findSimilarProducts = useAction(api.products.findSimilar);

  const findSimilarPlaces = useAction(api.platform.discovery.findSimilarPlaces);

  const logInteraction = useMutation(api.userProfile.logInteraction);

  const toggleFavorite = useMutation(api.favorites.toggle);

  const loggedViewRef = useRef<string | null>(null);



  const [similarProducts, setSimilarProducts] = useState<

    Array<{

      id: string;

      name: string;

      slug?: string;

      imageUrl?: string | null;

      priceCents?: number;

      currency?: string;

      kind: 'product';

    }>

  >([]);

  const [similarPlaces, setSimilarPlaces] = useState<

    Array<{

      id: string;

      name: string;

      slug?: string;

      tagline?: string;

      imageUrl?: string | null;

      kind: 'merchant' | 'place';

    }>

  >([]);

  const [loadingSimilar, setLoadingSimilar] = useState(false);



  const addLine = useCartStore((s) => s.addLine);

  const removeLine = useCartStore((s) => s.removeLine);

  const cartLines = useCartStore((s) => s.lines);



  const mediaAspect: MediaAspect = toMediaAspect(

    selectedProduct?.mediaAspect ?? undefined,

  );

  const collapsedSheetH =

    activeTab === 'menu' ? MENU_SHEET_H : snapHeight(mediaAspect);

  const collapsedOffset = EXPANDED_SHEET_H - collapsedSheetH;



  const sheetTranslateY = useSharedValue(collapsedOffset);

  const dragStartY = useSharedValue(0);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const heroSlotHeight = useMemo(

    () => imageSlotHeight(mediaAspect),

    [mediaAspect],

  );



  useEffect(() => {

    setSelectedSlug(productSlug);

    setActiveTab('product');

    setImageMode('minimized');

    setShowImageOverlay(false);

    setContextMenuVisible(false);

    setShowGuestAuth(false);

  }, [productSlug, visible]);



  useEffect(() => {

    if (!visible) {

      hasOpenedRef.current = false;

      return;

    }

    if (hasOpenedRef.current) return;

    hasOpenedRef.current = true;

    sheetTranslateY.value = EXPANDED_SHEET_H;

    sheetTranslateY.value = withSpring(collapsedOffset);

  }, [visible, collapsedOffset, sheetTranslateY]);



  useEffect(() => {

    sheetTranslateY.value = withSpring(collapsedOffset);

  }, [collapsedOffset, sheetTranslateY]);



  useEffect(() => {

    setIsLiked(favorited === true);

  }, [favorited]);



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



  const menuProducts = useMemo(

    () =>

      products?.map((p: NonNullable<typeof products>[number]) => ({

        _id: String(p._id),

        slug: p.slug,

        name: p.name,

        description: p.description,

        priceCents: p.priceCents,

        currency: p.currency,

        imageUrl: p.imageUrl,

      })) ?? [],

    [products],

  );



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

        let mappedProducts = prods.map((p: {

          _id: string;

          name: string;

          slug?: string;

          imageUrl?: string;

          priceCents?: number;

          currency?: string;

        }) => ({

          id: p._id,

          name: p.name,

          slug: p.slug,

          imageUrl: p.imageUrl,

          priceCents: p.priceCents,

          currency: p.currency,

          kind: 'product' as const,

        }));

        if (mappedProducts.length === 0) {

          mappedProducts = menuProducts

            .filter((p) => p.slug !== selectedSlug)

            .slice(0, 4)

            .map((p) => ({

              id: p._id,

              name: p.name,

              slug: p.slug,

              imageUrl: p.imageUrl,

              priceCents: p.priceCents,

              currency: p.currency,

              kind: 'product' as const,

            }));

        }

        setSimilarProducts(mappedProducts);

        setSimilarPlaces(

          places.map((p: {

            id: string;

            name: string;

            kind: 'merchant' | 'place';

            slug?: string;

            tagline?: string;

          }) => ({

            id: p.id,

            name: p.name,

            kind: p.kind,

            slug: p.slug,

            tagline: p.tagline,

            imageUrl: p.slug

              ? `https://i.pravatar.cc/400?u=${encodeURIComponent(p.slug)}`

              : null,

          })),

        );

      })

      .finally(() => {

        if (!cancelled) setLoadingSimilar(false);

      });

    return () => {

      cancelled = true;

    };

  }, [selectedProduct?._id, merchant?._id, menuProducts, selectedSlug, findSimilarProducts, findSimilarPlaces]);



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



  const saveItem: ContentItem | null = useMemo(() => {

    if (!selectedProduct || !merchant || !media) return null;

    return {

      id: String(selectedProduct._id),

      contentType: 'product',

      title: selectedProduct.name,

      description: selectedProduct.description,

      media: [media],

      profileName: merchant.name,

      profileAvatar: `https://i.pravatar.cc/80?u=${encodeURIComponent(merchantSlug)}`,

      merchantSlug,

      productSlug: selectedSlug,

      businessId: merchantSlug,

      categories: ['Discover'],

    };

  }, [selectedProduct, merchant, media, merchantSlug, selectedSlug]);



  const inCart = cartLines.some(

    (l) => l.productId === String(selectedProduct?._id),

  );



  const promptGuestAuth = useCallback(() => {

    setShowGuestAuth(true);

    setShowImageOverlay(false);

    setContextMenuVisible(false);

  }, []);



  const handleAddCart = useCallback(() => {

    if (!selectedProduct || !merchant) return;

    if (!isSignedIn) {

      promptGuestAuth();

      return;

    }

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

    setShowImageOverlay(false);

  }, [selectedProduct, merchant, merchantSlug, addLine, isSignedIn, promptGuestAuth]);



  const handleRemoveCart = useCallback(() => {

    if (!selectedProduct?._id) return;

    if (!isSignedIn) {

      promptGuestAuth();

      return;

    }

    removeLine(String(selectedProduct._id));

    setContextMenuVisible(false);

  }, [selectedProduct?._id, isSignedIn, removeLine, promptGuestAuth]);



  const handleMyCart = useCallback(() => {

    router.push({

      pathname: '/(tabs)/business/[businessId]/cart',

      params: { businessId: merchantSlug },

    });

  }, [router, merchantSlug]);



  const handleShare = useCallback(async () => {

    if (!selectedProduct) return;

    await Share.share({

      message: `${selectedProduct.name} at ${merchant?.name ?? merchantSlug}`,

    });

    setShowImageOverlay(false);

  }, [selectedProduct, merchant, merchantSlug]);



  const handleAddToList = useCallback(() => {

    if (!saveItem) return;

    if (!isSignedIn) {

      promptGuestAuth();

      return;

    }

    setSaveTarget(saveItem);

    setShowImageOverlay(false);

    setContextMenuVisible(false);

  }, [saveItem, isSignedIn, promptGuestAuth]);



  const handleLike = useCallback(async () => {

    if (!selectedProduct?._id) return;

    if (!isSignedIn) {

      promptGuestAuth();

      return;

    }

    try {

      const liked = await toggleFavorite({

        productId: selectedProduct._id as Id<'products'>,

      });

      setIsLiked(liked);

    } catch {

      Alert.alert('Could not update like', 'Please try again.');

    }

  }, [selectedProduct?._id, isSignedIn, toggleFavorite, promptGuestAuth]);



  const handleRecommendSimilar = useCallback(() => {

    if (!selectedProduct?._id) return;

    if (isSignedIn) {

      void logInteraction({

        entityType: 'product',

        entityId: String(selectedProduct._id),

        action: 'view',

      });

    }

    Alert.alert('Got it', 'We will show you more products like this.');

    setContextMenuVisible(false);

  }, [selectedProduct?._id, isSignedIn, logInteraction]);



  const handleDoNotRecommendSimilar = useCallback(() => {

    Alert.alert('Preference saved', 'Similar products will be shown less often.');

    setContextMenuVisible(false);

  }, []);



  const handleDoNotRecommendBusiness = useCallback(() => {

    Alert.alert('Preference saved', 'This business will be shown less often.');

    setContextMenuVisible(false);

  }, []);



  const handleReport = useCallback(() => {

    Alert.alert(

      'Report this item?',

      'Our team will review this report.',

      [

        { text: 'Cancel', style: 'cancel' },

        {

          text: 'Report',

          style: 'destructive',

          onPress: () => setContextMenuVisible(false),

        },

      ],

    );

  }, []);



  const handleMenuSelect = (slug: string) => {

    setSelectedSlug(slug);

    setActiveTab('product');

    setImageMode('minimized');

    setShowImageOverlay(false);

  };



  const dismissOverlay = useCallback(() => {

    if (dismissible) onDismiss();

  }, [dismissible, onDismiss]);



  const snapToCollapsed = useCallback(() => {

    sheetTranslateY.value = withSpring(collapsedOffset);

  }, [collapsedOffset, sheetTranslateY]);



  const snapToExpanded = useCallback(() => {

    sheetTranslateY.value = withSpring(0);

  }, [sheetTranslateY]);



  const handlePanEnd = useCallback(

    (translationY: number, currentPosition: number) => {

      const mid = collapsedOffset / 2;



      if (translationY > 80) {

        if (currentPosition < mid) {

          snapToCollapsed();

        } else if (activeTabRef.current === 'menu') {

          snapToCollapsed();

          setActiveTab('product');

        } else {

          dismissOverlay();

        }

        return;

      }



      if (translationY < -40 || currentPosition < mid) {

        snapToExpanded();

      } else {

        snapToCollapsed();

      }

    },

    [collapsedOffset, dismissOverlay, snapToCollapsed, snapToExpanded],

  );



  const panGesture = Gesture.Pan()

    .simultaneousWithExternalGesture(scrollRef)

    .onBegin(() => {

      dragStartY.value = sheetTranslateY.value;

    })

    .onUpdate((e) => {

      const next = dragStartY.value + e.translationY;

      sheetTranslateY.value = Math.min(collapsedOffset + 120, Math.max(0, next));

    })

    .onEnd((e) => {

      runOnJS(handlePanEnd)(e.translationY, sheetTranslateY.value);

    });



  const sheetStyle = useAnimatedStyle(() => ({

    transform: [{ translateY: sheetTranslateY.value }],

  }));



  const heroCaptionStyle = useAnimatedStyle(() => {

    const progress =

      collapsedOffset > 0 ? 1 - sheetTranslateY.value / collapsedOffset : 0;

    return {

      opacity: interpolate(

        progress,

        [0, 0.35, 1],

        [1, 0.3, 0],

        Extrapolation.CLAMP,

      ),

      maxHeight: interpolate(

        progress,

        [0, 0.5, 1],

        [80, 40, 0],

        Extrapolation.CLAMP,

      ),

      marginBottom: interpolate(progress, [0, 1], [8, 0], Extrapolation.CLAMP),

    };

  });



  const handleHeaderBack = () => {

    if (contextMenuVisible) {

      setContextMenuVisible(false);

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

            onPress={() => setContextMenuVisible(true)}

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

          <View style={styles.heroWrap}>

            <ProductHeroMedia

              media={media}

              imageSlotHeight={heroSlotHeight}

              showOverlay={showImageOverlay}

              onToggleOverlay={() => setShowImageOverlay((v) => !v)}

              onMaximize={() => {

                setShowImageOverlay(false);

                setImageMode('expanded');

              }}

              onShare={handleShare}

              onAddCart={handleAddCart}

              onAddToList={handleAddToList}

              productName={selectedProduct.name}

              productSubtitle={selectedProduct.description}

              captionStyle={heroCaptionStyle}

            />

          </View>

        )}



        <Animated.View

          style={[

            styles.sheet,

            {

              height: SCREEN_HEIGHT,

              top: SCREEN_HEIGHT - EXPANDED_SHEET_H,

            },

            sheetStyle,

          ]}

        >

          <GestureDetector gesture={panGesture}>

            <View style={styles.handleZone}>

              <View style={styles.handle} />

            </View>

          </GestureDetector>



          {activeTab === 'menu' ? (

            <MerchantMenuList

              products={menuProducts}

              selectedSlug={selectedSlug}

              onSelectProduct={handleMenuSelect}

            />

          ) : (

            <ProductDetailSheet

              scrollRef={scrollRef}

              contentPaddingBottom={insets.bottom + 24}

              productName={selectedProduct.name}

              description={selectedProduct.description}

              priceCents={selectedProduct.priceCents}

              currency={selectedProduct.currency}

              merchantName={merchant.name}

              onAddCart={handleAddCart}

              onMyCart={handleMyCart}

              inCart={inCart}

              similarProducts={similarProducts}

              similarPlaces={similarPlaces}

              loadingSimilar={loadingSimilar}

              onSelectSimilar={(slug) => handleMenuSelect(slug)}

            />

          )}

        </Animated.View>



        {imageMode === 'expanded' && (

          <View style={styles.expandedOverlay}>

            <ProductExpandedView

              media={media}

              aspect={mediaAspect}

              onCollapse={() => setImageMode('minimized')}

            />

          </View>

        )}



        <PurchasableContextMenu

          visible={contextMenuVisible}

          onClose={() => setContextMenuVisible(false)}

          productName={selectedProduct.name}

          productSubtitle={selectedProduct.description}

          imageUrl={selectedProduct.imageUrl}

          profileName={merchant.name}

          profileAvatar={`https://i.pravatar.cc/80?u=${encodeURIComponent(merchantSlug)}`}

          inCart={inCart}

          isLiked={isLiked}

          onLike={handleLike}

          onAddCart={handleAddCart}

          onRemoveCart={handleRemoveCart}

          onShare={handleShare}

          onAddToList={handleAddToList}

          onRecommendSimilar={handleRecommendSimilar}

          onDoNotRecommendSimilar={handleDoNotRecommendSimilar}

          onDoNotRecommendBusiness={handleDoNotRecommendBusiness}

          onReport={handleReport}

        />



        {showGuestAuth && (

          <GuestAuthSheet onDismiss={() => setShowGuestAuth(false)} />

        )}



        <SaveToCollectionSheet

          item={saveTarget}

          onClose={() => setSaveTarget(null)}

        />

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

  sheet: {

    position: 'absolute',

    left: 0,

    right: 0,

    backgroundColor: '#1a1a1a',

    borderTopLeftRadius: 16,

    borderTopRightRadius: 16,

    overflow: 'hidden',

  },

  handleZone: {

    paddingTop: 10,

    paddingBottom: 12,

    alignItems: 'center',

  },

  handle: {

    width: 36,

    height: 4,

    borderRadius: 2,

    backgroundColor: 'rgba(255,255,255,0.3)',

  },

  expandedOverlay: {

    ...StyleSheet.absoluteFillObject,

    zIndex: 40,

    backgroundColor: '#000',

  },

});


