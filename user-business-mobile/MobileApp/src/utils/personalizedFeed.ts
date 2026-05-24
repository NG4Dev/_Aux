import type { ContentItem, ContentStatus, MediaItem } from '@/types/content';

export type FeedBadge = {
  label: string;
  color: string;
};

export type FeedMediaItem = {
  uri: string;
  type: 'image' | 'video';
  width: number;
  height: number;
  aspect?: MediaItem['aspect'];
};

export type PersonalizedFeedItem = {
  kind: 'product' | 'merchant' | 'place' | 'event' | 'post';
  contentType: ContentItem['contentType'];
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  media: FeedMediaItem[];
  badge?: FeedBadge;
  status?: ContentStatus;
  chyron?: string;
  profileName: string;
  profileAvatar: string | null;
  merchantSlug?: string;
  productSlug?: string;
  businessId?: string;
  categories: string[];
  verified?: boolean;
  personalized: boolean;
  score?: number;
};

export function mapFeedItemToContentItem(item: PersonalizedFeedItem): ContentItem {
  return {
    id: item.id,
    contentType: item.contentType,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    media: item.media.map((m) => ({
      uri: m.uri,
      type: m.type,
      width: m.width,
      height: m.height,
      aspect: m.aspect,
    })),
    badge: item.badge,
    status: item.status,
    chyron: item.chyron,
    profileName: item.profileName,
    profileAvatar: item.profileAvatar ?? `https://i.pravatar.cc/80?u=${encodeURIComponent(item.id)}`,
    merchantSlug: item.merchantSlug,
    productSlug: item.productSlug,
    businessId: item.businessId ?? item.merchantSlug,
    categories: item.categories.length > 0 ? item.categories : ['Discover'],
    verified: item.verified,
  };
}
