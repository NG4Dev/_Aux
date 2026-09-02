import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { FALLBACK_TOP, pickSwatch } from '@/utils/heroBackdropColorUtils';

type ImageColorsNativeResult = {
  platform: 'android' | 'ios' | 'web';
  dominant?: string;
  average?: string;
  vibrant?: string;
  darkVibrant?: string;
  lightVibrant?: string;
  darkMuted?: string;
  lightMuted?: string;
  muted?: string;
  primary?: string;
  secondary?: string;
  detail?: string;
  background?: string;
};

type ImageColorsNativeModule = {
  getColors: (
    uri: string,
    config?: Record<string, unknown>,
  ) => Promise<ImageColorsNativeResult>;
};

/** null = not yet tried; false = native module unavailable until app restart. */
let nativeExtractionAvailable: boolean | null = null;

let cachedNativeModule: ImageColorsNativeModule | null | undefined;

function getImageColorsModule(): ImageColorsNativeModule | null {
  if (cachedNativeModule !== undefined) {
    return cachedNativeModule;
  }

  const mod = requireOptionalNativeModule<ImageColorsNativeModule>('ImageColors');
  cachedNativeModule = mod ?? null;
  if (!mod) {
    nativeExtractionAvailable = false;
  }
  return mod;
}

export function isNativeHeroBackdropExtractionAvailable(): boolean | null {
  return nativeExtractionAvailable;
}

function swatchFromNativeResult(result: ImageColorsNativeResult): string {
  if (result.platform === 'android') {
    return pickSwatch({
      dominant: result.dominant,
      muted: result.average,
      darkMuted: result.darkMuted,
      vibrant: result.vibrant,
    });
  }
  if (result.platform === 'ios') {
    return pickSwatch({
      dominant: result.primary,
      muted: result.secondary,
      darkMuted: result.detail,
      vibrant: result.background,
    });
  }
  return pickSwatch({
    dominant: result.dominant,
    muted: result.muted,
    darkMuted: result.darkMuted,
    vibrant: result.vibrant,
  });
}

export async function extractHeroBackdropColorNative(
  imageUrl: string,
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  if (nativeExtractionAvailable === false) {
    return null;
  }

  const nativeModule = getImageColorsModule();
  if (!nativeModule) {
    return null;
  }

  try {
    const result = await nativeModule.getColors(imageUrl, {
      fallback: FALLBACK_TOP,
      cache: true,
      key: imageUrl,
    });

    const swatch = swatchFromNativeResult(result);
    nativeExtractionAvailable = true;
    return swatch;
  } catch {
    nativeExtractionAvailable = false;
    cachedNativeModule = null;
    return null;
  }
}
