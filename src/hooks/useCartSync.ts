'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCartStore, CartItem } from '@/store/cart';

interface PopulatedServerCartRow {
  id: string;
  productId: string;
  quantity: number;
  updatedAt?: string | Date;
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    priceKobo: number;
    imageUrl: string;
    stock: number;
    category: string;
  };
}

/**
 * Compares two cart item arrays to avoid redundant state updates.
 */
function areCartItemsEqual(local: CartItem[], server: PopulatedServerCartRow[]): boolean {
  if (local.length !== server.length) return false;
  const serverMap = new Map(server.map((s) => [s.productId, s.quantity]));
  for (const item of local) {
    if (serverMap.get(item.productId) !== item.quantity) {
      return false;
    }
  }
  return true;
}

/**
 * Custom hook to synchronize the web browser cart with the server database cart.
 * - Active 2.5s adaptive polling while browser tab is visible.
 * - Instant refetch on window focus and tab visibility change.
 * - Cross-tab instant notification via BroadcastChannel.
 * - Hydrates database cart items into the local Zustand store in real time without resurrecting deleted items.
 */
export function useCartSync(isAuthenticated?: boolean) {
  const setServerCart = useCartStore((s) => s.setServerCart);
  const isSyncingRef = useRef(false);
  const hasMergedGuestRef = useRef(false);

  const applyServerItems = useCallback((items: PopulatedServerCartRow[]) => {
    const mapped: CartItem[] = items.map((row) => ({
      productId: row.product.id,
      slug: row.product.slug,
      name: row.product.name,
      image: row.product.imageUrl,
      priceKobo: row.product.priceKobo,
      quantity: row.quantity,
      stock: row.product.stock,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
    }));
    setServerCart(mapped);
  }, [setServerCart]);

  const sync = useCallback(async () => {
    if (isSyncingRef.current || typeof window === 'undefined' || isAuthenticated === false) return;

    try {
      isSyncingRef.current = true;
      const res = await fetch('/api/cart', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      
      // Guest or unauthenticated - skip sync
      if (!res.ok) return;

      const data = await res.json();
      const serverItems = (Array.isArray(data?.items) ? data.items : []) as PopulatedServerCartRow[];
      const localItems = useCartStore.getState().items;

      // One-time guest-to-user cart merge upon initial authenticated load
      if (!hasMergedGuestRef.current && localItems.length > 0 && serverItems.length === 0) {
        hasMergedGuestRef.current = true;
        const putRes = await fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: localItems.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              updatedAt: i.updatedAt || new Date().toISOString(),
            })),
          }),
        });
        if (putRes.ok) {
          const putData = await putRes.json();
          const merged = (Array.isArray(putData?.items) ? putData.items : []) as PopulatedServerCartRow[];
          applyServerItems(merged);
          return;
        }
      }

      hasMergedGuestRef.current = true;

      // Only update Zustand if server items differ from local items (avoids render thrashing)
      if (!areCartItemsEqual(localItems, serverItems)) {
        applyServerItems(serverItems);
      }
    } catch (err) {
      console.warn('[CartSync] Background sync error:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [applyServerItems, isAuthenticated]);

  useEffect(() => {
    // Initial sync
    sync();

    // Instant refetch on window focus
    const onFocus = () => {
      sync();
    };

    // Instant refetch on tab visibility change
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sync();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 2.5s Adaptive Polling when document is visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sync();
      }
    }, 2500);

    // Cross-tab broadcast listener for instant multi-tab sync
    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('dave_store_cart_channel');
        channel.onmessage = (event) => {
          if (event.data === 'cart_updated') {
            sync();
          }
        };
      } catch {}
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(intervalId);
      if (channel) {
        channel.close();
      }
    };
  }, [sync]);

  return { sync };
}
