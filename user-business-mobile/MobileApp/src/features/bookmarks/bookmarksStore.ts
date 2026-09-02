import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../../store/mmkv-storage';
import type {
  BookmarkSearchHistoryEntry,
  BookmarkSortKey,
  BookmarkViewMode,
  Collection,
} from './types';

type CreateCollectionInput = {
  name: string;
  location: string;
};

interface BookmarksState {
  collections: Collection[];
  activeLocation: string;
  viewMode: BookmarkViewMode;
  sortKey: BookmarkSortKey;
  searchHistory: BookmarkSearchHistoryEntry[];

  createCollection: (input: CreateCollectionInput) => Collection;
  deleteCollection: (collectionId: string) => void;
  renameCollection: (collectionId: string, name: string) => void;
  addItemToCollection: (collectionId: string, itemId: string) => void;
  removeItemFromCollection: (collectionId: string, itemId: string) => void;

  setActiveLocation: (location: string) => void;
  setViewMode: (mode: BookmarkViewMode) => void;
  setSortKey: (key: BookmarkSortKey) => void;

  pushSearchHistory: (query: string) => void;
  removeSearchHistory: (id: string) => void;
  clearSearchHistory: () => void;
}

const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set) => ({
      collections: [],
      activeLocation: 'Cape Town',
      viewMode: 'grid',
      sortKey: 'recent',
      searchHistory: [],

      createCollection: ({ name, location }) => {
        const collection: Collection = {
          id: generateId(),
          name: name.trim(),
          location,
          itemIds: [],
          createdAt: Date.now(),
        };
        set((state) => ({ collections: [...state.collections, collection] }));
        return collection;
      },

      deleteCollection: (collectionId) =>
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== collectionId),
        })),

      renameCollection: (collectionId, name) =>
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId ? { ...c, name: name.trim() } : c,
          ),
        })),

      addItemToCollection: (collectionId, itemId) =>
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId && !c.itemIds.includes(itemId)
              ? { ...c, itemIds: [itemId, ...c.itemIds] }
              : c,
          ),
        })),

      removeItemFromCollection: (collectionId, itemId) =>
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, itemIds: c.itemIds.filter((id) => id !== itemId) }
              : c,
          ),
        })),

      setActiveLocation: (location) => set({ activeLocation: location }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSortKey: (key) => set({ sortKey: key }),

      pushSearchHistory: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        set((state) => {
          const filtered = state.searchHistory.filter(
            (entry) => entry.query.toLowerCase() !== trimmed.toLowerCase(),
          );
          return {
            searchHistory: [
              { id: generateId(), query: trimmed },
              ...filtered,
            ].slice(0, 10),
          };
        });
      },

      removeSearchHistory: (id) =>
        set((state) => ({
          searchHistory: state.searchHistory.filter((entry) => entry.id !== id),
        })),

      clearSearchHistory: () => set({ searchHistory: [] }),
    }),
    {
      name: 'bookmarks-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

export const selectCollectionsForLocation = (
  collections: Collection[],
  location: string,
) => collections.filter((c) => c.location === location);

export const sortCollections = (
  collections: Collection[],
  key: BookmarkSortKey,
) => {
  const copy = [...collections];
  switch (key) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'count':
      return copy.sort((a, b) => b.itemIds.length - a.itemIds.length);
    case 'recent':
    default:
      return copy.sort((a, b) => b.createdAt - a.createdAt);
  }
};
