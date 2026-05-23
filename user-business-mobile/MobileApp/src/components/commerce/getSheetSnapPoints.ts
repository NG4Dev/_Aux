import { Dimensions } from 'react-native';
import type { MediaAspect } from '@/types/content';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type SheetSnapConfig = {
  defaultSnap: number;
  expandedPreferred: boolean;
};

const SNAP_MAP: Record<MediaAspect, SheetSnapConfig> = {
  square: { defaultSnap: 0.42, expandedPreferred: false },
  portrait: { defaultSnap: 0.58, expandedPreferred: false },
  portrait45: { defaultSnap: 0.58, expandedPreferred: false },
  portrait34: { defaultSnap: 0.62, expandedPreferred: false },
  landscape: { defaultSnap: 0.28, expandedPreferred: true },
  story: { defaultSnap: 0.22, expandedPreferred: true },
};

export function getSheetSnapPoints(
  aspect: MediaAspect | null | undefined,
): SheetSnapConfig {
  if (!aspect) {
    return SNAP_MAP.square;
  }
  return SNAP_MAP[aspect] ?? SNAP_MAP.square;
}

export function snapHeight(aspect: MediaAspect | null | undefined): number {
  const config = getSheetSnapPoints(aspect);
  return SCREEN_HEIGHT * config.defaultSnap;
}

export function toMediaAspect(
  value: string | null | undefined,
): MediaAspect {
  if (
    value === 'square' ||
    value === 'portrait45' ||
    value === 'portrait34' ||
    value === 'landscape' ||
    value === 'story' ||
    value === 'portrait'
  ) {
    return value;
  }
  return 'square';
}
