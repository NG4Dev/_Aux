import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated as RNAnimated,
  LayoutChangeEvent,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { DISCOVER_FILTER_CATEGORIES } from '@/data/mockFeed';
import { useDiscoverFeed } from '@/hooks/usePersonalizedFeed';
import { mapFeedItemToContentItem } from '@/utils/personalizedFeed';
import { USE_CONVEX_DATA } from '@/config/features';
import IdentityRow from '@/components/feed/IdentityRow';
import ContentContextMenu from '@/components/feed/ContentContextMenu';
import FeedMediaSlot from '@/components/feed/FeedMediaSlot';
import ContentReelView, {
  type ContentReelVariant,
} from '@/components/feed/ContentReelView';
import SaveToCollectionSheet from '@/components/bookmarks/SaveToCollectionSheet';
import DiscoverProductOverlay from '@/components/commerce/DiscoverProductOverlay';
import { feedSlotHeight, toMediaAspect } from '@/components/commerce/getSheetSnapPoints';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import type { ContentItem, MediaAspect, MediaItem } from '@/types/content';
import Colors from '@/constants/Colors';
import { discoverLog } from '@/services/discoverFlowLogger';
import {
  trackViewItemList,
  trackMixpanel,
  MixpanelEvents,
} from '@/services/analytics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_ROW_HEIGHT = 52;
const TAB_BAR_HEIGHT = 48;
const SAMPLE_STORY_VIDEO =
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

type TabMeasurement = { x: number; width: number };

type ContentReelState = {
  variant: ContentReelVariant;
  media: MediaItem;
  creatorName: string;
  creatorAvatar?: string;
  caption?: string;
};

function primaryAspect(media: MediaItem[]): MediaAspect {
  return media[0]?.aspect ?? 'square';
}

function buildLaParadaMedia(
  product: {
    slug: string;
    imageUrl?: string | null;
    imageWidth?: number;
    imageHeight?: number;
    mediaAspect?: string;
  },
  aspect: MediaAspect,
): MediaItem | null {
  if (!product.imageUrl && product.slug !== 'croquetas-jamon') return null;
  const isStoryVideo = aspect === 'story' && product.slug === 'croquetas-jamon';
  return {
    uri: isStoryVideo ? SAMPLE_STORY_VIDEO : (product.imageUrl as string),
    type: isStoryVideo ? 'video' : 'image',
    width: product.imageWidth ?? 1080,
    height: product.imageHeight ?? (aspect === 'story' ? 1920 : 1080),
    aspect,
  };
}

