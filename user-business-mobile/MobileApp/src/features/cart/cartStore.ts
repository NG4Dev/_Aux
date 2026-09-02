import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { cartZustandStorage } from '../../../store/mmkv-storage';

export type CartLine = {
  productId: string;
  merchantSlug: string;
  merchantName?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  priceCents: number;
  currency: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  removeLine: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  clearMerchant: (merchantSlug: string) => void;
  linesByMerchant: () => Map<string, CartLine[]>;
  merchantSubtotalCents: (merchantSlug: string) => number;
  totalCents: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addLine: (line, quantity = 1) => {
        set((state) => {
          const existing = state.lines.find(
            (l) => l.productId === line.productId,
          );
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === line.productId
                  ? { ...l, quantity: l.quantity + quantity }
                  : l,
              ),
            };
          }
          return {
            lines: [...state.lines, { ...line, quantity }],
          };
        });
      },
      removeLine: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) =>
                  l.productId === productId ? { ...l, quantity } : l,
                ),
        })),
      clear: () => set({ lines: [] }),
      clearMerchant: (merchantSlug) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.merchantSlug !== merchantSlug),
        })),
      linesByMerchant: () => {
        const map = new Map<string, CartLine[]>();
        for (const line of get().lines) {
          const list = map.get(line.merchantSlug) ?? [];
          list.push(line);
          map.set(line.merchantSlug, list);
        }
        return map;
      },
      merchantSubtotalCents: (merchantSlug) =>
        get()
          .lines.filter((l) => l.merchantSlug === merchantSlug)
          .reduce((sum, line) => sum + line.priceCents * line.quantity, 0),
      totalCents: () =>
        get().lines.reduce(
          (sum, line) => sum + line.priceCents * line.quantity,
          0,
        ),
    }),
    {
      name: 'ycago-cart-storage',
      storage: createJSONStorage(() => cartZustandStorage),
    },
  ),
);
