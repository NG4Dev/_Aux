import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  aspectFrameHeight,
  aspectRatioFor,
  heroContentFit,
  imageSlotHeight,
  overlayHeroUsesLetterbox,
} from '@/components/commerce/getSheetSnapPoints';
import type { MediaAspect, MediaItem } from '@/types/content';

export type MediaRenderMode =
  | 'feed'
  | 'feedCover'
  | 'feedLetterbox'
  | 'hero'
  | 'heroCover'
  | 'heroLetterbox'
  | 'fill';

type DynamicMediaRendererProps = {
  media: MediaItem;
  maxHeight?: number;
  borderRadius?: number;
  autoPlay?: boolean;
  contentFit?: 'cover' | 'contain';
  mode?: MediaRenderMode;
  contentWidth?: number;
  letterboxColor?: string;
};

function resolveAspect(media: MediaItem): number {
  if (media.aspect) {
    return aspectRatioFor(media.aspect);
  }
  if (media.width && media.height) {
    return media.width / media.height;
  }
  return 1;
}

function resolveAspectKey(media: MediaItem): MediaAspect {
  return media.aspect ?? 'square';
}

function intrinsicAspect(media: MediaItem): number {
  if (media.width && media.height) {
    return media.width / media.height;
  }
  return resolveAspect(media);
}

function VideoMedia({
  uri,
  slotHeight,
  borderRadius,
  autoPlay,
  contentFit,
  letterboxColor,
}: {
  uri: string;
  slotHeight: number;
  borderRadius: number;
  autoPlay: boolean;
  contentFit: 'cover' | 'contain';
  letterboxColor?: string;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    if (autoPlay) p.play();
  });

  return (
    <View
      style={[
        styles.container,
        contentFit === 'contain' && styles.containContainer,
        contentFit === 'contain' && letterboxColor
          ? { backgroundColor: letterboxColor }
          : undefined,
        { height: slotHeight, borderRadius },
      ]}
    >
      <VideoView
        player={player}
        style={contentFit === 'cover' ? styles.coverMedia : styles.containImage}
        contentFit={contentFit}
        nativeControls={false}
      />
    </View>
  );
}

export default function DynamicMediaRenderer({
  media,
  maxHeight,
  borderRadius = 0,
  autoPlay = false,
  contentFit,
  mode = 'fill',
  contentWidth,
  letterboxColor = '#f2f2f2',
}: DynamicMediaRendererProps) {
  const aspectKey = resolveAspectKey(media);
  const width = contentWidth ?? undefined;
  const intrinsic = intrinsicAspect(media);

  let slotHeight: number;
  let fit: 'cover' | 'contain';
  let bgColor: string | undefined;

  if (mode === 'feed' || mode === 'feedCover') {
    slotHeight = maxHeight ?? aspectFrameHeight(aspectKey, width);
    fit = 'cover';
  } else if (mode === 'feedLetterbox' || mode === 'heroLetterbox') {
    slotHeight = maxHeight ?? aspectFrameHeight('portrait45', width);
    fit = 'contain';
    bgColor = letterboxColor;
  } else if (mode === 'heroCover') {
    const letterbox = overlayHeroUsesLetterbox(aspectKey, media);
    if (letterbox) {
      slotHeight = maxHeight ?? aspectFrameHeight('portrait45', width);
      fit = 'contain';
      bgColor = letterboxColor;
    } else {
      slotHeight = maxHeight ?? aspectFrameHeight(aspectKey, width);
      fit = 'cover';
    }
  } else if (mode === 'hero') {
    slotHeight = maxHeight ?? imageSlotHeight(aspectKey, width);
    fit = contentFit ?? heroContentFit(aspectKey);
    bgColor = fit === 'contain' ? letterboxColor : undefined;
  } else {
    slotHeight = maxHeight ?? aspectFrameHeight(aspectKey, width);
    fit = contentFit ?? 'cover';
  }

  const resizeMode = fit === 'contain' ? 'contain' : 'cover';
  const containerBg =
    fit === 'contain' ? (bgColor ?? letterboxColor) : 'transparent';

  if (media.type === 'video') {
    return (
      <VideoMedia
        uri={media.uri}
        slotHeight={slotHeight}
        borderRadius={borderRadius}
        autoPlay={autoPlay}
        contentFit={fit}
        letterboxColor={bgColor}
      />
    );
  }

  if (fit === 'contain') {
    return (
      <View
        style={[
          styles.container,
          styles.containContainer,
          { height: slotHeight, borderRadius, backgroundColor: containerBg },
        ]}
      >
        <Image
          source={{ uri: media.uri }}
          style={{ width: '100%', aspectRatio: intrinsic }}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { height: slotHeight, borderRadius, backgroundColor: containerBg },
      ]}
    >
      <Image
        source={{ uri: media.uri }}
        style={styles.coverMedia}
        resizeMode={resizeMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  containContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containImage: {
    width: '100%',
    height: '100%',
  },
  coverMedia: {
    width: '100%',
    height: '100%',
  },
});
