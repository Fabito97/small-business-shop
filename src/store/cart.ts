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
  updatedAt?: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, 'quantity' | 'updatedAt'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setServerCart: (items: CartItem[]) => void;
}

function syncServerItem(productId: string, quantity: number, updatedAt?: string) {
  if (typeof window === 'undefined') return;
  fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      quantity,
      updatedAt: updatedAt || new Date().toISOString(),
    }),
  }).catch(() => {});
}

function notifyLocalTabs() {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel('dave_store_cart_channel');
      channel.postMessage('cart_updated');
      channel.close();
    } catch {}
  }
}

function syncServerClear() {
  if (typeof window === 'undefined') return;
  fetch('/api/cart', { method: 'DELETE' }).catch(() => {});
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      add: (item, qty = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex((i) => i.productId === item.productId);
        const nowIso = new Date().toISOString();

        let finalQty = qty;
        if (existingIndex > -1) {
          const existing = items[existingIndex];
          const newQty = Math.min(existing.quantity + qty, item.stock);
          finalQty = newQty;
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...existing,
            quantity: newQty,
            stock: item.stock,
            updatedAt: nowIso,
          };
          set({ items: updatedItems, isOpen: true });
        } else {
          const initialQty = Math.min(Math.max(1, qty), item.stock);
          finalQty = initialQty;
          set({
            items: [...items, { ...item, quantity: initialQty, updatedAt: nowIso }],
            isOpen: true,
          });
        }
        syncServerItem(item.productId, finalQty, nowIso);
        notifyLocalTabs();
      },

      setQty: (productId, qty) => {
        const { items } = get();
        if (qty <= 0) {
          set({ items: items.filter((i) => i.productId !== productId) });
          syncServerItem(productId, 0);
          return;
        }

        const nowIso = new Date().toISOString();
        let clamped = qty;
        set({
          items: items.map((i) => {
            if (i.productId === productId) {
              clamped = Math.min(qty, i.stock);
              return { ...i, quantity: clamped, updatedAt: nowIso };
            }
            return i;
          }),
        });
        syncServerItem(productId, clamped, nowIso);
        notifyLocalTabs();
      },

      remove: (productId) => {
        const nowIso = new Date().toISOString();
        set({ items: get().items.filter((i) => i.productId !== productId) });
        syncServerItem(productId, 0, nowIso);
        notifyLocalTabs();
      },

      clear: () => {
        set({ items: [] });
        syncServerClear();
        notifyLocalTabs();
      },

      setServerCart: (items) => {
        set({ items });
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
