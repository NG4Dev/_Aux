import { Dimensions } from 'react-native';
import type { MediaAspect } from '@/types/content';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const EXPANDED_SHEET_RATIO = 0.88;

/** Width ÷ height — Instagram feed ratios (landscape 1080×566 ≈ 1.91:1). */
export const ASPECT_RATIO_MAP: Record<MediaAspect, number> = {
  square: 1,
  landscape: 1080 / 566,
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
  landscape: { defaultSnap: 0.28, expandedPreferred: false },
  story: { defaultSnap: 0.22, expandedPreferred: false },
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

/** Story/reel peek — sheet fully off-screen; floating card only (card tap expands). */
export function storyCollapsedPeekHeight(): number {
  return 0;
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
export function aspectRatioFor(
  aspect: MediaAspect | null | undefined,
): number {
  const key = aspect ?? 'square';
  return ASPECT_RATIO_MAP[key] ?? 1;
}

/** Exact IG frame height for a given content width (no cap). */
export function aspectFrameHeight(
  aspect: MediaAspect | null | undefined,
  contentWidth: number = SCREEN_WIDTH - 32,
): number {
  return contentWidth / aspectRatioFor(aspect);
}

/** Full-bleed feed media width (edge-to-edge). */
export function feedFullBleedWidth(): number {
  return SCREEN_WIDTH;
}

/** IG Reels-style tall outer frame for letterboxed landscape (4:5). */
export function feedLandscapeLetterboxHeight(
  contentWidth: number = SCREEN_WIDTH,
): number {
  return aspectFrameHeight('portrait45', contentWidth);
}

/** Whether feed should use tall letterbox frame instead of cover crop. */
export function shouldUseFeedLetterbox(
  aspect: MediaAspect,
  media: { width: number; height: number },
): boolean {
  if (!media.width || !media.height) return false;
  const intrinsic = media.width / media.height;
  if (aspect === 'landscape' && intrinsic < 1.0) {
    return true;
  }
  if (
    (aspect === 'story' ||
      aspect === 'portrait45' ||
      aspect === 'portrait34' ||
      aspect === 'portrait') &&
    intrinsic > 1.35
  ) {
    return true;
  }
  return false;
}

/** Feed slot height for a media item (cover or letterbox frame). */
export function feedSlotHeight(
  aspect: MediaAspect,
  media: { width: number; height: number },
  contentWidth: number = SCREEN_WIDTH,
): number {
  if (shouldUseFeedLetterbox(aspect, media)) {
    return feedLandscapeLetterboxHeight(contentWidth);
  }
  return feedPreviewHeight(aspect, contentWidth);
}

/** Feed preview height — preserves aspect; caps story so the list stays scrollable. */
export function feedPreviewHeight(
  aspect: MediaAspect | null | undefined,
  contentWidth: number = SCREEN_WIDTH,
): number {
  const frameH = aspectFrameHeight(aspect, contentWidth);
  if (aspect === 'story') {
    return Math.min(frameH, SCREEN_HEIGHT * 0.72);
  }
  return frameH;
}

/** Overlay hero content width (heroWrap paddingHorizontal: 16). */
export function overlayHeroWidth(): number {
  return SCREEN_WIDTH - 32;
}

/** Overlay hero slot height — same cover-in-frame policy as feed. */
export function overlayHeroSlotHeight(
  aspect: MediaAspect | null | undefined,
  media?: { width: number; height: number },
  contentWidth: number = overlayHeroWidth(),
): number {
  const key = aspect ?? 'square';
  if (media && shouldUseFeedLetterbox(key, media)) {
    return feedLandscapeLetterboxHeight(contentWidth);
  }
  const frameH = aspectFrameHeight(key, contentWidth);
  if (key === 'story') {
    return Math.min(frameH, SCREEN_HEIGHT * 0.72);
  }
  const maxH = heroMaxHeight(key);
  return Math.min(maxH, frameH);
}

export type OverlayCollapsedSheetParams = {
  mediaAspect: MediaAspect | null | undefined;
  heroSlotHeight: number;
  headerBottomY: number;
  captionReserve?: number;
  heroGap?: number;
  minPeek?: number;
  maxPeek?: number;
};

/** Menu queue peek — fraction of screen height (YouTube "Your Queue" style overlay). */
export const MENU_QUEUE_PEEK_RATIO = 0.38;

/** Max carousel image band as fraction of screen (hero stays visible above queue peek). */
export const MENU_CAROUSEL_BAND_MAX_RATIO = 0.42;

/** Menu tab: ratio-based queue peek height (sheet overlays hero band). */
export function menuTabCollapsedSheetHeight(
  peekRatio: number = MENU_QUEUE_PEEK_RATIO,
): number {
  return SCREEN_HEIGHT * peekRatio;
}

/** Capped carousel band: fixed slot height + image padding. */
export function menuCarouselDisplayBandHeight(
  maxFrameH: number,
  chromeH: number = menuCarouselChromeHeight(),
  inlinePlayerH: number = 0,
): number {
  const cappedFrame = Math.min(
    maxFrameH,
    SCREEN_HEIGHT * MENU_CAROUSEL_BAND_MAX_RATIO,
  );
  return cappedFrame + chromeH + inlinePlayerH;
}

/** Extra padding around carousel image band (title row lives in inline player). */
export function menuCarouselChromeHeight(): number {
  return 16;
}

/** YT-style inline mini-player strip between carousel and sheet lip. */
export function menuInlinePlayerBandHeight(): number {
  return 52;
}

export type MenuCarouselFrameProduct = {
  mediaAspect?: MediaAspect | null;
  imageWidth?: number;
  imageHeight?: number;
};

/** Aspect-aware hero frame height for one menu carousel item. */
export function menuCarouselFrameHeightForProduct(
  product: MenuCarouselFrameProduct,
): number {
  const aspect = product.mediaAspect ?? 'square';
  const media =
    product.imageWidth && product.imageHeight
      ? { width: product.imageWidth, height: product.imageHeight }
      : undefined;
  return overlayHeroSlotHeight(aspect, media);
}

/** Stable carousel band height — max frame across all menu products (no slide resize). */
export function maxMenuCarouselFrameHeight(
  products: MenuCarouselFrameProduct[],
): number {
  if (products.length === 0) {
    return overlayHeroSlotHeight('square');
  }
  return Math.max(...products.map(menuCarouselFrameHeightForProduct));
}

/** Collapsed sheet height that keeps the hero visible above the peek. */
export function overlayCollapsedSheetHeight({
  mediaAspect,
  heroSlotHeight,
  headerBottomY,
  captionReserve = 96,
  heroGap = 12,
  minPeek = 200,
}: OverlayCollapsedSheetParams): number {
  const heroBottomY = headerBottomY + heroSlotHeight + captionReserve;
  const maxSheetH = Math.max(minPeek, SCREEN_HEIGHT - heroBottomY - heroGap);
  return maxSheetH;
}

/** Whether overlay hero should letterbox mismatched intrinsic media. */
export function overlayHeroUsesLetterbox(
  aspect: MediaAspect | null | undefined,
  media?: { width: number; height: number },
): boolean {
  if (!aspect || !media) return false;
  return shouldUseFeedLetterbox(aspect, media);
}

/** Overlay design tokens (Figma). */
export const OVERLAY_PRICE_GREEN = '#00BFA5';
export const OVERLAY_SECTION_ACCENT = '#C75B5B';
export const OVERLAY_GRADIENT_TOP = '#3d2a1f';

/** Map discover slug to display label. */
export function discoverSlugToLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function imageSlotHeight(
  aspect: MediaAspect | null | undefined,
  contentWidth: number = SCREEN_WIDTH - 32,
): number {
  const maxH = heroMaxHeight(aspect);
  const naturalH = aspectFrameHeight(aspect, contentWidth);
  return Math.min(maxH, naturalH);
}

/** contentFit for overlay hero slots by aspect. */
export function heroContentFit(
  aspect: MediaAspect | null | undefined,
): 'cover' | 'contain' {
  const key = aspect ?? 'square';
  if (key === 'landscape' || key === 'story') {
    return 'contain';
  }
  return 'cover';
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

/** Max height for image slot given space above collapsed sheet. */
export function clampedImageSlotHeight(
  aspect: MediaAspect | null | undefined,
  headerBottomY: number,
  contentWidth: number = SCREEN_WIDTH - 32,
): number {
  const collapsedTop = SCREEN_HEIGHT * EXPANDED_SHEET_RATIO - snapHeight(aspect);
  const actionRail = 56;
  const captionReserve = 80;
  const budget = Math.max(80, collapsedTop - headerBottomY - 8 - actionRail - captionReserve);
  return Math.min(imageSlotHeight(aspect, contentWidth), budget);
}

/** Fullscreen expanded layout mode (Phase 3). */
export type ExpandedLayoutMode =
  | 'default'
  | 'landscape-media'
  | 'letterbox-rotate'
  | 'story-media'
  | 'story-rotate';

export function isDeviceLandscape(
  screenWidth: number,
  screenHeight: number,
): boolean {
  return screenWidth > screenHeight;
}

export function getExpandedLayoutMode(
  mediaAspect: MediaAspect | null | undefined,
  screenWidth: number = SCREEN_WIDTH,
  screenHeight: number = SCREEN_HEIGHT,
): ExpandedLayoutMode {
  const aspect = mediaAspect ?? 'square';

  if (aspect === 'landscape') {
    return 'landscape-media';
  }

  if (aspect === 'story') {
    return isDeviceLandscape(screenWidth, screenHeight)
      ? 'story-rotate'
      : 'story-media';
  }

  if (!isDeviceLandscape(screenWidth, screenHeight)) {
    return 'default';
  }

  return 'letterbox-rotate';
}

/** Whether expanded view should offer the rotate pill. */
export function expandedViewShowsRotatePill(mode: ExpandedLayoutMode): boolean {
  return mode === 'letterbox-rotate' || mode === 'story-rotate';
}

/** Whether expanded view uses the side action stack. */
export function expandedViewShowsSideStack(mode: ExpandedLayoutMode): boolean {
  return (
    mode === 'landscape-media' ||
    mode === 'letterbox-rotate' ||
    mode === 'story-media'
  );
}
