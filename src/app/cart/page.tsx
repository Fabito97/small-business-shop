'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import {
  useCartStore,
  selectCartCount,
  selectCartSubtotal,
  selectCartShippingFee,
  selectCartTotal,
  selectFreeShippingProgress,
} from '@/store/cart';
import { formatNaira } from '@/lib/money';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function CartPage() {
  const mounted = useIsMounted();
  const items = useCartStore((state) => state.items);
  const setQty = useCartStore((state) => state.setQty);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);

  const itemCount = useCartStore(selectCartCount);
  const subtotalKobo = useCartStore(selectCartSubtotal);
  const shippingFeeKobo = useCartStore(selectCartShippingFee);
  const totalKobo = useCartStore(selectCartTotal);
  const freeShipping = useCartStore(selectFreeShippingProgress);

  // Avoid hydration mismatch while reading from persisted localStorage
  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--charcoal)] mx-auto" />
          <div className="h-4 w-40 bg-[var(--charcoal)] mx-auto rounded" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--charcoal)] border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] mx-auto mb-6">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--ivory)] font-light">
          Your Vault Is Currently Empty
        </h1>
        <p className="text-sm text-[var(--muted)] max-w-md mx-auto mt-3 leading-relaxed">
          You have not selected any timepieces for your acquisition bag. Explore our collection of certified chronometers and bespoke complications.
        </p>
        <div className="pt-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] font-semibold px-8 py-4 rounded-lg text-xs uppercase tracking-[0.2em] transition-all shadow-lg"
          >
            <span>Explore Watch Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--sand)]/10 pb-6">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-[var(--gold)] font-medium">
            Client Selections
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--ivory)] font-light mt-1">
            Acquisition Bag ({itemCount} {itemCount === 1 ? 'Timepiece' : 'Timepieces'})
          </h1>
        </div>

        <button
          onClick={clear}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All Selections</span>
        </button>
      </div>

      {/* Free Shipping Meter */}
      <div className="p-4 rounded-xl bg-[var(--charcoal)] border border-[var(--gold)]/20">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="flex items-center gap-2 text-[var(--sand)]">
            <Truck className="w-4 h-4 text-[var(--gold)]" />
            {freeShipping.isFree ? (
              <strong className="text-[var(--gold)] font-semibold">
                Complimentary Nationwide Insured Delivery Unlocked!
              </strong>
            ) : (
              <span>
                Add <strong className="text-[var(--gold)]">{formatNaira(freeShipping.remainingKobo)}</strong> more to receive free insured shipping across Nigeria
              </span>
            )}
          </span>
          <span className="text-xs text-[var(--muted)]">{freeShipping.progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--ink)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--gold-deep)] to-[var(--gold)] transition-all duration-300"
            style={{ width: `${freeShipping.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Grid: Items List (Left) + Summary Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Items Table / Cards */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const isAtMaxStock = item.quantity >= item.stock;
            const lineTotalKobo = item.priceKobo * item.quantity;

            return (
              <div
                key={item.productId}
                className="p-5 rounded-2xl bg-[var(--charcoal)] border border-[var(--gold)]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-[var(--gold)]/30 transition-colors"
              >
                {/* Product Thumbnail & Details */}
                <div className="flex items-center gap-4">
                  <Link
                    href={`/shop/${item.slug}`}
                    className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[var(--ink)] border border-[var(--sand)]/10"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="space-y-1">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="font-serif text-lg text-[var(--ivory)] hover:text-[var(--gold)] transition-colors font-medium line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">
                      Unit Value: {formatNaira(item.priceKobo)}
                    </p>
                    <p className="text-xs text-[var(--sand)]/60">
                      Vault Stock: {item.stock} available
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-[var(--sand)]/10 pt-3 sm:pt-0">
                  {/* Stepper */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center border border-[var(--gold)]/30 rounded-lg bg-[var(--ink)] overflow-hidden">
                      <button
                        onClick={() => setQty(item.productId, item.quantity - 1)}
                        className="p-2 text-[var(--sand)] hover:bg-[var(--charcoal)] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3.5 text-xs font-semibold text-[var(--ivory)]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => setQty(item.productId, item.quantity + 1)}
                        disabled={isAtMaxStock}
                        className="p-2 text-[var(--sand)] hover:bg-[var(--charcoal)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {isAtMaxStock && (
                      <span className="text-[10px] text-[var(--warning)] mt-1 uppercase tracking-wider">
                        Max Stock
                      </span>
                    )}
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[110px]">
                    <span className="font-serif text-lg text-[var(--gold)] font-medium">
                      {formatNaira(lineTotalKobo)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => remove(item.productId)}
                    className="p-2 text-[var(--muted)] hover:text-[var(--danger)] transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Browsing Collection</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-[var(--charcoal)] border border-[var(--gold)]/20 rounded-2xl p-6 space-y-6 sticky top-28 shadow-xl">
          <h2 className="font-serif text-xl text-[var(--ivory)] border-b border-[var(--sand)]/10 pb-4 font-light">
            Acquisition Summary
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-[var(--sand)]/80">
              <span>Timepieces Subtotal</span>
              <span className="font-serif text-sm text-[var(--ivory)]">
                {formatNaira(subtotalKobo)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[var(--sand)]/80">
              <span>Nationwide Insured Delivery</span>
              {shippingFeeKobo === 0 ? (
                <span className="text-[var(--gold)] font-medium uppercase tracking-wider text-[11px]">
                  Free (Complimentary)
                </span>
              ) : (
                <span className="font-serif text-sm text-[var(--ivory)]">
                  {formatNaira(shippingFeeKobo)}
                </span>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--sand)]/10 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--ivory)] uppercase tracking-wider">
                Total Value
              </span>
              <span className="font-serif text-2xl text-[var(--gold)] font-medium">
                {formatNaira(totalKobo)}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center gap-2.5 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] font-semibold py-4 px-6 rounded-lg text-xs uppercase tracking-[0.2em] transition-all shadow-lg hover:shadow-[var(--gold)]/20"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Value Assurance Badges */}
          <div className="pt-4 border-t border-[var(--sand)]/10 space-y-3 text-[11px] text-[var(--muted)]">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[var(--gold)] shrink-0" />
              <span>Certified provenance & 12-month manufacturer movement warranty.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-[var(--gold)] shrink-0" />
              <span>Full insurance coverage during transit across all 36 states.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
