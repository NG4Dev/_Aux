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
      const feed = (await getPersonalizedFeed({ limit })) as FeedResponse;
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
      const feed = (await getDiscoverFeed({ categorySlug, limit })) as FeedResponse;
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
