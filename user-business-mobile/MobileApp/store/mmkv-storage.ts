import type { StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

type MmkvLike = {
  set: (key: string, value: string | number | boolean) => void;
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
};

let mmkvWarned = false;

function createMockStorage(): MmkvLike {
  const mockStorage = new Map<string, string>();
  return {
    set: (key, value) => mockStorage.set(key, String(value)),
    getString: (key) => mockStorage.get(key),
    delete: (key) => mockStorage.delete(key),
  };
}

const storageCache = new Map<string, MmkvLike>();

function getOrCreateStorage(id: string): MmkvLike {
  const cached = storageCache.get(id);
  if (cached) return cached;

  try {
    const instance = createMMKV({ id });
    storageCache.set(id, instance);
    return instance;
  } catch (e) {
    if (!mmkvWarned) {
      mmkvWarned = true;
      console.warn(
        'MMKV native module unavailable (rebuild with `npx expo run:android`). Using in-memory storage until then.',
        e,
      );
    }
    const mock = createMockStorage();
    storageCache.set(id, mock);
    return mock;
  }
}

export function createMmkvStorage(id: string): StateStorage {
  return {
    setItem: (name, value) => {
      getOrCreateStorage(id).set(name, value);
    },
    getItem: (name) => getOrCreateStorage(id).getString(name) ?? null,
    removeItem: (name) => {
      getOrCreateStorage(id).delete(name);
    },
  };
}

/** Default store bucket (balance, bookmarks, wallet). */
export const zustandStorage = createMmkvStorage('ycago-app-storage');

/** Isolated cart persistence. */
export const cartZustandStorage = createMmkvStorage('ycago-cart');
