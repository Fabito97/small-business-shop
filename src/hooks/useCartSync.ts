'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/store/cart';

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
 * Custom hook to synchronize the web browser cart with the server database cart.
 * - Bridges cart items between Web and Expo Go mobile clients.
 * - Flushes any pre-login guest items to the database upon authentication.
 * - Hydrates database cart items into the local store.
 */
export function useCartSync(isAuthenticated: boolean) {
  const setServerCart = useCartStore((s) => s.setServerCart);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || isSyncingRef.current) return;

    let isMounted = true;

    async function sync() {
      try {
        isSyncingRef.current = true;
        const res = await fetch('/api/cart');
        if (!res.ok) return;

        const data = await res.json();
        const serverItems = (Array.isArray(data?.items) ? data.items : []) as PopulatedServerCartRow[];

        if (!isMounted) return;

        const currentLocalItems = useCartStore.getState().items;

        // If user has local items, merge them onto server
        if (currentLocalItems.length > 0) {
          const syncRes = await fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: currentLocalItems.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                updatedAt: i.updatedAt || new Date().toISOString(),
              })),
            }),
          });

          if (syncRes.ok) {
            const syncData = await syncRes.json();
            const merged = (Array.isArray(syncData?.items) ? syncData.items : []) as PopulatedServerCartRow[];
            if (isMounted && merged.length > 0) {
              setServerCart(
                merged.map((row) => ({
                  productId: row.product.id,
                  slug: row.product.slug,
                  name: row.product.name,
                  image: row.product.imageUrl,
                  priceKobo: row.product.priceKobo,
                  quantity: row.quantity,
                  stock: row.product.stock,
                  updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
                }))
              );
            }
          }
        } else if (serverItems.length > 0) {
          // Hydrate server items into web store
          setServerCart(
            serverItems.map((row) => ({
              productId: row.product.id,
              slug: row.product.slug,
              name: row.product.name,
              image: row.product.imageUrl,
              priceKobo: row.product.priceKobo,
              quantity: row.quantity,
              stock: row.product.stock,
              updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
            }))
          );
        }
      } catch (err) {
        console.warn('[CartSync] Background sync failed:', err);
      } finally {
        isSyncingRef.current = false;
      }
    }

    sync();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, setServerCart]);
}
