import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import DynamicMediaRenderer from '@/components/feed/DynamicMediaRenderer';
import {
  feedFullBleedWidth,
  feedSlotHeight,
  shouldUseFeedLetterbox,
  toMediaAspect,
} from '@/components/commerce/getSheetSnapPoints';
import type { MediaAspect, MediaItem } from '@/types/content';

type FeedMediaSlotProps = {
  media: MediaItem;
  aspect?: MediaAspect;
  borderRadius?: number;
  fullBleed?: boolean;
  autoPlayVideo?: boolean;
  onPress?: () => void;
};

export default function FeedMediaSlot({
  media,
  aspect: aspectProp,
  borderRadius = 0,
  fullBleed = true,
  autoPlayVideo = true,
  onPress,
}: FeedMediaSlotProps) {
  const aspect = aspectProp ?? media.aspect ?? 'square';
  const contentWidth = fullBleed ? feedFullBleedWidth() : undefined;
  const slotHeight = useMemo(
    () => feedSlotHeight(aspect, media, contentWidth ?? feedFullBleedWidth()),
    [aspect, media, contentWidth],
  );
  const letterbox = shouldUseFeedLetterbox(aspect, media);
  const mode = letterbox ? 'feedLetterbox' : 'feedCover';
  const isStory = aspect === 'story';
  const shouldAutoplay =
    autoPlayVideo && media.type === 'video' && (isStory || letterbox);

  const content = (
    <View style={[styles.slot, { height: slotHeight }, fullBleed && styles.fullBleed]}>
      <DynamicMediaRenderer
        media={{ ...media, aspect: toMediaAspect(aspect) }}
        mode={mode}
        maxHeight={slotHeight}
        contentWidth={contentWidth}
        borderRadius={borderRadius}
        autoPlay={shouldAutoplay}
      />
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: '100%',
    overflow: 'hidden',
  },
  fullBleed: {
    marginHorizontal: -16,
    width: feedFullBleedWidth(),
    alignSelf: 'center',
  },
});
