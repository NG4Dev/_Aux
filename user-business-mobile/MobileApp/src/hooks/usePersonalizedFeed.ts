import { useAction } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '@/convex/_generated/api';
import type { PersonalizedFeedItem } from '@/utils/personalizedFeed';

export function usePersonalizedFeed(limit = 20) {
  const { isSignedIn } = useAuth();
  const getPersonalizedFeed = useAction(
    api.platform.discovery.getPersonalizedFeed,
  );
  const [items, setItems] = useState<PersonalizedFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const feed = await getPersonalizedFeed({ limit });
      setItems(feed as PersonalizedFeedItem[]);
    } catch (err) {
      setError(String(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getPersonalizedFeed, isSignedIn, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}