export type Collection = {
  id: string;
  name: string;
  location: string;
  itemIds: string[];
  createdAt: number;
};

export type BookmarkSearchHistoryEntry = {
  id: string;
  query: string;
};

export type BookmarkViewMode = 'grid' | 'list';

export type BookmarkSortKey = 'recent' | 'name' | 'count';
