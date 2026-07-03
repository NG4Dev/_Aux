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

  BackHandler,

} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import Animated, {

  useAnimatedRef,

  useAnimatedStyle,

  useAnimatedProps,

  useSharedValue,

  withSpring,

  runOnJS,

  interpolate,

  Extrapolation,

  scrollTo,

  useAnimatedReaction,

} from 'react-native-reanimated';

import { useQuery, useAction, useMutation } from 'convex/react';

import { useAuth } from '@clerk/clerk-expo';

import { useRouter } from 'expo-router';

import { api } from '@/convex/_generated/api';

import type { Id } from '@/convex/_generated/dataModel';

import ProductSegmentedControl from '@/components/commerce/ProductSegmentedControl';

import MerchantMenuHeroCarousel from '@/components/commerce/MerchantMenuHeroCarousel';

import MerchantMenuList from '@/components/commerce/MerchantMenuList';

import ProductDetailSheet from '@/components/commerce/ProductDetailSheet';

import ProductExpandedView from '@/components/commerce/ProductExpandedView';

import ProductHeroMedia from '@/components/commerce/ProductHeroMedia';

import OverlayViewCartBar from '@/components/commerce/OverlayViewCartBar';

import OverlayHeroMorphLayer, { type MorphRect } from '@/components/commerce/OverlayHeroMorphLayer';

import OverlayMiniPlayerBar from '@/components/commerce/OverlayMiniPlayerBar';

import MenuInlinePlayerBar from '@/components/commerce/MenuInlinePlayerBar';

import HeroDynamicBackdrop from '@/components/commerce/HeroDynamicBackdrop';

import {
  useExpandHeroMorphOpacityStyle,
  useHeroBandFadeStyle,
} from '@/components/commerce/useOverlayHeroMorph';

import {
  prefetchHeroBackdropPalettes,
  prefetchHeroBackdropNeighbors,
} from '@/utils/prefetchHeroBackdropPalettes';

import {
  HERO_VISIBLE_UNTIL,
  HEADER_MINI_FADE_IN_END,
  HEADER_MINI_FADE_IN_START,
  HERO_MORPH_TELEMETRY_MILESTONES,
  INLINE_FADE_OUT_END,
  INLINE_FADE_OUT_START,
  headerThumbHandoffOpacityJs,
  inlineThumbPeekOpacityJs,
  morphHandoffTJs,
  morphLayerOpacityJs,
  MORPH_END,
  MORPH_START,
  sourceHeroMorphOpacityJs,
} from '@/components/commerce/menuTransitionTokens';

import OverlayHeaderChrome from '@/components/commerce/OverlayHeaderChrome';

import ProductStoryHeroLayout from '@/components/commerce/ProductStoryHeroLayout';

import PurchasableContextMenu from '@/components/commerce/PurchasableContextMenu';

import SaveToCollectionSheet from '@/components/bookmarks/SaveToCollectionSheet';

import GuestAuthSheet from '@/components/GuestAuthSheet';

import {

  overlayHeroSlotHeight,

  overlayCollapsedSheetHeight,

  storyCollapsedPeekHeight,

  menuTabCollapsedSheetHeight,

  menuCarouselChromeHeight,

  menuCarouselDisplayBandHeight,

  maxMenuCarouselFrameHeight,

  MENU_QUEUE_PEEK_RATIO,

  MENU_CAROUSEL_BAND_MAX_RATIO,

  getSheetSnapPoints,

  toMediaAspect,

} from '@/components/commerce/getSheetSnapPoints';

import type { ContentItem, MediaAspect, MediaItem } from '@/types/content';

import { useCartStore } from '@/features/cart/cartStore';

import { discoverError, discoverLog } from '@/services/discoverFlowLogger';



const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHEET_SPRING = { damping: 22, stiffness: 220, mass: 0.9 };

const PAN_CHROME_HEIGHT = 94;

const PAN_DRAG_ZONE_HEIGHT = 120;

const PEEK_PAN_CHROME_HEIGHT = 22;

const OVERLAY_HEADER_BODY = 52;

const HERO_LAYOUT_READY = 1;

const AnimatedPanZone = Animated.createAnimatedComponent(View);



type DiscoverProductOverlayProps = {

  visible: boolean;

  merchantSlug: string;

  productSlug: string;

  onDismiss: () => void;

  dismissible?: boolean;

  backActionRef?: React.MutableRefObject<(() => void) | null>;

  initialMediaAspect?: MediaAspect;

  initialImageMode?: 'minimized' | 'expanded';

};



