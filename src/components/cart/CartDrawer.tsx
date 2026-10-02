'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import {
  useCartStore,
  selectCartCount,
  selectCartSubtotal,
  selectFreeShippingProgress,
} from '@/store/cart';
import { formatNaira } from '@/lib/money';

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const close = useCartStore((state) => state.close);
  const items = useCartStore((state) => state.items);
  const setQty = useCartStore((state) => state.setQty);
  const remove = useCartStore((state) => state.remove);

  const itemCount = useCartStore(selectCartCount);
  const subtotalKobo = useCartStore(selectCartSubtotal);
  const freeShipping = useCartStore(selectFreeShippingProgress);

  // Close drawer on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--ink)]/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-[var(--charcoal)] border-l border-[var(--gold)]/20 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[var(--sand)]/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[var(--gold)]" />
            <h2 className="font-serif text-xl text-[var(--ivory)] font-light">
              Acquisition Bag
            </h2>
            <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
              ({itemCount} {itemCount === 1 ? 'piece' : 'pieces'})
            </span>
          </div>

          <button
            onClick={close}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ivory)] hover:bg-[var(--ink)] transition-colors"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className="px-6 py-3.5 bg-[var(--ink)] border-b border-[var(--sand)]/10 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-[var(--sand)]/80">
              <Truck className="w-3.5 h-3.5 text-[var(--gold)]" />
              {freeShipping.isFree ? (
                <span className="text-[var(--gold)] font-medium">
                  Free Nationwide Insured Delivery Unlocked
                </span>
              ) : (
                <span>
                  Add <strong className="text-[var(--gold)]">{formatNaira(freeShipping.remainingKobo)}</strong> for Free Delivery
                </span>
              )}
            </span>
            <span className="text-[10px] text-[var(--muted)]">{freeShipping.progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--charcoal)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--gold-deep)] to-[var(--gold)] transition-all duration-300"
              style={{ width: `${freeShipping.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-14 h-14 rounded-full bg-[var(--ink)] border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl text-[var(--ivory)]">Your Bag Is Empty</h3>
              <p className="text-xs text-[var(--muted)] max-w-xs leading-relaxed">
                Discover our curated collection of mechanical timepieces and chronometers.
              </p>
              <div className="pt-2">
                <Link
                  href="/shop"
                  onClick={close}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            items.map((item) => {
              const isAtMaxStock = item.quantity >= item.stock;
              return (
                <div
                  key={item.productId}
                  className="flex gap-4 p-3.5 rounded-xl bg-[var(--ink)] border border-[var(--sand)]/10 hover:border-[var(--gold)]/30 transition-colors"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/shop/${item.slug}`}
                    onClick={close}
                    className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[var(--charcoal)]"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/shop/${item.slug}`}
                          onClick={close}
                          className="font-serif text-sm text-[var(--ivory)] hover:text-[var(--gold)] transition-colors line-clamp-1 font-medium"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => remove(item.productId)}
                          className="text-[var(--muted)] hover:text-[var(--danger)] p-1 transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="font-serif text-sm text-[var(--gold)] font-medium mt-0.5">
                        {formatNaira(item.priceKobo)}
                      </p>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-[var(--gold)]/30 rounded-lg bg-[var(--charcoal)] overflow-hidden">
                        <button
                          onClick={() => setQty(item.productId, item.quantity - 1)}
                          className="p-1.5 text-[var(--sand)] hover:bg-[var(--ink)] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-[var(--ivory)]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => setQty(item.productId, item.quantity + 1)}
                          disabled={isAtMaxStock}
                          className="p-1.5 text-[var(--sand)] hover:bg-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {isAtMaxStock && (
                        <span className="text-[10px] text-[var(--warning)] uppercase tracking-wider">
                          Max Stock ({item.stock})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[var(--sand)]/10 bg-[var(--ink)]/50 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>Subtotal</span>
                <span className="font-serif text-lg text-[var(--gold)] font-medium">
                  {formatNaira(subtotalKobo)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                <span>Shipping Calculation</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={close}
                className="w-full inline-flex items-center justify-center gap-2.5 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] font-semibold py-3.5 px-6 rounded-lg text-xs uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-[var(--gold)]/20"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/cart"
                onClick={close}
                className="w-full inline-flex items-center justify-center py-2.5 text-xs uppercase tracking-wider text-[var(--sand)] hover:text-[var(--gold)] transition-colors"
              >
                Review Full Bag Details
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--muted)] pt-1">
              <ShieldCheck className="w-3 h-3 text-[var(--gold)]" />
              <span>Direct Bank Wire & Pay on Delivery Accepted</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
