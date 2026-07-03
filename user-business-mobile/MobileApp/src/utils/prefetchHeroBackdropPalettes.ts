import { Image } from 'react-native';
import {
  getCachedHeroBackdropColor,
  setCachedHeroBackdropColor,
} from '@/utils/heroBackdropPaletteCache';
import { extractHeroBackdropColorNative } from '@/utils/extractHeroBackdropColorNative';
import { FALLBACK_TOP } from '@/utils/heroBackdropColorUtils';

const inFlight = new Set<string>();

async function prefetchOne(
  imageUrl: string,
  extractConvex?: (args: { imageUrl: string }) => Promise<{ topColor: string }>,
): Promise<void> {
  if (!imageUrl || getCachedHeroBackdropColor(imageUrl) || inFlight.has(imageUrl)) {
    return;
  }

  inFlight.add(imageUrl);
  try {
    await Image.prefetch(imageUrl).catch(() => undefined);

    const nativeSwatch = await extractHeroBackdropColorNative(imageUrl);
    if (nativeSwatch && nativeSwatch !== FALLBACK_TOP) {
      setCachedHeroBackdropColor(imageUrl, nativeSwatch);
      return;
    }

    if (extractConvex) {
      const { topColor } = await extractConvex({ imageUrl });
      if (topColor && topColor !== FALLBACK_TOP) {
        setCachedHeroBackdropColor(imageUrl, topColor);
      }
    }
  } finally {
    inFlight.delete(imageUrl);
  }
}

export async function prefetchHeroBackdropPalettes(
  imageUrls: Array<string | null | undefined>,
  extractConvex?: (args: { imageUrl: string }) => Promise<{ topColor: string }>,
  concurrency = 3,
): Promise<void> {
  const urls = [...new Set(imageUrls.filter((u): u is string => Boolean(u)))];
  let index = 0;

  async function worker() {
    while (index < urls.length) {
      const url = urls[index];
      index += 1;
      await prefetchOne(url, extractConvex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));
}

export function prefetchHeroBackdropNeighbors(
  urls: string[],
  focusIndex: number,
  extractConvex?: (args: { imageUrl: string }) => Promise<{ topColor: string }>,
): void {
  const neighbors = [focusIndex - 2, focusIndex - 1, focusIndex + 1, focusIndex + 2]
    .filter((i) => i >= 0 && i < urls.length)
    .map((i) => urls[i]);
  void prefetchHeroBackdropPalettes(neighbors, extractConvex, 2);
}
