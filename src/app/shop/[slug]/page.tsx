import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { ProductService } from '@/server/services';
import { BRAND } from '@/config/brand';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';
import { ProductCard } from '@/components/shop/ProductCard';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await ProductService.getProductBySlug(slug);

  if (!product) {
    return {
      title: `Timepiece Not Found — ${BRAND.name}`,
    };
  }

  return {
    title: `${product.name} by ${product.brand} — ${BRAND.name}`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} — ${BRAND.name}`,
      description: product.description.slice(0, 160),
      images: [{ url: product.imageUrl }],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await ProductService.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related watches from the same category
  const relatedProducts = await ProductService.getRelatedProducts(
    product.category,
    product.slug,
    4
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--gold)] transition-colors">
          Atelier
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/shop" className="hover:text-[var(--gold)] transition-colors">
          Collection
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[var(--gold)] truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Main Detail Presentation */}
      <ProductDetailClient product={product} />

      {/* Related Timepieces */}
      {relatedProducts.length > 0 && (
        <section className="pt-16 border-t border-[var(--sand)] space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[var(--gold)] font-medium">
                Related Calibers
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[var(--ink)] font-light mt-1">
                More From The {product.category} Collection
              </h2>
            </div>
            <Link
              href={`/shop?category=${product.category}`}
              className="text-xs uppercase tracking-wider text-[var(--gold)] hover:text-[var(--ink)] transition-colors"
            >
              View All {product.category} &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Back to Gallery Link */}
      <div className="pt-8 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Full Watch Collection</span>
        </Link>
      </div>
    </div>
  );
}
