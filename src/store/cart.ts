import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SHOP } from '@/config/shop';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  priceKobo: number;
  quantity: number;
  stock: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      add: (item, qty = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex((i) => i.productId === item.productId);

        if (existingIndex > -1) {
          const existing = items[existingIndex];
          const newQty = Math.min(existing.quantity + qty, item.stock);
          const updatedItems = [...items];
          updatedItems[existingIndex] = { ...existing, quantity: newQty, stock: item.stock };
          set({ items: updatedItems, isOpen: true });
        } else {
          const initialQty = Math.min(Math.max(1, qty), item.stock);
          set({
            items: [...items, { ...item, quantity: initialQty }],
            isOpen: true,
          });
        }
      },

      setQty: (productId, qty) => {
        const { items } = get();
        if (qty <= 0) {
          set({ items: items.filter((i) => i.productId !== productId) });
          return;
        }

        set({
          items: items.map((i) => {
            if (i.productId === productId) {
              const clamped = Math.min(qty, i.stock);
              return { ...i, quantity: clamped };
            }
            return i;
          }),
        });
      },

      remove: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      clear: () => {
        set({ items: [] });
      },

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'meridian_cart_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Derived calculations
export const selectCartCount = (state: CartState) =>
  state.items.reduce((acc, item) => acc + item.quantity, 0);

export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((acc, item) => acc + item.priceKobo * item.quantity, 0);

export const selectCartShippingFee = (state: CartState) => {
  const subtotal = selectCartSubtotal(state);
  if (subtotal === 0 || subtotal >= SHOP.freeShippingThresholdKobo) {
    return 0;
  }
  return SHOP.shippingFeeKobo;
};

export const selectCartTotal = (state: CartState) => {
  return selectCartSubtotal(state) + selectCartShippingFee(state);
};

export function getFreeShippingProgress(subtotalKobo: number) {
  const threshold = SHOP.freeShippingThresholdKobo;
  const progressPercent = Math.min(100, Math.round((subtotalKobo / threshold) * 100));
  const remainingKobo = Math.max(0, threshold - subtotalKobo);

  return {
    isFree: subtotalKobo >= threshold,
    progressPercent,
    remainingKobo,
  };
}
