import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../../store/mmkv-storage';

interface WalletState {
  isEnabled: boolean;
  enableWallet: () => void;
  disableWallet: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      isEnabled: false,
      enableWallet: () => set({ isEnabled: true }),
      disableWallet: () => set({ isEnabled: false }),
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);