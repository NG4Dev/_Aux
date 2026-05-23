export type MediaAspect =
  | 'square'
  | 'landscape'
  | 'portrait'
  | 'portrait45'
  | 'portrait34'
  | 'story';

export type MediaItem = {
  uri: string;
  type: 'image' | 'video';
  width: number;
  height: number;
  aspect?: MediaAspect;
};

export type ContentBadge = {
  label: string;
  color: string;
};

export type ContentStatus = 'open' | 'closed' | 'upcoming' | 'live';

export type ContentType = 'place' | 'event' | 'product' | 'post';

export type ContentItem = {
  id: string;
  contentType: ContentType;
  title: string;
  subtitle?: string;
  description?: string;
  media: MediaItem[];
  badge?: ContentBadge;
  status?: ContentStatus;
  verified?: boolean;
  profileName: string;
  profileAvatar: string;
  businessId?: string;
  productSlug?: string;
  merchantSlug?: string;
  categories: string[];
  chyron?: string;
};

export type DiscoverCategory = {
  id: string;
  label: string;
  color: string;
  image: string;
};

export type SearchHistoryEntry = {
  id: string;
  query: string;
};

export type SearchResult = {
  id: string;
  entityType: ContentType | 'list';
  title: string;
  subtitle: string;
  image: string;
};
