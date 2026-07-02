import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import ReelViewerShell, { SideActionButton } from '@/components/feed/ReelViewerShell';
import { discoverLog } from '@/services/discoverFlowLogger';
import type { MediaItem } from '@/types/content';

export type ContentReelVariant = 'contentVideo' | 'contentImage';

type ContentReelViewProps = {
  visible: boolean;
  variant: ContentReelVariant;
  media: MediaItem;
  creatorName: string;
  creatorAvatar?: string;
  caption?: string;
  onDismiss: () => void;
  backActionRef?: React.MutableRefObject<(() => void) | null>;
};

export default function ContentReelView({
  visible,
  variant,
  media,
  creatorName,
  creatorAvatar,
  caption,
  onDismiss,
  backActionRef,
}: ContentReelViewProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const bottomBarHeight = 72 + insets.bottom;
  const sideStackWidth = 56;
  const mediaMaxHeight = screenHeight - insets.top - bottomBarHeight - 56;
  const mediaMaxWidth = screenWidth - sideStackWidth - 24;

  const storyMedia = useMemo(
    () => ({ ...media, aspect: 'story' as const }),
    [media],
  );

  const handleDismiss = useCallback(
    (source: 'chevron' | 'edgeSwipe' | 'hardwareBack' | 'stackBack') => {
      discoverLog('contentReel', 'dismiss', {
        variant,
        source,
        mediaUri: media.uri,
        creatorName,
      });
      onDismiss();
    },
    [variant, media.uri, creatorName, onDismiss],
  );

  useEffect(() => {
    if (!visible) return;
    discoverLog('contentReel', 'visible', {
      variant,
      mediaType: media.type,
      creatorName,
    });
  }, [visible, variant, media.type, creatorName]);

  useEffect(() => {
    if (!visible || !backActionRef) return;
    backActionRef.current = () => handleDismiss('stackBack');
  }, [visible, backActionRef, handleDismiss]);

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleDismiss('hardwareBack');
      return true;
    });
    return () => subscription.remove();
  }, [visible, handleDismiss]);

  const edgeBackGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(24)
        .failOffsetY([-24, 24])
        .onEnd((e) => {
          if (e.translationX > 72 || e.velocityX > 450) {
            runOnJS(handleDismiss)('edgeSwipe');
          }
        }),
    [handleDismiss],
  );

  if (!visible) return null;

  const sideStack = (
    <>
      <SideActionButton icon="heart-outline" onPress={() => {}} />
      <SideActionButton icon="chatbubble-outline" onPress={() => {}} />
      <SideActionButton icon="share-outline" onPress={() => {}} />
    </>
  );

  const bottomBar = (
    <>
      {creatorAvatar ? (
        <Image source={{ uri: creatorAvatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarEmpty]} />
      )}
      <View style={styles.bottomText}>
        <Text style={styles.creatorName} numberOfLines={1}>
          {creatorName}
        </Text>
        {caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {caption}
          </Text>
        ) : null}
      </View>
    </>
  );

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <GestureHandlerRootView style={styles.root}>
        <ReelViewerShell
          onDismiss={() => handleDismiss('chevron')}
          mediaUri={media.uri}
          mediaType={variant === 'contentVideo' ? 'video' : 'image'}
          showSideStack
          sideStack={sideStack}
          bottomBar={bottomBar}
          mediaMaxHeight={mediaMaxHeight}
          mediaMaxWidth={mediaMaxWidth}
          contentFit="cover"
          showScrubBar={variant === 'contentVideo'}
          mediaOverlay={
            variant === 'contentImage' ? (
              <DynamicMediaRenderer
                media={storyMedia}
                mode="fill"
                maxHeight={mediaMaxHeight}
                contentWidth={mediaMaxWidth}
                contentFit="cover"
              />
            ) : undefined
          }
        />
        <GestureDetector gesture={edgeBackGesture}>
          <View style={styles.edgeBackZone} />
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  edgeBackZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 100,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  avatarEmpty: {
    backgroundColor: '#444',
  },
  bottomText: {
    flex: 1,
    minWidth: 0,
  },
  creatorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  caption: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});
