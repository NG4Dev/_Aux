/** YouTube Music–aligned sheet / morph / chrome thresholds for Menu tab. */

export const HERO_VISIBLE_UNTIL = 0.12;



export const MORPH_START = 0.02;

export const MORPH_END = 0.92;

export const MORPH_EASE_EXPONENT = 0.85;

export const MORPH_HERO_FADE_AFTER = 0.15;

/** Peek hero fades out linearly by this progress once morph ghost starts. */
export const MORPH_SOURCE_FADE_END = 0.08;

/** @deprecated Use MORPH_THUMB_HANDOFF_START */

export const MORPH_THUMB_HANDOFF = 0.88;

export const MORPH_THUMB_HANDOFF_START = 0.82;

export const MORPH_THUMB_HANDOFF_END = 0.92;



export const INLINE_FADE_OUT_START = 0.15;

export const INLINE_FADE_OUT_END = 0.5;



export const HEADER_MINI_FADE_IN_START = 0.5;

export const HEADER_MINI_FADE_IN_END = 0.75;



export const HERO_BAND_FADE_START = 0.7;

export const HERO_BAND_FADE_END = 0.95;



export const OVERLAY_FADE_MS = 180;

export const OVERLAY_CHIP_DELAY_MS = 60;

export const BACKDROP_CROSSFADE_MS = 400;

export const CAROUSEL_SETTLE_MS = 200;



/** Log heroMorphFrame once per milestone during sheet drag. */

export const HERO_MORPH_TELEMETRY_MILESTONES = [
  0.02, 0.15, 0.45, 0.5, 0.55, 0.75, 0.82, 0.88, 0.92,
] as const;



function morphBellCore(rawProgress: number): number {
  'worklet';

  if (rawProgress <= MORPH_START || rawProgress >= MORPH_END) return 0;

  const normalized = (rawProgress - MORPH_START) / (MORPH_END - MORPH_START);

  const clamped = Math.max(0, Math.min(1, normalized));

  const eased = Math.pow(clamped, MORPH_EASE_EXPONENT);

  return Math.min(1, Math.max(0, Math.sin(eased * Math.PI)));
}



export function morphLayerOpacity(rawProgress: number): number {

  'worklet';

  return morphBellCore(rawProgress);

}



export function morphHandoffT(rawProgress: number): number {

  'worklet';

  if (rawProgress <= MORPH_THUMB_HANDOFF_START) return 0;

  if (rawProgress >= MORPH_THUMB_HANDOFF_END) return 1;

  return (

    (rawProgress - MORPH_THUMB_HANDOFF_START) /

    (MORPH_THUMB_HANDOFF_END - MORPH_THUMB_HANDOFF_START)

  );

}



/** Morph ghost opacity with complementary header-thumb handoff (0.82–0.92). */

export function morphLayerWithHandoff(rawProgress: number): number {

  'worklet';

  return morphLayerOpacity(rawProgress) * (1 - morphHandoffT(rawProgress));

}



/** Header sticky thumb image opacity during morph handoff. */

export function headerThumbHandoffOpacity(rawProgress: number): number {

  'worklet';

  return morphHandoffT(rawProgress);

}



/** Inline peek thumb visible only before morph starts. */

export function inlineThumbPeekOpacity(rawProgress: number): number {

  'worklet';

  return rawProgress >= MORPH_START ? 0 : 1;

}



/** Source hero opacity — monotonic fade once morph starts (never reappears late in morph). */
export function sourceHeroMorphOpacity(rawProgress: number): number {
  'worklet';

  if (rawProgress <= MORPH_START) return 1;
  if (rawProgress >= MORPH_SOURCE_FADE_END) return 0;

  return (
    1 -
    (rawProgress - MORPH_START) / (MORPH_SOURCE_FADE_END - MORPH_START)
  );
}



export function morphEaseProgress(progress: number): number {

  'worklet';

  const clamped = Math.max(0, Math.min(1, progress));

  return Math.pow(clamped, MORPH_EASE_EXPONENT);

}



export function expandProgressFromSheet(

  sheetTranslateY: number,

  collapsedOffset: number,

): number {

  'worklet';

  if (collapsedOffset <= 0) return 0;

  const raw = 1 - sheetTranslateY / collapsedOffset;

  return Math.max(0, Math.min(1, raw));

}



export function morphLayerOpacityJs(rawProgress: number): number {

  return morphBellCore(rawProgress);

}



export function morphHandoffTJs(rawProgress: number): number {

  if (rawProgress <= MORPH_THUMB_HANDOFF_START) return 0;

  if (rawProgress >= MORPH_THUMB_HANDOFF_END) return 1;

  return (

    (rawProgress - MORPH_THUMB_HANDOFF_START) /

    (MORPH_THUMB_HANDOFF_END - MORPH_THUMB_HANDOFF_START)

  );

}



export function morphLayerWithHandoffJs(rawProgress: number): number {

  return morphLayerOpacityJs(rawProgress) * (1 - morphHandoffTJs(rawProgress));

}



export function headerThumbHandoffOpacityJs(rawProgress: number): number {

  return morphHandoffTJs(rawProgress);

}



export function inlineThumbPeekOpacityJs(rawProgress: number): number {

  return rawProgress >= MORPH_START ? 0 : 1;

}



export function sourceHeroMorphOpacityJs(rawProgress: number): number {
  if (rawProgress <= MORPH_START) return 1;
  if (rawProgress >= MORPH_SOURCE_FADE_END) return 0;

  return (
    1 -
    (rawProgress - MORPH_START) / (MORPH_SOURCE_FADE_END - MORPH_START)
  );
}


