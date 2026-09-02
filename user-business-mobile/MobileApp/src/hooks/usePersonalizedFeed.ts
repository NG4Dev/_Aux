import { useAction } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/convex/_generated/api';
import { discoverError, discoverLog } from '@/services/discoverFlowLogger';
import type { PersonalizedFeedItem } from '@/utils/personalizedFeed';

export type FeedMeta = {
  tasteSlots: number;
  exploreSlots: number;
  categorySpread: Record<string, number>;
  entityTypeSpread: Record<string, number>;
};

type FeedResponse = {
  items: PersonalizedFeedItem[];
  meta: FeedMeta;
};

const emptyMeta: FeedMeta = {
  tasteSlots: 0,
  exploreSlots: 0,
  categorySpread: {},
  entityTypeSpread: {},
};

function normalizeFeedResponse(feed: unknown): FeedResponse {
  if (Array.isArray(feed)) {
    return {
      items: feed as PersonalizedFeedItem[],
      meta: { ...emptyMeta, exploreSlots: feed.length },
    };
  }
  if (feed && typeof feed === 'object') {
    const response = feed as Partial<FeedResponse>;
    const items = Array.isArray(response.items) ? response.items : [];
    return {
      items,
      meta: response.meta ?? { ...emptyMeta, exploreSlots: items.length },
    };
  }
  return { items: [], meta: emptyMeta };
}

function isAuthRelatedError(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes('not signed in') ||
    msg.includes('unauthorized') ||
    msg.includes('auth') ||
    msg.includes('token')
  );
}

export function usePersonalizedFeed(limit = 20) {
  const { isLoaded } = useAuth();
  const getPersonalizedFeed = useAction(
    api.platform.discovery.getPersonalizedFeed,
  );
  const [items, setItems] = useState<PersonalizedFeedItem[]>([]);
  const [meta, setMeta] = useState<FeedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authRetriedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError(null);
    try {
      const feed = normalizeFeedResponse(await getPersonalizedFeed({ limit }));
      setItems(feed.items);
      setMeta(feed.meta);
      authRetriedRef.current = false;
    } catch (err) {
      if (isAuthRelatedError(err) && !authRetriedRef.current) {
        authRetriedRef.current = true;
        await new Promise((r) => setTimeout(r, 400));
        try {
          const feed = normalizeFeedResponse(await getPersonalizedFeed({ limit }));
          setItems(feed.items);
          setMeta(feed.meta);
          setLoading(false);
          return;
        } catch (retryErr) {
          setError(String(retryErr));
        }
      } else {
        setError(String(err));
      }
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [getPersonalizedFeed, isLoaded, limit]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh();
  }, [isLoaded, refresh]);

  return { items, meta, loading, error, refresh };
}

function isTransientNetworkError(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes('connection lost') ||
    msg.includes('in flight') ||
    msg.includes('network') ||
    msg.includes('fetch failed') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('socket')
  );
}

export function useDiscoverFeed(categorySlug: string | undefined, limit = 20) {
  const getDiscoverFeed = useAction(api.platform.discovery.getDiscoverFeed);
  const [items, setItems] = useState<PersonalizedFeedItem[]>([]);
  const [meta, setMeta] = useState<FeedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!categorySlug) {
      setItems([]);
      setMeta(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    discoverLog('feed', 'fetchStart', { categorySlug, limit });

    const retryDelaysMs = [0, 400, 800];
    let lastErr: unknown = null;

    for (let attempt = 0; attempt < retryDelaysMs.length; attempt++) {
      if (retryDelaysMs[attempt] > 0) {
        await new Promise((r) => setTimeout(r, retryDelaysMs[attempt]));
        discoverLog('feed', 'fetchRetry', {
          categorySlug,
          limit,
          attempt: attempt + 1,
        });
      }
      try {
        const feed = normalizeFeedResponse(
          await getDiscoverFeed({ categorySlug, limit }),
        );
        setItems(feed.items);
        setMeta(feed.meta);
        discoverLog('feed', 'fetchReady', {
          categorySlug,
          count: feed.items.length,
          tasteSlots: feed.meta.tasteSlots,
          exploreSlots: feed.meta.exploreSlots,
          categorySpread: feed.meta.categorySpread,
          entityTypeSpread: feed.meta.entityTypeSpread,
          attempt: attempt + 1,
        });
        setLoading(false);
        return;
      } catch (err) {
        lastErr = err;
        if (!isTransientNetworkError(err) || attempt === retryDelaysMs.length - 1) {
          break;
        }
      }
    }

    const err = lastErr ?? new Error('Unknown feed fetch failure');
    if (isTransientNetworkError(err)) {
      discoverLog('feed', 'fetchRetryExhausted', {
        categorySlug,
        limit,
        error: String(err),
      });
    } else {
      discoverError('feed', 'fetchError', err, { categorySlug, limit });
    }
    setError(String(err));
    setItems([]);
    setMeta(null);
    setLoading(false);
  }, [getDiscoverFeed, categorySlug, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, meta, loading, error, refresh };
}
