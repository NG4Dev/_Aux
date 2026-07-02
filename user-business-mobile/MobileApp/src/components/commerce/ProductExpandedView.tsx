import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import { SideActionButton } from '@/components/feed/ReelViewerShell';
import {
  expandedViewShowsRotatePill,
  expandedViewShowsSideStack,
  getExpandedLayoutMode,
  overlayHeroWidth,
  OVERLAY_PRICE_GREEN,
} from '@/components/commerce/getSheetSnapPoints';
import type { MediaAspect, MediaItem } from '@/types/content';

type ProductExpandedViewProps = {
  media: MediaItem;
  aspect?: MediaAspect;
  onCollapse: () => void;
  productName: string;
  productDescription?: string;
  priceCents: number;
  currency: string;
  imageUrl?: string | null;
  inCart?: boolean;
  onShare: () => void;
  onAddCart: () => void;
  onAddToList: () => void;
};

function ExpandedVideoMedia({
  uri,
  maxHeight,
  maxWidth,
  contentFit,
}: {
  uri: string;
  maxHeight: number;
  maxWidth: number;
  contentFit: 'cover' | 'contain';
}) {
  const [progress, setProgress] = useState(0);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const duration = player.duration;
      const current = player.currentTime;
      if (duration > 0) {
        setProgress(current / duration);
      }
    }, 200);
    return () => clearInterval(id);
  }, [player]);

  return (
    <View style={styles.videoWrap}>
      <VideoView
        player={player}
        style={[
          styles.coverMedia,
          { maxHeight, maxWidth, width: maxWidth, height: maxHeight },
        ]}
        contentFit={contentFit}
        nativeControls={false}
      />
      <View style={styles.scrubTrack}>
        <View
          style={[styles.scrubFill, { width: `${Math.min(100, progress * 100)}%` }]}
        />
      </View>
    </View>
  );
}

export default function ProductExpandedView({
  media,
  aspect,
  onCollapse,
  productName,
  productDescription,
  priceCents,
  currency,
  imageUrl,
  inCart,
  onShare,
  onAddCart,
  onAddToList,
}: ProductExpandedViewProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [mediaRotated, setMediaRotated] = useState(false);

  const layoutMode = useMemo(
    () => getExpandedLayoutMode(aspect, screenWidth, screenHeight),
    [aspect, screenWidth, screenHeight],
  );

  const showSideStack = expandedViewShowsSideStack(layoutMode);
  const showRotatePill = expandedViewShowsRotatePill(layoutMode);

  const bottomBarHeight = 88 + insets.bottom;
  const sideStackWidth = showSideStack ? 56 : 0;
  const mediaMaxHeight = screenHeight - insets.top - bottomBarHeight - 56;
  const mediaMaxWidth = screenWidth - sideStackWidth - 24;
  const contentWidth = overlayHeroWidth();

  const priceLabel = `${(priceCents / 100).toFixed(0)} ${currency.toUpperCase()}`;

  const mediaContentFit =
    layoutMode === 'landscape-media' || layoutMode === 'story-media'
      ? 'cover'
      : 'contain';

  const frameHeight = mediaRotated ? mediaMaxWidth : mediaMaxHeight;
  const frameWidth = mediaMaxWidth;

  const storyMedia = useMemo(
    () => ({ ...media, aspect: aspect ?? media.aspect ?? 'story' }),
    [media, aspect],
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.collapseBtn, { top: insets.top + 8 }]}
        onPress={onCollapse}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-down" size={28} color="#fff" />
      </TouchableOpacity>

      <View
        style={[
          styles.body,
          {
            paddingTop: insets.top + 48,
            paddingBottom: bottomBarHeight,
          },
        ]}
      >
        <View style={styles.mediaRow}>
          <View style={[styles.mediaArea, { maxWidth: mediaMaxWidth }]}>
            {showRotatePill && (
              <TouchableOpacity
                style={styles.rotatePill}
                onPress={() => setMediaRotated((v) => !v)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={
                    mediaRotated ? 'phone-landscape-outline' : 'phone-portrait-outline'
                  }
                  size={16}
                  color="#fff"
                />
                <Text style={styles.rotatePillText}>
                  {mediaRotated ? 'Reset' : 'Rotate 90°'}
                </Text>
              </TouchableOpacity>
            )}

            <View
              style={[
                styles.mediaFrame,
                mediaRotated && styles.mediaFrameRotated,
                { maxHeight: mediaMaxHeight, maxWidth: mediaMaxWidth },
              ]}
            >
              {media.type === 'video' ? (
                <ExpandedVideoMedia
                  uri={media.uri}
                  maxHeight={frameHeight}
                  maxWidth={frameWidth}
                  contentFit={mediaContentFit}
                />
              ) : (
                <DynamicMediaRenderer
                  media={storyMedia}
                  mode="heroCover"
                  maxHeight={frameHeight}
                  contentWidth={contentWidth}
                  borderRadius={
                    layoutMode === 'landscape-media' || layoutMode === 'story-media'
                      ? 0
                      : 8
                  }
                  contentFit={mediaContentFit}
                />
              )}
            </View>

            {layoutMode === 'story-rotate' && !mediaRotated && (
              <Text style={styles.rotateHint}>
                Rotate your device or tap Rotate 90° for full view
              </Text>
            )}
          </View>

          {showSideStack && (
            <View style={[styles.sideStack, { paddingBottom: insets.bottom }]}>
              <SideActionButton
                icon={inCart ? 'cart' : 'cart-outline'}
                onPress={onAddCart}
                active={inCart}
              />
              <SideActionButton icon="list-outline" onPress={onAddToList} />
              <SideActionButton icon="share-outline" onPress={onShare} />
            </View>
          )}
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {(imageUrl ?? media.uri) ? (
          <Image
            source={{ uri: imageUrl ?? media.uri }}
            style={styles.thumbnail}
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailEmpty]} />
        )}
        <View style={styles.bottomText}>
          <Text style={styles.bottomName} numberOfLines={1}>
            {productName}
          </Text>
          {productDescription ? (
            <Text style={styles.bottomDesc} numberOfLines={2}>
              {productDescription}
            </Text>
          ) : null}
        </View>
        <Text style={styles.bottomPrice}>{priceLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  collapseBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  mediaRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  rotatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rotatePillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  mediaFrame: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaFrameRotated: {
    transform: [{ rotate: '90deg' }],
  },
  videoWrap: {
    width: '100%',
    alignItems: 'center',
  },
  coverMedia: {
    width: '100%',
    height: '100%',
  },
  scrubTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  scrubFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  rotateHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  sideStack: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingRight: 8,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(20,20,20,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  thumbnailEmpty: {
    backgroundColor: '#333',
  },
  bottomText: {
    flex: 1,
    minWidth: 0,
  },
  bottomName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  bottomPrice: {
    color: OVERLAY_PRICE_GREEN,
    fontSize: 16,
    fontWeight: '700',
  },
});
