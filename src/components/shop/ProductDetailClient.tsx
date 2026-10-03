'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  Truck,
  Clock,
  MessageSquare,
  Minus,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import type { Product } from '@/server/db/schema';
import { BRAND } from '@/config/brand';
import { SHOP } from '@/config/shop';
import { formatNaira } from '@/lib/money';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  // Gallery images (main image + any in gallery array)
  const allImages = [product.imageUrl, ...(product.gallery || [])];
  const [selectedImage, setSelectedImage] = useState(allImages[0]);
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const maxAvailable = Math.min(product.stock, 10);

  const addItem = useCartStore((state) => state.add);

  const handleDecreaseQty = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseQty = () => {
    setQuantity((prev) => Math.min(maxAvailable, prev + 1));
  };

  const handleAddToCart = () => {
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
      quantity
    );
    toast.success(`Added ${quantity} × ${product.name} to your collection`, {
      description: 'Your acquisition bag has been updated.',
    });
  };

  const whatsappMessage = encodeURIComponent(
    `Hello ${BRAND.name}, I am interested in acquiring the ${product.brand} ${product.name} (${formatNaira(
      product.priceKobo
    )}). Could you provide further details or arrange a private viewing?`
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      {/* Left Column: Image Gallery */}
      <div className="lg:col-span-7 space-y-4">
        {/* Main Display Image */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[var(--charcoal)] border border-[var(--gold)]/20 shadow-2xl">
          <Image
            src={selectedImage}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />

          {/* Stock overlay pill */}
          <div className="absolute top-4 right-4">
            {isOutOfStock ? (
              <span className="px-3 py-1 rounded-full bg-[var(--ink)]/90 backdrop-blur-md border border-[var(--danger)]/50 text-xs uppercase tracking-wider text-[var(--danger)] font-medium">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="px-3 py-1 rounded-full bg-[var(--warning)]/20 backdrop-blur-md border border-[var(--warning)]/40 text-xs uppercase tracking-wider text-[var(--warning)] font-medium">
                Only {product.stock} Left in Stock
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-[var(--success)]/10 backdrop-blur-md border border-[var(--success)]/30 text-xs uppercase tracking-wider text-[var(--success)] font-medium">
                In Stock · Ready to Deliver
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail Selector (if multiple images) */}
        {allImages.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative w-20 h-20 rounded-xl overflow-hidden bg-[var(--ink)] border transition-all ${
                  selectedImage === img
                    ? 'border-[var(--gold)] ring-2 ring-[var(--gold)]/40'
                    : 'border-[var(--gold)]/20 opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Watch Specs & Purchase */}
      <div className="lg:col-span-5 space-y-8">
        {/* Brand & Title */}
        <div className="space-y-2 border-b border-[var(--sand)] pb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.25em] text-[var(--gold)] font-medium">
              {product.brand}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--ink)] border border-[var(--gold)]/25 text-[10px] uppercase tracking-wider text-[var(--sand)]">
              {product.category} Collection
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--ink)] font-light leading-tight">
            {product.name}
          </h1>
          <div className="pt-2">
            <span className="text-[11px] uppercase tracking-wider text-[var(--muted)] block">
              Acquisition Value
            </span>
            <span className="font-serif text-3xl text-[var(--gold)] font-medium">
              {formatNaira(product.priceKobo)}
            </span>
          </div>
        </div>

        {/* Technical Specification Matrix */}
        <div className="bg-[var(--charcoal)] border border-[var(--gold)]/15 rounded-xl p-5 space-y-3">
          <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--ivory)] font-medium border-b border-[var(--sand)]/10 pb-2">
            Technical Complications
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {product.movement && (
              <div>
                <span className="text-[10px] uppercase text-[var(--muted)] block">Movement</span>
                <span className="text-[var(--sand)] font-medium">{product.movement}</span>
              </div>
            )}
            {product.caseSizeMm && (
              <div>
                <span className="text-[10px] uppercase text-[var(--muted)] block">Case Dimension</span>
                <span className="text-[var(--sand)] font-medium">{product.caseSizeMm} mm</span>
              </div>
            )}
            {product.strap && (
              <div>
                <span className="text-[10px] uppercase text-[var(--muted)] block">Strap & Clasp</span>
                <span className="text-[var(--sand)] font-medium">{product.strap}</span>
              </div>
            )}
            {product.waterResistance && (
              <div>
                <span className="text-[10px] uppercase text-[var(--muted)] block">Water Resistance</span>
                <span className="text-[var(--sand)] font-medium">{product.waterResistance}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description Narrative */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--gold)] font-medium">
            About This Watch
          </h3>
          <p className="text-sm text-[var(--muted)]/80 leading-relaxed font-light">
            {product.description}
          </p>
        </div>

        {/* Purchase Actions (Quantity + Add to Cart) */}
        {!isOutOfStock ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[var(--gold)]/30 rounded-lg bg-[var(--charcoal)] overflow-hidden">
                <button
                  onClick={handleDecreaseQty}
                  disabled={quantity <= 1}
                  className="p-3 text-[var(--sand)] hover:bg-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-semibold text-[var(--ivory)]">{quantity}</span>
                <button
                  onClick={handleIncreaseQty}
                  disabled={quantity >= maxAvailable}
                  className="p-3 text-[var(--sand)] hover:bg-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 inline-flex items-center justify-center gap-3 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] font-semibold py-3.5 px-6 rounded-lg text-xs uppercase tracking-[0.2em] transition-all duration-200 shadow-lg hover:shadow-[var(--gold)]/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>

            <a
              href={`https://wa.me/${BRAND.whatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 border border-[var(--gold)]/30 hover:border-[var(--gold)] text-[var(--gold)] hover:text-[var(--ink)] py-3 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat With Us on WhatsApp</span>
            </a>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-xs text-[var(--danger)] text-center">
              This watch is currently sold out. Chat with us on WhatsApp to check when more units arrive.
            </div>
            <a
              href={`https://wa.me/${BRAND.whatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 bg-[var(--charcoal)] border border-[var(--gold)]/30 text-[var(--gold)] py-3 px-6 rounded-lg text-xs uppercase tracking-wider hover:bg-[var(--ink)] transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask About Next Restock</span>
            </a>
          </div>
        )}

        {/* Delivery & Trust Accordion */}
        <div className="border-t border-[var(--sand)] pt-6 space-y-4 text-xs text-[var(--muted)]">
          <div className="flex items-start gap-3">
            <Truck className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-[var(--ink)] font-medium">Fast Delivery:</strong> Delivery within 1–2 business days in Anambra; 3–5 business days nationwide. Free delivery on orders over {formatNaira(SHOP.freeShippingThresholdKobo)}.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-[var(--ink)] font-medium">Original Guarantee:</strong> 100% authentic watch with 12-month warranty included.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-[var(--ink)] font-medium">Payment Options:</strong> Bank transfer, online payment, or Pay on Delivery (in Anambra & Lagos).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
