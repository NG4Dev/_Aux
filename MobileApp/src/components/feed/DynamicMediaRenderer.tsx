import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { MediaItem } from '@/types/content';

type DynamicMediaRendererProps = {
  media: MediaItem;
  maxHeight?: number;
  borderRadius?: number;
  autoPlay?: boolean;
};

const ASPECT_MAP: Record<string, number> = {
  square: 1,
  landscape: 1080 / 566,
  portrait: 1080 / 1350,
  story: 9 / 16,
};

function resolveAspect(media: MediaItem): number {
  if (media.aspect && ASPECT_MAP[media.aspect]) {
    return ASPECT_MAP[media.aspect];
  }
  if (media.width && media.height) {
    return media.width / media.height;
  }
  return 1;
}

function VideoMedia({
  uri,
  aspect,
  maxHeight,
  borderRadius,
  autoPlay,
}: {
  uri: string;
  aspect: number;
  maxHeight?: number;
  borderRadius: number;
  autoPlay: boolean;
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
        maxHeight ? { maxHeight } : undefined,
        { borderRadius },
      ]}
    >
      <VideoView
        player={player}
        style={[styles.video, { aspectRatio: aspect }]}
        contentFit="cover"
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
}: DynamicMediaRendererProps) {
  const aspect = resolveAspect(media);

  if (media.type === 'video') {
    return (
      <VideoMedia
        uri={media.uri}
        aspect={aspect}
        maxHeight={maxHeight}
        borderRadius={borderRadius}
        autoPlay={autoPlay}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        maxHeight ? { maxHeight } : undefined,
        { borderRadius },
      ]}
    >
      <Image
        source={{ uri: media.uri }}
        style={[styles.image, { aspectRatio: aspect }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  image: {
    width: '100%',
  },
  video: {
    width: '100%',
  },
});
