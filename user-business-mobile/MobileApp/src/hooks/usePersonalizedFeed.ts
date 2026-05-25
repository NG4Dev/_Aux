import { useAction } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/convex/_generated/api';
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

export function usePersonalizedFeed(limit = 20) {
  const getPersonalizedFeed = useAction(
    api.platform.discovery.getPersonalizedFeed,
  );
  const [items, setItems] = useState<PersonalizedFeedItem[]>([]);
  const [meta, setMeta] = useState<FeedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feed = normalizeFeedResponse(await getPersonalizedFeed({ limit }));
      setItems(feed.items);
      setMeta(feed.meta);
    } catch (err) {
      setError(String(err));
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [getPersonalizedFeed, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, meta, loading, error, refresh };
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
    try {
      const feed = normalizeFeedResponse(
        await getDiscoverFeed({ categorySlug, limit }),
      );
      setItems(feed.items);
      setMeta(feed.meta);
    } catch (err) {
      setError(String(err));
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [getDiscoverFeed, categorySlug, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, meta, loading, error, refresh };
}
