import { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import {
  HERO_VISIBLE_UNTIL,
  morphLayerOpacity,
  sourceHeroMorphOpacity,
} from '@/components/commerce/menuTransitionTokens';



/** YT Music sheet-expand morph — see `.local/docs/product-detail-media-layout.md` Round 15–16. */

export const HERO_LAYOUT_READY = 1;



/** Source hero opacity — complementary to morph layer (one visible album at a time). */

export function useExpandHeroMorphOpacityStyle(

  sheetTranslateY: SharedValue<number>,

  collapsedOffsetSV: SharedValue<number>,

) {

  return useAnimatedStyle(() => {

    const collapsed = collapsedOffsetSV.value;

    if (collapsed <= 0) return { opacity: 1 };



    const expandProgress = Math.max(

      0,

      Math.min(1, 1 - sheetTranslateY.value / collapsed),

    );



    return { opacity: sourceHeroMorphOpacity(expandProgress) };

  });

}



/** Hero band + backdrop fade in sync with source hero (not delayed to 0.7). */

export function useHeroBandFadeStyle(

  sheetTranslateY: SharedValue<number>,

  collapsedOffsetSV: SharedValue<number>,

) {

  return useAnimatedStyle(() => {

    const collapsed = collapsedOffsetSV.value;

    if (collapsed <= 0) return { opacity: 1 };



    const expandProgress = Math.max(

      0,

      Math.min(1, 1 - sheetTranslateY.value / collapsed),

    );



    return { opacity: sourceHeroMorphOpacity(expandProgress) };

  });

}



/** Menu carousel hero — full opacity at peek, then morph-aligned fade. */
export function useMenuCarouselHeroOpacityStyle(
  sheetTranslateY: SharedValue<number>,
  collapsedOffsetSV: SharedValue<number>,
) {
  return useAnimatedStyle(() => {
    const collapsed = collapsedOffsetSV.value;
    if (collapsed <= 0) return { opacity: 1 };

    const expandProgress = Math.max(
      0,
      Math.min(1, 1 - sheetTranslateY.value / collapsed),
    );

    if (expandProgress <= HERO_VISIBLE_UNTIL) return { opacity: 1 };

    return { opacity: sourceHeroMorphOpacity(expandProgress) };
  });
}

/** Menu hero band wrapper — same peek-visible curve as carousel item. */
export function useMenuHeroBandOpacityStyle(
  sheetTranslateY: SharedValue<number>,
  collapsedOffsetSV: SharedValue<number>,
) {
  return useAnimatedStyle(() => {
    const collapsed = collapsedOffsetSV.value;
    if (collapsed <= 0) return { opacity: 1 };

    const expandProgress = Math.max(
      0,
      Math.min(1, 1 - sheetTranslateY.value / collapsed),
    );

    if (expandProgress <= HERO_VISIBLE_UNTIL) return { opacity: 1 };

    return { opacity: sourceHeroMorphOpacity(expandProgress) };
  });
}

/** Bleed image opacity synced with hero band during sheet expand. */

export function useHeroBleedOpacityStyle(

  sheetTranslateY: SharedValue<number>,

  collapsedOffsetSV: SharedValue<number>,

) {

  return useAnimatedStyle(() => {

    const collapsed = collapsedOffsetSV.value;

    if (collapsed <= 0) return { opacity: 0.35 };



    const expandProgress = Math.max(

      0,

      Math.min(1, 1 - sheetTranslateY.value / collapsed),

    );



    const heroOpacity = sourceHeroMorphOpacity(expandProgress);
    const morphOpacity = morphLayerOpacity(expandProgress);

    return { opacity: 0.35 * heroOpacity * (1 - morphOpacity) };

  });

}


