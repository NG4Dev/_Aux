import { StateStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'

let storage: any;
try {
  storage = new MMKV({
    id: 'balance-storage'
  });
} catch (e) {
  console.warn("MMKV could not be initialized, falling back to mock storage:", e);
  const mockStorage = new Map<string, string>();
  storage = {
    set: (key: string, value: any) => mockStorage.set(key, String(value)),
    getString: (key: string) => mockStorage.get(key),
    delete: (key: string) => mockStorage.delete(key),
  };
}

//this is an adapter for mmkv storage engine
export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value)
  },
  getItem: (name) => {
    const value = storage.getString(name)
    return value ?? null
  },
  removeItem: (name) => {
    return storage.delete(name)
  },
}