import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Compass, Shield, Award, Sparkles } from 'lucide-react';
import { db } from '@/server/db';
import { products } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { BRAND } from '@/config/brand';
import { SHOP } from '@/config/shop';
import { formatNaira } from '@/lib/money';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  // Query active featured products directly from Neon
  let featuredWatches: (typeof products.$inferSelect)[] = [];
  try {
    featuredWatches = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.featured), desc(products.createdAt))
      .limit(4);
  } catch (error) {
    console.error('[homepage] Failed to load featured products:', error);
  }

  return (
    <div className="space-y-24 sm:space-y-32 pb-24">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center pt-8 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--gold)]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/25 text-[var(--gold)] text-[11px] uppercase tracking-[0.25em] font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Haute Horlogerie · Victoria Island</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light text-[var(--ivory)] tracking-tight leading-[1.08]">
                Crafted to keep time. <br />
                <span className="italic font-normal text-[var(--gold)]">
                  Chosen to be remembered.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--muted)] max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                {BRAND.description} Every timepiece is hand-regulated and certified for supreme resilience under tropical humidity and demanding precision.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  href="/shop"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] font-semibold px-8 py-4 rounded-lg text-xs uppercase tracking-[0.2em] transition-all duration-200 shadow-lg hover:shadow-[var(--gold)]/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#craftsmanship"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[var(--sand)]/20 hover:border-[var(--gold)]/50 text-[var(--sand)] hover:text-[var(--gold)] px-8 py-4 rounded-lg text-xs uppercase tracking-[0.2em] transition-colors"
                >
                  <span>Our Atelier</span>
                </a>
              </div>

              {/* Quick Trust badges */}
              <div className="pt-8 border-t border-[var(--sand)]/10 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <p className="font-serif text-2xl text-[var(--ivory)] font-light">100%</p>
                  <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mt-0.5">
                    Authentic
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-[var(--ivory)] font-light">12 Mo</p>
                  <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mt-0.5">
                    Warranty
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl text-[var(--ivory)] font-light">36 States</p>
                  <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider mt-0.5">
                    Insured Transit
                  </p>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-lg aspect-[4/3] sm:aspect-[16/10] lg:aspect-square rounded-2xl overflow-hidden border border-[var(--gold)]/20 shadow-2xl group">
                <Image
                  src="/images/hero-watch.jpg"
                  alt="Meridian Time Bespoke Tourbillon Watch"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent opacity-60" />

                {/* Bottom Overlay Pill */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[var(--charcoal)]/85 border border-[var(--gold)]/30 backdrop-blur-md flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold)] block">
                      Featured Masterpiece
                    </span>
                    <span className="font-serif text-lg text-[var(--ivory)] font-medium">
                      Meridian Sovereign Tourbillon
                    </span>
                  </div>
                  <Link
                    href="/shop"
                    className="p-2.5 rounded-lg bg-[var(--gold)]/20 hover:bg-[var(--gold)] text-[var(--gold)] hover:text-[var(--ink)] transition-colors"
                    aria-label="View Sovereign Tourbillon"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold)] font-medium">
            Horology Categories
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl text-[var(--ivory)] font-light tracking-tight">
            Curated For Every Occasion
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Explore our collections designed for boardroom elegance, oceanic adventure, and timeless daily rituals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SHOP.categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.id}`}
              className="group p-6 rounded-xl bg-[var(--charcoal)] border border-[var(--gold)]/15 hover:border-[var(--gold)]/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)] font-semibold">
                  Category
                </span>
                <h3 className="font-serif text-2xl text-[var(--ivory)] mt-2 group-hover:text-[var(--gold)] transition-colors font-medium">
                  {category.label}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
                  {category.description}
                </p>
              </div>

              <div className="pt-6 flex items-center justify-between text-xs text-[var(--sand)]/80 group-hover:text-[var(--gold)] transition-colors">
                <span className="uppercase tracking-widest text-[11px]">Discover</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Watches Grid */}
      {featuredWatches.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 border-b border-[var(--sand)]/10 pb-6">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold)] font-medium">
                The Showcase
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[var(--ivory)] font-light mt-1">
                Featured Timepieces
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--gold)] hover:text-[var(--ivory)] transition-colors"
            >
              <span>View All 8 Watches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredWatches.map((watch) => (
              <div
                key={watch.id}
                className="group bg-[var(--charcoal)] rounded-xl border border-[var(--gold)]/15 overflow-hidden flex flex-col justify-between hover:border-[var(--gold)]/40 transition-all duration-300"
              >
                <div className="relative aspect-square bg-[var(--ink)] overflow-hidden">
                  <Image
                    src={watch.imageUrl}
                    alt={watch.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 left-3 px-2 py-1 rounded bg-[var(--ink)]/80 backdrop-blur-sm border border-[var(--gold)]/20 text-[10px] uppercase tracking-wider text-[var(--gold)]">
                    {watch.category}
                  </div>
                  {watch.stock <= 3 && watch.stock > 0 && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded bg-[var(--warning)]/20 border border-[var(--warning)]/30 text-[10px] uppercase tracking-wider text-[var(--warning)]">
                      Only {watch.stock} Left
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest text-[var(--muted)]">
                      {watch.brand}
                    </span>
                    <h3 className="font-serif text-xl text-[var(--ivory)] font-normal group-hover:text-[var(--gold)] transition-colors mt-0.5 line-clamp-1">
                      {watch.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2 leading-relaxed">
                      {watch.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--sand)]/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] block">
                        Price
                      </span>
                      <span className="font-serif text-lg text-[var(--gold)] font-medium">
                        {formatNaira(watch.priceKobo)}
                      </span>
                    </div>

                    <Link
                      href={`/shop/${watch.slug}`}
                      className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-[var(--ink)] hover:bg-[var(--gold)] text-[var(--sand)] hover:text-[var(--ink)] text-xs uppercase tracking-wider font-medium border border-[var(--gold)]/30 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Atelier & Craftsmanship Feature */}
      <section id="craftsmanship" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--charcoal)] border border-[var(--gold)]/20 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Craftsmanship Image */}
          <div className="lg:col-span-6 relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[380px]">
            <Image
              src="/images/craftsmanship.jpg"
              alt="Master Watchmaker in Meridian Atelier"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--charcoal)] via-transparent to-transparent lg:hidden" />
          </div>

          {/* Editorial Text */}
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 space-y-6">
            <div className="inline-flex items-center gap-2 text-[var(--gold)] text-xs uppercase tracking-[0.25em]">
              <Compass className="w-3.5 h-3.5" />
              <span>The Atelier Standard</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[var(--ivory)] font-light leading-tight">
              Calibrated With Relentless Precision
            </h2>

            <p className="text-sm text-[var(--muted)] leading-relaxed font-light">
              Every Meridian timepiece represents more than three hundred individual micro-components moving in harmonious synchronicity. From sapphire crystal resistance to anti-magnetic hairsprings, each piece is individually inspected by master horologists before receiving our 12-month seal of authenticity.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[var(--gold)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-[var(--ivory)] font-medium">
                    Certified Chronometer
                  </h4>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    Tested across 5 positions for timing accuracy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-[var(--gold)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-[var(--ivory)] font-medium">
                    Concierge Delivery
                  </h4>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    Hand-delivered in Lagos or insured nationwide.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <a
                href={`https://wa.me/${BRAND.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Meridian Time, I would like to inquire about private viewings and bespoke timepieces.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[var(--gold)] hover:bg-[var(--gold-deep)] text-[var(--ink)] font-semibold px-6 py-3.5 rounded-lg text-xs uppercase tracking-[0.2em] transition-all"
              >
                <span>Inquire With Concierge</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
