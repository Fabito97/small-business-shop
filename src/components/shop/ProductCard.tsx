'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/server/db/schema';
import { formatNaira } from '@/lib/money';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const addItem = useCartStore((state) => state.add);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.imageUrl,
        priceKobo: product.priceKobo,
        stock: product.stock,
      },
      1
    );

    toast.success(`Added ${product.name} to your collection`);
  };

  return (
    <div
      className={`group bg-[var(--charcoal)] rounded-xl border border-[var(--gold)]/15 overflow-hidden flex flex-col justify-between hover:border-[var(--gold)]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--ink)]/50 ${
        isOutOfStock ? 'opacity-70' : ''
      }`}
    >
      {/* Top Image Showcase */}
      <div className="relative aspect-square bg-[var(--ink)] overflow-hidden">
        <Link href={`/shop/${product.slug}`} className="block w-full h-full">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Category Pill */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--ink)]/85 backdrop-blur-sm border border-[var(--gold)]/25 text-[10px] uppercase tracking-wider text-[var(--gold)] font-medium">
          {product.category}
        </div>

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 rounded-full bg-[var(--ink)]/90 backdrop-blur-sm border border-[var(--danger)]/40 text-[10px] uppercase tracking-wider text-[var(--danger)] font-medium">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 rounded-full bg-[var(--warning)]/20 backdrop-blur-sm border border-[var(--warning)]/40 text-[10px] uppercase tracking-wider text-[var(--warning)] font-medium">
              Only {product.stock} Left
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-[var(--success)]/10 backdrop-blur-sm border border-[var(--success)]/30 text-[10px] uppercase tracking-wider text-[var(--success)] font-medium">
              In Stock
            </span>
          )}
        </div>

        {/* Movement Pill (Bottom Left) */}
        {product.movement && (
          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-[var(--charcoal)]/80 backdrop-blur-sm text-[9px] uppercase tracking-wider text-[var(--muted)] border border-[var(--sand)]/10">
            {product.movement}
          </div>
        )}
      </div>

      {/* Details Box */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-[var(--muted)] mb-1">
            <span>{product.brand}</span>
            {product.caseSizeMm && <span>{product.caseSizeMm}mm</span>}
          </div>

          <Link href={`/shop/${product.slug}`} className="block group-hover:text-[var(--gold)] transition-colors">
            <h3 className="font-serif text-xl text-[var(--ivory)] font-light leading-snug line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-[var(--muted)] mt-1.5 line-clamp-2 leading-relaxed font-light">
            {product.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-4 border-t border-[var(--sand)]/10 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] block">
              Acquisition
            </span>
            <span className="font-serif text-lg text-[var(--gold)] font-medium">
              {formatNaira(product.priceKobo)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--ink)] hover:bg-[var(--gold)] text-[var(--sand)] hover:text-[var(--ink)] text-xs uppercase tracking-wider font-semibold border border-[var(--gold)]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'Sold' : 'Add'}</span>
            </button>

            <Link
              href={`/shop/${product.slug}`}
              className="px-2.5 py-2 rounded-lg border border-[var(--sand)]/20 hover:border-[var(--gold)]/40 text-[var(--muted)] hover:text-[var(--sand)] text-xs transition-colors"
              title="Inspect specifications"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
