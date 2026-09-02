import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Animated, {
  type AnimatedRef,
  type SharedValue,
  useAnimatedProps,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import {
  OVERLAY_PRICE_GREEN,
  OVERLAY_SECTION_ACCENT,
} from '@/components/commerce/getSheetSnapPoints';
import Colors from '@/constants/Colors';
import { discoverLog } from '@/services/discoverFlowLogger';

type SimilarItem = {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string | null;
  tagline?: string;
  priceCents?: number;
  currency?: string;
  kind: 'product' | 'merchant' | 'place';
};

type ProductDetailSheetProps = {
  productName: string;
  description: string;
  priceCents: number;
  currency: string;
  merchantName: string;
  merchantSlug?: string;
  productSlug?: string;
  merchantLogoUrl?: string | null;
  categoryLabels?: string[];
  isFollowing?: boolean;
  onFollow?: () => void;
  onAddCart: () => void;
  onIncrementCart?: () => void;
  onDecrementCart?: () => void;
  cartQuantity?: number;
  similarProducts?: SimilarItem[];
  similarPlaces?: SimilarItem[];
  loadingSimilar?: boolean;
  onSelectSimilarProduct?: (slug: string) => void;
  onSelectSimilarPlace?: (slug: string) => void;
  scrollRef?: AnimatedRef<Animated.ScrollView>;
  contentPaddingBottom?: number;
  productImageUrl?: string | null;
  productSubtitle?: string;
  sheetTranslateY?: SharedValue<number>;
  collapsedOffsetSV?: SharedValue<number>;
  sheetScrollY?: SharedValue<number>;
  hidePeekHeaderAtCollapse?: boolean;
  nativeScrollGesture?: ReturnType<typeof Gesture.Native>;
  peekPanGesture?: GestureType;
};

export default function ProductDetailSheet({
  productName,
  description,
  priceCents,
  currency,
  merchantName,
  merchantSlug,
  productSlug,
  merchantLogoUrl,
  categoryLabels = [],
  isFollowing,
  onFollow,
  onAddCart,
  onIncrementCart,
  onDecrementCart,
  cartQuantity = 0,
  similarProducts = [],
  similarPlaces = [],
  loadingSimilar,
  onSelectSimilarProduct,
  onSelectSimilarPlace,
  scrollRef,
  contentPaddingBottom = 40,
  sheetScrollY,
  sheetTranslateY,
  collapsedOffsetSV,
  hidePeekHeaderAtCollapse = false,
  nativeScrollGesture,
  peekPanGesture,
}: ProductDetailSheetProps) {
  const inCart = cartQuantity > 0;
  const priceLabel = `${(priceCents / 100).toFixed(0)} ${currency.toUpperCase()}`;

  const peekHeaderHRef = useRef(0);
  const merchantBlockHRef = useRef(0);
  const scrollContentHRef = useRef(0);

  const logLayout = useCallback(
    (source: 'peekHeader' | 'merchantBlock' | 'scrollContent', height: number) => {
      if (source === 'peekHeader') peekHeaderHRef.current = height;
      if (source === 'merchantBlock') merchantBlockHRef.current = height;
      if (source === 'scrollContent') scrollContentHRef.current = height;

      discoverLog('overlay', 'productSheetLayout', {
        merchantSlug,
        productSlug,
        source,
        descriptionLen: description.length,
        peekHeaderH: peekHeaderHRef.current,
        merchantBlockH: merchantBlockHRef.current,
        scrollContentH: scrollContentHRef.current,
        contentFlow: true,
        staticContent: true,
        contentTransforms: false,
        pinnedFooter: false,
      });
    },
    [merchantSlug, productSlug, description.length],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (sheetScrollY) {
        sheetScrollY.value = event.contentOffset.y;
      }
    },
  });

  const scrollAnimatedProps = useAnimatedProps(() => {
    if (!sheetTranslateY || !collapsedOffsetSV) {
      return { scrollEnabled: true as const };
    }
    const collapsed = collapsedOffsetSV.value;
    const expandProgress =
      collapsed > 0 ? Math.max(0, Math.min(1, 1 - sheetTranslateY.value / collapsed)) : 1;
    return { scrollEnabled: expandProgress >= 0.05 };
  });

  const productHeader = hidePeekHeaderAtCollapse ? null : (
    <View onLayout={(e) => logLayout('peekHeader', e.nativeEvent.layout.height)}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{productName}</Text>
        <Text style={styles.price}>{priceLabel}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  );

  const merchantBlock = (
    <View onLayout={(e) => logLayout('merchantBlock', e.nativeEvent.layout.height)}>
      <View style={styles.merchantRow}>
        {merchantLogoUrl ? (
          <Image source={{ uri: merchantLogoUrl }} style={styles.merchantAvatar} />
        ) : (
          <View style={styles.merchantAvatar}>
            <Ionicons name="storefront-outline" size={18} color="#fff" />
          </View>
        )}
        <Text style={styles.merchantName}>{merchantName}</Text>
        <TouchableOpacity style={styles.followBtn} onPress={onFollow}>
          <Text style={styles.followText}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
      {categoryLabels.length > 0 ? (
        <View style={styles.chips}>
          {categoryLabels.map((label) => (
            <View key={label} style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  const cartBlock = inCart ? (
    <View style={styles.stepperRow}>
      <TouchableOpacity
        style={styles.stepperBtn}
        onPress={onDecrementCart}
        activeOpacity={0.85}
      >
        <Ionicons name="remove" size={22} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.stepperQty}>{cartQuantity}</Text>
      <TouchableOpacity
        style={styles.stepperBtn}
        onPress={onIncrementCart}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  ) : (
    <TouchableOpacity style={styles.cartBtn} onPress={onAddCart}>
      <Ionicons name="cart-outline" size={20} color="#fff" />
      <Text style={styles.cartBtnText}>Add to cart</Text>
    </TouchableOpacity>
  );

  const scrollView = (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      showsVerticalScrollIndicator={false}
      bounces
      onScroll={sheetScrollY ? scrollHandler : undefined}
      scrollEventThrottle={16}
      animatedProps={scrollAnimatedProps}
    >
      <View onLayout={(e) => logLayout('scrollContent', e.nativeEvent.layout.height)}>
        {merchantBlock}
        {cartBlock}

        {loadingSimilar ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
        ) : null}

        {similarProducts.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>You might also like this</Text>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarScroll}
            >
              {similarProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.similarCard}
                  activeOpacity={0.85}
                  onPress={() => item.slug && onSelectSimilarProduct?.(item.slug)}
                  disabled={!item.slug}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.similarImage} />
                  ) : (
                    <View style={[styles.similarImage, styles.similarImageEmpty]} />
                  )}
                  <Text style={styles.similarName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.priceCents != null && item.currency ? (
                    <Text style={styles.similarPrice}>
                      {(item.priceCents / 100).toFixed(0)} {item.currency.toUpperCase()}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </Animated.ScrollView>
          </View>
        ) : null}

        {similarPlaces.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Places similar to {merchantName}
            </Text>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarScroll}
            >
              {similarPlaces.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.placeCard}
                  activeOpacity={0.85}
                  onPress={() => item.slug && onSelectSimilarPlace?.(item.slug)}
                  disabled={!item.slug}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.placeImage} />
                  ) : (
                    <View style={[styles.placeImage, styles.similarImageEmpty]}>
                      <Ionicons
                        name={
                          item.kind === 'place' ? 'location-outline' : 'storefront-outline'
                        }
                        size={28}
                        color="rgba(255,255,255,0.4)"
                      />
                    </View>
                  )}
                  <Text style={styles.placeName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.tagline ? (
                    <Text style={styles.placeBio} numberOfLines={2}>
                      {item.tagline}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </Animated.ScrollView>
          </View>
        ) : null}
      </View>
    </Animated.ScrollView>
  );

  const peekHeaderNode = productHeader ? (
    peekPanGesture ? (
      <GestureDetector gesture={peekPanGesture}>
        <View style={styles.peekHeaderWrap}>{productHeader}</View>
      </GestureDetector>
    ) : (
      <View style={styles.peekHeaderWrap}>{productHeader}</View>
    )
  ) : null;

  return (
    <View style={styles.wrapper}>
      {peekHeaderNode}
      {nativeScrollGesture ? (
        <GestureDetector gesture={nativeScrollGesture}>{scrollView}</GestureDetector>
      ) : (
        scrollView
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  peekHeaderWrap: {
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  price: {
    color: OVERLAY_PRICE_GREEN,
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  merchantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  merchantName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followBtn: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  followText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: { color: '#fff', fontSize: 12 },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  cartBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  section: { marginTop: 24 },
  sectionTitle: {
    color: OVERLAY_SECTION_ACCENT,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  similarScroll: {
    gap: 12,
    paddingRight: 8,
  },
  similarCard: {
    width: 120,
  },
  similarImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarImageEmpty: {
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  similarPrice: {
    color: OVERLAY_PRICE_GREEN,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  placeCard: {
    width: 200,
  },
  placeImage: {
    width: 200,
    height: 112,
    borderRadius: 8,
    marginBottom: 8,
  },
  placeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  placeBio: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});