export default function DiscoverProductOverlay({

  visible,

  merchantSlug,

  productSlug,

  onDismiss,

  dismissible = true,

  backActionRef,

  initialMediaAspect,

  initialImageMode,

}: DiscoverProductOverlayProps) {

  const insets = useSafeAreaInsets();

  const router = useRouter();

  const { isSignedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<'product' | 'menu'>('product');

  const [imageMode, setImageMode] = useState<'minimized' | 'expanded'>(

    'minimized',

  );

  const [showImageOverlay, setShowImageOverlay] = useState(false);

  const [showMenuHeroOverlay, setShowMenuHeroOverlay] = useState(false);

  const [contextMenuVisible, setContextMenuVisible] = useState(false);

  const contextMenuVisibleRef = useRef(false);

  useEffect(() => {

    contextMenuVisibleRef.current = contextMenuVisible;

    contextMenuVisibleSV.value = contextMenuVisible ? 1 : 0;

  }, [contextMenuVisible, contextMenuVisibleSV]);

  const [showGuestAuth, setShowGuestAuth] = useState(false);

  const [saveTarget, setSaveTarget] = useState<ContentItem | null>(null);

  const [slugStack, setSlugStack] = useState<string[]>([productSlug]);

  const selectedSlug = slugStack[slugStack.length - 1] ?? productSlug;

  const [menuFocusSlug, setMenuFocusSlug] = useState(productSlug);

  const [isLiked, setIsLiked] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);

  const [viewCartBarArmed, setViewCartBarArmed] = useState(false);

  const [viewCartBarVisible, setViewCartBarVisible] = useState(false);



  const activeTabRef = useRef(activeTab);

  activeTabRef.current = activeTab;

  /** 0 = product (static sheet chrome), 1 = menu (YT queue crossfade). */
  const activeTabSV = useSharedValue(activeTab === 'menu' ? 1 : 0);

  useEffect(() => {
    activeTabSV.value = activeTab === 'menu' ? 1 : 0;
  }, [activeTab, activeTabSV]);

  const hasOpenedRef = useRef(false);

  const isDraggingRef = useRef(false);

  const lastPanLogAtRef = useRef(0);

  const lastMorphMilestoneRef = useRef(-1);

  const lastChromeCrossfadeRef = useRef<'controls' | 'miniPlayer' | null>(null);

  const backConsumedRef = useRef(false);

  const gestureLockUntilRef = useRef(0);

  const overlayEverReadyRef = useRef(false);

  const lastReadyRef = useRef<{

    product: NonNullable<typeof selectedProduct>;

    merchant: NonNullable<typeof merchant>;

    media: MediaItem;

  } | null>(null);

  const getProductFetchStartedRef = useRef<number | null>(null);

  const prevMenuFocusSlugRef = useRef(menuFocusSlug);

  const carouselProgrammaticScrollRef = useRef(false);

  const pendingListProductSnapRef = useRef(false);

  const cachedMerchantRef = useRef<NonNullable<typeof merchant> | null>(null);

  const lockedCarouselSlotRef = useRef<number | null>(null);

  const lockedCarouselMerchantRef = useRef<string | null>(null);



  const products = useQuery(api.platform.merchants.listProducts, {

    merchantSlug,

  });

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

        mediaAspect: toMediaAspect(p.mediaAspect),

        imageWidth: p.imageWidth,

        imageHeight: p.imageHeight,

        categoryId: String(p.categoryId),

        categoryName: p.categoryName,

        categorySlug: p.categorySlug,

      })) ?? [],

    [products],

  );

  const menuCategories = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; slug: string }>();
    for (const p of menuProducts) {
      if (p.categoryId && !byId.has(p.categoryId)) {
        byId.set(p.categoryId, {
          id: p.categoryId,
          name: p.categoryName ?? 'Menu',
          slug: p.categorySlug ?? 'menu',
        });
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [menuProducts]);

  const maxMenuCarouselHeroHeight = useMemo(

    () => maxMenuCarouselFrameHeight(menuProducts),

    [menuProducts],

  );

  const menuCarouselFrameSlotH = useMemo(() => {
    const computed = Math.min(
      maxMenuCarouselHeroHeight,
      SCREEN_HEIGHT * MENU_CAROUSEL_BAND_MAX_RATIO,
    );
    if (
      lockedCarouselMerchantRef.current !== merchantSlug ||
      menuProducts.length === 0
    ) {
      return computed;
    }
    if (lockedCarouselSlotRef.current === null) {
      lockedCarouselSlotRef.current = computed;
      lockedCarouselMerchantRef.current = merchantSlug;
    }
    return lockedCarouselSlotRef.current;
  }, [maxMenuCarouselHeroHeight, menuProducts.length, merchantSlug]);

  const menuCarouselDisplayHeight = useMemo(
    () => menuCarouselDisplayBandHeight(menuCarouselFrameSlotH),
    [menuCarouselFrameSlotH],
  );

  const menuFocusProduct = useMemo(

    () => menuProducts.find((p) => p.slug === menuFocusSlug) ?? menuProducts[0],

    [menuProducts, menuFocusSlug],

  );

  const menuFocusMedia: MediaItem | null = useMemo(() => {

    if (!menuFocusProduct?.imageUrl) return null;

    const aspect = menuFocusProduct.mediaAspect ?? 'square';

    return {

      uri: menuFocusProduct.imageUrl,

      type: 'image',

      width: menuFocusProduct.imageWidth ?? 1080,

      height: menuFocusProduct.imageHeight ?? 1080,

      aspect,

    };

  }, [menuFocusProduct]);

  const productData = useQuery(api.platform.merchants.getProduct, {

    merchantSlug,

    productSlug: selectedSlug,

  });



  const selectedProduct = productData?.product;

  const merchant = productData?.merchant;

  const optimisticMenuEntry = useMemo(

    () => menuProducts.find((p) => p.slug === selectedSlug),

    [menuProducts, selectedSlug],

  );

  const optimisticShellProduct = useMemo(() => {

    if (selectedProduct || productData !== undefined || !optimisticMenuEntry) {

      return null;

    }

    return {

      _id: optimisticMenuEntry._id as Id<'products'>,

      name: optimisticMenuEntry.name,

      slug: optimisticMenuEntry.slug,

      description: optimisticMenuEntry.description,

      priceCents: optimisticMenuEntry.priceCents,

      currency: optimisticMenuEntry.currency,

      imageUrl: optimisticMenuEntry.imageUrl,

      imageWidth: optimisticMenuEntry.imageWidth,

      imageHeight: optimisticMenuEntry.imageHeight,

      mediaAspect: optimisticMenuEntry.mediaAspect,

    };

  }, [selectedProduct, productData, optimisticMenuEntry]);

  const shellProduct =

    selectedProduct ?? optimisticShellProduct ?? lastReadyRef.current?.product;

  const shellMerchant =
    merchant ??
    lastReadyRef.current?.merchant ??
    cachedMerchantRef.current;



  const favorited = useQuery(

    api.favorites.isFavorited,

    isSignedIn && selectedProduct?._id

      ? { productId: selectedProduct._id as Id<'products'> }

      : 'skip',

  );



  const findSimilarProducts = useAction(api.products.findSimilar);

  const findSimilarPlaces = useAction(api.platform.discovery.findSimilarPlaces);

  const extractHeroBackdropColor = useAction(api.platform.heroPalette.extractHeroBackdropColor);

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

  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const cartLines = useCartStore((s) => s.lines);



  const mediaAspect: MediaAspect = toMediaAspect(

    selectedProduct?.mediaAspect ??

      optimisticMenuEntry?.mediaAspect ??

      initialMediaAspect ??

      undefined,

  );

  const media: MediaItem | null = useMemo(() => {

    const imageUrl = selectedProduct?.imageUrl ?? optimisticMenuEntry?.imageUrl;

    if (!imageUrl) return null;

    return {

      uri: imageUrl,

      type: 'image',

      width:

        selectedProduct?.imageWidth ?? optimisticMenuEntry?.imageWidth ?? 1080,

      height:

        selectedProduct?.imageHeight ?? optimisticMenuEntry?.imageHeight ?? 1080,

      aspect: mediaAspect,

    };

  }, [selectedProduct, optimisticMenuEntry, mediaAspect]);

  const shellMedia = media ?? lastReadyRef.current?.media;

  const isStoryLayout = mediaAspect === 'story';

  const heroSlotHeight = useMemo(

    () => overlayHeroSlotHeight(mediaAspect),

    [mediaAspect],

  );

  const heroDisplayHeight = useMemo(

    () =>

      shellMedia

        ? overlayHeroSlotHeight(mediaAspect, shellMedia)

        : heroSlotHeight,

    [shellMedia, mediaAspect, heroSlotHeight],

  );

  const headerBottomY = insets.top + OVERLAY_HEADER_BODY;

  const chromeBandH = headerBottomY;

  const effectiveExpandedSheetH = SCREEN_HEIGHT - chromeBandH;

  const collapsedSheetH = useMemo(() => {

    if (activeTab === 'menu') {

      return menuTabCollapsedSheetHeight();

    }

    if (isStoryLayout) {
      return storyCollapsedPeekHeight();
    }

    return overlayCollapsedSheetHeight({

      mediaAspect,

      heroSlotHeight: heroDisplayHeight,

      headerBottomY,

    });

  }, [

    activeTab,

    mediaAspect,

    heroDisplayHeight,

    headerBottomY,

    isStoryLayout,

  ]);

  const heroBottomY =

    activeTab === 'menu'

      ? headerBottomY + menuCarouselDisplayHeight

      : isStoryLayout

        ? SCREEN_HEIGHT - collapsedSheetH

        : headerBottomY + heroDisplayHeight + 96;

  const collapsedOffset = Math.max(

    0,

    Number.isFinite(effectiveExpandedSheetH - collapsedSheetH)

      ? effectiveExpandedSheetH - collapsedSheetH

      : 0,

  );

  const prevCollapsedOffsetRef = useRef(collapsedOffset);

  const collapsedOffsetRef = useRef(collapsedOffset);

  const sheetTranslateY = useSharedValue(collapsedOffset);

  const collapsedOffsetSV = useSharedValue(collapsedOffset);

  const dragStartY = useSharedValue(0);

  const sheetScrollY = useSharedValue(0);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const nativeScrollGesture = useMemo(() => Gesture.Native(), []);

  const [heroTapEnabled, setHeroTapEnabled] = useState(true);

  const heroAnchorRef = useAnimatedRef<Animated.View>();

  const miniPlayerThumbRef = useAnimatedRef<Animated.View>();

  const morphTargetAnchorRef = useAnimatedRef<Animated.View>();

  const miniPlayerBarRef = useAnimatedRef<Animated.View>();

  const heroRectSV = useSharedValue<MorphRect>({ x: 0, y: 0, width: 0, height: 0 });

  const miniPlayerRectSV = useSharedValue<MorphRect>({ x: 0, y: 0, width: 0, height: 0 });

  const heroLayoutReady = useSharedValue(0);

  const miniPlayerLayoutReady = useSharedValue(0);

  const suppressMorphSV = useSharedValue(0);

  const contextMenuVisibleSV = useSharedValue(0);

  const gestureLockSV = useSharedValue(0);

  const expandHeroMorphOpacityStyle = useExpandHeroMorphOpacityStyle(
    sheetTranslateY,
    collapsedOffsetSV,
  );

  const heroBandFadeStyle = useHeroBandFadeStyle(sheetTranslateY, collapsedOffsetSV);

  const menuSidePeekHideStyle = useAnimatedStyle(() => {
    const collapsed = collapsedOffsetSV.value;
    if (collapsed <= 0) return { opacity: 1 };
    const expandProgress = Math.max(
      0,
      Math.min(1, 1 - sheetTranslateY.value / collapsed),
    );
    return {
      opacity: expandProgress > 0.05 ? 0 : 1,
    };
  });

  const menuHeroBandClipStyle = useAnimatedStyle(() => {
    const collapsed = collapsedOffsetSV.value;
    if (collapsed <= 0) return {};
    const expandProgress = Math.max(
      0,
      Math.min(1, 1 - sheetTranslateY.value / collapsed),
    );
    return {
      overflow: expandProgress > 0.05 ? ('hidden' as const) : ('visible' as const),
    };
  });

  const measureMorphRects = useCallback(() => {
    heroAnchorRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        heroRectSV.value = { x, y, width, height };
        heroLayoutReady.value = HERO_LAYOUT_READY;
      }
    });
    morphTargetAnchorRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        miniPlayerRectSV.value = { x, y, width, height };
        miniPlayerLayoutReady.value = HERO_LAYOUT_READY;
      }
    });
  }, [
    heroAnchorRef,
    morphTargetAnchorRef,
    heroRectSV,
    miniPlayerRectSV,
    heroLayoutReady,
    miniPlayerLayoutReady,
  ]);

  const heroSlotHeightSV = useSharedValue(heroDisplayHeight);



  useEffect(() => {

    setSlugStack([productSlug]);

    setMenuFocusSlug(productSlug);

    setActiveTab('product');

    const aspectForOpen = initialMediaAspect;

    setImageMode(
      aspectForOpen === 'story' ? 'minimized' : (initialImageMode ?? 'minimized'),
    );

    setShowImageOverlay(false);

    setContextMenuVisible(false);

    setShowGuestAuth(false);

  }, [productSlug, visible, initialImageMode, initialMediaAspect]);

  useEffect(() => {
    if (!visible) {
      heroLayoutReady.value = 0;
      miniPlayerLayoutReady.value = 0;
      return;
    }
    const timer = setTimeout(measureMorphRects, 120);
    return () => clearTimeout(timer);
  }, [visible, selectedSlug, heroDisplayHeight, measureMorphRects, heroLayoutReady, miniPlayerLayoutReady, isStoryLayout]);

  useEffect(() => {
    suppressMorphSV.value = showImageOverlay || showMenuHeroOverlay ? 1 : 0;
  }, [showImageOverlay, showMenuHeroOverlay, suppressMorphSV]);

  useAnimatedReaction(
    () => {
      const collapsed = collapsedOffsetSV.value;
      if (collapsed <= 0) return 0;
      return 1 - sheetTranslateY.value / collapsed;
    },
    (progress, prev) => {
      const inBand = progress >= 0.48 && progress <= 0.52;
      const prevInBand = prev !== null && prev >= 0.48 && prev <= 0.52;
      if (inBand && !prevInBand) {
        runOnJS(measureMorphRects)();
      }
    },
    [measureMorphRects],
  );

  useEffect(() => {
    if (!visible || activeTab !== 'menu') return;
    const timer = setTimeout(measureMorphRects, 80);
    return () => clearTimeout(timer);
  }, [visible, activeTab, menuFocusSlug, measureMorphRects]);

  useEffect(() => {
    if (!visible || activeTab !== 'product') return;
    const timer = setTimeout(measureMorphRects, 80);
    return () => clearTimeout(timer);
  }, [visible, activeTab, selectedSlug, measureMorphRects]);

  useEffect(() => {
    if (!visible || menuProducts.length === 0) return;
    void prefetchHeroBackdropPalettes(
      menuProducts.map((p) => p.imageUrl),
      extractHeroBackdropColor,
    );
  }, [visible, menuProducts, extractHeroBackdropColor]);

  useEffect(() => {
    if (activeTab !== 'menu' || menuProducts.length === 0) return;
    const focusIndex = menuProducts.findIndex((p) => p.slug === menuFocusSlug);
    if (focusIndex < 0) return;
    prefetchHeroBackdropNeighbors(
      menuProducts.map((p) => p.imageUrl ?? ''),
      focusIndex,
      extractHeroBackdropColor,
    );
  }, [activeTab, menuFocusSlug, menuProducts, extractHeroBackdropColor]);

  useAnimatedReaction(
    () => {
      const collapsed = collapsedOffsetSV.value;
      if (collapsed <= 0) return true;
      const expandProgress = 1 - sheetTranslateY.value / collapsed;
      return expandProgress < 0.02;
    },
    (allowed, prev) => {
      if (allowed !== prev) {
        runOnJS(setHeroTapEnabled)(allowed);
      }
    },
    [collapsedOffsetSV, sheetTranslateY],
  );



  useEffect(() => {

    if (!visible) return;

    if (productData === undefined || products === undefined) return;

    if (activeTab === 'menu') return;

    scrollTo(scrollRef, 0, 0, false);

    sheetScrollY.value = 0;

  }, [selectedSlug, scrollRef, visible, productData, products, sheetScrollY, activeTab]);



  useEffect(() => {

    if (!visible) return;

    if (selectedProduct && merchant && media) {

      lastReadyRef.current = { product: selectedProduct, merchant, media };

      cachedMerchantRef.current = merchant;

      overlayEverReadyRef.current = true;

    }

  }, [visible, selectedProduct, merchant, media]);

  useEffect(() => {

    if (visible) return;

    cachedMerchantRef.current = null;

    lockedCarouselSlotRef.current = null;

    lockedCarouselMerchantRef.current = null;

  }, [visible]);

  useEffect(() => {

    lockedCarouselSlotRef.current = null;

    lockedCarouselMerchantRef.current = null;

  }, [merchantSlug]);



  useEffect(() => {

    if (!visible) return;

    if (productData === undefined) {

      if (getProductFetchStartedRef.current === null) {

        getProductFetchStartedRef.current = Date.now();

      }

      return;

    }

    if (getProductFetchStartedRef.current !== null) {

      discoverLog('overlay', 'getProductFetch', {

        merchantSlug,

        slug: selectedSlug,

        durationMs: Date.now() - getProductFetchStartedRef.current,

        activeTab,

      });

      getProductFetchStartedRef.current = null;

    }

  }, [visible, productData, selectedSlug, activeTab, merchantSlug]);



  useEffect(() => {

    if (!visible || !optimisticShellProduct || productData !== undefined) return;

    discoverLog('overlay', 'menuOptimisticShell', {

      merchantSlug,

      slug: selectedSlug,

      name: optimisticShellProduct.name,

    });

  }, [visible, optimisticShellProduct, productData, selectedSlug, merchantSlug]);



  useEffect(() => {

    if (!visible || !pendingListProductSnapRef.current || activeTab !== 'product') {

      return;

    }

    pendingListProductSnapRef.current = false;

    sheetTranslateY.value = withSpring(collapsedOffset, SHEET_SPRING);

    scrollTo(scrollRef, 0, 0, false);

    sheetScrollY.value = 0;

  }, [

    visible,

    activeTab,

    selectedSlug,

    collapsedOffset,

    sheetTranslateY,

    scrollRef,

    sheetScrollY,

  ]);



  useEffect(() => {

    if (!visible) return;

    if (

      (productData === undefined || products === undefined) &&

      !overlayEverReadyRef.current

    ) {

      discoverLog('overlay', 'overlayShellGate', {

        merchantSlug,

        reason:

          productData === undefined ? 'productDataUndefined' : 'productsUndefined',

        activeTab,

        menuFocusSlug,

        selectedSlug,

        hadPreviousReady: overlayEverReadyRef.current,

      });

    }

  }, [

    visible,

    productData,

    products,

    activeTab,

    menuFocusSlug,

    selectedSlug,

    merchantSlug,

  ]);



  useEffect(() => {

    if (!visible || activeTab !== 'menu') return;

    discoverLog('overlay', 'menuGeometry', {

      merchantSlug,

      peekRatio: MENU_QUEUE_PEEK_RATIO,

      collapsedSheetH,

      carouselBandH: menuCarouselDisplayHeight,

      maxFrameH: maxMenuCarouselHeroHeight,

      carouselFrameSlotH: menuCarouselFrameSlotH,

      collapsedOffset,

      menuFocusSlug,

      selectedSlug,

    });

  }, [

    visible,

    activeTab,

    collapsedSheetH,

    menuCarouselDisplayHeight,

    maxMenuCarouselHeroHeight,

    menuCarouselFrameSlotH,

    collapsedOffset,

    menuFocusSlug,

    selectedSlug,

    merchantSlug,

  ]);



  useEffect(() => {

    collapsedOffsetSV.value = collapsedOffset;

    collapsedOffsetRef.current = collapsedOffset;

  }, [collapsedOffset, collapsedOffsetSV]);



  useEffect(() => {

    if (!visible) {

      hasOpenedRef.current = false;

      return;

    }

    if (hasOpenedRef.current) return;

    if (!selectedProduct && !initialMediaAspect) return;

    hasOpenedRef.current = true;

    const snapConfig = getSheetSnapPoints(mediaAspect);

    const targetOffset = snapConfig.expandedPreferred ? 0 : collapsedOffset;

    sheetTranslateY.value = collapsedOffset;

    sheetTranslateY.value = withSpring(targetOffset, SHEET_SPRING, (finished) => {
      if (finished && targetOffset === collapsedOffset) {
        runOnJS(logOverlay)('sheetPeekLayout', {
          merchantFooterVisible: true,
          collapsedSheetH,
          peekTitleVisible: true,
          contentFlow: true,
          staticContent: true,
          contentTransforms: false,
          pinnedFooter: false,
        });
      }
    });

    prevCollapsedOffsetRef.current = collapsedOffset;

    discoverLog('overlay', 'sheetOpenSnap', {

      merchantSlug,

      productSlug: selectedSlug,

      mediaAspect,

      expandedPreferred: snapConfig.expandedPreferred,

      targetOffset,

      collapsedOffset,

      collapsedSheetH,

      heroSlotHeight: heroDisplayHeight,

      headerBottomY,

      heroBottomY,

      maxSheetH: SCREEN_HEIGHT - heroBottomY - 12,

    });

  }, [

    visible,

    selectedProduct,

    initialMediaAspect,

    collapsedOffset,

    mediaAspect,

    sheetTranslateY,

    merchantSlug,

    selectedSlug,

    collapsedSheetH,

    heroDisplayHeight,

    headerBottomY,

    heroBottomY,

  ]);



  const prevSelectedSlugRef = useRef(selectedSlug);

  const prevActiveTabRef = useRef(activeTab);

  const prevMediaAspectRef = useRef(mediaAspect);

  const storyCardBottomInset = insets.bottom + 16;



  useEffect(() => {

    if (!visible || !hasOpenedRef.current) return;

    if (isDraggingRef.current) return;

    if (!shellProduct || !shellMedia) return;

    const tabChanged = prevActiveTabRef.current !== activeTab;

    const slugChanged = prevSelectedSlugRef.current !== selectedSlug;

    const menuFocusChanged = prevMenuFocusSlugRef.current !== menuFocusSlug;

    const aspectChanged =

      prevMediaAspectRef.current !== mediaAspect && activeTab !== 'menu';

    const offsetChanged = Math.abs(prevCollapsedOffsetRef.current - collapsedOffset) > 1;

    if (

      activeTab === 'menu' &&

      menuFocusChanged &&

      !tabChanged &&

      !slugChanged

    ) {

      prevMenuFocusSlugRef.current = menuFocusSlug;

      discoverLog('overlay', 'menuSlugChangePolicy', {

        merchantSlug,

        menuFocusSlug,

        selectedSlug,

        skippedHasOpenedReset: true,

        skippedSheetSnap: true,

        skippedGetProduct: true,

      });

      return;

    }

    prevActiveTabRef.current = activeTab;

    prevMediaAspectRef.current = mediaAspect;

    prevMenuFocusSlugRef.current = menuFocusSlug;

    if (!tabChanged && !slugChanged && !aspectChanged && !offsetChanged) {

      prevCollapsedOffsetRef.current = collapsedOffset;

      return;

    }

    if (slugChanged || aspectChanged) {

      hasOpenedRef.current = false;

      setShowImageOverlay(false);

      setImageMode('minimized');

      if (activeTab !== 'menu') {

        scrollTo(scrollRef, 0, 0, false);

        sheetScrollY.value = 0;

      }

    }

    prevSelectedSlugRef.current = selectedSlug;

    prevCollapsedOffsetRef.current = collapsedOffset;

    collapsedOffsetSV.value = collapsedOffset;

    sheetTranslateY.value = collapsedOffset;

    const reason = tabChanged

      ? 'tabChange'

      : slugChanged

        ? 'slugChange'

        : aspectChanged

          ? 'aspectChange'

          : 'offsetChange';

    discoverLog('overlay', 'sheetResync', {

      merchantSlug,

      productSlug: selectedSlug,

      activeTab,

      mediaAspect,

      collapsedOffset,

      sheetTranslateY: sheetTranslateY.value,

      reason,

    });

    const timer = setTimeout(measureMorphRects, 80);

    return () => clearTimeout(timer);

  }, [

    visible,

    activeTab,

    selectedSlug,

    menuFocusSlug,

    mediaAspect,

    collapsedOffset,

    shellProduct,

    shellMedia,

    sheetTranslateY,

    collapsedOffsetSV,

    scrollRef,

    sheetScrollY,

    measureMorphRects,

    menuFocusSlug,

    merchantSlug,

  ]);



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



  useEffect(() => {

    heroSlotHeightSV.value = heroDisplayHeight;

  }, [heroDisplayHeight, heroSlotHeightSV]);



  const logOverlay = useCallback(

    (step: string, extra?: Record<string, unknown>) => {

      const collapsed = collapsedOffset;

      const sheetY = sheetTranslateY.value;

      const expandProgress =

        collapsed > 0

          ? Math.max(0, Math.min(1, 1 - sheetY / collapsed))

          : 0;

      discoverLog('overlay', step, {

        merchantSlug,

        productSlug: selectedSlug,

        rootProductSlug: productSlug,

        activeTab,

        imageMode,

        mediaAspect,

        heroSlotHeight: heroDisplayHeight,

        collapsedSheetH,

        collapsedOffset: collapsed,

        sheetTranslateY: sheetY,

        expandProgress: Number(expandProgress.toFixed(3)),

        slugStackDepth: slugStack.length,

        hasProduct: !!selectedProduct,

        hasMerchant: !!merchant,

        hasMedia: !!media,

        ...extra,

      });

    },

    [

      merchantSlug,

      selectedSlug,

      productSlug,

      activeTab,

      imageMode,

      mediaAspect,

      heroDisplayHeight,

      collapsedSheetH,

      collapsedOffset,

      sheetTranslateY,

      slugStack.length,

      selectedProduct,

      merchant,

      media,

    ],

  );

  useEffect(() => {
    if (!visible) return;
    logOverlay('heroOverlayStack', {
      showImageOverlay,
      heroWrapZIndex: showImageOverlay ? 55 : 45,
    });
  }, [showImageOverlay, visible, logOverlay]);

  useEffect(() => {
    if (imageMode !== 'minimized' || !visible) return;
    logOverlay('imageModeMinimized');
  }, [imageMode, visible, logOverlay]);



  useEffect(() => {

    if (!visible) {

      discoverLog('overlay', 'hidden', { merchantSlug, productSlug });

      return;

    }

    discoverLog('overlay', 'visible', { merchantSlug, productSlug });

  }, [visible, merchantSlug, productSlug]);



  useEffect(() => {

    if (!visible) return;

    if (productData === undefined || products === undefined) {

      if (!overlayEverReadyRef.current) {

        discoverLog('overlay', 'loading', { merchantSlug, productSlug: selectedSlug });

      }

      return;

    }

    if (!shellProduct || !shellMerchant || !shellMedia) {

      discoverLog('overlay', 'productMissing', {

        merchantSlug,

        productSlug: selectedSlug,

        hasProduct: !!shellProduct,

        hasMerchant: !!shellMerchant,

        hasMedia: !!shellMedia,

      });

      return;

    }

    logOverlay('productReady');

    lastChromeCrossfadeRef.current = 'controls';

    discoverLog('overlay', 'chromeCrossfade', {

      merchantSlug,

      productSlug: selectedSlug,

      mode: 'controls',

      expandProgress: 0,

    });

  }, [

    visible,

    productData,

    products,

    selectedProduct,

    merchant,

    media,

    merchantSlug,

    selectedSlug,

    logOverlay,

  ]);



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



  const cartProductId = String(

    (activeTab === 'menu' && menuFocusProduct

      ? menuFocusProduct._id

      : selectedProduct?._id) ?? '',

  );

  const inCart = cartLines.some((l) => l.productId === cartProductId);

  const cartQuantity = useMemo(() => {

    const line = cartLines.find((l) => l.productId === cartProductId);

    return line?.quantity ?? 0;

  }, [cartLines, cartProductId]);

  const merchantItemCount = useMemo(

    () =>

      cartLines

        .filter((l) => l.merchantSlug === merchantSlug)

        .reduce((sum, line) => sum + line.quantity, 0),

    [cartLines, merchantSlug],

  );

  const armViewCartBar = useCallback(() => {

    setViewCartBarArmed(true);

  }, []);

  useEffect(() => {

    if (!visible) {

      setViewCartBarArmed(false);

      setViewCartBarVisible(false);

      return;

    }

    if (!viewCartBarArmed || merchantItemCount <= 0) {

      setViewCartBarVisible(false);

      return;

    }

    const timer = setTimeout(() => {

      setViewCartBarVisible(true);

      discoverLog('overlay', 'viewCartShow', {

        merchantSlug,

        merchantItemCount,

      });

    }, 3000);

    return () => clearTimeout(timer);

  }, [visible, viewCartBarArmed, merchantItemCount, merchantSlug]);



  const promptGuestAuth = useCallback(() => {

    setShowGuestAuth(true);

    setShowImageOverlay(false);

    setContextMenuVisible(false);

  }, []);



  const syncMenuFocusToSelected = useCallback(

    (reason: 'productTab' | 'heroMaximize' | 'addCart') => {

      if (menuFocusSlug === selectedSlug) return;

      discoverLog('overlay', 'menuSlugSync', {

        merchantSlug,

        slug: menuFocusSlug,

        fromSlug: selectedSlug,

        reason,

      });

      setSlugStack((prev) => {

        if (prev[prev.length - 1] === menuFocusSlug) return prev;

        return [...prev.slice(0, -1), menuFocusSlug];

      });

    },

    [menuFocusSlug, selectedSlug, merchantSlug],

  );



  const handleAddCart = useCallback(() => {

    const cartProduct =

      activeTab === 'menu' && menuFocusProduct

        ? menuFocusProduct

        : selectedProduct;

    const cartMerchant = merchant ?? shellMerchant;

    if (!cartProduct || !cartMerchant) return;

    if (activeTab === 'menu') {

      syncMenuFocusToSelected('addCart');

    }

    if (!isSignedIn) {

      promptGuestAuth();

      return;

    }

    addLine({

      productId: String(cartProduct._id),

      merchantSlug,

      merchantName: cartMerchant.name,

      name: cartProduct.name,

      description: cartProduct.description,

      imageUrl: cartProduct.imageUrl ?? undefined,

      priceCents: cartProduct.priceCents,

      currency: cartProduct.currency,

    });

    setShowImageOverlay(false);

    armViewCartBar();

  }, [

    activeTab,

    menuFocusProduct,

    selectedProduct,

    merchant,

    shellMerchant,

    merchantSlug,

    addLine,

    isSignedIn,

    promptGuestAuth,

    armViewCartBar,

    syncMenuFocusToSelected,

  ]);

  const handleIncrementCart = useCallback(() => {

    if (!selectedProduct?._id) return;

    if (!isSignedIn) {

      promptGuestAuth();

      return;

    }

    if (cartQuantity === 0) {

      handleAddCart();

      return;

    }

    updateQuantity(String(selectedProduct._id), cartQuantity + 1);

    armViewCartBar();

  }, [

    selectedProduct?._id,

    cartQuantity,

    isSignedIn,

    promptGuestAuth,

    updateQuantity,

    handleAddCart,

    armViewCartBar,

  ]);

  const handleDecrementCart = useCallback(() => {

    if (!selectedProduct?._id) return;

    if (!isSignedIn) {

      promptGuestAuth();

      return;

    }

    if (cartQuantity <= 1) {

      removeLine(String(selectedProduct._id));

    } else {

      updateQuantity(String(selectedProduct._id), cartQuantity - 1);

    }

  }, [

    selectedProduct?._id,

    cartQuantity,

    isSignedIn,

    promptGuestAuth,

    removeLine,

    updateQuantity,

  ]);

  const handleFollow = useCallback(() => {

    setIsFollowing((v) => !v);

    discoverLog('overlay', 'followToggle', {

      merchantSlug,

      following: !isFollowing,

    });

  }, [merchantSlug, isFollowing]);

  const handleViewCart = useCallback(() => {

    discoverLog('overlay', 'viewCartTap', {

      merchantSlug,

      merchantItemCount,

    });

    if (dismissible) onDismiss();

    router.push({

      pathname: '/(tabs)/business/[businessId]/cart',

      params: { businessId: merchantSlug },

    });

  }, [merchantSlug, merchantItemCount, dismissible, onDismiss, router]);



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

    setContextMenuVisible(false);

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

      setContextMenuVisible(false);

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



  const pushProduct = useCallback(

    (slug: string) => {

      discoverLog('overlay', 'menuProductSelect', {

        merchantSlug,

        fromSlug: selectedSlug,

        toSlug: slug,

        activeTab,

        slugStackDepth: slugStack.length,

      });

      setSlugStack((prev) => {

        if (prev[prev.length - 1] === slug) return prev;

        return [...prev, slug];

      });

      setActiveTab('product');

      setImageMode('minimized');

      setShowImageOverlay(false);

      sheetTranslateY.value = withSpring(collapsedOffset, SHEET_SPRING);

      scrollTo(scrollRef, 0, 0, false);

      sheetScrollY.value = 0;

    },

    [

      merchantSlug,

      selectedSlug,

      activeTab,

      slugStack.length,

      collapsedOffset,

      sheetTranslateY,

      scrollRef,

      sheetScrollY,

    ],

  );

  const handleMenuFilterChange = useCallback(

    (payload: {

      chip: string;

      categoryId: string | null;

      filteredCount: number;

      totalProducts: number;

    }) => {

      discoverLog('overlay', 'menuCategoryFilter', {

        merchantSlug,

        chip: payload.chip,

        categoryId: payload.categoryId,

        filteredCount: payload.filteredCount,

        totalProducts: payload.totalProducts,

        activeTab,

      });

    },

    [merchantSlug, activeTab],

  );

  const handleMenuHeroToggleOverlay = useCallback(() => {
    setShowMenuHeroOverlay((v) => {
      const next = !v;
      discoverLog('overlay', 'heroOverlayStack', {
        merchantSlug,
        productSlug: menuFocusSlug,
        showMenuHeroOverlay: next,
        activeTab,
      });
      return next;
    });
  }, [merchantSlug, menuFocusSlug, activeTab]);

  const handleMenuHeroMaximize = useCallback(() => {

    discoverLog('overlay', 'menuHeroMaximize', {

      merchantSlug,

      productSlug: menuFocusSlug,

      activeTab,

    });

    syncMenuFocusToSelected('heroMaximize');

    setShowMenuHeroOverlay(false);

    setImageMode('expanded');

  }, [merchantSlug, menuFocusSlug, activeTab, syncMenuFocusToSelected]);

  const handleSelectSimilarPlace = useCallback(

    (slug: string) => {

      discoverLog('overlay', 'similarPlaceTap', {

        merchantSlug,

        placeSlug: slug,

        note: 'placeNavigationNotImplemented',

      });

    },

    [merchantSlug],

  );



  const handleTabChange = useCallback(

    (tab: 'product' | 'menu') => {

      if (tab === activeTab) return;

      setShowMenuHeroOverlay(false);

      logOverlay('tabChange', { fromTab: activeTab, toTab: tab });

      if (tab === 'menu') {

        setMenuFocusSlug(selectedSlug);

        discoverLog('overlay', 'menuTabOpen', {

          merchantSlug,

          productSlug: selectedSlug,

          menuFocusSlug: selectedSlug,

          menuProductCount: menuProducts.length,

        });

        discoverLog('overlay', 'menuCarouselLayout', {

          merchantSlug,

          slotH: menuCarouselFrameSlotH,

          locked: lockedCarouselSlotRef.current !== null,

          selectedSlug,

          centerFrameH: menuCarouselFrameSlotH,

          sideScaleMode: 'transform',

          source: 'menuTabOpen',

        });

        requestAnimationFrame(() => measureMorphRects());

      }

      if (tab === 'product') {

        syncMenuFocusToSelected('productTab');

      }

      setActiveTab(tab);

    },

    [

      activeTab,

      logOverlay,

      merchantSlug,

      selectedSlug,

      menuProducts.length,

      menuCarouselFrameSlotH,

      syncMenuFocusToSelected,

      measureMorphRects,

    ],

  );



  useEffect(() => {

    if (!visible) return;

    logOverlay('stateChange', { trigger: 'activeTab' });

  }, [activeTab, visible, logOverlay]);



  useEffect(() => {

    if (!visible) return;

    logOverlay('stateChange', { trigger: 'imageMode' });

  }, [imageMode, visible, logOverlay]);



  const dismissOverlay = useCallback(() => {

    logOverlay('dismiss');

    if (dismissible) onDismiss();

  }, [dismissible, onDismiss, logOverlay]);



  const closeContextMenu = useCallback(

    (source: 'backdrop' | 'menuChevron' | 'back') => {

      if (source === 'back') {

        backConsumedRef.current = true;

      }

      gestureLockUntilRef.current = Date.now() + 250;

      gestureLockSV.value = 1;

      setTimeout(() => {

        gestureLockSV.value = 0;

      }, 250);

      contextMenuVisibleRef.current = false;

      logOverlay('contextMenuClose', { source });

      setContextMenuVisible(false);

    },

    [logOverlay, gestureLockSV],

  );



  const getExpandProgress = useCallback(() => {

    const collapsed = collapsedOffsetRef.current;

    if (collapsed <= 0) return 0;

    const raw = 1 - sheetTranslateY.value / collapsed;

    return Math.max(0, Math.min(1, raw));

  }, [sheetTranslateY]);



  const snapToCollapsed = useCallback(() => {

    logOverlay('snapToCollapsed');

    if (activeTabRef.current === 'menu') {

      discoverLog('overlay', 'menuQueuePeek', {

        merchantSlug,

        productSlug: menuFocusSlug,

        menuFocusSlug,

      });

    }

    sheetTranslateY.value = withSpring(

      collapsedOffset,

      SHEET_SPRING,

      (finished) => {

        if (finished) {

          runOnJS(logOverlay)('sheetSnapComplete', { targetY: collapsedOffset });

          runOnJS(logOverlay)('sheetPeekLayout', {
            merchantFooterVisible: true,
            collapsedSheetH,
            peekTitleVisible: true,
            contentFlow: true,
            staticContent: true,
            contentTransforms: false,
            pinnedFooter: false,
          });

          runOnJS(measureMorphRects)();

        }

      },

    );

  }, [collapsedOffset, collapsedSheetH, sheetTranslateY, logOverlay, measureMorphRects, merchantSlug, menuFocusSlug]);



  const snapToExpanded = useCallback(() => {

    logOverlay('snapToExpanded');

    if (activeTabRef.current === 'menu') {

      discoverLog('overlay', 'menuQueueExpanded', {

        merchantSlug,

        productSlug: selectedSlug,

      });

    }

    setShowImageOverlay(false);

    sheetTranslateY.value = withSpring(0, SHEET_SPRING, (finished) => {

      if (finished) {

        runOnJS(logOverlay)('sheetSnapComplete', { targetY: 0 });

        runOnJS(measureMorphRects)();

      }

    });

  }, [sheetTranslateY, logOverlay, measureMorphRects, merchantSlug, selectedSlug]);



  const focusMenuProduct = useCallback(

    (slug: string, trigger: 'list' | 'carousel') => {

      const fromSlug = menuFocusSlug;

      const expandProgress = getExpandProgress();

      const sheetExpanded = expandProgress >= 0.15;

      if (slug === menuFocusSlug) {

        if (trigger === 'list' && sheetExpanded) {

          discoverLog('overlay', 'menuListSelect', {

            merchantSlug,

            fromSlug,

            toSlug: slug,

            activeTab,

            sameItem: true,

            peekRefocus: true,

          });

          snapToCollapsed();

        }

        return;

      }

      discoverLog('overlay', 'menuFocusChange', {

        merchantSlug,

        from: fromSlug,

        to: slug,

        trigger,

        peekRefocus: trigger === 'list' && sheetExpanded,

      });

      discoverLog('overlay', 'menuListSelect', {

        merchantSlug,

        fromSlug,

        toSlug: slug,

        activeTab,

        trigger,

        peekRefocus: trigger === 'list' && sheetExpanded,

        stayedOnMenuTab: true,

      });

      setMenuFocusSlug(slug);

      setShowImageOverlay(false);

      setShowMenuHeroOverlay(false);

      if (trigger === 'list' && sheetExpanded) {

        snapToCollapsed();

      }

    },

    [

      merchantSlug,

      menuFocusSlug,

      activeTab,

      getExpandProgress,

      snapToCollapsed,

    ],

  );



  const handleMenuCarouselSelect = useCallback(

    (slug: string) => {

      if (slug === menuFocusSlug) return;

      discoverLog('overlay', 'menuCarouselSelect', {

        merchantSlug,

        fromSlug: menuFocusSlug,

        toSlug: slug,

        activeTab,

      });

      discoverLog('overlay', 'menuCarouselLayout', {

        merchantSlug,

        slotH: menuCarouselFrameSlotH,

        locked: lockedCarouselSlotRef.current !== null,

        selectedSlug: slug,

        centerFrameH: menuCarouselFrameSlotH,

        sideScaleMode: 'transform',

        source: 'carouselSelect',

      });

      discoverLog('overlay', 'menuSlugChangePolicy', {

        merchantSlug,

        menuFocusSlug: slug,

        selectedSlug,

        skippedHasOpenedReset: true,

        skippedSheetSnap: true,

        skippedGetProduct: true,

      });

      focusMenuProduct(slug, 'carousel');

    },

    [

      merchantSlug,

      menuFocusSlug,

      selectedSlug,

      activeTab,

      menuCarouselFrameSlotH,

      focusMenuProduct,

    ],

  );



  const handleMenuListSelect = useCallback(

    (slug: string) => {

      focusMenuProduct(slug, 'list');

    },

    [focusMenuProduct],

  );



  const resolveBackAction = useCallback(() => {

    logOverlay('resolveBackAction', { trigger: 'invoked' });

    if (backConsumedRef.current) {

      backConsumedRef.current = false;

      logOverlay('resolveBackAction', { action: 'consumedCascade' });

      return;

    }

    if (imageMode === 'expanded') {

      setImageMode('minimized');

      logOverlay('resolveBackAction', { action: 'collapseExpandedImage' });

      return;

    }

    if (contextMenuVisibleRef.current) {

      closeContextMenu('back');

      logOverlay('resolveBackAction', { action: 'closeContextMenu' });

      return;

    }

    if (showMenuHeroOverlay) {

      setShowMenuHeroOverlay(false);

      logOverlay('resolveBackAction', { action: 'closeMenuHeroOverlay' });

      return;

    }

    const expandProgress = getExpandProgress();

    if (expandProgress > 0.15) {

      logOverlay('resolveBackAction', {

        action: 'snapToCollapsed',

        expandProgress: Number(expandProgress.toFixed(3)),

      });

      snapToCollapsed();

      return;

    }

    if (activeTab === 'menu') {

      logOverlay('resolveBackAction', { action: 'menuToProduct' });

      setActiveTab('product');

      return;

    }

    if (slugStack.length > 1) {

      logOverlay('resolveBackAction', { action: 'popSlug', depth: slugStack.length });

      setSlugStack((prev) => prev.slice(0, -1));

      setImageMode('minimized');

      setShowImageOverlay(false);

      return;

    }

    if (showImageOverlay) {

      setShowImageOverlay(false);

      logOverlay('resolveBackAction', { action: 'closeImageOverlay' });

      return;

    }

    logOverlay('resolveBackAction', { action: 'dismiss' });

    dismissOverlay();

  }, [

    imageMode,

    activeTab,

    slugStack.length,

    showImageOverlay,

    showMenuHeroOverlay,

    logOverlay,

    dismissOverlay,

    getExpandProgress,

    snapToCollapsed,

    closeContextMenu,

  ]);



  useEffect(() => {

    if (!visible || !backActionRef) return;

    backActionRef.current = resolveBackAction;

  }, [visible, backActionRef, resolveBackAction]);



  useEffect(() => {

    if (!visible) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {

      resolveBackAction();

      return true;

    });

    return () => subscription.remove();

  }, [visible, resolveBackAction]);



  const handleChevronPress = useCallback(() => {

    if (Date.now() < gestureLockUntilRef.current) {

      logOverlay('chevronNoOp', { reason: 'gestureLock' });

      return;

    }

    const expandProgress = getExpandProgress();

    logOverlay('chevronBackPress', {

      expandProgress: Number(expandProgress.toFixed(3)),

      slugStackDepth: slugStack.length,

      showImageOverlay,

      sheetTranslateY: sheetTranslateY.value,

      collapsedOffset,

    });

    resolveBackAction();

  }, [
    getExpandProgress,
    logOverlay,
    resolveBackAction,
    slugStack.length,
    showImageOverlay,
    sheetTranslateY,
    collapsedOffset,
  ]);



  const markDragging = useCallback((dragging: boolean) => {

    isDraggingRef.current = dragging;

  }, []);



  const logPanBegin = useCallback(

    (startY: number, collapsed: number, zone: 'hero' | 'sheet') => {

      discoverLog('overlay', zone === 'hero' ? 'heroPanBegin' : 'panBegin', {

        merchantSlug,

        productSlug: selectedSlug,

        startY,

        collapsed,

        zone,

      });

    },

    [merchantSlug, selectedSlug],

  );



  const logPanUpdate = useCallback(

    (translationY: number, sheetY: number, collapsed: number) => {

      const now = Date.now();

      if (now - lastPanLogAtRef.current < 100) return;

      lastPanLogAtRef.current = now;

      const expandProgress =

        collapsed > 0

          ? Number(

              Math.max(0, Math.min(1, 1 - sheetY / collapsed)).toFixed(3),

            )

          : 0;

      discoverLog('overlay', 'panUpdate', {

        merchantSlug,

        productSlug: selectedSlug,

        translationY,

        sheetTranslateY: sheetY,

        collapsed,

        expandProgress,

      });

      const mode: 'controls' | 'miniPlayer' =
        expandProgress >= HEADER_MINI_FADE_IN_START ? 'miniPlayer' : 'controls';

      if (expandProgress < 0.01) {
        lastMorphMilestoneRef.current = -1;
      }

      for (const milestone of HERO_MORPH_TELEMETRY_MILESTONES) {
        if (
          expandProgress >= milestone &&
          lastMorphMilestoneRef.current < milestone
        ) {
          lastMorphMilestoneRef.current = milestone;
          const hero = heroRectSV.value;
          const thumb = miniPlayerRectSV.value;
          discoverLog('overlay', 'heroMorphFrame', {
            merchantSlug,
            productSlug: activeTab === 'menu' ? menuFocusSlug : selectedSlug,
            activeTab,
            expandProgress,
            milestone,
            morphActive:
              expandProgress >= MORPH_START && expandProgress <= MORPH_END,
            heroRect: {
              x: Math.round(hero.x),
              y: Math.round(hero.y),
              w: Math.round(hero.width),
              h: Math.round(hero.height),
            },
            thumbRect: {
              x: Math.round(thumb.x),
              y: Math.round(thumb.y),
              w: Math.round(thumb.width),
              h: Math.round(thumb.height),
            },
            morphOpacity: Number(morphLayerOpacityJs(expandProgress).toFixed(3)),
            sourceOpacity: Number(sourceHeroMorphOpacityJs(expandProgress).toFixed(3)),
            inlineThumbOpacity: Number(
              inlineThumbPeekOpacityJs(expandProgress).toFixed(3),
            ),
            headerThumbOpacity: Number(
              headerThumbHandoffOpacityJs(expandProgress).toFixed(3),
            ),
            handoffT: Number(morphHandoffTJs(expandProgress).toFixed(3)),
          });
          break;
        }
      }

      if (lastChromeCrossfadeRef.current !== mode) {

        lastChromeCrossfadeRef.current = mode;

        discoverLog('overlay', 'chromeCrossfade', {

          merchantSlug,

          productSlug: selectedSlug,

          mode,

          expandProgress,

        });

        if (activeTab === 'product') {
          discoverLog('overlay', 'productSheetExpand', {
            merchantSlug,
            productSlug: selectedSlug,
            expandProgress,
            morphActive:
              expandProgress >= MORPH_START && expandProgress <= MORPH_END,
            inlineOpacity:
              expandProgress <= INLINE_FADE_OUT_START
                ? 1
                : expandProgress >= INLINE_FADE_OUT_END
                  ? 0
                  : 'crossfade',
            headerOpacity:
              expandProgress >= HEADER_MINI_FADE_IN_END
                ? 1
                : expandProgress <= HEADER_MINI_FADE_IN_START
                  ? 0
                  : 'crossfade',
          });
        }

        discoverLog('overlay', 'menuMiniPlayerTransition', {
          merchantSlug,
          productSlug: activeTab === 'menu' ? menuFocusSlug : selectedSlug,
          activeTab,
          expandProgress,
          inlineOpacity:
            expandProgress <= INLINE_FADE_OUT_START
              ? 1
              : expandProgress >= INLINE_FADE_OUT_END
                ? 0
                : 'crossfade',
          headerOpacity:
            expandProgress >= HEADER_MINI_FADE_IN_END
              ? 1
              : expandProgress <= HEADER_MINI_FADE_IN_START
                ? 0
                : 'crossfade',
          morphActive: expandProgress >= MORPH_START && expandProgress <= MORPH_END,
        });

      }

      if (activeTab === 'menu') {
        const sheetTop = SCREEN_HEIGHT - effectiveExpandedSheetH + sheetY;
        discoverLog('overlay', 'menuSheetLip', {
          merchantSlug,
          productSlug: menuFocusSlug,
          sheetTop: Math.round(sheetTop),
          visibleHeight: Math.round(Math.max(0, SCREEN_HEIGHT - sheetTop)),
          peekRatio: MENU_QUEUE_PEEK_RATIO,
          expandProgress,
        });
      }

    },

    [merchantSlug, selectedSlug, menuFocusSlug, activeTab, effectiveExpandedSheetH],

  );



  const logPanBlockedAlreadyExpanded = useCallback(() => {

    discoverLog('overlay', 'panBlockedAlreadyExpanded', {

      merchantSlug,

      productSlug: selectedSlug,

    });

  }, [merchantSlug, selectedSlug]);



  const logEdgeSwipeFired = useCallback(

    (translationX: number, velocityX: number) => {

      const expandProgress = getExpandProgress();

      discoverLog('overlay', 'edgeSwipeFired', {

        merchantSlug,

        productSlug: selectedSlug,

        translationX,

        velocityX,

        expandProgress: Number(expandProgress.toFixed(3)),

      });

      discoverLog('overlay', 'edgeSwipeBack', {

        merchantSlug,

        productSlug: selectedSlug,

        expandProgress: Number(expandProgress.toFixed(3)),

      });

    },

    [merchantSlug, selectedSlug, getExpandProgress],

  );



  const handlePanEnd = useCallback(

    (

      translationY: number,

      velocityY: number,

      currentPosition: number,

      zone: 'hero' | 'sheet',

    ) => {

      if (contextMenuVisibleRef.current) {

        isDraggingRef.current = false;

        return;

      }

      if (Date.now() < gestureLockUntilRef.current) {

        isDraggingRef.current = false;

        return;

      }

      isDraggingRef.current = false;

      const collapsed = collapsedOffsetRef.current;

      const expandProgress = Math.max(

        0,

        Math.min(1, collapsed > 0 ? 1 - currentPosition / collapsed : 0),

      );

      const atCollapsedSnap = Math.abs(currentPosition - collapsed) <= 12;

      const mid = collapsed / 2;

      const fastUp = velocityY < -500;

      const fastDown = velocityY > 500;

      let decision = 'snapToCollapsed';



      if (fastUp || translationY < -40 || currentPosition < mid) {

        snapToExpanded();

        decision = 'snapToExpanded';

      } else if (fastDown || translationY > 80) {

        if (activeTabRef.current === 'menu' && translationY > 80) {

          snapToCollapsed();

          setActiveTab('product');

          decision = 'menuSwipeToProductTab';

        } else if (expandProgress > 0.15 || !atCollapsedSnap) {

          snapToCollapsed();

          decision = 'snapToCollapsed';

          discoverLog('overlay', 'sheetPanCollapse', {

            merchantSlug,

            productSlug: selectedSlug,

            expandProgress: Number(expandProgress.toFixed(3)),

            currentPosition,

            translationY,

            atCollapsedSnap,

            zone,

          });

        } else {

          dismissOverlay();

          decision = 'dismiss';

          discoverLog('overlay', 'sheetPanDismiss', {

            merchantSlug,

            productSlug: selectedSlug,

            expandProgress: Number(expandProgress.toFixed(3)),

            currentPosition,

            translationY,

            atCollapsedSnap,

            zone,

          });

        }

      } else {

        snapToCollapsed();

      }

      discoverLog('overlay', 'panDecisionTrace', {

        merchantSlug,

        productSlug: selectedSlug,

        branch: decision,

        fastDown,

        fastUp,

        atCollapsedSnap,

        expandProgress: Number(expandProgress.toFixed(3)),

        currentPosition,

        collapsed,

        translationY,

        zone,

      });

      if (zone === 'hero') {

        discoverLog('overlay', 'heroPanEnd', {

          merchantSlug,

          productSlug: selectedSlug,

          zone,

          decision,

          expandProgress: Number(expandProgress.toFixed(3)),

        });

      }

      discoverLog('overlay', 'panEnd', {

        merchantSlug,

        productSlug: selectedSlug,

        activeTab: activeTabRef.current,

        translationY,

        velocityY,

        currentPosition,

        collapsed,

        expandProgress: Number(expandProgress.toFixed(3)),

        atCollapsedSnap,

        decision,

        zone,

      });

      measureMorphRects();

    },

    [dismissOverlay, snapToCollapsed, snapToExpanded, merchantSlug, selectedSlug, measureMorphRects],

  );



  const makePanGesture = useCallback(

    (zone: 'hero' | 'sheet') =>

      Gesture.Pan()

        .minDistance(zone === 'hero' ? 16 : 8)

        .activeOffsetY(zone === 'hero' ? [-20, 20] : [-10, 10])

        .failOffsetX([-28, 28])

        .simultaneousWithExternalGesture(nativeScrollGesture)

        .onBegin(() => {

          if (contextMenuVisibleSV.value > 0.5) {

            return;

          }

          if (gestureLockSV.value > 0.5) {

            return;

          }

          const startY = sheetTranslateY.value;

          const collapsed = collapsedOffsetSV.value;

          if (startY < 2) {

            runOnJS(logPanBlockedAlreadyExpanded)();

          }

          dragStartY.value = startY;

          runOnJS(markDragging)(true);

          runOnJS(logPanBegin)(startY, collapsed, zone);

        })

        .onUpdate((e) => {

          if (contextMenuVisibleSV.value > 0.5) {

            return;

          }

          if (gestureLockSV.value > 0.5) {

            return;

          }

          const collapsed = collapsedOffsetSV.value;

          const next = dragStartY.value + e.translationY;

          const expanded = sheetTranslateY.value < 4;

          const scrollAtTop = sheetScrollY.value <= 8;

          if (expanded && !scrollAtTop && e.translationY < 0) {

            return;

          }

          sheetTranslateY.value = Math.min(collapsed + 16, Math.max(0, next));

          runOnJS(logPanUpdate)(

            e.translationY,

            sheetTranslateY.value,

            collapsed,

          );

        })

        .onEnd((e) => {

          if (contextMenuVisibleSV.value > 0.5) {

            runOnJS(markDragging)(false);

            return;

          }

          if (gestureLockSV.value > 0.5) {

            runOnJS(markDragging)(false);

            return;

          }

          runOnJS(handlePanEnd)(

            e.translationY,

            e.velocityY,

            sheetTranslateY.value,

            zone,

          );

        })

        .onFinalize(() => {

          runOnJS(markDragging)(false);

        }),

    [

      nativeScrollGesture,

      handlePanEnd,

      markDragging,

      logPanBegin,

      logPanUpdate,

      logPanBlockedAlreadyExpanded,

      dragStartY,

      sheetTranslateY,

      collapsedOffsetSV,

      sheetScrollY,

      contextMenuVisibleSV,

      gestureLockSV,

    ],

  );



  const gestureBlockersActive = contextMenuVisible || showImageOverlay || showMenuHeroOverlay;

  const heroPanGesture = useMemo(
    () => makePanGesture('hero').enabled(!gestureBlockersActive),
    [makePanGesture, gestureBlockersActive],
  );

  const sheetPanGesture = useMemo(
    () => makePanGesture('sheet').enabled(!gestureBlockersActive),
    [makePanGesture, gestureBlockersActive],
  );



  const edgeBackGesture = useMemo(

    () =>

      Gesture.Pan()

        .activeOffsetX(24)

        .failOffsetY([-24, 24])

        .onEnd((e) => {

          if (e.translationX > 48 && e.velocityX > 0) {

            runOnJS(logEdgeSwipeFired)(e.translationX, e.velocityX);

            runOnJS(handleChevronPress)();

          }

        }),

    [handleChevronPress, logEdgeSwipeFired],

  );

  const chevronBackGesture = useMemo(

    () =>

      Gesture.Race(

        edgeBackGesture,

        Gesture.Tap().onEnd(() => {

          runOnJS(handleChevronPress)();

        }),

      ),

    [edgeBackGesture, handleChevronPress],

  );



  const sheetClipStyle = useAnimatedStyle(() => {

    const sheetTop = SCREEN_HEIGHT - effectiveExpandedSheetH + sheetTranslateY.value;

    const visibleHeight = Math.max(0, SCREEN_HEIGHT - sheetTop);

    const collapsed = collapsedOffsetSV.value;

    const expandProgress =

      collapsed > 0 ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed)) : 0;

    return {

      top: sheetTop,

      height: visibleHeight,

      zIndex: expandProgress > 0.02 ? 50 : 40,

    };

  });



  const headerControlsStyle = useAnimatedStyle(() => {
    const collapsed = collapsedOffsetSV.value;

    const expandProgress =

      collapsed > 0 ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed)) : 0;

    return {

      opacity: interpolate(
        expandProgress,
        [INLINE_FADE_OUT_START, HEADER_MINI_FADE_IN_START],
        [1, 0],
        Extrapolation.CLAMP,
      ),

      pointerEvents:
        expandProgress < HEADER_MINI_FADE_IN_START ? ('auto' as const) : ('none' as const),

    };

  });



  const headerMiniSlotStyle = useAnimatedStyle(() => {
    const collapsed = collapsedOffsetSV.value;

    const expandProgress =

      collapsed > 0 ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed)) : 0;

    return {

      opacity: interpolate(
        expandProgress,
        [HEADER_MINI_FADE_IN_START, HEADER_MINI_FADE_IN_END],
        [0, 1],
        Extrapolation.CLAMP,
      ),

      pointerEvents:
        expandProgress >= HEADER_MINI_FADE_IN_START ? ('auto' as const) : ('none' as const),

    };

  });



  const headerMenuStyle = useAnimatedStyle(() => {

    const collapsed = collapsedOffsetSV.value;

    const expandProgress =

      collapsed > 0 ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed)) : 0;

    return {

      opacity: interpolate(
        expandProgress,
        [INLINE_FADE_OUT_START, HEADER_MINI_FADE_IN_END],
        [1, 0],
        Extrapolation.CLAMP,
      ),

    };

  });



  const logSheetHitRegion = useCallback(

    (visibleTop: number, visibleHeight: number) => {

      discoverLog('overlay', 'sheetHitRegion', {

        merchantSlug,

        productSlug: selectedSlug,

        visibleTop: Math.round(visibleTop),

        visibleHeight: Math.round(visibleHeight),

      });

    },

    [merchantSlug, selectedSlug],

  );



  const HERO_CAPTION_BAND_H = 72;

  const heroCaptionStyle = useAnimatedStyle(() => {
    if (isStoryLayout) {
      return {};
    }

    const collapsed = collapsedOffsetSV.value;

    const expandProgress =
      collapsed > 0 ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed)) : 0;

    return {
      opacity: expandProgress <= HERO_VISIBLE_UNTIL ? 1 : 0,
    };
  });

  const storyBottomCardPositionStyle = useAnimatedStyle(() => {
    const collapsed = collapsedOffsetSV.value;
    const expandProgress =
      collapsed > 0
        ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed))
        : 0;

    if (expandProgress < 0.02) {
      return { bottom: storyCardBottomInset };
    }

    const sheetTop = SCREEN_HEIGHT - effectiveExpandedSheetH + sheetTranslateY.value;
    return {
      bottom: SCREEN_HEIGHT - sheetTop + 12,
    };
  });

  const storyBottomCardOpacityStyle = useAnimatedStyle(() => {
    const collapsed = collapsedOffsetSV.value;
    const expandProgress =
      collapsed > 0
        ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed))
        : 0;
    return {
      opacity: interpolate(
        expandProgress,
        [0, 0.35],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  const heroPanZoneStyle = useAnimatedStyle(() => {
    const sheetTop = SCREEN_HEIGHT - effectiveExpandedSheetH + sheetTranslateY.value;
    const collapsed = collapsedOffsetSV.value;
    const progress =
      collapsed > 0
        ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed))
        : 0;

    if (isStoryLayout) {
      if (progress <= 0.05) {
        return {
          top: 0,
          height: 0,
          zIndex: 30,
        };
      }

      return {
        top: headerBottomY,
        height: Math.max(0, sheetTop - headerBottomY),
        zIndex: 30,
      };
    }

    if (progress > 0.05) {
      return {
        top: headerBottomY,
        height: Math.max(0, sheetTop - headerBottomY),
        zIndex: 30,
      };
    }

    const captionTop = heroBottomY - HERO_CAPTION_BAND_H;

    return {
      top: captionTop,
      height: HERO_CAPTION_BAND_H,
      zIndex: 44,
    };
  });

  const heroWrapPointerProps = useAnimatedProps(() => {
    const collapsed = collapsedOffsetSV.value;
    const expandProgress =
      collapsed > 0
        ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed))
        : 0;
    return {
      pointerEvents: expandProgress > 0.02 ? ('none' as const) : ('auto' as const),
    };
  });

  const heroPanZoneProps = useAnimatedProps(() => {
    if (suppressMorphSV.value > 0.5) {
      return { pointerEvents: 'none' as const };
    }

    if (isStoryLayout) {
      const collapsed = collapsedOffsetSV.value;
      const progress =
        collapsed > 0
          ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed))
          : 0;
      if (progress <= 0.05) {
        return { pointerEvents: 'none' as const };
      }
    }

    return { pointerEvents: 'auto' as const };
  });

  const storySheetHandleStyle = useAnimatedStyle(() => {
    if (!isStoryLayout) {
      return {};
    }

    const collapsed = collapsedOffsetSV.value;
    const expandProgress =
      collapsed > 0
        ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed))
        : 0;

    if (expandProgress < 0.02) {
      return {
        opacity: 0,
        minHeight: 0,
        paddingTop: 0,
        paddingBottom: 0,
      };
    }

    return { opacity: 1 };
  });

  const sheetClipProps = useAnimatedProps(() => {
    if (!isStoryLayout) {
      return { pointerEvents: 'auto' as const };
    }

    const collapsed = collapsedOffsetSV.value;
    const expandProgress =
      collapsed > 0
        ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed))
        : 0;

    return {
      pointerEvents: expandProgress < 0.02 ? ('none' as const) : ('auto' as const),
    };
  });



  const heroMediaOpacityStyle = expandHeroMorphOpacityStyle;

  const storyReelOpacityStyle = useAnimatedStyle(() => {
    if (!isStoryLayout) {
      return {};
    }

    const collapsed = collapsedOffsetSV.value;

    const progress =

      collapsed > 0 ? 1 - sheetTranslateY.value / collapsed : 0;

    return {

      opacity: progress <= HERO_VISIBLE_UNTIL ? 1 : 0,

    };

  });

  const hideMaximizeStyle = useAnimatedStyle(() => {
    if (isStoryLayout) {
      return { opacity: 0, pointerEvents: 'none' as const };
    }

    const collapsed = collapsedOffsetSV.value;

    const expandProgress =

      collapsed > 0 ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed)) : 0;

    const hidden = expandProgress > 0.05;

    return {

      opacity: hidden ? 0 : 1,

      pointerEvents: hidden ? ('none' as const) : ('auto' as const),

    };

  });

  const sheetPanChromeStyle = useAnimatedStyle(() => {
    if (activeTabSV.value === 0 && !isStoryLayout) {
      return {
        minHeight: PEEK_PAN_CHROME_HEIGHT,
        paddingBottom: 0,
      };
    }

    const collapsed = collapsedOffsetSV.value;

    const expandProgress =

      collapsed > 0

        ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed))

        : 0;

    if (expandProgress > 0.15) {

      return {

        minHeight: expandProgress > 0.5 ? 48 : PAN_DRAG_ZONE_HEIGHT,

        paddingBottom: expandProgress > 0.5 ? 12 : PAN_CHROME_HEIGHT,

      };

    }

    return {

      minHeight: PEEK_PAN_CHROME_HEIGHT,

      paddingBottom: 0,

    };

  });



  const heroWrapStyle = useAnimatedStyle(() => {
    if (isStoryLayout) {
      return { opacity: 1, zIndex: 45 };
    }

    const collapsed = collapsedOffsetSV.value;

    const expandProgress =

      collapsed > 0 ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed)) : 0;

    return {
      opacity: 1,
      zIndex: expandProgress > 0.02 ? 30 : 45,
    };
  });



  const overlayChromeStyle = useAnimatedStyle(() => ({

    opacity: 1,

  }));

  const menuHeroFadeStyle = heroBandFadeStyle;

  const menuCarouselHeroOpacityStyle = expandHeroMorphOpacityStyle;



  if (!visible) return null;



  if (productData === undefined || products === undefined) {

    if (!overlayEverReadyRef.current) {

      return (

        <Modal visible animationType="slide" presentationStyle="fullScreen">

          <GestureHandlerRootView style={{ flex: 1 }}>

            <View style={styles.loading}>

              <ActivityIndicator color="#00BFA5" size="large" />

            </View>

          </GestureHandlerRootView>

        </Modal>

      );

    }

  }



  if (!shellProduct || !shellMerchant || !shellMedia) {

    return (

      <Modal visible animationType="slide" presentationStyle="fullScreen">

        <GestureHandlerRootView style={{ flex: 1 }}>

          <View style={styles.loading}>

            <Text style={{ color: '#fff' }}>Product not found</Text>

            <TouchableOpacity onPress={onDismiss}>

              <Text style={{ color: '#00BFA5', marginTop: 12 }}>Close</Text>

            </TouchableOpacity>

          </View>

        </GestureHandlerRootView>

      </Modal>

    );

  }



  if (imageMode === 'expanded') {

    const expandedProduct =

      activeTab === 'menu' && menuFocusProduct

        ? {

            name: menuFocusProduct.name,

            description: menuFocusProduct.description,

            priceCents: menuFocusProduct.priceCents,

            currency: menuFocusProduct.currency,

            imageUrl: menuFocusProduct.imageUrl,

          }

        : shellProduct;

    const expandedMedia =

      activeTab === 'menu' && menuFocusMedia ? menuFocusMedia : shellMedia;

    const expandedAspect =

      activeTab === 'menu' && menuFocusProduct?.mediaAspect

        ? menuFocusProduct.mediaAspect

        : mediaAspect;

    return (

      <Modal visible animationType="slide" presentationStyle="fullScreen">

        <GestureHandlerRootView style={{ flex: 1 }}>

          <ProductExpandedView

            media={expandedMedia}

            aspect={expandedAspect}

            onCollapse={() => {

              logOverlay('imageCollapse', { source: 'chevron' });

              setImageMode('minimized');

            }}

            productName={expandedProduct.name}

            productDescription={expandedProduct.description}

            priceCents={expandedProduct.priceCents}

            currency={expandedProduct.currency}

            imageUrl={expandedProduct.imageUrl ?? undefined}

            inCart={inCart}

            onShare={handleShare}

            onAddCart={handleAddCart}

            onAddToList={handleAddToList}

          />

        </GestureHandlerRootView>

      </Modal>

    );

  }



  const productHeroImageUrl = shellMedia.uri ?? shellProduct.imageUrl;

  const morphImageUrl =
    activeTab === 'menu'
      ? menuFocusProduct?.imageUrl
      : productHeroImageUrl;



  return (

    <Modal visible animationType="slide" presentationStyle="fullScreen">

      <GestureHandlerRootView style={{ flex: 1 }}>

      <View style={styles.root}>

        {!isStoryLayout && (

          <HeroDynamicBackdrop
            imageUrl={
              activeTab === 'menu'
                ? (menuFocusProduct?.imageUrl ?? shellProduct.imageUrl)
                : productHeroImageUrl
            }
            sheetTranslateY={sheetTranslateY}
            collapsedOffsetSV={collapsedOffsetSV}
          />

        )}



        {activeTab === 'product' && isStoryLayout && shellMedia && (

          <ProductStoryHeroLayout

            media={shellMedia}

            productName={shellProduct.name}

            productSubtitle={shellProduct.description}

            priceCents={shellProduct.priceCents}

            currency={shellProduct.currency}

            imageUrl={shellProduct.imageUrl}

            heroAnchorRef={heroAnchorRef}

            onHeroAnchorLayout={measureMorphRects}

            bottomCardPositionStyle={storyBottomCardPositionStyle}

            bottomCardOpacityStyle={storyBottomCardOpacityStyle}

            reelOpacityStyle={storyReelOpacityStyle}

            onExpandSheet={() => {

              logOverlay('storyCardExpand');

              snapToExpanded();

            }}

            onShare={handleShare}

            onAddCart={handleAddCart}

            onAddToList={handleAddToList}

          />

        )}



        {activeTab === 'menu' && shellMerchant && menuProducts.length > 0 && menuCarouselFrameSlotH > 0 && (

          <Animated.View

            style={[

              styles.menuHeroBand,

              { top: headerBottomY, height: menuCarouselDisplayHeight },

              overlayChromeStyle,

              menuHeroFadeStyle,

              menuHeroBandClipStyle,

            ]}

            pointerEvents="box-none"

          >

            <MerchantMenuHeroCarousel

              products={menuProducts}

              selectedSlug={menuFocusSlug}

              merchantSlug={merchantSlug}

              fixedCenterFrameH={menuCarouselFrameSlotH}

              programmaticScrollRef={carouselProgrammaticScrollRef}

              heroAnchorRef={heroAnchorRef}

              heroSourceOpacityStyle={menuCarouselHeroOpacityStyle}

              sidePeekHideStyle={menuSidePeekHideStyle}

              showOverlay={showMenuHeroOverlay}

              onToggleOverlay={handleMenuHeroToggleOverlay}

              onMaximize={handleMenuHeroMaximize}

              onShare={handleShare}

              onAddCart={handleAddCart}

              onAddToList={handleAddToList}

              onHeroAnchorLayout={measureMorphRects}

              onSelectProduct={handleMenuCarouselSelect}

            />

            <MenuInlinePlayerBar

              productName={menuFocusProduct?.name ?? shellProduct.name}

              merchantName={shellMerchant.name}

              imageUrl={menuFocusProduct?.imageUrl ?? shellProduct.imageUrl}

              merchantAvatar={
                (shellMerchant as { logoUrl?: string | null }).logoUrl ??
                `https://i.pravatar.cc/80?u=${encodeURIComponent(merchantSlug)}`
              }

              sheetTranslateY={sheetTranslateY}

              collapsedOffsetSV={collapsedOffsetSV}

              onPress={() => {

                if (getExpandProgress() >= HEADER_MINI_FADE_IN_START) {

                  snapToCollapsed();

                }

              }}

            />

          </Animated.View>

        )}



        {!isStoryLayout && morphImageUrl ? (

          <OverlayHeroMorphLayer

            imageUrl={morphImageUrl}

            sheetTranslateY={sheetTranslateY}

            collapsedOffsetSV={collapsedOffsetSV}

            heroRect={heroRectSV}

            miniPlayerRect={miniPlayerRectSV}

            heroLayoutReady={heroLayoutReady}

            miniPlayerLayoutReady={miniPlayerLayoutReady}

            suppressMorphSV={suppressMorphSV}

          />

        ) : null}



        {activeTab === 'product' && !isStoryLayout && (

          <Animated.View

            style={[

              styles.heroWrap,

              { marginTop: headerBottomY },

              showImageOverlay && styles.heroWrapRaised,

              heroWrapStyle,

            ]}

            animatedProps={heroWrapPointerProps}

          >

            <ProductHeroMedia

              media={shellMedia}

              imageSlotHeight={heroDisplayHeight}

              showOverlay={showImageOverlay}

              tapEnabled={heroTapEnabled}

              onToggleOverlay={() => {

                setShowImageOverlay((v) => {

                  const next = !v;

                  logOverlay('imageOverlayToggle', {

                    showImageOverlay: next,

                    heroZIndexRaised: true,

                  });

                  return next;

                });

              }}

              onMaximize={() => {

                logOverlay('imageExpand');

                setShowImageOverlay(false);

                setImageMode('expanded');

              }}

              onShare={handleShare}

              onAddCart={handleAddCart}

              onAddToList={handleAddToList}

              onChipPress={(chip) => logOverlay('heroChipPress', { chip })}

              productName={shellProduct.name}

              productSubtitle={shellProduct.description}

              captionStyle={heroCaptionStyle}

              mediaOpacityStyle={heroMediaOpacityStyle}

              hideMaximizeStyle={hideMaximizeStyle}

              heroAnchorRef={heroAnchorRef}

              onHeroAnchorLayout={measureMorphRects}

            />

          </Animated.View>

        )}



        {activeTab === 'product' && (

          <GestureDetector gesture={heroPanGesture}>

            <AnimatedPanZone

              style={[styles.heroPanZone, heroPanZoneStyle]}

              animatedProps={heroPanZoneProps}

            />

          </GestureDetector>

        )}



        <Animated.View

          style={[styles.sheetClip, sheetClipStyle]}

          animatedProps={sheetClipProps}

          pointerEvents={contextMenuVisible ? 'none' : 'auto'}

          onLayout={(event) => {

            const { y, height } = event.nativeEvent.layout;

            logSheetHitRegion(y, height);

          }}

        >

          <Animated.View

            style={[

              styles.sheet,

              { height: effectiveExpandedSheetH },

            ]}

          >

          <GestureDetector gesture={sheetPanGesture}>

            <View style={styles.sheetInner}>

              <Animated.View style={[styles.handleZone, styles.panChromeZone, sheetPanChromeStyle, storySheetHandleStyle]}>

                {activeTab === 'menu' ? (

                  <Text style={styles.menuQueuePeekHint}>Menu</Text>

                ) : null}

                {isStoryLayout && activeTab === 'product' ? (

                  <Ionicons

                    name="chevron-up"

                    size={18}

                    color="rgba(255,255,255,0.45)"

                    style={styles.swipeHint}

                  />

                ) : null}

                <View style={styles.handle} />

              </Animated.View>



          {activeTab === 'menu' ? (

            <View style={styles.menuListWrap}>

            <MerchantMenuList

              products={menuProducts}

              selectedSlug={menuFocusSlug}

              merchantName={shellMerchant.name}

              menuCategories={menuCategories}

              onSelectProduct={handleMenuListSelect}

              onFilterChange={handleMenuFilterChange}

            />

            </View>

          ) : (

            <ProductDetailSheet

              scrollRef={scrollRef}

              contentPaddingBottom={insets.bottom + 24}

              merchantSlug={merchantSlug}

              productSlug={selectedSlug}

              productName={shellProduct.name}

              description={shellProduct.description}

              priceCents={shellProduct.priceCents}

              currency={shellProduct.currency}

              merchantName={shellMerchant.name}

              merchantLogoUrl={
                (shellMerchant as { logoUrl?: string | null }).logoUrl ?? null
              }

              categoryLabels={
                (shellMerchant as { categoryLabels?: string[] }).categoryLabels ??
                shellMerchant.feedCategories ??
                []
              }

              isFollowing={isFollowing}

              onFollow={handleFollow}

              productImageUrl={shellProduct.imageUrl}

              productSubtitle={shellProduct.description}

              sheetTranslateY={sheetTranslateY}

              collapsedOffsetSV={collapsedOffsetSV}

              sheetScrollY={sheetScrollY}

              hidePeekHeaderAtCollapse={isStoryLayout}

              nativeScrollGesture={nativeScrollGesture}

              onAddCart={handleAddCart}

              onIncrementCart={handleIncrementCart}

              onDecrementCart={handleDecrementCart}

              cartQuantity={cartQuantity}

              similarProducts={similarProducts}

              similarPlaces={similarPlaces}

              loadingSimilar={loadingSimilar}

              onSelectSimilarProduct={pushProduct}

              onSelectSimilarPlace={handleSelectSimilarPlace}

            />

          )}

            </View>

          </GestureDetector>

          </Animated.View>

        </Animated.View>



        {!contextMenuVisible ? (
        <OverlayHeaderChrome

          paddingTop={insets.top + 4}

          absolute

        >

          <GestureDetector gesture={chevronBackGesture}>

            <View

              style={styles.headerBtn}

              pointerEvents="auto"

              accessibilityRole="button"

              accessibilityLabel="Go back"

            >

              <Ionicons name="chevron-down" size={24} color="#fff" />

            </View>

          </GestureDetector>

          <View style={styles.headerCenterSlot}>

            <Animated.View style={[styles.headerControlsRow, headerControlsStyle]}>

              <ProductSegmentedControl

                activeTab={activeTab}

                onChange={handleTabChange}

              />

            </Animated.View>

            <Animated.View
              style={[styles.headerMiniSlot, headerMiniSlotStyle]}
              pointerEvents="box-none"
            >

              <OverlayMiniPlayerBar

                productName={

                  activeTab === 'menu'

                    ? (menuFocusProduct?.name ?? shellProduct.name)

                    : shellProduct.name

                }

                productSubtitle={

                  activeTab === 'menu'

                    ? shellMerchant.name

                    : shellProduct.description

                }

                imageUrl={morphImageUrl}

                sheetTranslateY={sheetTranslateY}

                collapsedOffsetSV={collapsedOffsetSV}

                barRef={miniPlayerBarRef}

                thumbRef={miniPlayerThumbRef}

                morphTargetAnchorRef={morphTargetAnchorRef}

                onBarLayout={measureMorphRects}

                onMorphTargetLayout={measureMorphRects}

                onPress={() => {

                  if (getExpandProgress() >= HEADER_MINI_FADE_IN_START) {

                    snapToCollapsed();

                  }

                }}

              />

            </Animated.View>

          </View>

          {activeTab === 'product' ? (
          <Animated.View style={headerMenuStyle}>

            <TouchableOpacity

              style={styles.headerBtn}

              pointerEvents="auto"

              onPress={() => {

                if (contextMenuVisible) return;

                if (activeTab !== 'product') return;

                logOverlay('contextMenuOpen', {

                  mediaAspect,

                  heroSummaryHeight: 120,

                });

                setContextMenuVisible(true);

              }}

            >

              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />

            </TouchableOpacity>

          </Animated.View>
          ) : (
            <View style={styles.headerBtn} />
          )}

        </OverlayHeaderChrome>
        ) : null}



        <PurchasableContextMenu

          visible={contextMenuVisible}

          onClose={closeContextMenu}

          productName={shellProduct.name}

          productSubtitle={shellProduct.description}

          imageUrl={shellProduct.imageUrl}

          mediaAspect={mediaAspect}

          profileName={shellMerchant.name}

          profileAvatar={
            (shellMerchant as { logoUrl?: string | null }).logoUrl ??
            `https://i.pravatar.cc/80?u=${encodeURIComponent(merchantSlug)}`
          }

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



        <OverlayViewCartBar

          visible={viewCartBarVisible}

          itemCount={merchantItemCount}

          bottomInset={insets.bottom}

          onPress={handleViewCart}

        />



        <SaveToCollectionSheet

          item={saveTarget}

          onClose={() => setSaveTarget(null)}

        />

      </View>

      </GestureHandlerRootView>

    </Modal>

  );

}



