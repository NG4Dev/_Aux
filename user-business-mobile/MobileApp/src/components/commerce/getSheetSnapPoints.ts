import { Dimensions } from 'react-native';
import type { MediaAspect } from '@/types/content';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const EXPANDED_SHEET_RATIO = 0.88;

const ASPECT_RATIO_MAP: Record<MediaAspect, number> = {
  square: 1,
  landscape: 1080 / 608,
  portrait: 1080 / 1350,
  portrait45: 1080 / 1350,
  portrait34: 1080 / 1440,
  story: 9 / 16,
};

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

const HERO_MAX_HEIGHT_RATIO: Record<MediaAspect, number> = {
  square: 0.42,
  portrait: 0.5,
  portrait45: 0.5,
  portrait34: 0.52,
  landscape: 0.32,
  story: 0.72,
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

export function expandedSheetHeight(): number {
  return SCREEN_HEIGHT * EXPANDED_SHEET_RATIO;
}

/** Max hero image height by aspect (see docs/product-detail-media-layout.md). */
export function heroMaxHeight(aspect: MediaAspect | null | undefined): number {
  const key = aspect ?? 'square';
  const ratio = HERO_MAX_HEIGHT_RATIO[key] ?? HERO_MAX_HEIGHT_RATIO.square;
  return SCREEN_HEIGHT * ratio;
}

/** Fixed image slot height: min(natural aspect height, heroMaxHeight). */
export function imageSlotHeight(
  aspect: MediaAspect | null | undefined,
  contentWidth: number = SCREEN_WIDTH - 32,
): number {
  const maxH = heroMaxHeight(aspect);
  const key = aspect ?? 'square';
  const ratio = ASPECT_RATIO_MAP[key] ?? 1;
  const naturalH = contentWidth / ratio;
  return Math.min(maxH, naturalH);
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
