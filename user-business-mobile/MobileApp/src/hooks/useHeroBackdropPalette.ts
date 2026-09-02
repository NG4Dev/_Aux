import { useEffect, useRef, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { discoverLog } from '@/services/discoverFlowLogger';
import { extractHeroBackdropColorNative } from '@/utils/extractHeroBackdropColorNative';
import {
  FALLBACK_TOP,
  hashUrl,
  toPalette,
  type HeroBackdropPalette,
} from '@/utils/heroBackdropColorUtils';

import {
  getCachedHeroBackdropColor,
  setCachedHeroBackdropColor,
} from '@/utils/heroBackdropPaletteCache';

export type { HeroBackdropPalette } from '@/utils/heroBackdropColorUtils';

export function useHeroBackdropPalette(imageUrl?: string | null): HeroBackdropPalette {
  const extractHeroBackdropColor = useAction(api.platform.heroPalette.extractHeroBackdropColor);
  const extractRef = useRef(extractHeroBackdropColor);
  extractRef.current = extractHeroBackdropColor;

  const [palette, setPalette] = useState<HeroBackdropPalette>(() =>
    toPalette(FALLBACK_TOP, 'idle'),
  );
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!imageUrl) {
      setPalette(toPalette(FALLBACK_TOP, 'fallback'));
      return;
    }

    const cached = getCachedHeroBackdropColor(imageUrl);
    if (cached) {
      setPalette(toPalette(cached, 'ready'));
      return;
    }

    const requestId = ++requestIdRef.current;
    const started = Date.now();
    setPalette((prev) => ({ ...prev, status: 'loading' }));

    const finish = (swatch: string, source: 'native' | 'convex' | 'fallback') => {
      if (requestId !== requestIdRef.current) return;

      const status = swatch === FALLBACK_TOP ? 'fallback' : 'ready';
      if (status === 'ready') {
        setCachedHeroBackdropColor(imageUrl, swatch);
      }

      discoverLog('overlay', 'heroBackdropPalette', {
        urlHash: hashUrl(imageUrl),
        topColor: swatch,
        durationMs: Date.now() - started,
        status,
        source,
      });

      setPalette(toPalette(swatch, status));
    };

    (async () => {
      const nativeSwatch = await extractHeroBackdropColorNative(imageUrl);
      if (nativeSwatch && nativeSwatch !== FALLBACK_TOP) {
        finish(nativeSwatch, 'native');
        return;
      }

      try {
        const { topColor } = await extractRef.current({ imageUrl });
        finish(topColor || FALLBACK_TOP, topColor === FALLBACK_TOP ? 'fallback' : 'convex');
      } catch {
        finish(FALLBACK_TOP, 'fallback');
      }
    })();
  }, [imageUrl]);

  return palette;
}
