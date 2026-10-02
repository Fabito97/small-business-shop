'use client';

import { ShoppingBag } from 'lucide-react';
import { useCartStore, selectCartCount } from '@/store/cart';
import { useIsMounted } from '@/hooks/useIsMounted';

export function CartIconBadge() {
  const mounted = useIsMounted();
  const openCart = useCartStore((state) => state.open);
  const itemCount = useCartStore(selectCartCount);

  return (
    <button
      onClick={openCart}
      className="relative p-2 text-[var(--sand)] hover:text-[var(--gold)] transition-colors focus:outline-none"
      aria-label="View shopping bag"
    >
      <ShoppingBag className="w-5 h-5" />

      {/* Hydration-safe count badge */}
      {mounted && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--gold)] text-[var(--ink)] text-[10px] font-bold flex items-center justify-center animate-in zoom-in-50 duration-200 shadow-md">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
