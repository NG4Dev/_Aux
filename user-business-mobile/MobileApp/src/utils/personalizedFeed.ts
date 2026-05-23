import type { ContentItem } from '@/types/content';

export type PersonalizedFeedItem = {
  kind: 'product' | 'merchant';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string | null;
  merchantSlug?: string;
  productSlug?: string;
  score?: number;
  personalized: boolean;
};

export function mapFeedItemToContentItem(item: PersonalizedFeedItem): ContentItem {
  return {
    id: item.id,
    contentType: item.kind === 'merchant' ? 'place' : 'product',
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    media: item.imageUrl
      ? [
          {
            uri: item.imageUrl,
            type: 'image',
            width: 1080,
            height: 1080,
            aspect: 'square',
          },
        ]
      : [],
    profileName: item.subtitle ?? item.title,
    profileAvatar: `https://i.pravatar.cc/80?u=${encodeURIComponent(item.id)}`,
    merchantSlug: item.merchantSlug,
    productSlug: item.productSlug,
    businessId: item.merchantSlug,
    categories: item.personalized ? ['For you'] : ['Discover'],
    verified: item.personalized,
  };
}
