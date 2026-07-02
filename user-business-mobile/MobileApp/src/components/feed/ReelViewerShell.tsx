import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  type ReactNode,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';

type ReelViewerShellProps = {
  onDismiss: () => void;
  mediaUri: string;
  mediaType: 'image' | 'video';
  showSideStack?: boolean;
  sideStack?: ReactNode;
  bottomBar: ReactNode;
  mediaMaxHeight: number;
  mediaMaxWidth: number;
  contentFit?: 'cover' | 'contain';
  showScrubBar?: boolean;
  mediaOverlay?: ReactNode;
};

function VideoWithScrub({
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
    <View style={styles.mediaWrap}>
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
        <View style={[styles.scrubFill, { width: `${Math.min(100, progress * 100)}%` }]} />
      </View>
    </View>
  );
}

export default function ReelViewerShell({
  onDismiss,
  mediaUri,
  mediaType,
  showSideStack,
  sideStack,
  bottomBar,
  mediaMaxHeight,
  mediaMaxWidth,
  contentFit = 'cover',
  showScrubBar = false,
  mediaOverlay,
}: ReelViewerShellProps) {
  const insets = useSafeAreaInsets();
  const bottomBarHeight = 72 + insets.bottom;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.collapseBtn, { top: insets.top + 8 }]}
        onPress={onDismiss}
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
            {mediaType === 'video' && showScrubBar ? (
              <VideoWithScrub
                uri={mediaUri}
                maxHeight={mediaMaxHeight}
                maxWidth={mediaMaxWidth}
                contentFit={contentFit}
              />
            ) : (
              <View style={styles.mediaWrap}>
                <View
                  style={[
                    styles.imageFrame,
                    { maxHeight: mediaMaxHeight, maxWidth: mediaMaxWidth },
                  ]}
                >
                  {/* Image rendered by parent via mediaOverlay or inline */}
                  {mediaOverlay}
                </View>
              </View>
            )}
          </View>

          {showSideStack && sideStack ? (
            <View style={[styles.sideStack, { paddingBottom: insets.bottom }]}>
              {sideStack}
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {bottomBar}
      </View>
    </View>
  );
}

export function SideActionButton({
  icon,
  onPress,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[sideBtnStyles.sideBtn, active && sideBtnStyles.sideBtnActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={22} color="#fff" />
    </TouchableOpacity>
  );
}

const sideBtnStyles = StyleSheet.create({
  sideBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sideBtnActive: {
    backgroundColor: '#00BFA5',
    borderColor: '#00BFA5',
  },
});

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
  mediaWrap: {
    width: '100%',
    alignItems: 'center',
  },
  imageFrame: {
    width: '100%',
    overflow: 'hidden',
  },
  coverMedia: {
    width: '100%',
    height: '100%',
  },
  sideStack: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingRight: 8,
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
});