const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: '#000' },

  heroPanZone: {

    position: 'absolute',

    left: 0,

    right: 0,

    zIndex: 45,

  },

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

  menuHeroBand: {

    position: 'absolute',

    left: 0,

    right: 0,

    zIndex: 12,

    justifyContent: 'space-between',

  },

  menuHeroCarouselWrap: {

    position: 'absolute',

    left: 0,

    right: 0,

    zIndex: 12,

  },

  menuQueuePeekHint: {

    color: 'rgba(255,255,255,0.55)',

    fontSize: 12,

    fontWeight: '600',

    marginBottom: 4,

    textAlign: 'center',

  },

  swipeHint: {

    marginBottom: 4,

  },

  heroWrap: {

    paddingHorizontal: 16,

    paddingTop: 8,

    zIndex: 45,

    elevation: 8,

  },

  heroWrapRaised: {

    zIndex: 55,

    elevation: 14,

  },

  headerCenterSlot: {

    flex: 1,

    minWidth: 0,

    position: 'relative',

    justifyContent: 'center',

    minHeight: 36,

  },

  headerControlsRow: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  headerMiniSlot: {

    position: 'absolute',

    left: 0,

    right: 0,

    top: 0,

    bottom: 0,

    justifyContent: 'center',

  },

  sheetClip: {

    position: 'absolute',

    left: 0,

    right: 0,

    overflow: 'hidden',

  },

  sheet: {

    position: 'absolute',

    left: 0,

    right: 0,

    top: 0,

    backgroundColor: '#1a1a1a',

    borderTopLeftRadius: 16,

    borderTopRightRadius: 16,

    overflow: 'hidden',

  },

  sheetInner: {

    flex: 1,

  },

  menuListWrap: {

    flex: 1,

    minHeight: 0,

  },

  handleZone: {

    paddingTop: 10,

    paddingBottom: 8,

    alignItems: 'center',

  },

  panChromeZone: {

    paddingBottom: 0,

  },

  handle: {

    width: 36,

    height: 4,

    borderRadius: 2,

    backgroundColor: 'rgba(255,255,255,0.3)',

  },

});