function MediaCarousel({
  media,
  borderRadius,
  onPressSlide,
}: {
  media: MediaItem[];
  borderRadius: number;
  onPressSlide?: (item: MediaItem, index: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const renderSlide = (item: MediaItem, index: number) => (
    <FeedMediaSlot
      key={`${item.uri}-${index}`}
      media={item}
      aspect={item.aspect}
      borderRadius={borderRadius}
      fullBleed
      onPress={onPressSlide ? () => onPressSlide(item, index) : undefined}
    />
  );

  if (media.length === 1) {
    return renderSlide(media[0], 0);
  }

  const slideHeight = feedSlotHeight(
    media[activeIndex]?.aspect ?? media[0]?.aspect ?? 'square',
    media[activeIndex] ?? media[0],
  );

  return (
    <View>
      <FlatList
        data={media}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: SCREEN_WIDTH, height: slideHeight }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(idx);
        }}
        renderItem={({ item, index }) => (
          <View style={{ width: SCREEN_WIDTH }}>{renderSlide(item, index)}</View>
        )}
      />
      {media.length > 1 && (
        <View style={carouselStyles.indicators}>
          {media.map((_, i) => (
            <View
              key={i}
              style={[
                carouselStyles.dot,
                i === activeIndex && carouselStyles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const carouselStyles = StyleSheet.create({
  indicators: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#00BFA5',
  },
});

const HEADER_MAX_HEIGHT = HEADER_ROW_HEIGHT + TAB_BAR_HEIGHT;

export default function DiscoverCategory() {
  const { category, label } = useLocalSearchParams<{
    category: string;
    label: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const overlayBackRef = useRef<(() => void) | null>(null);
  const contentReelBackRef = useRef<(() => void) | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [saveTarget, setSaveTarget] = useState<ContentItem | null>(null);
  const [overlay, setOverlay] = useState<{
    merchantSlug: string;
    productSlug: string;
    mediaAspect?: ReturnType<typeof toMediaAspect>;
    initialImageMode?: 'minimized' | 'expanded';
  } | null>(null);
  const [contentReel, setContentReel] = useState<ContentReelState | null>(null);

  const { items: personalizedItems, meta, loading, error } = useDiscoverFeed(category, 12);
  const feedData = useMemo(
    () => personalizedItems.map(mapFeedItemToContentItem),
    [personalizedItems],
  );

  const categoryMerchants = useQuery(
    api.platform.merchants.listMerchantsForDiscoverCategory,
    USE_CONVEX_DATA && category ? { categorySlug: category } : 'skip',
  );
  const headerMerchantSlug =
    categoryMerchants?.[0]?.slug ??
    feedData.find((item) => item.merchantSlug)?.merchantSlug ??
    'la-parada';

  const headerMerchantProducts = useQuery(
    api.platform.merchants.listProducts,
    USE_CONVEX_DATA && headerMerchantSlug
      ? { merchantSlug: headerMerchantSlug }
      : 'skip',
  );

  const openHeaderMerchantProduct = useCallback(
    (product: NonNullable<typeof headerMerchantProducts>[number]) => {
      const aspect = toMediaAspect(product.mediaAspect ?? undefined);
      if (
        overlay?.merchantSlug === headerMerchantSlug &&
        overlay?.productSlug === product.slug
      ) {
        return;
      }
      discoverLog('category', 'overlayOpen', {
        source: 'categoryMenuHeader',
        merchantSlug: headerMerchantSlug,
        productSlug: product.slug,
        mediaAspect: product.mediaAspect ?? 'square',
        fullscreen: aspect === 'story',
      });
      setOverlay({
        merchantSlug: headerMerchantSlug,
        productSlug: product.slug,
        mediaAspect: aspect,
        initialImageMode: 'minimized',
      });
    },
    [overlay, headerMerchantSlug],
  );

  const handleFeedMediaPress = useCallback((item: ContentItem, mediaItem: MediaItem) => {
    const aspect = mediaItem.aspect ?? primaryAspect(item.media);
    if (item.contentType === 'post' && aspect === 'story') {
      setContentReel({
        variant: mediaItem.type === 'video' ? 'contentVideo' : 'contentImage',
        media: { ...mediaItem, aspect: 'story' },
        creatorName: item.profileName,
        creatorAvatar: item.profileAvatar,
        caption: item.description ?? item.title,
      });
      discoverLog('category', 'contentReelOpen', {
        variant: mediaItem.type === 'video' ? 'contentVideo' : 'contentImage',
        contentId: item.id,
      });
      return;
    }
    if (item.contentType === 'product' && item.merchantSlug && item.productSlug) {
      setOverlay({
        merchantSlug: item.merchantSlug,
        productSlug: item.productSlug,
        mediaAspect: aspect,
        initialImageMode: 'minimized',
      });
    }
  }, []);

  useEffect(() => {
    discoverLog('category', 'screenReady', {
      category,
      label,
      feedCount: feedData.length,
      loading,
      error: error ?? undefined,
      tasteSlots: meta?.tasteSlots,
      exploreSlots: meta?.exploreSlots,
      headerMerchantSlug,
      headerProductCount: headerMerchantProducts?.length ?? 0,
      overlayOpen: !!overlay,
    });
    void trackViewItemList({
      itemListName: `discover_category_${category}`,
      persona: 'consumer',
      discoverCategory: category,
    });
    void trackMixpanel(MixpanelEvents.CategoryFeedViewed, {
      persona: 'consumer',
      discover_category: category,
      feed_count: feedData.length,
    });
  }, [
    category,
    label,
    feedData.length,
    loading,
    error,
    meta,
    headerMerchantProducts?.length,
    headerMerchantSlug,
    overlay,
  ]);

  useEffect(() => {
    const modalOpen = !!overlay || !!contentReel;
    if (!modalOpen) {
      navigation.setOptions({ gestureEnabled: true });
      return;
    }

    navigation.setOptions({ gestureEnabled: false });

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      discoverLog('category', 'stackBackIntercepted', {
        overlayOpen: !!overlay,
        contentReelOpen: !!contentReel,
        merchantSlug: overlay?.merchantSlug,
        productSlug: overlay?.productSlug,
        contentReelVariant: contentReel?.variant,
      });
      if (contentReel) {
        contentReelBackRef.current?.();
        return;
      }
      overlayBackRef.current?.();
    });

    return () => {
      navigation.setOptions({ gestureEnabled: true });
      unsubscribe();
    };
  }, [navigation, overlay, contentReel]);

  const { animatedHeight: headerRowHeight, onScroll: handleScroll } =
    useCollapsibleHeader({ headerHeight: HEADER_ROW_HEIGHT });

  const tabScrollRef = useRef<ScrollView>(null);
  const tabMeasurements = useRef<TabMeasurement[]>([]);
  const underlineX = useRef(new RNAnimated.Value(0)).current;
  const underlineW = useRef(new RNAnimated.Value(0)).current;

  const handleTabLayout = useCallback(
    (index: number, e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      tabMeasurements.current[index] = { x, width };
      if (DISCOVER_FILTER_CATEGORIES[index] === activeFilter) {
        underlineX.setValue(x);
        underlineW.setValue(width);
      }
    },
    [activeFilter, underlineX, underlineW],
  );

  const handleFilterSelect = useCallback(
    (cat: string) => {
      discoverLog('category', 'filterChange', { category, filter: cat });
      setActiveFilter(cat);
      const idx = DISCOVER_FILTER_CATEGORIES.indexOf(cat as any);
      const m = tabMeasurements.current[idx];
      if (m) {
        RNAnimated.parallel([
          RNAnimated.timing(underlineX, { toValue: m.x, duration: 250, useNativeDriver: false }),
          RNAnimated.timing(underlineW, { toValue: m.width, duration: 250, useNativeDriver: false }),
        ]).start();
        tabScrollRef.current?.scrollTo({ x: Math.max(0, m.x - 32), animated: true });
      }
    },
    [underlineX, underlineW],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {!overlay && !contentReel ? (
        <View style={styles.stickyBlock}>
          <RNAnimated.View style={{ height: headerRowHeight, overflow: 'hidden' }}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.headerBtn}
              >
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.locationChip}>
                <Text style={styles.locationText}>Cape Town</Text>
              </View>
              <TouchableOpacity style={styles.headerBtn}>
                <Ionicons name="options-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </RNAnimated.View>

          <View style={styles.tabBarWrap}>
            <ScrollView
              ref={tabScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScroll}
            >
              {(DISCOVER_FILTER_CATEGORIES as readonly string[]).map((item, index) => {
                const active = item === activeFilter;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleFilterSelect(item)}
                    onLayout={(e) => handleTabLayout(index, e)}
                    style={styles.tabItem}
                  >
                    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <RNAnimated.View
                style={[
                  styles.tabUnderline,
                  { left: underlineX, width: underlineW },
                ]}
              />
            </ScrollView>
          </View>
        </View>
        ) : null}

        <FlatList
          data={feedData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={
            headerMerchantProducts && headerMerchantProducts.length > 0 ? (
              <View style={styles.convexSection}>
                <Text style={styles.convexSectionTitle}>
                  {categoryMerchants?.[0]?.name ?? 'Featured menu'}
                </Text>
                <Text style={styles.convexSectionSub}>
                  Tap to preview overlay (live aspect ratios)
                </Text>
                {headerMerchantProducts.map((product: (typeof headerMerchantProducts)[number]) => {
                  const aspect = toMediaAspect(product.mediaAspect ?? undefined);
                  const media = buildLaParadaMedia(product, aspect);
                  return (
                    <View key={product.slug} style={styles.convexCard}>
                      {media ? (
                        <FeedMediaSlot
                          media={media}
                          aspect={aspect}
                          borderRadius={0}
                          fullBleed
                          onPress={() => openHeaderMerchantProduct(product)}
                        />
                      ) : null}
                      <Text style={styles.convexName}>{product.name}</Text>
                      <Text style={styles.convexAspect}>
                        {product.mediaAspect ?? 'square'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null
          }
          contentContainerStyle={[
            styles.list,
            { paddingTop: HEADER_MAX_HEIGHT + 12 },
          ]}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardMediaWrap}>
                <MediaCarousel
                  media={item.media}
                  borderRadius={0}
                  onPressSlide={(mediaItem) => handleFeedMediaPress(item, mediaItem)}
                />
              </View>

              <View style={styles.cardMeta}>
                <View style={styles.metaTop}>
                  <View style={styles.metaLeft}>
                    <IdentityRow
                      avatarUri={item.profileAvatar}
                      name={item.profileName}
                      verified={item.verified}
                      status={item.status}
                      onPress={
                        item.businessId
                          ? () =>
                              router.push({
                                pathname: '/(tabs)/business/[businessId]',
                                params: { businessId: item.businessId! },
                              })
                          : undefined
                      }
                    />
                  </View>
                  <ContentContextMenu onSave={() => setSaveTarget(item)} />
                </View>

                {item.description && (
                  <Text style={styles.cardDesc} numberOfLines={3}>
                    {item.description}
                  </Text>
                )}

                <View style={styles.cardChips}>
                  {item.categories.map((cat) => (
                    <View key={cat} style={styles.chip}>
                      <Text style={styles.chipText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        />
      </View>

      <SaveToCollectionSheet
        item={saveTarget}
        onClose={() => setSaveTarget(null)}
      />

      {overlay && (
        <DiscoverProductOverlay
          key={`${overlay.merchantSlug}-${overlay.productSlug}`}
          visible
          merchantSlug={overlay.merchantSlug}
          productSlug={overlay.productSlug}
          initialMediaAspect={overlay.mediaAspect}
          initialImageMode={overlay.initialImageMode}
          backActionRef={overlayBackRef}
          onDismiss={() => {
            discoverLog('category', 'overlayDismiss', {
              merchantSlug: overlay.merchantSlug,
              productSlug: overlay.productSlug,
            });
            overlayBackRef.current = () => {};
            setOverlay(null);
          }}
        />
      )}

      {contentReel && (
        <ContentReelView
          visible
          variant={contentReel.variant}
          media={contentReel.media}
          creatorName={contentReel.creatorName}
          creatorAvatar={contentReel.creatorAvatar}
          caption={contentReel.caption}
          backActionRef={contentReelBackRef}
          onDismiss={() => {
            discoverLog('category', 'contentReelDismiss', {
              variant: contentReel.variant,
            });
            setContentReel(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  stickyBlock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
    backgroundColor: '#000',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: HEADER_ROW_HEIGHT,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  tabBarWrap: {
    height: TAB_BAR_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tabScroll: {
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 24,
  },
  card: {
    gap: 12,
  },
  cardMediaWrap: {
    overflow: 'hidden',
  },
  cardMeta: {
    gap: 8,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flex: 1,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
  cardChips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  convexSection: {
    gap: 12,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  convexSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  convexSectionSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 8,
  },
  convexCard: {
    gap: 8,
    marginBottom: 16,
  },
  convexName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  convexAspect: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
